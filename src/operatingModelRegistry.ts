export type ProcessLifecycleStatus = 'draft' | 'in-review' | 'approved' | 'published' | 'superseded';
export type ProcessChannel = 'digital' | 'physical' | 'central' | 'external';
export type ArchitectureLayer = 'client-portals' | 'core-platforms' | 'data-reporting' | 'third-party';
export type ArchitectureEnvironment = 'production' | 'uat' | 'dev-test';

export interface ProcessGovernanceRecord {
  processId: string;
  status: ProcessLifecycleStatus;
  ownerPositionId: string;
  approverPositionId: string;
  version: string;
  effectiveDate: string;
  reviewDate: string;
  channels: ProcessChannel[];
  systemIds: string[];
  interfaceIds: string[];
  regulationIds: string[];
  changeSummary: string;
  updatedAt: string;
}

export interface ProcessGovernanceData {
  schemaVersion: number;
  records: ProcessGovernanceRecord[];
}

export interface SystemRecord {
  id: string;
  name: string;
  type: string;
  architectureLayer: ArchitectureLayer;
  supplier: string;
  environment: string;
  environments?: ArchitectureEnvironment[];
  dataClassification: string;
  integrationType: string;
  ownerPositionId: string;
  criticality: 'low' | 'medium' | 'high';
  active: boolean;
  notes: string;
  parentSystemId?: string;
}

export interface InterfaceRecord {
  id: string;
  name: string;
  sourceSystemId: string;
  targetSystemId: string;
  direction: 'outbound' | 'inbound' | 'bidirectional';
  protocol: string;
  authentication: string;
  environments?: ArchitectureEnvironment[];
  ownerPositionId: string;
  criticality: 'low' | 'medium' | 'high';
  status: 'design' | 'active' | 'retired' | 'tbc';
  documentationReference: string;
  notes: string;
}

export interface EnvironmentOperationRecord {
  id: string;
  name: string;
  sourceSystemId: string;
  sourceEnvironment: ArchitectureEnvironment | 'tbc';
  targetSystemId: string;
  targetEnvironment: ArchitectureEnvironment | 'tbc';
  operationType: 'refresh' | 'manual-transfer' | 'copy' | 'other';
  frequency: string;
  dataScrambled: boolean | null;
  automated: boolean | null;
  status: 'observed' | 'confirmed' | 'tbc';
  notes: string;
}

export interface IntegrationData {
  schemaVersion: number;
  systems: SystemRecord[];
  interfaces: InterfaceRecord[];
  environmentOperations?: EnvironmentOperationRecord[];
}

export interface RegulationRecord {
  id: string;
  name: string;
  category: string;
  jurisdiction: string;
  sourceReference: string;
  ownerPositionId: string;
  active: boolean;
  notes: string;
}

export interface RegulationData {
  schemaVersion: number;
  regulations: RegulationRecord[];
}

export const PROCESS_LIFECYCLE_STATUSES: Array<{ id: ProcessLifecycleStatus; label: string }> = [
  { id: 'draft', label: 'Draft' },
  { id: 'in-review', label: 'In Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'published', label: 'Published' },
  { id: 'superseded', label: 'Superseded' },
];

export const PROCESS_CHANNELS: Array<{ id: ProcessChannel; label: string }> = [
  { id: 'digital', label: 'Digital' },
  { id: 'physical', label: 'Physical / In-person' },
  { id: 'central', label: 'Central / Shared Services' },
  { id: 'external', label: 'External' },
];

export const ARCHITECTURE_ENVIRONMENTS: Array<{ id: ArchitectureEnvironment; label: string; colourHint: string }> = [
  { id: 'production', label: 'Production', colourHint: 'baseline' },
  { id: 'uat', label: 'UAT', colourHint: 'green' },
  { id: 'dev-test', label: 'Dev / Test', colourHint: 'pink' },
];

export const ARCHITECTURE_LAYERS: Array<{ id: ArchitectureLayer; label: string; sequence: number }> = [
  { id: 'client-portals', label: 'Client Portals', sequence: 10 },
  { id: 'core-platforms', label: 'Core Platforms', sequence: 20 },
  { id: 'data-reporting', label: 'Data / Reporting', sequence: 30 },
  { id: 'third-party', label: 'Third Party Integration', sequence: 40 },
];

const GOVERNANCE_URL = '/governance/process-governance.json';
const INTEGRATIONS_URL = '/architecture/integrations.json';
const REGULATIONS_URL = '/governance/regulations.json';

const GOVERNANCE_AUTOSAVE_KEY = 'enterprise-modeler.process-governance.v1';
const INTEGRATIONS_AUTOSAVE_KEY = 'enterprise-modeler.client.integrations.v2';
const REGULATIONS_AUTOSAVE_KEY = 'enterprise-modeler.regulations.v1';

function isLifecycleStatus(value: string | undefined): value is ProcessLifecycleStatus {
  return PROCESS_LIFECYCLE_STATUSES.some((status) => status.id === value);
}

function isChannel(value: string): value is ProcessChannel {
  return PROCESS_CHANNELS.some((channel) => channel.id === value);
}

function isArchitectureLayer(value: string | undefined): value is ArchitectureLayer {
  return ARCHITECTURE_LAYERS.some((layer) => layer.id === value);
}

function isArchitectureEnvironment(value: string): value is ArchitectureEnvironment {
  return ARCHITECTURE_ENVIRONMENTS.some((environment) => environment.id === value);
}

function normaliseEnvironments(values: unknown, legacyEnvironment = ''): ArchitectureEnvironment[] {
  if (Array.isArray(values)) {
    const environments = values.filter((value): value is string => typeof value === 'string').filter(isArchitectureEnvironment);
    if (environments.length > 0) return [...new Set(environments)];
  }

  const legacy = legacyEnvironment.toLowerCase();
  const inferred: ArchitectureEnvironment[] = [];
  if (!legacy || legacy.includes('prod')) inferred.push('production');
  if (legacy.includes('uat')) inferred.push('uat');
  if (legacy.includes('dev') || legacy.includes('test')) inferred.push('dev-test');
  return inferred.length > 0 ? inferred : ['production'];
}

function normaliseGovernanceRecord(value: Partial<ProcessGovernanceRecord>): ProcessGovernanceRecord {
  return {
    processId: value.processId || '',
    status: isLifecycleStatus(value.status) ? value.status : 'draft',
    ownerPositionId: value.ownerPositionId || '',
    approverPositionId: value.approverPositionId || '',
    version: value.version || '0.1',
    effectiveDate: value.effectiveDate || '',
    reviewDate: value.reviewDate || '',
    channels: Array.isArray(value.channels) ? value.channels.filter(isChannel) : [],
    systemIds: Array.isArray(value.systemIds) ? value.systemIds.filter(Boolean) : [],
    interfaceIds: Array.isArray(value.interfaceIds) ? value.interfaceIds.filter(Boolean) : [],
    regulationIds: Array.isArray(value.regulationIds) ? value.regulationIds.filter(Boolean) : [],
    changeSummary: value.changeSummary || '',
    updatedAt: value.updatedAt || '',
  };
}

function normaliseGovernance(value: Partial<ProcessGovernanceData>): ProcessGovernanceData {
  const records = Array.isArray(value.records)
    ? value.records.map(normaliseGovernanceRecord).filter((record) => record.processId)
    : [];
  return { schemaVersion: 1, records };
}

function normaliseSystem(value: Partial<SystemRecord>, index: number): SystemRecord {
  const criticality = value.criticality === 'low' || value.criticality === 'medium' || value.criticality === 'high'
    ? value.criticality
    : 'medium';
  return {
    id: value.id || `system-${index}`,
    name: value.name || `System ${index + 1}`,
    type: value.type || '',
    architectureLayer: isArchitectureLayer(value.architectureLayer) ? value.architectureLayer : 'core-platforms',
    supplier: value.supplier || '',
    environment: value.environment || '',
    environments: normaliseEnvironments(value.environments, value.environment || ''),
    dataClassification: value.dataClassification || '',
    integrationType: value.integrationType || '',
    ownerPositionId: value.ownerPositionId || '',
    criticality,
    active: value.active !== false,
    notes: value.notes || '',
    parentSystemId: value.parentSystemId || '',
  };
}

function normaliseInterface(value: Partial<InterfaceRecord>, index: number): InterfaceRecord {
  const direction = value.direction === 'inbound' || value.direction === 'bidirectional' ? value.direction : 'outbound';
  const criticality = value.criticality === 'low' || value.criticality === 'high' ? value.criticality : 'medium';
  const status = value.status === 'active' || value.status === 'retired' || value.status === 'tbc' ? value.status : 'design';
  return {
    id: value.id || `interface-${index}`,
    name: value.name || `Interface ${index + 1}`,
    sourceSystemId: value.sourceSystemId || '',
    targetSystemId: value.targetSystemId || '',
    direction,
    protocol: value.protocol || '',
    authentication: value.authentication || '',
    environments: normaliseEnvironments(value.environments, ''),
    ownerPositionId: value.ownerPositionId || '',
    criticality,
    status,
    documentationReference: value.documentationReference || '',
    notes: value.notes || '',
  };
}

function normaliseEnvironmentOperation(
  value: Partial<EnvironmentOperationRecord>,
  index: number,
): EnvironmentOperationRecord {
  const sourceEnvironment = value.sourceEnvironment === 'uat'
    || value.sourceEnvironment === 'dev-test'
    || value.sourceEnvironment === 'production'
    ? value.sourceEnvironment
    : 'tbc';
  const targetEnvironment = value.targetEnvironment === 'uat'
    || value.targetEnvironment === 'dev-test'
    || value.targetEnvironment === 'production'
    ? value.targetEnvironment
    : 'tbc';
  const operationType = value.operationType === 'refresh'
    || value.operationType === 'manual-transfer'
    || value.operationType === 'copy'
    ? value.operationType
    : 'other';
  const status = value.status === 'observed' || value.status === 'confirmed'
    ? value.status
    : 'tbc';

  return {
    id: value.id || `environment-operation-${index}`,
    name: value.name || `Environment operation ${index + 1}`,
    sourceSystemId: value.sourceSystemId || '',
    sourceEnvironment,
    targetSystemId: value.targetSystemId || '',
    targetEnvironment,
    operationType,
    frequency: value.frequency || '',
    dataScrambled: typeof value.dataScrambled === 'boolean' ? value.dataScrambled : null,
    automated: typeof value.automated === 'boolean' ? value.automated : null,
    status,
    notes: value.notes || '',
  };
}

function normaliseIntegrations(value: Partial<IntegrationData>): IntegrationData {
  return {
    schemaVersion: 2,
    systems: Array.isArray(value.systems) ? value.systems.map(normaliseSystem) : [],
    interfaces: Array.isArray(value.interfaces) ? value.interfaces.map(normaliseInterface) : [],
    environmentOperations: Array.isArray(value.environmentOperations)
      ? value.environmentOperations.map(normaliseEnvironmentOperation)
      : [],
  };
}

function normaliseRegulation(value: Partial<RegulationRecord>, index: number): RegulationRecord {
  return {
    id: value.id || `regulation-${index}`,
    name: value.name || `Regulatory obligation ${index + 1}`,
    category: value.category || '',
    jurisdiction: value.jurisdiction || '',
    sourceReference: value.sourceReference || '',
    ownerPositionId: value.ownerPositionId || '',
    active: value.active !== false,
    notes: value.notes || '',
  };
}

function normaliseRegulations(value: Partial<RegulationData>): RegulationData {
  return {
    schemaVersion: 1,
    regulations: Array.isArray(value.regulations) ? value.regulations.map(normaliseRegulation) : [],
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load ${url}. HTTP ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export async function loadProcessGovernance(preferAutosave = true): Promise<ProcessGovernanceData> {
  if (preferAutosave) {
    const saved = localStorage.getItem(GOVERNANCE_AUTOSAVE_KEY);
    if (saved) {
      try {
        return normaliseGovernance(JSON.parse(saved) as Partial<ProcessGovernanceData>);
      } catch (error) {
        console.warn('Unable to parse local process governance data.', error);
      }
    }
  }
  return normaliseGovernance(await fetchJson<Partial<ProcessGovernanceData>>(GOVERNANCE_URL));
}

export async function loadIntegrationData(preferAutosave = true): Promise<IntegrationData> {
  if (preferAutosave) {
    const saved = localStorage.getItem(INTEGRATIONS_AUTOSAVE_KEY);
    if (saved) {
      try {
        return normaliseIntegrations(JSON.parse(saved) as Partial<IntegrationData>);
      } catch (error) {
        console.warn('Unable to parse local integration catalogue.', error);
      }
    }
  }
  return normaliseIntegrations(await fetchJson<Partial<IntegrationData>>(INTEGRATIONS_URL));
}

export async function loadRegulationData(preferAutosave = true): Promise<RegulationData> {
  if (preferAutosave) {
    const saved = localStorage.getItem(REGULATIONS_AUTOSAVE_KEY);
    if (saved) {
      try {
        return normaliseRegulations(JSON.parse(saved) as Partial<RegulationData>);
      } catch (error) {
        console.warn('Unable to parse local regulatory catalogue.', error);
      }
    }
  }
  return normaliseRegulations(await fetchJson<Partial<RegulationData>>(REGULATIONS_URL));
}

export function ensureProcessGovernanceRecords(data: ProcessGovernanceData, processIds: string[]): ProcessGovernanceData {
  const existingIds = new Set(data.records.map((record) => record.processId));
  const records = [...data.records];
  processIds.forEach((processId) => {
    if (!existingIds.has(processId)) {
      records.push(normaliseGovernanceRecord({ processId }));
    }
  });
  return { schemaVersion: 1, records };
}

export function saveProcessGovernanceLocally(data: ProcessGovernanceData): void {
  localStorage.setItem(GOVERNANCE_AUTOSAVE_KEY, JSON.stringify(normaliseGovernance(data), null, 2));
  notifyRegistryChanged('governance');
}

export function saveIntegrationDataLocally(data: IntegrationData): void {
  localStorage.setItem(INTEGRATIONS_AUTOSAVE_KEY, JSON.stringify(normaliseIntegrations(data), null, 2));
  notifyRegistryChanged('integrations');
}

export function saveRegulationDataLocally(data: RegulationData): void {
  localStorage.setItem(REGULATIONS_AUTOSAVE_KEY, JSON.stringify(normaliseRegulations(data), null, 2));
  notifyRegistryChanged('regulations');
}

export function exportRegistryJson(filename: string, data: unknown): void {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function generateRegistryId(prefix: string, name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return `${prefix}-${slug || 'record'}-${crypto.randomUUID().slice(0, 8)}`;
}

export function getLifecycleLabel(status: ProcessLifecycleStatus): string {
  return PROCESS_LIFECYCLE_STATUSES.find((candidate) => candidate.id === status)?.label ?? status;
}

export function getArchitectureLayerLabel(layer: ArchitectureLayer): string {
  return ARCHITECTURE_LAYERS.find((candidate) => candidate.id === layer)?.label ?? layer;
}

export function notifyRegistryChanged(scope: string): void {
  document.dispatchEvent(new CustomEvent('enterprise-modeler:operating-model-registry-changed', { detail: { scope } }));
}
