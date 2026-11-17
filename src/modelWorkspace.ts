import { MODEL_ROOT, modelUrl } from './modelRepository';

interface LocalFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }>;
}

interface LocalDirectoryHandle {
  name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<LocalDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<LocalFileHandle>;
}

interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: () => Promise<LocalDirectoryHandle>;
}

let activeModelDirectory: LocalDirectoryHandle | null = null;

export function hasOpenEnterpriseModel(): boolean {
  return activeModelDirectory !== null;
}

export function getOpenEnterpriseModelName(): string {
  return activeModelDirectory?.name ?? '';
}

export async function selectEnterpriseModelFolder(): Promise<LocalDirectoryHandle> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  if (!picker) {
    throw new Error(
      'Opening and saving directly to an Enterprise Model folder requires a browser with File System Access support, such as Microsoft Edge or Google Chrome.',
    );
  }

  return picker.call(window);
}

export function activateEnterpriseModelFolder(directory: LocalDirectoryHandle): string {
  activeModelDirectory = directory;
  document.dispatchEvent(new CustomEvent('enterprise-modeler:model-folder-changed', {
    detail: { name: activeModelDirectory.name },
  }));
  return activeModelDirectory.name;
}

export async function openEnterpriseModelFolder(): Promise<string> {
  return activateEnterpriseModelFolder(await selectEnterpriseModelFolder());
}

export async function readModelText(path: string): Promise<string> {
  if (!activeModelDirectory) {
    const response = await fetch(modelUrl(path), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load ${modelUrl(path)}. HTTP ${response.status}.`);
    }
    return response.text();
  }

  const fileHandle = await resolveFile(path, false);
  const file = await fileHandle.getFile();
  return file.text();
}

export async function readModelJson<T>(path: string): Promise<T> {
  return JSON.parse(await readModelText(path)) as T;
}

export async function writeModelText(path: string, contents: string): Promise<boolean> {
  if (!activeModelDirectory) return false;

  const fileHandle = await resolveFile(path, true);
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
  return true;
}

export async function writeModelJson(path: string, value: unknown): Promise<boolean> {
  return writeModelText(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function resolveFile(path: string, create: boolean): Promise<LocalFileHandle> {
  if (!activeModelDirectory) throw new Error('No Enterprise Model folder is open.');

  let relativePath = path;
  if (MODEL_ROOT && relativePath.startsWith(`${MODEL_ROOT}/`)) relativePath = relativePath.slice(MODEL_ROOT.length);
  const parts = relativePath.replace(/^\/+/, '').split('/').filter(Boolean);
  if (parts.length === 0) throw new Error('A model file path is required.');

  let directory = activeModelDirectory;
  for (const part of parts.slice(0, -1)) {
    directory = await directory.getDirectoryHandle(part, { create });
  }

  return directory.getFileHandle(parts.at(-1) as string, { create });
}
