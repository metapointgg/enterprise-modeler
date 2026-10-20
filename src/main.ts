import BpmnModeler from 'bpmn-js/lib/Modeler';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

import './style.css';

import { OrganisationManager } from './organisationManager';
import {
  createEmptyOrganisation,
  exportOrganisationJson,
  getDepartmentName,
  getPersonDepartmentId,
  getPersonRoleId,
  getRoleName,
  loadOrganisation,
  resetOrganisationToRepository,
  saveOrganisationLocally,
  type OrganisationData,
  type Person,
} from './organisation';
import {
  PROCESS_BPMN_AUTOSAVE_PREFIX,
  PROCESS_CATALOG,
  PROCESS_LAYERS,
  PROCESS_METADATA_AUTOSAVE_PREFIX,
  ROOT_PROCESS_ID,
  findProcessByBpmnId,
  getProcessById,
  initialiseProcessRepository,
  type ProcessDefinition,
} from './processCatalog';

const EMPTY_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_EnterpriseModeler"
  targetNamespace="https://enterprise-modeler.local/bpmn">
  <bpmn:process id="Process_EnterpriseModeler" name="New Process" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_EnterpriseModeler">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="180" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

interface CanvasService {
  zoom(): number;
  zoom(scale: number | 'fit-viewport'): number;
  addMarker(elementId: string, marker: string): void;
}

interface CommandStackService {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

interface BpmnBusinessObject {
  id?: string;
  name?: string;
  $type?: string;
  calledElement?: string;
}

interface DiagramElement {
  id: string;
  businessObject?: BpmnBusinessObject;
}

interface ElementRegistryService {
  getAll(): DiagramElement[];
}

interface OverlayPosition {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

interface OverlaysService {
  clear(): void;
  add(
    elementId: string,
    config: {
      position: OverlayPosition;
      html: string;
    },
  ): string;
}

interface SaveXmlResult {
  xml?: string;
}

interface SaveSvgResult {
  svg?: string;
}

interface ElementDoubleClickEvent {
  element?: DiagramElement;
  originalEvent?: MouseEvent;
}

interface SelectionChangedEvent {
  newSelection?: DiagramElement[];
}

type ResponsibleType = '' | 'role' | 'team';
type ProcessLinkType = 'drill-down' | 'related' | 'exception' | 'supporting';

interface ProcessLink {
  id: string;
  type: ProcessLinkType;
  targetProcessId: string;
  label: string;
}

interface NodeMetadata {
  status: string;
  description: string;
  ownerPersonId: string;
  responsibleType: ResponsibleType;
  responsibleId: string;
  links: ProcessLink[];
  systems: string[];
  controls: string[];
  risks: string[];
  regulations: string[];
  notes: string;
}

interface LegacyNodeMetadata extends Partial<NodeMetadata> {
  owner?: string;
  role?: string;
}

interface ProcessMetadata {
  schemaVersion: number;
  processId: string;
  nodes: Record<string, NodeMetadata>;
}

interface RawProcessMetadata {
  schemaVersion?: number;
  processId?: string;
  nodes?: Record<string, LegacyNodeMetadata>;
}

interface OpenProcessEventDetail {
  processId?: string;
}

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Application root element #app was not found.');
}

app.innerHTML = `
  <div class="modeler-shell">
    <header class="application-header">
      <div class="application-brand">
        <div class="application-title">Enterprise Modeler</div>
        <div class="application-subtitle">Repository-backed hierarchical BPMN 2.0 modeler</div>
      </div>

      <div class="document-information">
        <span id="process-level" class="process-level">—</span>
        <span id="document-name" class="document-name">Initialising…</span>
      </div>
    </header>

    <div class="process-navigation">
      <button id="back-button" class="navigation-button" type="button">← Back</button>
      <div id="breadcrumbs" class="breadcrumbs"></div>
      <div class="navigation-hint">Double-click a ↘ process link or BPMN Call Activity to drill down</div>
    </div>

    <div class="toolbar">
      <div class="toolbar-group">
        <button id="new-button" class="toolbar-button" type="button">New</button>
        <button id="open-button" class="toolbar-button" type="button">Open</button>
        <button id="home-button" class="toolbar-button" type="button">Home Model</button>
        <button id="reset-button" class="toolbar-button" type="button">Reset Current</button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button id="save-button" class="toolbar-button toolbar-button-primary" type="button">Save BPMN</button>
        <button id="svg-button" class="toolbar-button" type="button">Export SVG</button>
        <button id="metadata-button" class="toolbar-button" type="button" aria-pressed="false">Metadata</button>
        <button id="organisation-button" class="toolbar-button" type="button">Organisation</button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button id="undo-button" class="toolbar-button" type="button">Undo</button>
        <button id="redo-button" class="toolbar-button" type="button">Redo</button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button id="zoom-out-button" class="toolbar-button toolbar-button-square" type="button" title="Zoom out">−</button>
        <button id="fit-button" class="toolbar-button" type="button">Fit</button>
        <button id="zoom-in-button" class="toolbar-button toolbar-button-square" type="button" title="Zoom in">+</button>
      </div>

      <div class="toolbar-spacer"></div>
      <div id="status" class="status">Initialising…</div>
    </div>

    <main class="modeler-workspace">
      <div id="canvas"></div>

      <aside id="metadata-panel" class="metadata-panel metadata-panel-hidden">
        <div class="metadata-header">
          <div>
            <div class="metadata-title">Node metadata</div>
            <div class="metadata-subtitle">Vendor-neutral Enterprise Modeler metadata</div>
          </div>
          <button id="metadata-close-button" class="metadata-close-button" type="button" title="Close metadata">×</button>
        </div>

        <div id="metadata-empty" class="metadata-empty">
          Select a BPMN element to view or edit its metadata.
        </div>

        <form id="metadata-form" class="metadata-form" hidden>
          <div class="metadata-identity">
            <div id="metadata-node-name" class="metadata-node-name"></div>
            <div id="metadata-node-type" class="metadata-node-type"></div>
          </div>

          <label class="metadata-field">
            <span>Element ID</span>
            <input id="metadata-node-id" type="text" readonly />
          </label>

          <label id="metadata-called-element-row" class="metadata-field" hidden>
            <span>BPMN called process</span>
            <input id="metadata-called-element" type="text" readonly />
          </label>

          <label class="metadata-field">
            <span>Status</span>
            <select id="metadata-status">
              <option value="">Not set</option>
              <option value="Draft">Draft</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Approved">Approved</option>
            </select>
          </label>

          <label class="metadata-field">
            <span>Description</span>
            <textarea id="metadata-description" rows="3"></textarea>
          </label>

          <label class="metadata-field">
            <span>Owner</span>
            <select id="metadata-owner">
              <option value="">Not set</option>
            </select>
          </label>

          <label class="metadata-field">
            <span>Responsible role / team</span>
            <select id="metadata-responsible">
              <option value="">Not set</option>
            </select>
          </label>

          <div class="process-links-panel">
            <div class="process-links-title">Linked processes</div>
            <div id="metadata-process-links" class="process-links-list"></div>

            <div class="process-link-add-grid">
              <select id="metadata-link-type" title="Link type">
                <option value="drill-down">Drill down</option>
                <option value="related">Related</option>
                <option value="exception">Exception</option>
                <option value="supporting">Supporting</option>
              </select>

              <select id="metadata-link-target" title="Target process">
                <option value="">Select process</option>
              </select>

              <input
                id="metadata-link-label"
                class="process-link-label-input"
                type="text"
                placeholder="Optional display label"
              />

              <button id="metadata-link-add" class="toolbar-button process-link-add-button" type="button">
                + Link Process
              </button>
            </div>
          </div>

          <label class="metadata-field">
            <span>Systems</span>
            <textarea id="metadata-systems" rows="3" placeholder="One per line"></textarea>
          </label>

          <label class="metadata-field">
            <span>Controls</span>
            <textarea id="metadata-controls" rows="3" placeholder="One per line"></textarea>
          </label>

          <label class="metadata-field">
            <span>Risks</span>
            <textarea id="metadata-risks" rows="3" placeholder="One per line"></textarea>
          </label>

          <label class="metadata-field">
            <span>Regulations / policies</span>
            <textarea id="metadata-regulations" rows="3" placeholder="One per line"></textarea>
          </label>

          <label class="metadata-field">
            <span>Notes</span>
            <textarea id="metadata-notes" rows="4"></textarea>
          </label>

          <div class="metadata-actions">
            <button class="toolbar-button toolbar-button-primary" type="submit">Save Metadata</button>
            <button id="metadata-export-button" class="toolbar-button" type="button">Export JSON</button>
            <button id="metadata-reset-button" class="toolbar-button" type="button">Reset Metadata</button>
          </div>

          <div class="metadata-help">
            BPMN Call Activities remain the portable semantic process relationship. Linked Processes add Enterprise Modeler navigation and related-process relationships without changing BPMN semantics.
          </div>
        </form>
      </aside>
    </main>

    <footer class="application-footer">
      <span>BPMN, metadata, process catalogue and organisation drafts are autosaved separately in this browser.</span>
      <span>Repository files remain the system of record.</span>
    </footer>

    <input
      id="file-input"
      type="file"
      accept=".bpmn,.xml,text/xml,application/xml"
      hidden
    />

    <dialog id="organisation-dialog" class="organisation-dialog">
      <div id="organisation-manager-root"></div>
    </dialog>
  </div>
`;

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Required element #${id} was not found.`);
  }
  return element as T;
}

const documentName = getElement<HTMLSpanElement>('document-name');
const processLevel = getElement<HTMLSpanElement>('process-level');
const breadcrumbs = getElement<HTMLDivElement>('breadcrumbs');
const statusElement = getElement<HTMLDivElement>('status');
const backButton = getElement<HTMLButtonElement>('back-button');
const newButton = getElement<HTMLButtonElement>('new-button');
const openButton = getElement<HTMLButtonElement>('open-button');
const homeButton = getElement<HTMLButtonElement>('home-button');
const resetButton = getElement<HTMLButtonElement>('reset-button');
const saveButton = getElement<HTMLButtonElement>('save-button');
const svgButton = getElement<HTMLButtonElement>('svg-button');
const metadataButton = getElement<HTMLButtonElement>('metadata-button');
const organisationButton = getElement<HTMLButtonElement>('organisation-button');
const undoButton = getElement<HTMLButtonElement>('undo-button');
const redoButton = getElement<HTMLButtonElement>('redo-button');
const zoomOutButton = getElement<HTMLButtonElement>('zoom-out-button');
const fitButton = getElement<HTMLButtonElement>('fit-button');
const zoomInButton = getElement<HTMLButtonElement>('zoom-in-button');
const fileInput = getElement<HTMLInputElement>('file-input');
const canvasContainer = getElement<HTMLDivElement>('canvas');

const metadataPanel = getElement<HTMLElement>('metadata-panel');
const metadataCloseButton = getElement<HTMLButtonElement>('metadata-close-button');
const metadataEmpty = getElement<HTMLDivElement>('metadata-empty');
const metadataForm = getElement<HTMLFormElement>('metadata-form');
const metadataNodeName = getElement<HTMLDivElement>('metadata-node-name');
const metadataNodeType = getElement<HTMLDivElement>('metadata-node-type');
const metadataNodeId = getElement<HTMLInputElement>('metadata-node-id');
const metadataCalledElementRow = getElement<HTMLElement>('metadata-called-element-row');
const metadataCalledElement = getElement<HTMLInputElement>('metadata-called-element');
const metadataStatus = getElement<HTMLSelectElement>('metadata-status');
const metadataDescription = getElement<HTMLTextAreaElement>('metadata-description');
const metadataOwner = getElement<HTMLSelectElement>('metadata-owner');
const metadataResponsible = getElement<HTMLSelectElement>('metadata-responsible');
const metadataProcessLinks = getElement<HTMLDivElement>('metadata-process-links');
const metadataLinkType = getElement<HTMLSelectElement>('metadata-link-type');
const metadataLinkTarget = getElement<HTMLSelectElement>('metadata-link-target');
const metadataLinkLabel = getElement<HTMLInputElement>('metadata-link-label');
const metadataLinkAdd = getElement<HTMLButtonElement>('metadata-link-add');
const metadataSystems = getElement<HTMLTextAreaElement>('metadata-systems');
const metadataControls = getElement<HTMLTextAreaElement>('metadata-controls');
const metadataRisks = getElement<HTMLTextAreaElement>('metadata-risks');
const metadataRegulations = getElement<HTMLTextAreaElement>('metadata-regulations');
const metadataNotes = getElement<HTMLTextAreaElement>('metadata-notes');
const metadataExportButton = getElement<HTMLButtonElement>('metadata-export-button');
const metadataResetButton = getElement<HTMLButtonElement>('metadata-reset-button');

const organisationDialog = getElement<HTMLDialogElement>('organisation-dialog');
const organisationManagerRoot = getElement<HTMLDivElement>('organisation-manager-root');

const modeler = new BpmnModeler({
  container: canvasContainer,
  keyboard: {
    bindTo: window,
  },
});

let currentProcessId: string | null = null;
let currentFilename = 'new-process.bpmn';
let autosaveTimer: number | undefined;
let diagramIsLoading = false;
let diagramHasLoaded = false;
let metadataPanelVisible = false;
let selectedElement: DiagramElement | null = null;
let currentMetadata = createEmptyMetadata('Process_Custom');
let currentOrganisation: OrganisationData = createEmptyOrganisation();

const organisationManager = new OrganisationManager(
  organisationManagerRoot,
  currentOrganisation,
  {
    onChange: (data) => {
      currentOrganisation = data;
      saveOrganisationLocally(currentOrganisation);
      renderMetadataPanel();
      setStatus('Organisation changes saved locally', 'success');
    },
    onExport: (data) => {
      exportOrganisationJson(data);
      setStatus('Organisation JSON downloaded', 'success');
    },
    onReset: async () => {
      const data = await resetOrganisationToRepository();
      currentOrganisation = data;
      renderMetadataPanel();
      setStatus('Organisation reset to repository version', 'success');
      return data;
    },
    onClose: () => organisationDialog.close(),
  },
);

function createEmptyNodeMetadata(): NodeMetadata {
  return {
    status: '',
    description: '',
    ownerPersonId: '',
    responsibleType: '',
    responsibleId: '',
    links: [],
    systems: [],
    controls: [],
    risks: [],
    regulations: [],
    notes: '',
  };
}

function normaliseProcessLink(value: Partial<ProcessLink>): ProcessLink | null {
  const type = value.type;
  if (
    type !== 'drill-down' &&
    type !== 'related' &&
    type !== 'exception' &&
    type !== 'supporting'
  ) {
    return null;
  }

  const targetProcessId = value.targetProcessId?.trim() ?? '';
  if (!targetProcessId) {
    return null;
  }

  return {
    id: value.id || `link-${crypto.randomUUID()}`,
    type,
    targetProcessId,
    label: value.label?.trim() ?? '',
  };
}

function normaliseNodeMetadata(value: LegacyNodeMetadata | undefined): NodeMetadata {
  const empty = createEmptyNodeMetadata();
  if (!value) {
    return empty;
  }

  const links = Array.isArray(value.links)
    ? value.links
        .map((link) => normaliseProcessLink(link))
        .filter((link): link is ProcessLink => Boolean(link))
    : [];

  return {
    status: value.status ?? '',
    description: value.description ?? '',
    ownerPersonId: value.ownerPersonId ?? '',
    responsibleType: value.responsibleType === 'role' || value.responsibleType === 'team'
      ? value.responsibleType
      : '',
    responsibleId: value.responsibleId ?? '',
    links,
    systems: Array.isArray(value.systems) ? value.systems : [],
    controls: Array.isArray(value.controls) ? value.controls : [],
    risks: Array.isArray(value.risks) ? value.risks : [],
    regulations: Array.isArray(value.regulations) ? value.regulations : [],
    notes: value.notes ?? '',
  };
}

function normaliseProcessMetadata(value: RawProcessMetadata, processId: string): ProcessMetadata {
  const nodes = Object.fromEntries(
    Object.entries(value.nodes ?? {}).map(([elementId, metadata]) => [
      elementId,
      normaliseNodeMetadata(metadata),
    ]),
  );

  return {
    schemaVersion: 3,
    processId: value.processId || processId,
    nodes,
  };
}

function createEmptyMetadata(processId: string): ProcessMetadata {
  return {
    schemaVersion: 3,
    processId,
    nodes: {},
  };
}

function setStatus(
  message: string,
  type: 'normal' | 'success' | 'error' = 'normal',
): void {
  statusElement.textContent = message;
  statusElement.classList.remove('status-success', 'status-error');

  if (type === 'success') {
    statusElement.classList.add('status-success');
  } else if (type === 'error') {
    statusElement.classList.add('status-error');
  }
}

function normaliseBpmnFilename(filename: string): string {
  const trimmed = filename.trim();
  if (!trimmed) {
    return 'process.bpmn';
  }
  if (/\.(bpmn|xml)$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}.bpmn`;
}

function getSvgFilename(filename: string): string {
  return filename.replace(/\.(bpmn|xml)$/i, '') + '.svg';
}

function getMetadataFilename(): string {
  const currentProcess = getCurrentProcess();
  return currentProcess
    ? `${currentProcess.id}.json`
    : currentFilename.replace(/\.(bpmn|xml)$/i, '') + '.json';
}

function downloadFile(filename: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

function getCanvas(): CanvasService {
  return modeler.get('canvas') as unknown as CanvasService;
}

function getCommandStack(): CommandStackService {
  return modeler.get('commandStack') as unknown as CommandStackService;
}

function getElementRegistry(): ElementRegistryService {
  return modeler.get('elementRegistry') as unknown as ElementRegistryService;
}

function getOverlays(): OverlaysService {
  return modeler.get('overlays') as unknown as OverlaysService;
}

function getCurrentProcess(): ProcessDefinition | null {
  return getProcessById(currentProcessId ?? undefined) ?? null;
}

function getCalledProcess(element: DiagramElement): ProcessDefinition | null {
  const businessObject = element.businessObject;
  if (businessObject?.$type !== 'bpmn:CallActivity' || !businessObject.calledElement) {
    return null;
  }
  return findProcessByBpmnId(businessObject.calledElement) ?? null;
}

function getNodeMetadata(elementId: string): NodeMetadata {
  return currentMetadata.nodes[elementId] ?? createEmptyNodeMetadata();
}

function getMetadataDrillDownProcess(elementId: string): ProcessDefinition | null {
  const metadata = getNodeMetadata(elementId);
  const link = metadata.links.find(
    (candidate) => candidate.type === 'drill-down' && getProcessById(candidate.targetProcessId)?.active,
  );
  return link ? (getProcessById(link.targetProcessId) ?? null) : null;
}

function getPrimaryDrillDownProcess(element: DiagramElement): ProcessDefinition | null {
  return getCalledProcess(element) ?? getMetadataDrillDownProcess(element.id);
}

function getProcessAncestry(process: ProcessDefinition): ProcessDefinition[] {
  const result: ProcessDefinition[] = [process];
  let parentId = process.parentId;
  const seen = new Set<string>([process.id]);

  while (parentId && !seen.has(parentId)) {
    const parent = getProcessById(parentId);
    if (!parent) {
      break;
    }
    seen.add(parent.id);
    result.unshift(parent);
    parentId = parent.parentId;
  }

  return result;
}

function renderNavigation(): void {
  breadcrumbs.replaceChildren();
  const currentProcess = getCurrentProcess();

  if (!currentProcess) {
    processLevel.textContent = 'Custom';
    documentName.textContent = currentFilename;
    backButton.disabled = true;
    resetButton.disabled = true;

    const customLabel = document.createElement('span');
    customLabel.className = 'breadcrumb-current';
    customLabel.textContent = currentFilename;
    breadcrumbs.appendChild(customLabel);
    return;
  }

  processLevel.textContent = currentProcess.level;
  documentName.textContent = currentProcess.name;
  backButton.disabled = !currentProcess.parentId;
  resetButton.disabled = false;

  getProcessAncestry(currentProcess).forEach((process, index) => {
    if (index > 0) {
      const separator = document.createElement('span');
      separator.className = 'breadcrumb-separator';
      separator.textContent = '›';
      breadcrumbs.appendChild(separator);
    }

    if (process.id === currentProcess.id) {
      const current = document.createElement('span');
      current.className = 'breadcrumb-current';
      current.textContent = `${process.level} ${process.name}`;
      breadcrumbs.appendChild(current);
      return;
    }

    const button = document.createElement('button');
    button.className = 'breadcrumb-button';
    button.type = 'button';
    button.textContent = `${process.level} ${process.name}`;
    button.addEventListener('click', () => void loadCatalogProcess(process.id));
    breadcrumbs.appendChild(button);
  });
}

function updateHistoryButtons(): void {
  const commandStack = getCommandStack();
  undoButton.disabled = !commandStack.canUndo();
  redoButton.disabled = !commandStack.canRedo();
}

function fitDiagram(): void {
  try {
    getCanvas().zoom('fit-viewport');
  } catch (error) {
    console.error('Unable to fit BPMN diagram to viewport.', error);
  }
}

function zoomDiagram(delta: number): void {
  const canvas = getCanvas();
  const currentZoom = canvas.zoom();
  canvas.zoom(Math.max(0.2, Math.min(4, currentZoom + delta)));
}

function getAutosaveXmlKey(processId = currentProcessId): string {
  return processId
    ? `${PROCESS_BPMN_AUTOSAVE_PREFIX}${processId}.xml`
    : `${PROCESS_BPMN_AUTOSAVE_PREFIX}custom.xml`;
}

function getAutosaveFilenameKey(processId = currentProcessId): string {
  return processId
    ? `${PROCESS_BPMN_AUTOSAVE_PREFIX}${processId}.filename`
    : `${PROCESS_BPMN_AUTOSAVE_PREFIX}custom.filename`;
}

function getMetadataAutosaveKey(processId = currentProcessId): string {
  return processId
    ? `${PROCESS_METADATA_AUTOSAVE_PREFIX}${processId}`
    : `${PROCESS_METADATA_AUTOSAVE_PREFIX}custom`;
}

function applyProcessIndicators(): void {
  if (!diagramHasLoaded) {
    return;
  }

  const overlays = getOverlays();
  overlays.clear();

  const canvas = getCanvas();
  const elementRegistry = getElementRegistry();

  elementRegistry.getAll().forEach((element) => {
    const primary = getPrimaryDrillDownProcess(element);
    const metadata = getNodeMetadata(element.id);
    const validLinks = metadata.links.filter((link) => getProcessById(link.targetProcessId));

    if (primary) {
      canvas.addMarker(element.id, 'drill-down-target');
      overlays.add(element.id, {
        position: { top: -30, right: 0 },
        html: `<div class="drill-down-badge" title="Open ${escapeHtml(primary.name)}">↘ ${escapeHtml(primary.level)}</div>`,
      });
    }

    const relatedCount = validLinks.filter((link) => {
      return !(link.type === 'drill-down' && primary?.id === link.targetProcessId);
    }).length;

    if (relatedCount > 0) {
      overlays.add(element.id, {
        position: { bottom: -26, right: 0 },
        html: `<div class="process-link-badge" title="${relatedCount} additional linked process${relatedCount === 1 ? '' : 'es'}">↗ ${relatedCount}</div>`,
      });
    }
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setMetadataPanelVisible(visible: boolean): void {
  metadataPanelVisible = visible;
  metadataPanel.classList.toggle('metadata-panel-hidden', !visible);
  metadataButton.classList.toggle('toolbar-button-active', visible);
  metadataButton.setAttribute('aria-pressed', String(visible));
  window.setTimeout(() => fitDiagram(), 0);
}

function formatBpmnType(type: string | undefined): string {
  if (!type) {
    return 'BPMN element';
  }
  return type
    .replace(/^bpmn:/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

function linesToArray(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function arrayToLines(value: string[] | undefined): string {
  return (value ?? []).join('\n');
}

function getPersonDisplayName(person: Person): string {
  const details = [
    getRoleName(currentOrganisation, getPersonRoleId(currentOrganisation, person)),
    getDepartmentName(currentOrganisation, getPersonDepartmentId(currentOrganisation, person)),
  ].filter(Boolean);

  return details.length > 0
    ? `${person.name} — ${details.join(' · ')}`
    : person.name;
}

function populateOwnerOptions(selectedPersonId: string): void {
  metadataOwner.replaceChildren(new Option('Not set', ''));

  const people = [...currentOrganisation.people]
    .filter((person) => person.active)
    .sort((left, right) => left.name.localeCompare(right.name));

  people.forEach((person) => {
    metadataOwner.add(new Option(getPersonDisplayName(person), person.id));
  });

  if (selectedPersonId && !people.some((person) => person.id === selectedPersonId)) {
    metadataOwner.add(new Option(`[Missing or inactive person] ${selectedPersonId}`, selectedPersonId));
  }

  metadataOwner.value = selectedPersonId;
}

function getResponsibleValue(metadata: NodeMetadata): string {
  return metadata.responsibleType && metadata.responsibleId
    ? `${metadata.responsibleType}:${metadata.responsibleId}`
    : '';
}

function populateResponsibleOptions(metadata: NodeMetadata): void {
  metadataResponsible.replaceChildren(new Option('Not set', ''));

  const rolesGroup = document.createElement('optgroup');
  rolesGroup.label = 'Roles';
  [...currentOrganisation.roles]
    .sort((left, right) => left.name.localeCompare(right.name))
    .forEach((role) => {
      const department = getDepartmentName(currentOrganisation, role.departmentId);
      rolesGroup.appendChild(new Option(
        department ? `${role.name} — ${department}` : role.name,
        `role:${role.id}`,
      ));
    });

  const teamsGroup = document.createElement('optgroup');
  teamsGroup.label = 'Teams';
  [...currentOrganisation.teams]
    .sort((left, right) => left.name.localeCompare(right.name))
    .forEach((team) => {
      const department = getDepartmentName(currentOrganisation, team.departmentId);
      teamsGroup.appendChild(new Option(
        department ? `${team.name} — ${department}` : team.name,
        `team:${team.id}`,
      ));
    });

  if (rolesGroup.children.length > 0) {
    metadataResponsible.appendChild(rolesGroup);
  }
  if (teamsGroup.children.length > 0) {
    metadataResponsible.appendChild(teamsGroup);
  }

  const selectedValue = getResponsibleValue(metadata);
  if (selectedValue && !Array.from(metadataResponsible.options).some((option) => option.value === selectedValue)) {
    metadataResponsible.add(new Option(`[Missing reference] ${selectedValue}`, selectedValue));
  }

  metadataResponsible.value = selectedValue;
}

function parseResponsibleValue(value: string): { type: ResponsibleType; id: string } {
  if (!value) {
    return { type: '', id: '' };
  }

  const separatorIndex = value.indexOf(':');
  if (separatorIndex < 1) {
    return { type: '', id: '' };
  }

  const type = value.slice(0, separatorIndex);
  const id = value.slice(separatorIndex + 1);

  if ((type !== 'role' && type !== 'team') || !id) {
    return { type: '', id: '' };
  }

  return { type, id };
}

function getProcessLinkTypeLabel(type: ProcessLinkType): string {
  switch (type) {
    case 'drill-down':
      return 'Drill down';
    case 'exception':
      return 'Exception';
    case 'supporting':
      return 'Supporting';
    case 'related':
    default:
      return 'Related';
  }
}

function populateProcessLinkTargets(): void {
  metadataLinkTarget.replaceChildren(new Option('Select process', ''));

  const activeLayers = [...PROCESS_LAYERS]
    .filter((layer) => layer.active)
    .sort((left, right) => left.sequence - right.sequence);

  const activeProcesses = Object.values(PROCESS_CATALOG)
    .filter((process) => process.active && process.id !== currentProcessId);

  activeLayers.forEach((layer) => {
    const processes = activeProcesses
      .filter((process) => process.layerId === layer.id)
      .sort((left, right) => left.name.localeCompare(right.name));

    if (processes.length === 0) {
      return;
    }

    const group = document.createElement('optgroup');
    group.label = `${layer.code} — ${layer.name}`;
    processes.forEach((process) => {
      group.appendChild(new Option(process.name, process.id));
    });
    metadataLinkTarget.appendChild(group);
  });

  const unlayered = activeProcesses
    .filter((process) => !PROCESS_LAYERS.some((layer) => layer.id === process.layerId))
    .sort((left, right) => left.name.localeCompare(right.name));

  if (unlayered.length > 0) {
    const group = document.createElement('optgroup');
    group.label = 'Unlayered';
    unlayered.forEach((process) => group.appendChild(new Option(process.name, process.id)));
    metadataLinkTarget.appendChild(group);
  }
}

function renderProcessLinks(metadata: NodeMetadata): void {
  metadataProcessLinks.replaceChildren();

  if (metadata.links.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'organisation-muted';
    empty.textContent = 'No linked processes.';
    metadataProcessLinks.appendChild(empty);
  } else {
    metadata.links.forEach((link) => {
      const target = getProcessById(link.targetProcessId);
      const row = document.createElement('div');
      row.className = 'process-link-row';

      const copy = document.createElement('div');
      copy.className = 'process-link-copy';
      copy.innerHTML = `
        <div class="process-link-primary">
          ${escapeHtml(getProcessLinkTypeLabel(link.type))} → ${escapeHtml(target?.name ?? link.targetProcessId)}
        </div>
        <div class="process-link-secondary">
          ${escapeHtml(target?.level ?? 'Missing process')}${link.label ? ` · ${escapeHtml(link.label)}` : ''}
        </div>
      `;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'process-link-remove';
      remove.textContent = 'Remove';
      remove.dataset.processLinkId = link.id;
      remove.addEventListener('click', () => removeProcessLink(link.id));

      row.append(copy, remove);
      metadataProcessLinks.appendChild(row);
    });
  }

  populateProcessLinkTargets();
}

function renderMetadataPanel(): void {
  if (!selectedElement) {
    metadataEmpty.hidden = false;
    metadataForm.hidden = true;
    return;
  }

  const businessObject = selectedElement.businessObject;
  const metadata = getNodeMetadata(selectedElement.id);

  metadataEmpty.hidden = true;
  metadataForm.hidden = false;
  metadataNodeName.textContent = businessObject?.name || selectedElement.id;
  metadataNodeType.textContent = formatBpmnType(businessObject?.$type);
  metadataNodeId.value = selectedElement.id;

  if (businessObject?.calledElement) {
    metadataCalledElementRow.hidden = false;
    metadataCalledElement.value = businessObject.calledElement;
  } else {
    metadataCalledElementRow.hidden = true;
    metadataCalledElement.value = '';
  }

  metadataStatus.value = metadata.status;
  metadataDescription.value = metadata.description;
  populateOwnerOptions(metadata.ownerPersonId);
  populateResponsibleOptions(metadata);
  renderProcessLinks(metadata);
  metadataSystems.value = arrayToLines(metadata.systems);
  metadataControls.value = arrayToLines(metadata.controls);
  metadataRisks.value = arrayToLines(metadata.risks);
  metadataRegulations.value = arrayToLines(metadata.regulations);
  metadataNotes.value = metadata.notes;
}

function persistMetadataLocally(): void {
  localStorage.setItem(
    getMetadataAutosaveKey(),
    JSON.stringify(currentMetadata, null, 2),
  );
}

function saveSelectedMetadata(showStatus = true): void {
  if (!selectedElement) {
    return;
  }

  const responsible = parseResponsibleValue(metadataResponsible.value);
  const existing = getNodeMetadata(selectedElement.id);

  currentMetadata.nodes[selectedElement.id] = {
    status: metadataStatus.value,
    description: metadataDescription.value.trim(),
    ownerPersonId: metadataOwner.value,
    responsibleType: responsible.type,
    responsibleId: responsible.id,
    links: existing.links,
    systems: linesToArray(metadataSystems.value),
    controls: linesToArray(metadataControls.value),
    risks: linesToArray(metadataRisks.value),
    regulations: linesToArray(metadataRegulations.value),
    notes: metadataNotes.value.trim(),
  };

  persistMetadataLocally();
  applyProcessIndicators();

  if (showStatus) {
    setStatus('Metadata saved locally', 'success');
  }
}

function addProcessLink(): void {
  if (!selectedElement) {
    return;
  }

  const targetProcessId = metadataLinkTarget.value;
  const type = metadataLinkType.value as ProcessLinkType;

  if (!targetProcessId || !getProcessById(targetProcessId)) {
    window.alert('Select a target process.');
    return;
  }

  saveSelectedMetadata(false);
  const metadata = getNodeMetadata(selectedElement.id);

  if (
    type === 'drill-down' &&
    metadata.links.some((link) => link.type === 'drill-down')
  ) {
    if (!window.confirm('This node already has a metadata drill-down link. Add another drill-down relationship?')) {
      return;
    }
  }

  metadata.links.push({
    id: `link-${crypto.randomUUID()}`,
    type,
    targetProcessId,
    label: metadataLinkLabel.value.trim(),
  });

  currentMetadata.nodes[selectedElement.id] = metadata;
  persistMetadataLocally();
  metadataLinkLabel.value = '';
  renderMetadataPanel();
  applyProcessIndicators();
  setStatus('Process link saved locally', 'success');
}

function removeProcessLink(linkId: string): void {
  if (!selectedElement) {
    return;
  }

  saveSelectedMetadata(false);
  const metadata = getNodeMetadata(selectedElement.id);
  metadata.links = metadata.links.filter((link) => link.id !== linkId);
  currentMetadata.nodes[selectedElement.id] = metadata;
  persistMetadataLocally();
  renderMetadataPanel();
  applyProcessIndicators();
  setStatus('Process link removed', 'success');
}

function exportMetadata(): void {
  downloadFile(
    getMetadataFilename(),
    `${JSON.stringify(currentMetadata, null, 2)}\n`,
    'application/json;charset=utf-8',
  );
  setStatus('Metadata JSON downloaded', 'success');
}

async function fetchRepositoryMetadata(process: ProcessDefinition): Promise<ProcessMetadata> {
  const response = await fetch(process.metadataUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load metadata for ${process.name}. HTTP ${response.status}.`);
  }
  const parsed = await response.json() as RawProcessMetadata;
  return normaliseProcessMetadata(parsed, process.bpmnProcessId);
}

async function loadMetadataForProcess(
  process: ProcessDefinition,
  preferAutosave: boolean,
): Promise<ProcessMetadata> {
  if (preferAutosave) {
    const autosaved = localStorage.getItem(getMetadataAutosaveKey(process.id));
    if (autosaved) {
      try {
        return normaliseProcessMetadata(
          JSON.parse(autosaved) as RawProcessMetadata,
          process.bpmnProcessId,
        );
      } catch (error) {
        console.warn('Unable to parse locally saved metadata; repository metadata will be used.', error);
      }
    }
  }

  try {
    return await fetchRepositoryMetadata(process);
  } catch (error) {
    console.warn('Unable to load repository metadata; using an empty metadata record.', error);
    return createEmptyMetadata(process.bpmnProcessId);
  }
}

async function resetCurrentMetadata(): Promise<void> {
  const currentProcess = getCurrentProcess();
  const label = currentProcess
    ? `${currentProcess.level} ${currentProcess.name}`
    : 'the current custom process';

  if (!window.confirm(
    `Reset all metadata for ${label} to the repository version? Any locally saved metadata changes for this process will be discarded.`,
  )) {
    return;
  }

  if (!currentProcess) {
    currentMetadata = createEmptyMetadata('Process_Custom');
    selectedElement = null;
    localStorage.removeItem(getMetadataAutosaveKey());
    renderMetadataPanel();
    applyProcessIndicators();
    setStatus('Custom metadata cleared', 'success');
    return;
  }

  localStorage.removeItem(getMetadataAutosaveKey(currentProcess.id));
  currentMetadata = await loadMetadataForProcess(currentProcess, false);
  renderMetadataPanel();
  applyProcessIndicators();
  setStatus(`${currentProcess.level} metadata reset to repository version`, 'success');
}

async function persistCurrentDiagram(): Promise<void> {
  if (diagramIsLoading || !diagramHasLoaded) {
    return;
  }

  try {
    const result = (await modeler.saveXML({ format: true })) as SaveXmlResult;
    if (!result.xml) {
      throw new Error('bpmn-js returned no XML while autosaving.');
    }

    localStorage.setItem(getAutosaveXmlKey(), result.xml);
    localStorage.setItem(getAutosaveFilenameKey(), currentFilename);
    setStatus('Saved locally', 'success');
  } catch (error) {
    console.error('Unable to autosave BPMN diagram.', error);
    setStatus('Autosave failed', 'error');
  }
}

function scheduleAutosave(): void {
  if (diagramIsLoading) {
    return;
  }

  if (autosaveTimer !== undefined) {
    window.clearTimeout(autosaveTimer);
  }

  setStatus('Unsaved changes');
  autosaveTimer = window.setTimeout(() => void persistCurrentDiagram(), 500);
}

async function importDiagram(xml: string, filename: string): Promise<void> {
  diagramIsLoading = true;
  currentFilename = normaliseBpmnFilename(filename);
  selectedElement = null;
  renderNavigation();
  renderMetadataPanel();
  setStatus('Loading process…');

  try {
    const result = await modeler.importXML(xml);
    diagramHasLoaded = true;
    fitDiagram();
    updateHistoryButtons();
    applyProcessIndicators();

    const warningCount = result.warnings?.length ?? 0;
    if (warningCount > 0) {
      console.warn('BPMN import warnings:', result.warnings);
      setStatus(`Loaded with ${warningCount} warning${warningCount === 1 ? '' : 's'}`);
    } else {
      setStatus('Process loaded', 'success');
    }
  } catch (error) {
    diagramHasLoaded = false;
    console.error('Unable to import BPMN diagram.', error);
    setStatus('Unable to load BPMN process', 'error');
    throw error;
  } finally {
    diagramIsLoading = false;
  }
}

async function fetchProcessXml(process: ProcessDefinition): Promise<string> {
  const response = await fetch(process.url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load ${process.name}. HTTP ${response.status}.`);
  }
  return response.text();
}

async function loadCatalogProcess(
  processId: string,
  preferAutosave = true,
): Promise<void> {
  const process = getProcessById(processId);

  if (!process) {
    setStatus(`Unknown process: ${processId}`, 'error');
    return;
  }

  if (diagramHasLoaded && currentProcessId !== processId) {
    await persistCurrentDiagram();
  }

  if (autosaveTimer !== undefined) {
    window.clearTimeout(autosaveTimer);
    autosaveTimer = undefined;
  }

  currentProcessId = process.id;
  currentFilename = process.filename;
  selectedElement = null;
  currentMetadata = await loadMetadataForProcess(process, preferAutosave);
  renderNavigation();
  renderMetadataPanel();
  setStatus(`Loading ${process.level} ${process.name}…`);

  try {
    const autosavedXml = preferAutosave
      ? localStorage.getItem(getAutosaveXmlKey())
      : null;

    if (autosavedXml) {
      await importDiagram(autosavedXml, process.filename);
      setStatus(`Restored ${process.level} ${process.name} from local autosave`, 'success');
      return;
    }

    const xml = await fetchProcessXml(process);
    await importDiagram(xml, process.filename);
  } catch (error) {
    console.error(`Unable to load process ${process.id}.`, error);
    setStatus(`Unable to load ${process.name}`, 'error');
  }
}

async function resetCurrentProcess(): Promise<void> {
  const currentProcess = getCurrentProcess();
  if (!currentProcess) {
    return;
  }

  if (!window.confirm(
    `Reset ${currentProcess.level} ${currentProcess.name} to the repository BPMN? Local diagram changes will be discarded.`,
  )) {
    return;
  }

  localStorage.removeItem(getAutosaveXmlKey());
  localStorage.removeItem(getAutosaveFilenameKey());
  await loadCatalogProcess(currentProcess.id, false);
  setStatus(`${currentProcess.level} ${currentProcess.name} reset to repository version`, 'success');
}

async function createNewDiagram(): Promise<void> {
  await persistCurrentDiagram();
  currentProcessId = null;
  currentFilename = 'new-process.bpmn';
  currentMetadata = createEmptyMetadata('Process_Custom');
  selectedElement = null;
  renderNavigation();
  renderMetadataPanel();

  try {
    await importDiagram(EMPTY_BPMN_XML, currentFilename);
  } catch (error) {
    console.error('Unable to create new BPMN process.', error);
  }
}

async function saveBpmnFile(): Promise<void> {
  setStatus('Preparing BPMN…');

  try {
    const result = (await modeler.saveXML({ format: true })) as SaveXmlResult;
    if (!result.xml) {
      throw new Error('bpmn-js returned no XML.');
    }

    downloadFile(
      normaliseBpmnFilename(currentFilename),
      result.xml,
      'application/xml;charset=utf-8',
    );

    await persistCurrentDiagram();
    setStatus('BPMN downloaded', 'success');
  } catch (error) {
    console.error('Unable to save BPMN file.', error);
    setStatus('Unable to save BPMN', 'error');
  }
}

async function saveSvgFile(): Promise<void> {
  setStatus('Preparing SVG…');

  try {
    const result = (await modeler.saveSVG()) as SaveSvgResult;
    if (!result.svg) {
      throw new Error('bpmn-js returned no SVG.');
    }

    downloadFile(
      getSvgFilename(currentFilename),
      result.svg,
      'image/svg+xml;charset=utf-8',
    );
    setStatus('SVG downloaded', 'success');
  } catch (error) {
    console.error('Unable to export SVG.', error);
    setStatus('Unable to export SVG', 'error');
  }
}

async function openSelectedFile(file: File): Promise<void> {
  await persistCurrentDiagram();
  currentProcessId = null;
  currentFilename = file.name;
  currentMetadata = createEmptyMetadata('Process_Custom');
  selectedElement = null;
  renderNavigation();
  renderMetadataPanel();
  setStatus(`Opening ${file.name}…`);

  try {
    const xml = await file.text();
    await importDiagram(xml, file.name);
  } catch (error) {
    console.error(`Unable to open ${file.name}.`, error);
    setStatus(`Unable to open ${file.name}`, 'error');
  }
}

function navigateBack(): void {
  const currentProcess = getCurrentProcess();
  if (currentProcess?.parentId) {
    void loadCatalogProcess(currentProcess.parentId);
  }
}

function handleElementDoubleClick(event: ElementDoubleClickEvent): void {
  if (!event.element) {
    return;
  }

  const target = getPrimaryDrillDownProcess(event.element);
  if (!target) {
    return;
  }

  event.originalEvent?.preventDefault();
  event.originalEvent?.stopPropagation();
  void loadCatalogProcess(target.id);
}

function handleSelectionChanged(event: SelectionChangedEvent): void {
  selectedElement = event.newSelection?.[0] ?? null;
  renderMetadataPanel();

  const businessObject = selectedElement?.businessObject;
  document.dispatchEvent(new CustomEvent('enterprise-modeler:process-node-selection-changed', {
    detail: selectedElement
      ? {
          processId: currentProcessId ?? '',
          elementId: selectedElement.id,
          name: businessObject?.name || selectedElement.id,
          bpmnType: businessObject?.$type || '',
        }
      : null,
  }));
}

function openOrganisationManager(): void {
  organisationManager.setData(currentOrganisation);
  if (!organisationDialog.open) {
    organisationDialog.showModal();
  }
}

function handleProcessRepositoryChanged(): void {
  renderNavigation();
  renderMetadataPanel();
  applyProcessIndicators();
}

function handleOpenProcessEvent(event: Event): void {
  const detail = (event as CustomEvent<OpenProcessEventDetail>).detail;
  if (detail?.processId) {
    void loadCatalogProcess(detail.processId);
  }
}

async function initialise(): Promise<void> {
  try {
    await initialiseProcessRepository(true);
  } catch (error) {
    console.error('Unable to initialise process repository.', error);
    setStatus('Unable to initialise process repository', 'error');
    return;
  }

  currentOrganisation = await loadOrganisation(true);
  organisationManager.setData(currentOrganisation);
  renderNavigation();
  renderMetadataPanel();

  const rootProcess = getProcessById(ROOT_PROCESS_ID)
    ?? Object.values(PROCESS_CATALOG).find((process) => process.active)
    ?? Object.values(PROCESS_CATALOG)[0];

  if (rootProcess) {
    await loadCatalogProcess(rootProcess.id);
  } else {
    await createNewDiagram();
  }
}

backButton.addEventListener('click', navigateBack);
newButton.addEventListener('click', () => void createNewDiagram());
openButton.addEventListener('click', () => {
  fileInput.value = '';
  fileInput.click();
});
homeButton.addEventListener('click', () => {
  const home = getProcessById(ROOT_PROCESS_ID);
  if (home) {
    void loadCatalogProcess(home.id);
  }
});
resetButton.addEventListener('click', () => void resetCurrentProcess());
saveButton.addEventListener('click', () => void saveBpmnFile());
svgButton.addEventListener('click', () => void saveSvgFile());
metadataButton.addEventListener('click', () => setMetadataPanelVisible(!metadataPanelVisible));
metadataCloseButton.addEventListener('click', () => setMetadataPanelVisible(false));
organisationButton.addEventListener('click', openOrganisationManager);
undoButton.addEventListener('click', () => getCommandStack().undo());
redoButton.addEventListener('click', () => getCommandStack().redo());
zoomOutButton.addEventListener('click', () => zoomDiagram(-0.1));
fitButton.addEventListener('click', fitDiagram);
zoomInButton.addEventListener('click', () => zoomDiagram(0.1));
metadataExportButton.addEventListener('click', exportMetadata);
metadataResetButton.addEventListener('click', () => void resetCurrentMetadata());
metadataLinkAdd.addEventListener('click', addProcessLink);

metadataForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveSelectedMetadata();
});

fileInput.addEventListener('change', () => {
  const selectedFile = fileInput.files?.[0];
  if (selectedFile) {
    void openSelectedFile(selectedFile);
  }
});

organisationDialog.addEventListener('click', (event) => {
  if (event.target === organisationDialog) {
    organisationDialog.close();
  }
});

document.addEventListener('enterprise-modeler:process-repository-changed', handleProcessRepositoryChanged);
document.addEventListener('enterprise-modeler:open-process', handleOpenProcessEvent);

modeler.on('commandStack.changed', () => {
  updateHistoryButtons();
  scheduleAutosave();
});
modeler.on('element.dblclick', handleElementDoubleClick);
modeler.on('selection.changed', handleSelectionChanged);

window.addEventListener('resize', fitDiagram);

void initialise();
