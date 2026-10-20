import './systemsCatalog.css';

import {
  ARCHITECTURE_LAYERS,
  exportRegistryJson,
  generateRegistryId,
  getArchitectureLayerLabel,
  loadIntegrationData,
  loadProcessGovernance,
  saveIntegrationDataLocally,
  type ArchitectureLayer,
  type IntegrationData,
  type ProcessGovernanceData,
  type SystemRecord,
} from './operatingModelRegistry';
import {
  loadProcessRepository,
  type ProcessDefinitionRecord,
  type ProcessRepositorySnapshot,
} from './processCatalog';
import {
  getPositionName,
  loadOrganisation,
  type OrganisationData,
} from './organisation';

interface SystemFilters {
  query: string;
  criticality: string;
  architectureLayer: string;
  state: string;
}

class SystemsCatalog {
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;
  private data: IntegrationData = { schemaVersion: 2, systems: [], interfaces: [] };
  private governance: ProcessGovernanceData = { schemaVersion: 1, records: [] };
  private repository: ProcessRepositorySnapshot = {
    layers: { schemaVersion: 1, layers: [] },
    catalog: { schemaVersion: 1, rootProcessId: '', processes: [] },
  };
  private organisation: OrganisationData | null = null;
  private selectedId = '';
  private filters: SystemFilters = {
    query: '',
    criticality: '',
    architectureLayer: '',
    state: 'active',
  };

  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'systems-catalog-dialog';
    this.dialog.innerHTML = '<div id="systems-catalog-root"></div>';
    document.body.appendChild(this.dialog);

    const root = this.dialog.querySelector<HTMLDivElement>('#systems-catalog-root');
    if (!root) throw new Error('Unable to initialise Systems Catalogue.');
    this.root = root;

    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });

    document.addEventListener('enterprise-modeler:open-systems-catalog', (event) => {
      this.selectedId = (event as CustomEvent<{ recordId?: string }>).detail?.recordId ?? '';
      void this.open();
    });

    document.addEventListener('enterprise-modeler:operating-model-registry-changed', () => {
      if (this.dialog.open) void this.open(this.selectedId);
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
    if (!submenu || submenu.querySelector('[data-systems-catalog-entry]')) return;

    const button = document.createElement('button');
    button.className = 'enterprise-modeler-sidebar-submenu-button';
    button.type = 'button';
    button.dataset.systemsCatalogEntry = 'true';
    button.textContent = 'Systems Catalogue';
    button.addEventListener('click', () => void this.open());
    submenu.appendChild(button);
  }

  private async open(recordId = ''): Promise<void> {
    const [data, governance, repository, organisation] = await Promise.all([
      loadIntegrationData(true),
      loadProcessGovernance(true),
      loadProcessRepository(true),
      loadOrganisation(),
    ]);

    this.data = data;
    this.governance = governance;
    this.repository = repository;
    this.organisation = organisation;

    if (recordId && data.systems.some((system) => system.id === recordId)) {
      this.selectedId = recordId;
    } else if (this.selectedId && !data.systems.some((system) => system.id === this.selectedId)) {
      this.selectedId = '';
    }

    this.render();
    if (!this.dialog.open) this.dialog.showModal();
  }

  private render(): void {
    const systems = this.filteredSystems();
    const selected = this.data.systems.find((system) => system.id === this.selectedId) ?? null;
    const usedSystemIds = new Set(
      this.data.systems
        .filter((system) => this.usedByProcesses(system.id).length > 0)
        .map((system) => system.id),
    );

    this.root.innerHTML = `
      <div class="systems-catalog">
        <header class="systems-catalog-header">
          <div>
            <div class="systems-catalog-title">Systems Catalogue</div>
            <div class="systems-catalog-subtitle">Application and partner inventory linked to processes, interfaces and solution architecture.</div>
          </div>
          <div class="systems-catalog-actions">
            <button id="systems-catalog-export" class="toolbar-button" type="button">Export Catalogue</button>
            <button id="systems-catalog-close" class="metadata-close-button" type="button">×</button>
          </div>
        </header>

        <div class="systems-catalog-summary">
          ${this.summaryCard('Systems', this.data.systems.length)}
          ${this.summaryCard('Active', this.data.systems.filter((system) => system.active).length)}
          ${this.summaryCard('High Criticality', this.data.systems.filter((system) => system.active && system.criticality === 'high').length)}
          ${this.summaryCard('Used by Processes', usedSystemIds.size)}
        </div>

        <div class="systems-catalog-filters">
          <input id="systems-filter-query" type="search" value="${escapeHtml(this.filters.query)}" placeholder="Search systems…" />
          <select id="systems-filter-layer">
            <option value="">All architecture layers</option>
            ${ARCHITECTURE_LAYERS.map((layer) => `<option value="${layer.id}"${layer.id === this.filters.architectureLayer ? ' selected' : ''}>${escapeHtml(layer.label)}</option>`).join('')}
          </select>
          <select id="systems-filter-criticality">
            <option value="">All criticalities</option>
            ${['high', 'medium', 'low'].map((value) => `<option value="${value}"${value === this.filters.criticality ? ' selected' : ''}>${capitalise(value)}</option>`).join('')}
          </select>
          <select id="systems-filter-state">
            <option value="active"${this.filters.state === 'active' ? ' selected' : ''}>Active</option>
            <option value="all"${this.filters.state === 'all' ? ' selected' : ''}>Active & inactive</option>
            <option value="inactive"${this.filters.state === 'inactive' ? ' selected' : ''}>Inactive only</option>
          </select>
          <button id="systems-catalog-new" class="toolbar-button toolbar-button-primary" type="button">New System</button>
        </div>

        <div class="systems-catalog-body">
          <div class="systems-catalog-table-pane">${this.renderTable(systems)}</div>
          <aside class="systems-catalog-detail-pane">${this.renderDetails(selected)}</aside>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private summaryCard(label: string, value: number): string {
    return `<div class="systems-summary-card"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
  }

  private renderTable(systems: SystemRecord[]): string {
    if (systems.length === 0) {
      return '<div class="systems-catalog-empty">No systems match the current filters.</div>';
    }

    return `
      <table class="systems-catalog-table">
        <thead>
          <tr>
            <th>System</th>
            <th>Type</th>
            <th>Architecture Layer</th>
            <th>Owner</th>
            <th>Criticality</th>
            <th>Supplier</th>
            <th>Processes</th>
            <th>Interfaces</th>
          </tr>
        </thead>
        <tbody>
          ${systems.map((system) => {
            const owner = this.organisation
              ? getPositionName(this.organisation, system.ownerPositionId)
              : system.ownerPositionId;
            const processCount = this.usedByProcesses(system.id).length;
            const interfaceCount = this.connectedInterfaces(system.id).length;
            return `
              <tr class="${system.id === this.selectedId ? 'systems-catalog-row-selected' : ''}" data-system-row="${escapeHtml(system.id)}">
                <td><strong>${escapeHtml(system.name)}</strong>${system.active ? '' : '<small>Inactive</small>'}</td>
                <td>${escapeHtml(system.type || '—')}</td>
                <td>${escapeHtml(getArchitectureLayerLabel(system.architectureLayer))}</td>
                <td>${escapeHtml(owner || 'Unassigned')}</td>
                <td><span class="systems-criticality systems-criticality-${system.criticality}">${capitalise(system.criticality)}</span></td>
                <td>${escapeHtml(system.supplier || '—')}</td>
                <td>${processCount}</td>
                <td>${interfaceCount}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  private renderDetails(system: SystemRecord | null): string {
    if (!system && this.selectedId) {
      return '<div class="systems-catalog-empty">The selected system no longer exists.</div>';
    }

    if (!system) {
      return this.renderForm(null);
    }

    const processes = this.usedByProcesses(system.id);
    const interfaces = this.connectedInterfaces(system.id);

    return `
      ${this.renderForm(system)}

      <section class="systems-impact-section">
        <h3>Process Usage</h3>
        ${processes.length === 0
          ? '<div class="systems-catalog-empty-inline">No process currently references this system or one of its interfaces.</div>'
          : processes.map((process) => `<button class="systems-impact-link" type="button" data-open-process="${escapeHtml(process.id)}"><span>${escapeHtml(process.name)}</span><small>${escapeHtml(process.id)}</small></button>`).join('')}
      </section>

      <section class="systems-impact-section">
        <h3>Connected Interfaces</h3>
        ${interfaces.length === 0
          ? '<div class="systems-catalog-empty-inline">No interfaces currently connect this system.</div>'
          : interfaces.map((item) => `<button class="systems-impact-link" type="button" data-open-interface="${escapeHtml(item.id)}"><span>${escapeHtml(item.name)}</span><small>${escapeHtml(this.systemName(item.sourceSystemId))} → ${escapeHtml(this.systemName(item.targetSystemId))}</small></button>`).join('')}
      </section>
    `;
  }

  private renderForm(system: SystemRecord | null): string {
    return `
      <form id="systems-catalog-form" class="systems-catalog-form">
        <div class="systems-detail-heading">
          <div>
            <h3>${system ? 'System details' : 'Add system'}</h3>
            ${system ? `<small>${escapeHtml(system.id)}</small>` : ''}
          </div>
          ${system ? '<button id="systems-catalog-delete" class="toolbar-button toolbar-button-danger" type="button">Delete</button>' : ''}
        </div>

        <label class="metadata-field"><span>Name</span><input id="systems-name" required value="${escapeHtml(system?.name ?? '')}" /></label>
        <label class="metadata-field"><span>Type</span><input id="systems-type" value="${escapeHtml(system?.type ?? '')}" placeholder="e.g. CRM, ledger, customer channel" /></label>
        <label class="metadata-field"><span>Architecture layer</span><select id="systems-layer">${this.architectureLayerOptions(system?.architectureLayer ?? 'other')}</select></label>

        <div class="systems-two-col">
          <label class="metadata-field"><span>Supplier</span><input id="systems-supplier" value="${escapeHtml(system?.supplier ?? '')}" placeholder="Supplier / owner or TBC" /></label>
          <label class="metadata-field"><span>Environment</span><input id="systems-environment" value="${escapeHtml(system?.environment ?? '')}" placeholder="e.g. Production / multi-environment / TBC" /></label>
        </div>

        <div class="systems-two-col">
          <label class="metadata-field"><span>Data classification</span><input id="systems-data-classification" value="${escapeHtml(system?.dataClassification ?? '')}" placeholder="Classification or TBC" /></label>
          <label class="metadata-field"><span>Integration type</span><input id="systems-integration-type" value="${escapeHtml(system?.integrationType ?? '')}" placeholder="e.g. API consumer, partner API" /></label>
        </div>

        <div class="systems-two-col">
          <label class="metadata-field"><span>Owner position</span><select id="systems-owner"><option value="">Unassigned</option>${this.positionOptions(system?.ownerPositionId ?? '')}</select></label>
          <label class="metadata-field"><span>Criticality</span><select id="systems-criticality">${this.criticalityOptions(system?.criticality ?? 'medium')}</select></label>
        </div>

        <label class="organisation-checkbox-row"><input id="systems-active" type="checkbox"${system?.active !== false ? ' checked' : ''} /><span>Active</span></label>
        <label class="metadata-field"><span>Notes</span><textarea id="systems-notes" rows="4">${escapeHtml(system?.notes ?? '')}</textarea></label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${system ? 'Save System' : 'Add System'}</button>
        </div>
      </form>
    `;
  }

  private bindEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#systems-catalog-close')
      ?.addEventListener('click', () => this.dialog.close());
    this.root.querySelector<HTMLButtonElement>('#systems-catalog-export')
      ?.addEventListener('click', () => exportRegistryJson('integrations.json', this.data));
    this.root.querySelector<HTMLButtonElement>('#systems-catalog-new')
      ?.addEventListener('click', () => {
        this.selectedId = '';
        this.render();
      });
    this.root.querySelector<HTMLButtonElement>('#systems-catalog-delete')
      ?.addEventListener('click', () => void this.deleteSelected());

    this.bindFilter('#systems-filter-query', 'query');
    this.bindFilter('#systems-filter-layer', 'architectureLayer');
    this.bindFilter('#systems-filter-criticality', 'criticality');
    this.bindFilter('#systems-filter-state', 'state');

    this.root.querySelectorAll<HTMLTableRowElement>('[data-system-row]')
      .forEach((row) => row.addEventListener('click', () => {
        this.selectedId = row.dataset.systemRow ?? '';
        this.render();
      }));

    this.root.querySelector<HTMLFormElement>('#systems-catalog-form')
      ?.addEventListener('submit', (event) => {
        event.preventDefault();
        this.saveSelected();
      });

    this.root.querySelectorAll<HTMLButtonElement>('[data-open-process]')
      .forEach((button) => button.addEventListener('click', () => {
        const processId = button.dataset.openProcess;
        if (!processId) return;
        this.dialog.close();
        document.dispatchEvent(new CustomEvent('enterprise-modeler:open-process', { detail: { processId } }));
      }));

    this.root.querySelectorAll<HTMLButtonElement>('[data-open-interface]')
      .forEach((button) => button.addEventListener('click', () => {
        const recordId = button.dataset.openInterface;
        if (!recordId) return;
        this.dialog.close();
        document.dispatchEvent(new CustomEvent('enterprise-modeler:open-integration-catalog', {
          detail: { recordKind: 'interface', recordId },
        }));
      }));
  }

  private bindFilter(selector: string, key: keyof SystemFilters): void {
    const element = this.root.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
    element?.addEventListener('input', () => {
      const value = element.value;
      this.filters[key] = value;
      this.render();
      if (key === 'query') {
        const next = this.root.querySelector<HTMLInputElement>(selector);
        next?.focus();
        next?.setSelectionRange(value.length, value.length);
      }
    });
  }

  private saveSelected(): void {
    const name = this.value('#systems-name');
    if (!name) {
      window.alert('System name is required.');
      return;
    }

    const existing = this.data.systems.find((system) => system.id === this.selectedId);
    const criticalityValue = this.value('#systems-criticality');
    const layerValue = this.value('#systems-layer');
    const architectureLayer = ARCHITECTURE_LAYERS.some((layer) => layer.id === layerValue)
      ? layerValue as ArchitectureLayer
      : 'other';

    const record: SystemRecord = {
      id: existing?.id ?? generateRegistryId('system', name),
      name,
      type: this.value('#systems-type'),
      architectureLayer,
      supplier: this.value('#systems-supplier'),
      environment: this.value('#systems-environment'),
      dataClassification: this.value('#systems-data-classification'),
      integrationType: this.value('#systems-integration-type'),
      ownerPositionId: this.value('#systems-owner'),
      criticality: criticalityValue === 'low' || criticalityValue === 'high'
        ? criticalityValue
        : 'medium',
      active: this.root.querySelector<HTMLInputElement>('#systems-active')?.checked ?? true,
      notes: this.value('#systems-notes'),
    };

    if (existing) Object.assign(existing, record);
    else this.data.systems.push(record);

    this.selectedId = record.id;
    saveIntegrationDataLocally(this.data);
    this.render();
  }

  private async deleteSelected(): Promise<void> {
    if (!this.selectedId) return;

    const referencedByInterface = this.data.interfaces.some(
      (item) => item.sourceSystemId === this.selectedId || item.targetSystemId === this.selectedId,
    );
    const referencedByProcess = this.governance.records.some(
      (record) => record.systemIds.includes(this.selectedId),
    );

    if (referencedByInterface || referencedByProcess) {
      window.alert('This system is still referenced by an interface or process and cannot be deleted. Remove those references first.');
      return;
    }

    if (!window.confirm('Delete this system from the Systems Catalogue?')) return;

    this.data.systems = this.data.systems.filter((system) => system.id !== this.selectedId);
    this.selectedId = '';
    saveIntegrationDataLocally(this.data);
    this.render();
  }

  private filteredSystems(): SystemRecord[] {
    const query = this.filters.query.trim().toLowerCase();
    return [...this.data.systems]
      .filter((system) => {
        const matchesQuery = !query || [
          system.name,
          system.id,
          system.type,
          system.supplier,
          system.environment,
          system.dataClassification,
          system.integrationType,
          system.notes,
        ].join(' ').toLowerCase().includes(query);
        const matchesCriticality = !this.filters.criticality || system.criticality === this.filters.criticality;
        const matchesLayer = !this.filters.architectureLayer || system.architectureLayer === this.filters.architectureLayer;
        const matchesState = this.filters.state === 'all'
          || (this.filters.state === 'active' && system.active)
          || (this.filters.state === 'inactive' && !system.active);
        return matchesQuery && matchesCriticality && matchesLayer && matchesState;
      })
      .sort((left, right) => {
        const leftLayer = ARCHITECTURE_LAYERS.find((layer) => layer.id === left.architectureLayer)?.sequence ?? 999;
        const rightLayer = ARCHITECTURE_LAYERS.find((layer) => layer.id === right.architectureLayer)?.sequence ?? 999;
        return leftLayer - rightLayer || left.name.localeCompare(right.name);
      });
  }

  private usedByProcesses(systemId: string): ProcessDefinitionRecord[] {
    const connectedInterfaceIds = new Set(
      this.data.interfaces
        .filter((item) => item.sourceSystemId === systemId || item.targetSystemId === systemId)
        .map((item) => item.id),
    );

    const usedIds = new Set(
      this.governance.records
        .filter((record) => record.systemIds.includes(systemId)
          || record.interfaceIds.some((interfaceId) => connectedInterfaceIds.has(interfaceId)))
        .map((record) => record.processId),
    );

    return this.repository.catalog.processes
      .filter((process) => usedIds.has(process.id))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private connectedInterfaces(systemId: string) {
    return this.data.interfaces
      .filter((item) => item.sourceSystemId === systemId || item.targetSystemId === systemId)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private systemName(systemId: string): string {
    return this.data.systems.find((system) => system.id === systemId)?.name ?? systemId;
  }

  private value(selector: string): string {
    return this.root.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector)?.value.trim() ?? '';
  }

  private architectureLayerOptions(selected: ArchitectureLayer): string {
    return ARCHITECTURE_LAYERS
      .map((layer) => `<option value="${layer.id}"${layer.id === selected ? ' selected' : ''}>${escapeHtml(layer.label)}</option>`)
      .join('');
  }

  private criticalityOptions(selected: string): string {
    return ['low', 'medium', 'high']
      .map((value) => `<option value="${value}"${value === selected ? ' selected' : ''}>${capitalise(value)}</option>`)
      .join('');
  }

  private positionOptions(selected: string): string {
    if (!this.organisation) return '';
    return this.organisation.positions
      .filter((position) => position.active || position.id === selected)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((position) => `<option value="${escapeHtml(position.id)}"${position.id === selected ? ' selected' : ''}>${escapeHtml(getPositionName(this.organisation as OrganisationData, position.id))}</option>`)
      .join('');
  }
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

new SystemsCatalog();
