import './globalSearch.css';

import {
  PROCESS_BPMN_AUTOSAVE_PREFIX,
  loadProcessRepository,
  type ProcessDefinitionRecord,
} from './processCatalog';
import {
  getArchitectureLayerLabel,
  loadIntegrationData,
  loadRegulationData,
} from './operatingModelRegistry';
import { loadOrganisation } from './organisation';
import { loadOperatingUnits } from './operatingUnits';

type SearchAction =
  | { kind: 'process'; processId: string }
  | { kind: 'system'; recordId: string }
  | { kind: 'integration'; recordKind: 'interface'; recordId: string }
  | { kind: 'regulation'; recordId: string }
  | { kind: 'organisation' }
  | { kind: 'units' };

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
  private loaded = false;

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

    document.addEventListener('enterprise-modeler:process-repository-changed', () => {
      this.loaded = false;
    });
    document.addEventListener('enterprise-modeler:operating-model-registry-changed', () => {
      this.loaded = false;
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
    if (!this.loaded) {
      this.items = await this.buildIndex();
      this.loaded = true;
    }
    this.render('');
    window.setTimeout(() => this.root.querySelector<HTMLInputElement>('#global-search-input')?.focus(), 0);
  }

  private renderLoading(): void {
    this.root.innerHTML = `<div class="global-search-shell"><header class="global-search-header"><strong>Global Search</strong><button class="global-search-close" type="button">×</button></header><div class="global-search-loading">Building Enterprise Modeler operating-model search index…</div></div>`;
    this.root.querySelector<HTMLButtonElement>('.global-search-close')
      ?.addEventListener('click', () => this.dialog.close());
  }

  private render(query: string): void {
    const results = this.search(query);
    this.root.innerHTML = `<div class="global-search-shell"><header class="global-search-header"><div><strong>Global Search</strong><small>Processes, activities, organisation, operating units, systems, APIs, data and regulations</small></div><button class="global-search-close" type="button" aria-label="Close">×</button></header><div class="global-search-input-row"><input id="global-search-input" type="search" value="${escapeHtml(query)}" placeholder="Search Enterprise Modeler…" autocomplete="off" /><span>Ctrl K</span></div><div class="global-search-results">${results.length === 0 ? '<div class="global-search-empty">No matching operating-model records.</div>' : results.map((item) => `<button type="button" class="global-search-result" data-search-id="${escapeHtml(item.id)}"><span class="global-search-category">${escapeHtml(item.category)}</span><span class="global-search-result-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subtitle)}</small></span><span class="global-search-arrow">→</span></button>`).join('')}</div><footer class="global-search-footer">${results.length} result${results.length === 1 ? '' : 's'} · Enter a process, system, API, person, team, operating unit or regulatory term.</footer></div>`;

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
        if (terms.length === 0) return { item, score: item.category === 'Process' ? 4 : 1 };
        const title = item.title.toLowerCase();
        const text = `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase();
        if (!terms.every((term) => text.includes(term))) return { item, score: -1 };
        return {
          item,
          score: (terms.some((term) => title === term) ? 20 : 0)
            + (terms.some((term) => title.startsWith(term)) ? 10 : 0)
            + terms.filter((term) => title.includes(term)).length * 4
            + 1,
        };
      })
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => right.score - left.score
        || left.item.category.localeCompare(right.item.category)
        || left.item.title.localeCompare(right.item.title))
      .slice(0, 80)
      .map((entry) => entry.item);
  }

  private async buildIndex(): Promise<SearchItem[]> {
    const [repository, integrations, regulations, organisation, units] = await Promise.all([
      loadProcessRepository(true),
      loadIntegrationData(true),
      loadRegulationData(true),
      loadOrganisation(),
      loadOperatingUnits(),
    ]);
    const items: SearchItem[] = [];

    repository.catalog.processes
      .filter((process) => process.active)
      .forEach((process) => items.push({
        id: `process:${process.id}`,
        category: 'Process',
        title: process.name,
        subtitle: `${repository.layers.layers.find((layer) => layer.id === process.layerId)?.code ?? 'Unlayered'} · ${process.id}`,
        keywords: `${process.bpmnProcessId} ${process.filename}`,
        action: { kind: 'process', processId: process.id },
      }));

    items.push(...(await Promise.all(
      repository.catalog.processes
        .filter((process) => process.active)
        .map((process) => this.indexProcessActivities(process)),
    )).flat());

    organisation.people.filter((person) => person.active).forEach((person) => items.push({
      id: `person:${person.id}`,
      category: 'Person',
      title: person.name,
      subtitle: organisation.positions.find((position) => position.id === person.positionId)?.name ?? 'No position',
      keywords: person.email,
      action: { kind: 'organisation' },
    }));

    organisation.positions.filter((position) => position.active).forEach((position) => items.push({
      id: `position:${position.id}`,
      category: 'Position',
      title: position.name,
      subtitle: organisation.departments.find((department) => department.id === position.departmentId)?.name ?? '',
      keywords: position.id,
      action: { kind: 'organisation' },
    }));

    organisation.departments.forEach((department) => items.push({
      id: `department:${department.id}`,
      category: 'Department',
      title: department.name,
      subtitle: 'Organisation',
      keywords: department.id,
      action: { kind: 'organisation' },
    }));

    organisation.teams.forEach((team) => items.push({
      id: `team:${team.id}`,
      category: 'Team',
      title: team.name,
      subtitle: organisation.departments.find((department) => department.id === team.departmentId)?.name ?? '',
      keywords: team.id,
      action: { kind: 'organisation' },
    }));

    units.units.filter((unit) => unit.active).forEach((unit) => items.push({
      id: `unit:${unit.id}`,
      category: 'Operating Unit',
      title: unit.name,
      subtitle: unit.code,
      keywords: `${unit.id} ${unit.notes}`,
      action: { kind: 'units' },
    }));

    integrations.systems.filter((system) => system.active).forEach((system) => items.push({
      id: `system:${system.id}`,
      category: 'System',
      title: system.name,
      subtitle: `${getArchitectureLayerLabel(system.architectureLayer)} · ${system.type || 'Unclassified'} · ${system.criticality} criticality`,
      keywords: `${system.id} ${system.supplier} ${system.environment} ${system.dataClassification} ${system.integrationType} ${system.notes}`,
      action: { kind: 'system', recordId: system.id },
    }));

    integrations.interfaces.filter((item) => item.status !== 'retired').forEach((item) => items.push({
      id: `interface:${item.id}`,
      category: 'API / Interface',
      title: item.name,
      subtitle: `${this.systemName(integrations, item.sourceSystemId)} → ${this.systemName(integrations, item.targetSystemId)}`,
      keywords: `${item.protocol} ${item.authentication} ${item.documentationReference} ${item.notes}`,
      action: { kind: 'integration', recordKind: 'interface', recordId: item.id },
    }));

    regulations.regulations.filter((regulation) => regulation.active).forEach((regulation) => items.push({
      id: `regulation:${regulation.id}`,
      category: 'Regulatory',
      title: regulation.name,
      subtitle: `${regulation.category}${regulation.jurisdiction ? ` · ${regulation.jurisdiction}` : ''}`,
      keywords: `${regulation.sourceReference} ${regulation.notes}`,
      action: { kind: 'regulation', recordId: regulation.id },
    }));

    return items;
  }

  private async indexProcessActivities(process: ProcessDefinitionRecord): Promise<SearchItem[]> {
    try {
      const localXml = localStorage.getItem(`${PROCESS_BPMN_AUTOSAVE_PREFIX}${process.id}.xml`);
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
      ]);

      return Array.from(xml.querySelectorAll<Element>('[id][name]'))
        .filter((element) => allowed.has(element.localName))
        .map((element) => ({
          id: `bpmn:${process.id}:${element.getAttribute('id') ?? crypto.randomUUID()}`,
          category: element.localName === 'lane'
            ? 'Swimlane'
            : element.localName === 'participant'
              ? 'Pool / Participant'
              : 'Activity',
          title: element.getAttribute('name') ?? element.getAttribute('id') ?? 'BPMN element',
          subtitle: process.name,
          keywords: `${element.getAttribute('id') ?? ''} ${process.id}`,
          action: { kind: 'process' as const, processId: process.id },
        }));
    } catch (error) {
      console.warn(`Unable to index BPMN activities for ${process.id}.`, error);
      return [];
    }
  }

  private systemName(data: Awaited<ReturnType<typeof loadIntegrationData>>, systemId: string): string {
    return (data.systems.find((system) => system.id === systemId)?.name ?? systemId) || 'Unassigned';
  }

  private activate(action: SearchAction): void {
    this.dialog.close();
    if (action.kind === 'process') {
      document.dispatchEvent(new CustomEvent('enterprise-modeler:open-process', {
        detail: { processId: action.processId },
      }));
      return;
    }
    if (action.kind === 'system') {
      document.dispatchEvent(new CustomEvent('enterprise-modeler:open-systems-catalog', {
        detail: { recordId: action.recordId },
      }));
      return;
    }
    if (action.kind === 'integration') {
      document.dispatchEvent(new CustomEvent('enterprise-modeler:open-integration-catalog', {
        detail: action,
      }));
      return;
    }
    if (action.kind === 'regulation') {
      document.dispatchEvent(new CustomEvent('enterprise-modeler:open-regulatory-catalog', {
        detail: { recordId: action.recordId },
      }));
      return;
    }
    if (action.kind === 'units') {
      (document.getElementById('operating-units-button') as HTMLButtonElement | null)?.click();
      return;
    }
    (document.getElementById('organisation-button') as HTMLButtonElement | null)?.click();
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

new GlobalSearch();
