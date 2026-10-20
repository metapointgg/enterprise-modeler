export type EnterpriseEntityType =
  | 'process'
  | 'process-node'
  | 'person'
  | 'role'
  | 'position'
  | 'team'
  | 'department'
  | 'system'
  | 'interface'
  | 'data-object'
  | 'data-flow'
  | 'business-rule'
  | 'control'
  | 'risk'
  | 'regulation'
  | 'requirement'
  | 'policy'
  | 'standard'
  | 'asset'
  | 'location';

export interface EntityReference {
  type: EnterpriseEntityType;
  id: string;
}

export type RelationshipType =
  | 'owns'
  | 'stewards'
  | 'approves'
  | 'supports'
  | 'occupies'
  | 'member-of'
  | 'part-of'
  | 'performs'
  | 'manages'
  | 'reports-to'
  | 'uses'
  | 'depends-on'
  | 'reads'
  | 'creates'
  | 'updates'
  | 'deletes'
  | 'stores'
  | 'transmits'
  | 'contains'
  | 'integrates-with'
  | 'governed-by'
  | 'subject-to'
  | 'implements'
  | 'implemented-by'
  | 'controls'
  | 'mitigates'
  | 'impacts'
  | 'located-at'
  | 'related-to';

export interface EnterpriseRelationship {
  id: string;
  type: RelationshipType;
  source: EntityReference;
  target: EntityReference;
  description: string;
  ownerPositionId: string;
  active: boolean;
  notes: string;
}

export interface EnterpriseRelationshipData {
  schemaVersion: number;
  relationships: EnterpriseRelationship[];
}

export type DataClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'tbc';

export interface DataObjectRecord {
  id: string;
  name: string;
  description: string;
  domain: string;
  businessOwnerPositionId: string;
  dataStewardPositionId: string;
  classification: DataClassification;
  personalData: boolean;
  specialCategoryData: boolean;
  systemOfRecordId: string;
  retentionPeriod: string;
  dataResidency: string;
  criticality: 'low' | 'medium' | 'high';
  active: boolean;
  notes: string;
}

export interface DataFlowRecord {
  id: string;
  name: string;
  sourceSystemId: string;
  targetSystemId: string;
  dataObjectIds: string[];
  processId: string;
  processNodeId: string;
  interfaceId: string;
  direction: 'outbound' | 'inbound' | 'bidirectional';
  frequency: string;
  protocol: string;
  classification: DataClassification;
  encryption: string;
  purpose: string;
  ownerPositionId: string;
  active: boolean;
  notes: string;
}

export interface DataCatalogueData {
  schemaVersion: number;
  dataObjects: DataObjectRecord[];
  dataFlows: DataFlowRecord[];
}

export interface BusinessRuleRecord {
  id: string;
  name: string;
  description: string;
  ruleType: string;
  expression: string;
  ownerPositionId: string;
  active: boolean;
  notes: string;
}

export interface ControlRecord {
  id: string;
  name: string;
  description: string;
  controlType: 'preventive' | 'detective' | 'corrective' | 'directive' | 'other';
  frequency: string;
  ownerPositionId: string;
  evidence: string;
  active: boolean;
  notes: string;
}

export interface RiskRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  likelihood: string;
  impact: string;
  ownerPositionId: string;
  active: boolean;
  notes: string;
}

export interface RequirementRecord {
  id: string;
  regulationId: string;
  name: string;
  description: string;
  sourceReference: string;
  ownerPositionId: string;
  active: boolean;
  notes: string;
}

export interface PolicyRecord {
  id: string;
  name: string;
  description: string;
  policyType: 'policy' | 'standard' | 'procedure' | 'guideline';
  ownerPositionId: string;
  sourceReference: string;
  active: boolean;
  notes: string;
}

export interface GovernanceCatalogueData {
  schemaVersion: number;
  businessRules: BusinessRuleRecord[];
  controls: ControlRecord[];
  risks: RiskRecord[];
  requirements: RequirementRecord[];
  policies: PolicyRecord[];
}
