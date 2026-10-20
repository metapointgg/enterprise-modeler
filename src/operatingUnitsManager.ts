import './operatingUnitsManager.css';

import {
  getDepartmentName,
  getPositionOccupants,
  getRoleName,
  loadOrganisation,
  type OrganisationData,
} from './organisation';
import {
  exportOperatingUnitsJson,
  generateOperatingUnitId,
  loadOperatingUnits,
  resetOperatingUnitsToRepository,
  saveOperatingUnitsLocally,
  type OperatingUnit,
  type OperatingUnitsData,
  type OperatingUnitType,
} from './operatingUnits';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sortedByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

class OperatingUnitsManager {
  private readonly anchorButton: HTMLButtonElement;
  private readonly button: HTMLButtonElement;
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;

  private organisation: OrganisationData | null = null;
  private data: OperatingUnitsData = { schemaVersion: 1, units: [] };
  private selectedUnitId: string | null = null;

  constructor(anchorButton: HTMLButtonElement) {
    this.anchorButton = anchorButton;

    this.button = document.createElement('button');
    this.button.id = 'operating-units-button';
    this.button.className = 'toolbar-button';
    this.button.type = 'button';
    this.button.textContent = 'Operating Units';
    this.anchorButton.insertAdjacentElement('afterend', this.button);

    this.dialog = document.createElement('dialog');
    this.dialog.className = 'operating-units-dialog';
    this.dialog.innerHTML = '<div id="operating-units-root"></div>';
    document.body.appendChild(this.dialog);

    const root = this.dialog.querySelector<HTMLDivElement>('#operating-units-root');
    if (!root) {
      throw new Error('Unable to initialise operating units manager.');
    }

    this.root = root;

    this.button.addEventListener('click', () => void this.open());
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) {
        this.dialog.close();
      }
    });
  }

  private async open(): Promise<void> {
    this.organisation = await loadOrganisation(true);
    this.data = await loadOperatingUnits(true);
    this.ensureSelection();
    this.render();

    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }

  private ensureSelection(): void {
    if (this.selectedUnitId && !this.data.units.some((unit) => unit.id === this.selectedUnitId)) {
      this.selectedUnitId = null;
    }
  }

  private render(): void {
    const organisation = this.organisation;
    if (!organisation) {
      return;
    }

    const selected = this.selectedUnitId
      ? this.data.units.find((unit) => unit.id === this.selectedUnitId) ?? null
      : null;

    const units = sortedByName(this.data.units);

    const list = units.length === 0
      ? '<div class="operating-units-empty">No operating units have been added yet.</div>'
      : units.map((unit) => {
          const activePositions = unit.positionIds.filter((positionId) =>
            organisation.positions.some((position) => position.id === positionId && position.active),
          );
          const peopleCount = activePositions.reduce(
            (count, positionId) => count + getPositionOccupants(organisation, positionId).length,
            0,
          );

          return `
            <button
              class="organisation-list-item${unit.id === this.selectedUnitId ? ' organisation-list-item-selected' : ''}"
              type="button"
              data-edit-operating-unit="${escapeHtml(unit.id)}"
            >
              <span class="organisation-list-primary">${escapeHtml(unit.name)}</span>
              <span class="organisation-list-secondary">
                ${escapeHtml(this.formatUnitType(unit.type))}
                ${unit.code ? ` · ${escapeHtml(unit.code)}` : ''}
                · ${activePositions.length} position${activePositions.length === 1 ? '' : 's'}
                · ${peopleCount} person${peopleCount === 1 ? '' : 's'}
                ${unit.active ? '' : ' · Inactive'}
              </span>
            </button>
          `;
        }).join('');

    this.root.innerHTML = `
      <div class="operating-units-manager">
        <header class="operating-units-header">
          <div>
            <div class="organisation-title">Operating Units</div>
            <div class="organisation-subtitle">
              Operating units represent business units, offices/sites, legal entities or functions. Positions may be assigned to one operating unit.
            </div>
          </div>

          <div class="organisation-header-actions">
            <button id="operating-units-export" class="toolbar-button" type="button">Export JSON</button>
            <button id="operating-units-reset" class="toolbar-button" type="button">Reset</button>
            <button id="operating-units-close" class="metadata-close-button" type="button" title="Close">×</button>
          </div>
        </header>

        <div class="operating-units-content">
          <div class="operating-units-list-pane">
            <div class="organisation-section-heading">
              <span>Operating Units</span>
              <button id="operating-units-new" class="toolbar-button" type="button">New Unit</button>
            </div>
            <div class="organisation-list">${list}</div>
          </div>

          <div class="operating-units-editor-pane">
            ${this.renderForm(selected)}
          </div>
        </div>

        <footer class="organisation-footer-note">
          People belong to a operating unit through the Position they occupy. Export <strong>operating-units.json</strong> and commit it to publish these assignments.
        </footer>
      </div>
    `;

    this.bindEvents();
  }

  private renderForm(unit: OperatingUnit | null): string {
    const organisation = this.organisation;
    if (!organisation) {
      return '';
    }

    const otherAssignments = new Map<string, OperatingUnit>();
    this.data.units
      .filter((candidate) => candidate.id !== unit?.id)
      .forEach((candidate) => {
        candidate.positionIds.forEach((positionId) => otherAssignments.set(positionId, candidate));
      });

    const positions = sortedByName(organisation.positions);
    const positionRows = positions.length === 0
      ? '<div class="organisation-muted">Create Positions in Organisation before assigning them to an operating unit.</div>'
      : positions.map((position) => {
          const assignedElsewhere = otherAssignments.get(position.id);
          const checked = unit?.positionIds.includes(position.id) ?? false;
          const role = getRoleName(organisation, position.roleId);
          const department = getDepartmentName(organisation, position.departmentId);
          const occupant = getPositionOccupants(organisation, position.id)
            .map((person) => person.name)
            .join(', ');
          const detail = [role, department, occupant || 'Vacant'].filter(Boolean).join(' · ');

          return `
            <label class="operating-unit-position-row${assignedElsewhere ? ' operating-unit-position-row-disabled' : ''}">
              <input
                type="checkbox"
                name="operatingUnitPositionIds"
                value="${escapeHtml(position.id)}"
                ${checked ? 'checked' : ''}
                ${assignedElsewhere ? 'disabled' : ''}
              />
              <span class="operating-unit-position-copy">
                <span class="operating-unit-position-name">${escapeHtml(position.name)}</span>
                <span class="operating-unit-position-detail">${escapeHtml(detail)}</span>
                ${assignedElsewhere
                  ? `<span class="operating-unit-position-assigned">Assigned to ${escapeHtml(assignedElsewhere.name)}</span>`
                  : ''}
              </span>
            </label>
          `;
        }).join('');

    return `
      <form id="operating-unit-form" class="organisation-form operating-unit-form">
        <div class="organisation-editor-heading">${unit ? 'Edit operating unit' : 'Add operating unit'}</div>
        ${unit ? `<div class="organisation-record-id">${escapeHtml(unit.id)}</div>` : ''}

        <label class="metadata-field">
          <span>Name</span>
          <input id="operating-unit-name" type="text" required value="${escapeHtml(unit?.name ?? '')}" placeholder="e.g. Operations, London Office or Company Ltd" />
        </label>

        <label class="metadata-field">
          <span>Type</span>
          <select id="operating-unit-type">
            <option value="business-unit"${unit?.type === 'business-unit' ? ' selected' : ''}>Business Unit</option>
            <option value="office-site"${unit?.type === 'office-site' ? ' selected' : ''}>Office / Site</option>
            <option value="legal-entity"${unit?.type === 'legal-entity' ? ' selected' : ''}>Legal Entity</option>
            <option value="function"${unit?.type === 'function' ? ' selected' : ''}>Function</option>
            <option value="other"${unit?.type === 'other' ? ' selected' : ''}>Other</option>
          </select>
        </label>

        <label class="metadata-field">
          <span>Code</span>
          <input id="operating-unit-code" type="text" value="${escapeHtml(unit?.code ?? '')}" placeholder="Optional stable business code" />
        </label>

        <fieldset class="organisation-fieldset operating-unit-positions">
          <legend>Positions in this unit</legend>
          <div class="operating-unit-position-list">
            ${positionRows}
          </div>
        </fieldset>

        <div class="metadata-help">
          A Person's unit is derived from their Position. Position reporting may cross unit boundaries; reporting lines may cross operating-unit boundaries.
        </div>

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="operating-unit-active" type="checkbox"${unit?.active !== false ? ' checked' : ''} />
          <span>Active operating unit</span>
        </label>

        <label class="metadata-field">
          <span>Notes</span>
          <textarea id="operating-unit-notes" rows="3">${escapeHtml(unit?.notes ?? '')}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${unit ? 'Save Unit' : 'Add Unit'}</button>
          ${unit ? '<button id="operating-unit-delete" class="toolbar-button toolbar-button-danger" type="button">Delete</button>' : ''}
        </div>
      </form>
    `;
  }

  private bindEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#operating-units-close')?.addEventListener('click', () => this.dialog.close());

    this.root.querySelector<HTMLButtonElement>('#operating-units-new')?.addEventListener('click', () => {
      this.selectedUnitId = null;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-edit-operating-unit]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedUnitId = button.dataset.editOperatingUnit ?? null;
        this.render();
      });
    });

    this.root.querySelector<HTMLFormElement>('#operating-unit-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveUnit();
    });

    this.root.querySelector<HTMLButtonElement>('#operating-unit-delete')?.addEventListener('click', () => this.deleteUnit());

    this.root.querySelector<HTMLButtonElement>('#operating-units-export')?.addEventListener('click', () => {
      exportOperatingUnitsJson(this.data);
    });

    this.root.querySelector<HTMLButtonElement>('#operating-units-reset')?.addEventListener('click', () => void this.reset());
  }

  private getInputValue(id: string): string {
    return this.root.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`#${id}`)?.value.trim() ?? '';
  }

  private saveUnit(): void {
    const name = this.getInputValue('operating-unit-name');
    if (!name) {
      return;
    }

    const existing = this.selectedUnitId
      ? this.data.units.find((unit) => unit.id === this.selectedUnitId)
      : undefined;

    const typeValue = this.getInputValue('operating-unit-type');
    const type = (['business-unit', 'office-site', 'legal-entity', 'function', 'other'].includes(typeValue) ? typeValue : 'business-unit') as OperatingUnitType;
    const positionIds = Array.from(
      this.root.querySelectorAll<HTMLInputElement>('input[name="operatingUnitPositionIds"]:checked'),
    ).map((checkbox) => checkbox.value);

    const conflicts = this.data.units
      .filter((unit) => unit.id !== existing?.id)
      .flatMap((unit) => positionIds
        .filter((positionId) => unit.positionIds.includes(positionId))
        .map((positionId) => ({ positionId, unit })));

    if (conflicts.length > 0) {
      const organisation = this.organisation;
      const labels = conflicts.map(({ positionId, unit }) => {
        const positionName = organisation?.positions.find((position) => position.id === positionId)?.name ?? positionId;
        return `${positionName} → ${unit.name}`;
      });
      window.alert(`Each Position can belong to only one operating unit. Resolve these assignments first:\n\n${labels.join('\n')}`);
      return;
    }

    const unit: OperatingUnit = {
      id: existing?.id ?? generateOperatingUnitId(),
      name,
      type,
      code: this.getInputValue('operating-unit-code'),
      positionIds,
      active: this.root.querySelector<HTMLInputElement>('#operating-unit-active')?.checked ?? true,
      notes: this.getInputValue('operating-unit-notes'),
    };

    if (existing) {
      Object.assign(existing, unit);
    } else {
      this.data.units.push(unit);
    }

    this.selectedUnitId = unit.id;
    saveOperatingUnitsLocally(this.data);
    this.render();
  }

  private deleteUnit(): void {
    if (!this.selectedUnitId) {
      return;
    }

    const unit = this.data.units.find((candidate) => candidate.id === this.selectedUnitId);
    if (!unit) {
      return;
    }

    if (!window.confirm(`Delete operating unit ${unit.name}? Its Positions will become unassigned to an operating unit.`)) {
      return;
    }

    this.data.units = this.data.units.filter((candidate) => candidate.id !== unit.id);
    this.selectedUnitId = null;
    saveOperatingUnitsLocally(this.data);
    this.render();
  }

  private async reset(): Promise<void> {
    if (!window.confirm('Reset Operating Unit data to the repository version? All locally saved unit changes will be discarded.')) {
      return;
    }

    try {
      this.data = await resetOperatingUnitsToRepository();
      this.selectedUnitId = null;
      this.render();
    } catch (error) {
      console.error('Unable to reset operating units.', error);
      window.alert('Unable to reset Operating Unit data from the repository.');
    }
  }

  private formatUnitType(type: OperatingUnitType): string {
    switch (type) {
      case 'office-site': return 'Office / Site';
      case 'legal-entity': return 'Legal Entity';
      case 'function': return 'Function';
      case 'other': return 'Other';
      case 'business-unit':
      default: return 'Business Unit';
    }
  }
}

function initialiseOperatingUnitsManager(): void {
  const chartButton = document.querySelector<HTMLButtonElement>('#org-chart-button');
  const organisationButton = document.querySelector<HTMLButtonElement>('#organisation-button');
  const anchor = chartButton ?? organisationButton;

  if (!anchor) {
    console.warn('Organisation toolbar buttons were not found; Operating Units manager was not initialised.');
    return;
  }

  new OperatingUnitsManager(anchor);
}

initialiseOperatingUnitsManager();
