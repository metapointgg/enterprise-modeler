import type {
  BusinessRuleRecord,
  ControlRecord,
  GovernanceCatalogueData,
  PolicyRecord,
  RequirementRecord,
  RiskRecord,
} from './enterpriseModel';

const GOVERNANCE_CATALOGUE_URL = '/governance/governance-catalogue.json';
export const GOVERNANCE_CATALOGUE_AUTOSAVE_KEY = 'enterprise-modeler.governance-catalogue.v1';

function normaliseBusinessRule(value: Partial<BusinessRuleRecord>, index: number): BusinessRuleRecord {
  return {
    id: value.id || `business-rule-${index}`,
    name: value.name || `Business Rule ${index + 1}`,
    description: value.description || '',
    ruleType: value.ruleType || '',
    expression: value.expression || '',
    ownerPositionId: value.ownerPositionId || '',
    active: value.active !== false,
    notes: value.notes || '',
  };
}

function normaliseControl(value: Partial<ControlRecord>, index: number): ControlRecord {
  const allowed = new Set(['preventive', 'detective', 'corrective', 'directive', 'other']);
  return {
    id: value.id || `control-${index}`,
    name: value.name || `Control ${index + 1}`,
    description: value.description || '',
    controlType: allowed.has(value.controlType || '') ? value.controlType as ControlRecord['controlType'] : 'other',
    frequency: value.frequency || '',
    ownerPositionId: value.ownerPositionId || '',
    evidence: value.evidence || '',
    active: value.active !== false,
    notes: value.notes || '',
  };
}

function normaliseRisk(value: Partial<RiskRecord>, index: number): RiskRecord {
  return {
    id: value.id || `risk-${index}`,
    name: value.name || `Risk ${index + 1}`,
    description: value.description || '',
    category: value.category || '',
    likelihood: value.likelihood || '',
    impact: value.impact || '',
    ownerPositionId: value.ownerPositionId || '',
    active: value.active !== false,
    notes: value.notes || '',
  };
}

function normaliseRequirement(value: Partial<RequirementRecord>, index: number): RequirementRecord {
  return {
    id: value.id || `requirement-${index}`,
    regulationId: value.regulationId || '',
    name: value.name || `Requirement ${index + 1}`,
    description: value.description || '',
    sourceReference: value.sourceReference || '',
    ownerPositionId: value.ownerPositionId || '',
    active: value.active !== false,
    notes: value.notes || '',
  };
}

function normalisePolicy(value: Partial<PolicyRecord>, index: number): PolicyRecord {
  const allowed = new Set(['policy', 'standard', 'procedure', 'guideline']);
  return {
    id: value.id || `policy-${index}`,
    name: value.name || `Policy ${index + 1}`,
    description: value.description || '',
    policyType: allowed.has(value.policyType || '') ? value.policyType as PolicyRecord['policyType'] : 'policy',
    ownerPositionId: value.ownerPositionId || '',
    sourceReference: value.sourceReference || '',
    active: value.active !== false,
    notes: value.notes || '',
  };
}

function normalise(value: Partial<GovernanceCatalogueData>): GovernanceCatalogueData {
  return {
    schemaVersion: 1,
    businessRules: Array.isArray(value.businessRules) ? value.businessRules.map(normaliseBusinessRule) : [],
    controls: Array.isArray(value.controls) ? value.controls.map(normaliseControl) : [],
    risks: Array.isArray(value.risks) ? value.risks.map(normaliseRisk) : [],
    requirements: Array.isArray(value.requirements) ? value.requirements.map(normaliseRequirement) : [],
    policies: Array.isArray(value.policies) ? value.policies.map(normalisePolicy) : [],
  };
}

export async function loadGovernanceCatalogue(preferAutosave = true): Promise<GovernanceCatalogueData> {
  if (preferAutosave) {
    const saved = localStorage.getItem(GOVERNANCE_CATALOGUE_AUTOSAVE_KEY);
    if (saved) {
      try {
        return normalise(JSON.parse(saved) as Partial<GovernanceCatalogueData>);
      } catch (error) {
        console.warn('Unable to parse local governance catalogue.', error);
      }
    }
  }
  const response = await fetch(GOVERNANCE_CATALOGUE_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load governance catalogue. HTTP ${response.status}.`);
  return normalise(await response.json() as Partial<GovernanceCatalogueData>);
}

export function saveGovernanceCatalogueLocally(data: GovernanceCatalogueData): void {
  localStorage.setItem(GOVERNANCE_CATALOGUE_AUTOSAVE_KEY, JSON.stringify(normalise(data), null, 2));
  document.dispatchEvent(new CustomEvent('enterprise-modeler:governance-catalogue-changed'));
}
