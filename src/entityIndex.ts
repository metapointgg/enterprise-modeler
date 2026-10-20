import type {
  EnterpriseEntityType,
  EnterpriseRelationship,
  EnterpriseRelationshipData,
  EntityReference,
  RelationshipType,
} from './enterpriseModel';
import { loadDataCatalogue } from './dataCatalogue';
import { loadEnterpriseRelationships } from './relationshipRegistry';
import { loadGovernanceCatalogue } from './governanceCatalogueRegistry';
import { loadOrganisation } from './organisation';
import {
  loadIntegrationData,
  loadProcessGovernance,
  loadRegulationData,
} from './operatingModelRegistry';
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

function derivedRelationshipId(
  type: RelationshipType,
  source: EntityReference,
  target: EntityReference,
): string {
  return `derived:${type}:${source.type}:${source.id}:${target.type}:${target.id}`;
}

function addDerivedRelationship(
  data: EnterpriseRelationshipData,
  type: RelationshipType,
  source: EntityReference,
  target: EntityReference,
  description: string,
): void {
  if (!source.id || !target.id) return;

  const duplicate = data.relationships.some((relationship) =>
    relationship.active
    && relationship.type === type
    && relationship.source.type === source.type
    && relationship.source.id === source.id
    && relationship.target.type === target.type
    && relationship.target.id === target.id
  );
  if (duplicate) return;

  data.relationships.push({
    id: derivedRelationshipId(type, source, target),
    type,
    source,
    target,
    description,
    ownerPositionId: '',
    active: true,
    notes: 'Derived from a structured catalogue field.',
  });
}

export function isDerivedRelationship(relationship: EnterpriseRelationship): boolean {
  return relationship.id.startsWith('derived:');
}

export async function loadEntityIndex(): Promise<EntityIndexSnapshot> {
  const [
    processes,
    processGovernance,
    organisation,
    integrations,
    regulations,
    dataCatalogue,
    governance,
    explicitRelationships,
  ] = await Promise.all([
    loadProcessRepository(true),
    loadProcessGovernance(true),
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

  explicitRelationships.relationships.forEach((relationship) => {
    for (const reference of [relationship.source, relationship.target]) {
      if (reference.type === 'process-node') {
        const nodeName = reference.id.includes(':')
          ? reference.id.slice(reference.id.lastIndexOf(':') + 1)
          : reference.id;
        add('process-node', reference.id, nodeName, 'BPMN Process Step');
      }
    }
  });

  const relationships: EnterpriseRelationshipData = {
    schemaVersion: 1,
    relationships: structuredClone(explicitRelationships.relationships),
  };
  const derive = (
    type: RelationshipType,
    sourceType: EnterpriseEntityType,
    sourceId: string | undefined,
    targetType: EnterpriseEntityType,
    targetId: string | undefined,
    description: string,
  ): void => {
    if (!sourceId || !targetId) return;
    addDerivedRelationship(
      relationships,
      type,
      { type: sourceType, id: sourceId },
      { type: targetType, id: targetId },
      description,
    );
  };

  organisation.people.forEach((person) => {
    derive('occupies', 'person', person.id, 'position', person.positionId, 'Person occupies this position.');
    person.teamIds.forEach((teamId) =>
      derive('member-of', 'person', person.id, 'team', teamId, 'Person is a member of this team.'));
  });

  organisation.positions.forEach((position) => {
    derive('performs', 'position', position.id, 'role', position.roleId, 'Position performs this role.');
    derive('member-of', 'position', position.id, 'department', position.departmentId, 'Position belongs to this department.');
    derive('reports-to', 'position', position.id, 'position', position.managerPositionId, 'Position reports to this position.');
    position.teamIds.forEach((teamId) =>
      derive('member-of', 'position', position.id, 'team', teamId, 'Position is assigned to this team.'));
  });
  organisation.roles.forEach((role) =>
    derive('member-of', 'role', role.id, 'department', role.departmentId, 'Role belongs to this department.'));
  organisation.teams.forEach((team) =>
    derive('member-of', 'team', team.id, 'department', team.departmentId, 'Team belongs to this department.'));
  organisation.departments.forEach((department) =>
    derive('part-of', 'department', department.id, 'department', department.parentDepartmentId, 'Department is part of this parent department.'));

  processGovernance.records.forEach((record) => {
    derive('owns', 'position', record.ownerPositionId, 'process', record.processId, 'Position owns this process.');
    derive('approves', 'position', record.approverPositionId, 'process', record.processId, 'Position approves this process.');
    record.systemIds.forEach((systemId) =>
      derive('uses', 'process', record.processId, 'system', systemId, 'Process uses this system.'));
    record.interfaceIds.forEach((interfaceId) =>
      derive('uses', 'process', record.processId, 'interface', interfaceId, 'Process uses this interface.'));
    record.regulationIds.forEach((regulationId) =>
      derive('subject-to', 'process', record.processId, 'regulation', regulationId, 'Process is subject to this regulation.'));
  });

  integrations.systems.forEach((system) =>
    derive('owns', 'position', system.ownerPositionId, 'system', system.id, 'Position owns this system.'));
  integrations.interfaces.forEach((item) => {
    derive('owns', 'position', item.ownerPositionId, 'interface', item.id, 'Position owns this interface.');
    derive('integrates-with', 'interface', item.id, 'system', item.sourceSystemId, 'Interface connects to its source system.');
    derive('integrates-with', 'interface', item.id, 'system', item.targetSystemId, 'Interface connects to its target system.');
  });

  dataCatalogue.dataObjects.forEach((dataObject) => {
    derive('owns', 'position', dataObject.businessOwnerPositionId, 'data-object', dataObject.id, 'Position is the business owner for this data.');
    derive('stewards', 'position', dataObject.dataStewardPositionId, 'data-object', dataObject.id, 'Position is the data steward.');
    derive('stores', 'system', dataObject.systemOfRecordId, 'data-object', dataObject.id, 'System is the system of record for this data.');
  });
  dataCatalogue.dataFlows.forEach((flow) => {
    derive('owns', 'position', flow.ownerPositionId, 'data-flow', flow.id, 'Position owns this data flow.');
    derive('uses', 'process', flow.processId, 'data-flow', flow.id, 'Process uses this data flow.');
    if (flow.processId && flow.processNodeId) {
      const processNodeId = `${flow.processId}:${flow.processNodeId}`;
      add('process-node', processNodeId, flow.processNodeId, 'BPMN Process Step');
      derive('uses', 'process-node', processNodeId, 'data-flow', flow.id, 'Process step uses this data flow.');
    }
    derive('transmits', 'system', flow.sourceSystemId, 'data-flow', flow.id, 'Source system sends this data flow.');
    derive('transmits', 'data-flow', flow.id, 'system', flow.targetSystemId, 'Data flow is delivered to this target system.');
    derive('implemented-by', 'data-flow', flow.id, 'interface', flow.interfaceId, 'Data flow uses this interface.');
    flow.dataObjectIds.forEach((dataObjectId) =>
      derive('transmits', 'data-flow', flow.id, 'data-object', dataObjectId, 'Data flow carries this data object.'));
  });

  regulations.regulations.forEach((regulation) =>
    derive('owns', 'position', regulation.ownerPositionId, 'regulation', regulation.id, 'Position owns regulatory oversight.'));
  governance.requirements.forEach((requirement) => {
    derive('contains', 'regulation', requirement.regulationId, 'requirement', requirement.id, 'Regulation contains this requirement.');
    derive('owns', 'position', requirement.ownerPositionId, 'requirement', requirement.id, 'Position owns this requirement.');
  });
  governance.businessRules.forEach((rule) =>
    derive('owns', 'position', rule.ownerPositionId, 'business-rule', rule.id, 'Position owns this business rule.'));
  governance.controls.forEach((control) =>
    derive('owns', 'position', control.ownerPositionId, 'control', control.id, 'Position owns this control.'));
  governance.risks.forEach((risk) =>
    derive('owns', 'position', risk.ownerPositionId, 'risk', risk.id, 'Position owns this risk.'));
  governance.policies.forEach((policy) =>
    derive('owns', 'position', policy.ownerPositionId, policy.policyType === 'standard' ? 'standard' : 'policy', policy.id, 'Position owns this policy or standard.'));

  return {
    entities: entities.sort((left, right) =>
      left.type.localeCompare(right.type) || left.name.localeCompare(right.name)
    ),
    relationships,
  };
}
