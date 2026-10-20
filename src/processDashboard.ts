import './processDashboard.css';

import {
  getProcessLayerCode,
  loadProcessRepository,
  type ProcessDefinitionRecord,
  type ProcessRepositorySnapshot,
} from './processCatalog';
import {
  ensureProcessGovernanceRecords,
  exportRegistryJson,
  getLifecycleLabel,
  loadIntegrationData,
  loadProcessGovernance,
  loadRegulationData,
  PROCESS_CHANNELS,
  PROCESS_LIFECYCLE_STATUSES,
  saveProcessGovernanceLocally,
  type IntegrationData,
  type ProcessChannel,
  type ProcessGovernanceData,
  type ProcessGovernanceRecord,
  type ProcessLifecycleStatus,
  type RegulationData,
} from './operatingModelRegistry';
import {
  getPositionName,
  loadOrganisation,
  type OrganisationData,
} from './organisation';

interface DashboardFilters {
  query: string;
  layerId: string;
  status: string;
  ownerPositionId: string;
  channel: string;
}

class ProcessDashboard {
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;
  private repository: ProcessRepositorySnapshot = {
    layers: { schemaVersion: 1, layers: [] },
    catalog: { schemaVersion: 1, rootProcessId: '', processes: [] },
  };
  private governance: ProcessGovernanceData = { schemaVersion: 1, records: [] };
  private integrations: IntegrationData = { schemaVersion: 1, systems: [], interfaces: [] };
  private regulations: RegulationData = { schemaVersion: 1, regulations: [] };
  private organisation: OrganisationData | null = null;
  private selectedProcessId = '';
  private filters: DashboardFilters = {
    query: '',
    layerId: '',
    status: '',
    ownerPositionId: '',
    channel: '',
  };

  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'process-dashboard-dialog';
    this.dialog.innerHTML = '<div id="process-dashboard-root"></div>';
    document.body.appendChild(this.dialog);

    const root = this.dialog.querySelector<HTMLDivElement>('#process-dashboard-root');
    if (!root) {
      throw new Error('Unable to initialise Process Dashboard.');
    }
    this.root = root;

    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) {
        this.dialog.close();
      }
    });

    document.addEventListener('enterprise-modeler:operating-model-registry-changed', () => {
      if (this.dialog.open) void this.open(this.selectedProcessId);
    });
    document.addEventListener('enterprise-modeler:process-repository-changed', () => {
      if (this.dialog.open) void this.open(this.selectedProcessId);
    });
    document.addEventListener('enterprise-modeler:open-process-dashboard', (event) => {
      const detail = (event as CustomEvent<{ processId?: string }>).detail;
      void this.open(detail?.processId ?? '');
    });

    this.injectEntryPoint();
    const observer = new MutationObserver(() => this.injectEntryPoint());
    observer.observe(document.body, { subtree: true, childList: true });
  }

  private injectEntryPoint(): void {
    if (!document.getElementById('process-dashboard-button')) {
      const hiddenButton = document.createElement('button');
      hiddenButton.id = 'process-dashboard-button';
      hiddenButton.type = 'button';
      hiddenButton.hidden = true;
      hiddenButton.addEventListener('click', () => void this.open());
      document.body.appendChild(hiddenButton);
    }

    const submenu = document.querySelector<HTMLElement>(
      '.enterprise-modeler-sidebar-section[data-section-id="process"] .enterprise-modeler-sidebar-submenu',
    );
    if (!submenu || submenu.querySelector('[data-process-dashboard-entry]')) return;

    const button = document.createElement('button');
    button.className = 'enterprise-modeler-sidebar-submenu-button';
    button.type = 'button';
    button.dataset.processDashboardEntry = 'true';
    button.textContent = 'Process Dashboard';
    button.addEventListener('click', () => void this.open());
    submenu.insertBefore(button, submenu.firstChild);
  }

  private async open(processId = ''): Promise<void> {
    const [repository, governance, integrations, regulations, organisation] = await Promise.all([
      loadProcessRepository(true),
      loadProcessGovernance(true),
      loadIntegrationData(true),
      loadRegulationData(true),
      loadOrganisation(),
    ]);

    this.repository = repository;
    this.governance = ensureProcessGovernanceRecords(governance, repository.catalog.processes.map((process) => process.id));
    this.integrations = integrations;
    this.regulations = regulations;
    this.organisation = organisation;

    if (processId && repository.catalog.processes.some((process) => process.id === processId)) {
      this.selectedProcessId = processId;
    } else if (this.selectedProcessId && !repository.catalog.processes.some((process) => process.id === this.selectedProcessId)) {
      this.selectedProcessId = '';
    }

    this.render();
    if (!this.dialog.open) this.dialog.showModal();
  }

  private render(): void {
    const records = this.filteredProcesses();
    this.root.innerHTML = `
      <div class="process-dashboard">
        <header class="process-dashboard-header">
          <div><div class="process-dashboard-title">Process Dashboard</div><div class="process-dashboard-subtitle">Governance, ownership, channel, system and regulatory coverage across the Enterprise Modeler operating model.</div></div>
          <div class="process-dashboard-header-actions"><button id="process-dashboard-export" class="toolbar-button" type="button">Export Governance</button><button id="process-dashboard-close" class="metadata-close-button" type="button" title="Close">×</button></div>
        </header>
        <div class="process-dashboard-summary">
          ${this.renderSummaryCard('Processes', this.repository.catalog.processes.filter((process) => process.active).length, '')}
          ${this.renderSummaryCard('Draft', this.countStatus('draft'), 'draft')}
          ${this.renderSummaryCard('In Review', this.countStatus('in-review'), 'in-review')}
          ${this.renderSummaryCard('Approved', this.countStatus('approved'), 'approved')}
          ${this.renderSummaryCard('Published', this.countStatus('published'), 'published')}
        </div>
        <div class="process-dashboard-filters">
          <input id="process-dashboard-filter-query" type="search" value="${escapeHtml(this.filters.query)}" placeholder="Search process name…" />
          <select id="process-dashboard-filter-layer"><option value="">All layers</option>${this.repository.layers.layers.map((layer) => `<option value="${escapeHtml(layer.id)}"${layer.id === this.filters.layerId ? ' selected' : ''}>${escapeHtml(layer.code)} — ${escapeHtml(layer.name)}</option>`).join('')}</select>
          <select id="process-dashboard-filter-status"><option value="">All statuses</option>${PROCESS_LIFECYCLE_STATUSES.map((status) => `<option value="${status.id}"${status.id === this.filters.status ? ' selected' : ''}>${status.label}</option>`).join('')}</select>
          <select id="process-dashboard-filter-owner"><option value="">All owners</option>${this.ownerOptions(this.filters.ownerPositionId, false)}</select>
          <select id="process-dashboard-filter-channel"><option value="">All channels</option>${PROCESS_CHANNELS.map((channel) => `<option value="${channel.id}"${channel.id === this.filters.channel ? ' selected' : ''}>${channel.label}</option>`).join('')}</select>
        </div>
        <div class="process-dashboard-body"><div class="process-dashboard-table-pane">${this.renderTable(records)}</div><aside class="process-dashboard-detail-pane">${this.renderDetails()}</aside></div>
      </div>`;
    this.bindEvents();
  }

  private renderSummaryCard(label: string, count: number, status: string): string {
    return `<button class="process-dashboard-summary-card" type="button" data-summary-status="${escapeHtml(status)}"><strong>${count}</strong><span>${escapeHtml(label)}</span></button>`;
  }

  private renderTable(processes: ProcessDefinitionRecord[]): string {
    if (processes.length === 0) return '<div class="process-dashboard-empty">No processes match the current filters.</div>';
    return `<table class="process-dashboard-table"><thead><tr><th>Process</th><th>Level</th><th>Owner</th><th>Status</th><th>Version</th><th>Channels</th><th>Systems</th><th>APIs</th><th>Regulation</th></tr></thead><tbody>${processes.map((process) => {
      const governance = this.governanceFor(process.id);
      const owner = this.organisation ? getPositionName(this.organisation, governance.ownerPositionId) : governance.ownerPositionId;
      return `<tr class="${process.id === this.selectedProcessId ? 'process-dashboard-row-selected' : ''}" data-process-dashboard-row="${escapeHtml(process.id)}"><td><strong>${escapeHtml(process.name)}</strong></td><td>${escapeHtml(getProcessLayerCode(process.layerId))}</td><td>${escapeHtml(owner || 'Unassigned')}</td><td><span class="process-status process-status-${governance.status}">${escapeHtml(getLifecycleLabel(governance.status))}</span></td><td>${escapeHtml(governance.version)}</td><td>${escapeHtml(this.channelLabels(governance.channels))}</td><td>${governance.systemIds.length}</td><td>${governance.interfaceIds.length}</td><td>${governance.regulationIds.length}</td></tr>`;
    }).join('')}</tbody></table>`;
  }

  private renderDetails(): string {
    const process = this.repository.catalog.processes.find((candidate) => candidate.id === this.selectedProcessId);
    if (!process) return '<div class="process-dashboard-empty process-dashboard-select-prompt">Select a process to view and edit governance.</div>';
    const governance = this.governanceFor(process.id);
    return `<form id="process-dashboard-governance-form" class="process-dashboard-form">
      <div class="process-dashboard-detail-heading"><div><strong>${escapeHtml(process.name)}</strong><small>${escapeHtml(getProcessLayerCode(process.layerId))} · ${escapeHtml(process.id)}</small></div><button id="process-dashboard-open-model" class="toolbar-button" type="button">Open Model</button></div>
      <label class="metadata-field"><span>Lifecycle status</span><select id="process-dashboard-status">${PROCESS_LIFECYCLE_STATUSES.map((status) => `<option value="${status.id}"${status.id === governance.status ? ' selected' : ''}>${status.label}</option>`).join('')}</select></label>
      <label class="metadata-field"><span>Process owner</span><select id="process-dashboard-owner"><option value="">Unassigned</option>${this.ownerOptions(governance.ownerPositionId, true)}</select></label>
      <label class="metadata-field"><span>Approver</span><select id="process-dashboard-approver"><option value="">Unassigned</option>${this.ownerOptions(governance.approverPositionId, true)}</select></label>
      <label class="metadata-field"><span>Business version</span><input id="process-dashboard-version" type="text" value="${escapeHtml(governance.version)}" placeholder="e.g. 1.0" /></label>
      <div class="process-dashboard-date-grid"><label class="metadata-field"><span>Effective date</span><input id="process-dashboard-effective" type="date" value="${escapeHtml(governance.effectiveDate)}" /></label><label class="metadata-field"><span>Next review</span><input id="process-dashboard-review" type="date" value="${escapeHtml(governance.reviewDate)}" /></label></div>
      ${this.renderCheckboxGroup('Channels', 'channel', PROCESS_CHANNELS.map((channel) => ({ id: channel.id, label: channel.label })), governance.channels)}
      ${this.renderCheckboxGroup('Systems', 'system', this.integrations.systems.filter((system) => system.active).map((system) => ({ id: system.id, label: system.name })), governance.systemIds)}
      ${this.renderCheckboxGroup('APIs / Interfaces', 'interface', this.integrations.interfaces.filter((item) => item.status !== 'retired').map((item) => ({ id: item.id, label: item.name })), governance.interfaceIds)}
      ${this.renderCheckboxGroup('Regulatory obligations', 'regulation', this.regulations.regulations.filter((item) => item.active).map((item) => ({ id: item.id, label: item.name })), governance.regulationIds)}
      <label class="metadata-field"><span>Change summary</span><textarea id="process-dashboard-change-summary" rows="3">${escapeHtml(governance.changeSummary)}</textarea></label>
      <div class="process-dashboard-updated">Last governance update: ${escapeHtml(governance.updatedAt ? formatDate(governance.updatedAt) : 'Not recorded')}</div>
      <div class="metadata-actions"><button class="toolbar-button toolbar-button-primary" type="submit">Save Governance</button></div>
    </form>`;
  }

  private renderCheckboxGroup(title: string, kind: string, items: Array<{ id: string; label: string }>, selected: string[]): string {
    const selectedSet = new Set(selected);
    if (items.length === 0) return `<fieldset class="process-dashboard-check-group"><legend>${escapeHtml(title)}</legend><div class="process-dashboard-empty-inline">No records defined.</div></fieldset>`;
    return `<fieldset class="process-dashboard-check-group"><legend>${escapeHtml(title)}</legend><div class="process-dashboard-check-grid">${items.map((item) => `<label><input type="checkbox" data-governance-kind="${escapeHtml(kind)}" value="${escapeHtml(item.id)}"${selectedSet.has(item.id) ? ' checked' : ''} /><span>${escapeHtml(item.label)}</span></label>`).join('')}</div></fieldset>`;
  }

  private bindEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#process-dashboard-close')?.addEventListener('click', () => this.dialog.close());
    this.root.querySelector<HTMLButtonElement>('#process-dashboard-export')?.addEventListener('click', () => exportRegistryJson('process-governance.json', this.governance));
    this.root.querySelectorAll<HTMLButtonElement>('[data-summary-status]').forEach((button) => button.addEventListener('click', () => { this.filters.status = button.dataset.summaryStatus ?? ''; this.render(); }));
    this.bindFilter('#process-dashboard-filter-query', 'query');
    this.bindFilter('#process-dashboard-filter-layer', 'layerId');
    this.bindFilter('#process-dashboard-filter-status', 'status');
    this.bindFilter('#process-dashboard-filter-owner', 'ownerPositionId');
    this.bindFilter('#process-dashboard-filter-channel', 'channel');
    this.root.querySelectorAll<HTMLTableRowElement>('[data-process-dashboard-row]').forEach((row) => row.addEventListener('click', () => { this.selectedProcessId = row.dataset.processDashboardRow ?? ''; this.render(); }));
    this.root.querySelector<HTMLButtonElement>('#process-dashboard-open-model')?.addEventListener('click', () => {
      if (!this.selectedProcessId) return;
      const processId = this.selectedProcessId;
      this.dialog.close();
      document.dispatchEvent(new CustomEvent('enterprise-modeler:open-process', { detail: { processId } }));
    });
    this.root.querySelector<HTMLFormElement>('#process-dashboard-governance-form')?.addEventListener('submit', (event) => { event.preventDefault(); this.saveGovernance(); });
  }

  private bindFilter(selector: string, key: keyof DashboardFilters): void {
    const element = this.root.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
    element?.addEventListener('input', () => {
      const value = element.value;
      this.filters[key] = value;
      this.render();
      if (key === 'query') {
        const nextInput = this.root.querySelector<HTMLInputElement>(selector);
        nextInput?.focus();
        nextInput?.setSelectionRange(value.length, value.length);
      }
    });
  }

  private saveGovernance(): void {
    if (!this.selectedProcessId) return;
    const record = this.governanceFor(this.selectedProcessId);
    const statusValue = this.inputValue('#process-dashboard-status');
    const status = PROCESS_LIFECYCLE_STATUSES.some((candidate) => candidate.id === statusValue) ? statusValue as ProcessLifecycleStatus : 'draft';
    const ownerPositionId = this.inputValue('#process-dashboard-owner');
    const approverPositionId = this.inputValue('#process-dashboard-approver');
    const version = this.inputValue('#process-dashboard-version') || '0.1';
    const effectiveDate = this.inputValue('#process-dashboard-effective');
    const reviewDate = this.inputValue('#process-dashboard-review');

    if ((status === 'approved' || status === 'published') && (!ownerPositionId || !approverPositionId)) {
      window.alert('Approved and Published processes require both a process owner and approver.');
      return;
    }
    if (status === 'published' && (!effectiveDate || !reviewDate)) {
      window.alert('Published processes require an effective date and next review date.');
      return;
    }

    record.status = status;
    record.ownerPositionId = ownerPositionId;
    record.approverPositionId = approverPositionId;
    record.version = version;
    record.effectiveDate = effectiveDate;
    record.reviewDate = reviewDate;
    record.channels = this.checkedValues('channel').filter((value): value is ProcessChannel => PROCESS_CHANNELS.some((channel) => channel.id === value));
    record.systemIds = this.checkedValues('system');
    record.interfaceIds = this.checkedValues('interface');
    record.regulationIds = this.checkedValues('regulation');
    record.changeSummary = this.inputValue('#process-dashboard-change-summary');
    record.updatedAt = new Date().toISOString();
    saveProcessGovernanceLocally(this.governance);
    this.render();
  }

  private inputValue(selector: string): string { return this.root.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector)?.value.trim() ?? ''; }
  private checkedValues(kind: string): string[] { return Array.from(this.root.querySelectorAll<HTMLInputElement>(`input[data-governance-kind="${kind}"]:checked`)).map((input) => input.value); }

  private filteredProcesses(): ProcessDefinitionRecord[] {
    const query = this.filters.query.trim().toLowerCase();
    return this.repository.catalog.processes.filter((process) => process.active).filter((process) => {
      const governance = this.governanceFor(process.id);
      return (!query || process.name.toLowerCase().includes(query) || process.id.toLowerCase().includes(query)) && (!this.filters.layerId || process.layerId === this.filters.layerId) && (!this.filters.status || governance.status === this.filters.status) && (!this.filters.ownerPositionId || governance.ownerPositionId === this.filters.ownerPositionId) && (!this.filters.channel || governance.channels.includes(this.filters.channel as ProcessChannel));
    }).sort((left, right) => {
      const leftLayer = this.repository.layers.layers.find((layer) => layer.id === left.layerId)?.sequence ?? 9999;
      const rightLayer = this.repository.layers.layers.find((layer) => layer.id === right.layerId)?.sequence ?? 9999;
      return leftLayer - rightLayer || left.name.localeCompare(right.name);
    });
  }

  private countStatus(status: ProcessLifecycleStatus): number { return this.repository.catalog.processes.filter((process) => process.active && this.governanceFor(process.id).status === status).length; }

  private governanceFor(processId: string): ProcessGovernanceRecord {
    let record = this.governance.records.find((candidate) => candidate.processId === processId);
    if (!record) {
      record = { processId, status: 'draft', ownerPositionId: '', approverPositionId: '', version: '0.1', effectiveDate: '', reviewDate: '', channels: [], systemIds: [], interfaceIds: [], regulationIds: [], changeSummary: '', updatedAt: '' };
      this.governance.records.push(record);
    }
    return record;
  }

  private ownerOptions(selectedId: string, includeSelected: boolean): string {
    if (!this.organisation) return '';
    return this.organisation.positions.filter((position) => position.active || (includeSelected && position.id === selectedId)).sort((left, right) => left.name.localeCompare(right.name)).map((position) => `<option value="${escapeHtml(position.id)}"${position.id === selectedId ? ' selected' : ''}>${escapeHtml(position.name)}</option>`).join('');
  }

  private channelLabels(channels: ProcessChannel[]): string {
    if (channels.length === 0) return '—';
    return channels.map((id) => PROCESS_CHANNELS.find((channel) => channel.id === id)?.label ?? id).join(', ');
  }
}

function escapeHtml(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date); }

new ProcessDashboard();
