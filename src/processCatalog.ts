import { modelUrl } from './modelRepository';

export interface ProcessLayer {
  id: string;
  code: string;
  name: string;
  description: string;
  sequence: number;
  active: boolean;
}

export interface ProcessDefinitionRecord {
  id: string;
  bpmnProcessId: string;
  name: string;
  layerId: string;
  filename: string;
  url: string;
  metadataUrl: string;
  parentId?: string;
  active: boolean;
}

export interface ProcessDefinition extends ProcessDefinitionRecord {
  level: string;
}

export interface ProcessLayersData {
  schemaVersion: number;
  layers: ProcessLayer[];
}

export interface ProcessCatalogData {
  schemaVersion: number;
  rootProcessId: string;
  processes: ProcessDefinitionRecord[];
}

export interface ProcessRepositorySnapshot {
  layers: ProcessLayersData;
  catalog: ProcessCatalogData;
}

const PROCESS_LAYERS_URL = modelUrl('/processes/process-layers.json');
const PROCESS_CATALOG_URL = modelUrl('/processes/process-catalog.json');
const PROCESS_LAYERS_AUTOSAVE_KEY = 'enterprise-modeler.process-layers.v1';
const PROCESS_CATALOG_AUTOSAVE_KEY = 'enterprise-modeler.process-catalog.v1';

export const PROCESS_BPMN_AUTOSAVE_PREFIX = 'enterprise-modeler.hierarchy.v2.';
export const PROCESS_METADATA_AUTOSAVE_PREFIX = 'enterprise-modeler.metadata.v2.';

export const PROCESS_CATALOG: Record<string, ProcessDefinition> = {};
export let PROCESS_LAYERS: ProcessLayer[] = [];
export let ROOT_PROCESS_ID = 'enterprise-operating-model';

function normaliseLayer(value: Partial<ProcessLayer>, index: number): ProcessLayer {
  return {
    id: value.id || `layer-${index}`,
    code: value.code || `L${index}`,
    name: value.name || `Layer ${index}`,
    description: value.description || '',
    sequence: Number.isFinite(value.sequence) ? Number(value.sequence) : index * 10,
    active: value.active !== false,
  };
}

function normaliseLayers(value: Partial<ProcessLayersData>): ProcessLayersData {
  const layers = Array.isArray(value.layers)
    ? value.layers.map((layer, index) => normaliseLayer(layer, index))
    : [];

  return {
    schemaVersion: 1,
    layers,
  };
}

function normaliseProcess(value: Partial<ProcessDefinitionRecord>): ProcessDefinitionRecord {
  return {
    id: value.id || `process-${crypto.randomUUID()}`,
    bpmnProcessId: value.bpmnProcessId || `Process_${crypto.randomUUID().replaceAll('-', '')}`,
    name: value.name || 'Unnamed Process',
    layerId: value.layerId || '',
    filename: value.filename || 'process.bpmn',
    url: modelUrl(value.url || '/processes/custom/process.bpmn'),
    metadataUrl: modelUrl(value.metadataUrl || '/metadata/custom/process.json'),
    parentId: value.parentId || undefined,
    active: value.active !== false,
  };
}

function normaliseCatalog(value: Partial<ProcessCatalogData>): ProcessCatalogData {
  const processes = Array.isArray(value.processes)
    ? value.processes.map((process) => normaliseProcess(process))
    : [];

  const requestedRoot = value.rootProcessId || processes[0]?.id || '';
  const rootExists = processes.some((process) => process.id === requestedRoot);

  return {
    schemaVersion: 1,
    rootProcessId: rootExists ? requestedRoot : (processes[0]?.id || ''),
    processes,
  };
}

function syncRuntimeRepository(snapshot: ProcessRepositorySnapshot): void {
  PROCESS_LAYERS = [...snapshot.layers.layers]
    .sort((left, right) => left.sequence - right.sequence || left.code.localeCompare(right.code));

  ROOT_PROCESS_ID = snapshot.catalog.rootProcessId;

  Object.keys(PROCESS_CATALOG).forEach((key) => delete PROCESS_CATALOG[key]);

  snapshot.catalog.processes.forEach((record) => {
    const layer = PROCESS_LAYERS.find((candidate) => candidate.id === record.layerId);

    PROCESS_CATALOG[record.id] = {
      ...record,
      level: layer?.code || 'Unlayered',
    };
  });
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Unable to load ${url}. HTTP ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export async function fetchRepositoryProcessRepository(): Promise<ProcessRepositorySnapshot> {
  const [layersRaw, catalogRaw] = await Promise.all([
    fetchJson<Partial<ProcessLayersData>>(PROCESS_LAYERS_URL),
    fetchJson<Partial<ProcessCatalogData>>(PROCESS_CATALOG_URL),
  ]);

  return {
    layers: normaliseLayers(layersRaw),
    catalog: normaliseCatalog(catalogRaw),
  };
}

export async function loadProcessRepository(preferAutosave = true): Promise<ProcessRepositorySnapshot> {
  if (preferAutosave) {
    const savedLayers = localStorage.getItem(PROCESS_LAYERS_AUTOSAVE_KEY);
    const savedCatalog = localStorage.getItem(PROCESS_CATALOG_AUTOSAVE_KEY);

    if (savedLayers && savedCatalog) {
      try {
        const snapshot = {
          layers: normaliseLayers(JSON.parse(savedLayers) as Partial<ProcessLayersData>),
          catalog: normaliseCatalog(JSON.parse(savedCatalog) as Partial<ProcessCatalogData>),
        };
        syncRuntimeRepository(snapshot);
        return snapshot;
      } catch (error) {
        console.warn('Unable to parse locally saved process repository; repository files will be used.', error);
      }
    }
  }

  const snapshot = await fetchRepositoryProcessRepository();
  syncRuntimeRepository(snapshot);
  return snapshot;
}

export async function initialiseProcessRepository(preferAutosave = true): Promise<void> {
  await loadProcessRepository(preferAutosave);
}

export function saveProcessRepositoryLocally(snapshot: ProcessRepositorySnapshot): void {
  const normalised = {
    layers: normaliseLayers(snapshot.layers),
    catalog: normaliseCatalog(snapshot.catalog),
  };

  localStorage.setItem(
    PROCESS_LAYERS_AUTOSAVE_KEY,
    JSON.stringify(normalised.layers, null, 2),
  );
  localStorage.setItem(
    PROCESS_CATALOG_AUTOSAVE_KEY,
    JSON.stringify(normalised.catalog, null, 2),
  );

  syncRuntimeRepository(normalised);
}

export async function resetProcessRepositoryToRepository(): Promise<ProcessRepositorySnapshot> {
  localStorage.removeItem(PROCESS_LAYERS_AUTOSAVE_KEY);
  localStorage.removeItem(PROCESS_CATALOG_AUTOSAVE_KEY);

  const snapshot = await fetchRepositoryProcessRepository();
  syncRuntimeRepository(snapshot);
  return snapshot;
}

export function getProcessRepositorySnapshot(): ProcessRepositorySnapshot {
  return {
    layers: {
      schemaVersion: 1,
      layers: structuredClone(PROCESS_LAYERS),
    },
    catalog: {
      schemaVersion: 1,
      rootProcessId: ROOT_PROCESS_ID,
      processes: Object.values(PROCESS_CATALOG).map((process) => ({
        id: process.id,
        bpmnProcessId: process.bpmnProcessId,
        name: process.name,
        layerId: process.layerId,
        filename: process.filename,
        url: process.url,
        metadataUrl: process.metadataUrl,
        parentId: process.parentId,
        active: process.active,
      })),
    },
  };
}

export function getProcessLayer(layerId?: string): ProcessLayer | undefined {
  if (!layerId) {
    return undefined;
  }
  return PROCESS_LAYERS.find((layer) => layer.id === layerId);
}

export function getProcessLayerCode(layerId?: string): string {
  return getProcessLayer(layerId)?.code || 'Unlayered';
}

export function getProcessById(processId?: string): ProcessDefinition | undefined {
  if (!processId) {
    return undefined;
  }
  return PROCESS_CATALOG[processId];
}

export function findProcessByBpmnId(bpmnProcessId: string): ProcessDefinition | undefined {
  return Object.values(PROCESS_CATALOG).find(
    (process) => process.bpmnProcessId === bpmnProcessId,
  );
}

export function exportProcessRepositoryJson(
  filename: 'process-layers.json' | 'process-catalog.json',
  data: ProcessLayersData | ProcessCatalogData,
): void {
  const blob = new Blob(
    [`${JSON.stringify(data, null, 2)}\n`],
    { type: 'application/json;charset=utf-8' },
  );

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function generateProcessId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const base = slug || `process-${crypto.randomUUID().slice(0, 8)}`;
  let candidate = base;
  let suffix = 2;

  while (PROCESS_CATALOG[candidate]) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function generateLayerId(code: string, name: string): string {
  const source = code.trim() || name.trim() || `layer-${crypto.randomUUID().slice(0, 8)}`;
  return source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^/, 'layer-');
}

export function toBpmnProcessId(processId: string): string {
  const pascal = processId
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return `Process_${pascal || crypto.randomUUID().replaceAll('-', '')}`;
}

export function createStarterBpmnXml(process: ProcessDefinitionRecord): string {
  const safeId = process.id.replace(/[^a-zA-Z0-9]/g, '_');
  const startId = `StartEvent_${safeId}`;
  const laneId = `Lane_${safeId}_Internal`;
  const laneSetId = `LaneSet_${safeId}_Organisation`;
  const collaborationId = `Collaboration_${safeId}`;
  const externalActorParticipantId = `Participant_${safeId}_ExternalActor`;
  const organisationParticipantId = `Participant_${safeId}_Organisation`;
  const externalParticipantId = `Participant_${safeId}_ExternalPartner`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_${process.bpmnProcessId}"
  targetNamespace="https://enterprise-modeler.local/bpmn">
  <bpmn:process id="${process.bpmnProcessId}" name="${escapeXml(process.name)}" isExecutable="false">
    <bpmn:laneSet id="${laneSetId}">
      <bpmn:lane id="${laneId}" name="Organisation — Department / Team">
        <bpmn:flowNodeRef>${startId}</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="${startId}" name="Start" />
  </bpmn:process>
  <bpmn:collaboration id="${collaborationId}">
    <bpmn:participant id="${externalActorParticipantId}" name="External Actor" />
    <bpmn:participant id="${organisationParticipantId}" name="Organisation" processRef="${process.bpmnProcessId}" />
    <bpmn:participant id="${externalParticipantId}" name="External Party / Service Provider" />
  </bpmn:collaboration>
  <bpmndi:BPMNDiagram id="BPMNDiagram_${process.bpmnProcessId}">
    <bpmndi:BPMNPlane id="BPMNPlane_${process.bpmnProcessId}" bpmnElement="${collaborationId}">
      <bpmndi:BPMNShape id="${externalActorParticipantId}_di" bpmnElement="${externalActorParticipantId}" isHorizontal="true">
        <dc:Bounds x="80" y="70" width="1000" height="110" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${organisationParticipantId}_di" bpmnElement="${organisationParticipantId}" isHorizontal="true">
        <dc:Bounds x="80" y="210" width="1000" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${laneId}_di" bpmnElement="${laneId}" isHorizontal="true">
        <dc:Bounds x="110" y="210" width="970" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${startId}_di" bpmnElement="${startId}">
        <dc:Bounds x="180" y="292" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${externalParticipantId}_di" bpmnElement="${externalParticipantId}" isHorizontal="true">
        <dc:Bounds x="80" y="440" width="1000" height="110" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

export function seedNewProcessDraft(process: ProcessDefinitionRecord): void {
  localStorage.setItem(
    `${PROCESS_BPMN_AUTOSAVE_PREFIX}${process.id}.xml`,
    createStarterBpmnXml(process),
  );
  localStorage.setItem(
    `${PROCESS_BPMN_AUTOSAVE_PREFIX}${process.id}.filename`,
    process.filename,
  );
  localStorage.setItem(
    `${PROCESS_METADATA_AUTOSAVE_PREFIX}${process.id}`,
    JSON.stringify({
      schemaVersion: 3,
      processId: process.bpmnProcessId,
      nodes: {},
    }, null, 2),
  );
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
