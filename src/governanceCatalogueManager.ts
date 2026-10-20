import './enterpriseCatalog.css';

import { loadGovernanceCatalogue } from './governanceCatalogueRegistry';
import type { EnterpriseEntityType, GovernanceCatalogueData } from './enterpriseModel';

type GovernanceTab = 'businessRules' | 'controls' | 'risks' | 'requirements' | 'policies';

interface GovernanceItem {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  active?: boolean;
}

const TABS: Array<{ id: GovernanceTab; label: string; type: EnterpriseEntityType }> = [
  { id: 'businessRules', label: 'Business Rules', type: 'business-rule' },
  { id: 'controls', label: 'Controls', type: 'control' },
  { id: 'risks', label: 'Risks', type: 'risk' },
  { id: 'requirements', label: 'Requirements', type: 'requirement' },
  { id: 'policies', label: 'Policies & Standards', type: 'policy' },
];

class GovernanceCatalogueManager {
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;
  private data: GovernanceCatalogueData | null = null;
  private tab: GovernanceTab = 'businessRules';
  private selectedId = '';
  private query = '';

  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'enterprise-catalog-dialog';
    this.dialog.innerHTML = '<div id="enterprise-governance-root"></div>';
    document.body.appendChild(this.dialog);
    const root = this.dialog.querySelector<HTMLDivElement>('#enterprise-governance-root');
    if (!root) throw new Error('Unable to initialise Governance Catalogue.');
    this.root = root;
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
    document.addEventListener('enterprise-modeler:open-governance-catalogue', () => void this.open());
  }

  private async open(): Promise<void> {
    this.data = await loadGovernanceCatalogue(true);
    this.ensureSelection();
    this.render();
    if (!this.dialog.open) this.dialog.showModal();
  }

  private records(): GovernanceItem[] {
    if (!this.data) return [];
    return this.data[this.tab] as GovernanceItem[];
  }

  private ensureSelection(): void {
    const records = this.records();
    if (this.selectedId && !records.some((item) => item.id === this.selectedId)) this.selectedId = '';
    if (!this.selectedId && records.length) this.selectedId = records[0].id;
  }

  private render(): void {
    const records = this.records().filter((item) =>
      !this.query || item.name.toLowerCase().includes(this.query.toLowerCase())
    );
    const selected = this.records().find((item) => item.id === this.selectedId);
    const currentTab = TABS.find((tab) => tab.id === this.tab) ?? TABS[0];

    this.root.innerHTML = `
      <div class="enterprise-catalog-shell">
        <header class="enterprise-catalog-header">
          <div>
            <div class="enterprise-catalog-title">Governance Catalogue</div>
            <div class="enterprise-catalog-subtitle">Business rules, controls, risks, requirements, policies and standards.</div>
          </div>
          <button class="metadata-close-button" id="governance-close" type="button">×</button>
        </header>
        <div class="enterprise-catalog-body">
          <aside class="enterprise-catalog-list-pane">
            <div class="enterprise-catalog-tabs">
              ${TABS.map((tab) => `<button class="enterprise-catalog-tab ${tab.id === this.tab ? 'enterprise-catalog-tab-active' : ''}" data-governance-tab="${tab.id}" type="button">${escapeHtml(tab.label)}</button>`).join('')}
            </div>
            <div class="enterprise-catalog-toolbar"><input id="governance-search" type="search" placeholder="Search…" value="${escapeHtml(this.query)}"/></div>
            <div class="enterprise-catalog-list">
              ${records.length ? records.map((item) => `<button class="enterprise-catalog-item ${item.id === this.selectedId ? 'enterprise-catalog-item-selected' : ''}" data-governance-record="${escapeHtml(item.id)}" type="button"><div class="enterprise-catalog-item-name">${escapeHtml(item.name)}</div><div class="enterprise-catalog-item-meta">${item.active === false ? 'Inactive' : escapeHtml(currentTab.label.slice(0, -1))}</div></button>`).join('') : '<div class="enterprise-empty">No records yet.</div>'}
            </div>
          </aside>
          <main class="enterprise-catalog-detail-pane">
            ${selected ? `
              <h2>${escapeHtml(selected.name)}</h2>
              <p>${escapeHtml(selected.description || 'No description recorded.')}</p>
              ${selected.notes ? `<div class="enterprise-catalog-section"><h3>Notes</h3><p>${escapeHtml(selected.notes)}</p></div>` : ''}
              <div class="enterprise-catalog-section">
                <button class="toolbar-button" id="governance-explore" type="button">Explore Relationships</button>
                <button class="toolbar-button toolbar-button-primary" id="governance-impact" type="button">Open Impact Analysis</button>
              </div>
            ` : '<div class="enterprise-empty">Select a governance record.</div>'}
          </main>
        </div>
      </div>
    `;
    this.bindEvents(currentTab.type);
  }

  private bindEvents(type: EnterpriseEntityType): void {
    this.root.querySelector<HTMLButtonElement>('#governance-close')?.addEventListener('click', () => this.dialog.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-governance-tab]').forEach((button) => button.addEventListener('click', () => {
      this.tab = (button.dataset.governanceTab || 'businessRules') as GovernanceTab;
      this.selectedId = '';
      this.ensureSelection();
      this.render();
    }));
    this.root.querySelector<HTMLInputElement>('#governance-search')?.addEventListener('input', (event) => {
      this.query = (event.target as HTMLInputElement).value;
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-governance-record]').forEach((button) => button.addEventListener('click', () => {
      this.selectedId = button.dataset.governanceRecord ?? '';
      this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('#governance-explore')?.addEventListener('click', () => {
      if (!this.selectedId) return;
      this.dialog.close();
      document.dispatchEvent(new CustomEvent('enterprise-modeler:open-enterprise-explorer', {
        detail: { type, id: this.selectedId, mode: 'relationships' },
      }));
    });
    this.root.querySelector<HTMLButtonElement>('#governance-impact')?.addEventListener('click', () => {
      if (!this.selectedId) return;
      this.dialog.close();
      document.dispatchEvent(new CustomEvent('enterprise-modeler:open-enterprise-explorer', {
        detail: { type, id: this.selectedId, mode: 'impact' },
      }));
    });
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

new GovernanceCatalogueManager();
