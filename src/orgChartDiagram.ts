import BpmnModeler from 'bpmn-js/lib/Modeler';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import './orgChartDiagram.css';

import {
  getDepartmentName,
  getPositionOccupants,
  getRoleName,
  loadOrganisation,
  saveOrganisationLocally,
  type OrganisationData,
  type Position,
} from './organisation';
import {
  loadOperatingUnits,
  type OperatingUnitsData,
} from './operatingUnits';

interface Point {
  x: number;
  y: number;
}

interface DiagramElement {
  id: string;
  type?: string;
  businessObject?: {
    id?: string;
    name?: string;
    $type?: string;
  };
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  waypoints?: Point[];
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
  connect(source: DiagramElement, target: DiagramElement, attrs: Record<string, unknown>): DiagramElement;
  removeElements(elements: DiagramElement[]): void;
  moveShape(shape: DiagramElement, delta: Point): void;
}

interface SelectionService {
  select(elements: DiagramElement | DiagramElement[]): void;
}

interface EventBusService {
  on(eventName: string, callback: (event: unknown) => void): void;
}

interface CommandStackService {
  undo(): void;
}

interface SelectionChangedEvent {
  newSelection?: DiagramElement[];
}

interface ElementClickEvent {
  element?: DiagramElement;
}

interface OrgChartLayoutData {
  positions: Record<string, Point>;
  waypoints: Record<string, Point[]>;
}

const POSITION_PREFIX = 'org-position-';
const REPORTING_PREFIX = 'org-reporting-';
const UNASSIGNED_SCOPE = '__unassigned__';
const LAYOUT_KEY_PREFIX = 'enterprise-modeler.org-chart-layout.v2.';
const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 120;
const MARGIN_X = 100;
const MARGIN_Y = 100;
const LINK_SOURCE_MARKER = 'org-chart-link-source';

class OrgChartDiagramController {
  private modeler: BpmnModeler | null = null;
  private host: HTMLDivElement | null = null;
  private shell: HTMLDivElement | null = null;
  private contextPanel: HTMLElement | null = null;
  private root: HTMLElement | null = null;
  private rootObserver: MutationObserver | null = null;
  private data: OrganisationData | null = null;
  private operatingUnits: OperatingUnitsData = { schemaVersion: 1, units: [] };
  private scopedPositions: Position[] = [];
  private scopeId = '';
  private selectedElement: DiagramElement | null = null;
  private pendingChildPositionId = '';
  private scheduled = false;
  private suppressChanges = false;
  private invalidUndoInProgress = false;
  private enhancementGeneration = 0;
  private layoutTimer: number | undefined;
  private syncTimer: number | undefined;

  constructor() {
    this.observeRoot();

    document.addEventListener('enterprise-modeler:workspace-page-changed', (event) => {
      const page = (event as CustomEvent<{ page?: string }>).detail?.page ?? '';
      if (page === 'org-chart-dialog') this.scheduleEnhancement();
    });

    document.addEventListener('enterprise-modeler:organisation-changed', (event) => {
      const source = (event as CustomEvent<{ source?: string }>).detail?.source ?? '';
      if (source === 'org-chart-diagram') return;
      this.scheduleEnhancement();
    });

    this.scheduleEnhancement();
  }

  private observeRoot(): void {
    const root = document.querySelector<HTMLElement>('#org-chart-view-root');
    if (!root) return;

    this.rootObserver?.disconnect();
    this.rootObserver = new MutationObserver(() => this.scheduleEnhancement());

    // Observe only replacement of the OrgChartView root content. Do NOT observe the
    // subtree: bpmn-js legitimately mutates its own DOM while shapes are moved.
    this.rootObserver.observe(root, { childList: true, subtree: false });
  }

  private scheduleEnhancement(): void {
    this.enhancementGeneration += 1;
    if (this.scheduled) return;

    this.scheduled = true;
    window.requestAnimationFrame(() => {
      this.scheduled = false;
      const generation = this.enhancementGeneration;
      void this.enhanceVisibleHierarchy(generation);
    });
  }

  private async enhanceVisibleHierarchy(generation: number): Promise<void> {
    const root = document.querySelector<HTMLElement>('#org-chart-view-root');
    if (root && (!this.rootObserver || root !== this.root)) this.observeRoot();

    const hierarchyActive = Boolean(
      root?.querySelector<HTMLButtonElement>('[data-org-chart-mode="hierarchy"].org-chart-control-button-active'),
    );
    const scroll = root?.querySelector<HTMLElement>('.org-chart-scroll');

    if (!root || !hierarchyActive || !scroll) {
      this.destroyCurrentDiagram();
      return;
    }

    if (this.root === root && this.host?.isConnected && this.modeler) return;

    const [data, operatingUnits] = await Promise.all([
      loadOrganisation(true),
      loadOperatingUnits(true),
    ]);

    if (generation !== this.enhancementGeneration) return;

    const currentRoot = document.querySelector<HTMLElement>('#org-chart-view-root');
    const currentScroll = currentRoot?.querySelector<HTMLElement>('.org-chart-scroll');
    const stillHierarchy = Boolean(
      currentRoot?.querySelector<HTMLButtonElement>('[data-org-chart-mode="hierarchy"].org-chart-control-button-active'),
    );

    if (!currentRoot || currentRoot !== root || !currentScroll || !stillHierarchy) return;
    if (!data.positions.some((position) => position.active)) {
      this.destroyCurrentDiagram();
      return;
    }

    this.destroyCurrentDiagram();
    this.root = currentRoot;
    this.data = data;
    this.operatingUnits = operatingUnits;
    this.scopeId = currentRoot.querySelector<HTMLSelectElement>('#org-chart-scope')?.value ?? '';
    this.scopedPositions = this.getScopedPositions(data);

    currentScroll.replaceChildren();
    currentScroll.classList.add('org-chart-native-diagram-active');
    this.hideHierarchyOnlyVacancyControl(currentRoot);
    this.enhanceHelp(currentRoot);
    this.injectHeaderActions(currentRoot);

    const shell = document.createElement('div');
    shell.className = 'org-chart-diagram-shell';
    shell.innerHTML = `
      <div class="org-chart-diagram-canvas" aria-label="Organisation hierarchy diagram"></div>
      <aside class="org-chart-diagram-context" hidden></aside>
    `;
    currentScroll.appendChild(shell);

    const host = shell.querySelector<HTMLDivElement>('.org-chart-diagram-canvas');
    const contextPanel = shell.querySelector<HTMLElement>('.org-chart-diagram-context');
    if (!host || !contextPanel) return;

    this.shell = shell;
    this.host = host;
    this.contextPanel = contextPanel;

    const modeler = new BpmnModeler({ container: host });
    this.modeler = modeler;
    this.bindModelerEvents(modeler);

    const layout = this.getMergedLayout(this.scopedPositions);
    this.suppressChanges = true;

    try {
      await modeler.importXML(this.buildBpmnXml(this.scopedPositions, layout));
      if (generation !== this.enhancementGeneration || this.modeler !== modeler || !host.isConnected) return;
      this.applyDiagramMarkers();
    } finally {
      if (this.modeler === modeler) this.suppressChanges = false;
    }

    if (this.modeler !== modeler || !host.isConnected) return;

    this.renderContextPanel();
    this.fitAfterLayout();
  }

  private destroyCurrentDiagram(): void {
    if (this.layoutTimer !== undefined) window.clearTimeout(this.layoutTimer);
    if (this.syncTimer !== undefined) window.clearTimeout(this.syncTimer);
    this.layoutTimer = undefined;
    this.syncTimer = undefined;

    const previousRoot = this.root;
    const previousShell = this.shell;

    if (this.modeler) {
      try {
        this.modeler.destroy();
      } catch (error) {
        console.warn('Unable to destroy the previous organisation chart modeler cleanly.', error);
      }
    }

    previousShell?.remove();
    previousRoot?.querySelector<HTMLElement>('.org-chart-scroll')?.classList.remove('org-chart-native-diagram-active');

    this.modeler = null;
    this.host = null;
    this.shell = null;
    this.contextPanel = null;
    this.selectedElement = null;
    this.pendingChildPositionId = '';
    this.root = null;
  }

  private hideHierarchyOnlyVacancyControl(root: HTMLElement): void {
    const vacancyToggle = root.querySelector<HTMLInputElement>('#org-chart-show-vacancies');
    const label = vacancyToggle?.closest<HTMLElement>('label.org-chart-option');
    if (label) label.hidden = true;
  }

  private enhanceHelp(root: HTMLElement): void {
    const help = root.querySelector<HTMLElement>('.org-chart-help');
    if (!help) return;
    help.innerHTML = `
      Reporting lines are native diagram connectors. Select a Position to link/change its manager, or select a reporting connector to delete it.
      <span class="org-chart-native-vacancy-note">Hierarchy View always shows active Positions, including vacancies, so reporting relationships remain unambiguous.</span>
    `;
  }

  private injectHeaderActions(root: HTMLElement): void {
    const actions = root.querySelector<HTMLElement>('.org-chart-header-actions');
    if (!actions || actions.querySelector('.org-chart-native-actions')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'org-chart-native-actions';
    wrapper.innerHTML = `
      <button id="org-chart-native-reorganise" class="toolbar-button" type="button">Reorganise</button>
      <button id="org-chart-native-fit" class="toolbar-button" type="button">Fit</button>
    `;
    actions.prepend(wrapper);

    wrapper.querySelector<HTMLButtonElement>('#org-chart-native-reorganise')
      ?.addEventListener('click', () => void this.reorganise());
    wrapper.querySelector<HTMLButtonElement>('#org-chart-native-fit')
      ?.addEventListener('click', () => this.fit());
  }

  private bindModelerEvents(modeler: BpmnModeler): void {
    const eventBus = modeler.get<EventBusService>('eventBus');

    eventBus.on('selection.changed', (event) => {
      if (this.modeler !== modeler) return;
      const selection = (event as SelectionChangedEvent).newSelection ?? [];
      this.selectedElement = selection[0] ?? null;
      this.renderContextPanel();
    });

    eventBus.on('element.click', (event) => {
      if (this.modeler !== modeler) return;
      const element = (event as ElementClickEvent).element;
      if (!element || !this.pendingChildPositionId) return;
      const managerPositionId = this.positionIdFromElement(element);
      if (!managerPositionId) return;
      void this.completeManagerLink(this.pendingChildPositionId, managerPositionId);
    });

    eventBus.on('commandStack.changed', () => {
      if (this.modeler !== modeler || this.suppressChanges || this.invalidUndoInProgress) return;
      this.scheduleLayoutSave();
      this.scheduleReportingSync();
    });
  }

  private scheduleLayoutSave(): void {
    if (this.layoutTimer !== undefined) window.clearTimeout(this.layoutTimer);
    this.layoutTimer = window.setTimeout(() => {
      this.layoutTimer = undefined;
      this.saveCurrentLayout();
    }, 180);
  }

  private scheduleReportingSync(): void {
    if (this.syncTimer !== undefined) window.clearTimeout(this.syncTimer);
    this.syncTimer = window.setTimeout(() => {
      this.syncTimer = undefined;
      void this.synchroniseReportingLines();
    }, 220);
  }

  private getScopedPositions(data: OrganisationData): Position[] {
    const active = data.positions.filter((position) => position.active);
    if (!this.scopeId) return active;

    const allAssignedIds = new Set(this.operatingUnits.units.flatMap((unit) => unit.positionIds));
    if (this.scopeId === UNASSIGNED_SCOPE) {
      return active.filter((position) => !allAssignedIds.has(position.id));
    }

    const unit = this.operatingUnits.units.find((candidate) => candidate.id === this.scopeId && candidate.active);
    if (!unit) return active;
    const ids = new Set(unit.positionIds);
    return active.filter((position) => ids.has(position.id));
  }

  private getMergedLayout(positions: Position[]): OrgChartLayoutData {
    const automatic = this.buildAutomaticLayout(positions);
    const stored = this.loadStoredLayout();
    if (!stored) return automatic;

    const positionIds = new Set(positions.map((position) => position.id));
    const mergedPositions: Record<string, Point> = { ...automatic.positions };
    Object.entries(stored.positions).forEach(([positionId, point]) => {
      if (positionIds.has(positionId) && Number.isFinite(point.x) && Number.isFinite(point.y)) {
        mergedPositions[positionId] = point;
      }
    });

    const mergedWaypoints: Record<string, Point[]> = { ...automatic.waypoints };
    Object.entries(stored.waypoints).forEach(([positionId, points]) => {
      if (positionIds.has(positionId) && points.length >= 2) {
        mergedWaypoints[positionId] = points;
      }
    });

    return { positions: mergedPositions, waypoints: mergedWaypoints };
  }

  private buildAutomaticLayout(positions: Position[]): OrgChartLayoutData {
    const ids = new Set(positions.map((position) => position.id));
    const children = new Map<string, Position[]>();
    const roots: Position[] = [];

    positions.forEach((position) => {
      const managerId = position.managerPositionId;
      if (managerId && managerId !== position.id && ids.has(managerId)) {
        const list = children.get(managerId) ?? [];
        list.push(position);
        children.set(managerId, list);
      } else {
        roots.push(position);
      }
    });

    children.forEach((list) => list.sort((left, right) => left.name.localeCompare(right.name)));
    roots.sort((left, right) => left.name.localeCompare(right.name));

    const result: Record<string, Point> = {};
    const visited = new Set<string>();
    let leafCursor = 0;

    const place = (position: Position, depth: number, path: Set<string>): number => {
      if (path.has(position.id)) {
        const x = MARGIN_X + leafCursor * (NODE_WIDTH + HORIZONTAL_GAP);
        leafCursor += 1;
        result[position.id] = { x, y: MARGIN_Y + depth * (NODE_HEIGHT + VERTICAL_GAP) };
        return x;
      }

      visited.add(position.id);
      const nextPath = new Set(path);
      nextPath.add(position.id);
      const childPositions = children.get(position.id) ?? [];
      let x: number;

      if (childPositions.length === 0) {
        x = MARGIN_X + leafCursor * (NODE_WIDTH + HORIZONTAL_GAP);
        leafCursor += 1;
      } else {
        const childXs = childPositions.map((child) => place(child, depth + 1, nextPath));
        x = childXs.reduce((sum, value) => sum + value, 0) / childXs.length;
      }

      result[position.id] = { x, y: MARGIN_Y + depth * (NODE_HEIGHT + VERTICAL_GAP) };
      return x;
    };

    roots.forEach((root) => place(root, 0, new Set<string>()));
    positions
      .filter((position) => !visited.has(position.id))
      .sort((left, right) => left.name.localeCompare(right.name))
      .forEach((position) => place(position, 0, new Set<string>()));

    const waypoints: Record<string, Point[]> = {};
    positions.forEach((position) => {
      const managerId = position.managerPositionId;
      if (!managerId || !ids.has(managerId)) return;
      const managerPoint = result[managerId];
      const childPoint = result[position.id];
      if (!managerPoint || !childPoint) return;
      waypoints[position.id] = this.orthogonalWaypoints(managerPoint, childPoint);
    });

    return { positions: result, waypoints };
  }

  private orthogonalWaypoints(managerPoint: Point, childPoint: Point): Point[] {
    const start = { x: managerPoint.x + NODE_WIDTH / 2, y: managerPoint.y + NODE_HEIGHT };
    const end = { x: childPoint.x + NODE_WIDTH / 2, y: childPoint.y };
    const middleY = start.y + (end.y - start.y) / 2;
    return [start, { x: start.x, y: middleY }, { x: end.x, y: middleY }, end];
  }

  private buildBpmnXml(positions: Position[], layout: OrgChartLayoutData): string {
    const ids = new Set(positions.map((position) => position.id));
    const taskXml = positions.map((position) => {
      const occupants = this.data ? getPositionOccupants(this.data, position.id) : [];
      const occupant = occupants[0];
      const label = occupant ? `${occupant.name} — ${position.name}` : `VACANT — ${position.name}`;
      return `    <bpmn:task id="${escapeXml(this.elementIdForPosition(position.id))}" name="${escapeXml(label)}" />`;
    }).join('\n');

    const associationXml = positions
      .filter((position) => position.managerPositionId && ids.has(position.managerPositionId))
      .map((position) => `    <bpmn:association id="${escapeXml(this.reportingIdForPosition(position.id))}" sourceRef="${escapeXml(this.elementIdForPosition(position.managerPositionId as string))}" targetRef="${escapeXml(this.elementIdForPosition(position.id))}" />`)
      .join('\n');

    const shapeXml = positions.map((position) => {
      const point = layout.positions[position.id] ?? { x: MARGIN_X, y: MARGIN_Y };
      return `      <bpmndi:BPMNShape id="${escapeXml(this.elementIdForPosition(position.id))}_di" bpmnElement="${escapeXml(this.elementIdForPosition(position.id))}"><dc:Bounds x="${round(point.x)}" y="${round(point.y)}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" /></bpmndi:BPMNShape>`;
    }).join('\n');

    const edgeXml = positions
      .filter((position) => position.managerPositionId && ids.has(position.managerPositionId))
      .map((position) => {
        const managerPoint = layout.positions[position.managerPositionId as string];
        const childPoint = layout.positions[position.id];
        const points = layout.waypoints[position.id]?.length >= 2
          ? layout.waypoints[position.id]
          : (managerPoint && childPoint ? this.orthogonalWaypoints(managerPoint, childPoint) : []);
        const edgeWaypoints = points.map((point) => `<di:waypoint x="${round(point.x)}" y="${round(point.y)}" />`).join('');
        return `      <bpmndi:BPMNEdge id="${escapeXml(this.reportingIdForPosition(position.id))}_di" bpmnElement="${escapeXml(this.reportingIdForPosition(position.id))}">${edgeWaypoints}</bpmndi:BPMNEdge>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_Enterprise ModelerOrgChart" targetNamespace="https://enterprise-modeler.local/bpmn/org-chart">
  <bpmn:process id="Process_Enterprise ModelerOrgChart" name="Enterprise Modeler Organisation Structure" isExecutable="false">
${taskXml}
${associationXml}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_Enterprise ModelerOrgChart">
    <bpmndi:BPMNPlane id="BPMNPlane_Enterprise ModelerOrgChart" bpmnElement="Process_Enterprise ModelerOrgChart">
${shapeXml}
${edgeXml}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }

  private applyDiagramMarkers(): void {
    if (!this.modeler || !this.data) return;
    const canvas = this.modeler.get<CanvasService>('canvas');
    const departmentIds = this.data.departments.map((department) => department.id);
    const colourEnabled = this.root?.querySelector<HTMLInputElement>('#org-chart-colour-departments')?.checked ?? false;

    this.scopedPositions.forEach((position) => {
      const elementId = this.elementIdForPosition(position.id);
      if (getPositionOccupants(this.data as OrganisationData, position.id).length === 0) {
        canvas.addMarker(elementId, 'org-chart-vacant-position');
      }

      if (colourEnabled && position.departmentId) {
        const index = Math.max(0, departmentIds.indexOf(position.departmentId)) % 8;
        canvas.addMarker(elementId, `org-chart-department-colour-${index}`);
      }
    });
  }

  private async synchroniseReportingLines(): Promise<void> {
    if (!this.modeler || !this.data || this.suppressChanges) return;
    const registry = this.modeler.get<ElementRegistryService>('elementRegistry');
    const managerByChild = new Map<string, string>();
    let duplicateChild = '';

    registry.getAll()
      .filter((element) => element.businessObject?.$type === 'bpmn:Association')
      .forEach((connection) => {
        const managerId = this.positionIdFromElement(connection.source);
        const childId = this.positionIdFromElement(connection.target);
        if (!managerId || !childId) return;
        if (managerByChild.has(childId) && managerByChild.get(childId) !== managerId) {
          duplicateChild = childId;
          return;
        }
        managerByChild.set(childId, managerId);
      });

    if (duplicateChild || this.hasCycleWithProposedManagers(managerByChild)) {
      this.undoInvalidReportingEdit(
        duplicateChild
          ? 'A Position can only have one reporting manager.'
          : 'That reporting-line change would create a circular hierarchy.',
      );
      return;
    }

    const scopedIds = new Set(this.scopedPositions.map((position) => position.id));
    let changed = false;

    this.scopedPositions.forEach((position) => {
      const proposedManager = managerByChild.get(position.id);
      const currentManager = position.managerPositionId;

      if (proposedManager) {
        if (currentManager !== proposedManager) {
          position.managerPositionId = proposedManager;
          changed = true;
        }
        return;
      }

      if (currentManager && scopedIds.has(currentManager)) {
        delete position.managerPositionId;
        changed = true;
      }
    });

    if (!changed) return;
    saveOrganisationLocally(this.data);
    document.dispatchEvent(new CustomEvent('enterprise-modeler:organisation-changed', {
      detail: { source: 'org-chart-diagram' },
    }));
    this.renderContextPanel();
  }

  private undoInvalidReportingEdit(message: string): void {
    if (!this.modeler || this.invalidUndoInProgress) return;
    this.invalidUndoInProgress = true;
    window.alert(message);
    try {
      this.modeler.get<CommandStackService>('commandStack').undo();
    } finally {
      window.setTimeout(() => {
        this.invalidUndoInProgress = false;
      }, 0);
    }
  }

  private hasCycleWithProposedManagers(managerByChild: Map<string, string>): boolean {
    if (!this.data) return false;
    const scopedIds = new Set(this.scopedPositions.map((position) => position.id));
    const managerOf = new Map<string, string>();

    this.data.positions.filter((position) => position.active).forEach((position) => {
      const proposed = managerByChild.get(position.id);
      if (proposed) {
        managerOf.set(position.id, proposed);
      } else if (!scopedIds.has(position.id) || (position.managerPositionId && !scopedIds.has(position.managerPositionId))) {
        if (position.managerPositionId) managerOf.set(position.id, position.managerPositionId);
      }
    });

    for (const position of this.data.positions.filter((candidate) => candidate.active)) {
      const seen = new Set<string>();
      let current: string | undefined = position.id;
      while (current) {
        if (seen.has(current)) return true;
        seen.add(current);
        current = managerOf.get(current);
      }
    }
    return false;
  }

  private async completeManagerLink(childPositionId: string, managerPositionId: string): Promise<void> {
    if (!this.modeler || !this.data) return;
    if (childPositionId === managerPositionId) {
      window.alert('A Position cannot report to itself.');
      return;
    }

    const proposed = new Map<string, string>();
    this.scopedPositions.forEach((position) => {
      if (position.managerPositionId) proposed.set(position.id, position.managerPositionId);
    });
    proposed.set(childPositionId, managerPositionId);
    if (this.hasCycleWithProposedManagers(proposed)) {
      window.alert('That reporting line would create a circular hierarchy and has been blocked.');
      return;
    }

    const registry = this.modeler.get<ElementRegistryService>('elementRegistry');
    const modeling = this.modeler.get<ModelingService>('modeling');
    const childElement = registry.get(this.elementIdForPosition(childPositionId));
    const managerElement = registry.get(this.elementIdForPosition(managerPositionId));
    if (!childElement || !managerElement) return;

    const existing = registry.getAll().find((element) =>
      element.businessObject?.$type === 'bpmn:Association'
      && this.positionIdFromElement(element.target) === childPositionId,
    );

    this.suppressChanges = true;
    try {
      if (existing) modeling.removeElements([existing]);
      modeling.connect(managerElement, childElement, {
        type: 'bpmn:Association',
        id: this.reportingIdForPosition(childPositionId),
      });
    } finally {
      this.suppressChanges = false;
    }

    this.cancelLinkMode();
    this.scheduleLayoutSave();
    await this.synchroniseReportingLines();
  }

  private startLinkMode(childPositionId: string): void {
    if (!this.modeler) return;
    this.cancelLinkMode();
    this.pendingChildPositionId = childPositionId;
    this.modeler.get<CanvasService>('canvas').addMarker(
      this.elementIdForPosition(childPositionId),
      LINK_SOURCE_MARKER,
    );
    this.renderContextPanel();
  }

  private cancelLinkMode(): void {
    if (this.modeler && this.pendingChildPositionId) {
      this.modeler.get<CanvasService>('canvas').removeMarker(
        this.elementIdForPosition(this.pendingChildPositionId),
        LINK_SOURCE_MARKER,
      );
    }
    this.pendingChildPositionId = '';
    this.renderContextPanel();
  }

  private renderContextPanel(): void {
    if (!this.contextPanel || !this.data) return;

    if (this.pendingChildPositionId) {
      const position = this.data.positions.find((candidate) => candidate.id === this.pendingChildPositionId);
      this.contextPanel.hidden = false;
      this.contextPanel.innerHTML = `
        <div class="org-chart-diagram-context-header">
          <div><strong>Relink reporting manager</strong><small>${escapeHtml(position?.name ?? this.pendingChildPositionId)}</small></div>
        </div>
        <div class="org-chart-diagram-context-body">
          <div class="org-chart-diagram-link-instruction">Click the Position that should become the new reporting manager. Existing reporting connector, if any, will be replaced.</div>
          <div class="org-chart-diagram-context-actions"><button class="toolbar-button" type="button" data-org-cancel-link>Cancel</button></div>
        </div>
      `;
      this.contextPanel.querySelector<HTMLButtonElement>('[data-org-cancel-link]')
        ?.addEventListener('click', () => this.cancelLinkMode());
      return;
    }

    const element = this.selectedElement;
    if (!element) {
      this.contextPanel.innerHTML = '';
      this.contextPanel.hidden = true;
      return;
    }

    const positionId = this.positionIdFromElement(element);
    if (positionId) {
      this.contextPanel.hidden = false;
      this.renderPositionContext(positionId);
      return;
    }

    if (element.businessObject?.$type === 'bpmn:Association') {
      this.contextPanel.hidden = false;
      this.renderReportingContext(element);
      return;
    }

    this.contextPanel.innerHTML = '';
    this.contextPanel.hidden = true;
  }

  private renderPositionContext(positionId: string): void {
    if (!this.contextPanel || !this.data) return;
    const position = this.data.positions.find((candidate) => candidate.id === positionId);
    if (!position) return;
    const occupants = getPositionOccupants(this.data, positionId);
    const occupant = occupants[0];
    const manager = position.managerPositionId
      ? this.data.positions.find((candidate) => candidate.id === position.managerPositionId)
      : undefined;
    const managerOccupant = manager ? getPositionOccupants(this.data, manager.id)[0] : undefined;

    this.contextPanel.innerHTML = `
      <div class="org-chart-diagram-context-header">
        <div><strong>${escapeHtml(occupant?.name ?? 'Vacant Position')}</strong><small>${escapeHtml(position.id)}</small></div>
        <button type="button" data-org-clear-selection aria-label="Clear selection">×</button>
      </div>
      <div class="org-chart-diagram-context-body">
        ${occupants.length > 1 ? `<div class="org-chart-diagram-warning">${occupants.length} active people are assigned to this Position. Review the Position data.</div>` : ''}
        <dl class="org-chart-diagram-context-grid">
          <dt>Position</dt><dd>${escapeHtml(position.name)}</dd>
          <dt>Role</dt><dd>${escapeHtml(getRoleName(this.data, position.roleId) || 'Not set')}</dd>
          <dt>Department</dt><dd>${escapeHtml(getDepartmentName(this.data, position.departmentId) || 'Not set')}</dd>
          <dt>Person</dt><dd>${escapeHtml(occupant?.name ?? 'VACANT')}</dd>
          <dt>Reports to</dt><dd>${escapeHtml(managerOccupant?.name ?? manager?.name ?? 'Top level')}</dd>
        </dl>
        <div class="org-chart-diagram-context-actions">
          <button class="toolbar-button toolbar-button-primary" type="button" data-org-link-manager>Link / Change Manager</button>
          <button class="toolbar-button" type="button" data-org-open-position>Open Position</button>
          ${occupant ? '<button class="toolbar-button" type="button" data-org-open-person>Open Person</button>' : ''}
        </div>
      </div>
    `;

    this.contextPanel.querySelector<HTMLButtonElement>('[data-org-clear-selection]')
      ?.addEventListener('click', () => this.modeler?.get<SelectionService>('selection').select([]));
    this.contextPanel.querySelector<HTMLButtonElement>('[data-org-link-manager]')
      ?.addEventListener('click', () => this.startLinkMode(positionId));
    this.contextPanel.querySelector<HTMLButtonElement>('[data-org-open-position]')
      ?.addEventListener('click', () => this.openOrganisationRecord('positions', '[data-edit-position]', 'editPosition', positionId));
    this.contextPanel.querySelector<HTMLButtonElement>('[data-org-open-person]')
      ?.addEventListener('click', () => {
        if (occupant) this.openOrganisationRecord('people', '[data-edit-person]', 'editPerson', occupant.id);
      });
  }

  private renderReportingContext(connection: DiagramElement): void {
    if (!this.contextPanel || !this.data) return;
    const managerId = this.positionIdFromElement(connection.source);
    const childId = this.positionIdFromElement(connection.target);
    const manager = this.data.positions.find((candidate) => candidate.id === managerId);
    const child = this.data.positions.find((candidate) => candidate.id === childId);
    const managerPerson = manager ? getPositionOccupants(this.data, manager.id)[0] : undefined;
    const childPerson = child ? getPositionOccupants(this.data, child.id)[0] : undefined;
    const managerLabel = managerPerson?.name ?? manager?.name ?? (managerId || 'Unknown');
    const childLabel = childPerson?.name ?? child?.name ?? (childId || 'Unknown');

    this.contextPanel.innerHTML = `
      <div class="org-chart-diagram-context-header">
        <div><strong>Reporting Line</strong><small>${escapeHtml(connection.id)}</small></div>
        <button type="button" data-org-clear-selection aria-label="Clear selection">×</button>
      </div>
      <div class="org-chart-diagram-context-body">
        <dl class="org-chart-diagram-context-grid">
          <dt>Manager</dt><dd>${escapeHtml(managerLabel)}</dd>
          <dt>Reports</dt><dd>${escapeHtml(childLabel)}</dd>
        </dl>
        <p>Delete this connector to make the subordinate Position top-level. Then select the Position and use <strong>Link / Change Manager</strong> to reconnect it elsewhere.</p>
        <div class="org-chart-diagram-context-actions">
          <button class="toolbar-button toolbar-button-danger" type="button" data-org-delete-reporting>Delete Reporting Line</button>
        </div>
      </div>
    `;

    this.contextPanel.querySelector<HTMLButtonElement>('[data-org-clear-selection]')
      ?.addEventListener('click', () => this.modeler?.get<SelectionService>('selection').select([]));
    this.contextPanel.querySelector<HTMLButtonElement>('[data-org-delete-reporting]')
      ?.addEventListener('click', () => {
        if (!this.modeler) return;
        this.modeler.get<ModelingService>('modeling').removeElements([connection]);
      });
  }

  private openOrganisationRecord(
    tabId: string,
    selector: string,
    datasetKey: string,
    recordId: string,
  ): void {
    const organisationButton = document.getElementById('organisation-button') as HTMLButtonElement | null;
    this.root?.closest<HTMLDialogElement>('.org-chart-dialog')?.close();
    organisationButton?.click();

    window.setTimeout(() => {
      const tab = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'))
        .find((button) => button.dataset.tab === tabId);
      tab?.click();
      window.setTimeout(() => {
        const record = Array.from(document.querySelectorAll<HTMLButtonElement>(selector))
          .find((button) => button.dataset[datasetKey] === recordId);
        record?.click();
      }, 0);
    }, 0);
  }

  private async reorganise(): Promise<void> {
    if (!this.modeler || !this.data) return;
    await this.synchroniseReportingLines();
    const layout = this.buildAutomaticLayout(this.scopedPositions);
    const registry = this.modeler.get<ElementRegistryService>('elementRegistry');
    const modeling = this.modeler.get<ModelingService>('modeling');

    this.suppressChanges = true;
    try {
      this.scopedPositions.forEach((position) => {
        const element = registry.get(this.elementIdForPosition(position.id));
        const target = layout.positions[position.id];
        if (!element || element.x === undefined || element.y === undefined || !target) return;
        modeling.moveShape(element, { x: target.x - element.x, y: target.y - element.y });
      });
    } finally {
      this.suppressChanges = false;
    }

    this.saveCurrentLayout();
    this.fitAfterLayout();
  }

  private fit(): void {
    if (!this.modeler || !this.host?.isConnected || this.host.getBoundingClientRect().width <= 0) return;
    this.modeler.get<CanvasService>('canvas').zoom('fit-viewport');
  }

  private fitAfterLayout(): void {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => this.fit());
    });
  }

  private saveCurrentLayout(): void {
    if (!this.modeler || !this.host?.isConnected) return;
    const registry = this.modeler.get<ElementRegistryService>('elementRegistry');
    const positions: Record<string, Point> = {};
    const waypoints: Record<string, Point[]> = {};

    registry.getAll().forEach((element) => {
      const positionId = this.positionIdFromElement(element);
      if (positionId && element.businessObject?.$type?.endsWith('Task') && element.x !== undefined && element.y !== undefined) {
        positions[positionId] = { x: element.x, y: element.y };
      }

      if (element.businessObject?.$type === 'bpmn:Association') {
        const childId = this.positionIdFromElement(element.target);
        if (childId && element.waypoints && element.waypoints.length >= 2) {
          waypoints[childId] = element.waypoints.map((point) => ({ x: point.x, y: point.y }));
        }
      }
    });

    localStorage.setItem(this.layoutStorageKey(), JSON.stringify({ positions, waypoints } satisfies OrgChartLayoutData));
  }

  private loadStoredLayout(): OrgChartLayoutData | null {
    const saved = localStorage.getItem(this.layoutStorageKey());
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved) as Partial<OrgChartLayoutData>;
      return {
        positions: parsed.positions ?? {},
        waypoints: parsed.waypoints ?? {},
      };
    } catch (error) {
      console.warn('Unable to parse the saved organisation chart layout.', error);
      return null;
    }
  }

  private layoutStorageKey(): string {
    return `${LAYOUT_KEY_PREFIX}${this.scopeId || 'whole-organisation'}`;
  }

  private positionIdFromElement(element: DiagramElement | undefined): string {
    if (!element?.id.startsWith(POSITION_PREFIX)) return '';
    return element.id.slice(POSITION_PREFIX.length);
  }

  private elementIdForPosition(positionId: string): string {
    return `${POSITION_PREFIX}${positionId}`;
  }

  private reportingIdForPosition(positionId: string): string {
    return `${REPORTING_PREFIX}${positionId}`;
  }
}

function round(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

new OrgChartDiagramController();
