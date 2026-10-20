import { initialiseAuthentication, mountAuthHeader } from './auth';
import { verifyAuthenticatedApi } from './apiClient';

async function bootstrap(): Promise<void> {
  const authContext = await initialiseAuthentication();

  const { installRepositoryTransport } = await import('./repositoryTransport');
  await installRepositoryTransport();

  await import('./baselineMigration');

  const { initialiseRepositoryLocalSync } = await import('./repositoryLocalSync');
  await initialiseRepositoryLocalSync();

  await import('./main');

  mountAuthHeader(authContext);

  const { initialiseRepositorySyncUi } = await import('./repositorySyncUi');
  await initialiseRepositorySyncUi();

  void verifyAuthenticatedApi();

  await import('./workspacePages');
  await import('./bpmnModelerRegistry');
  await import('./bpmnConnectionRouting');
  await import('./processManager');
  await import('./processContextPad');
  await import('./nodeMetadataBpmnLinks');
  await import('./processMapLinker');
  await import('./orgChartView');
  await import('./orgChartDiagram');
  await import('./orgChartUiRefinements');
  await import('./operatingUnitsManager');
  await import('./orgChartNavigation');
  await import('./workspaceUi');
  await import('./uiRefinements');
  await import('./navigationStructure');
  await import('./processDashboard');
  await import('./systemsCatalog');
  await import('./processRelationshipMap');
  await import('./processRelationshipOrthogonal');
  await import('./solutionArchitectureBpmn');
  await import('./solutionArchitectureZoomControls');
  await import('./integrationManager');
  await import('./regulationManager');
  await import('./dataCatalogueManager');
  await import('./governanceCatalogueManager');
  await import('./enterpriseExplorer');
  await import('./processEnterpriseContext');
  await import('./globalSearch');
  await import('./processDrillDownPicker');
  await import('./processVersions');
}

void bootstrap().catch((error) => {
  console.error('Enterprise Modeler failed to start.', error);
  document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:32px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a">
      <section style="max-width:620px;padding:28px;border:1px solid #fecaca;border-radius:12px;background:#fff">
        <h1 style="margin-top:0">Application startup failed</h1>
        <p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p>
      </section>
    </main>
  `;
});

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
