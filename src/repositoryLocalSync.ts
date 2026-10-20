import {
  PROCESS_BPMN_AUTOSAVE_PREFIX,
  PROCESS_CATALOG,
  PROCESS_METADATA_AUTOSAVE_PREFIX,
  type ProcessCatalogData,
} from './processCatalog';
import {
  isRemoteRepositoryEnabled,
  repositoryKeyFromPublicPath,
  writeRepositoryText,
} from './repositoryTransport';

const PROCESS_LAYERS_KEY = 'enterprise-modeler.process-layers.v1';
const PROCESS_CATALOG_KEY = 'enterprise-modeler.process-catalog.v1';
const ORGANISATION_KEY = 'enterprise-modeler.organisation.v2';
const LEGACY_ORGANISATION_KEY = 'enterprise-modeler.organisation.v1';
const GOVERNANCE_KEY = 'enterprise-modeler.process-governance.v1';
const INTEGRATIONS_KEY = 'enterprise-modeler.integrations.v1';
const REGULATIONS_KEY = 'enterprise-modeler.regulations.v1';
const ARCHITECTURE_BPMN_KEY = 'enterprise-modeler.solution-architecture-bpmn.v1';
const DATA_CATALOGUE_KEY = 'enterprise-modeler.data-catalogue.v1';
const RELATIONSHIPS_KEY = 'enterprise-modeler.relationships.v1';
const GOVERNANCE_CATALOGUE_KEY = 'enterprise-modeler.governance-catalogue.v1';
const SYNC_DELAY_MS = 650;

const exactRepositoryKeys = new Map<string, string>([
  [PROCESS_LAYERS_KEY, 'processes/process-layers.json'],
  [PROCESS_CATALOG_KEY, 'processes/process-catalog.json'],
  [ORGANISATION_KEY, 'organisation/org-chart.json'],
  [GOVERNANCE_KEY, 'governance/process-governance.json'],
  [INTEGRATIONS_KEY, 'architecture/integrations.json'],
  [REGULATIONS_KEY, 'governance/regulations.json'],
  [GOVERNANCE_CATALOGUE_KEY, 'governance/governance-catalogue.json'],
  [ARCHITECTURE_BPMN_KEY, 'architecture/solution-architecture.bpmn'],
  [DATA_CATALOGUE_KEY, 'data/data-catalogue.json'],
  [RELATIONSHIPS_KEY, 'model/relationships.json'],
]);

const sessionDraftKeys = new Set<string>();
const syncTimers = new Map<string, number>();
const nativeGetItem = Storage.prototype.getItem;
const nativeSetItem = Storage.prototype.setItem;
let remoteMode = false;
let patched = false;

export async function initialiseRepositoryLocalSync(): Promise<void> {
  remoteMode = await isRemoteRepositoryEnabled();
  if (!remoteMode || patched) return;
  patched = true;

  Storage.prototype.getItem = function repositoryAwareGetItem(key: string): string | null {
    if (
      this === window.localStorage
      && remoteMode
      && isProtectedDraftKey(key)
      && !sessionDraftKeys.has(key)
    ) {
      return null;
    }
    return nativeGetItem.call(this, key);
  };

  Storage.prototype.setItem = function repositoryAwareSetItem(key: string, value: string): void {
    nativeSetItem.call(this, key, value);

    if (this !== window.localStorage || !remoteMode || !isProtectedDraftKey(key)) return;
    sessionDraftKeys.add(key);
    scheduleRepositorySync(key, value);
  };
}

function scheduleRepositorySync(storageKey: string, value: string): void {
  const existing = syncTimers.get(storageKey);
  if (existing !== undefined) window.clearTimeout(existing);

  const timer = window.setTimeout(() => {
    syncTimers.delete(storageKey);
    void synchroniseStorageValue(storageKey, value);
  }, SYNC_DELAY_MS);
  syncTimers.set(storageKey, timer);
}

async function synchroniseStorageValue(storageKey: string, value: string): Promise<void> {
  const repositoryKey = resolveRepositoryKey(storageKey);
  if (!repositoryKey) return;

  const contentType = repositoryKey.toLowerCase().endsWith('.json')
    ? 'application/json;charset=utf-8'
    : 'application/xml;charset=utf-8';

  try {
    await writeRepositoryText(repositoryKey, value, contentType);
  } catch (error) {
    console.error(`Unable to synchronise ${repositoryKey} to the shared repository.`, error);
  }
}

function resolveRepositoryKey(storageKey: string): string | null {
  const exact = exactRepositoryKeys.get(storageKey);
  if (exact) return exact;

  if (storageKey.startsWith(PROCESS_BPMN_AUTOSAVE_PREFIX) && storageKey.endsWith('.xml')) {
    const processId = storageKey.slice(PROCESS_BPMN_AUTOSAVE_PREFIX.length, -'.xml'.length);
    if (!processId || processId === 'custom') return null;
    const process = getProcessRecord(processId);
    return process?.url ? repositoryKeyFromPublicPath(process.url) : null;
  }

  if (storageKey.startsWith(PROCESS_METADATA_AUTOSAVE_PREFIX)) {
    const processId = storageKey.slice(PROCESS_METADATA_AUTOSAVE_PREFIX.length);
    if (!processId || processId === 'custom') return null;
    const process = getProcessRecord(processId);
    return process?.metadataUrl ? repositoryKeyFromPublicPath(process.metadataUrl) : null;
  }

  return null;
}

function getProcessRecord(processId: string): { url: string; metadataUrl: string } | null {
  const runtime = PROCESS_CATALOG[processId];
  if (runtime) return runtime;

  const localCatalog = nativeGetItem.call(window.localStorage, PROCESS_CATALOG_KEY);
  if (!localCatalog) return null;

  try {
    const parsed = JSON.parse(localCatalog) as Partial<ProcessCatalogData>;
    const process = parsed.processes?.find((candidate) => candidate.id === processId);
    if (!process?.url || !process.metadataUrl) return null;
    return { url: process.url, metadataUrl: process.metadataUrl };
  } catch {
    return null;
  }
}

function isProtectedDraftKey(key: string): boolean {
  if (exactRepositoryKeys.has(key) || key === LEGACY_ORGANISATION_KEY) return true;
  if (key.startsWith(PROCESS_BPMN_AUTOSAVE_PREFIX)) return key.endsWith('.xml');
  return key.startsWith(PROCESS_METADATA_AUTOSAVE_PREFIX);
}
