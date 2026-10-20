import './orgChartView.css';
import './orgChartUnits.css';

import {
  getDepartmentName,
  getPersonDepartmentId,
  getPersonRoleId,
  getPositionOccupants,
  getRoleName,
  loadOrganisation,
  type OrganisationData,
  type Person,
  type Position,
  type Role,
} from './organisation';
import {
  getUnitForPosition,
  loadOperatingUnits,
  type OperatingUnit,
  type OperatingUnitsData,
} from './operatingUnits';

interface PersonNode {
  person: Person;
  children: PersonNode[];
}

interface PositionNode {
  position: Position;
  children: PositionNode[];
}

type OrgChartMode = 'hierarchy' | 'department';

const UNASSIGNED_SCOPE = '__unassigned__';

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

class OrgChartView {
  private readonly organisationButton: HTMLButtonElement;
  private readonly chartButton: HTMLButtonElement;
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;

  private data: OrganisationData | null = null;
  private operatingUnits: OperatingUnitsData = { schemaVersion: 1, units: [] };
  private viewMode: OrgChartMode = 'hierarchy';
  private colourByDepartment = false;
  private showVacancies = false;
  private scopeUnitId = '';

  constructor(organisationButton: HTMLButtonElement) {
    this.organisationButton = organisationButton;

    this.chartButton = document.createElement('button');
    this.chartButton.id = 'org-chart-button';
    this.chartButton.className = 'toolbar-button';
    this.chartButton.type = 'button';
    this.chartButton.textContent = 'Org Chart';

    this.organisationButton.insertAdjacentElement('afterend', this.chartButton);

    this.dialog = document.createElement('dialog');
    this.dialog.className = 'org-chart-dialog';
    this.dialog.innerHTML = '<div id="org-chart-view-root"></div>';
    document.body.appendChild(this.dialog);

    const root = this.dialog.querySelector<HTMLDivElement>('#org-chart-view-root');
    if (!root) {
      throw new Error('Unable to initialise org chart root.');
    }

    this.root = root;
    this.chartButton.addEventListener('click', () => void this.open());
  }

  private async open(): Promise<void> {
    [this.data, this.operatingUnits] = await Promise.all([
      loadOrganisation(true),
      loadOperatingUnits(true),
    ]);

    this.ensureScopeExists();
    this.render();

    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }

  private ensureScopeExists(): void {
    if (!this.scopeUnitId || this.scopeUnitId === UNASSIGNED_SCOPE) {
      return;
    }

    if (!this.operatingUnits.units.some((unit) => unit.id === this.scopeUnitId && unit.active)) {
      this.scopeUnitId = '';
    }
  }

  private render(): void {
    const data = this.data;
    if (!data) {
      return;
    }

    const hasPositions = data.positions.some((position) => position.active);
    const scopeLabel = this.getScopeLabel();

    this.root.innerHTML = `
      <div class="org-chart-view">
        <header class="org-chart-header">
          <div>
            <div class="org-chart-title">Organisation Chart</div>
            <div class="org-chart-subtitle">
              ${hasPositions
                ? `Establishment hierarchy: Role → Position → Person · Scope: ${escapeHtml(scopeLabel)}`
                : 'Legacy people hierarchy — add Positions to activate establishment-based operating-unit views'}
            </div>
          </div>

          <div class="org-chart-header-actions">
            <button id="org-chart-refresh" class="toolbar-button" type="button">Refresh</button>
            <button id="org-chart-close" class="metadata-close-button" type="button" title="Close org chart">×</button>
          </div>
        </header>

        <div class="org-chart-controls">
          <div class="org-chart-view-toggle" role="group" aria-label="Org chart view">
            <button
              class="org-chart-control-button${this.viewMode === 'hierarchy' ? ' org-chart-control-button-active' : ''}"
              type="button"
              data-org-chart-mode="hierarchy"
            >
              Hierarchy View
            </button>
            <button
              class="org-chart-control-button${this.viewMode === 'department' ? ' org-chart-control-button-active' : ''}"
              type="button"
              data-org-chart-mode="department"
            >
              Department View
            </button>
          </div>

          ${hasPositions ? `
            <label class="org-chart-scope-control">
              <span>Scope</span>
              <select id="org-chart-scope">
                ${this.renderScopeOptions()}
              </select>
            </label>
          ` : ''}

          <label class="org-chart-option">
            <input id="org-chart-colour-departments" type="checkbox"${this.colourByDepartment ? ' checked' : ''} />
            <span>Colour cards by department</span>
          </label>

          <label class="org-chart-option">
            <input id="org-chart-show-vacancies" type="checkbox"${this.showVacancies ? ' checked' : ''} />
            <span>${hasPositions ? 'Show vacant positions' : 'Show vacant roles'}</span>
          </label>

          ${this.showVacancies
            ? `<span class="org-chart-control-note">${hasPositions
                ? 'Vacant = active Position with no active Person assigned.'
                : 'Legacy mode: vacant = Role with no active Person assigned.'}</span>`
            : ''}
        </div>

        <div class="org-chart-help">
          ${this.renderHelp(hasPositions)}
          Click an occupied card to edit the Person; click a vacancy to edit the Position/Role.
        </div>

        <div class="org-chart-scroll">
          ${hasPositions
            ? (this.viewMode === 'hierarchy'
                ? this.renderPositionHierarchyView(data)
                : this.renderPositionDepartmentView(data))
            : (this.viewMode === 'hierarchy'
                ? this.renderLegacyHierarchyView(data)
                : this.renderLegacyDepartmentView(data))}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderHelp(hasPositions: boolean): string {
    if (!hasPositions) {
      return this.viewMode === 'hierarchy'
        ? "Legacy reporting lines are derived from each person's Manager field."
        : 'Legacy people and unfilled roles are grouped by Department.';
    }

    if (this.scopeUnitId) {
      if (this.viewMode === 'hierarchy') {
        return `Showing the ${escapeHtml(this.getScopeLabel())} hierarchy. Positions whose manager sits outside this scope are treated as local roots and retain an external-reporting note.`;
      }

      return `Showing positions in ${escapeHtml(this.getScopeLabel())}, grouped by Department.`;
    }

    return this.viewMode === 'hierarchy'
      ? 'Whole-organisation reporting lines are derived from Position → Reports to Position. Office / Site and Business Unit boundaries do not prevent cross-unit reporting.'
      : 'Whole-organisation Positions are grouped by Department; operating-unit membership is shown on each card.';
  }

  private renderScopeOptions(): string {
    const activeUnits = sortedByName(this.operatingUnits.units.filter((unit) => unit.active));
    const businessUnits = activeUnits.filter((unit) => unit.type === 'business-unit');
    const officeSites = activeUnits.filter((unit) => unit.type === 'office-site');

    const option = (value: string, label: string): string =>
      `<option value="${escapeHtml(value)}"${value === this.scopeUnitId ? ' selected' : ''}>${escapeHtml(label)}</option>`;

    return `
      ${option('', 'Whole Organisation')}
      ${option(UNASSIGNED_SCOPE, 'Unassigned Positions')}
      ${businessUnits.length > 0
        ? `<optgroup label="Business Units">${businessUnits.map((unit) => option(unit.id, unit.name)).join('')}</optgroup>`
        : ''}
      ${officeSites.length > 0
        ? `<optgroup label="Offices / Sites">${officeSites.map((unit) => option(unit.id, unit.name)).join('')}</optgroup>`
        : ''}
    `;
  }

  private bindEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#org-chart-close')?.addEventListener('click', () => this.dialog.close());
    this.root.querySelector<HTMLButtonElement>('#org-chart-refresh')?.addEventListener('click', () => void this.refresh());

    this.root.querySelectorAll<HTMLButtonElement>('[data-org-chart-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        const mode = button.dataset.orgChartMode;
        if (mode !== 'hierarchy' && mode !== 'department') {
          return;
        }

        this.viewMode = mode;
        this.render();
      });
    });

    this.root.querySelector<HTMLSelectElement>('#org-chart-scope')?.addEventListener('change', (event) => {
      this.scopeUnitId = (event.currentTarget as HTMLSelectElement).value;
      this.render();
    });

    this.root.querySelector<HTMLInputElement>('#org-chart-colour-departments')?.addEventListener('change', (event) => {
      this.colourByDepartment = (event.currentTarget as HTMLInputElement).checked;
      this.render();
    });

    this.root.querySelector<HTMLInputElement>('#org-chart-show-vacancies')?.addEventListener('change', (event) => {
      this.showVacancies = (event.currentTarget as HTMLInputElement).checked;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-org-person], [data-org-role], [data-org-position]').forEach((button) => {
      button.addEventListener('click', () => {
        this.dialog.close();
        this.organisationButton.click();
      });
    });
  }

  private async refresh(): Promise<void> {
    [this.data, this.operatingUnits] = await Promise.all([
      loadOrganisation(true),
      loadOperatingUnits(true),
    ]);
    this.ensureScopeExists();
    this.render();
  }

  private getScopeLabel(): string {
    if (!this.scopeUnitId) {
      return 'Whole Organisation';
    }

    if (this.scopeUnitId === UNASSIGNED_SCOPE) {
      return 'Unassigned Positions';
    }

    const unit: OperatingUnit | undefined = this.operatingUnits.units.find(
      (candidate) => candidate.id === this.scopeUnitId,
    );

    return unit?.name ?? 'Whole Organisation';
  }

  private getScopedPositions(data: OrganisationData): Position[] {
    const activePositions = data.positions.filter((position) => position.active);

    if (!this.scopeUnitId) {
      return activePositions;
    }

    const assignedIds = new Set(
      this.operatingUnits.units.flatMap((unit) => unit.positionIds),
    );

    if (this.scopeUnitId === UNASSIGNED_SCOPE) {
      return activePositions.filter((position) => !assignedIds.has(position.id));
    }

    const unit: OperatingUnit | undefined = this.operatingUnits.units.find(
      (candidate) => candidate.id === this.scopeUnitId,
    );
    if (!unit) {
      return activePositions;
    }

    const positionIds = new Set(unit.positionIds);
    return activePositions.filter((position) => positionIds.has(position.id));
  }

  private renderPositionHierarchyView(data: OrganisationData): string {
    const scopedPositions = this.getScopedPositions(data);
    const roots = this.buildPositionRoots(scopedPositions);

    if (roots.length === 0) {
      return `<div class="org-chart-empty">No active positions are available in ${escapeHtml(this.getScopeLabel())}.</div>`;
    }

    const scopedPositionIds = new Set(scopedPositions.map((position) => position.id));
    const visibleRoots = roots
      .map((node) => this.renderPositionNode(node, scopedPositionIds, new Set<string>()))
      .filter(Boolean)
      .join('');

    if (!visibleRoots) {
      return '<div class="org-chart-empty">No occupied positions are available. Enable Show vacant positions to display the establishment.</div>';
    }

    return `<div class="org-chart-roots">${visibleRoots}</div>`;
  }

  private renderPositionDepartmentView(data: OrganisationData): string {
    const scopedPositions = this.getScopedPositions(data);
    const knownDepartmentIds = new Set(data.departments.map((department) => department.id));
    const sections: string[] = [];

    sortedByName(data.departments).forEach((department) => {
      const positions = sortedByName(scopedPositions.filter((position) => position.departmentId === department.id));
      const visible = positions.filter((position) => this.showVacancies || getPositionOccupants(data, position.id).length > 0);
      if (visible.length === 0) {
        return;
      }

      sections.push(this.renderPositionDepartmentSection(department.id, department.name, visible));
    });

    const unassigned = sortedByName(scopedPositions.filter(
      (position) => !position.departmentId || !knownDepartmentIds.has(position.departmentId),
    )).filter((position) => this.showVacancies || getPositionOccupants(data, position.id).length > 0);

    if (unassigned.length > 0) {
      sections.push(this.renderPositionDepartmentSection('', 'Unassigned Department', unassigned));
    }

    if (!this.scopeUnitId) {
      const unpositionedPeople = sortedByName(data.people.filter((person) => person.active && !person.positionId));
      if (unpositionedPeople.length > 0) {
        sections.push(`
          <section class="org-chart-department-section">
            <header class="org-chart-department-header org-chart-department-colour-unassigned">
              <div>
                <div class="org-chart-department-name">Unpositioned people</div>
                <div class="org-chart-department-summary">${unpositionedPeople.length} active person${unpositionedPeople.length === 1 ? '' : 's'} still using legacy organisation fields</div>
              </div>
            </header>
            <div class="org-chart-department-grid">
              ${unpositionedPeople.map((person) => this.renderLegacyDepartmentPersonCard(person)).join('')}
            </div>
          </section>
        `);
      }
    }

    return sections.length > 0
      ? `<div class="org-chart-department-view">${sections.join('')}</div>`
      : `<div class="org-chart-empty">No occupied positions are available in ${escapeHtml(this.getScopeLabel())}. Enable Show vacant positions to display vacant establishment slots.</div>`;
  }

  private renderPositionDepartmentSection(
    departmentId: string,
    departmentName: string,
    positions: Position[],
  ): string {
    const data = this.data;
    if (!data) {
      return '';
    }

    const vacancyCount = positions.filter((position) => getPositionOccupants(data, position.id).length === 0).length;
    const colourClass = this.getDepartmentColourClass(departmentId);

    return `
      <section class="org-chart-department-section">
        <header class="org-chart-department-header${this.colourByDepartment ? ` ${colourClass}` : ''}">
          <div>
            <div class="org-chart-department-name">${escapeHtml(departmentName)}</div>
            <div class="org-chart-department-summary">
              ${positions.length} position${positions.length === 1 ? '' : 's'}${this.showVacancies ? ` · ${vacancyCount} vacant` : ''}
            </div>
          </div>
        </header>

        <div class="org-chart-department-grid">
          ${positions.map((position) => this.renderPositionCard(position, false)).join('')}
        </div>
      </section>
    `;
  }

  private buildPositionRoots(activePositions: Position[]): PositionNode[] {
    const positionsById = new Map(activePositions.map((position) => [position.id, position]));
    const childrenByManagerId = new Map<string, Position[]>();
    const roots: Position[] = [];

    activePositions.forEach((position) => {
      const managerId = position.managerPositionId;
      if (managerId && managerId !== position.id && positionsById.has(managerId)) {
        const children = childrenByManagerId.get(managerId) ?? [];
        children.push(position);
        childrenByManagerId.set(managerId, children);
      } else {
        roots.push(position);
      }
    });

    const createNode = (position: Position, path: Set<string>): PositionNode => {
      if (path.has(position.id)) {
        return { position, children: [] };
      }

      const nextPath = new Set(path);
      nextPath.add(position.id);

      return {
        position,
        children: sortedByName(childrenByManagerId.get(position.id) ?? [])
          .map((child) => createNode(child, nextPath)),
      };
    };

    if (roots.length === 0 && activePositions.length > 0) {
      return sortedByName(activePositions).map((position) => createNode(position, new Set<string>()));
    }

    return sortedByName(roots).map((position) => createNode(position, new Set<string>()));
  }

  private renderPositionNode(
    node: PositionNode,
    scopedPositionIds: Set<string>,
    seen: Set<string>,
  ): string {
    if (seen.has(node.position.id)) {
      return `
        <div class="org-chart-node">
          <div class="org-chart-cycle">Circular position reference: ${escapeHtml(node.position.name)}</div>
        </div>
      `;
    }

    const data = this.data;
    if (!data) {
      return '';
    }

    const occupants = getPositionOccupants(data, node.position.id);
    const isVacant = occupants.length === 0;
    const nextSeen = new Set(seen);
    nextSeen.add(node.position.id);
    const renderedChildren = node.children
      .map((child) => this.renderPositionNode(child, scopedPositionIds, nextSeen))
      .filter(Boolean)
      .join('');

    if (isVacant && !this.showVacancies) {
      return renderedChildren;
    }

    return `
      <div class="org-chart-node">
        ${this.renderPositionCard(node.position, true, scopedPositionIds)}
        ${renderedChildren ? `<div class="org-chart-children">${renderedChildren}</div>` : ''}
      </div>
    `;
  }

  private renderPositionCard(
    position: Position,
    showDirectReports: boolean,
    scopedPositionIds?: Set<string>,
  ): string {
    const data = this.data;
    if (!data) {
      return '';
    }

    const occupants = getPositionOccupants(data, position.id);
    const occupant = occupants[0];
    const isVacant = occupants.length === 0;
    const role = getRoleName(data, position.roleId);
    const department = getDepartmentName(data, position.departmentId);
    const colourClass = this.getDepartmentColourClass(position.departmentId);
    const unit = getUnitForPosition(this.operatingUnits, position.id);

    const directReports = data.positions.filter((candidate) =>
      candidate.active
      && candidate.managerPositionId === position.id
      && (!scopedPositionIds || scopedPositionIds.has(candidate.id)),
    ).length;

    const externalManager = this.scopeUnitId && position.managerPositionId && scopedPositionIds
      && !scopedPositionIds.has(position.managerPositionId)
      ? data.positions.find((candidate) => candidate.id === position.managerPositionId)
      : undefined;

    return `
      <button
        class="org-chart-card${isVacant ? ' org-chart-vacancy-card' : ''}${this.colourByDepartment ? ` ${colourClass}` : ''}"
        type="button"
        ${occupant ? `data-org-person="${escapeHtml(occupant.id)}"` : `data-org-position="${escapeHtml(position.id)}"`}
      >
        ${isVacant ? '<div class="org-chart-vacancy-label">VACANT POSITION</div>' : ''}
        ${unit ? `<div class="org-chart-unit-badge org-chart-unit-${unit.type}">${escapeHtml(unit.name)}</div>` : '<div class="org-chart-unit-badge org-chart-unit-unassigned">No operating unit</div>'}
        <div class="org-chart-person-name">${escapeHtml(occupant?.name ?? position.name)}</div>
        ${occupant ? `<div class="org-chart-person-meta">${escapeHtml(position.name)}</div>` : ''}
        <div class="org-chart-person-meta">${escapeHtml([role, department].filter(Boolean).join(' · ') || 'No role / department')}</div>
        ${occupant?.email ? `<div class="org-chart-person-meta">${escapeHtml(occupant.email)}</div>` : ''}
        ${externalManager ? `<div class="org-chart-external-report">Reports outside scope to: ${escapeHtml(externalManager.name)}</div>` : ''}
        ${occupants.length > 1 ? `<div class="org-chart-warning">${occupants.length} active occupants assigned — review Position data</div>` : ''}
        ${showDirectReports ? `<div class="org-chart-card-footer">${directReports} reporting position${directReports === 1 ? '' : 's'} in scope</div>` : ''}
      </button>
    `;
  }

  private renderLegacyHierarchyView(data: OrganisationData): string {
    const roots = this.buildLegacyRoots(data);
    const vacancies = this.showVacancies ? this.getLegacyVacantRoles(data) : [];

    if (roots.length === 0 && vacancies.length === 0) {
      return '<div class="org-chart-empty">No active people or vacant roles are available to display.</div>';
    }

    return `
      ${roots.length > 0
        ? `<div class="org-chart-roots">${roots.map((node) => this.renderLegacyNode(node, new Set<string>())).join('')}</div>`
        : '<div class="org-chart-empty">No active people are available to display.</div>'}

      ${vacancies.length > 0
        ? `
          <section class="org-chart-vacancy-section">
            <div class="org-chart-section-title">Legacy vacant roles</div>
            <div class="org-chart-vacancy-grid">
              ${vacancies.map((role) => this.renderLegacyVacantRoleCard(role)).join('')}
            </div>
          </section>
        `
        : ''}
    `;
  }

  private renderLegacyDepartmentView(data: OrganisationData): string {
    const activePeople = data.people.filter((person) => person.active);
    const vacancies = this.showVacancies ? this.getLegacyVacantRoles(data) : [];
    const knownDepartmentIds = new Set(data.departments.map((department) => department.id));
    const sections: string[] = [];

    sortedByName(data.departments).forEach((department) => {
      const people = sortedByName(activePeople.filter(
        (person) => getPersonDepartmentId(data, person) === department.id,
      ));
      const departmentVacancies = vacancies.filter((role) => role.departmentId === department.id);

      if (people.length === 0 && departmentVacancies.length === 0) {
        return;
      }

      sections.push(this.renderLegacyDepartmentSection(
        department.id,
        department.name,
        people,
        departmentVacancies,
      ));
    });

    const unassignedPeople = sortedByName(activePeople.filter((person) => {
      const departmentId = getPersonDepartmentId(data, person);
      return !departmentId || !knownDepartmentIds.has(departmentId);
    }));
    const unassignedVacancies = vacancies.filter(
      (role) => !role.departmentId || !knownDepartmentIds.has(role.departmentId),
    );

    if (unassignedPeople.length > 0 || unassignedVacancies.length > 0) {
      sections.push(this.renderLegacyDepartmentSection(
        '',
        'Unassigned',
        unassignedPeople,
        unassignedVacancies,
      ));
    }

    if (sections.length === 0) {
      return '<div class="org-chart-empty">No active people or vacant roles are available to display by department.</div>';
    }

    return `<div class="org-chart-department-view">${sections.join('')}</div>`;
  }

  private renderLegacyDepartmentSection(
    departmentId: string,
    departmentName: string,
    people: Person[],
    vacancies: Role[],
  ): string {
    const colourClass = this.getDepartmentColourClass(departmentId);

    return `
      <section class="org-chart-department-section">
        <header class="org-chart-department-header${this.colourByDepartment ? ` ${colourClass}` : ''}">
          <div>
            <div class="org-chart-department-name">${escapeHtml(departmentName)}</div>
            <div class="org-chart-department-summary">
              ${people.length} active person${people.length === 1 ? '' : 's'}${this.showVacancies ? ` · ${vacancies.length} vacant role${vacancies.length === 1 ? '' : 's'}` : ''}
            </div>
          </div>
        </header>

        <div class="org-chart-department-grid">
          ${people.map((person) => this.renderLegacyDepartmentPersonCard(person)).join('')}
          ${vacancies.map((role) => this.renderLegacyVacantRoleCard(role)).join('')}
        </div>
      </section>
    `;
  }

  private renderLegacyDepartmentPersonCard(person: Person): string {
    const data = this.data;
    if (!data) {
      return '';
    }

    const role = getRoleName(data, getPersonRoleId(data, person));
    const departmentId = getPersonDepartmentId(data, person);
    const department = getDepartmentName(data, departmentId);
    const manager = person.managerPersonId
      ? data.people.find((candidate) => candidate.id === person.managerPersonId)?.name ?? ''
      : '';
    const colourClass = this.getDepartmentColourClass(departmentId);

    return `
      <button
        class="org-chart-card org-chart-department-person-card${this.colourByDepartment ? ` ${colourClass}` : ''}"
        type="button"
        data-org-person="${escapeHtml(person.id)}"
      >
        <div class="org-chart-person-name">${escapeHtml(person.name)}</div>
        <div class="org-chart-person-meta">${escapeHtml(role || 'No role assigned')}</div>
        ${department ? `<div class="org-chart-person-meta">${escapeHtml(department)}</div>` : ''}
        ${manager ? `<div class="org-chart-person-meta">Reports to: ${escapeHtml(manager)}</div>` : ''}
        ${person.email ? `<div class="org-chart-person-meta">${escapeHtml(person.email)}</div>` : ''}
      </button>
    `;
  }

  private buildLegacyRoots(data: OrganisationData): PersonNode[] {
    const activePeople = data.people.filter((person) => person.active);
    const peopleById = new Map(activePeople.map((person) => [person.id, person]));
    const childrenByManagerId = new Map<string, Person[]>();
    const roots: Person[] = [];

    activePeople.forEach((person) => {
      const managerId = person.managerPersonId;

      if (managerId && managerId !== person.id && peopleById.has(managerId)) {
        const children = childrenByManagerId.get(managerId) ?? [];
        children.push(person);
        childrenByManagerId.set(managerId, children);
      } else {
        roots.push(person);
      }
    });

    const createNode = (person: Person, path: Set<string>): PersonNode => {
      if (path.has(person.id)) {
        return { person, children: [] };
      }

      const nextPath = new Set(path);
      nextPath.add(person.id);

      return {
        person,
        children: sortedByName(childrenByManagerId.get(person.id) ?? [])
          .map((child) => createNode(child, nextPath)),
      };
    };

    if (roots.length === 0 && activePeople.length > 0) {
      return sortedByName(activePeople).map((person) => createNode(person, new Set<string>()));
    }

    return sortedByName(roots).map((person) => createNode(person, new Set<string>()));
  }

  private getLegacyVacantRoles(data: OrganisationData): Role[] {
    const activeRoleIds = new Set(
      data.people
        .filter((person) => person.active && getPersonRoleId(data, person))
        .map((person) => getPersonRoleId(data, person) as string),
    );

    return sortedByName(data.roles.filter((role) => !activeRoleIds.has(role.id)));
  }

  private renderLegacyNode(node: PersonNode, seen: Set<string>): string {
    const data = this.data;
    if (!data) {
      return '';
    }

    if (seen.has(node.person.id)) {
      return `
        <div class="org-chart-node">
          <div class="org-chart-cycle">Circular manager reference: ${escapeHtml(node.person.name)}</div>
        </div>
      `;
    }

    const nextSeen = new Set(seen);
    nextSeen.add(node.person.id);

    const role = getRoleName(data, getPersonRoleId(data, node.person));
    const departmentId = getPersonDepartmentId(data, node.person);
    const department = getDepartmentName(data, departmentId);
    const directReports = node.children.length;
    const colourClass = this.getDepartmentColourClass(departmentId);

    return `
      <div class="org-chart-node">
        <button
          class="org-chart-card${this.colourByDepartment ? ` ${colourClass}` : ''}"
          type="button"
          data-org-person="${escapeHtml(node.person.id)}"
        >
          <div class="org-chart-person-name">${escapeHtml(node.person.name)}</div>
          <div class="org-chart-person-meta">${escapeHtml([role, department].filter(Boolean).join(' · ') || 'No role / department')}</div>
          ${node.person.email ? `<div class="org-chart-person-meta">${escapeHtml(node.person.email)}</div>` : ''}
          <div class="org-chart-card-footer">${directReports} direct report${directReports === 1 ? '' : 's'}</div>
        </button>

        ${node.children.length > 0
          ? `<div class="org-chart-children">${node.children.map((child) => this.renderLegacyNode(child, nextSeen)).join('')}</div>`
          : ''}
      </div>
    `;
  }

  private renderLegacyVacantRoleCard(role: Role): string {
    const data = this.data;
    if (!data) {
      return '';
    }

    const department = getDepartmentName(data, role.departmentId);
    const colourClass = this.getDepartmentColourClass(role.departmentId);

    return `
      <button
        class="org-chart-card org-chart-vacancy-card${this.colourByDepartment ? ` ${colourClass}` : ''}"
        type="button"
        data-org-role="${escapeHtml(role.id)}"
      >
        <div class="org-chart-vacancy-label">LEGACY VACANT ROLE</div>
        <div class="org-chart-person-name">${escapeHtml(role.name)}</div>
        <div class="org-chart-person-meta">${escapeHtml(department || 'No department')}</div>
      </button>
    `;
  }

  private getDepartmentColourClass(departmentId?: string): string {
    const data = this.data;
    if (!data || !departmentId) {
      return 'org-chart-department-colour-unassigned';
    }

    const departments = sortedByName(data.departments);
    const index = departments.findIndex((department) => department.id === departmentId);

    if (index < 0) {
      return 'org-chart-department-colour-unassigned';
    }

    return `org-chart-department-colour-${index % 8}`;
  }
}

function initialiseOrgChartView(): void {
  const organisationButton = document.querySelector<HTMLButtonElement>('#organisation-button');

  if (!organisationButton) {
    console.warn('Organisation button was not found; org chart view was not initialised.');
    return;
  }

  new OrgChartView(organisationButton);
}

initialiseOrgChartView();
