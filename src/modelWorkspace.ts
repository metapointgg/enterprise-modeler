import {
  activateAzureDevOpsRepository,
  deactivateAzureDevOpsRepository,
  getActiveAzureDevOpsRepository,
  readAzureDevOpsModelText,
  writeAzureDevOpsModelText,
} from './azureDevOpsRepository';
import {
  hasAzureDevOpsSession,
  normaliseAzureDevOpsConnection,
  type AzureDevOpsModelConnection,
} from './azureDevOpsAuth';
import { MODEL_ROOT, modelUrl } from './modelRepository';

export interface LocalFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }>;
}

export interface LocalDirectoryHandle {
  name: string;
  kind?: 'directory';
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<LocalDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<LocalFileHandle>;
  queryPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
}

interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: () => Promise<LocalDirectoryHandle>;
}

interface MemoryWorkspaceSnapshot {
  name: string;
  files: Array<[string, string]>;
}

export type EnterpriseModelWorkspaceMode = 'directory' | 'memory' | 'remote' | 'azure-devops' | null;

const WORKSPACE_DB_NAME = 'enterprise-modeler-workspace';
const WORKSPACE_DB_VERSION = 1;
const WORKSPACE_STORE = 'workspace';
const LAST_DIRECTORY_KEY = 'last-directory';
const LAST_MEMORY_KEY = 'last-memory';
const LAST_MODEL_NAME_KEY = 'enterprise-modeler.last-model-name';
const LAST_MODE_KEY = 'enterprise-modeler.last-workspace-mode';
const LAST_AZURE_DEVOPS_CONNECTION_KEY = 'enterprise-modeler.last-azure-devops-connection.v1';

let activeModelDirectory: LocalDirectoryHandle | null = null;
let activeMemoryFiles: Map<string, string> | null = null;
let activeModelName = '';
let activeMode: EnterpriseModelWorkspaceMode = null;

export function hasOpenEnterpriseModel(): boolean {
  return activeMode !== null;
}

export function getOpenEnterpriseModelName(): string {
  return activeModelName;
}

export function getEnterpriseModelWorkspaceMode(): EnterpriseModelWorkspaceMode {
  return activeMode;
}

export function supportsDirectModelFolderAccess(): boolean {
  return typeof (window as DirectoryPickerWindow).showDirectoryPicker === 'function';
}

export function getRememberedEnterpriseModelName(): string {
  return localStorage.getItem(LAST_MODEL_NAME_KEY) ?? '';
}

export function getRememberedAzureDevOpsConnection(): AzureDevOpsModelConnection | null {
  const raw = localStorage.getItem(LAST_AZURE_DEVOPS_CONNECTION_KEY);
  if (!raw) return null;
  try {
    return normaliseAzureDevOpsConnection(JSON.parse(raw) as Partial<AzureDevOpsModelConnection>);
  } catch {
    return null;
  }
}

export async function activateAzureDevOpsEnterpriseModel(
  connectionInput: AzureDevOpsModelConnection,
): Promise<string> {
  const state = await activateAzureDevOpsRepository(connectionInput);
  activeModelDirectory = null;
  activeMemoryFiles = null;
  activeModelName = state.name;
  activeMode = 'azure-devops';
  rememberModelName(activeModelName);
  rememberWorkspaceMode('azure-devops');
  localStorage.setItem(
    LAST_AZURE_DEVOPS_CONNECTION_KEY,
    JSON.stringify(state.connection),
  );
  dispatchWorkspaceChanged();
  return activeModelName;
}

export function activateRemoteEnterpriseModel(name = 'Shared Enterprise Model'): void {
  deactivateAzureDevOpsRepository();
  activeModelDirectory = null;
  activeMemoryFiles = null;
  activeModelName = name;
  activeMode = 'remote';
  rememberModelName(name);
  rememberWorkspaceMode('remote');
}

export async function selectEnterpriseModelFolder(): Promise<LocalDirectoryHandle> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  if (!picker) {
    throw new Error(
      'Direct folder access is not available in this browser. Choose the folder-import option instead.',
    );
  }

  return picker.call(window);
}

export function activateEnterpriseModelFolder(directory: LocalDirectoryHandle): string {
  deactivateAzureDevOpsRepository();
  activeModelDirectory = directory;
  activeMemoryFiles = null;
  activeModelName = directory.name;
  activeMode = 'directory';
  rememberModelName(activeModelName);
  rememberWorkspaceMode('directory');
  void rememberDirectory(directory);
  dispatchWorkspaceChanged();
  return activeModelName;
}

export async function openEnterpriseModelFolder(): Promise<string> {
  return activateEnterpriseModelFolder(await selectEnterpriseModelFolder());
}

export async function restoreLastEnterpriseModel(): Promise<boolean> {
  const lastMode = localStorage.getItem(LAST_MODE_KEY) as EnterpriseModelWorkspaceMode;

  if (lastMode === 'azure-devops') {
    const connection = getRememberedAzureDevOpsConnection();
    if (!connection || !hasAzureDevOpsSession()) return false;
    try {
      await activateAzureDevOpsEnterpriseModel(connection);
      return true;
    } catch (error) {
      console.warn('Unable to restore the previous Azure DevOps Enterprise Model.', error);
      return false;
    }
  }

  if (lastMode === 'directory' && supportsDirectModelFolderAccess()) {
    const directory = await readWorkspaceValue<LocalDirectoryHandle>(LAST_DIRECTORY_KEY);
    if (directory) {
      try {
        const permission = directory.queryPermission
          ? await directory.queryPermission({ mode: 'readwrite' })
          : 'granted';
        if (permission === 'granted') {
          activateEnterpriseModelFolder(directory);
          return true;
        }
        return false;
      } catch (error) {
        console.warn('Unable to restore the previous Enterprise Model folder.', error);
        return false;
      }
    }
  }

  if (lastMode === 'memory') {
    const snapshot = await readWorkspaceValue<MemoryWorkspaceSnapshot>(LAST_MEMORY_KEY);
    if (snapshot?.files?.length) {
      activateMemoryWorkspace(snapshot.name, new Map(snapshot.files), false);
      return true;
    }
    return false;
  }

  if (supportsDirectModelFolderAccess()) {
    const directory = await readWorkspaceValue<LocalDirectoryHandle>(LAST_DIRECTORY_KEY);
    if (directory) {
      try {
        const permission = directory.queryPermission
          ? await directory.queryPermission({ mode: 'readwrite' })
          : 'granted';
        if (permission === 'granted') {
          activateEnterpriseModelFolder(directory);
          return true;
        }
      } catch (error) {
        console.warn('Unable to restore a remembered Enterprise Model folder.', error);
      }
    }
  }

  const snapshot = await readWorkspaceValue<MemoryWorkspaceSnapshot>(LAST_MEMORY_KEY);
  if (snapshot?.files?.length) {
    activateMemoryWorkspace(snapshot.name, new Map(snapshot.files), false);
    return true;
  }

  return false;
}

export async function reopenRememberedEnterpriseModel(): Promise<boolean> {
  if (!supportsDirectModelFolderAccess()) return false;
  const directory = await readWorkspaceValue<LocalDirectoryHandle>(LAST_DIRECTORY_KEY);
  if (!directory) return false;

  try {
    const permission = directory.requestPermission
      ? await directory.requestPermission({ mode: 'readwrite' })
      : 'granted';
    if (permission !== 'granted') return false;
    activateEnterpriseModelFolder(directory);
    return true;
  } catch (error) {
    console.warn('Unable to reopen the previous Enterprise Model folder.', error);
    return false;
  }
}

export async function chooseEnterpriseModelFiles(): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.style.display = 'none';

    input.addEventListener('change', () => {
      const files = Array.from(input.files ?? []);
      input.remove();
      if (files.length === 0) {
        reject(new Error('No Enterprise Model folder was selected.'));
        return;
      }
      resolve(files);
    }, { once: true });

    document.body.appendChild(input);
    input.click();
  });
}

export async function activateEnterpriseModelFiles(files: File[]): Promise<string> {
  if (files.length === 0) throw new Error('No Enterprise Model files were supplied.');

  const relativePaths = files.map((file) => file.webkitRelativePath || file.name);
  const firstParts = relativePaths[0].split('/').filter(Boolean);
  const rootName = firstParts.length > 1 ? firstParts[0] : 'Enterprise Model';
  const memoryFiles = new Map<string, string>();

  await Promise.all(files.map(async (file, index) => {
    const relative = normaliseImportedPath(relativePaths[index], rootName);
    memoryFiles.set(relative, await file.text());
  }));

  validateModelFiles(memoryFiles);
  activateMemoryWorkspace(rootName, memoryFiles, true);
  return rootName;
}

export async function readModelText(path: string): Promise<string> {
  const relativePath = normaliseModelPath(path);

  if (activeMode === 'directory' && activeModelDirectory) {
    const fileHandle = await resolveDirectoryFile(activeModelDirectory, relativePath, false);
    const file = await fileHandle.getFile();
    return file.text();
  }

  if (activeMode === 'memory' && activeMemoryFiles) {
    const value = activeMemoryFiles.get(relativePath);
    if (value === undefined) throw new Error(`Enterprise Model file is missing: ${relativePath}`);
    return value;
  }

  if (activeMode === 'azure-devops') {
    return readAzureDevOpsModelText(relativePath);
  }

  if (activeMode === 'remote') {
    const response = await fetch(modelUrl(`/${relativePath}`), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load Enterprise Model file ${relativePath}. HTTP ${response.status}.`);
    }
    return response.text();
  }

  throw new Error('No Enterprise Model is open.');
}

export async function readModelJson<T>(path: string): Promise<T> {
  return JSON.parse(await readModelText(path)) as T;
}

export async function writeModelText(path: string, contents: string): Promise<boolean> {
  const relativePath = normaliseModelPath(path);

  if (activeMode === 'directory' && activeModelDirectory) {
    await writeDirectoryText(activeModelDirectory, relativePath, contents);
    return true;
  }

  if (activeMode === 'memory' && activeMemoryFiles) {
    activeMemoryFiles.set(relativePath, contents);
    await persistMemoryWorkspace();
    return true;
  }

  if (activeMode === 'azure-devops') {
    return writeAzureDevOpsModelText(relativePath, contents);
  }

  // Remote repository writes are handled by repositoryLocalSync/repositoryTransport.
  return false;
}

export async function writeModelJson(path: string, value: unknown): Promise<boolean> {
  try {
    return await writeModelText(path, `${JSON.stringify(value, null, 2)}\n`);
  } catch (error) {
    console.error(`Unable to save Enterprise Model JSON ${normaliseModelPath(path)}.`, error);
    return false;
  }
}

export async function writeDirectoryText(
  directory: LocalDirectoryHandle,
  path: string,
  contents: string,
): Promise<void> {
  const fileHandle = await resolveDirectoryFile(directory, normaliseModelPath(path), true);
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

export async function writeDirectoryJson(
  directory: LocalDirectoryHandle,
  path: string,
  value: unknown,
): Promise<void> {
  await writeDirectoryText(directory, path, `${JSON.stringify(value, null, 2)}\n`);
}

function activateMemoryWorkspace(name: string, files: Map<string, string>, persist: boolean): void {
  deactivateAzureDevOpsRepository();
  activeModelDirectory = null;
  activeMemoryFiles = files;
  activeModelName = name;
  activeMode = 'memory';
  rememberModelName(name);
  rememberWorkspaceMode('memory');
  if (persist) void persistMemoryWorkspace();
  dispatchWorkspaceChanged();
}

async function persistMemoryWorkspace(): Promise<void> {
  if (!activeMemoryFiles || activeMode !== 'memory') return;
  const snapshot: MemoryWorkspaceSnapshot = {
    name: activeModelName,
    files: [...activeMemoryFiles.entries()],
  };
  await writeWorkspaceValue(LAST_MEMORY_KEY, snapshot);
}

async function rememberDirectory(directory: LocalDirectoryHandle): Promise<void> {
  try {
    await writeWorkspaceValue(LAST_DIRECTORY_KEY, directory);
  } catch (error) {
    console.warn('Unable to remember the Enterprise Model folder for the next session.', error);
  }
}

function rememberModelName(name: string): void {
  if (name) localStorage.setItem(LAST_MODEL_NAME_KEY, name);
}

function rememberWorkspaceMode(mode: Exclude<EnterpriseModelWorkspaceMode, null>): void {
  localStorage.setItem(LAST_MODE_KEY, mode);
}

function dispatchWorkspaceChanged(): void {
  document.dispatchEvent(new CustomEvent('enterprise-modeler:model-folder-changed', {
    detail: {
      name: activeModelName,
      mode: activeMode,
      azureDevOps: activeMode === 'azure-devops'
        ? getActiveAzureDevOpsRepository()?.connection ?? null
        : null,
    },
  }));
}

function validateModelFiles(files: Map<string, string>): void {
  const required = [
    'processes/process-catalog.json',
    'processes/process-layers.json',
    'architecture/integrations.json',
    'organisation/org-chart.json',
  ];
  const missing = required.filter((path) => !files.has(path));
  if (missing.length > 0) {
    throw new Error(`The selected folder is not an Enterprise Model. Missing: ${missing.join(', ')}`);
  }
}

function normaliseImportedPath(path: string, rootName: string): string {
  const normalised = path.replaceAll('\\', '/').replace(/^\/+/, '');
  if (normalised.startsWith(`${rootName}/`)) return normalised.slice(rootName.length + 1);
  return normalised;
}

function normaliseModelPath(path: string): string {
  let relativePath = path.trim();
  if (MODEL_ROOT && relativePath.startsWith(`${MODEL_ROOT}/`)) {
    relativePath = relativePath.slice(MODEL_ROOT.length);
  }
  return relativePath.replaceAll('\\', '/').replace(/^\/+/, '');
}

async function resolveDirectoryFile(
  root: LocalDirectoryHandle,
  path: string,
  create: boolean,
): Promise<LocalFileHandle> {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) throw new Error('A model file path is required.');

  let directory = root;
  for (const part of parts.slice(0, -1)) {
    directory = await directory.getDirectoryHandle(part, { create });
  }

  return directory.getFileHandle(parts.at(-1) as string, { create });
}

function openWorkspaceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WORKSPACE_DB_NAME, WORKSPACE_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(WORKSPACE_STORE)) {
        database.createObjectStore(WORKSPACE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open workspace storage.'));
  });
}

async function readWorkspaceValue<T>(key: string): Promise<T | null> {
  if (!('indexedDB' in window)) return null;
  const database = await openWorkspaceDatabase();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const transaction = database.transaction(WORKSPACE_STORE, 'readonly');
      const request = transaction.objectStore(WORKSPACE_STORE).get(key);
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('Unable to read workspace storage.'));
    });
  } finally {
    database.close();
  }
}

async function writeWorkspaceValue(key: string, value: unknown): Promise<void> {
  if (!('indexedDB' in window)) return;
  const database = await openWorkspaceDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(WORKSPACE_STORE, 'readwrite');
      transaction.objectStore(WORKSPACE_STORE).put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to write workspace storage.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Workspace storage write was aborted.'));
    });
  } finally {
    database.close();
  }
}
