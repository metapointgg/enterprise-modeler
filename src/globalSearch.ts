import './globalSearch.css';

import {
  PROCESS_BPMN_AUTOSAVE_PREFIX,
  loadProcessRepository,
  type ProcessDefinitionRecord,
} from './processCatalog';
import {
  loadEntityIndex,
  type IndexedEntity,
} from './entityIndex';
import type { EnterpriseEntityType } from './enterpriseModel';

type SearchAction =
  | { kind: 'process'; processId: string }
  | {
      kind: 'explorer';
      entityType: EnterpriseEntityType;
      entityId: string;
      mode?: 'relationships' | 'impact';
    };

interface SearchItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  keywords: string;
  action: SearchAction;
}

class GlobalSearch {
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;
  private items: SearchItem[] = [];

  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'global-search-dialog';
    this.dialog.innerHTML = '<div id="global-search-root"></div>';
    document.body.appendChild(this.dialog);

    const root = this.dialog.querySelector<HTMLDivElement>('#global-search-root');
    if (!root) throw new Error('Unable to initialise global search.');
    this.root = root;

    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });

    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        void this.open();
      }
    });

    this.injectEntryPoint();
    new MutationObserver(() => this.injectEntryPoint()).observe(document.body, {
      subtree: true,
      childList: true,
    });
  }

  private injectEntryPoint(): void {
    const submenu = document.querySelector<HTMLElement>(
      '.enterprise-modeler-sidebar-section[data-section-id="home"] .enterprise-modeler-sidebar-submenu',
    );
    if (!submenu || submenu.querySelector('[data-global-search-entry]')) return;

    const button = document.createElement('button');
    button.className = 'enterprise-modeler-sidebar-submenu-button';
    button.type = 'button';
    button.dataset.globalSearchEntry = 'true';
    button.textContent = 'Global Search';
    button.title = 'Global Search (Ctrl+K)';
    button.addEventListener('click', () => void this.open());
    submenu.appendChild(button);
  }

  private async open(): Promise<void> {
    this.renderLoading();
    if (!this.dialog.open) this.dialog.showModal();

    this.items = await this.buildIndex();
    this.render('');

    window.setTimeout(
      () => this.root.querySelector<HTMLInputElement>('#global-search-input')?.focus(),
      0,
    );
  }

  private renderLoading(): void {
    this.root.innerHTML = `
      <div class="global-search-shell">
        <header class="global-search-header">
          <strong>Global Search</strong>
          <button class="global-search-close" type="button">×</button>
        </header>
        <div class="global-search-loading">Building enterprise model search index…</div>
      </div>
    `;

    this.root.querySelector<HTMLButtonElement>('.global-search-close')
      ?.addEventListener('click', () => this.dialog.close());
  }

  private render(query: string): void {
    const results = this.search(query);

    this.root.innerHTML = `
      <div class="global-search-shell">
        <header class="global-search-header">
          <div>
            <strong>Global Search</strong>
            <small>Processes, people, systems, data, rules, controls, risks and regulations</small>
          </div>
          <button class="global-search-close" type="button" aria-label="Close">×</button>
        </header>

        <div class="global-search-input-row">
          <input
            id="global-search-input"
            type="search"
            value="${escapeHtml(query)}"
            placeholder="Search the enterprise model…"
            autocomplete="off"
          />
          <span>Ctrl K</span>
        </div>

        <div class="global-search-results">
          ${results.length === 0
            ? '<div class="global-search-empty">No matching enterprise-model records.</div>'
            : results.map((item) => `
              <button type="button" class="global-search-result" data-search-id="${escapeHtml(item.id)}">
                <span class="global-search-category">${escapeHtml(item.category)}</span>
                <span class="global-search-result-copy">
                  <strong>${escapeHtml(item.title)}</strong>
                  <small>${escapeHtml(item.subtitle)}</small>
                </span>
                <span class="global-search-arrow">→</span>
              </button>
            `).join('')}
        </div>

        <footer class="global-search-footer">
          ${results.length} result${results.length === 1 ? '' : 's'} · Select an entity to open its relationships.
        </footer>
      </div>
    `;

    const input = this.root.querySelector<HTMLInputElement>('#global-search-input');
    input?.addEventListener('input', () => {
      const value = input.value;
      this.render(value);
      const nextInput = this.root.querySelector<HTMLInputElement>('#global-search-input');
      nextInput?.focus();
      nextInput?.setSelectionRange(value.length, value.length);
    });

    this.root.querySelector<HTMLButtonElement>('.global-search-close')
      ?.addEventListener('click', () => this.dialog.close());

    this.root.querySelectorAll<HTMLButtonElement>('[data-search-id]')
      .forEach((button) => button.addEventListener('click', () => {
        const item = this.items.find((candidate) => candidate.id === button.dataset.searchId);
        if (item) this.activate(item.action);
      }));
  }

  private search(query: string): SearchItem[] {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return this.items
      .map((item) => {
        if (terms.length === 0) {
          const defaultScore = item.action.kind === 'explorer'
            && item.action.entityType === 'process'
            ? 4
            : 1;
          return { item, score: defaultScore };
        }

        const title = item.title.toLowerCase();
        const text = `${item.title} ${item.subtitle} ${item.keywords} ${item.category}`.toLowerCase();
        if (!terms.every((term) => text.includes(term))) return { item, score: -1 };

        return {
          item,
          score:
            (terms.some((term) => title === term) ? 20 : 0)
            + (terms.some((term) => title.startsWith(term)) ? 10 : 0)
            + terms.filter((term) => title.includes(term)).length * 4
            + 1,
        };
      })
      .filter((entry) => entry.score >= 0)
      .sort((left, right) =>
        right.score - left.score
        || left.item.category.localeCompare(right.item.category)
        || left.item.title.localeCompare(right.item.title)
      )
      .slice(0, 100)
      .map((entry) => entry.item);
  }

  private async buildIndex(): Promise<SearchItem[]> {
    const [repository, entityIndex] = await Promise.all([
      loadProcessRepository(true),
      loadEntityIndex(),
    ]);

    const items: SearchItem[] = entityIndex.entities.map((entity) =>
      this.entitySearchItem(entity),
    );

    const activityItems = (await Promise.all(
      repository.catalog.processes
        .filter((process) => process.active)
        .map((process) => this.indexProcessActivities(process)),
    )).flat();

    items.push(...activityItems);
    return items;
  }

  private entitySearchItem(entity: IndexedEntity): SearchItem {
    return {
      id: `entity:${entity.key}`,
      category: formatEntityType(entity.type),
      title: entity.name,
      subtitle: entity.subtitle,
      keywords: `${entity.id} ${entity.type}`,
      action: {
        kind: 'explorer',
        entityType: entity.type,
        entityId: entity.id,
      },
    };
  }

  private async indexProcessActivities(
    process: ProcessDefinitionRecord,
  ): Promise<SearchItem[]> {
    try {
      const localXml = localStorage.getItem(
        `${PROCESS_BPMN_AUTOSAVE_PREFIX}${process.id}.xml`,
      );
      let xmlText = localXml ?? '';

      if (!xmlText) {
        const response = await fetch(process.url, { cache: 'no-store' });
        if (!response.ok) return [];
        xmlText = await response.text();
      }

      const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
      const allowed = new Set([
        'task',
        'userTask',
        'serviceTask',
        'manualTask',
        'scriptTask',
        'businessRuleTask',
        'callActivity',
        'subProcess',
        'startEvent',
        'endEvent',
        'exclusiveGateway',
        'parallelGateway',
        'inclusiveGateway',
        'eventBasedGateway',
        'lane',
        'participant',
        'dataObjectReference',
        'dataStoreReference',
      ]);

      return Array.from(xml.querySelectorAll<Element>('[id][name]'))
        .filter((element) => allowed.has(element.localName))
        .map((element) => ({
          id: `bpmn:${process.id}:${element.getAttribute('id') ?? crypto.randomUUID()}`,
          category:
            element.localName === 'lane'
              ? 'Swimlane'
              : element.localName === 'participant'
                ? 'Pool / Participant'
                : element.localName === 'dataObjectReference'
                    || element.localName === 'dataStoreReference'
                  ? 'BPMN Data'
                  : 'Process Step',
          title: element.getAttribute('name') ?? element.getAttribute('id') ?? 'BPMN element',
          subtitle: process.name,
          keywords: `${element.getAttribute('id') ?? ''} ${process.id} ${element.localName}`,
          action: { kind: 'process' as const, processId: process.id },
        }));
    } catch (error) {
      console.warn(`Unable to index BPMN activities for ${process.id}.`, error);
      return [];
    }
  }

  private activate(action: SearchAction): void {
    this.dialog.close();

    if (action.kind === 'process') {
      document.dispatchEvent(new CustomEvent('enterprise-modeler:open-process', {
        detail: { processId: action.processId },
      }));
      return;
    }

    document.dispatchEvent(new CustomEvent('enterprise-modeler:open-enterprise-explorer', {
      detail: {
        type: action.entityType,
        id: action.entityId,
        mode: action.mode ?? 'relationships',
      },
    }));
  }
}

function formatEntityType(type: EnterpriseEntityType): string {
  return type
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

new GlobalSearch();
