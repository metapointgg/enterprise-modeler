import './orgChartDrag.css';

import {
  getPositionOccupants,
  loadOrganisation,
  saveOrganisationLocally,
  type OrganisationData,
  type Position,
} from './organisation';

type DragState = PositionDragState | PanDragState | null;

interface Point {
  x: number;
  y: number;
}

interface PositionDragState {
  kind: 'position';
  card: HTMLElement;
  positionId: string;
  originalManagerPositionId?: string;
  startPointer: Point;
  moved: boolean;
  targetPositionId: string;
  dropAtRoot: boolean;
}

interface PanDragState {
  kind: 'pan';
  scroll: HTMLElement;
  startClientX: number;
  startClientY: number;
  startScrollLeft: number;
  startScrollTop: number;
}

interface UndoState {
  positionId: string;
  managerPositionId?: string;
  message: string;
}

const DRAG_THRESHOLD = 5;

class OrgChartDragController {
  private data: OrganisationData | null = null;
  private dragState: DragState = null;
  private enhancedRoot: HTMLElement | null = null;
  private scheduled = false;
  private suppressClickUntil = 0;
  private suppressPositionId = '';
  private undoTimer: number | undefined;

  constructor() {
    document.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
    window.addEventListener('pointermove', (event) => this.handlePointerMove(event));
    window.addEventListener('pointerup', (event) => void this.handlePointerUp(event));
    window.addEventListener('pointercancel', () => this.cancelDrag());
    document.addEventListener('click', (event) => this.suppressClickAfterDrag(event), true);

    new MutationObserver(() => this.scheduleEnhancement()).observe(document.body, {
      subtree: true,
      childList: true,
    });

    this.scheduleEnhancement();
  }

  private scheduleEnhancement(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    window.requestAnimationFrame(() => {
      this.scheduled = false;
      void this.enhanceVisibleChart();
    });
  }

  private async enhanceVisibleChart(): Promise<void> {
    const root = document.querySelector<HTMLElement>('#org-chart-view-root');
    if (!root || !root.querySelector('.org-chart-view')) return;

    try {
      this.data = await loadOrganisation(true);
    } catch (error) {
      console.warn('Unable to load organisation data for org-chart dragging.', error);
      return;
    }

    this.enhancedRoot = root;
    const hierarchyVisible = Boolean(root.querySelector('.org-chart-roots'));

    root.querySelectorAll<HTMLElement>('.org-chart-card').forEach((card) => {
      const positionId = this.resolvePositionId(card);
      if (positionId && hierarchyVisible) {
        card.dataset.orgDragPosition = positionId;
        card.classList.add('org-chart-card-draggable');
        card.title = this.buildCardTitle(positionId);
      } else {
        delete card.dataset.orgDragPosition;
        card.classList.remove('org-chart-card-draggable');
      }
    });

    this.ensureRootDropZone(root, hierarchyVisible);
    this.enhanceHelp(root, hierarchyVisible);
  }

  private resolvePositionId(card: HTMLElement): string {
    const directPositionId = card.dataset.orgPosition?.trim();
    if (directPositionId) return directPositionId;

    const personId = card.dataset.orgPerson?.trim();
    if (!personId || !this.data) return '';

    return this.data.people.find((person) => person.id === personId)?.positionId ?? '';
  }

  private buildCardTitle(positionId: string): string {
    if (!this.data) return 'Drag to change reporting line';
    const position = this.data.positions.find((candidate) => candidate.id === positionId);
    if (!position) return 'Drag to change reporting line';
    const occupants = getPositionOccupants(this.data, positionId);
    const label = occupants[0]?.name ?? position.name;
    return `Drag ${label} to another position to change the reporting line. Click to edit.`;
  }

  private ensureRootDropZone(root: HTMLElement, hierarchyVisible: boolean): void {
    const scroll = root.querySelector<HTMLElement>('.org-chart-scroll');
    if (!scroll) return;

    let zone = scroll.querySelector<HTMLElement>('.org-chart-root-drop-zone');
    if (!hierarchyVisible) {
      zone?.remove();
      return;
    }

    if (!zone) {
      zone = document.createElement('div');
      zone.className = 'org-chart-root-drop-zone';
      zone.innerHTML = '<strong>Top level</strong><span>Drop here to remove the reporting manager</span>';
      scroll.insertAdjacentElement('afterbegin', zone);
    }
  }

  private enhanceHelp(root: HTMLElement, hierarchyVisible: boolean): void {
    const help = root.querySelector<HTMLElement>('.org-chart-help');
    if (!help) return;

    help.querySelector('.org-chart-drag-help')?.remove();
    const note = document.createElement('span');
    note.className = 'org-chart-drag-help';
    note.textContent = hierarchyVisible
      ? ' Drag an occupied or vacant Position onto another card to change its reporting manager. Drag blank space to pan.'
      : ' Switch to Hierarchy View to drag Positions and change reporting lines. Drag blank space to pan.';
    help.appendChild(note);
  }

  private handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;

    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const dialog = target.closest('.org-chart-dialog');
    if (!dialog) return;

    const card = target.closest<HTMLElement>('.org-chart-card[data-org-drag-position]');
    if (card && this.data) {
      const positionId = card.dataset.orgDragPosition ?? '';
      const position = this.getPosition(positionId);
      if (!position) return;

      this.dragState = {
        kind: 'position',
        card,
        positionId,
        originalManagerPositionId: position.managerPositionId,
        startPointer: { x: event.clientX, y: event.clientY },
        moved: false,
        targetPositionId: '',
        dropAtRoot: false,
      };

      card.classList.add('org-chart-card-drag-source');
      event.preventDefault();
      return;
    }

    if (target.closest('.org-chart-root-drop-zone')) return;
    if (target.closest('button, input, select, textarea, label')) return;

    const scroll = target.closest<HTMLElement>('.org-chart-scroll');
    if (!scroll) return;

    this.dragState = {
      kind: 'pan',
      scroll,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScrollLeft: scroll.scrollLeft,
      startScrollTop: scroll.scrollTop,
    };
    scroll.classList.add('org-chart-scroll-panning');
    event.preventDefault();
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.dragState) return;

    if (this.dragState.kind === 'pan') {
      const deltaX = event.clientX - this.dragState.startClientX;
      const deltaY = event.clientY - this.dragState.startClientY;
      this.dragState.scroll.scrollLeft = this.dragState.startScrollLeft - deltaX;
      this.dragState.scroll.scrollTop = this.dragState.startScrollTop - deltaY;
      event.preventDefault();
      return;
    }

    const state = this.dragState;
    const deltaX = event.clientX - state.startPointer.x;
    const deltaY = event.clientY - state.startPointer.y;

    if (!state.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;

    state.moved = true;
    document.body.classList.add('org-chart-position-dragging');
    this.clearDropHighlights();

    const elementUnderPointer = document.elementFromPoint(event.clientX, event.clientY);
    const rootZone = elementUnderPointer?.closest<HTMLElement>('.org-chart-root-drop-zone');

    if (rootZone) {
      state.targetPositionId = '';
      state.dropAtRoot = true;
      rootZone.classList.add('org-chart-root-drop-zone-active');
      event.preventDefault();
      return;
    }

    state.dropAtRoot = false;
    const targetCard = elementUnderPointer?.closest<HTMLElement>('.org-chart-card[data-org-drag-position]');
    const targetPositionId = targetCard?.dataset.orgDragPosition ?? '';

    if (!targetCard || !targetPositionId || targetPositionId === state.positionId) {
      state.targetPositionId = '';
      event.preventDefault();
      return;
    }

    if (this.wouldCreateCycle(state.positionId, targetPositionId)) {
      state.targetPositionId = '';
      targetCard.classList.add('org-chart-card-drop-invalid');
      event.preventDefault();
      return;
    }

    state.targetPositionId = targetPositionId;
    targetCard.classList.add('org-chart-card-drop-target');
    event.preventDefault();
  }

  private async handlePointerUp(event: PointerEvent): Promise<void> {
    if (!this.dragState) return;

    if (this.dragState.kind === 'pan') {
      this.dragState.scroll.classList.remove('org-chart-scroll-panning');
      this.dragState = null;
      return;
    }

    const state = this.dragState;
    this.dragState = null;
    state.card.classList.remove('org-chart-card-drag-source');
    document.body.classList.remove('org-chart-position-dragging');
    this.clearDropHighlights();

    if (!state.moved) return;

    this.suppressPositionId = state.positionId;
    this.suppressClickUntil = performance.now() + 350;

    const newManagerPositionId = state.dropAtRoot ? undefined : state.targetPositionId || undefined;
    if (!state.dropAtRoot && !state.targetPositionId) return;
    if (newManagerPositionId === state.originalManagerPositionId) return;

    await this.applyReportingChange(
      state.positionId,
      newManagerPositionId,
      state.originalManagerPositionId,
    );

    event.preventDefault();
  }

  private async applyReportingChange(
    positionId: string,
    newManagerPositionId: string | undefined,
    previousManagerPositionId: string | undefined,
  ): Promise<void> {
    const data = await loadOrganisation(true);
    const position = data.positions.find((candidate) => candidate.id === positionId);
    if (!position) return;

    if (newManagerPositionId && this.wouldCreateCycleWithData(data, positionId, newManagerPositionId)) {
      window.alert('That move would create a circular reporting line and has been blocked.');
      return;
    }

    if (newManagerPositionId) {
      position.managerPositionId = newManagerPositionId;
    } else {
      delete position.managerPositionId;
    }

    saveOrganisationLocally(data);
    this.data = data;

    const manager = newManagerPositionId
      ? data.positions.find((candidate) => candidate.id === newManagerPositionId)
      : undefined;
    const occupant = getPositionOccupants(data, positionId)[0];
    const movedLabel = occupant?.name ?? position.name;
    const managerLabel = manager
      ? (getPositionOccupants(data, manager.id)[0]?.name ?? manager.name)
      : 'Top level';

    document.dispatchEvent(new CustomEvent('enterprise-modeler:organisation-changed', {
      detail: {
        positionId,
        managerPositionId: newManagerPositionId ?? '',
      },
    }));

    this.showUndo({
      positionId,
      managerPositionId: previousManagerPositionId,
      message: `${movedLabel} now reports to ${managerLabel}.`,
    });

    this.refreshChart();
  }

  private showUndo(state: UndoState): void {
    document.querySelector('.org-chart-drag-toast')?.remove();
    if (this.undoTimer !== undefined) window.clearTimeout(this.undoTimer);

    const toast = document.createElement('div');
    toast.className = 'org-chart-drag-toast';
    toast.innerHTML = `
      <span>${escapeHtml(state.message)}</span>
      <button type="button">Undo</button>
    `;
    document.body.appendChild(toast);

    toast.querySelector<HTMLButtonElement>('button')?.addEventListener('click', () => {
      toast.remove();
      if (this.undoTimer !== undefined) window.clearTimeout(this.undoTimer);
      this.undoTimer = undefined;
      void this.restoreManager(state);
    });

    this.undoTimer = window.setTimeout(() => {
      toast.remove();
      this.undoTimer = undefined;
    }, 6500);
  }

  private async restoreManager(state: UndoState): Promise<void> {
    const data = await loadOrganisation(true);
    const position = data.positions.find((candidate) => candidate.id === state.positionId);
    if (!position) return;

    if (state.managerPositionId) {
      if (this.wouldCreateCycleWithData(data, state.positionId, state.managerPositionId)) {
        window.alert('The previous reporting line can no longer be restored because it would create a circular hierarchy.');
        return;
      }
      position.managerPositionId = state.managerPositionId;
    } else {
      delete position.managerPositionId;
    }

    saveOrganisationLocally(data);
    this.data = data;
    document.dispatchEvent(new CustomEvent('enterprise-modeler:organisation-changed', {
      detail: {
        positionId: state.positionId,
        managerPositionId: state.managerPositionId ?? '',
      },
    }));
    this.refreshChart();
  }

  private refreshChart(): void {
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>('#org-chart-refresh')?.click();
    }, 0);
  }

  private wouldCreateCycle(positionId: string, managerPositionId: string): boolean {
    return this.data
      ? this.wouldCreateCycleWithData(this.data, positionId, managerPositionId)
      : true;
  }

  private wouldCreateCycleWithData(
    data: OrganisationData,
    positionId: string,
    managerPositionId: string,
  ): boolean {
    if (positionId === managerPositionId) return true;

    const positions = new Map(data.positions.map((position) => [position.id, position]));
    const visited = new Set<string>();
    let cursor: Position | undefined = positions.get(managerPositionId);

    while (cursor) {
      if (cursor.id === positionId) return true;
      if (visited.has(cursor.id)) return true;
      visited.add(cursor.id);
      cursor = cursor.managerPositionId ? positions.get(cursor.managerPositionId) : undefined;
    }

    return false;
  }

  private getPosition(positionId: string): Position | undefined {
    return this.data?.positions.find((candidate) => candidate.id === positionId);
  }

  private clearDropHighlights(): void {
    this.enhancedRoot
      ?.querySelectorAll<HTMLElement>(
        '.org-chart-card-drop-target, .org-chart-card-drop-invalid, .org-chart-root-drop-zone-active',
      )
      .forEach((element) => {
        element.classList.remove(
          'org-chart-card-drop-target',
          'org-chart-card-drop-invalid',
          'org-chart-root-drop-zone-active',
        );
      });
  }

  private cancelDrag(): void {
    if (!this.dragState) return;

    if (this.dragState.kind === 'position') {
      this.dragState.card.classList.remove('org-chart-card-drag-source');
    } else {
      this.dragState.scroll.classList.remove('org-chart-scroll-panning');
    }

    this.dragState = null;
    document.body.classList.remove('org-chart-position-dragging');
    this.clearDropHighlights();
  }

  private suppressClickAfterDrag(event: MouseEvent): void {
    if (!this.suppressPositionId || performance.now() > this.suppressClickUntil) {
      this.suppressPositionId = '';
      return;
    }

    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('.org-chart-card[data-org-drag-position]')
      : null;
    if (target?.dataset.orgDragPosition !== this.suppressPositionId) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.suppressPositionId = '';
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

new OrgChartDragController();
