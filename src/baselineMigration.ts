const MIGRATION_KEY = 'enterprise-modeler.baseline-migration.v1';

if (!localStorage.getItem(MIGRATION_KEY)) {
  localStorage.setItem(MIGRATION_KEY, new Date().toISOString());
}
