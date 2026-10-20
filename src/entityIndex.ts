import type {
  EnterpriseEntityType,
  EnterpriseRelationshipData,
} from './enterpriseModel';
import { loadDataCatalogue } from './dataCatalogue';
import { loadEnterpriseRelationships } from './relationshipRegistry';
import { loadGovernanceCatalogue } from './governanceCatalogueRegistry';
import { loadOrganisation } from './organisation';
import { loadIntegrationData, loadRegulationData } from './operatingModelRegistry';
import { loadProcessRepository } from './processCatalog';

export interface IndexedEntity {
  key: string;
  type: EnterpriseEntityType;
  id: string;
  name: string;
  subtitle: string;
}

export interface EntityIndexSnapshot {
  entities: IndexedEntity[];
  relationships: EnterpriseRelationshipData;
}

export function entityKey(type: EnterpriseEntityType, id: string): string {
  return `${type}:${id}`;
}

export async function loadEntityIndex(): Promise<EntityIndexSnapshot> {
  const [
    processes,
    organisation,
    integrations,
    regulations,
    dataCatalogue,
    governance,
    relationships,
  ] = await Promise.all([
    loadProcessRepository(true),
    loadOrganisation(true),
    loadIntegrationData(true),
    loadRegulationData(true),
    loadDataCatalogue(true),
    loadGovernanceCatalogue(true),
    loadEnterpriseRelationships(true),
  ]);

  const entities: IndexedEntity[] = [];
  const add = (type: EnterpriseEntityType, id: string, name: string, subtitle: string): void => {
    if (!id) return;
    const key = entityKey(type, id);
    if (entities.some((entity) => entity.key === key)) return;
    entities.push({ key, type, id, name: name || id, subtitle });
  };

  processes.catalog.processes.forEach((record) => add('process', record.id, record.name, record.layerId));
  organisation.people.forEach((record) => add('person', record.id, record.name, 'Person'));
  organisation.roles.forEach((record) => add('role', record.id, record.name, 'Role'));
  organisation.positions.forEach((record) => add('position', record.id, record.name, 'Position'));
  organisation.teams.forEach((record) => add('team', record.id, record.name, 'Team'));
  organisation.departments.forEach((record) => add('department', record.id, record.name, 'Department'));

  integrations.systems.forEach((record) => add('system', record.id, record.name, record.type || 'System'));
  integrations.interfaces.forEach((record) => add('interface', record.id, record.name, 'Interface'));
  dataCatalogue.dataObjects.forEach((record) => add('data-object', record.id, record.name, record.domain || 'Data Object'));
  dataCatalogue.dataFlows.forEach((record) => add('data-flow', record.id, record.name, 'Data Flow'));

  regulations.regulations.forEach((record) => add('regulation', record.id, record.name, record.jurisdiction || 'Regulation'));
  governance.requirements.forEach((record) => add('requirement', record.id, record.name, 'Requirement'));
  governance.businessRules.forEach((record) => add('business-rule', record.id, record.name, 'Business Rule'));
  governance.controls.forEach((record) => add('control', record.id, record.name, 'Control'));
  governance.risks.forEach((record) => add('risk', record.id, record.name, 'Risk'));
  governance.policies.forEach((record) => add(
    record.policyType === 'standard' ? 'standard' : 'policy',
    record.id,
    record.name,
    record.policyType,
  ));

  relationships.relationships.forEach((relationship) => {
    for (const reference of [relationship.source, relationship.target]) {
      if (reference.type === 'process-node') {
        const nodeName = reference.id.includes(':')
          ? reference.id.slice(reference.id.lastIndexOf(':') + 1)
          : reference.id;
        add('process-node', reference.id, nodeName, 'BPMN Process Step');
      }
    }
  });

  return {
    entities: entities.sort((left, right) =>
      left.type.localeCompare(right.type) || left.name.localeCompare(right.name)
    ),
    relationships,
  };
}
