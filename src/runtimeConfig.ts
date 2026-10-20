export interface RuntimeAuthConfig {
  enabled: boolean;
  domain: string;
  clientId: string;
  userPoolId: string;
  redirectUri: string;
  logoutUri: string;
  scopes: string[];
}

export interface RuntimeApiConfig {
  baseUrl: string;
}

export interface RuntimeConfig {
  environment: string;
  auth: RuntimeAuthConfig;
  api: RuntimeApiConfig;
}

const DEFAULT_CONFIG: RuntimeConfig = {
  environment: 'local',
  auth: {
    enabled: false,
    domain: '',
    clientId: '',
    userPoolId: '',
    redirectUri: '',
    logoutUri: '',
    scopes: ['openid', 'email', 'profile'],
  },
  api: {
    baseUrl: '',
  },
};

let configPromise: Promise<RuntimeConfig> | null = null;

export function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (!configPromise) configPromise = fetchRuntimeConfig();
  return configPromise;
}

async function fetchRuntimeConfig(): Promise<RuntimeConfig> {
  let response: Response;

  try {
    response = await fetch('/config/runtime.json', { cache: 'no-store' });
  } catch (error) {
    if (isLocalDevelopmentHost()) {
      console.warn('Unable to load runtime configuration. Using local-development defaults.', error);
      return cloneDefaultConfig();
    }
    throw new Error(`Runtime configuration could not be loaded: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!response.ok) {
    if (response.status === 404 && isLocalDevelopmentHost()) return cloneDefaultConfig();
    throw new Error(`Runtime configuration request failed with HTTP ${response.status}.`);
  }

  let raw: Partial<RuntimeConfig>;
  try {
    raw = await response.json() as Partial<RuntimeConfig>;
  } catch (error) {
    throw new Error(`Runtime configuration is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const origin = window.location.origin;
  const auth: Partial<RuntimeAuthConfig> = raw.auth ?? {};
  const api: Partial<RuntimeApiConfig> = raw.api ?? {};

  const config: RuntimeConfig = {
    environment: String(raw.environment ?? DEFAULT_CONFIG.environment).trim() || DEFAULT_CONFIG.environment,
    auth: {
      enabled: Boolean(auth.enabled),
      domain: normaliseUrl(String(auth.domain ?? '')),
      clientId: String(auth.clientId ?? '').trim(),
      userPoolId: String(auth.userPoolId ?? '').trim(),
      redirectUri: String(auth.redirectUri ?? '').trim() || `${origin}/`,
      logoutUri: String(auth.logoutUri ?? '').trim() || `${origin}/`,
      scopes: normaliseScopes(auth.scopes),
    },
    api: {
      baseUrl: normaliseUrl(String(api.baseUrl ?? '')),
    },
  };

  if (!config.auth.enabled && !isLocalDevelopmentHost()) {
    throw new Error('Cognito authentication must be enabled for a deployed Process Modeler environment.');
  }

  if (config.auth.enabled) {
    validateAuthConfig(config.auth);
    if (!config.api.baseUrl) {
      throw new Error('Authenticated Process Modeler environments must configure api.baseUrl for the private repository API.');
    }
  }

  return config;
}

function validateAuthConfig(auth: RuntimeAuthConfig): void {
  const missing = [
    ['domain', auth.domain],
    ['clientId', auth.clientId],
    ['userPoolId', auth.userPoolId],
    ['redirectUri', auth.redirectUri],
    ['logoutUri', auth.logoutUri],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Cognito authentication is enabled but runtime configuration is missing: ${missing.join(', ')}.`);
  }
}

function normaliseScopes(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_CONFIG.auth.scopes];
  const scopes = value.map((item) => String(item).trim()).filter(Boolean);
  return scopes.length > 0 ? [...new Set(scopes)] : [...DEFAULT_CONFIG.auth.scopes];
}

function normaliseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function isLocalDevelopmentHost(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function cloneDefaultConfig(): RuntimeConfig {
  return {
    environment: DEFAULT_CONFIG.environment,
    auth: {
      ...DEFAULT_CONFIG.auth,
      scopes: [...DEFAULT_CONFIG.auth.scopes],
    },
    api: { ...DEFAULT_CONFIG.api },
  };
}
