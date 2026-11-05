import BpmnModeler from 'bpmn-js/lib/Modeler';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import './solutionArchitectureBpmn.css';
import { MODEL_NAMESPACE, modelUrl } from './modelRepository';

import {
  ARCHITECTURE_ENVIRONMENTS,
  ARCHITECTURE_LAYERS,
  getArchitectureLayerLabel,
  loadIntegrationData,
  loadProcessGovernance,
  saveIntegrationDataLocally,
  type ArchitectureEnvironment,
  type ArchitectureLayer,
  type IntegrationData,
  type InterfaceRecord,
  type ProcessGovernanceRecord,
  type SystemRecord,
} from './operatingModelRegistry';
import {
  loadProcessRepository,
  type ProcessRepositorySnapshot,
} from './processCatalog';
import {
  getPositionName,
  loadOrganisation,
  type OrganisationData,
} from './organisation';

interface BpmnBusinessObject {
  id?: string;
  name?: string;
  $type?: string;
  $parent?: BpmnBusinessObject;
}

interface DiagramElement {
  id: string;
  type?: string;
  businessObject?: BpmnBusinessObject;
  parent?: DiagramElement;
  source?: DiagramElement;
  target?: DiagramElement;
}

interface ElementRegistryService {
  get(id: string): DiagramElement | undefined;
  getAll(): DiagramElement[];
}

interface CanvasService {
  zoom(scale: number | 'fit-viewport'): number;
  addMarker(elementId: string, marker: string): void;
  removeMarker(elementId: string, marker: string): void;
}

interface ModelingService {
  updateProperties(element: DiagramElement, properties: Record<string, unknown>): void;
}

interface ReplaceService {
  replaceElement(element: DiagramElement, target: Record<string, unknown>): DiagramElement;
}

interface SelectionService {
  select(elements: DiagramElement | DiagramElement[]): void;
}

interface EventBusService {
  on(eventName: string, callback: (event: unknown) => void): void;
}

interface SelectionChangedEvent {
  newSelection?: DiagramElement[];
}

interface SaveXmlResult {
  xml?: string;
}

const ARCHITECTURE_BPMN_URL = modelUrl('/architecture/solution-architecture.bpmn');
const ARCHITECTURE_AUTOSAVE_KEY = `enterprise-modeler.${MODEL_NAMESPACE}.solution-architecture-bpmn.v4`;
const ARCHITECTURE_LAYER_PREFIX = 'ArchitectureLayer_';
const ARCHITECTURE_PROCESS_PREFIX = 'ArchitectureProcess_';
const PROCESS_FADED_MARKER = 'architecture-bpmn-faded';
const ENVIRONMENT_FADED_MARKER = 'architecture-bpmn-environment-faded';
const LINE_STYLE_MARKERS = ['architecture-line-solid', 'architecture-line-dashed', 'architecture-line-dotted'] as const;

class SolutionArchitectureBpmnPage {
  private readonly dialog: HTMLDialogElement;
  private readonly canvasHost: HTMLDivElement;
  private readonly contextPanel: HTMLElement;
  private readonly modeler: BpmnModeler;
  private data: IntegrationData = { schemaVersion: 2, systems: [], interfaces: [] };
  private organisation: OrganisationData | null = null;
  private governanceRecords: ProcessGovernanceRecord[] = [];
  private repository: ProcessRepositorySnapshot = {
    layers: { schemaVersion: 1, layers: [] },
    catalog: { schemaVersion: 1, rootProcessId: '', processes: [] },
  };
  private selectedElement: DiagramElement | null = null;
  private focusProcessId = '';
  private environmentView: ArchitectureEnvironment | 'all' = 'production';
  private loaded = false;
  private suppressModelEvents = false;
  private internalRegistryWrite = false;
  private autosaveTimer: number | undefined;
  private registrySyncTimer: number | undefined;

  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'solution-architecture-dialog solution-architecture-bpmn-dialog';
    this.dialog.innerHTML = this.renderShell();
    document.body.appendChild(this.dialog);

    const canvasHost = this.dialog.querySelector<HTMLDivElement>('#solution-architecture-bpmn-canvas');
    const contextPanel = this.dialog.querySelector<HTMLElement>('#solution-architecture-bpmn-context');
    if (!canvasHost || !contextPanel) {
      throw new Error('Unable to initialise the Solution Architecture BPMN workspace.');
    }
    this.canvasHost = canvasHost;
    this.contextPanel = contextPanel;

    this.modeler = new BpmnModeler({ container: this.canvasHost });
    this.bindModelerEvents();
    this.bindPageEvents();
    this.bindContextPadExtensions();

    document.addEventListener('enterprise-modeler:open-solution-architecture-map', (event) => {
      const processId = (event as CustomEvent<{ processId?: string }>).detail?.processId ?? '';
      void this.open(processId);
    });

    document.addEventListener('enterprise-modeler:operating-model-registry-changed', (event) => {
      const scope = (event as CustomEvent<{ scope?: string }>).detail?.scope;
      if (scope !== 'integrations' || this.internalRegistryWrite) return;
      void this.reloadRegistryMetadata();
    });
  }

  private renderShell(): string {
    return `
      <div class="solution-architecture-bpmn-page">
        <header class="solution-architecture-bpmn-header">
          <div>
            <div class="solution-architecture-bpmn-title">Solution Architecture Map</div>
            <div class="solution-architecture-bpmn-subtitle">Native BPMN collaboration model. Pools are architecture domains, Tasks are systems and Flows are interfaces.</div>
          </div>
          <div class="solution-architecture-bpmn-actions">
            <button id="solution-architecture-bpmn-fit" class="toolbar-button" type="button">Fit</button>
            <button id="solution-architecture-bpmn-systems" class="toolbar-button" type="button">Systems Catalogue</button>
            <button id="solution-architecture-bpmn-integrations" class="toolbar-button" type="button">Integration Catalogue</button>
            <button id="solution-architecture-bpmn-close" class="metadata-close-button" type="button" aria-label="Return to process workspace">×</button>
          </div>
        </header>

        <div class="solution-architecture-bpmn-controls">
          <label>
            <span>Highlight process dependency</span>
            <select id="solution-architecture-bpmn-focus"><option value="">Whole solution</option></select>
          </label>
          <label>
            <span>Environment layer</span>
            <select id="solution-architecture-bpmn-environment">
              <option value="production">Production</option>
              <option value="uat">UAT</option>
              <option value="dev-test">Dev / Test</option>
              <option value="all">All environments</option>
            </select>
          </label>
          <div class="solution-architecture-bpmn-help">
            Move systems and reconnect flows using the native BPMN canvas. Drag a Task into another Pool to change its architecture domain.
          </div>
        </div>

        <div class="solution-architecture-bpmn-workspace">
          <div id="solution-architecture-bpmn-canvas" class="solution-architecture-bpmn-canvas" aria-label="Enterprise Modeler solution architecture BPMN canvas"></div>
          <aside id="solution-architecture-bpmn-context" class="solution-architecture-bpmn-context"></aside>
        </div>
      </div>
    `;
  }

  private bindModelerEvents(): void {
    const eventBus = this.modeler.get<EventBusService>('eventBus');

    eventBus.on('selection.changed', (event) => {
      const selection = (event as SelectionChangedEvent).newSelection ?? [];
      this.selectedElement = selection[0] ?? null;
      this.renderContextPanel();
    });

    eventBus.on('commandStack.changed', () => {
      if (this.suppressModelEvents) return;
      this.scheduleAutosave();
      this.scheduleRegistrySync();
    });
  }

  private bindContextPadExtensions(): void {
    const observer = new MutationObserver(() => this.renderElementContextPadActions());
    observer.observe(this.canvasHost, { childList: true, subtree: true });
  }

  private renderElementContextPadActions(): void {
    const element = this.selectedElement;
    if (!element) return;

    const contextPad = this.canvasHost.querySelector<HTMLElement>('.djs-context-pad');
    if (!contextPad || contextPad.querySelector('[data-enterprise-context-actions]')) return;

    const actions = document.createElement('div');
    actions.className = 'architecture-enterprise-context-actions';
    actions.dataset.enterpriseContextActions = 'true';

    if (this.isSystemElement(element)) {
      const system = this.data.systems.find((candidate) => candidate.id === element.id);
      if (system) {
        this.addContextPadButton(actions, 'System details', 'ⓘ', () => {
          document.dispatchEvent(new CustomEvent('enterprise-modeler:open-systems-catalog', {
            detail: { recordId: system.id },
          }));
        });

        this.addContextPadButton(
          actions,
          system.isContainer ? 'System container' : 'Convert to system container',
          system.isContainer ? '▣' : '▢',
          () => this.convertSystemToContainer(system, element),
          system.isContainer === true,
        );

        ARCHITECTURE_ENVIRONMENTS.forEach((environment) => {
          const selected = (system.environments ?? ['production']).includes(environment.id);
          this.addContextPadButton(
            actions,
            `${selected ? 'Remove from' : 'Add to'} ${environment.label}`,
            environment.id === 'production' ? 'P' : environment.id === 'uat' ? 'U' : 'D',
            () => this.toggleSystemEnvironment(system, environment.id),
            selected,
          );
        });
      }
    } else if (this.isInterfaceElement(element)) {
      const record = this.data.interfaces.find((candidate) => candidate.id === element.id);
      if (record) {
        this.addContextPadButton(actions, 'Interface details', 'ⓘ', () => {
          document.dispatchEvent(new CustomEvent('enterprise-modeler:open-integration-catalog', {
            detail: { recordKind: 'interface', recordId: record.id },
          }));
        });

        ([
          ['solid', 'Solid line', '━'],
          ['dashed', 'Dashed line', '┅'],
          ['dotted', 'Dotted line', '···'],
        ] as const).forEach(([style, title, glyph]) => {
          this.addContextPadButton(
            actions,
            title,
            glyph,
            () => this.setInterfaceLineStyle(record, element, style),
            (record.lineStyle ?? 'solid') === style,
          );
        });

        ([
          ['outbound', 'Outbound', '→'],
          ['inbound', 'Inbound', '←'],
          ['bidirectional', 'Bidirectional', '↔'],
        ] as const).forEach(([direction, title, glyph]) => {
          this.addContextPadButton(
            actions,
            title,
            glyph,
            () => this.setInterfaceDirection(record, direction),
            record.direction === direction,
          );
        });

        ARCHITECTURE_ENVIRONMENTS.forEach((environment) => {
          const selected = (record.environments ?? ['production']).includes(environment.id);
          this.addContextPadButton(
            actions,
            `${selected ? 'Remove from' : 'Add to'} ${environment.label}`,
            environment.id === 'production' ? 'P' : environment.id === 'uat' ? 'U' : 'D',
            () => this.toggleInterfaceEnvironment(record, environment.id),
            selected,
          );
        });
      }
    } else if (element.businessObject?.$type === 'bpmn:Participant') {
      this.addContextPadButton(actions, 'Lane details', 'ⓘ', () => this.renderContextPanel());
      this.addContextPadButton(actions, 'Fit view', '⤢', () => {
        this.modeler.get<CanvasService>('canvas').zoom('fit-viewport');
      });
    }

    if (actions.childElementCount > 0) contextPad.appendChild(actions);
  }

  private addContextPadButton(
    container: HTMLElement,
    title: string,
    glyph: string,
    action: () => void,
    selected = false,
  ): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'entry architecture-context-entry';
    if (selected) button.classList.add('architecture-context-entry-selected');
    button.title = title;
    button.setAttribute('aria-label', title);
    button.textContent = glyph;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      action();
      window.setTimeout(() => {
        this.canvasHost.querySelector<HTMLElement>('[data-enterprise-context-actions]')?.remove();
        this.renderElementContextPadActions();
      }, 0);
    });
    container.appendChild(button);
  }

  private convertSystemToContainer(system: SystemRecord, element: DiagramElement): void {
    if (system.isContainer) return;
    const type = element.businessObject?.$type ?? element.type ?? '';
    if (type === 'bpmn:SubProcess') {
      system.isContainer = true;
      this.saveArchitectureRegistry();
      this.renderContextPanel();
      return;
    }

    const replace = this.modeler.get<ReplaceService>('bpmnReplace');
    const replacement = replace.replaceElement(element, {
      type: 'bpmn:SubProcess',
      isExpanded: true,
    });
    system.isContainer = true;
    this.selectedElement = replacement;
    this.saveArchitectureRegistry();
    this.scheduleAutosave();
    this.scheduleRegistrySync();
    this.renderContextPanel();
  }
  private toggleSystemEnvironment(system: SystemRecord, environment: ArchitectureEnvironment): void {
    const current = new Set(system.environments ?? ['production']);
    if (current.has(environment) && current.size > 1) current.delete(environment);
    else current.add(environment);
    system.environments = [...current];
    system.environment = system.environments
      .map((id) => ARCHITECTURE_ENVIRONMENTS.find((candidate) => candidate.id === id)?.label ?? id)
      .join(', ');
    this.saveArchitectureRegistry();
    this.applyEnvironmentFocus();
    this.renderContextPanel();
  }

  private toggleInterfaceEnvironment(record: InterfaceRecord, environment: ArchitectureEnvironment): void {
    const current = new Set(record.environments ?? ['production']);
    if (current.has(environment) && current.size > 1) current.delete(environment);
    else current.add(environment);
    record.environments = [...current];
    this.saveArchitectureRegistry();
    this.applyEnvironmentFocus();
    this.renderContextPanel();
  }

  private setInterfaceDirection(record: InterfaceRecord, direction: InterfaceRecord['direction']): void {
    record.direction = direction;
    this.saveArchitectureRegistry();
    this.renderContextPanel();
  }

  private saveArchitectureRegistry(): void {
    this.internalRegistryWrite = true;
    try {
      saveIntegrationDataLocally(this.data);
    } finally {
      this.internalRegistryWrite = false;
    }
  }

  private setInterfaceLineStyle(
    record: InterfaceRecord,
    element: DiagramElement,
    style: NonNullable<InterfaceRecord['lineStyle']>,
  ): void {
    record.lineStyle = style;

    this.saveArchitectureRegistry();

    this.applyInterfaceLineStyle(record, element);
    this.renderContextPanel();

    this.canvasHost.querySelector<HTMLElement>('[data-enterprise-context-actions]')?.remove();
    this.renderElementContextPadActions();
  }

  private bindPageEvents(): void {
    this.dialog.querySelector<HTMLButtonElement>('#solution-architecture-bpmn-close')
      ?.addEventListener('click', () => this.dialog.close());

    this.dialog.querySelector<HTMLButtonElement>('#solution-architecture-bpmn-fit')
      ?.addEventListener('click', () => {
        this.modeler.get<CanvasService>('canvas').zoom('fit-viewport');
      });

    this.dialog.querySelector<HTMLButtonElement>('#solution-architecture-bpmn-systems')
      ?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('enterprise-modeler:open-systems-catalog'));
      });

    this.dialog.querySelector<HTMLButtonElement>('#solution-architecture-bpmn-integrations')
      ?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('enterprise-modeler:open-integration-catalog'));
      });

    this.dialog.querySelector<HTMLSelectElement>('#solution-architecture-bpmn-focus')
      ?.addEventListener('change', (event) => {
        this.focusProcessId = (event.currentTarget as HTMLSelectElement).value;
        this.applyProcessFocus();
      });

    this.dialog.querySelector<HTMLSelectElement>('#solution-architecture-bpmn-environment')
      ?.addEventListener('change', (event) => {
        const value = (event.currentTarget as HTMLSelectElement).value;
        this.environmentView = value === 'uat' || value === 'dev-test' || value === 'production'
          ? value
          : 'all';
        this.applyEnvironmentFocus();
        this.renderContextPanel();
      });
  }

  private async open(processId = ''): Promise<void> {
    this.dialog.showModal();
    await this.reloadReferenceData();

    if (processId && this.repository.catalog.processes.some((process) => process.id === processId)) {
      this.focusProcessId = processId;
    }

    this.renderFocusOptions();

    if (!this.loaded) {
      await this.loadDiagram();
      this.loaded = true;
    } else {
      this.applyRegistryMetadataToDiagram();
    }

    this.modeler.get<CanvasService>('canvas').zoom('fit-viewport');
    this.applyProcessFocus();
    this.applyEnvironmentFocus();
    this.renderContextPanel();
  }

  private async reloadReferenceData(): Promise<void> {
    const [data, organisation, governance, repository] = await Promise.all([
      loadIntegrationData(true),
      loadOrganisation(true),
      loadProcessGovernance(true),
      loadProcessRepository(true),
    ]);
    this.data = data;
    this.organisation = organisation;
    this.governanceRecords = governance.records;
    this.repository = repository;
  }

  private async reloadRegistryMetadata(): Promise<void> {
    this.data = await loadIntegrationData(true);
    if (this.loaded) this.applyRegistryMetadataToDiagram();
    this.renderContextPanel();
    this.applyProcessFocus();
    this.applyEnvironmentFocus();
  }

  private async loadDiagram(): Promise<void> {
    const saved = localStorage.getItem(ARCHITECTURE_AUTOSAVE_KEY);
    const xml = saved || await this.fetchRepositoryBpmn();

    this.suppressModelEvents = true;
    try {
      await this.modeler.importXML(xml);
      this.applyRegistryMetadataToDiagram();
    } finally {
      this.suppressModelEvents = false;
    }
  }

  private async fetchRepositoryBpmn(): Promise<string> {
    const response = await fetch(ARCHITECTURE_BPMN_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load ${ARCHITECTURE_BPMN_URL}. HTTP ${response.status}.`);
    }
    return response.text();
  }

  private applyRegistryMetadataToDiagram(): void {
    if (!this.loaded && !this.suppressModelEvents) return;

    const registry = this.modeler.get<ElementRegistryService>('elementRegistry');
    const modeling = this.modeler.get<ModelingService>('modeling');
    const previous = this.suppressModelEvents;
    this.suppressModelEvents = true;

    try {
      this.data.systems.forEach((system) => {
        const element = registry.get(system.id);
        if (!element || !this.isSystemElement(element)) return;
        if ((element.businessObject?.name ?? '') !== system.name) {
          modeling.updateProperties(element, { name: system.name });
        }
      });

      const canvas = this.modeler.get<CanvasService>('canvas');
      this.data.interfaces.forEach((record) => {
        const element = registry.get(record.id);
        if (!element || !this.isInterfaceElement(element)) return;
        if ((element.businessObject?.name ?? '') !== record.name) {
          modeling.updateProperties(element, { name: record.name });
        }
        this.applyInterfaceLineStyle(record, element, canvas);
      });
    } finally {
      this.suppressModelEvents = previous;
    }
  }

  private scheduleAutosave(): void {
    if (this.autosaveTimer !== undefined) window.clearTimeout(this.autosaveTimer);
    this.autosaveTimer = window.setTimeout(() => {
      this.autosaveTimer = undefined;
      void this.saveDiagramLocally();
    }, 180);
  }

  private async saveDiagramLocally(): Promise<void> {
    try {
      const result = await this.modeler.saveXML({ format: true }) as SaveXmlResult;
      if (result.xml) localStorage.setItem(ARCHITECTURE_AUTOSAVE_KEY, result.xml);
    } catch (error) {
      console.warn('Unable to autosave the Solution Architecture BPMN model.', error);
    }
  }

  private scheduleRegistrySync(): void {
    if (this.registrySyncTimer !== undefined) window.clearTimeout(this.registrySyncTimer);
    this.registrySyncTimer = window.setTimeout(() => {
      this.registrySyncTimer = undefined;
      this.synchroniseDiagramToRegistry();
    }, 220);
  }

  private synchroniseDiagramToRegistry(): void {
    const registry = this.modeler.get<ElementRegistryService>('elementRegistry');
    const elements = registry.getAll();
    const systemElements = elements.filter((element) => this.isSystemElement(element));
    const systemIds = new Set(systemElements.map((element) => element.id));
    let changed = false;

    systemElements.forEach((element) => {
      const name = element.businessObject?.name?.trim() || 'New System';
      const layer = this.getElementArchitectureLayer(element);
      const existing = this.data.systems.find((system) => system.id === element.id);

      if (!existing) {
        this.data.systems.push({
          id: element.id,
          name,
          type: '',
          architectureLayer: layer,
          supplier: '',
          environment: 'Production',
          environments: ['production'],
          dataClassification: '',
          integrationType: '',
          ownerPositionId: '',
          criticality: 'medium',
          active: true,
          notes: '',
          parentSystemId: this.getParentSystemId(element),
          isContainer: this.isContainerElement(element),
        });
        changed = true;
        return;
      }

      const parentSystemId = this.getParentSystemId(element);
      const isContainer = this.isContainerElement(element);
      if (
        existing.name !== name
        || existing.architectureLayer !== layer
        || existing.parentSystemId !== parentSystemId
        || existing.isContainer !== isContainer
        || !existing.active
      ) {
        existing.name = name;
        existing.architectureLayer = layer;
        existing.parentSystemId = parentSystemId;
        existing.isContainer = isContainer;
        existing.active = true;
        changed = true;
      }
    });

    elements
      .filter((element) => this.isInterfaceElement(element))
      .forEach((element) => {
        const sourceId = element.source?.id ?? '';
        const targetId = element.target?.id ?? '';
        if (!systemIds.has(sourceId) || !systemIds.has(targetId)) return;

        const source = this.data.systems.find((system) => system.id === sourceId);
        const target = this.data.systems.find((system) => system.id === targetId);
        if (!source || !target) return;

        const existing = this.data.interfaces.find((record) => record.id === element.id);
        const name = element.businessObject?.name?.trim() || `${source.name} → ${target.name}`;

        if (!existing) {
          this.data.interfaces.push({
            id: element.id,
            name,
            sourceSystemId: sourceId,
            targetSystemId: targetId,
            direction: 'outbound',
            protocol: '',
            authentication: '',
            lineStyle: 'solid',
            environments: ['production'],
            ownerPositionId: '',
            criticality: 'medium',
            status: 'design',
            documentationReference: '',
            notes: '',
          });
          changed = true;
          return;
        }

        if (
          existing.name !== name
          || existing.sourceSystemId !== sourceId
          || existing.targetSystemId !== targetId
          || existing.status === 'retired'
        ) {
          existing.name = name;
          existing.sourceSystemId = sourceId;
          existing.targetSystemId = targetId;
          if (existing.status === 'retired') existing.status = 'design';
          changed = true;
        }
      });

    if (changed) {
      this.internalRegistryWrite = true;
      try {
        saveIntegrationDataLocally(this.data);
      } finally {
        this.internalRegistryWrite = false;
      }
      this.renderContextPanel();
    }
  }

  private isSystemElement(element: DiagramElement): boolean {
    const type = element.businessObject?.$type ?? element.type ?? '';
    if (!type.endsWith('Task') && type !== 'bpmn:SubProcess') return false;

    let current: DiagramElement | undefined = element.parent;
    while (current) {
      const currentType = current.businessObject?.$type ?? current.type ?? '';
      if (currentType === 'bpmn:Participant') return true;
      current = current.parent;
    }

    const parentProcessId = element.businessObject?.$parent?.id ?? '';
    return parentProcessId.startsWith(ARCHITECTURE_PROCESS_PREFIX);
  }

  private isContainerElement(element: DiagramElement): boolean {
    const type = element.businessObject?.$type ?? element.type ?? '';
    return type === 'bpmn:SubProcess';
  }

  private getParentSystemId(element: DiagramElement): string {
    let current = element.parent;
    while (current) {
      if (this.isContainerElement(current) && this.data.systems.some((system) => system.id === current?.id)) {
        return current.id;
      }
      const type = current.businessObject?.$type ?? current.type ?? '';
      if (type === 'bpmn:Participant') break;
      current = current.parent;
    }
    return '';
  }

  private isInterfaceElement(element: DiagramElement): boolean {
    const type = element.businessObject?.$type ?? element.type ?? '';
    return type === 'bpmn:SequenceFlow' || type === 'bpmn:MessageFlow';
  }

  private getElementArchitectureLayer(element: DiagramElement): ArchitectureLayer {
    const parent = element.parent;
    const participantId = parent?.businessObject?.$type === 'bpmn:Participant'
      ? parent.id
      : '';
    const processId = element.businessObject?.$parent?.id ?? '';
    const participantName = parent?.businessObject?.name?.trim() ?? '';

    const byParticipantId = this.layerFromIdentifier(participantId, ARCHITECTURE_LAYER_PREFIX);
    if (byParticipantId) return byParticipantId;

    const byProcessId = this.layerFromIdentifier(processId, ARCHITECTURE_PROCESS_PREFIX);
    if (byProcessId) return byProcessId;

    return ARCHITECTURE_LAYERS.find((layer) => layer.label === participantName)?.id ?? 'other';
  }

  private layerFromIdentifier(identifier: string, prefix: string): ArchitectureLayer | null {
    if (!identifier.startsWith(prefix)) return null;
    const candidate = identifier.slice(prefix.length);
    return candidate ? candidate as ArchitectureLayer : null;
  }

  private renderFocusOptions(): void {
    const select = this.dialog.querySelector<HTMLSelectElement>('#solution-architecture-bpmn-focus');
    if (!select) return;

    select.innerHTML = `
      <option value="">Whole solution</option>
      ${this.repository.catalog.processes
        .filter((process) => process.active)
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((process) => `<option value="${escapeHtml(process.id)}"${process.id === this.focusProcessId ? ' selected' : ''}>${escapeHtml(process.name)}</option>`)
        .join('')}
    `;
  }

  private applyProcessFocus(): void {
    if (!this.loaded) return;

    const canvas = this.modeler.get<CanvasService>('canvas');
    const registry = this.modeler.get<ElementRegistryService>('elementRegistry');
    registry.getAll().forEach((element) => canvas.removeMarker(element.id, PROCESS_FADED_MARKER));

    if (!this.focusProcessId) return;
    const focus = this.governanceRecords.find((record) => record.processId === this.focusProcessId);
    if (!focus) return;

    const interfaceIds = new Set(focus.interfaceIds);
    const systemIds = new Set(focus.systemIds);
    this.data.interfaces
      .filter((record) => interfaceIds.has(record.id))
      .forEach((record) => {
        systemIds.add(record.sourceSystemId);
        systemIds.add(record.targetSystemId);
      });

    this.data.systems.forEach((system) => {
      if (!systemIds.has(system.id) && registry.get(system.id)) {
        canvas.addMarker(system.id, PROCESS_FADED_MARKER);
      }
    });

    this.data.interfaces.forEach((record) => {
      if (!interfaceIds.has(record.id) && registry.get(record.id)) {
        canvas.addMarker(record.id, PROCESS_FADED_MARKER);
      }
    });
  }

  private applyEnvironmentFocus(): void {
    if (!this.loaded) return;

    const canvas = this.modeler.get<CanvasService>('canvas');
    const registry = this.modeler.get<ElementRegistryService>('elementRegistry');
    registry.getAll().forEach((element) => canvas.removeMarker(element.id, ENVIRONMENT_FADED_MARKER));

    if (this.environmentView === 'all') return;

    const visibleSystems = new Set(
      this.data.systems
        .filter((system) => (system.environments ?? ['production']).includes(this.environmentView as ArchitectureEnvironment))
        .map((system) => system.id),
    );

    this.data.systems.forEach((system) => {
      if (!visibleSystems.has(system.id) && registry.get(system.id)) {
        canvas.addMarker(system.id, ENVIRONMENT_FADED_MARKER);
      }
    });

    this.data.interfaces.forEach((record) => {
      const visible = (record.environments ?? ['production']).includes(this.environmentView as ArchitectureEnvironment)
        && visibleSystems.has(record.sourceSystemId)
        && visibleSystems.has(record.targetSystemId);
      if (!visible && registry.get(record.id)) {
        canvas.addMarker(record.id, ENVIRONMENT_FADED_MARKER);
      }
    });
  }
  private renderContextPanel(): void {
    const element = this.selectedElement;
    if (!element) {
      this.contextPanel.innerHTML = this.renderEmptyContext();
      return;
    }

    const system = this.data.systems.find((record) => record.id === element.id);
    if (system && this.isSystemElement(element)) {
      this.contextPanel.innerHTML = this.renderSystemContext(system, element);
      this.bindSystemContext(system, element);
      return;
    }

    const record = this.data.interfaces.find((candidate) => candidate.id === element.id);
    if (record && this.isInterfaceElement(element)) {
      this.contextPanel.innerHTML = this.renderInterfaceContext(record);
      this.bindInterfaceContext(record, element);
      return;
    }

    if (element.businessObject?.$type === 'bpmn:Participant') {
      const layer = this.getParticipantLayer(element);
      this.contextPanel.innerHTML = `
        <div class="solution-architecture-context-header">
          <div><strong>Architecture Domain</strong><small>${escapeHtml(element.id)}</small></div>
        </div>
        <div class="solution-architecture-context-summary">
          <strong>${escapeHtml(element.businessObject?.name ?? getArchitectureLayerLabel(layer))}</strong>
          <p>This BPMN Pool represents the ${escapeHtml(getArchitectureLayerLabel(layer))} architecture domain.</p>
          <p>Move a System Task between Pools to change its architecture classification.</p>
        </div>
      `;
      return;
    }

    this.contextPanel.innerHTML = `
      <div class="solution-architecture-context-header"><div><strong>BPMN Element</strong><small>${escapeHtml(element.id)}</small></div></div>
      <div class="solution-architecture-context-summary">
        <strong>${escapeHtml(element.businessObject?.name ?? element.businessObject?.$type ?? 'Element')}</strong>
        <p>This is a native BPMN element. System and interface catalogue metadata is available when a System Task or Interface Flow is selected.</p>
      </div>
    `;
  }

  private renderEmptyContext(): string {
    return `
      <div class="solution-architecture-context-header">
        <div><strong>Context</strong><small>Solution architecture</small></div>
      </div>
      <div class="solution-architecture-context-summary">
        <p>Select a System Task or Interface Flow to edit its catalogue metadata.</p>
        <p>The BPMN palette and context pad are native bpmn-js controls.</p>
      </div>
    `;
  }

  private renderSystemContext(system: SystemRecord, element: DiagramElement): string {
    const layer = this.getElementArchitectureLayer(element);
    return `
      <div class="solution-architecture-context-header">
        <div><strong>System</strong><small>${escapeHtml(system.id)}</small></div>
        <button type="button" data-architecture-clear-selection aria-label="Clear selection">×</button>
      </div>
      <form id="architecture-bpmn-system-form" class="solution-architecture-context-form">
        <label><span>Name</span><input id="architecture-bpmn-system-name" required value="${escapeHtml(system.name)}" /></label>
        <label><span>Architecture domain</span><input value="${escapeHtml(getArchitectureLayerLabel(layer))}" readonly /></label>
        <div class="solution-architecture-context-note">Move this BPMN Task into another architecture Pool to change its domain.</div>
        <label><span>Type</span><input id="architecture-bpmn-system-type" value="${escapeHtml(system.type)}" /></label>
        <label><span>Supplier</span><input id="architecture-bpmn-system-supplier" value="${escapeHtml(system.supplier)}" /></label>
        <fieldset>
          <span>Environments</span>
          ${ARCHITECTURE_ENVIRONMENTS.map((environment) => `<label class="solution-architecture-context-check"><input type="checkbox" data-architecture-system-environment="${environment.id}"${(system.environments ?? ['production']).includes(environment.id) ? ' checked' : ''} /><span>${escapeHtml(environment.label)}</span></label>`).join('')}
        </fieldset>
        <label><span>Data classification</span><input id="architecture-bpmn-system-data" value="${escapeHtml(system.dataClassification)}" /></label>
        <label><span>Integration type</span><input id="architecture-bpmn-system-integration-type" value="${escapeHtml(system.integrationType)}" /></label>
        <label><span>Owner position</span><select id="architecture-bpmn-system-owner">${this.positionOptions(system.ownerPositionId)}</select></label>
        <label><span>Criticality</span><select id="architecture-bpmn-system-criticality">${this.criticalityOptions(system.criticality)}</select></label>
        <label class="solution-architecture-context-check"><input id="architecture-bpmn-system-active" type="checkbox"${system.active ? ' checked' : ''} /><span>Active</span></label>
        <label><span>Notes</span><textarea id="architecture-bpmn-system-notes" rows="4">${escapeHtml(system.notes)}</textarea></label>
        <div class="solution-architecture-context-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">Save</button>
          <button class="toolbar-button" type="button" data-open-system-catalogue>Open Catalogue</button>
        </div>
      </form>
    `;
  }

  private bindSystemContext(system: SystemRecord, element: DiagramElement): void {
    this.bindClearSelection();
    const form = this.contextPanel.querySelector<HTMLFormElement>('#architecture-bpmn-system-form');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      system.name = this.inputValue('#architecture-bpmn-system-name') || system.name;
      system.type = this.inputValue('#architecture-bpmn-system-type');
      system.supplier = this.inputValue('#architecture-bpmn-system-supplier');
      system.environments = this.readContextEnvironments('[data-architecture-system-environment]');
      system.environment = system.environments.map((environment) => ARCHITECTURE_ENVIRONMENTS.find((candidate) => candidate.id === environment)?.label ?? environment).join(', ');
      system.dataClassification = this.inputValue('#architecture-bpmn-system-data');
      system.integrationType = this.inputValue('#architecture-bpmn-system-integration-type');
      system.ownerPositionId = this.selectValue('#architecture-bpmn-system-owner');
      system.criticality = this.selectValue('#architecture-bpmn-system-criticality') as SystemRecord['criticality'];
      system.active = this.contextPanel.querySelector<HTMLInputElement>('#architecture-bpmn-system-active')?.checked ?? true;
      system.notes = this.textareaValue('#architecture-bpmn-system-notes');
      system.architectureLayer = this.getElementArchitectureLayer(element);

      this.internalRegistryWrite = true;
      try {
        saveIntegrationDataLocally(this.data);
      } finally {
        this.internalRegistryWrite = false;
      }

      this.suppressModelEvents = true;
      try {
        this.modeler.get<ModelingService>('modeling').updateProperties(element, { name: system.name });
      } finally {
        this.suppressModelEvents = false;
      }
      this.scheduleAutosave();
      this.renderContextPanel();
    });

    this.contextPanel.querySelector<HTMLButtonElement>('[data-open-system-catalogue]')
      ?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('enterprise-modeler:open-systems-catalog', {
          detail: { recordId: system.id },
        }));
      });
  }

  private renderInterfaceContext(record: InterfaceRecord): string {
    const source = this.data.systems.find((system) => system.id === record.sourceSystemId);
    const target = this.data.systems.find((system) => system.id === record.targetSystemId);
    return `
      <div class="solution-architecture-context-header">
        <div><strong>Interface</strong><small>${escapeHtml(record.id)}</small></div>
        <button type="button" data-architecture-clear-selection aria-label="Clear selection">×</button>
      </div>
      <form id="architecture-bpmn-interface-form" class="solution-architecture-context-form">
        <label><span>Name</span><input id="architecture-bpmn-interface-name" required value="${escapeHtml(record.name)}" /></label>
        <label><span>Source</span><input value="${escapeHtml(source?.name ?? record.sourceSystemId)}" readonly /></label>
        <label><span>Target</span><input value="${escapeHtml(target?.name ?? record.targetSystemId)}" readonly /></label>
        <div class="solution-architecture-context-note">Reconnect the native BPMN Flow to change its source or target.</div>
        <label><span>Direction</span><select id="architecture-bpmn-interface-direction">${this.directionOptions(record.direction)}</select></label>
        <label><span>Line style</span><select id="architecture-bpmn-interface-line-style">${this.lineStyleOptions(record.lineStyle ?? 'solid')}</select></label>
        <fieldset>
          <span>Environments</span>
          ${ARCHITECTURE_ENVIRONMENTS.map((environment) => `<label class="solution-architecture-context-check"><input type="checkbox" data-architecture-interface-environment="${environment.id}"${(record.environments ?? ['production']).includes(environment.id) ? ' checked' : ''} /><span>${escapeHtml(environment.label)}</span></label>`).join('')}
        </fieldset>
        <label><span>Protocol</span><input id="architecture-bpmn-interface-protocol" value="${escapeHtml(record.protocol)}" /></label>
        <label><span>Authentication</span><input id="architecture-bpmn-interface-authentication" value="${escapeHtml(record.authentication)}" /></label>
        <label><span>Owner position</span><select id="architecture-bpmn-interface-owner">${this.positionOptions(record.ownerPositionId)}</select></label>
        <label><span>Criticality</span><select id="architecture-bpmn-interface-criticality">${this.criticalityOptions(record.criticality)}</select></label>
        <label><span>Status</span><select id="architecture-bpmn-interface-status">${this.interfaceStatusOptions(record.status)}</select></label>
        <label><span>Documentation reference</span><input id="architecture-bpmn-interface-documentation" value="${escapeHtml(record.documentationReference)}" /></label>
        <label><span>Notes</span><textarea id="architecture-bpmn-interface-notes" rows="4">${escapeHtml(record.notes)}</textarea></label>
        <div class="solution-architecture-context-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">Save</button>
          <button class="toolbar-button" type="button" data-open-interface-catalogue>Open Catalogue</button>
        </div>
      </form>
    `;
  }

  private bindInterfaceContext(record: InterfaceRecord, element: DiagramElement): void {
    this.bindClearSelection();
    const form = this.contextPanel.querySelector<HTMLFormElement>('#architecture-bpmn-interface-form');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      record.name = this.inputValue('#architecture-bpmn-interface-name') || record.name;
      record.direction = this.selectValue('#architecture-bpmn-interface-direction') as InterfaceRecord['direction'];
      record.lineStyle = this.selectValue('#architecture-bpmn-interface-line-style') as NonNullable<InterfaceRecord['lineStyle']>;
      record.protocol = this.inputValue('#architecture-bpmn-interface-protocol');
      record.authentication = this.inputValue('#architecture-bpmn-interface-authentication');
      record.environments = this.readContextEnvironments('[data-architecture-interface-environment]');
      record.ownerPositionId = this.selectValue('#architecture-bpmn-interface-owner');
      record.criticality = this.selectValue('#architecture-bpmn-interface-criticality') as InterfaceRecord['criticality'];
      record.status = this.selectValue('#architecture-bpmn-interface-status') as InterfaceRecord['status'];
      record.documentationReference = this.inputValue('#architecture-bpmn-interface-documentation');
      record.notes = this.textareaValue('#architecture-bpmn-interface-notes');
      record.sourceSystemId = element.source?.id ?? record.sourceSystemId;
      record.targetSystemId = element.target?.id ?? record.targetSystemId;

      this.internalRegistryWrite = true;
      try {
        saveIntegrationDataLocally(this.data);
      } finally {
        this.internalRegistryWrite = false;
      }

      this.suppressModelEvents = true;
      try {
        this.modeler.get<ModelingService>('modeling').updateProperties(element, { name: record.name });
      } finally {
        this.suppressModelEvents = false;
      }
      this.applyInterfaceLineStyle(record, element);
      this.scheduleAutosave();
      this.renderContextPanel();
    });

    this.contextPanel.querySelector<HTMLButtonElement>('[data-open-interface-catalogue]')
      ?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('enterprise-modeler:open-integration-catalog', {
          detail: { recordKind: 'interface', recordId: record.id },
        }));
      });
  }

  private bindClearSelection(): void {
    this.contextPanel.querySelector<HTMLButtonElement>('[data-architecture-clear-selection]')
      ?.addEventListener('click', () => {
        this.modeler.get<SelectionService>('selection').select([]);
      });
  }

  private getParticipantLayer(element: DiagramElement): ArchitectureLayer {
    const byId = this.layerFromIdentifier(element.id, ARCHITECTURE_LAYER_PREFIX);
    if (byId) return byId;
    const name = element.businessObject?.name?.trim() ?? '';
    return ARCHITECTURE_LAYERS.find((layer) => layer.label === name)?.id ?? 'other';
  }

  private positionOptions(selected: string): string {
    const positions = this.organisation?.positions
      .filter((position) => position.active)
      .sort((left, right) => left.name.localeCompare(right.name)) ?? [];

    return `<option value="">Unassigned</option>${positions.map((position) =>
      `<option value="${escapeHtml(position.id)}"${position.id === selected ? ' selected' : ''}>${escapeHtml(getPositionName(this.organisation as OrganisationData, position.id))}</option>`,
    ).join('')}`;
  }

  private criticalityOptions(selected: SystemRecord['criticality'] | InterfaceRecord['criticality']): string {
    return ['low', 'medium', 'high']
      .map((value) => `<option value="${value}"${value === selected ? ' selected' : ''}>${capitalise(value)}</option>`)
      .join('');
  }

  private applyInterfaceLineStyle(
    record: InterfaceRecord,
    element: DiagramElement,
    canvas = this.modeler.get<CanvasService>('canvas'),
  ): void {
    LINE_STYLE_MARKERS.forEach((marker) => canvas.removeMarker(element.id, marker));
    const style = record.lineStyle === 'dashed' || record.lineStyle === 'dotted'
      ? record.lineStyle
      : 'solid';
    canvas.addMarker(element.id, `architecture-line-${style}`);
  }

  private lineStyleOptions(selected: NonNullable<InterfaceRecord['lineStyle']>): string {
    return [
      ['solid', 'Solid'],
      ['dashed', 'Dashed'],
      ['dotted', 'Dotted'],
    ].map(([value, label]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`).join('');
  }

  private directionOptions(selected: InterfaceRecord['direction']): string {
    return [
      ['outbound', 'Outbound'],
      ['inbound', 'Inbound'],
      ['bidirectional', 'Bidirectional'],
    ].map(([value, label]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`).join('');
  }

  private interfaceStatusOptions(selected: InterfaceRecord['status']): string {
    return [
      ['design', 'Design'],
      ['active', 'Active'],
      ['tbc', 'TBC'],
      ['retired', 'Retired'],
    ].map(([value, label]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`).join('');
  }

  private readContextEnvironments(selector: string): ArchitectureEnvironment[] {
    const selected = [...this.contextPanel.querySelectorAll<HTMLInputElement>(selector)]
      .filter((input) => input.checked)
      .map((input) => input.dataset.architectureSystemEnvironment ?? input.dataset.architectureInterfaceEnvironment ?? '')
      .filter((value): value is ArchitectureEnvironment =>
        ARCHITECTURE_ENVIRONMENTS.some((environment) => environment.id === value),
      );
    return selected.length > 0 ? selected : ['production'];
  }
  private inputValue(selector: string): string {
    return this.contextPanel.querySelector<HTMLInputElement>(selector)?.value.trim() ?? '';
  }

  private selectValue(selector: string): string {
    return this.contextPanel.querySelector<HTMLSelectElement>(selector)?.value ?? '';
  }

  private textareaValue(selector: string): string {
    return this.contextPanel.querySelector<HTMLTextAreaElement>(selector)?.value.trim() ?? '';
  }
}

function capitalise(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

new SolutionArchitectureBpmnPage();
