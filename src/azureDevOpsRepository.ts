import {
  getAzureDevOpsAccessToken,
  normaliseAzureDevOpsConnection,
  type AzureDevOpsModelConnection,
} from './azureDevOpsAuth';

interface AzureDevOpsRef {
  name?: string;
  objectId?: string;
}

interface AzureDevOpsRefList {
  value?: AzureDevOpsRef[];
}

interface AzureDevOpsGitItem {
  path?: string;
  isFolder?: boolean;
  gitObjectType?: string;
}

interface AzureDevOpsItemList {
  value?: AzureDevOpsGitItem[];
}

interface AzureDevOpsPushResponse {
  refUpdates?: Array<{
    name?: string;
    oldObjectId?: string;
    newObjectId?: string;
  }>;
  commits?: Array<{
    commitId?: string;
  }>;
}

interface PendingWriteWaiter {
  resolve(value: boolean): void;
  reject(error: unknown): void;
}

export interface AzureDevOpsRepositoryState {
  connection: AzureDevOpsModelConnection;
  name: string;
  branchCommitId: string;
  knownPaths: Set<string>;
}

export class AzureDevOpsRepositoryConflictError extends Error {
  constructor(message = 'The Azure DevOps branch changed since this Enterprise Model was opened.') {
    super(message);
    this.name = 'AzureDevOpsRepositoryConflictError';
  }
}

const API_VERSION = '7.1';
const REQUIRED_MODEL_PATHS = [
  'processes/process-catalog.json',
  'processes/process-layers.json',
  'architecture/integrations.json',
  'organisation/org-chart.json',
];
const WRITE_DELAY_MS = 900;

let activeState: AzureDevOpsRepositoryState | null = null;
let pendingWrites = new Map<string, string>();
let pendingWaiters: PendingWriteWaiter[] = [];
let flushTimer: number | undefined;
let flushInFlight: Promise<void> | null = null;

export async function activateAzureDevOpsRepository(
  connectionInput: AzureDevOpsModelConnection,
): Promise<AzureDevOpsRepositoryState> {
  const connection = normaliseAzureDevOpsConnection(connectionInput);
  const branchCommitId = await getBranchCommitId(connection);
  const knownPaths = await listRepositoryFiles(connection);

  const missing = REQUIRED_MODEL_PATHS.filter((path) => !knownPaths.has(path));
  if (missing.length > 0) {
    throw new Error(
      `The selected Azure DevOps repository path is not an Enterprise Model. Missing: ${missing.join(', ')}`,
    );
  }

  activeState = {
    connection,
    name: connection.repository + (connection.modelPath ? `/${connection.modelPath}` : ''),
    branchCommitId,
    knownPaths,
  };

  pendingWrites = new Map();
  pendingWaiters = [];
  if (flushTimer !== undefined) {
    window.clearTimeout(flushTimer);
    flushTimer = undefined;
  }

  return activeState;
}

export function getActiveAzureDevOpsRepository(): AzureDevOpsRepositoryState | null {
  return activeState;
}

export function deactivateAzureDevOpsRepository(): void {
  activeState = null;
  pendingWrites = new Map();
  pendingWaiters = [];
  if (flushTimer !== undefined) {
    window.clearTimeout(flushTimer);
    flushTimer = undefined;
  }
}

export async function readAzureDevOpsModelText(path: string): Promise<string> {
  const state = requireActiveState();
  const relativePath = normaliseModelPath(path);
  const url = createItemsUrl(state.connection);
  url.searchParams.set('path', toRepositoryPath(state.connection, relativePath));
  url.searchParams.set('download', 'true');
  url.searchParams.set('versionDescriptor.version', state.connection.branch);
  url.searchParams.set('versionDescriptor.versionType', 'branch');
  url.searchParams.set('api-version', API_VERSION);

  const response = await azureFetch(url, { headers: { Accept: 'text/plain, application/octet-stream' } });
  if (response.status === 404) {
    throw new Error(`Azure DevOps Enterprise Model file is missing: ${relativePath}`);
  }
  if (!response.ok) {
    throw new Error(
      `Unable to load Azure DevOps Enterprise Model file ${relativePath}. HTTP ${response.status}.`,
    );
  }
  return response.text();
}

export async function writeAzureDevOpsModelText(path: string, contents: string): Promise<boolean> {
  const relativePath = normaliseModelPath(path);
  requireActiveState();
  pendingWrites.set(relativePath, contents);

  const promise = new Promise<boolean>((resolve, reject) => {
    pendingWaiters.push({ resolve, reject });
  });

  scheduleFlush();
  return promise;
}

export async function flushAzureDevOpsWrites(): Promise<void> {
  if (flushInFlight) return flushInFlight;
  if (pendingWrites.size === 0) return;

  flushInFlight = performFlush();
  try {
    await flushInFlight;
  } finally {
    flushInFlight = null;
  }
}

export async function verifyAzureDevOpsConnection(
  connectionInput: AzureDevOpsModelConnection,
): Promise<{ branchCommitId: string; paths: Set<string> }> {
  const connection = normaliseAzureDevOpsConnection(connectionInput);
  const [branchCommitId, paths] = await Promise.all([
    getBranchCommitId(connection),
    listRepositoryFiles(connection),
  ]);
  return { branchCommitId, paths };
}

async function performFlush(): Promise<void> {
  const state = requireActiveState();
  const writes = pendingWrites;
  const waiters = pendingWaiters;
  pendingWrites = new Map();
  pendingWaiters = [];

  if (flushTimer !== undefined) {
    window.clearTimeout(flushTimer);
    flushTimer = undefined;
  }

  if (writes.size === 0) {
    waiters.forEach((waiter) => waiter.resolve(true));
    return;
  }

  dispatchSync('syncing', 'Saving Enterprise Model changes to Azure DevOps…');

  try {
    const latestCommit = await getBranchCommitId(state.connection);
    if (latestCommit !== state.branchCommitId) {
      throw new AzureDevOpsRepositoryConflictError(
        `Azure DevOps branch ${state.connection.branch} changed from ${state.branchCommitId.slice(0, 8)} to ${latestCommit.slice(0, 8)}. Reload the Enterprise Model before saving.`,
      );
    }

    const changes = [...writes.entries()].map(([path, contents]) => ({
      changeType: state.knownPaths.has(path) ? 'edit' : 'add',
      item: { path: toRepositoryPath(state.connection, path) },
      newContent: {
        content: contents,
        contentType: 'rawtext',
      },
    }));

    const pushUrl = createRepositoryUrl(state.connection, 'pushes');
    pushUrl.searchParams.set('api-version', API_VERSION);

    const response = await azureFetch(pushUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refUpdates: [
          {
            name: `refs/heads/${state.connection.branch}`,
            oldObjectId: state.branchCommitId,
          },
        ],
        commits: [
          {
            comment: createCommitMessage(writes),
            changes,
          },
        ],
      }),
    });

    const payload = await safeJson<AzureDevOpsPushResponse>(response);
    if (!response.ok) {
      if (response.status === 409 || response.status === 412 || response.status === 400) {
        const message = extractAzureErrorMessage(payload)
          || `Azure DevOps rejected the push with HTTP ${response.status}.`;
        if (/stale|oldobjectid|conflict|changed|race/i.test(message)) {
          throw new AzureDevOpsRepositoryConflictError(message);
        }
      }
      throw new Error(
        extractAzureErrorMessage(payload)
          || `Azure DevOps push failed with HTTP ${response.status}.`,
      );
    }

    const newCommitId = payload.refUpdates?.find(
      (update) => update.name === `refs/heads/${state.connection.branch}`,
    )?.newObjectId
      || payload.commits?.[0]?.commitId
      || await getBranchCommitId(state.connection);

    state.branchCommitId = newCommitId;
    writes.forEach((_contents, path) => state.knownPaths.add(path));

    dispatchSync(
      'synced',
      `Saved to Azure DevOps · ${state.connection.repository} · ${state.connection.branch} · ${newCommitId.slice(0, 8)}`,
    );
    waiters.forEach((waiter) => waiter.resolve(true));
  } catch (error) {
    if (error instanceof AzureDevOpsRepositoryConflictError) {
      dispatchSync('conflict', error.message);
    } else {
      dispatchSync('error', error instanceof Error ? error.message : String(error));
    }

    writes.forEach((contents, path) => {
      if (!pendingWrites.has(path)) pendingWrites.set(path, contents);
    });
    waiters.forEach((waiter) => waiter.reject(error));
    throw error;
  }
}

function scheduleFlush(): void {
  if (flushTimer !== undefined) window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(() => {
    flushTimer = undefined;
    void flushAzureDevOpsWrites().catch((error) => {
      console.error('Unable to save Enterprise Model changes to Azure DevOps.', error);
    });
  }, WRITE_DELAY_MS);
}

async function getBranchCommitId(connection: AzureDevOpsModelConnection): Promise<string> {
  const url = createRepositoryUrl(connection, 'refs');
  url.searchParams.set('filter', `heads/${connection.branch}`);
  url.searchParams.set('api-version', API_VERSION);

  const response = await azureFetch(url);
  if (!response.ok) {
    throw new Error(
      `Unable to inspect Azure DevOps branch ${connection.branch}. HTTP ${response.status}.`,
    );
  }

  const payload = await response.json() as AzureDevOpsRefList;
  const ref = payload.value?.find((candidate) => candidate.name === `refs/heads/${connection.branch}`)
    ?? payload.value?.[0];
  if (!ref?.objectId) {
    throw new Error(`Azure DevOps branch was not found: ${connection.branch}`);
  }
  return ref.objectId;
}

async function listRepositoryFiles(connection: AzureDevOpsModelConnection): Promise<Set<string>> {
  const url = createItemsUrl(connection);
  url.searchParams.set('scopePath', repositoryRootPath(connection));
  url.searchParams.set('recursionLevel', 'Full');
  url.searchParams.set('versionDescriptor.version', connection.branch);
  url.searchParams.set('versionDescriptor.versionType', 'branch');
  url.searchParams.set('api-version', API_VERSION);

  const response = await azureFetch(url);
  if (!response.ok) {
    throw new Error(
      `Unable to list Azure DevOps Enterprise Model files. HTTP ${response.status}.`,
    );
  }

  const payload = await response.json() as AzureDevOpsItemList;
  const prefix = repositoryRootPath(connection).replace(/\/$/, '');
  const paths = new Set<string>();

  (payload.value ?? []).forEach((item) => {
    if (item.isFolder || item.gitObjectType === 'tree' || !item.path) return;
    const absolute = item.path.replaceAll('\\', '/');
    const relative = prefix && prefix !== '/'
      ? absolute.replace(new RegExp(`^${escapeRegExp(prefix)}/?`), '')
      : absolute.replace(/^\/+/, '');
    if (relative) paths.add(relative.replace(/^\/+/, ''));
  });

  return paths;
}

async function azureFetch(url: URL, init?: RequestInit): Promise<Response> {
  const token = await getAzureDevOpsAccessToken();
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);

  try {
    return await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    throw new Error(
      `Unable to reach Azure DevOps. ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function createItemsUrl(connection: AzureDevOpsModelConnection): URL {
  return createRepositoryUrl(connection, 'items');
}

function createRepositoryUrl(
  connection: AzureDevOpsModelConnection,
  resource: 'items' | 'refs' | 'pushes',
): URL {
  return new URL(
    `https://dev.azure.com/${encodeURIComponent(connection.organization)}/${encodeURIComponent(connection.project)}/_apis/git/repositories/${encodeURIComponent(connection.repository)}/${resource}`,
  );
}

function repositoryRootPath(connection: AzureDevOpsModelConnection): string {
  return connection.modelPath ? `/${connection.modelPath}` : '/';
}

function toRepositoryPath(connection: AzureDevOpsModelConnection, relativePath: string): string {
  const path = normaliseModelPath(relativePath);
  return connection.modelPath ? `/${connection.modelPath}/${path}` : `/${path}`;
}

function normaliseModelPath(path: string): string {
  const value = path.trim().replaceAll('\\', '/').replace(/^\/+/, '');
  if (!value || value.includes('../') || value === '..') {
    throw new Error(`Invalid Enterprise Model path: ${path}`);
  }
  return value;
}

function createCommitMessage(writes: Map<string, string>): string {
  if (writes.size === 1) {
    const path = writes.keys().next().value as string;
    return `Update Enterprise Model: ${path}`;
  }
  return `Update Enterprise Model (${writes.size} files)`;
}

function requireActiveState(): AzureDevOpsRepositoryState {
  if (!activeState) throw new Error('No Azure DevOps Enterprise Model repository is active.');
  return activeState;
}

function dispatchSync(
  state: 'syncing' | 'synced' | 'conflict' | 'error',
  message: string,
): void {
  document.dispatchEvent(new CustomEvent('enterprise-modeler:repository-sync-status', {
    detail: {
      state,
      key: 'azure-devops',
      message,
      revision: activeState?.branchCommitId ?? '',
    },
  }));
}

async function safeJson<T>(response: Response): Promise<T & Record<string, unknown>> {
  try {
    return await response.json() as T & Record<string, unknown>;
  } catch {
    return {} as T & Record<string, unknown>;
  }
}

function extractAzureErrorMessage(payload: Record<string, unknown>): string {
  const message = payload.message;
  if (typeof message === 'string' && message.trim()) return message.trim();

  const innerException = payload.innerException;
  if (innerException && typeof innerException === 'object' && 'message' in innerException) {
    const value = (innerException as { message?: unknown }).message;
    if (typeof value === 'string') return value;
  }
  return '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
}
