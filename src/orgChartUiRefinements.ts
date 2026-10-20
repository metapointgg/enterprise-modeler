import './orgChartUiRefinements.css';
import { getBpmnModelerForCanvas } from './bpmnModelerRegistry';

const ORG_CHART_BUTTON_SELECTOR = '#org-chart-button';
const ORG_CHART_DIALOG_SELECTOR = 'dialog.org-chart-dialog';
const ORG_CHART_CANVAS_SELECTOR = '.org-chart-diagram-canvas';
const CONTROLS_CLASS = 'org-chart-zoom-controls';
const EMPTY_CONTEXT_CLASS = 'org-chart-diagram-context-empty';
const ZOOM_STEP = 1.2;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;

interface ZoomCanvasService {
  zoom(): number;
  zoom(scale: number | 'fit-viewport'): number;
}

let scheduled = false;
let fitScheduled = false;

function withCanvas(canvasHost: HTMLElement, action: (canvas: ZoomCanvasService) => void): void {
  const modeler = getBpmnModelerForCanvas(canvasHost);
  if (!modeler) return;

  try {
    action(modeler.get<ZoomCanvasService>('canvas'));
  } catch (error) {
    console.warn('Unable to access the Organisation Chart BPMN canvas.', error);
  }
}

function zoom(canvasHost: HTMLElement, direction: 'in' | 'out'): void {
  withCanvas(canvasHost, (canvas) => {
    const current = canvas.zoom();
    if (!Number.isFinite(current) || current <= 0) return;

    const factor = direction === 'in' ? ZOOM_STEP : 1 / ZOOM_STEP;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * factor));
    canvas.zoom(next);
  });
}

function fitDiagram(canvasHost?: HTMLElement): void {
  const host = canvasHost ?? document.querySelector<HTMLElement>(ORG_CHART_CANVAS_SELECTOR);
  if (!host) return;
  withCanvas(host, (canvas) => canvas.zoom('fit-viewport'));
}

function scheduleFit(): void {
  if (fitScheduled) return;
  fitScheduled = true;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      fitScheduled = false;
      const canvas = document.querySelector<HTMLElement>(ORG_CHART_CANVAS_SELECTOR);
      if (!canvas || canvas.getBoundingClientRect().width <= 0) return;
      fitDiagram(canvas);
    });
  });
}

function ensureZoomControls(canvasHost: HTMLElement): void {
  if (canvasHost.querySelector(`.${CONTROLS_CLASS}`)) return;

  const controls = document.createElement('div');
  controls.className = CONTROLS_CLASS;
  controls.setAttribute('aria-label', 'Organisation chart zoom controls');
  controls.innerHTML = `
    <button type="button" class="org-chart-zoom-button" data-org-chart-zoom="fit" title="Fit diagram" aria-label="Fit diagram">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
    <button type="button" class="org-chart-zoom-button org-chart-zoom-symbol" data-org-chart-zoom="in" title="Zoom in" aria-label="Zoom in">+</button>
    <button type="button" class="org-chart-zoom-button org-chart-zoom-symbol" data-org-chart-zoom="out" title="Zoom out" aria-label="Zoom out">−</button>
  `;

  controls.querySelectorAll<HTMLButtonElement>('[data-org-chart-zoom]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.orgChartZoom;
      if (action === 'fit') {
        fitDiagram(canvasHost);
        return;
      }
      if (action === 'in' || action === 'out') {
        zoom(canvasHost, action);
      }
    });
  });

  canvasHost.appendChild(controls);
  scheduleFit();
}

function updateContextVisibility(): void {
  const context = document.querySelector<HTMLElement>('.org-chart-diagram-context');
  if (!context) return;

  const hasActionableContent = Boolean(context.querySelector(
    '[data-org-open-position], [data-org-open-person], [data-org-delete-reporting], [data-org-cancel-link], [data-org-link-manager]',
  ));

  context.classList.toggle(EMPTY_CONTEXT_CLASS, !hasActionableContent);
  context.setAttribute('aria-hidden', hasActionableContent ? 'false' : 'true');
}

function ensureVisibleOrgChartBeforeLegacyOpen(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null;
  if (!target?.closest(ORG_CHART_BUTTON_SELECTOR)) return;

  const dialog = document.querySelector<HTMLDialogElement>(ORG_CHART_DIALOG_SELECTOR);
  if (!dialog || dialog.open) return;

  // workspacePages.ts replaces showModal() with page activation. Running this in
  // capture phase makes the page visible before OrgChartView.open() renders data,
  // so bpmn-js measures a real workspace instead of a hidden dialog.
  dialog.showModal();
}

function refineVisibleOrgChart(): void {
  scheduled = false;

  const canvasHost = document.querySelector<HTMLElement>(ORG_CHART_CANVAS_SELECTOR);
  if (canvasHost) ensureZoomControls(canvasHost);

  updateContextVisibility();
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(refineVisibleOrgChart);
}

document.addEventListener('click', ensureVisibleOrgChartBeforeLegacyOpen, true);

document.addEventListener('enterprise-modeler:workspace-page-changed', (event) => {
  const page = (event as CustomEvent<{ page?: string }>).detail?.page ?? '';
  if (page === 'org-chart-dialog') scheduleFit();
  schedule();
});

document.addEventListener('enterprise-modeler:bpmn-modeler-registered', () => {
  schedule();
  scheduleFit();
});

new MutationObserver(schedule).observe(document.body, {
  subtree: true,
  childList: true,
});

schedule();
