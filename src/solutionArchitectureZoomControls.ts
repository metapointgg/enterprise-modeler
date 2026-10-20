import './solutionArchitectureZoomControls.css';
import { getBpmnModelerForCanvas } from './bpmnModelerRegistry';

const ARCHITECTURE_CANVAS_SELECTOR = '#solution-architecture-bpmn-canvas';
const CONTROLS_CLASS = 'solution-architecture-zoom-controls';
const ZOOM_STEP = 1.2;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;

interface ZoomCanvasService {
  zoom(): number;
  zoom(scale: number | 'fit-viewport'): number;
}

let scheduled = false;

function withCanvas(canvasHost: HTMLElement, action: (canvas: ZoomCanvasService) => void): void {
  const modeler = getBpmnModelerForCanvas(canvasHost);
  if (!modeler) return;

  try {
    action(modeler.get<ZoomCanvasService>('canvas'));
  } catch (error) {
    console.warn('Unable to access the Solution Architecture BPMN canvas.', error);
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

function fit(canvasHost: HTMLElement): void {
  withCanvas(canvasHost, (canvas) => canvas.zoom('fit-viewport'));
}

function ensureArchitectureZoomControls(): void {
  scheduled = false;

  const canvasHost = document.querySelector<HTMLElement>(ARCHITECTURE_CANVAS_SELECTOR);
  if (!canvasHost || canvasHost.querySelector(`.${CONTROLS_CLASS}`)) return;

  const controls = document.createElement('div');
  controls.className = CONTROLS_CLASS;
  controls.setAttribute('aria-label', 'Solution architecture zoom controls');
  controls.innerHTML = `
    <button type="button" class="solution-architecture-zoom-button" data-architecture-zoom="fit" title="Fit diagram" aria-label="Fit diagram">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
    <button type="button" class="solution-architecture-zoom-button solution-architecture-zoom-symbol" data-architecture-zoom="in" title="Zoom in" aria-label="Zoom in">+</button>
    <button type="button" class="solution-architecture-zoom-button solution-architecture-zoom-symbol" data-architecture-zoom="out" title="Zoom out" aria-label="Zoom out">−</button>
  `;

  controls.querySelectorAll<HTMLButtonElement>('[data-architecture-zoom]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.architectureZoom;
      if (action === 'fit') {
        fit(canvasHost);
        return;
      }
      if (action === 'in' || action === 'out') {
        zoom(canvasHost, action);
      }
    });
  });

  canvasHost.appendChild(controls);
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(ensureArchitectureZoomControls);
}

new MutationObserver(schedule).observe(document.body, {
  subtree: true,
  childList: true,
});

document.addEventListener('enterprise-modeler:workspace-page-changed', schedule);
document.addEventListener('enterprise-modeler:bpmn-modeler-registered', schedule);
schedule();
