import { getAccessToken, setApiVerificationStatus } from './auth';
import { loadRuntimeConfig } from './runtimeConfig';

export interface ApiUserProfile {
  sub: string;
  email: string;
  username: string;
  groups: string[];
  scopes: string[];
}

interface ApiUserResponse {
  user?: Partial<ApiUserProfile>;
}

export async function verifyAuthenticatedApi(): Promise<ApiUserProfile | null> {
  const config = await loadRuntimeConfig();
  if (!config.auth.enabled || !config.api.baseUrl) {
    setApiVerificationStatus('unavailable', config.auth.enabled ? 'API not configured' : 'Local mode');
    return null;
  }

  setApiVerificationStatus('checking', 'API checking…');

  try {
    const profile = await apiRequest<ApiUserResponse>('/me', { method: 'GET' });
    const user = normaliseUser(profile.user);
    setApiVerificationStatus('verified', 'API verified');
    return user;
  } catch (error) {
    console.warn('Authenticated API verification failed.', error);
    setApiVerificationStatus('unavailable', 'API unavailable');
    return null;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = await loadRuntimeConfig();
  if (!config.api.baseUrl) throw new Error('The Enterprise Modeler Process Modeler API base URL is not configured.');

  const accessToken = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${config.api.baseUrl}${normalisePath(path)}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'message' in payload
      ? String((payload as { message?: unknown }).message ?? '')
      : '';
    throw new Error(message || `API request failed with HTTP ${response.status}.`);
  }

  return payload as T;
}

function normalisePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function normaliseUser(user: Partial<ApiUserProfile> | undefined): ApiUserProfile {
  return {
    sub: String(user?.sub ?? ''),
    email: String(user?.email ?? ''),
    username: String(user?.username ?? ''),
    groups: normaliseStringArray(user?.groups),
    scopes: normaliseStringArray(user?.scopes),
  };
}

function normaliseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}
