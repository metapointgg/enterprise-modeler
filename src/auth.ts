import './auth.css';

import { loadRuntimeConfig, type RuntimeAuthConfig, type RuntimeConfig } from './runtimeConfig';

interface CognitoTokenResponse {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  username?: string;
  'cognito:username'?: string;
  'cognito:groups'?: string[] | string;
  token_use?: string;
  exp?: number;
}

interface StoredAuthSession {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export interface AuthenticatedUser {
  sub: string;
  email: string;
  username: string;
  displayName: string;
  groups: string[];
}

export interface AuthContext {
  enabled: boolean;
  environment: string;
  user: AuthenticatedUser | null;
}

export type ApiVerificationState = 'checking' | 'verified' | 'unavailable';

const SESSION_KEY = 'enterprise-modeler.auth.session.v1';
const PKCE_VERIFIER_KEY = 'enterprise-modeler.auth.pkce-verifier.v1';
const OAUTH_STATE_KEY = 'enterprise-modeler.auth.oauth-state.v1';
const EXPIRY_SKEW_MS = 60_000;

let runtimeConfig: RuntimeConfig | null = null;
let currentSession: StoredAuthSession | null = null;
let currentContext: AuthContext | null = null;

export async function initialiseAuthentication(): Promise<AuthContext> {
  runtimeConfig = await loadRuntimeConfig();

  if (!runtimeConfig.auth.enabled) {
    currentContext = {
      enabled: false,
      environment: runtimeConfig.environment,
      user: null,
    };
    return currentContext;
  }

  try {
    await handleOAuthCallback(runtimeConfig.auth);
    currentSession = loadStoredSession();

    if (currentSession && isSessionExpiring(currentSession)) {
      currentSession = await refreshSession(runtimeConfig.auth, currentSession);
    }

    if (!currentSession) {
      renderSignInScreen(runtimeConfig);
      return await waitForRedirect();
    }

    const accessClaims = decodeJwt(currentSession.accessToken);
    if (accessClaims.token_use && accessClaims.token_use !== 'access') {
      throw new Error('Cognito returned a token that is not an access token.');
    }

    const idClaims = decodeJwt(currentSession.idToken);
    const user = buildUser(accessClaims, idClaims);

    currentContext = {
      enabled: true,
      environment: runtimeConfig.environment,
      user,
    };

    document.documentElement.classList.add('enterprise-modeler-authenticated');
    document.dispatchEvent(new CustomEvent('enterprise-modeler:auth-ready', { detail: currentContext }));
    return currentContext;
  } catch (error) {
    clearStoredSession();
    renderAuthenticationError(runtimeConfig, error);
    return await waitForRedirect();
  }
}

export async function getAccessToken(): Promise<string> {
  const config = runtimeConfig ?? await loadRuntimeConfig();
  if (!config.auth.enabled) return '';

  let session = currentSession ?? loadStoredSession();
  if (!session) throw new Error('No authenticated Cognito session is available.');

  if (isSessionExpiring(session)) {
    session = await refreshSession(config.auth, session);
    currentSession = session;
  }

  return session.accessToken;
}

export function getAuthContext(): AuthContext | null {
  return currentContext;
}

export function mountAuthHeader(context: AuthContext): void {
  if (!context.enabled || !context.user) return;

  const header = document.querySelector<HTMLElement>('.application-header');
  if (!header || header.querySelector('.auth-user-control')) return;

  const user = context.user;
  const control = document.createElement('div');
  control.className = 'auth-user-control';
  control.innerHTML = `
    <div class="auth-user-details">
      <strong>${escapeHtml(user.displayName)}</strong>
      <span>${escapeHtml(user.email || user.username)}</span>
      <small class="auth-api-status" data-api-auth-status="checking">API checking…</small>
    </div>
    <button class="auth-sign-out-button" type="button">Sign out</button>
  `;

  control.querySelector<HTMLButtonElement>('.auth-sign-out-button')
    ?.addEventListener('click', () => logout());

  header.appendChild(control);
}

export function setApiVerificationStatus(state: ApiVerificationState, message: string): void {
  const status = document.querySelector<HTMLElement>('.auth-api-status');
  if (!status) return;
  status.dataset.apiAuthStatus = state;
  status.textContent = message;
}

export function logout(): void {
  const config = runtimeConfig;
  clearStoredSession();

  if (!config?.auth.enabled) {
    window.location.assign('/');
    return;
  }

  const url = new URL(`${config.auth.domain}/logout`);
  url.searchParams.set('client_id', config.auth.clientId);
  url.searchParams.set('logout_uri', config.auth.logoutUri);
  window.location.assign(url.toString());
}

async function handleOAuthCallback(auth: RuntimeAuthConfig): Promise<void> {
  const url = new URL(window.location.href);
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    cleanOAuthParameters(url);
    throw new Error(errorDescription || error);
  }

  const code = url.searchParams.get('code');
  if (!code) return;

  const returnedState = url.searchParams.get('state') ?? '';
  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY) ?? '';
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY) ?? '';

  if (!expectedState || !constantTimeEqual(returnedState, expectedState)) {
    throw new Error('The Cognito sign-in response could not be validated because its OAuth state did not match.');
  }
  if (!verifier) {
    throw new Error('The Cognito sign-in response could not be completed because the PKCE verifier is missing.');
  }

  const response = await requestTokens(auth, new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: auth.clientId,
    code,
    redirect_uri: auth.redirectUri,
    code_verifier: verifier,
  }));

  const session = tokenResponseToSession(response, '');
  saveStoredSession(session);
  currentSession = session;

  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  cleanOAuthParameters(url);
}

async function beginLogin(auth: RuntimeAuthConfig): Promise<void> {
  const verifier = randomBase64Url(64);
  const state = randomBase64Url(32);
  const challenge = await createCodeChallenge(verifier);

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);

  const url = new URL(`${auth.domain}/oauth2/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', auth.clientId);
  url.searchParams.set('redirect_uri', auth.redirectUri);
  url.searchParams.set('scope', auth.scopes.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', challenge);

  window.location.assign(url.toString());
}

async function refreshSession(auth: RuntimeAuthConfig, existing: StoredAuthSession): Promise<StoredAuthSession> {
  if (!existing.refreshToken) {
    clearStoredSession();
    throw new Error('The Cognito session has expired and no refresh token is available.');
  }

  try {
    const response = await requestTokens(auth, new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: auth.clientId,
      refresh_token: existing.refreshToken,
    }));
    const refreshed = tokenResponseToSession(response, existing.refreshToken, existing.idToken);
    saveStoredSession(refreshed);
    return refreshed;
  } catch (error) {
    clearStoredSession();
    throw error;
  }
}

async function requestTokens(auth: RuntimeAuthConfig, body: URLSearchParams): Promise<CognitoTokenResponse> {
  const response = await fetch(`${auth.domain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const payload = await response.json() as CognitoTokenResponse;
  if (!response.ok || payload.error) {
    throw new Error(payload.error_description || payload.error || `Cognito token request failed with HTTP ${response.status}.`);
  }
  return payload;
}

function tokenResponseToSession(
  response: CognitoTokenResponse,
  existingRefreshToken: string,
  existingIdToken = '',
): StoredAuthSession {
  if (!response.access_token) throw new Error('Cognito did not return an access token.');
  const idToken = response.id_token || existingIdToken;
  if (!idToken) throw new Error('Cognito did not return an ID token.');

  const accessClaims = decodeJwt(response.access_token);
  const expiresAt = typeof response.expires_in === 'number'
    ? Date.now() + response.expires_in * 1000
    : ((accessClaims.exp ?? 0) * 1000);

  if (!expiresAt) throw new Error('Cognito token expiry could not be determined.');

  return {
    accessToken: response.access_token,
    idToken,
    refreshToken: response.refresh_token || existingRefreshToken,
    expiresAt,
    tokenType: response.token_type || 'Bearer',
  };
}

function buildUser(accessClaims: JwtClaims, idClaims: JwtClaims): AuthenticatedUser {
  const email = idClaims.email ?? accessClaims.email ?? '';
  const username = idClaims['cognito:username']
    ?? accessClaims.username
    ?? accessClaims['cognito:username']
    ?? email;
  const givenFamily = [idClaims.given_name, idClaims.family_name].filter(Boolean).join(' ');
  const displayName = idClaims.name || givenFamily || email || username || 'Enterprise Modeler user';
  const groups = normaliseGroups(accessClaims['cognito:groups'] ?? idClaims['cognito:groups']);

  return {
    sub: idClaims.sub ?? accessClaims.sub ?? '',
    email,
    username,
    displayName,
    groups,
  };
}

function normaliseGroups(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return [...new Set(value.map((group) => group.trim()).filter(Boolean))].sort();
  if (!value) return [];
  return [...new Set(value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((group) => group.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean))].sort();
}

function isSessionExpiring(session: StoredAuthSession): boolean {
  return session.expiresAt <= Date.now() + EXPIRY_SKEW_MS;
}

function saveStoredSession(session: StoredAuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadStoredSession(): StoredAuthSession | null {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<StoredAuthSession>;
    if (!parsed.accessToken || !parsed.idToken || !parsed.expiresAt) return null;
    return {
      accessToken: parsed.accessToken,
      idToken: parsed.idToken,
      refreshToken: parsed.refreshToken ?? '',
      expiresAt: Number(parsed.expiresAt),
      tokenType: parsed.tokenType ?? 'Bearer',
    };
  } catch {
    return null;
  }
}

function clearStoredSession(): void {
  currentSession = null;
  currentContext = null;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
}

function renderSignInScreen(config: RuntimeConfig): void {
  const environment = config.environment.toLowerCase() === 'prod' || config.environment.toLowerCase() === 'production'
    ? ''
    : `<span class="auth-environment">${escapeHtml(config.environment)}</span>`;

  document.body.innerHTML = `
    <main class="auth-gate">
      <section class="auth-card">
        <div class="auth-brand">Enterprise Modeler</div>
        ${environment}
        <h1>Process Modeler</h1>
        <p>Sign in with your Enterprise Modeler account to access the operating-model workspace.</p>
        <button id="auth-sign-in" class="auth-primary-button" type="button">Sign in</button>
        <small>Access is by invitation only.</small>
      </section>
    </main>
  `;

  document.getElementById('auth-sign-in')?.addEventListener('click', () => {
    void beginLogin(config.auth).catch((error) => renderAuthenticationError(config, error));
  });
}

function renderAuthenticationError(config: RuntimeConfig, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  document.body.innerHTML = `
    <main class="auth-gate">
      <section class="auth-card auth-card-error">
        <div class="auth-brand">Enterprise Modeler</div>
        <h1>Unable to sign in</h1>
        <p>${escapeHtml(message)}</p>
        <button id="auth-retry" class="auth-primary-button" type="button">Try again</button>
      </section>
    </main>
  `;

  document.getElementById('auth-retry')?.addEventListener('click', () => {
    void beginLogin(config.auth).catch((retryError) => renderAuthenticationError(config, retryError));
  });
}

function cleanOAuthParameters(url: URL): void {
  ['code', 'state', 'error', 'error_description'].forEach((name) => url.searchParams.delete(name));
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

function decodeJwt(token: string): JwtClaims {
  const segments = token.split('.');
  if (segments.length !== 3) throw new Error('Cognito returned an invalid JWT.');
  const encoded = segments[1].replaceAll('-', '+').replaceAll('_', '/');
  const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');

  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtClaims;
  } catch {
    throw new Error('Cognito JWT claims could not be decoded.');
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function waitForRedirect(): Promise<AuthContext> {
  return new Promise<AuthContext>(() => {
    // Intentionally unresolved: the browser will navigate to Cognito managed login.
  });
}
