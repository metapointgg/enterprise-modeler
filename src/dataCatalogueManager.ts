import './enterpriseCatalog.css';

import {
  loadDataCatalogue,
  saveDataCatalogueLocally,
} from './dataCatalogue';
import type {
  DataCatalogueData,
  DataClassification,
  DataFlowRecord,
  DataObjectRecord,
} from './enterpriseModel';
import { loadIntegrationData, type IntegrationData } from './operatingModelRegistry';
import { loadOrganisation, type OrganisationData } from './organisation';
import { loadProcessRepository, type ProcessRepositorySnapshot } from './processCatalog';

type Tab = 'objects' | 'flows';

class DataCatalogueManager {
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;
  private data: DataCatalogueData = { schemaVersion: 1, dataObjects: [], dataFlows: [] };
  private integrations: IntegrationData = { schemaVersion: 2, systems: [], interfaces: [] };
  private organisation: OrganisationData | null = null;
  private processes: ProcessRepositorySnapshot = {
    layers: { schemaVersion: 1, layers: [] },
    catalog: { schemaVersion: 1, rootProcessId: '', processes: [] },
  };
  private tab: Tab = 'objects';
  private selectedId = '';
  private query = '';

  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'enterprise-catalog-dialog';
    this.dialog.innerHTML = '<div id="enterprise-data-catalog-root"></div>';
    document.body.appendChild(this.dialog);
    const root = this.dialog.querySelector<HTMLDivElement>('#enterprise-data-catalog-root');
    if (!root) throw new Error('Unable to initialise Data Catalogue.');
    this.root = root;

    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
    document.addEventListener('enterprise-modeler:open-data-catalogue', () => void this.open());
  }

  private async open(): Promise<void> {
    [this.data, this.integrations, this.organisation, this.processes] = await Promise.all([
      loadDataCatalogue(true),
      loadIntegrationData(true),
      loadOrganisation(true),
      loadProcessRepository(true),
    ]);
    this.ensureSelection();
    this.render();
    if (!this.dialog.open) this.dialog.showModal();
  }

  private ensureSelection(): void {
    const records = this.tab === 'objects' ? this.data.dataObjects : this.data.dataFlows;
    if (this.selectedId && !records.some((record) => record.id === this.selectedId)) this.selectedId = '';
    if (!this.selectedId && records.length > 0) this.selectedId = records[0].id;
  }

  private render(): void {
    const records = (this.tab === 'objects' ? this.data.dataObjects : this.data.dataFlows)
      .filter((record) => !this.query || record.name.toLowerCase().includes(this.query.toLowerCase()));

    this.root.innerHTML = `
      <div class="enterprise-catalog-shell">
        <header class="enterprise-catalog-header">
          <div>
            <div class="enterprise-catalog-title">Data Catalogue</div>
            <div class="enterprise-catalog-subtitle">Data objects, ownership, systems of record and data flows.</div>
          </div>
          <div class="enterprise-catalog-actions">
            <button class="toolbar-button" id="data-catalog-export" type="button">Export JSON</button>
            <button class="metadata-close-button" id="data-catalog-close" type="button">×</button>
          </div>
        </header>
        <div class="enterprise-catalog-body">
          <aside class="enterprise-catalog-list-pane">
            <div class="enterprise-catalog-tabs">
              <button class="enterprise-catalog-tab ${this.tab === 'objects' ? 'enterprise-catalog-tab-active' : ''}" data-data-tab="objects" type="button">Data Objects</button>
              <button class="enterprise-catalog-tab ${this.tab === 'flows' ? 'enterprise-catalog-tab-active' : ''}" data-data-tab="flows" type="button">Data Flows</button>
            </div>
            <div class="enterprise-catalog-toolbar">
              <input id="data-catalog-search" type="search" placeholder="Search…" value="${escapeHtml(this.query)}" />
              <button class="toolbar-button" id="data-catalog-new" type="button">New</button>
            </div>
            <div class="enterprise-catalog-list">
              ${records.length ? records.map((record) => `
                <button type="button" class="enterprise-catalog-item ${record.id === this.selectedId ? 'enterprise-catalog-item-selected' : ''}" data-data-record="${escapeHtml(record.id)}">
                  <div class="enterprise-catalog-item-name">${escapeHtml(record.name)}</div>
                  <div class="enterprise-catalog-item-meta">${this.tab === 'objects' ? escapeHtml((record as DataObjectRecord).domain || 'Data Object') : 'Data Flow'}</div>
                </button>
              `).join('') : '<div class="enterprise-empty">No records.</div>'}
            </div>
          </aside>
          <main class="enterprise-catalog-detail-pane">
            ${this.tab === 'objects' ? this.renderObjectForm() : this.renderFlowForm()}
          </main>
        </div>
      </div>
    `;
    this.bindEvents();
  }

  private renderObjectForm(): string {
    const record = this.data.dataObjects.find((item) => item.id === this.selectedId);
    const positions = this.organisation?.positions ?? [];
    return `
      <form class="enterprise-catalog-form" id="data-object-form">
        <h2>${record ? 'Edit Data Object' : 'New Data Object'}</h2>
        <div class="enterprise-catalog-form-grid">
          ${field('Name', 'data-name', record?.name ?? '', true)}
          ${field('Data domain', 'data-domain', record?.domain ?? '')}
          ${selectField('Classification', 'data-classification', ['public','internal','confidential','restricted','tbc'], record?.classification ?? 'tbc')}
          ${selectOptions('System of record', 'data-system', this.integrations.systems.map((item) => [item.id, item.name]), record?.systemOfRecordId ?? '')}
          ${selectOptions('Business owner', 'data-owner', positions.map((item) => [item.id, item.name]), record?.businessOwnerPositionId ?? '')}
          ${selectOptions('Data steward', 'data-steward', positions.map((item) => [item.id, item.name]), record?.dataStewardPositionId ?? '')}
          ${field('Retention period', 'data-retention', record?.retentionPeriod ?? '')}
          ${field('Data residency', 'data-residency', record?.dataResidency ?? '')}
          ${selectField('Criticality', 'data-criticality', ['low','medium','high'], record?.criticality ?? 'medium')}
        </div>
        ${textareaField('Description', 'data-description', record?.description ?? '')}
        <label class="enterprise-catalog-check"><input id="data-personal" type="checkbox" ${record?.personalData ? 'checked' : ''}/> Personal data</label>
        <label class="enterprise-catalog-check"><input id="data-special" type="checkbox" ${record?.specialCategoryData ? 'checked' : ''}/> Special-category / sensitive personal data</label>
        <label class="enterprise-catalog-check"><input id="data-active" type="checkbox" ${record?.active !== false ? 'checked' : ''}/> Active</label>
        ${textareaField('Notes', 'data-notes', record?.notes ?? '')}
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">Save</button>
          ${record ? '<button class="toolbar-button toolbar-button-danger" id="data-delete" type="button">Delete</button>' : ''}
        </div>
      </form>
    `;
  }

  private renderFlowForm(): string {
    const record = this.data.dataFlows.find((item) => item.id === this.selectedId);
    const positions = this.organisation?.positions ?? [];
    const systems = this.integrations.systems.map((item) => [item.id, item.name] as [string,string]);
    const interfaces = this.integrations.interfaces.map((item) => [item.id, item.name] as [string,string]);
    const processes = this.processes.catalog.processes.map((item) => [item.id, item.name] as [string,string]);
    return `
      <form class="enterprise-catalog-form" id="data-flow-form">
        <h2>${record ? 'Edit Data Flow' : 'New Data Flow'}</h2>
        <div class="enterprise-catalog-form-grid">
          ${field('Name', 'flow-name', record?.name ?? '', true)}
          ${selectOptions('Source system', 'flow-source', systems, record?.sourceSystemId ?? '')}
          ${selectOptions('Target system', 'flow-target', systems, record?.targetSystemId ?? '')}
          ${selectOptions('Process', 'flow-process', processes, record?.processId ?? '')}
          ${field('BPMN node ID', 'flow-node', record?.processNodeId ?? '')}
          ${selectOptions('Interface', 'flow-interface', interfaces, record?.interfaceId ?? '')}
          ${selectField('Direction', 'flow-direction', ['outbound','inbound','bidirectional'], record?.direction ?? 'outbound')}
          ${field('Frequency', 'flow-frequency', record?.frequency ?? '')}
          ${field('Protocol', 'flow-protocol', record?.protocol ?? '')}
          ${selectField('Classification', 'flow-classification', ['public','internal','confidential','restricted','tbc'], record?.classification ?? 'tbc')}
          ${field('Encryption', 'flow-encryption', record?.encryption ?? '')}
          ${selectOptions('Owner', 'flow-owner', positions.map((item) => [item.id, item.name]), record?.ownerPositionId ?? '')}
        </div>
        ${textareaField('Purpose', 'flow-purpose', record?.purpose ?? '')}
        <label class="enterprise-catalog-field"><span>Data objects</span>
          <select id="flow-data-objects" multiple size="6">
            ${this.data.dataObjects.map((item) => `<option value="${escapeHtml(item.id)}" ${record?.dataObjectIds.includes(item.id) ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}
          </select>
        </label>
        <label class="enterprise-catalog-check"><input id="flow-active" type="checkbox" ${record?.active !== false ? 'checked' : ''}/> Active</label>
        ${textareaField('Notes', 'flow-notes', record?.notes ?? '')}
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">Save</button>
          ${record ? '<button class="toolbar-button toolbar-button-danger" id="data-delete" type="button">Delete</button>' : ''}
        </div>
      </form>
    `;
  }

  private bindEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#data-catalog-close')?.addEventListener('click', () => this.dialog.close());
    this.root.querySelector<HTMLButtonElement>('#data-catalog-export')?.addEventListener('click', () => downloadJson('data-catalogue.json', this.data));
    this.root.querySelectorAll<HTMLButtonElement>('[data-data-tab]').forEach((button) => button.addEventListener('click', () => {
      this.tab = button.dataset.dataTab === 'flows' ? 'flows' : 'objects';
      this.selectedId = '';
      this.ensureSelection();
      this.render();
    }));
    this.root.querySelector<HTMLInputElement>('#data-catalog-search')?.addEventListener('input', (event) => {
      this.query = (event.target as HTMLInputElement).value;
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('#data-catalog-new')?.addEventListener('click', () => {
      this.selectedId = '';
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-data-record]').forEach((button) => button.addEventListener('click', () => {
      this.selectedId = button.dataset.dataRecord ?? '';
      this.render();
    }));
    this.root.querySelector<HTMLFormElement>('#data-object-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveObject();
    });
    this.root.querySelector<HTMLFormElement>('#data-flow-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveFlow();
    });
    this.root.querySelector<HTMLButtonElement>('#data-delete')?.addEventListener('click', () => this.deleteSelected());
  }

  private value(id: string): string {
    return this.root.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`#${id}`)?.value.trim() ?? '';
  }

  private saveObject(): void {
    const name = this.value('data-name');
    if (!name) return;
    const existing = this.data.dataObjects.find((item) => item.id === this.selectedId);
    const record: DataObjectRecord = {
      id: existing?.id ?? `data-${crypto.randomUUID()}`,
      name,
      description: this.value('data-description'),
      domain: this.value('data-domain'),
      businessOwnerPositionId: this.value('data-owner'),
      dataStewardPositionId: this.value('data-steward'),
      classification: this.value('data-classification') as DataClassification,
      personalData: this.root.querySelector<HTMLInputElement>('#data-personal')?.checked ?? false,
      specialCategoryData: this.root.querySelector<HTMLInputElement>('#data-special')?.checked ?? false,
      systemOfRecordId: this.value('data-system'),
      retentionPeriod: this.value('data-retention'),
      dataResidency: this.value('data-residency'),
      criticality: this.value('data-criticality') as DataObjectRecord['criticality'],
      active: this.root.querySelector<HTMLInputElement>('#data-active')?.checked ?? true,
      notes: this.value('data-notes'),
    };
    if (existing) Object.assign(existing, record);
    else this.data.dataObjects.push(record);
    this.selectedId = record.id;
    saveDataCatalogueLocally(this.data);
    this.render();
  }

  private saveFlow(): void {
    const name = this.value('flow-name');
    if (!name) return;
    const existing = this.data.dataFlows.find((item) => item.id === this.selectedId);
    const dataObjectIds = Array.from(
      this.root.querySelector<HTMLSelectElement>('#flow-data-objects')?.selectedOptions ?? [],
    ).map((option) => option.value);
    const record: DataFlowRecord = {
      id: existing?.id ?? `data-flow-${crypto.randomUUID()}`,
      name,
      sourceSystemId: this.value('flow-source'),
      targetSystemId: this.value('flow-target'),
      dataObjectIds,
      processId: this.value('flow-process'),
      processNodeId: this.value('flow-node'),
      interfaceId: this.value('flow-interface'),
      direction: this.value('flow-direction') as DataFlowRecord['direction'],
      frequency: this.value('flow-frequency'),
      protocol: this.value('flow-protocol'),
      classification: this.value('flow-classification') as DataClassification,
      encryption: this.value('flow-encryption'),
      purpose: this.value('flow-purpose'),
      ownerPositionId: this.value('flow-owner'),
      active: this.root.querySelector<HTMLInputElement>('#flow-active')?.checked ?? true,
      notes: this.value('flow-notes'),
    };
    if (existing) Object.assign(existing, record);
    else this.data.dataFlows.push(record);
    this.selectedId = record.id;
    saveDataCatalogueLocally(this.data);
    this.render();
  }

  private deleteSelected(): void {
    if (!this.selectedId || !window.confirm('Delete this catalogue record?')) return;
    if (this.tab === 'objects') {
      this.data.dataObjects = this.data.dataObjects.filter((item) => item.id !== this.selectedId);
      this.data.dataFlows.forEach((flow) => {
        flow.dataObjectIds = flow.dataObjectIds.filter((id) => id !== this.selectedId);
      });
    } else {
      this.data.dataFlows = this.data.dataFlows.filter((item) => item.id !== this.selectedId);
    }
    this.selectedId = '';
    saveDataCatalogueLocally(this.data);
    this.ensureSelection();
    this.render();
  }
}

function field(label: string, id: string, value: string, required = false): string {
  return `<label class="enterprise-catalog-field"><span>${escapeHtml(label)}</span><input id="${id}" value="${escapeHtml(value)}" ${required ? 'required' : ''}/></label>`;
}
function textareaField(label: string, id: string, value: string): string {
  return `<label class="enterprise-catalog-field"><span>${escapeHtml(label)}</span><textarea id="${id}" rows="3">${escapeHtml(value)}</textarea></label>`;
}
function selectField(label: string, id: string, values: string[], selected: string): string {
  return selectOptions(label, id, values.map((value) => [value, value]), selected);
}
function selectOptions(label: string, id: string, options: Array<[string,string]>, selected: string): string {
  return `<label class="enterprise-catalog-field"><span>${escapeHtml(label)}</span><select id="${id}"><option value="">—</option>${options.map(([value,name]) => `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')}</select></label>`;
}
function downloadJson(filename: string, value: unknown): void {
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
function escapeHtml(value: string): string {
  return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

new DataCatalogueManager();
