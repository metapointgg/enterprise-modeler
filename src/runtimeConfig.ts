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

export interface RuntimeAzureDevOpsConfig {
  enabled: boolean;
  tenantId: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  defaultOrganization: string;
  defaultProject: string;
  defaultRepository: string;
  defaultBranch: string;
  defaultModelPath: string;
}

export interface RuntimeConfig {
  environment: string;
  auth: RuntimeAuthConfig;
  api: RuntimeApiConfig;
  azureDevOps: RuntimeAzureDevOpsConfig;
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
  azureDevOps: {
    enabled: false,
    tenantId: '',
    clientId: '',
    redirectUri: '',
    scopes: [
      'openid',
      'profile',
      'offline_access',
      '499b84ac-1321-427f-aa17-267ca6975798/.default',
    ],
    defaultOrganization: '',
    defaultProject: '',
    defaultRepository: '',
    defaultBranch: 'main',
    defaultModelPath: '',
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
    const text = await response.text();
    raw = JSON.parse(text) as Partial<RuntimeConfig>;
  } catch (error) {
    if (isLocalDevelopmentHost()) {
      console.warn(
        'Runtime configuration was missing or invalid during local development. Using local-development defaults.',
        error,
      );
      return cloneDefaultConfig();
    }
    throw new Error(`Runtime configuration is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const origin = window.location.origin;
  const auth: Partial<RuntimeAuthConfig> = raw.auth ?? {};
  const api: Partial<RuntimeApiConfig> = raw.api ?? {};
  const azureDevOps: Partial<RuntimeAzureDevOpsConfig> = raw.azureDevOps ?? {};

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
    azureDevOps: {
      enabled: Boolean(azureDevOps.enabled),
      tenantId: String(azureDevOps.tenantId ?? '').trim(),
      clientId: String(azureDevOps.clientId ?? '').trim(),
      redirectUri: String(azureDevOps.redirectUri ?? '').trim() || `${origin}/`,
      scopes: normaliseAzureDevOpsScopes(azureDevOps.scopes),
      defaultOrganization: String(azureDevOps.defaultOrganization ?? '').trim(),
      defaultProject: String(azureDevOps.defaultProject ?? '').trim(),
      defaultRepository: String(azureDevOps.defaultRepository ?? '').trim(),
      defaultBranch: String(azureDevOps.defaultBranch ?? 'main').trim() || 'main',
      defaultModelPath: normaliseRepositoryPath(String(azureDevOps.defaultModelPath ?? '')),
    },
  };

  const isStandalone = config.environment.toLowerCase() === 'standalone';

  if (
    !config.auth.enabled
    && !config.azureDevOps.enabled
    && !isLocalDevelopmentHost()
    && !isStandalone
  ) {
    throw new Error(
      'A deployed Enterprise Modeler environment must enable either application authentication or Azure DevOps repository authentication.',
    );
  }

  if (config.auth.enabled) {
    validateAuthConfig(config.auth);
    if (!config.api.baseUrl) {
      throw new Error('Authenticated Process Modeler environments must configure api.baseUrl for the private repository API.');
    }
  }

  if (config.azureDevOps.enabled) validateAzureDevOpsConfig(config.azureDevOps);

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

function validateAzureDevOpsConfig(config: RuntimeAzureDevOpsConfig): void {
  const missing = [
    ['tenantId', config.tenantId],
    ['clientId', config.clientId],
    ['redirectUri', config.redirectUri],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Azure DevOps integration is enabled but runtime configuration is missing: ${missing.join(', ')}.`);
  }
}

function normaliseScopes(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_CONFIG.auth.scopes];
  const scopes = value.map((item) => String(item).trim()).filter(Boolean);
  return scopes.length > 0 ? [...new Set(scopes)] : [...DEFAULT_CONFIG.auth.scopes];
}

function normaliseAzureDevOpsScopes(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_CONFIG.azureDevOps.scopes];
  const scopes = value.map((item) => String(item).trim()).filter(Boolean);
  return scopes.length > 0 ? [...new Set(scopes)] : [...DEFAULT_CONFIG.azureDevOps.scopes];
}

function normaliseRepositoryPath(value: string): string {
  return value.trim().replaceAll('\\', '/').replace(/^\/+|\/+$/g, '');
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
    azureDevOps: {
      ...DEFAULT_CONFIG.azureDevOps,
      scopes: [...DEFAULT_CONFIG.azureDevOps.scopes],
    },
  };
}
