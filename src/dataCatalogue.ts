import { hasOpenEnterpriseModel, readModelJson, writeModelJson } from './modelWorkspace';
import type {
  DataCatalogueData,
  DataFlowRecord,
  DataObjectRecord,
} from './enterpriseModel';

const DATA_CATALOGUE_URL = '/data/data-catalogue.json';
const DATA_CATALOGUE_AUTOSAVE_KEY = 'enterprise-modeler.data-catalogue.v1';

function normaliseDataObject(
  value: Partial<DataObjectRecord>,
  index: number,
): DataObjectRecord {
  const criticality = value.criticality === 'low' || value.criticality === 'high'
    ? value.criticality
    : 'medium';

  return {
    id: value.id || `data-object-${index}`,
    name: value.name || `Data Object ${index + 1}`,
    description: value.description || '',
    domain: value.domain || '',
    businessOwnerPositionId: value.businessOwnerPositionId || '',
    dataStewardPositionId: value.dataStewardPositionId || '',
    classification: value.classification || 'tbc',
    personalData: value.personalData === true,
    specialCategoryData: value.specialCategoryData === true,
    systemOfRecordId: value.systemOfRecordId || '',
    retentionPeriod: value.retentionPeriod || '',
    dataResidency: value.dataResidency || '',
    criticality,
    active: value.active !== false,
    notes: value.notes || '',
  };
}

function normaliseDataFlow(
  value: Partial<DataFlowRecord>,
  index: number,
): DataFlowRecord {
  const direction = value.direction === 'inbound' || value.direction === 'bidirectional'
    ? value.direction
    : 'outbound';

  return {
    id: value.id || `data-flow-${index}`,
    name: value.name || `Data Flow ${index + 1}`,
    sourceSystemId: value.sourceSystemId || '',
    targetSystemId: value.targetSystemId || '',
    dataObjectIds: Array.isArray(value.dataObjectIds) ? value.dataObjectIds.filter(Boolean) : [],
    processId: value.processId || '',
    processNodeId: value.processNodeId || '',
    interfaceId: value.interfaceId || '',
    direction,
    frequency: value.frequency || '',
    protocol: value.protocol || '',
    classification: value.classification || 'tbc',
    encryption: value.encryption || '',
    purpose: value.purpose || '',
    ownerPositionId: value.ownerPositionId || '',
    active: value.active !== false,
    notes: value.notes || '',
  };
}

function normaliseDataCatalogue(
  value: Partial<DataCatalogueData>,
): DataCatalogueData {
  return {
    schemaVersion: 1,
    dataObjects: Array.isArray(value.dataObjects)
      ? value.dataObjects.map(normaliseDataObject)
      : [],
    dataFlows: Array.isArray(value.dataFlows)
      ? value.dataFlows.map(normaliseDataFlow)
      : [],
  };
}

export async function loadDataCatalogue(
  preferAutosave = true,
): Promise<DataCatalogueData> {
  if (preferAutosave && !hasOpenEnterpriseModel()) {
    const saved = localStorage.getItem(DATA_CATALOGUE_AUTOSAVE_KEY);
    if (saved) {
      try {
        return normaliseDataCatalogue(
          JSON.parse(saved) as Partial<DataCatalogueData>,
        );
      } catch (error) {
        console.warn('Unable to parse local data catalogue.', error);
      }
    }
  }

  return normaliseDataCatalogue(
    await readModelJson<Partial<DataCatalogueData>>(DATA_CATALOGUE_URL),
  );
}

export function saveDataCatalogueLocally(data: DataCatalogueData): void {
  const normalised = normaliseDataCatalogue(data);
  localStorage.setItem(
    DATA_CATALOGUE_AUTOSAVE_KEY,
    JSON.stringify(normalised, null, 2),
  );
  void writeModelJson(DATA_CATALOGUE_URL, normalised);
  document.dispatchEvent(
    new CustomEvent('enterprise-modeler:data-catalogue-changed'),
  );
}
