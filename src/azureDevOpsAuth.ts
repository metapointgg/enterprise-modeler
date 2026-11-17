import { loadRuntimeConfig, type RuntimeAzureDevOpsConfig } from './runtimeConfig';

export interface AzureDevOpsModelConnection {
  organization: string;
  project: string;
  repository: string;
  branch: string;
  modelPath: string;
}

interface AzureDevOpsTokenResponse {
  token_type?: string;
  scope?: string;
  expires_in?: number;
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface AzureDevOpsStoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

const SESSION_KEY = 'enterprise-modeler.azure-devops.session.v1';
const PKCE_VERIFIER_KEY = 'enterprise-modeler.azure-devops.pkce-verifier.v1';
const OAUTH_STATE_KEY = 'enterprise-modeler.azure-devops.oauth-state.v1';
const PENDING_CONNECTION_KEY = 'enterprise-modeler.azure-devops.pending-connection.v1';
const EXPIRY_SKEW_MS = 60_000;
const STATE_PREFIX = 'ado:';

let currentSession: AzureDevOpsStoredSession | null = null;

export async function isAzureDevOpsConfigured(): Promise<boolean> {
  return (await loadRuntimeConfig()).azureDevOps.enabled;
}

export async function getAzureDevOpsRuntimeConfig(): Promise<RuntimeAzureDevOpsConfig> {
  return (await loadRuntimeConfig()).azureDevOps;
}

export function getPendingAzureDevOpsConnection(): AzureDevOpsModelConnection | null {
  const raw = sessionStorage.getItem(PENDING_CONNECTION_KEY);
  if (!raw) return null;
  try {
    return normaliseConnection(JSON.parse(raw) as Partial<AzureDevOpsModelConnection>);
  } catch {
    return null;
  }
}

export async function beginAzureDevOpsLogin(connection: AzureDevOpsModelConnection): Promise<never> {
  const config = await getAzureDevOpsRuntimeConfig();
  if (!config.enabled) {
    throw new Error('Azure DevOps integration is not enabled in runtime configuration.');
  }

  const normalised = normaliseConnection(connection);
  validateConnection(normalised);

  const verifier = randomBase64Url(64);
  const state = `${STATE_PREFIX}${randomBase64Url(32)}`;
  const challenge = await createCodeChallenge(verifier);

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  sessionStorage.setItem(PENDING_CONNECTION_KEY, JSON.stringify(normalised));

  const url = new URL(`https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/authorize`);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('scope', config.scopes.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('prompt', 'select_account');

  window.location.assign(url.toString());
  return await new Promise<never>(() => undefined);
}

export async function handleAzureDevOpsOAuthCallback(): Promise<AzureDevOpsModelConnection | null> {
  const url = new URL(window.location.href);
  const state = url.searchParams.get('state') ?? '';
  if (!state.startsWith(STATE_PREFIX)) return null;

  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  if (error) {
    cleanOAuthParameters(url);
    throw new Error(errorDescription || error);
  }

  const code = url.searchParams.get('code');
  if (!code) return null;

  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY) ?? '';
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY) ?? '';
  if (!expectedState || !constantTimeEqual(state, expectedState)) {
    throw new Error('The Azure DevOps sign-in response could not be validated because its OAuth state did not match.');
  }
  if (!verifier) {
    throw new Error('The Azure DevOps sign-in response could not be completed because the PKCE verifier is missing.');
  }

  const config = await getAzureDevOpsRuntimeConfig();
  const response = await requestTokens(config, new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: verifier,
  }));

  const session = tokenResponseToSession(response, '');
  saveSession(session);
  currentSession = session;

  const connection = getPendingAzureDevOpsConnection();
  clearTransientOAuthState();
  cleanOAuthParameters(url);

  if (!connection) {
    throw new Error('Azure DevOps authentication completed but the pending repository connection is missing.');
  }
  return connection;
}

export async function getAzureDevOpsAccessToken(): Promise<string> {
  const config = await getAzureDevOpsRuntimeConfig();
  if (!config.enabled) throw new Error('Azure DevOps integration is not enabled.');

  let session = currentSession ?? loadSession();
  if (!session) throw new Error('Azure DevOps sign-in is required.');

  if (session.expiresAt <= Date.now() + EXPIRY_SKEW_MS) {
    if (!session.refreshToken) {
      clearAzureDevOpsSession();
      throw new Error('The Azure DevOps session has expired. Sign in again.');
    }

    const response = await requestTokens(config, new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      refresh_token: session.refreshToken,
      scope: config.scopes.join(' '),
    }));
    session = tokenResponseToSession(response, session.refreshToken);
    saveSession(session);
    currentSession = session;
  }

  return session.accessToken;
}

export function hasAzureDevOpsSession(): boolean {
  return Boolean(currentSession ?? loadSession());
}

export function clearAzureDevOpsSession(): void {
  currentSession = null;
  sessionStorage.removeItem(SESSION_KEY);
  clearTransientOAuthState();
}

export function normaliseAzureDevOpsConnection(
  value: Partial<AzureDevOpsModelConnection>,
): AzureDevOpsModelConnection {
  return normaliseConnection(value);
}

function normaliseConnection(value: Partial<AzureDevOpsModelConnection>): AzureDevOpsModelConnection {
  return {
    organization: String(value.organization ?? '').trim(),
    project: String(value.project ?? '').trim(),
    repository: String(value.repository ?? '').trim(),
    branch: String(value.branch ?? 'main').trim() || 'main',
    modelPath: String(value.modelPath ?? '').trim().replaceAll('\\', '/').replace(/^\/+|\/+$/g, ''),
  };
}

function validateConnection(connection: AzureDevOpsModelConnection): void {
  const missing = [
    ['organization', connection.organization],
    ['project', connection.project],
    ['repository', connection.repository],
    ['branch', connection.branch],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Azure DevOps repository details are missing: ${missing.join(', ')}.`);
  }
}

async function requestTokens(
  config: RuntimeAzureDevOpsConfig,
  body: URLSearchParams,
): Promise<AzureDevOpsTokenResponse> {
  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    },
  );

  const payload = await response.json() as AzureDevOpsTokenResponse;
  if (!response.ok || payload.error) {
    throw new Error(
      payload.error_description
        || payload.error
        || `Microsoft Entra token request failed with HTTP ${response.status}.`,
    );
  }
  return payload;
}

function tokenResponseToSession(
  response: AzureDevOpsTokenResponse,
  existingRefreshToken: string,
): AzureDevOpsStoredSession {
  if (!response.access_token) throw new Error('Microsoft Entra did not return an Azure DevOps access token.');

  const expiresIn = Number(response.expires_in ?? 0);
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error('Azure DevOps access-token expiry could not be determined.');
  }

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token || existingRefreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    tokenType: response.token_type || 'Bearer',
  };
}

function saveSession(session: AzureDevOpsStoredSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadSession(): AzureDevOpsStoredSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<AzureDevOpsStoredSession>;
    if (!value.accessToken || !value.expiresAt) return null;
    return {
      accessToken: value.accessToken,
      refreshToken: value.refreshToken ?? '',
      expiresAt: Number(value.expiresAt),
      tokenType: value.tokenType ?? 'Bearer',
    };
  } catch {
    return null;
  }
}

function clearTransientOAuthState(): void {
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(PENDING_CONNECTION_KEY);
}

function cleanOAuthParameters(url: URL): void {
  ['code', 'state', 'session_state', 'error', 'error_description', 'error_subcode']
    .forEach((name) => url.searchParams.delete(name));
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return bytesToBase64Url(new Uint8Array(digest));
}

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}
