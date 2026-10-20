const MIGRATION_KEY = 'enterprise-modeler.reference-bank-seed.2026-10-20';

const KEYS = [
  'enterprise-modeler.process-layers.v1',
  'enterprise-modeler.process-catalog.v1',
  'enterprise-modeler.organisation.v2',
  'enterprise-modeler.organisation.v1',
  'enterprise-modeler.process-governance.v1',
  'enterprise-modeler.integrations.v1',
  'enterprise-modeler.regulations.v1',
  'enterprise-modeler.data-catalogue.v1',
  'enterprise-modeler.relationships.v1',
  'enterprise-modeler.governance-catalogue.v1',
  'enterprise-modeler.solution-architecture-bpmn.v1'
];

if (!localStorage.getItem(MIGRATION_KEY)) {
  for (const key of KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      localStorage.setItem(`${key}.pre-reference-bank-20261020`, value);
      localStorage.removeItem(key);
    }
  }

  Object.keys(localStorage)
    .filter((key) =>
      key.startsWith('enterprise-modeler.hierarchy.v2.')
      || key.startsWith('enterprise-modeler.metadata.v2.')
    )
    .forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        localStorage.setItem(`${key}.pre-reference-bank-20261020`, value);
        localStorage.removeItem(key);
      }
    });

  localStorage.setItem(MIGRATION_KEY, new Date().toISOString());
}
