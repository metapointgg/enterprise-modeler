import './enterpriseCatalog.css';

import type {
  EnterpriseEntityType,
  EnterpriseRelationship,
  RelationshipType,
} from './enterpriseModel';
import {
  entityKey,
  loadEntityIndex,
  type EntityIndexSnapshot,
  type IndexedEntity,
} from './entityIndex';
import { saveEnterpriseRelationshipsLocally } from './relationshipRegistry';

interface OpenExplorerDetail {
  type?: EnterpriseEntityType;
  id?: string;
  name?: string;
  subtitle?: string;
  mode?: 'relationships' | 'impact';
}

const RELATIONSHIP_TYPES: RelationshipType[] = [
  'owns','supports','performs','manages','reports-to','uses','depends-on',
  'reads','creates','updates','deletes','stores','transmits','contains',
  'integrates-with','governed-by','subject-to','implements','implemented-by',
  'controls','mitigates','impacts','located-at','related-to',
];

class EnterpriseExplorer {
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;
  private snapshot: EntityIndexSnapshot | null = null;
  private selectedKey = '';
  private query = '';
  private typeFilter = '';
  private mode: 'relationships' | 'impact' = 'relationships';

  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'enterprise-explorer-dialog';
    this.dialog.innerHTML = '<div id="enterprise-explorer-root"></div>';
    document.body.appendChild(this.dialog);
    const root = this.dialog.querySelector<HTMLDivElement>('#enterprise-explorer-root');
    if (!root) throw new Error('Unable to initialise Enterprise Explorer.');
    this.root = root;
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
    document.addEventListener('enterprise-modeler:open-enterprise-explorer', (event) => {
      void this.open((event as CustomEvent<OpenExplorerDetail>).detail ?? {});
    });
    document.addEventListener('enterprise-modeler:open-impact-analysis', () => {
      void this.open({ mode: 'impact' });
    });
  }

  private async open(detail: OpenExplorerDetail): Promise<void> {
    this.snapshot = await loadEntityIndex();
    this.mode = detail.mode === 'impact' ? 'impact' : 'relationships';

    if (detail.type && detail.id) {
      const key = entityKey(detail.type, detail.id);
      if (!this.snapshot.entities.some((entity) => entity.key === key)) {
        this.snapshot.entities.push({
          key,
          type: detail.type,
          id: detail.id,
          name: detail.name || detail.id,
          subtitle: detail.subtitle || formatEntityType(detail.type),
        });
      }
      this.selectedKey = key;
    } else if (!this.selectedKey && this.snapshot.entities.length) {
      this.selectedKey = this.snapshot.entities[0].key;
    }

    this.render();
    if (!this.dialog.open) this.dialog.showModal();
  }

  private render(): void {
    if (!this.snapshot) return;
    const entities = this.snapshot.entities.filter((entity) =>
      (!this.typeFilter || entity.type === this.typeFilter)
      && (!this.query || `${entity.name} ${entity.subtitle} ${entity.id}`.toLowerCase().includes(this.query.toLowerCase()))
    );
    const selected = this.snapshot.entities.find((entity) => entity.key === this.selectedKey) ?? null;
    const types = [...new Set(this.snapshot.entities.map((entity) => entity.type))].sort();

    this.root.innerHTML = `
      <div class="enterprise-catalog-shell">
        <header class="enterprise-catalog-header">
          <div>
            <div class="enterprise-catalog-title">Enterprise Relationship Explorer</div>
            <div class="enterprise-catalog-subtitle">Navigate processes, people, systems, data and governance as one connected model.</div>
          </div>
          <div class="enterprise-catalog-actions">
            <button class="toolbar-button ${this.mode === 'relationships' ? 'toolbar-button-primary' : ''}" data-explorer-mode="relationships" type="button">Relationships</button>
            <button class="toolbar-button ${this.mode === 'impact' ? 'toolbar-button-primary' : ''}" data-explorer-mode="impact" type="button">Impact Analysis</button>
            <button class="metadata-close-button" id="explorer-close" type="button">×</button>
          </div>
        </header>
        <div class="enterprise-catalog-body">
          <aside class="enterprise-catalog-list-pane">
            <div class="enterprise-catalog-toolbar">
              <input id="explorer-search" type="search" placeholder="Search entities…" value="${escapeHtml(this.query)}"/>
              <select id="explorer-type"><option value="">All types</option>${types.map((type) => `<option value="${type}" ${this.typeFilter === type ? 'selected' : ''}>${escapeHtml(formatEntityType(type))}</option>`).join('')}</select>
            </div>
            <div class="enterprise-catalog-list">
              ${entities.slice(0, 400).map((entity) => `<button class="enterprise-catalog-item ${entity.key === this.selectedKey ? 'enterprise-catalog-item-selected' : ''}" data-entity-key="${escapeHtml(entity.key)}" type="button"><div class="enterprise-catalog-item-name">${escapeHtml(entity.name)}</div><div class="enterprise-catalog-item-meta">${escapeHtml(formatEntityType(entity.type))} · ${escapeHtml(entity.subtitle)}</div></button>`).join('') || '<div class="enterprise-empty">No matching entities.</div>'}
            </div>
          </aside>
          <main class="enterprise-catalog-detail-pane">
            ${selected ? this.renderSelected(selected) : '<div class="enterprise-empty">Select an entity.</div>'}
          </main>
        </div>
      </div>
    `;
    this.bindEvents();
  }

  private renderSelected(selected: IndexedEntity): string {
    if (!this.snapshot) return '';
    const relationships = this.snapshot.relationships.relationships.filter((relationship) =>
      relationship.active && (
        entityKey(relationship.source.type, relationship.source.id) === selected.key
        || entityKey(relationship.target.type, relationship.target.id) === selected.key
      )
    );

    return `
      <div>
        <div class="enterprise-catalog-item-meta">${escapeHtml(formatEntityType(selected.type))}</div>
        <h2>${escapeHtml(selected.name)}</h2>
        <div class="enterprise-muted">${escapeHtml(selected.id)}</div>
        ${selected.type === 'process' ? '<button class="toolbar-button" id="explorer-open-process" type="button">Open BPMN Process</button>' : ''}
        ${this.mode === 'impact' ? this.renderImpact(selected) : this.renderRelationships(selected, relationships)}
      </div>
    `;
  }

  private renderRelationships(selected: IndexedEntity, relationships: EnterpriseRelationship[]): string {
    if (!this.snapshot) return '';
    return `
      <div class="enterprise-catalog-section">
        <h3>Connected entities</h3>
        ${relationships.length ? relationships.map((relationship) => {
          const sourceIsSelected = entityKey(relationship.source.type, relationship.source.id) === selected.key;
          const otherRef = sourceIsSelected ? relationship.target : relationship.source;
          const other = this.resolveEntity(otherRef.type, otherRef.id);
          return `<div class="enterprise-relationship-row">
            <button class="enterprise-catalog-item" data-entity-key="${escapeHtml(entityKey(otherRef.type, otherRef.id))}" type="button">
              <div class="enterprise-relationship-type">${sourceIsSelected ? '→' : '←'} ${escapeHtml(formatRelationship(relationship.type))}</div>
              <div class="enterprise-catalog-item-name">${escapeHtml(other?.name || otherRef.id)}</div>
              <div class="enterprise-relationship-meta">${escapeHtml(other ? formatEntityType(other.type) : formatEntityType(otherRef.type))}${relationship.description ? ` · ${escapeHtml(relationship.description)}` : ''}</div>
            </button>
            <button class="toolbar-button" data-remove-relationship="${escapeHtml(relationship.id)}" type="button">Remove</button>
          </div>`;
        }).join('') : '<div class="enterprise-empty">No relationships recorded yet.</div>'}
      </div>
      <div class="enterprise-catalog-section">
        <h3>Add relationship</h3>
        <form class="enterprise-catalog-form" id="relationship-add-form">
          <div class="enterprise-catalog-form-grid">
            <label class="enterprise-catalog-field"><span>Relationship</span><select id="relationship-type">${RELATIONSHIP_TYPES.map((type) => `<option value="${type}">${escapeHtml(formatRelationship(type))}</option>`).join('')}</select></label>
            <label class="enterprise-catalog-field"><span>Target entity</span><select id="relationship-target"><option value="">Select…</option>${this.snapshot.entities.filter((entity) => entity.key !== selected.key).map((entity) => `<option value="${escapeHtml(entity.key)}">${escapeHtml(formatEntityType(entity.type))} — ${escapeHtml(entity.name)}</option>`).join('')}</select></label>
          </div>
          <label class="enterprise-catalog-field"><span>Description</span><input id="relationship-description"/></label>
          <button class="toolbar-button toolbar-button-primary" type="submit">Add Relationship</button>
        </form>
      </div>
    `;
  }

  private renderImpact(selected: IndexedEntity): string {
    const impacts = this.getImpact(selected);
    const groups = new Map<EnterpriseEntityType, Array<{ entity: IndexedEntity; depth: number }>>();
    impacts.forEach((item) => {
      const list = groups.get(item.entity.type) ?? [];
      list.push(item);
      groups.set(item.entity.type, list);
    });
    return `
      <div class="enterprise-catalog-section">
        <h3>Impact radius</h3>
        <p class="enterprise-muted">Connected entities up to three relationship hops from the selected item. This is deliberately relationship-driven rather than hard-coded by entity type.</p>
        <div class="enterprise-impact-grid">
          ${[...groups.entries()].map(([type,items]) => `<div class="enterprise-impact-card"><strong>${escapeHtml(formatEntityType(type))}</strong><div class="enterprise-catalog-list">${items.sort((a,b) => a.depth-b.depth || a.entity.name.localeCompare(b.entity.name)).map((item) => `<button class="enterprise-catalog-item" data-entity-key="${escapeHtml(item.entity.key)}" type="button"><div class="enterprise-catalog-item-name">${escapeHtml(item.entity.name)}</div><div class="enterprise-catalog-item-meta">Distance ${item.depth}</div></button>`).join('')}</div></div>`).join('') || '<div class="enterprise-empty">No downstream impact is mapped yet.</div>'}
        </div>
      </div>
    `;
  }

  private getImpact(selected: IndexedEntity): Array<{ entity: IndexedEntity; depth: number }> {
    if (!this.snapshot) return [];
    const byKey = new Map(this.snapshot.entities.map((entity) => [entity.key, entity]));
    const visited = new Map<string, number>([[selected.key, 0]]);
    let frontier = [selected.key];

    for (let depth = 1; depth <= 3 && frontier.length; depth += 1) {
      const next: string[] = [];
      for (const key of frontier) {
        for (const relationship of this.snapshot.relationships.relationships.filter((item) => item.active)) {
          const sourceKey = entityKey(relationship.source.type, relationship.source.id);
          const targetKey = entityKey(relationship.target.type, relationship.target.id);
          const neighbour = sourceKey === key ? targetKey : targetKey === key ? sourceKey : '';
          if (neighbour && !visited.has(neighbour)) {
            visited.set(neighbour, depth);
            next.push(neighbour);
          }
        }
      }
      frontier = next;
    }

    return [...visited.entries()]
      .filter(([key]) => key !== selected.key)
      .map(([key, depth]) => ({ entity: byKey.get(key), depth }))
      .filter((item): item is { entity: IndexedEntity; depth: number } => Boolean(item.entity));
  }

  private resolveEntity(type: EnterpriseEntityType, id: string): IndexedEntity | undefined {
    return this.snapshot?.entities.find((entity) => entity.key === entityKey(type, id));
  }

  private bindEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#explorer-close')?.addEventListener('click', () => this.dialog.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-explorer-mode]').forEach((button) => button.addEventListener('click', () => {
      this.mode = button.dataset.explorerMode === 'impact' ? 'impact' : 'relationships';
      this.render();
    }));
    this.root.querySelector<HTMLInputElement>('#explorer-search')?.addEventListener('input', (event) => {
      this.query = (event.target as HTMLInputElement).value;
      this.render();
    });
    this.root.querySelector<HTMLSelectElement>('#explorer-type')?.addEventListener('change', (event) => {
      this.typeFilter = (event.target as HTMLSelectElement).value;
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-entity-key]').forEach((button) => button.addEventListener('click', () => {
      this.selectedKey = button.dataset.entityKey ?? '';
      this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('#explorer-open-process')?.addEventListener('click', () => {
      const selected = this.snapshot?.entities.find((entity) => entity.key === this.selectedKey);
      if (selected?.type === 'process') {
        this.dialog.close();
        document.dispatchEvent(new CustomEvent('enterprise-modeler:open-process', { detail: { processId: selected.id } }));
      }
    });
    this.root.querySelector<HTMLFormElement>('#relationship-add-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.addRelationship();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-remove-relationship]').forEach((button) => button.addEventListener('click', () => {
      this.removeRelationship(button.dataset.removeRelationship ?? '');
    }));
  }

  private addRelationship(): void {
    if (!this.snapshot) return;
    const selected = this.snapshot.entities.find((entity) => entity.key === this.selectedKey);
    const targetKey = this.root.querySelector<HTMLSelectElement>('#relationship-target')?.value ?? '';
    const target = this.snapshot.entities.find((entity) => entity.key === targetKey);
    const type = this.root.querySelector<HTMLSelectElement>('#relationship-type')?.value as RelationshipType | undefined;
    if (!selected || !target || !type) return;
    const relationship: EnterpriseRelationship = {
      id: `relationship-${crypto.randomUUID()}`,
      type,
      source: { type: selected.type, id: selected.id },
      target: { type: target.type, id: target.id },
      description: this.root.querySelector<HTMLInputElement>('#relationship-description')?.value.trim() ?? '',
      ownerPositionId: '',
      active: true,
      notes: '',
    };
    this.snapshot.relationships.relationships.push(relationship);
    saveEnterpriseRelationshipsLocally(this.snapshot.relationships);
    this.render();
  }

  private removeRelationship(id: string): void {
    if (!this.snapshot || !id || !window.confirm('Remove this relationship?')) return;
    this.snapshot.relationships.relationships = this.snapshot.relationships.relationships.filter((item) => item.id !== id);
    saveEnterpriseRelationshipsLocally(this.snapshot.relationships);
    this.render();
  }
}

function formatRelationship(type: RelationshipType): string {
  return type.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
function formatEntityType(type: EnterpriseEntityType): string {
  return type.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
function escapeHtml(value: string): string {
  return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

new EnterpriseExplorer();
