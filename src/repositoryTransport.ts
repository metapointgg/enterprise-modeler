import { getAccessToken, getAuthContext } from './auth';
import { loadRuntimeConfig } from './runtimeConfig';

const REPOSITORY_ROUTE_PREFIX = '/repository/';
const PROTECTED_PREFIXES = [
  '/processes/',
  '/metadata/',
  '/organisation/',
  '/architecture/',
  '/governance/',
];

const revisionByKey = new Map<string, string | null>();
const writeQueueByKey = new Map<string, Promise<RepositoryWriteResult | null>>();
const blockedWriteKeys = new Set<string>();
const nativeFetch = window.fetch.bind(window);
let installed = false;

export interface RepositoryWriteResult {
  key: string;
  revision: string;
  versionId: string;
  updatedBy: string;
}

export type RepositorySyncState = 'syncing' | 'synced' | 'conflict' | 'error' | 'readonly';

export interface RepositorySyncEventDetail {
  state: RepositorySyncState;
  key: string;
  message: string;
  revision?: string;
}

export class RepositoryConflictError extends Error {
  readonly key: string;
  readonly currentRevision: string;

  constructor(key: string, currentRevision: string) {
    super(`Repository resource ${key} was changed by another user.`);
    this.name = 'RepositoryConflictError';
    this.key = key;
    this.currentRevision = currentRevision;
  }
}

export async function installRepositoryTransport(): Promise<void> {
  if (installed) return;
  const config = await loadRuntimeConfig();
  if (!config.auth.enabled) return;
  if (!config.api.baseUrl) throw new Error('Authenticated repository mode requires an API base URL.');

  installed = true;
  window.fetch = repositoryAwareFetch;
}

export async function isRemoteRepositoryEnabled(): Promise<boolean> {
  const config = await loadRuntimeConfig();
  return config.auth.enabled && Boolean(config.api.baseUrl);
}

export function isRepositoryWriteAllowed(): boolean {
  const context = getAuthContext();
  if (!context?.enabled || !context.user) return false;
  return context.user.groups.includes('Modeler') || context.user.groups.includes('Administrator');
}

export function repositoryKeyFromPublicPath(value: string): string {
  const url = new URL(value, window.location.origin);
  return url.pathname.replace(/^\/+/, '');
}

export async function writeRepositoryText(
  key: string,
  content: string,
  contentType = inferContentType(key),
): Promise<RepositoryWriteResult | null> {
  const normalisedKey = normaliseRepositoryKey(key);
  if (!await isRemoteRepositoryEnabled()) return null;

  if (!isRepositoryWriteAllowed()) {
    dispatchRepositorySync({
      state: 'readonly',
      key: normalisedKey,
      message: 'Repository is read-only for this user.',
    });
    return null;
  }

  if (blockedWriteKeys.has(normalisedKey)) {
    const currentRevision = revisionByKey.get(normalisedKey) ?? '';
    dispatchRepositorySync({
      state: 'conflict',
      key: normalisedKey,
      message: 'Repository conflict — reload before saving again.',
      revision: currentRevision,
    });
    throw new RepositoryConflictError(normalisedKey, currentRevision);
  }

  const previous = writeQueueByKey.get(normalisedKey) ?? Promise.resolve(null);
  const next = previous
    .catch(() => null)
    .then(() => performRepositoryWrite(normalisedKey, content, contentType));

  writeQueueByKey.set(normalisedKey, next);
  const cleanup = (): void => {
    if (writeQueueByKey.get(normalisedKey) === next) writeQueueByKey.delete(normalisedKey);
  };
  void next.then(cleanup, cleanup);
  return next;
}

async function repositoryAwareFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : null;
  const source = request
    ? request.url
    : (input instanceof URL ? input.toString() : String(input));
  const sourceUrl = new URL(source, window.location.href);
  const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();

  if (
    sourceUrl.origin !== window.location.origin
    || (method !== 'GET' && method !== 'HEAD')
    || !isProtectedRepositoryPath(sourceUrl.pathname)
  ) {
    return nativeFetch(input, init);
  }

  const config = await loadRuntimeConfig();
  if (!config.auth.enabled) return nativeFetch(input, init);

  const key = repositoryKeyFromPublicPath(sourceUrl.pathname);
  const response = await authorisedRepositoryFetch(key, method, undefined, undefined, init?.signal ?? request?.signal);
  cacheRevision(key, response);
  return response;
}

async function performRepositoryWrite(
  key: string,
  content: string,
  contentType: string,
): Promise<RepositoryWriteResult> {
  dispatchRepositorySync({ state: 'syncing', key, message: 'Saving repository changes…' });

  if (!revisionByKey.has(key)) await fetchRepositoryRevision(key);
  const revision = revisionByKey.get(key) ?? null;
  const headers = new Headers({ 'Content-Type': contentType });

  if (revision) headers.set('If-Match', revision);
  else headers.set('If-None-Match', '*');

  const response = await authorisedRepositoryFetch(key, 'PUT', headers, content);
  if (response.status === 409 || response.status === 412) {
    const payload = await safeJson(response);
    const currentRevision = String(payload.currentRevision ?? response.headers.get('etag') ?? '');
    if (currentRevision) revisionByKey.set(key, currentRevision);
    blockedWriteKeys.add(key);
    const error = new RepositoryConflictError(key, currentRevision);
    dispatchRepositorySync({
      state: 'conflict',
      key,
      message: 'Repository conflict — reload before saving again.',
      revision: currentRevision,
    });
    throw error;
  }

  if (!response.ok) {
    const payload = await safeJson(response);
    const message = String(payload.message ?? `Repository write failed with HTTP ${response.status}.`);
    dispatchRepositorySync({ state: 'error', key, message });
    throw new Error(message);
  }

  const payload = await safeJson(response) as Partial<RepositoryWriteResult>;
  const newRevision = response.headers.get('etag') ?? payload.revision ?? '';
  revisionByKey.set(key, newRevision || null);
  blockedWriteKeys.delete(key);

  const result: RepositoryWriteResult = {
    key,
    revision: newRevision,
    versionId: payload.versionId ?? '',
    updatedBy: payload.updatedBy ?? '',
  };

  dispatchRepositorySync({
    state: 'synced',
    key,
    message: 'Repository synced',
    revision: newRevision,
  });
  return result;
}

async function fetchRepositoryRevision(key: string): Promise<string | null> {
  const response = await authorisedRepositoryFetch(key, 'HEAD');
  if (response.status === 404) {
    revisionByKey.set(key, null);
    return null;
  }
  if (!response.ok) throw new Error(`Unable to inspect repository revision for ${key}. HTTP ${response.status}.`);

  const revision = response.headers.get('etag');
  revisionByKey.set(key, revision);
  return revision;
}

async function authorisedRepositoryFetch(
  key: string,
  method: 'GET' | 'HEAD' | 'PUT',
  headers?: Headers,
  body?: string,
  signal?: AbortSignal | null,
): Promise<Response> {
  const config = await loadRuntimeConfig();
  if (!config.api.baseUrl) throw new Error('Repository API base URL is not configured.');

  const token = await getAccessToken();
  if (!token) throw new Error('No Cognito access token is available for the repository request.');

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Authorization', `Bearer ${token}`);

  const url = `${config.api.baseUrl}${REPOSITORY_ROUTE_PREFIX}${encodeRepositoryKey(key)}`;
  return nativeFetch(url, {
    method,
    headers: requestHeaders,
    body: method === 'PUT' ? body : undefined,
    cache: 'no-store',
    signal: signal ?? undefined,
  });
}

function cacheRevision(key: string, response: Response): void {
  if (!response.ok) return;
  const normalisedKey = normaliseRepositoryKey(key);
  const revision = response.headers.get('etag');
  if (revision) revisionByKey.set(normalisedKey, revision);
  blockedWriteKeys.delete(normalisedKey);
}

function normaliseRepositoryKey(value: string): string {
  const key = value.replace(/^\/+/, '').replace(/\\/g, '/');
  if (!key || key.includes('..') || key.startsWith('/')) throw new Error(`Invalid repository key: ${value}`);
  if (!PROTECTED_PREFIXES.some((prefix) => `/${key}`.startsWith(prefix))) {
    throw new Error(`Repository key is outside the protected operating-model paths: ${value}`);
  }
  return key;
}

function encodeRepositoryKey(key: string): string {
  return normaliseRepositoryKey(key)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function isProtectedRepositoryPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function inferContentType(key: string): string {
  if (key.toLowerCase().endsWith('.json')) return 'application/json;charset=utf-8';
  if (key.toLowerCase().endsWith('.bpmn') || key.toLowerCase().endsWith('.xml')) {
    return 'application/xml;charset=utf-8';
  }
  return 'text/plain;charset=utf-8';
}

async function safeJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return await response.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

function dispatchRepositorySync(detail: RepositorySyncEventDetail): void {
  document.dispatchEvent(new CustomEvent<RepositorySyncEventDetail>('enterprise-modeler:repository-sync-status', { detail }));
}
