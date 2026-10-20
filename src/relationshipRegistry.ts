import type {
  EnterpriseEntityType,
  EnterpriseRelationship,
  EnterpriseRelationshipData,
  EntityReference,
  RelationshipType,
} from './enterpriseModel';

const RELATIONSHIPS_URL = '/model/relationships.json';
const RELATIONSHIPS_AUTOSAVE_KEY = 'enterprise-modeler.relationships.v1';

function normaliseReference(value: Partial<EntityReference>): EntityReference {
  return {
    type: (value.type || 'process') as EnterpriseEntityType,
    id: value.id || '',
  };
}

function normaliseRelationship(
  value: Partial<EnterpriseRelationship>,
  index: number,
): EnterpriseRelationship {
  return {
    id: value.id || `relationship-${index}`,
    type: (value.type || 'related-to') as RelationshipType,
    source: normaliseReference(value.source || {}),
    target: normaliseReference(value.target || {}),
    description: value.description || '',
    ownerPositionId: value.ownerPositionId || '',
    active: value.active !== false,
    notes: value.notes || '',
  };
}

function normaliseRelationships(
  value: Partial<EnterpriseRelationshipData>,
): EnterpriseRelationshipData {
  return {
    schemaVersion: 1,
    relationships: Array.isArray(value.relationships)
      ? value.relationships
          .map(normaliseRelationship)
          .filter((relationship) => relationship.source.id && relationship.target.id)
      : [],
  };
}

export async function loadEnterpriseRelationships(
  preferAutosave = true,
): Promise<EnterpriseRelationshipData> {
  if (preferAutosave) {
    const saved = localStorage.getItem(RELATIONSHIPS_AUTOSAVE_KEY);
    if (saved) {
      try {
        return normaliseRelationships(
          JSON.parse(saved) as Partial<EnterpriseRelationshipData>,
        );
      } catch (error) {
        console.warn('Unable to parse local enterprise relationships.', error);
      }
    }
  }

  const response = await fetch(RELATIONSHIPS_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load enterprise relationships. HTTP ${response.status}.`);
  }
  return normaliseRelationships(
    await response.json() as Partial<EnterpriseRelationshipData>,
  );
}

export function saveEnterpriseRelationshipsLocally(
  data: EnterpriseRelationshipData,
): void {
  localStorage.setItem(
    RELATIONSHIPS_AUTOSAVE_KEY,
    JSON.stringify(normaliseRelationships(data), null, 2),
  );
  document.dispatchEvent(
    new CustomEvent('enterprise-modeler:relationships-changed'),
  );
}

export function getRelationshipsForEntity(
  data: EnterpriseRelationshipData,
  entity: EntityReference,
): EnterpriseRelationship[] {
  return data.relationships.filter((relationship) =>
    relationship.active && (
      (relationship.source.type === entity.type && relationship.source.id === entity.id)
      || (relationship.target.type === entity.type && relationship.target.id === entity.id)
    ));
}

export function getOutgoingRelationships(
  data: EnterpriseRelationshipData,
  entity: EntityReference,
): EnterpriseRelationship[] {
  return data.relationships.filter((relationship) =>
    relationship.active
    && relationship.source.type === entity.type
    && relationship.source.id === entity.id
  );
}

export function getIncomingRelationships(
  data: EnterpriseRelationshipData,
  entity: EntityReference,
): EnterpriseRelationship[] {
  return data.relationships.filter((relationship) =>
    relationship.active
    && relationship.target.type === entity.type
    && relationship.target.id === entity.id
  );
}
