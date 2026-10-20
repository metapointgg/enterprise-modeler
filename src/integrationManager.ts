import './integrationManager.css';

import {
  exportRegistryJson,
  generateRegistryId,
  loadIntegrationData,
  loadProcessGovernance,
  saveIntegrationDataLocally,
  type IntegrationData,
  type InterfaceRecord,
} from './operatingModelRegistry';
import { getPositionName, loadOrganisation, type OrganisationData } from './organisation';

class IntegrationManager {
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;
  private data: IntegrationData = { schemaVersion: 2, systems: [], interfaces: [] };
  private organisation: OrganisationData | null = null;
  private selectedInterfaceId = '';

  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'integration-manager-dialog';
    this.dialog.innerHTML = '<div id="integration-manager-root"></div>';
    document.body.appendChild(this.dialog);

    const root = this.dialog.querySelector<HTMLDivElement>('#integration-manager-root');
    if (!root) throw new Error('Unable to initialise Integration Catalogue.');
    this.root = root;

    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });

    document.addEventListener('enterprise-modeler:open-integration-catalog', (event) => {
      const detail = (event as CustomEvent<{ recordKind?: string; recordId?: string }>).detail;
      if (detail?.recordKind === 'system') {
        document.dispatchEvent(new CustomEvent('enterprise-modeler:open-systems-catalog', {
          detail: { recordId: detail.recordId ?? '' },
        }));
        return;
      }
      this.selectedInterfaceId = detail?.recordKind === 'interface' ? detail.recordId ?? '' : '';
      void this.open();
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
    if (!submenu || submenu.querySelector('[data-integration-catalog-entry]')) return;

    const button = document.createElement('button');
    button.className = 'enterprise-modeler-sidebar-submenu-button';
    button.type = 'button';
    button.dataset.integrationCatalogEntry = 'true';
    button.textContent = 'Integration Catalogue';
    button.addEventListener('click', () => void this.open());
    submenu.appendChild(button);
  }

  private async open(): Promise<void> {
    [this.data, this.organisation] = await Promise.all([
      loadIntegrationData(true),
      loadOrganisation(),
    ]);

    if (
      this.selectedInterfaceId &&
      !this.data.interfaces.some((record) => record.id === this.selectedInterfaceId)
    ) {
      this.selectedInterfaceId = '';
    }

    this.render();
    if (!this.dialog.open) this.dialog.showModal();
  }

  private render(): void {
    const selected = this.data.interfaces.find(
      (record) => record.id === this.selectedInterfaceId,
    ) ?? null;

    const rows = [...this.data.interfaces]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => `
        <button
          class="integration-list-item${item.id === this.selectedInterfaceId ? ' integration-list-item-selected' : ''}"
          type="button"
          data-interface-id="${escapeHtml(item.id)}"
        >
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(this.systemName(item.sourceSystemId))} → ${escapeHtml(this.systemName(item.targetSystemId))} · ${escapeHtml(item.status)}</span>
        </button>
      `)
      .join('');

    this.root.innerHTML = `
      <div class="integration-manager">
        <header class="integration-manager-header">
          <div>
            <div class="integration-manager-title">Integration Catalogue</div>
            <div class="integration-manager-subtitle">APIs and interfaces connecting systems in the Enterprise Modeler solution architecture.</div>
          </div>
          <div class="integration-manager-actions">
            <button id="integration-export" class="toolbar-button" type="button">Export Catalogue</button>
            <button id="integration-close" class="metadata-close-button" type="button">×</button>
          </div>
        </header>

        <div class="integration-manager-body">
          <div class="integration-split">
            <section class="integration-list">
              <div class="integration-list-heading">
                <span>APIs / Interfaces</span>
                <button id="integration-new-interface" class="toolbar-button" type="button">New Interface</button>
              </div>
              ${rows || '<div class="integration-empty">No interfaces defined.</div>'}
            </section>
            <section class="integration-editor">${this.renderInterfaceForm(selected)}</section>
          </div>
        </div>

        <footer class="integration-manager-footer">
          Systems are managed in the Systems Catalogue. Interface changes are browser-local until exported and committed to the repository.
        </footer>
      </div>
    `;

    this.bindEvents();
  }

  private renderInterfaceForm(item: InterfaceRecord | null): string {
    return `
      <form id="integration-interface-form" class="integration-form">
        <h3>${item ? 'Edit API / interface' : 'Add API / interface'}</h3>
        ${item ? `<small>${escapeHtml(item.id)}</small>` : ''}

        <label class="metadata-field">
          <span>Name</span>
          <input id="integration-interface-name" required value="${escapeHtml(item?.name ?? '')}" />
        </label>

        <div class="integration-two-col">
          <label class="metadata-field">
            <span>Source</span>
            <select id="integration-interface-source" required>
              <option value="">Select system</option>
              ${this.systemOptions(item?.sourceSystemId ?? '')}
            </select>
          </label>
          <label class="metadata-field">
            <span>Target</span>
            <select id="integration-interface-target" required>
              <option value="">Select system</option>
              ${this.systemOptions(item?.targetSystemId ?? '')}
            </select>
          </label>
        </div>

        <div class="integration-two-col">
          <label class="metadata-field">
            <span>Direction</span>
            <select id="integration-interface-direction">${this.directionOptions(item?.direction ?? 'outbound')}</select>
          </label>
          <label class="metadata-field">
            <span>Status</span>
            <select id="integration-interface-status">${this.statusOptions(item?.status ?? 'design')}</select>
          </label>
        </div>

        <label class="metadata-field"><span>Protocol</span><input id="integration-interface-protocol" value="${escapeHtml(item?.protocol ?? '')}" placeholder="e.g. HTTPS / JSON or TBC" /></label>
        <label class="metadata-field"><span>Authentication</span><input id="integration-interface-auth" value="${escapeHtml(item?.authentication ?? '')}" placeholder="Configuration / mechanism or TBC" /></label>
        <label class="metadata-field"><span>Owner position</span><select id="integration-interface-owner"><option value="">Unassigned</option>${this.positionOptions(item?.ownerPositionId ?? '')}</select></label>
        <label class="metadata-field"><span>Criticality</span><select id="integration-interface-criticality">${this.criticalityOptions(item?.criticality ?? 'medium')}</select></label>
        <label class="metadata-field"><span>Documentation reference</span><input id="integration-interface-doc" value="${escapeHtml(item?.documentationReference ?? '')}" placeholder="Specification / documentation reference" /></label>
        <label class="metadata-field"><span>Notes</span><textarea id="integration-interface-notes" rows="4">${escapeHtml(item?.notes ?? '')}</textarea></label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${item ? 'Save Interface' : 'Add Interface'}</button>
          ${item ? '<button id="integration-delete-interface" class="toolbar-button toolbar-button-danger" type="button">Delete</button>' : ''}
        </div>
      </form>
    `;
  }

  private bindEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#integration-close')
      ?.addEventListener('click', () => this.dialog.close());
    this.root.querySelector<HTMLButtonElement>('#integration-export')
      ?.addEventListener('click', () => exportRegistryJson('integrations.json', this.data));
    this.root.querySelector<HTMLButtonElement>('#integration-new-interface')
      ?.addEventListener('click', () => {
        this.selectedInterfaceId = '';
        this.render();
      });
    this.root.querySelectorAll<HTMLButtonElement>('[data-interface-id]')
      .forEach((button) => button.addEventListener('click', () => {
        this.selectedInterfaceId = button.dataset.interfaceId ?? '';
        this.render();
      }));
    this.root.querySelector<HTMLFormElement>('#integration-interface-form')
      ?.addEventListener('submit', (event) => {
        event.preventDefault();
        this.saveInterface();
      });
    this.root.querySelector<HTMLButtonElement>('#integration-delete-interface')
      ?.addEventListener('click', () => void this.deleteInterface());
  }

  private saveInterface(): void {
    const name = this.value('#integration-interface-name');
    const sourceSystemId = this.value('#integration-interface-source');
    const targetSystemId = this.value('#integration-interface-target');
    if (!name || !sourceSystemId || !targetSystemId) {
      window.alert('Interface name, source and target are required.');
      return;
    }

    const existing = this.data.interfaces.find(
      (record) => record.id === this.selectedInterfaceId,
    );
    const directionValue = this.value('#integration-interface-direction');
    const statusValue = this.value('#integration-interface-status');
    const criticality = this.value('#integration-interface-criticality');

    const record: InterfaceRecord = {
      id: existing?.id ?? generateRegistryId('interface', name),
      name,
      sourceSystemId,
      targetSystemId,
      direction: directionValue === 'inbound' || directionValue === 'bidirectional'
        ? directionValue
        : 'outbound',
      protocol: this.value('#integration-interface-protocol'),
      authentication: this.value('#integration-interface-auth'),
      ownerPositionId: this.value('#integration-interface-owner'),
      criticality: criticality === 'low' || criticality === 'high' ? criticality : 'medium',
      status: statusValue === 'active' || statusValue === 'retired' || statusValue === 'tbc'
        ? statusValue
        : 'design',
      documentationReference: this.value('#integration-interface-doc'),
      notes: this.value('#integration-interface-notes'),
    };

    if (existing) Object.assign(existing, record);
    else this.data.interfaces.push(record);

    this.selectedInterfaceId = record.id;
    saveIntegrationDataLocally(this.data);
    this.render();
  }

  private async deleteInterface(): Promise<void> {
    if (!this.selectedInterfaceId) return;
    const governance = await loadProcessGovernance(true);
    if (governance.records.some((record) => record.interfaceIds.includes(this.selectedInterfaceId))) {
      window.alert('This interface is still referenced by a process and cannot be deleted. Remove the process references first.');
      return;
    }
    if (!window.confirm('Delete this interface from the catalogue?')) return;

    this.data.interfaces = this.data.interfaces.filter(
      (record) => record.id !== this.selectedInterfaceId,
    );
    this.selectedInterfaceId = '';
    saveIntegrationDataLocally(this.data);
    this.render();
  }

  private value(selector: string): string {
    return this.root.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector)?.value.trim() ?? '';
  }

  private positionOptions(selected: string): string {
    if (!this.organisation) return '';
    return this.organisation.positions
      .filter((position) => position.active || position.id === selected)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((position) => `<option value="${escapeHtml(position.id)}"${position.id === selected ? ' selected' : ''}>${escapeHtml(getPositionName(this.organisation as OrganisationData, position.id))}</option>`)
      .join('');
  }

  private systemOptions(selected: string): string {
    return this.data.systems
      .filter((system) => system.active || system.id === selected)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((system) => `<option value="${escapeHtml(system.id)}"${system.id === selected ? ' selected' : ''}>${escapeHtml(system.name)}</option>`)
      .join('');
  }

  private systemName(systemId: string): string {
    return this.data.systems.find((system) => system.id === systemId)?.name ?? systemId;
  }

  private criticalityOptions(selected: string): string {
    return ['low', 'medium', 'high']
      .map((value) => `<option value="${value}"${value === selected ? ' selected' : ''}>${capitalise(value)}</option>`)
      .join('');
  }

  private directionOptions(selected: string): string {
    return ['outbound', 'inbound', 'bidirectional']
      .map((value) => `<option value="${value}"${value === selected ? ' selected' : ''}>${capitalise(value)}</option>`)
      .join('');
  }

  private statusOptions(selected: string): string {
    return ['design', 'active', 'tbc', 'retired']
      .map((value) => `<option value="${value}"${value === selected ? ' selected' : ''}>${value === 'tbc' ? 'TBC' : capitalise(value)}</option>`)
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

new IntegrationManager();
