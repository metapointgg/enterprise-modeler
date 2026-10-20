const PROCESS_HIDDEN_TARGETS = new Set([
  'open-button',
  'save-button',
  'svg-button',
]);

interface NavigationAction {
  label: string;
  eventName: string;
}

interface NavigationSectionDefinition {
  id: string;
  label: string;
  icon: string;
  actions: NavigationAction[];
}

const EXTRA_SECTIONS: NavigationSectionDefinition[] = [
  {
    id: 'technology',
    label: 'Technology',
    icon: '▦',
    actions: [
      { label: 'Systems Catalogue', eventName: 'enterprise-modeler:open-systems-catalog' },
      { label: 'Solution Architecture', eventName: 'enterprise-modeler:open-solution-architecture-map' },
      { label: 'Integration Catalogue', eventName: 'enterprise-modeler:open-integration-catalog' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: '◫',
    actions: [
      { label: 'Data Catalogue & Flows', eventName: 'enterprise-modeler:open-data-catalogue' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: '§',
    actions: [
      { label: 'Regulatory Catalogue', eventName: 'enterprise-modeler:open-regulatory-catalog' },
      { label: 'Rules, Controls & Risks', eventName: 'enterprise-modeler:open-governance-catalogue' },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: '⌘',
    actions: [
      { label: 'Relationship Explorer', eventName: 'enterprise-modeler:open-enterprise-explorer' },
      { label: 'Impact Analysis', eventName: 'enterprise-modeler:open-impact-analysis' },
    ],
  },
];

const PROCESS_DYNAMIC_ENTRIES = [
  '[data-systems-catalog-entry]',
  '[data-solution-architecture-entry]',
  '[data-integration-catalog-entry]',
  '[data-regulatory-catalog-entry]',
];

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderSection(definition: NavigationSectionDefinition): HTMLElement {
  const section = document.createElement('section');
  section.className = 'enterprise-modeler-sidebar-section';
  section.dataset.sectionId = definition.id;
  section.innerHTML = `
    <button class="enterprise-modeler-sidebar-section-button" type="button" data-extra-sidebar-section="${escapeHtml(definition.id)}">
      <span class="enterprise-modeler-sidebar-icon" aria-hidden="true">${escapeHtml(definition.icon)}</span>
      <span class="enterprise-modeler-sidebar-label">${escapeHtml(definition.label)}</span>
      <span class="enterprise-modeler-sidebar-chevron" aria-hidden="true">›</span>
    </button>
    <div class="enterprise-modeler-sidebar-submenu">
      ${definition.actions.map((action) => `
        <button
          class="enterprise-modeler-sidebar-submenu-button"
          type="button"
          data-navigation-event="${escapeHtml(action.eventName)}"
        >${escapeHtml(action.label)}</button>
      `).join('')}
    </div>
  `;

  section.querySelector<HTMLButtonElement>('[data-extra-sidebar-section]')
    ?.addEventListener('click', () => {
      if (document.body.classList.contains('enterprise-modeler-sidebar-collapsed')) {
        document.body.classList.remove('enterprise-modeler-sidebar-collapsed');
      }

      document.querySelectorAll<HTMLElement>('.enterprise-modeler-sidebar-section')
        .forEach((candidate) => {
          candidate.classList.toggle(
            'enterprise-modeler-sidebar-section-open',
            candidate === section
              ? !candidate.classList.contains('enterprise-modeler-sidebar-section-open')
              : false,
          );
        });
    });

  section.querySelectorAll<HTMLButtonElement>('[data-navigation-event]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const eventName = button.dataset.navigationEvent;
        if (!eventName) return;
        document.dispatchEvent(new CustomEvent(eventName));
      });
    });

  return section;
}

function ensureExtraSections(): void {
  const nav = document.querySelector<HTMLElement>('.enterprise-modeler-sidebar-nav');
  if (!nav) return;

  const processSection = nav.querySelector<HTMLElement>(
    '.enterprise-modeler-sidebar-section[data-section-id="process"]',
  );

  let insertionPoint: Element | null = processSection;
  EXTRA_SECTIONS.forEach((definition) => {
    let section = nav.querySelector<HTMLElement>(
      `.enterprise-modeler-sidebar-section[data-section-id="${definition.id}"]`,
    );

    if (!section) {
      section = renderSection(definition);
      if (insertionPoint?.nextSibling) {
        nav.insertBefore(section, insertionPoint.nextSibling);
      } else {
        nav.appendChild(section);
      }
    }

    insertionPoint = section;
  });
}

function cleanProcessMenu(): void {
  const processSubmenu = document.querySelector<HTMLElement>(
    '.enterprise-modeler-sidebar-section[data-section-id="process"] .enterprise-modeler-sidebar-submenu',
  );
  if (!processSubmenu) return;

  processSubmenu
    .querySelectorAll<HTMLButtonElement>('[data-target-button]')
    .forEach((button) => {
      const target = button.dataset.targetButton ?? '';
      if (PROCESS_HIDDEN_TARGETS.has(target)) {
        button.remove();
      }
    });

  PROCESS_DYNAMIC_ENTRIES.forEach((selector) => {
    processSubmenu.querySelectorAll<HTMLElement>(selector).forEach((entry) => {
      entry.hidden = true;
      entry.setAttribute('aria-hidden', 'true');
      entry.setAttribute('tabindex', '-1');
    });
  });
}

let scheduled = false;

function applyNavigationStructure(): void {
  scheduled = false;
  ensureExtraSections();
  cleanProcessMenu();
}

function scheduleNavigationStructure(): void {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(applyNavigationStructure);
}

const observer = new MutationObserver(scheduleNavigationStructure);
observer.observe(document.body, { subtree: true, childList: true });
scheduleNavigationStructure();
