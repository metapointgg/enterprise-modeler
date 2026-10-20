import './processRelationshipMap.css';

import {
  PROCESS_BPMN_AUTOSAVE_PREFIX,
  PROCESS_METADATA_AUTOSAVE_PREFIX,
  loadProcessRepository,
  type ProcessDefinitionRecord,
  type ProcessRepositorySnapshot,
} from './processCatalog';

const BPMN_NAMESPACE = 'http://www.omg.org/spec/BPMN/20100524/MODEL';

type RelationshipType = 'parent' | 'bpmn-call' | 'drill-down' | 'related';

interface RelationshipEdge {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label: string;
}

interface ProcessNodePosition {
  x: number;
  y: number;
}

interface RawMetadataLink {
  type?: string;
  targetProcessId?: string;
  label?: string;
}

interface RawNodeMetadata {
  links?: RawMetadataLink[];
}

interface RawProcessMetadata {
  nodes?: Record<string, RawNodeMetadata>;
}

class ProcessRelationshipMap {
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;
  private repository: ProcessRepositorySnapshot = {
    layers: { schemaVersion: 1, layers: [] },
    catalog: { schemaVersion: 1, rootProcessId: '', processes: [] },
  };
  private edges: RelationshipEdge[] = [];
  private focusProcessId = '';
  private enabledTypes = new Set<RelationshipType>([
    'parent',
    'bpmn-call',
    'drill-down',
    'related',
  ]);

  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'process-relationship-dialog';
    this.dialog.innerHTML = '<div id="process-relationship-root"></div>';
    document.body.appendChild(this.dialog);

    const root = this.dialog.querySelector<HTMLDivElement>('#process-relationship-root');
    if (!root) throw new Error('Unable to initialise Process Relationship Map.');
    this.root = root;

    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });

    document.addEventListener('enterprise-modeler:open-process-relationship-map', (event) => {
      const processId = (event as CustomEvent<{ processId?: string }>).detail?.processId ?? '';
      void this.open(processId);
    });

    this.injectEntryPoint();
    new MutationObserver(() => this.injectEntryPoint()).observe(document.body, {
      subtree: true,
      childList: true,
    });
  }

  private injectEntryPoint(): void {
    const submenu = document.querySelector<HTMLElement>(
      '.enterprise-modeler-sidebar-section[data-section-id="process"] .enterprise-modeler-sidebar-submenu',
    );
    if (!submenu || submenu.querySelector('[data-process-relationship-entry]')) return;

    const button = document.createElement('button');
    button.className = 'enterprise-modeler-sidebar-submenu-button';
    button.type = 'button';
    button.dataset.processRelationshipEntry = 'true';
    button.textContent = 'Process Relationship Map';
    button.addEventListener('click', () => void this.open());
    submenu.appendChild(button);
  }

  private async open(processId = ''): Promise<void> {
    this.renderLoading();
    if (!this.dialog.open) this.dialog.showModal();

    this.repository = await loadProcessRepository(true);
    this.edges = await this.buildRelationships();

    if (processId && this.repository.catalog.processes.some((process) => process.id === processId)) {
      this.focusProcessId = processId;
    } else if (
      this.focusProcessId &&
      !this.repository.catalog.processes.some((process) => process.id === this.focusProcessId)
    ) {
      this.focusProcessId = '';
    }

    this.render();
  }

  private renderLoading(): void {
    this.root.innerHTML = `
      <div class="process-relationship-loading">
        <div class="process-relationship-spinner"></div>
        <div>Building process relationship graph…</div>
      </div>
    `;
  }

  private render(): void {
    const visibleEdges = this.edges.filter((edge) => this.enabledTypes.has(edge.type));
    const visibleProcesses = this.getVisibleProcesses(visibleEdges);
    const visibleProcessIds = new Set(visibleProcesses.map((process) => process.id));
    const visibleEdgeCount = visibleEdges.filter(
      (edge) => visibleProcessIds.has(edge.sourceId) && visibleProcessIds.has(edge.targetId),
    ).length;

    this.root.innerHTML = `
      <div class="process-relationship-map">
        <header class="process-relationship-header">
          <div>
            <div class="process-relationship-title">Process Relationship Map</div>
            <div class="process-relationship-subtitle">Hierarchy, BPMN Call Activities and Enterprise Modeler process links across all process layers.</div>
          </div>
          <button id="process-relationship-close" class="metadata-close-button" type="button">×</button>
        </header>

        <div class="process-relationship-controls">
          <label>
            <span>Scope</span>
            <select id="process-relationship-focus">
              <option value="">Whole operating model</option>
              ${this.repository.catalog.processes
                .filter((process) => process.active)
                .sort((left, right) => left.name.localeCompare(right.name))
                .map((process) => `<option value="${escapeHtml(process.id)}"${process.id === this.focusProcessId ? ' selected' : ''}>${escapeHtml(process.name)}</option>`)
                .join('')}
            </select>
          </label>

          <fieldset>
            <legend>Relationships</legend>
            ${this.relationshipToggle('parent', 'Primary parent')}
            ${this.relationshipToggle('bpmn-call', 'BPMN Call')}
            ${this.relationshipToggle('drill-down', 'Drill-down')}
            ${this.relationshipToggle('related', 'Related / exception / supporting')}
          </fieldset>

          <div class="process-relationship-counts">
            <strong>${visibleProcesses.length}</strong> processes
            <span>·</span>
            <strong>${visibleEdgeCount}</strong> relationships
          </div>
        </div>

        <div class="process-relationship-legend">
          ${this.legendItem('parent', 'Primary parent')}
          ${this.legendItem('bpmn-call', 'BPMN Call Activity')}
          ${this.legendItem('drill-down', 'Metadata drill-down')}
          ${this.legendItem('related', 'Related / exception / supporting')}
          <span class="process-relationship-help">Click a process node to open its BPMN model.</span>
        </div>

        <div class="process-relationship-canvas">
          ${this.renderGraph(visibleProcesses, visibleEdges)}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private relationshipToggle(type: RelationshipType, label: string): string {
    return `
      <label class="process-relationship-toggle">
        <input type="checkbox" data-relationship-type="${type}"${this.enabledTypes.has(type) ? ' checked' : ''} />
        <span>${escapeHtml(label)}</span>
      </label>
    `;
  }

  private legendItem(type: RelationshipType, label: string): string {
    return `<span class="process-relationship-legend-item"><i class="relationship-swatch relationship-swatch-${type}"></i>${escapeHtml(label)}</span>`;
  }

  private bindEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#process-relationship-close')
      ?.addEventListener('click', () => this.dialog.close());

    this.root.querySelector<HTMLSelectElement>('#process-relationship-focus')
      ?.addEventListener('change', (event) => {
        this.focusProcessId = (event.currentTarget as HTMLSelectElement).value;
        this.render();
      });

    this.root.querySelectorAll<HTMLInputElement>('[data-relationship-type]')
      .forEach((checkbox) => checkbox.addEventListener('change', () => {
        const type = checkbox.dataset.relationshipType as RelationshipType | undefined;
        if (!type) return;
        if (checkbox.checked) this.enabledTypes.add(type);
        else this.enabledTypes.delete(type);
        this.render();
      }));

    this.root.querySelectorAll<SVGGElement>('[data-process-relationship-node]')
      .forEach((node) => node.addEventListener('click', () => {
        const processId = node.dataset.processRelationshipNode;
        if (!processId) return;
        this.dialog.close();
        document.dispatchEvent(new CustomEvent('enterprise-modeler:open-process', { detail: { processId } }));
      }));
  }

  private getVisibleProcesses(edges: RelationshipEdge[]): ProcessDefinitionRecord[] {
    const active = this.repository.catalog.processes.filter((process) => process.active);
    if (!this.focusProcessId) return active;

    const visibleIds = new Set<string>([this.focusProcessId]);
    edges.forEach((edge) => {
      if (edge.sourceId === this.focusProcessId) visibleIds.add(edge.targetId);
      if (edge.targetId === this.focusProcessId) visibleIds.add(edge.sourceId);
    });

    const focused = active.find((process) => process.id === this.focusProcessId);
    if (focused?.parentId) visibleIds.add(focused.parentId);
    active.filter((process) => process.parentId === this.focusProcessId)
      .forEach((process) => visibleIds.add(process.id));

    return active.filter((process) => visibleIds.has(process.id));
  }

  private renderGraph(processes: ProcessDefinitionRecord[], edges: RelationshipEdge[]): string {
    if (processes.length === 0) {
      return '<div class="process-relationship-empty">No processes are available for this view.</div>';
    }

    const processIds = new Set(processes.map((process) => process.id));
    const graphEdges = edges.filter(
      (edge) => processIds.has(edge.sourceId) && processIds.has(edge.targetId),
    );
    const orderedLayers = [...this.repository.layers.layers]
      .filter((layer) => processes.some((process) => process.layerId === layer.id))
      .sort((left, right) => left.sequence - right.sequence || left.code.localeCompare(right.code));

    const nodeWidth = 230;
    const nodeHeight = 62;
    const columnWidth = 310;
    const rowHeight = 96;
    const startX = 70;
    const startY = 90;
    const positions = new Map<string, ProcessNodePosition>();
    let maximumRows = 1;

    orderedLayers.forEach((layer, layerIndex) => {
      const layerProcesses = processes
        .filter((process) => process.layerId === layer.id)
        .sort((left, right) => left.name.localeCompare(right.name));
      maximumRows = Math.max(maximumRows, layerProcesses.length);
      layerProcesses.forEach((process, rowIndex) => {
        positions.set(process.id, {
          x: startX + layerIndex * columnWidth,
          y: startY + rowIndex * rowHeight,
        });
      });
    });

    const width = Math.max(1100, startX * 2 + orderedLayers.length * columnWidth);
    const height = Math.max(620, startY + maximumRows * rowHeight + 100);

    const layerHeaders = orderedLayers.map((layer, index) => {
      const x = startX + index * columnWidth;
      return `<g class="process-layer-heading"><text x="${x}" y="42">${escapeHtml(layer.code)} — ${escapeHtml(layer.name)}</text><line x1="${x}" y1="58" x2="${x + nodeWidth}" y2="58" /></g>`;
    }).join('');

    const edgeMarkup = graphEdges.map((edge) => {
      const source = positions.get(edge.sourceId);
      const target = positions.get(edge.targetId);
      if (!source || !target) return '';

      const sourceX = source.x + nodeWidth;
      const sourceY = source.y + nodeHeight / 2;
      const targetX = target.x;
      const targetY = target.y + nodeHeight / 2;
      let path = '';

      if (Math.abs(source.x - target.x) < 10) {
        const bendX = source.x + nodeWidth + 42;
        path = `M ${sourceX} ${sourceY} C ${bendX} ${sourceY}, ${bendX} ${targetY}, ${targetX + nodeWidth} ${targetY}`;
      } else {
        const middleX = (sourceX + targetX) / 2;
        path = `M ${sourceX} ${sourceY} C ${middleX} ${sourceY}, ${middleX} ${targetY}, ${targetX} ${targetY}`;
      }

      return `<path class="process-relationship-edge process-relationship-edge-${edge.type}" d="${path}" marker-end="url(#process-relationship-arrow)"><title>${escapeHtml(edge.label)}</title></path>`;
    }).join('');

    const nodeMarkup = processes.map((process) => {
      const position = positions.get(process.id);
      if (!position) return '';
      const layer = this.repository.layers.layers.find((candidate) => candidate.id === process.layerId);
      return `
        <g class="process-relationship-node" data-process-relationship-node="${escapeHtml(process.id)}" transform="translate(${position.x},${position.y})">
          <rect width="${nodeWidth}" height="${nodeHeight}" rx="8" ry="8" />
          <foreignObject x="10" y="7" width="${nodeWidth - 20}" height="${nodeHeight - 14}">
            <div xmlns="http://www.w3.org/1999/xhtml" class="process-relationship-node-copy">
              <small>${escapeHtml(layer?.code ?? 'Unlayered')}</small>
              <strong>${escapeHtml(process.name)}</strong>
            </div>
          </foreignObject>
          <title>${escapeHtml(process.name)} · Click to open</title>
        </g>
      `;
    }).join('');

    return `
      <svg class="process-relationship-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Enterprise Modeler process relationship map">
        <defs>
          <marker id="process-relationship-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L8,4 L0,8 z" />
          </marker>
        </defs>
        ${layerHeaders}
        <g class="process-relationship-edges">${edgeMarkup}</g>
        <g class="process-relationship-nodes">${nodeMarkup}</g>
      </svg>
    `;
  }

  private async buildRelationships(): Promise<RelationshipEdge[]> {
    const edges: RelationshipEdge[] = [];
    const activeProcesses = this.repository.catalog.processes.filter((process) => process.active);
    const processIds = new Set(activeProcesses.map((process) => process.id));
    const byBpmnId = new Map(activeProcesses.map((process) => [process.bpmnProcessId, process.id]));

    activeProcesses.forEach((process) => {
      if (process.parentId && processIds.has(process.parentId)) {
        edges.push({
          sourceId: process.parentId,
          targetId: process.id,
          type: 'parent',
          label: `Primary parent: ${this.processName(process.parentId)} → ${process.name}`,
        });
      }
    });

    const discovered = await Promise.all(activeProcesses.map(async (process) => {
      const [bpmnEdges, metadataEdges] = await Promise.all([
        this.loadBpmnRelationships(process, byBpmnId),
        this.loadMetadataRelationships(process, processIds),
      ]);
      return [...bpmnEdges, ...metadataEdges];
    }));

    discovered.flat().forEach((edge) => edges.push(edge));

    const unique = new Map<string, RelationshipEdge>();
    edges.forEach((edge) => {
      const key = `${edge.type}:${edge.sourceId}:${edge.targetId}`;
      const existing = unique.get(key);
      if (!existing) unique.set(key, edge);
      else if (edge.label && !existing.label.includes(edge.label)) existing.label += `; ${edge.label}`;
    });

    return [...unique.values()];
  }

  private async loadBpmnRelationships(
    process: ProcessDefinitionRecord,
    byBpmnId: Map<string, string>,
  ): Promise<RelationshipEdge[]> {
    try {
      const localXml = localStorage.getItem(`${PROCESS_BPMN_AUTOSAVE_PREFIX}${process.id}.xml`);
      let xmlText = localXml ?? '';
      if (!xmlText) {
        const response = await fetch(process.url, { cache: 'no-store' });
        if (!response.ok) return [];
        xmlText = await response.text();
      }

      const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
      const edges: RelationshipEdge[] = [];
      Array.from(xml.getElementsByTagNameNS(BPMN_NAMESPACE, 'callActivity')).forEach((element) => {
        const calledElement = element.getAttribute('calledElement') ?? '';
        const targetId = byBpmnId.get(calledElement) ?? '';
        if (!targetId || targetId === process.id) return;
        edges.push({
          sourceId: process.id,
          targetId,
          type: 'bpmn-call',
          label: element.getAttribute('name') || `BPMN Call Activity → ${this.processName(targetId)}`,
        });
      });
      return edges;
    } catch (error) {
      console.warn(`Unable to inspect BPMN relationships for ${process.id}.`, error);
      return [];
    }
  }

  private async loadMetadataRelationships(
    process: ProcessDefinitionRecord,
    processIds: Set<string>,
  ): Promise<RelationshipEdge[]> {
    try {
      const local = localStorage.getItem(`${PROCESS_METADATA_AUTOSAVE_PREFIX}${process.id}`);
      let metadata: RawProcessMetadata;
      if (local) {
        metadata = JSON.parse(local) as RawProcessMetadata;
      } else {
        const response = await fetch(process.metadataUrl, { cache: 'no-store' });
        if (!response.ok) return [];
        metadata = await response.json() as RawProcessMetadata;
      }

      const edges: RelationshipEdge[] = [];
      Object.entries(metadata.nodes ?? {}).forEach(([nodeId, node]) => {
        (node.links ?? []).forEach((link) => {
          const targetId = link.targetProcessId ?? '';
          if (!targetId || targetId === process.id || !processIds.has(targetId)) return;
          const type: RelationshipType = link.type === 'drill-down' ? 'drill-down' : 'related';
          edges.push({
            sourceId: process.id,
            targetId,
            type,
            label: `${link.label || link.type || 'Process link'} · ${nodeId}`,
          });
        });
      });
      return edges;
    } catch (error) {
      console.warn(`Unable to inspect process metadata relationships for ${process.id}.`, error);
      return [];
    }
  }

  private processName(processId: string): string {
    return this.repository.catalog.processes.find((process) => process.id === processId)?.name ?? processId;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

new ProcessRelationshipMap();
