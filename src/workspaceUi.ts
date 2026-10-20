import './workspaceUi.css';

import {
  PROCESS_CATALOG,
  PROCESS_METADATA_AUTOSAVE_PREFIX,
  type ProcessDefinition,
} from './processCatalog';
import {
  getRoleName,
  getTeamName,
  loadOrganisation,
  type OrganisationData,
} from './organisation';

interface HoverProcessLink {
  type?: string;
  targetProcessId?: string;
  label?: string;
}

interface HoverNodeMetadata {
  status?: string;
  ownerPersonId?: string;
  responsibleType?: string;
  responsibleId?: string;
  links?: HoverProcessLink[];
}

interface HoverProcessMetadata {
  nodes?: Record<string, HoverNodeMetadata>;
}

interface SidebarAction {
  label: string;
  targetButtonId: string;
}

interface SidebarSection {
  id: string;
  label: string;
  icon: string;
  actions: SidebarAction[];
}

const sidebarSections: SidebarSection[] = [
  {
    id: 'home',
    label: 'Home',
    icon: '⌂',
    actions: [
      { label: 'Home Model', targetButtonId: 'home-button' },
      { label: 'Back', targetButtonId: 'back-button' },
    ],
  },
  {
    id: 'process',
    label: 'Process',
    icon: '◇',
    actions: [
      { label: 'Process Library', targetButtonId: 'process-manager-button' },
      { label: 'New Process', targetButtonId: 'new-button' },
      { label: 'Open BPMN', targetButtonId: 'open-button' },
      { label: 'Reset Current', targetButtonId: 'reset-button' },
      { label: 'Save BPMN', targetButtonId: 'save-button' },
      { label: 'Export SVG', targetButtonId: 'svg-button' },
    ],
  },
  {
    id: 'organisation',
    label: 'Organisation',
    icon: '◎',
    actions: [
      { label: 'People & Positions', targetButtonId: 'organisation-button' },
      { label: 'Org Chart', targetButtonId: 'org-chart-button' },
    ],
  },
];

const shell = document.querySelector<HTMLElement>('.modeler-shell');
const workspace = document.querySelector<HTMLElement>('.modeler-workspace');
const canvas = document.querySelector<HTMLElement>('#canvas');
const statusElement = document.querySelector<HTMLElement>('#status');

if (!shell || !workspace || !canvas || !statusElement) {
  console.warn('Enterprise Modeler workspace UI could not initialise because required application elements were not found.');
} else {
  initialiseWorkspaceUi(shell, workspace, canvas, statusElement);
}

function initialiseWorkspaceUi(
  shellElement: HTMLElement,
  workspaceElement: HTMLElement,
  canvasElement: HTMLElement,
  status: HTMLElement,
): void {
  createSidebar(shellElement);
  moveStatusToHeader(status);
  initialiseHeaderContext(status);
  createZoomControls(workspaceElement);
  initialisePaletteEnhancer(canvasElement);
  initialiseProcessLoader(workspaceElement, status);
  initialiseMetadataHover(canvasElement);
}

function createSidebar(shellElement: HTMLElement): void {
  const sidebar = document.createElement('aside');
  sidebar.className = 'enterprise-modeler-sidebar';
  sidebar.setAttribute('aria-label', 'Application navigation');

  sidebar.innerHTML = `
    <div class="enterprise-modeler-sidebar-header">
      <button class="enterprise-modeler-sidebar-toggle" type="button" title="Collapse navigation" aria-label="Collapse navigation">
        <span class="enterprise-modeler-sidebar-toggle-icon">☰</span>
      </button>
      <div class="enterprise-modeler-sidebar-brand">Enterprise Modeler</div>
    </div>
    <nav class="enterprise-modeler-sidebar-nav">
      ${sidebarSections.map(renderSidebarSection).join('')}
    </nav>
  `;

  document.body.appendChild(sidebar);
  shellElement.classList.add('enterprise-modeler-shell-with-sidebar');

  const toggle = sidebar.querySelector<HTMLButtonElement>('.enterprise-modeler-sidebar-toggle');
  toggle?.addEventListener('click', () => {
    const collapsed = document.body.classList.toggle('enterprise-modeler-sidebar-collapsed');
    toggle.title = collapsed ? 'Expand navigation' : 'Collapse navigation';
    toggle.setAttribute('aria-label', toggle.title);
  });

  sidebar.querySelectorAll<HTMLButtonElement>('[data-sidebar-section]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        if (document.body.classList.contains('enterprise-modeler-sidebar-collapsed')) {
          document.body.classList.remove('enterprise-modeler-sidebar-collapsed');
        }

        const sectionId = button.dataset.sidebarSection;
        sidebar.querySelectorAll<HTMLElement>('.enterprise-modeler-sidebar-section')
          .forEach((section) => {
            section.classList.toggle(
              'enterprise-modeler-sidebar-section-open',
              section.dataset.sectionId === sectionId
                ? !section.classList.contains('enterprise-modeler-sidebar-section-open')
                : false,
            );
          });
      });
    });

  sidebar.querySelectorAll<HTMLButtonElement>('[data-target-button]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const targetButtonId = button.dataset.targetButton;
        if (!targetButtonId) {
          return;
        }

        const target = document.getElementById(targetButtonId) as HTMLButtonElement | null;
        if (!target) {
          window.alert(`${button.textContent?.trim() || 'This action'} is not available yet.`);
          return;
        }

        target.click();
      });
    });
}

function renderSidebarSection(section: SidebarSection): string {
  return `
    <section class="enterprise-modeler-sidebar-section" data-section-id="${escapeHtml(section.id)}">
      <button class="enterprise-modeler-sidebar-section-button" type="button" data-sidebar-section="${escapeHtml(section.id)}">
        <span class="enterprise-modeler-sidebar-icon" aria-hidden="true">${escapeHtml(section.icon)}</span>
        <span class="enterprise-modeler-sidebar-label">${escapeHtml(section.label)}</span>
        <span class="enterprise-modeler-sidebar-chevron" aria-hidden="true">›</span>
      </button>
      <div class="enterprise-modeler-sidebar-submenu">
        ${section.actions.map((action) => `
          <button class="enterprise-modeler-sidebar-submenu-button" type="button" data-target-button="${escapeHtml(action.targetButtonId)}">
            ${escapeHtml(action.label)}
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function moveStatusToHeader(status: HTMLElement): void {
  const documentInformation = document.querySelector<HTMLElement>('.document-information');
  if (!documentInformation) {
    return;
  }

  status.classList.add('enterprise-modeler-header-status');
  documentInformation.appendChild(status);
}

function initialiseHeaderContext(status: HTMLElement): void {
  const processLevel = document.querySelector<HTMLElement>('#process-level');
  const documentName = document.querySelector<HTMLElement>('#document-name');

  if (!processLevel || !documentName) {
    return;
  }

  const setProcessContextVisible = (visible: boolean): void => {
    processLevel.hidden = !visible;
    documentName.hidden = !visible;
    status.hidden = !visible;
  };

  document.addEventListener('enterprise-modeler:workspace-page-changed', (event) => {
    const page = (event as CustomEvent<{ page?: string }>).detail?.page ?? 'process';
    setProcessContextVisible(page === 'process');
  });

  setProcessContextVisible(true);
}

function createZoomControls(workspaceElement: HTMLElement): void {
  const controls = document.createElement('div');
  controls.className = 'enterprise-modeler-zoom-controls';
  controls.setAttribute('aria-label', 'Diagram zoom controls');

  controls.innerHTML = `
    <button type="button" class="enterprise-modeler-zoom-button" data-zoom-target="fit-button" title="Fit diagram" aria-label="Fit diagram">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
    <button type="button" class="enterprise-modeler-zoom-button enterprise-modeler-zoom-symbol" data-zoom-target="zoom-in-button" title="Zoom in" aria-label="Zoom in">+</button>
    <button type="button" class="enterprise-modeler-zoom-button enterprise-modeler-zoom-symbol" data-zoom-target="zoom-out-button" title="Zoom out" aria-label="Zoom out">−</button>
  `;

  controls.querySelectorAll<HTMLButtonElement>('[data-zoom-target]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.zoomTarget;
        if (!targetId) {
          return;
        }
        (document.getElementById(targetId) as HTMLButtonElement | null)?.click();
      });
    });

  workspaceElement.appendChild(controls);
}

function initialisePaletteEnhancer(canvasElement: HTMLElement): void {
  let scheduled = false;

  function enhancePalette(): void {
    scheduled = false;
    const palette = canvasElement.querySelector<HTMLElement>('.djs-palette');
    if (!palette) {
      return;
    }

    palette.classList.add('enterprise-modeler-palette');

    const secondaryActions = new Set([
      'create.data-object',
      'create.data-store',
      'create.participant-expanded',
      'create.group',
    ]);

    palette.querySelectorAll<HTMLElement>('.entry[data-action]')
      .forEach((entry) => {
        const action = entry.dataset.action ?? '';
        entry.classList.toggle('enterprise-modeler-palette-secondary', secondaryActions.has(action));
      });

    if (!palette.querySelector('[data-action="enterprise-modeler-more-elements"]')) {
      const more = document.createElement('div');
      more.className = 'entry enterprise-modeler-palette-more';
      more.dataset.action = 'enterprise-modeler-more-elements';
      more.title = 'Show more element types';
      more.setAttribute('role', 'button');
      more.setAttribute('tabindex', '0');
      more.setAttribute('aria-label', 'Show more element types');
      more.textContent = '•••';

      const toggle = (): void => {
        const expanded = palette.classList.toggle('enterprise-modeler-palette-expanded');
        more.title = expanded ? 'Hide additional element types' : 'Show more element types';
        more.setAttribute('aria-label', more.title);
      };

      more.addEventListener('click', toggle);
      more.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });

      palette.appendChild(more);
    }
  }

  function schedule(): void {
    if (scheduled) {
      return;
    }
    scheduled = true;
    window.requestAnimationFrame(enhancePalette);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(canvasElement, { subtree: true, childList: true });
  schedule();
}

function initialiseProcessLoader(workspaceElement: HTMLElement, status: HTMLElement): void {
  const loader = document.createElement('div');
  loader.className = 'enterprise-modeler-process-loader';
  loader.hidden = true;
  loader.innerHTML = `
    <div class="enterprise-modeler-process-loader-card">
      <div class="enterprise-modeler-process-spinner" aria-hidden="true"></div>
      <div>
        <div class="enterprise-modeler-process-loader-title">Loading process</div>
        <div class="enterprise-modeler-process-loader-subtitle">Preparing the selected process layer…</div>
      </div>
    </div>
  `;
  workspaceElement.appendChild(loader);

  let loadingStartedAt = 0;
  let hideTimer: number | undefined;
  let lastStatus = '';

  const update = (): void => {
    const text = status.textContent?.trim() ?? '';
    if (text === lastStatus) {
      return;
    }
    lastStatus = text;

    if (/^Loading\b/i.test(text)) {
      if (hideTimer !== undefined) {
        window.clearTimeout(hideTimer);
        hideTimer = undefined;
      }
      loadingStartedAt = performance.now();
      loader.hidden = false;
      return;
    }

    if (!loader.hidden) {
      const elapsed = performance.now() - loadingStartedAt;
      const delay = Math.max(0, 220 - elapsed);
      hideTimer = window.setTimeout(() => {
        loader.hidden = true;
        hideTimer = undefined;
      }, delay);
    }

    if (/^(Process loaded|Restored\b)/i.test(text)) {
      window.setTimeout(() => addSafeCanvasMargin(), 50);
    }
  };

  const observer = new MutationObserver(update);
  observer.observe(status, { subtree: true, childList: true, characterData: true });
  update();
}

function addSafeCanvasMargin(): void {
  const zoomOutButton = document.getElementById('zoom-out-button') as HTMLButtonElement | null;
  zoomOutButton?.click();
}

function initialiseMetadataHover(canvasElement: HTMLElement): void {
  const tooltip = document.createElement('div');
  tooltip.className = 'enterprise-modeler-metadata-tooltip';
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  let hoveredElementId = '';
  let hoverTimer: number | undefined;
  let pointerX = 0;
  let pointerY = 0;

  canvasElement.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;

    const target = event.target instanceof Element
      ? event.target.closest<SVGElement>('.djs-element.djs-shape[data-element-id]')
      : null;
    const elementId = target?.dataset.elementId?.trim() ?? '';

    if (!elementId) {
      clearHover();
      return;
    }

    if (elementId === hoveredElementId) {
      positionTooltip(tooltip, pointerX, pointerY);
      return;
    }

    hoveredElementId = elementId;
    tooltip.hidden = true;
    if (hoverTimer !== undefined) {
      window.clearTimeout(hoverTimer);
    }

    const label = target?.querySelector<SVGTextElement>('.djs-label')
      ?.textContent
      ?.replace(/\s+/g, ' ')
      .trim() || elementId;

    hoverTimer = window.setTimeout(() => {
      void showMetadataTooltip(tooltip, elementId, label, pointerX, pointerY, () => hoveredElementId);
    }, 320);
  });

  canvasElement.addEventListener('pointerleave', clearHover);

  function clearHover(): void {
    hoveredElementId = '';
    tooltip.hidden = true;
    if (hoverTimer !== undefined) {
      window.clearTimeout(hoverTimer);
      hoverTimer = undefined;
    }
  }
}

async function showMetadataTooltip(
  tooltip: HTMLElement,
  elementId: string,
  elementName: string,
  x: number,
  y: number,
  getHoveredElementId: () => string,
): Promise<void> {
  const process = getCurrentProcessFromHeader();
  if (!process) {
    return;
  }

  const [metadata, organisation] = await Promise.all([
    loadHoverMetadata(process),
    loadOrganisation(true).catch(() => null),
  ]);

  if (getHoveredElementId() !== elementId) {
    return;
  }

  const node = metadata.nodes?.[elementId];
  const owner = node?.ownerPersonId && organisation
    ? organisation.people.find((person) => person.id === node.ownerPersonId)?.name ?? node.ownerPersonId
    : '';
  const responsible = getResponsibleLabel(node, organisation);
  const links = (node?.links ?? [])
    .filter((link) => Boolean(link.targetProcessId))
    .map((link) => {
      const target = PROCESS_CATALOG[link.targetProcessId ?? ''];
      const relationship = formatRelationship(link.type);
      const targetLabel = target ? `${target.level} ${target.name}` : (link.targetProcessId ?? 'Unknown process');
      return `${relationship} → ${targetLabel}${link.label ? ` · ${link.label}` : ''}`;
    });

  tooltip.innerHTML = `
    <div class="enterprise-modeler-metadata-tooltip-title">${escapeHtml(elementName)}</div>
    <div class="enterprise-modeler-metadata-tooltip-grid">
      ${node?.status ? renderTooltipRow('Status', node.status) : ''}
      ${owner ? renderTooltipRow('Owner', owner) : ''}
      ${responsible ? renderTooltipRow('Responsible', responsible) : ''}
    </div>
    ${links.length > 0 ? `
      <div class="enterprise-modeler-metadata-tooltip-links-title">Linked processes</div>
      <div class="enterprise-modeler-metadata-tooltip-links">
        ${links.slice(0, 3).map((link) => `<div>${escapeHtml(link)}</div>`).join('')}
        ${links.length > 3 ? `<div>+ ${links.length - 3} more</div>` : ''}
      </div>
    ` : ''}
    ${!node?.status && !owner && !responsible && links.length === 0
      ? '<div class="enterprise-modeler-metadata-tooltip-empty">No key metadata recorded.</div>'
      : ''}
  `;

  tooltip.hidden = false;
  positionTooltip(tooltip, x, y);
}

function getCurrentProcessFromHeader(): ProcessDefinition | null {
  const name = document.querySelector<HTMLElement>('#document-name')?.textContent?.trim() ?? '';
  const level = document.querySelector<HTMLElement>('#process-level')?.textContent?.trim() ?? '';

  return Object.values(PROCESS_CATALOG).find(
    (process) => process.name === name && process.level === level,
  ) ?? null;
}

async function loadHoverMetadata(process: ProcessDefinition): Promise<HoverProcessMetadata> {
  const local = localStorage.getItem(`${PROCESS_METADATA_AUTOSAVE_PREFIX}${process.id}`);
  if (local) {
    try {
      return JSON.parse(local) as HoverProcessMetadata;
    } catch (error) {
      console.warn('Unable to parse local process metadata for hover card.', error);
    }
  }

  try {
    const response = await fetch(process.metadataUrl, { cache: 'no-store' });
    if (response.ok) {
      return await response.json() as HoverProcessMetadata;
    }
  } catch (error) {
    console.warn('Unable to load repository process metadata for hover card.', error);
  }

  return { nodes: {} };
}

function getResponsibleLabel(
  node: HoverNodeMetadata | undefined,
  organisation: OrganisationData | null,
): string {
  if (!node?.responsibleId || !organisation) {
    return '';
  }

  if (node.responsibleType === 'role') {
    return getRoleName(organisation, node.responsibleId);
  }

  if (node.responsibleType === 'team') {
    return getTeamName(organisation, node.responsibleId);
  }

  return node.responsibleId;
}

function formatRelationship(type?: string): string {
  switch (type) {
    case 'drill-down':
      return 'Drill down';
    case 'exception':
      return 'Exception';
    case 'supporting':
      return 'Supporting';
    case 'related':
      return 'Related';
    default:
      return 'Linked';
  }
}

function renderTooltipRow(label: string, value: string): string {
  return `
    <span class="enterprise-modeler-metadata-tooltip-key">${escapeHtml(label)}</span>
    <span>${escapeHtml(value)}</span>
  `;
}

function positionTooltip(tooltip: HTMLElement, x: number, y: number): void {
  const gap = 14;
  const padding = 12;
  const rect = tooltip.getBoundingClientRect();

  let left = x + gap;
  let top = y + gap;

  if (left + rect.width + padding > window.innerWidth) {
    left = x - rect.width - gap;
  }
  if (top + rect.height + padding > window.innerHeight) {
    top = y - rect.height - gap;
  }

  tooltip.style.left = `${Math.max(padding, left)}px`;
  tooltip.style.top = `${Math.max(padding, top)}px`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
