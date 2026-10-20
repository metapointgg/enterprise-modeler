import {
  generateOrganisationId,
  getDepartmentName,
  getPersonDepartmentId,
  getPersonRoleId,
  getPosition,
  getPositionName,
  getPositionOccupants,
  getRoleName,
  type Department,
  type OrganisationData,
  type Person,
  type Position,
  type Role,
  type Team,
} from './organisation';

type OrganisationTab = 'people' | 'positions' | 'departments' | 'roles' | 'teams';

interface OrganisationManagerOptions {
  onChange: (data: OrganisationData) => void;
  onExport: (data: OrganisationData) => void;
  onReset: () => Promise<OrganisationData>;
  onClose: () => void;
}

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

export class OrganisationManager {
  private readonly root: HTMLElement;
  private readonly options: OrganisationManagerOptions;
  private data: OrganisationData;
  private activeTab: OrganisationTab = 'people';
  private selectedPersonId: string | null = null;
  private selectedPositionId: string | null = null;
  private selectedDepartmentId: string | null = null;
  private selectedRoleId: string | null = null;
  private selectedTeamId: string | null = null;

  constructor(
    root: HTMLElement,
    data: OrganisationData,
    options: OrganisationManagerOptions,
  ) {
    this.root = root;
    this.data = structuredClone(data);
    this.options = options;
    this.render();
  }

  setData(data: OrganisationData): void {
    this.data = structuredClone(data);
    this.ensureSelectionsExist();
    this.render();
  }

  getData(): OrganisationData {
    return structuredClone(this.data);
  }

  private ensureSelectionsExist(): void {
    if (this.selectedPersonId && !this.data.people.some((item) => item.id === this.selectedPersonId)) {
      this.selectedPersonId = null;
    }
    if (this.selectedPositionId && !this.data.positions.some((item) => item.id === this.selectedPositionId)) {
      this.selectedPositionId = null;
    }
    if (this.selectedDepartmentId && !this.data.departments.some((item) => item.id === this.selectedDepartmentId)) {
      this.selectedDepartmentId = null;
    }
    if (this.selectedRoleId && !this.data.roles.some((item) => item.id === this.selectedRoleId)) {
      this.selectedRoleId = null;
    }
    if (this.selectedTeamId && !this.data.teams.some((item) => item.id === this.selectedTeamId)) {
      this.selectedTeamId = null;
    }
  }

  private notifyChanged(): void {
    this.options.onChange(this.getData());
  }

  private render(): void {
    this.root.innerHTML = `
      <div class="organisation-manager">
        <div class="organisation-header">
          <div>
            <div class="organisation-title">Organisation</div>
            <div class="organisation-subtitle">Repository-backed people, positions, roles, teams and departments</div>
          </div>
          <div class="organisation-header-actions">
            <button id="organisation-export" class="toolbar-button" type="button">Export JSON</button>
            <button id="organisation-reset" class="toolbar-button" type="button">Reset</button>
            <button id="organisation-close" class="metadata-close-button" type="button" title="Close organisation manager">×</button>
          </div>
        </div>

        <div class="organisation-tabs">
          ${this.renderTabButton('people', 'People')}
          ${this.renderTabButton('positions', 'Positions')}
          ${this.renderTabButton('roles', 'Roles')}
          ${this.renderTabButton('departments', 'Departments')}
          ${this.renderTabButton('teams', 'Teams')}
        </div>

        <div class="organisation-content">
          ${this.renderActiveTab()}
        </div>

        <div class="organisation-footer-note">
          Position is the establishment/headcount layer between Role and Person. Changes are saved locally while editing. Export <strong>org-chart.json</strong> and commit it to publish the organisation model.
        </div>
      </div>
    `;

    this.bindCommonEvents();
    this.bindActiveTabEvents();
  }

  private renderTabButton(tab: OrganisationTab, label: string): string {
    const activeClass = this.activeTab === tab ? ' organisation-tab-active' : '';
    return `<button class="organisation-tab${activeClass}" type="button" data-tab="${tab}">${label}</button>`;
  }

  private renderActiveTab(): string {
    switch (this.activeTab) {
      case 'positions':
        return this.renderPositions();
      case 'departments':
        return this.renderDepartments();
      case 'roles':
        return this.renderRoles();
      case 'teams':
        return this.renderTeams();
      case 'people':
      default:
        return this.renderPeople();
    }
  }

  private renderPeople(): string {
    const people = sortedByName(this.data.people);
    const selected = this.selectedPersonId
      ? this.data.people.find((person) => person.id === this.selectedPersonId) ?? null
      : null;

    const list = people.length === 0
      ? '<div class="organisation-empty">No people have been added yet.</div>'
      : people.map((person) => {
          const position = getPositionName(this.data, person.positionId);
          const role = getRoleName(this.data, getPersonRoleId(this.data, person));
          const department = getDepartmentName(this.data, getPersonDepartmentId(this.data, person));
          const summary = [position, role, department].filter(Boolean).join(' · ') || person.email || 'No position assigned';
          return `
            <button class="organisation-list-item${person.id === this.selectedPersonId ? ' organisation-list-item-selected' : ''}" type="button" data-edit-person="${escapeHtml(person.id)}">
              <span class="organisation-list-primary">${escapeHtml(person.name)}</span>
              <span class="organisation-list-secondary">${escapeHtml(summary)}${person.active ? '' : ' · Inactive'}</span>
            </button>
          `;
        }).join('');

    return `
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>People</span>
            <button id="organisation-new-person" class="toolbar-button" type="button">New Person</button>
          </div>
          <div class="organisation-list">${list}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPersonForm(selected)}
        </div>
      </div>
    `;
  }

  private renderPersonForm(person: Person | null): string {
    const positionOptions = sortedByName(this.data.positions)
      .filter((position) => {
        if (position.id === person?.positionId) {
          return true;
        }
        return position.active && getPositionOccupants(this.data, position.id).length === 0;
      })
      .map((position) => {
        const role = getRoleName(this.data, position.roleId);
        const department = getDepartmentName(this.data, position.departmentId);
        const label = [position.name, role, department].filter(Boolean).join(' — ');
        return `<option value="${escapeHtml(position.id)}"${position.id === person?.positionId ? ' selected' : ''}>${escapeHtml(label)}</option>`;
      })
      .join('');

    const assignedPosition = person ? getPosition(this.data, person.positionId) : undefined;
    const assignedRole = assignedPosition ? getRoleName(this.data, assignedPosition.roleId) : '';
    const assignedDepartment = assignedPosition ? getDepartmentName(this.data, assignedPosition.departmentId) : '';
    const reportsToPosition = assignedPosition ? getPositionName(this.data, assignedPosition.managerPositionId) : '';

    const departmentOptions = sortedByName(this.data.departments)
      .map((department) => `<option value="${escapeHtml(department.id)}"${department.id === person?.departmentId ? ' selected' : ''}>${escapeHtml(department.name)}</option>`)
      .join('');

    const roleOptions = sortedByName(this.data.roles)
      .map((role) => `<option value="${escapeHtml(role.id)}"${role.id === person?.roleId ? ' selected' : ''}>${escapeHtml(role.name)}</option>`)
      .join('');

    const managerOptions = sortedByName(this.data.people.filter((candidate) => candidate.id !== person?.id))
      .map((candidate) => `<option value="${escapeHtml(candidate.id)}"${candidate.id === person?.managerPersonId ? ' selected' : ''}>${escapeHtml(candidate.name)}</option>`)
      .join('');

    const teamOptions = sortedByName(this.data.teams)
      .map((team) => `
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="teamIds" value="${escapeHtml(team.id)}"${person?.teamIds.includes(team.id) ? ' checked' : ''} />
          <span>${escapeHtml(team.name)}</span>
        </label>
      `)
      .join('');

    return `
      <form id="organisation-person-form" class="organisation-form">
        <div class="organisation-editor-heading">${person ? 'Edit person' : 'Add person'}</div>
        ${person ? `<div class="organisation-record-id">${escapeHtml(person.id)}</div>` : ''}

        <label class="metadata-field">
          <span>Name</span>
          <input id="organisation-person-name" type="text" required value="${escapeHtml(person?.name ?? '')}" />
        </label>

        <label class="metadata-field">
          <span>Email</span>
          <input id="organisation-person-email" type="email" value="${escapeHtml(person?.email ?? '')}" />
        </label>

        <label class="metadata-field">
          <span>Position</span>
          <select id="organisation-person-position">
            <option value="">Not set</option>
            ${positionOptions}
          </select>
        </label>

        ${assignedPosition ? `
          <div class="metadata-help">
            <strong>${escapeHtml(assignedPosition.name)}</strong><br />
            Role: ${escapeHtml(assignedRole || 'Not set')}<br />
            Department: ${escapeHtml(assignedDepartment || 'Not set')}<br />
            Reports to position: ${escapeHtml(reportsToPosition || 'Not set')}
          </div>
        ` : `
          <fieldset class="organisation-fieldset">
            <legend>Legacy structure fallback</legend>
            <div class="organisation-muted" style="margin-bottom:8px">Used only while this person has no Position assigned.</div>

            <label class="metadata-field">
              <span>Department</span>
              <select id="organisation-person-department">
                <option value="">Not set</option>
                ${departmentOptions}
              </select>
            </label>

            <label class="metadata-field">
              <span>Role</span>
              <select id="organisation-person-role">
                <option value="">Not set</option>
                ${roleOptions}
              </select>
            </label>

            <label class="metadata-field">
              <span>Manager</span>
              <select id="organisation-person-manager">
                <option value="">Not set</option>
                ${managerOptions}
              </select>
            </label>

            <fieldset class="organisation-fieldset">
              <legend>Teams</legend>
              <div class="organisation-checkbox-list">
                ${teamOptions || '<span class="organisation-muted">No teams defined.</span>'}
              </div>
            </fieldset>
          </fieldset>
        `}

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="organisation-person-active" type="checkbox"${person?.active !== false ? ' checked' : ''} />
          <span>Active</span>
        </label>

        <label class="metadata-field">
          <span>Notes</span>
          <textarea id="organisation-person-notes" rows="3">${escapeHtml(person?.notes ?? '')}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${person ? 'Save Person' : 'Add Person'}</button>
          ${person ? '<button id="organisation-delete-person" class="toolbar-button toolbar-button-danger" type="button">Delete</button>' : ''}
        </div>
      </form>
    `;
  }

  private renderPositions(): string {
    const positions = sortedByName(this.data.positions);
    const selected = this.selectedPositionId
      ? this.data.positions.find((position) => position.id === this.selectedPositionId) ?? null
      : null;

    const list = positions.length === 0
      ? '<div class="organisation-empty">No positions have been added yet.</div>'
      : positions.map((position) => {
          const role = getRoleName(this.data, position.roleId);
          const department = getDepartmentName(this.data, position.departmentId);
          const occupants = getPositionOccupants(this.data, position.id);
          const occupancy = occupants.length === 0
            ? 'Vacant'
            : occupants.map((person) => person.name).join(', ');

          return `
            <button class="organisation-list-item${position.id === this.selectedPositionId ? ' organisation-list-item-selected' : ''}" type="button" data-edit-position="${escapeHtml(position.id)}">
              <span class="organisation-list-primary">${escapeHtml(position.name)}</span>
              <span class="organisation-list-secondary">${escapeHtml([role, department, occupancy].filter(Boolean).join(' · '))}${position.active ? '' : ' · Inactive'}</span>
            </button>
          `;
        }).join('');

    return `
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>Positions</span>
            <button id="organisation-new-position" class="toolbar-button" type="button">New Position</button>
          </div>
          <div class="organisation-list">${list}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPositionForm(selected)}
        </div>
      </div>
    `;
  }

  private renderPositionForm(position: Position | null): string {
    const roleOptions = sortedByName(this.data.roles)
      .map((role) => `<option value="${escapeHtml(role.id)}"${role.id === position?.roleId ? ' selected' : ''}>${escapeHtml(role.name)}</option>`)
      .join('');

    const departmentOptions = this.renderDepartmentOptions(position?.departmentId);

    const managerOptions = sortedByName(this.data.positions.filter((candidate) => candidate.id !== position?.id))
      .map((candidate) => {
        const role = getRoleName(this.data, candidate.roleId);
        const label = role ? `${candidate.name} — ${role}` : candidate.name;
        return `<option value="${escapeHtml(candidate.id)}"${candidate.id === position?.managerPositionId ? ' selected' : ''}>${escapeHtml(label)}</option>`;
      })
      .join('');

    const teamOptions = sortedByName(this.data.teams)
      .map((team) => `
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="positionTeamIds" value="${escapeHtml(team.id)}"${position?.teamIds.includes(team.id) ? ' checked' : ''} />
          <span>${escapeHtml(team.name)}</span>
        </label>
      `)
      .join('');

    const occupants = position ? getPositionOccupants(this.data, position.id) : [];

    return `
      <form id="organisation-position-form" class="organisation-form">
        <div class="organisation-editor-heading">${position ? 'Edit position' : 'Add position'}</div>
        ${position ? `<div class="organisation-record-id">${escapeHtml(position.id)}</div>` : ''}

        <label class="metadata-field">
          <span>Position name</span>
          <input id="organisation-position-name" type="text" required value="${escapeHtml(position?.name ?? '')}" placeholder="e.g. Operations Analyst 01" />
        </label>

        <label class="metadata-field">
          <span>Role</span>
          <select id="organisation-position-role">
            <option value="">Not set</option>
            ${roleOptions}
          </select>
        </label>

        <label class="metadata-field">
          <span>Department</span>
          <select id="organisation-position-department">
            <option value="">Not set</option>
            ${departmentOptions}
          </select>
        </label>

        <label class="metadata-field">
          <span>Reports to position</span>
          <select id="organisation-position-manager">
            <option value="">Top level / not set</option>
            ${managerOptions}
          </select>
        </label>

        <fieldset class="organisation-fieldset">
          <legend>Teams</legend>
          <div class="organisation-checkbox-list">
            ${teamOptions || '<span class="organisation-muted">No teams defined.</span>'}
          </div>
        </fieldset>

        ${position ? `
          <div class="metadata-help">
            Current occupant: ${escapeHtml(occupants.length > 0 ? occupants.map((person) => person.name).join(', ') : 'VACANT')}
          </div>
        ` : ''}

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="organisation-position-active" type="checkbox"${position?.active !== false ? ' checked' : ''} />
          <span>Active establishment position</span>
        </label>

        <label class="metadata-field">
          <span>Notes</span>
          <textarea id="organisation-position-notes" rows="3">${escapeHtml(position?.notes ?? '')}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${position ? 'Save Position' : 'Add Position'}</button>
          ${position ? '<button id="organisation-delete-position" class="toolbar-button toolbar-button-danger" type="button">Delete</button>' : ''}
        </div>
      </form>
    `;
  }

  private renderDepartments(): string {
    return this.renderReferenceSection(
      'Department',
      'department',
      sortedByName(this.data.departments),
      this.selectedDepartmentId,
      this.renderDepartmentForm(),
    );
  }

  private renderDepartmentForm(): string {
    const department = this.selectedDepartmentId
      ? this.data.departments.find((item) => item.id === this.selectedDepartmentId) ?? null
      : null;

    const parentOptions = sortedByName(this.data.departments.filter((item) => item.id !== department?.id))
      .map((item) => `<option value="${escapeHtml(item.id)}"${item.id === department?.parentDepartmentId ? ' selected' : ''}>${escapeHtml(item.name)}</option>`)
      .join('');

    return `
      <form id="organisation-department-form" class="organisation-form">
        <div class="organisation-editor-heading">${department ? 'Edit department' : 'Add department'}</div>
        ${department ? `<div class="organisation-record-id">${escapeHtml(department.id)}</div>` : ''}
        <label class="metadata-field"><span>Name</span><input id="organisation-department-name" type="text" required value="${escapeHtml(department?.name ?? '')}" /></label>
        <label class="metadata-field">
          <span>Parent department</span>
          <select id="organisation-department-parent"><option value="">None</option>${parentOptions}</select>
        </label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${department ? 'Save Department' : 'Add Department'}</button>
          ${department ? '<button id="organisation-delete-department" class="toolbar-button toolbar-button-danger" type="button">Delete</button>' : ''}
        </div>
      </form>
    `;
  }

  private renderRoles(): string {
    return this.renderReferenceSection(
      'Role',
      'role',
      sortedByName(this.data.roles),
      this.selectedRoleId,
      this.renderRoleForm(),
    );
  }

  private renderRoleForm(): string {
    const role = this.selectedRoleId
      ? this.data.roles.find((item) => item.id === this.selectedRoleId) ?? null
      : null;
    const departmentOptions = this.renderDepartmentOptions(role?.departmentId);

    return `
      <form id="organisation-role-form" class="organisation-form">
        <div class="organisation-editor-heading">${role ? 'Edit role' : 'Add role'}</div>
        ${role ? `<div class="organisation-record-id">${escapeHtml(role.id)}</div>` : ''}
        <label class="metadata-field"><span>Name</span><input id="organisation-role-name" type="text" required value="${escapeHtml(role?.name ?? '')}" /></label>
        <label class="metadata-field"><span>Default department</span><select id="organisation-role-department"><option value="">Not set</option>${departmentOptions}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${role ? 'Save Role' : 'Add Role'}</button>
          ${role ? '<button id="organisation-delete-role" class="toolbar-button toolbar-button-danger" type="button">Delete</button>' : ''}
        </div>
      </form>
    `;
  }

  private renderTeams(): string {
    return this.renderReferenceSection(
      'Team',
      'team',
      sortedByName(this.data.teams),
      this.selectedTeamId,
      this.renderTeamForm(),
    );
  }

  private renderTeamForm(): string {
    const team = this.selectedTeamId
      ? this.data.teams.find((item) => item.id === this.selectedTeamId) ?? null
      : null;
    const departmentOptions = this.renderDepartmentOptions(team?.departmentId);

    return `
      <form id="organisation-team-form" class="organisation-form">
        <div class="organisation-editor-heading">${team ? 'Edit team' : 'Add team'}</div>
        ${team ? `<div class="organisation-record-id">${escapeHtml(team.id)}</div>` : ''}
        <label class="metadata-field"><span>Name</span><input id="organisation-team-name" type="text" required value="${escapeHtml(team?.name ?? '')}" /></label>
        <label class="metadata-field"><span>Department</span><select id="organisation-team-department"><option value="">Not set</option>${departmentOptions}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${team ? 'Save Team' : 'Add Team'}</button>
          ${team ? '<button id="organisation-delete-team" class="toolbar-button toolbar-button-danger" type="button">Delete</button>' : ''}
        </div>
      </form>
    `;
  }

  private renderDepartmentOptions(selectedId?: string): string {
    return sortedByName(this.data.departments)
      .map((department) => `<option value="${escapeHtml(department.id)}"${department.id === selectedId ? ' selected' : ''}>${escapeHtml(department.name)}</option>`)
      .join('');
  }

  private renderReferenceSection<T extends { id: string; name: string }>(
    label: string,
    type: 'department' | 'role' | 'team',
    items: T[],
    selectedId: string | null,
    editor: string,
  ): string {
    const list = items.length === 0
      ? `<div class="organisation-empty">No ${label.toLowerCase()}s have been added yet.</div>`
      : items.map((item) => `
          <button class="organisation-list-item${item.id === selectedId ? ' organisation-list-item-selected' : ''}" type="button" data-edit-${type}="${escapeHtml(item.id)}">
            <span class="organisation-list-primary">${escapeHtml(item.name)}</span>
          </button>
        `).join('');

    return `
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>${label}s</span>
            <button id="organisation-new-${type}" class="toolbar-button" type="button">New ${label}</button>
          </div>
          <div class="organisation-list">${list}</div>
        </div>
        <div class="organisation-editor-pane">${editor}</div>
      </div>
    `;
  }

  private bindCommonEvents(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab as OrganisationTab | undefined;
        if (tab) {
          this.activeTab = tab;
          this.render();
        }
      });
    });

    this.root.querySelector<HTMLButtonElement>('#organisation-close')?.addEventListener('click', this.options.onClose);
    this.root.querySelector<HTMLButtonElement>('#organisation-export')?.addEventListener('click', () => this.options.onExport(this.getData()));
    this.root.querySelector<HTMLButtonElement>('#organisation-reset')?.addEventListener('click', () => void this.resetFromRepository());
  }

  private bindActiveTabEvents(): void {
    if (this.activeTab === 'people') {
      this.bindPeopleEvents();
    } else if (this.activeTab === 'positions') {
      this.bindPositionEvents();
    } else if (this.activeTab === 'departments') {
      this.bindDepartmentEvents();
    } else if (this.activeTab === 'roles') {
      this.bindRoleEvents();
    } else {
      this.bindTeamEvents();
    }
  }

  private bindPeopleEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#organisation-new-person')?.addEventListener('click', () => {
      this.selectedPersonId = null;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-edit-person]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedPersonId = button.dataset.editPerson ?? null;
        this.render();
      });
    });

    this.root.querySelector<HTMLFormElement>('#organisation-person-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.savePerson();
    });

    this.root.querySelector<HTMLButtonElement>('#organisation-delete-person')?.addEventListener('click', () => this.deletePerson());
  }

  private bindPositionEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#organisation-new-position')?.addEventListener('click', () => {
      this.selectedPositionId = null;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-edit-position]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedPositionId = button.dataset.editPosition ?? null;
        this.render();
      });
    });

    this.root.querySelector<HTMLFormElement>('#organisation-position-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.savePosition();
    });

    this.root.querySelector<HTMLButtonElement>('#organisation-delete-position')?.addEventListener('click', () => this.deletePosition());
  }

  private bindDepartmentEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#organisation-new-department')?.addEventListener('click', () => {
      this.selectedDepartmentId = null;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-edit-department]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedDepartmentId = button.dataset.editDepartment ?? null;
        this.render();
      });
    });

    this.root.querySelector<HTMLFormElement>('#organisation-department-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveDepartment();
    });

    this.root.querySelector<HTMLButtonElement>('#organisation-delete-department')?.addEventListener('click', () => this.deleteDepartment());
  }

  private bindRoleEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#organisation-new-role')?.addEventListener('click', () => {
      this.selectedRoleId = null;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-edit-role]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedRoleId = button.dataset.editRole ?? null;
        this.render();
      });
    });

    this.root.querySelector<HTMLFormElement>('#organisation-role-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveRole();
    });

    this.root.querySelector<HTMLButtonElement>('#organisation-delete-role')?.addEventListener('click', () => this.deleteRole());
  }

  private bindTeamEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#organisation-new-team')?.addEventListener('click', () => {
      this.selectedTeamId = null;
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-edit-team]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedTeamId = button.dataset.editTeam ?? null;
        this.render();
      });
    });

    this.root.querySelector<HTMLFormElement>('#organisation-team-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveTeam();
    });

    this.root.querySelector<HTMLButtonElement>('#organisation-delete-team')?.addEventListener('click', () => this.deleteTeam());
  }

  private getInputValue(id: string): string {
    return this.root.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`#${id}`)?.value.trim() ?? '';
  }

  private savePerson(): void {
    const name = this.getInputValue('organisation-person-name');
    if (!name) {
      return;
    }

    const positionId = this.getInputValue('organisation-person-position') || undefined;
    const active = this.root.querySelector<HTMLInputElement>('#organisation-person-active')?.checked ?? true;
    const existing = this.selectedPersonId
      ? this.data.people.find((person) => person.id === this.selectedPersonId)
      : undefined;

    if (positionId && active) {
      const occupant = this.data.people.find(
        (person) => person.active && person.positionId === positionId && person.id !== existing?.id,
      );

      if (occupant) {
        window.alert(`That position is already occupied by ${occupant.name}.`);
        return;
      }
    }

    const hasPosition = Boolean(positionId);
    const teamIds = hasPosition
      ? []
      : Array.from(this.root.querySelectorAll<HTMLInputElement>('input[name="teamIds"]:checked'))
          .map((checkbox) => checkbox.value);

    const person: Person = {
      id: existing?.id ?? generateOrganisationId('person'),
      name,
      email: this.getInputValue('organisation-person-email'),
      positionId,
      departmentId: hasPosition ? undefined : (this.getInputValue('organisation-person-department') || undefined),
      roleId: hasPosition ? undefined : (this.getInputValue('organisation-person-role') || undefined),
      managerPersonId: hasPosition ? undefined : (this.getInputValue('organisation-person-manager') || undefined),
      teamIds,
      active,
      notes: this.getInputValue('organisation-person-notes'),
    };

    if (existing) {
      Object.assign(existing, person);
    } else {
      this.data.people.push(person);
    }

    this.selectedPersonId = person.id;
    this.notifyChanged();
    this.render();
  }

  private deletePerson(): void {
    if (!this.selectedPersonId) {
      return;
    }

    const person = this.data.people.find((item) => item.id === this.selectedPersonId);
    if (!person || !window.confirm(`Delete ${person.name}? Existing process metadata references to this person will become unresolved.`)) {
      return;
    }

    this.data.people = this.data.people.filter((item) => item.id !== person.id);
    this.data.people.forEach((item) => {
      if (item.managerPersonId === person.id) {
        item.managerPersonId = undefined;
      }
    });
    this.selectedPersonId = null;
    this.notifyChanged();
    this.render();
  }

  private savePosition(): void {
    const name = this.getInputValue('organisation-position-name');
    if (!name) {
      return;
    }

    const existing = this.selectedPositionId
      ? this.data.positions.find((position) => position.id === this.selectedPositionId)
      : undefined;

    const managerPositionId = this.getInputValue('organisation-position-manager') || undefined;
    const positionId = existing?.id ?? generateOrganisationId('position');

    if (managerPositionId && this.wouldCreatePositionCycle(positionId, managerPositionId)) {
      window.alert('That reporting relationship would create a circular Position hierarchy.');
      return;
    }

    const teamIds = Array.from(this.root.querySelectorAll<HTMLInputElement>('input[name="positionTeamIds"]:checked'))
      .map((checkbox) => checkbox.value);

    const active = this.root.querySelector<HTMLInputElement>('#organisation-position-active')?.checked ?? true;

    const position: Position = {
      id: positionId,
      name,
      roleId: this.getInputValue('organisation-position-role') || undefined,
      departmentId: this.getInputValue('organisation-position-department') || undefined,
      managerPositionId,
      teamIds,
      active,
      notes: this.getInputValue('organisation-position-notes'),
    };

    if (existing) {
      Object.assign(existing, position);
    } else {
      this.data.positions.push(position);
    }

    this.selectedPositionId = position.id;
    this.notifyChanged();
    this.render();
  }

  private wouldCreatePositionCycle(positionId: string, managerPositionId: string): boolean {
    let currentId: string | undefined = managerPositionId;
    const seen = new Set<string>();

    while (currentId) {
      if (currentId === positionId) {
        return true;
      }
      if (seen.has(currentId)) {
        return true;
      }
      seen.add(currentId);
      currentId = this.data.positions.find((position) => position.id === currentId)?.managerPositionId;
    }

    return false;
  }

  private deletePosition(): void {
    if (!this.selectedPositionId) {
      return;
    }

    const position = this.data.positions.find((item) => item.id === this.selectedPositionId);
    if (!position) {
      return;
    }

    const occupants = getPositionOccupants(this.data, position.id);
    const occupantText = occupants.length > 0
      ? ` ${occupants.map((person) => person.name).join(', ')} will become unassigned.`
      : '';

    if (!window.confirm(`Delete position ${position.name}?${occupantText} Child positions will become top-level/unassigned.`)) {
      return;
    }

    this.data.positions = this.data.positions.filter((item) => item.id !== position.id);
    this.data.positions.forEach((item) => {
      if (item.managerPositionId === position.id) {
        item.managerPositionId = undefined;
      }
    });
    this.data.people.forEach((person) => {
      if (person.positionId === position.id) {
        person.positionId = undefined;
      }
    });

    this.selectedPositionId = null;
    this.notifyChanged();
    this.render();
  }

  private saveDepartment(): void {
    const name = this.getInputValue('organisation-department-name');
    if (!name) {
      return;
    }

    const existing = this.selectedDepartmentId
      ? this.data.departments.find((item) => item.id === this.selectedDepartmentId)
      : undefined;

    const department: Department = {
      id: existing?.id ?? generateOrganisationId('department'),
      name,
      parentDepartmentId: this.getInputValue('organisation-department-parent') || undefined,
    };

    if (existing) {
      Object.assign(existing, department);
    } else {
      this.data.departments.push(department);
    }

    this.selectedDepartmentId = department.id;
    this.notifyChanged();
    this.render();
  }

  private deleteDepartment(): void {
    if (!this.selectedDepartmentId) {
      return;
    }

    const department = this.data.departments.find((item) => item.id === this.selectedDepartmentId);
    if (!department || !window.confirm(`Delete department ${department.name}? Department references will be cleared.`)) {
      return;
    }

    this.data.departments = this.data.departments.filter((item) => item.id !== department.id);
    this.data.departments.forEach((item) => {
      if (item.parentDepartmentId === department.id) {
        item.parentDepartmentId = undefined;
      }
    });
    this.data.roles.forEach((item) => {
      if (item.departmentId === department.id) {
        item.departmentId = undefined;
      }
    });
    this.data.teams.forEach((item) => {
      if (item.departmentId === department.id) {
        item.departmentId = undefined;
      }
    });
    this.data.positions.forEach((item) => {
      if (item.departmentId === department.id) {
        item.departmentId = undefined;
      }
    });
    this.data.people.forEach((item) => {
      if (item.departmentId === department.id) {
        item.departmentId = undefined;
      }
    });
    this.selectedDepartmentId = null;
    this.notifyChanged();
    this.render();
  }

  private saveRole(): void {
    const name = this.getInputValue('organisation-role-name');
    if (!name) {
      return;
    }

    const existing = this.selectedRoleId
      ? this.data.roles.find((item) => item.id === this.selectedRoleId)
      : undefined;

    const role: Role = {
      id: existing?.id ?? generateOrganisationId('role'),
      name,
      departmentId: this.getInputValue('organisation-role-department') || undefined,
    };

    if (existing) {
      Object.assign(existing, role);
    } else {
      this.data.roles.push(role);
    }

    this.selectedRoleId = role.id;
    this.notifyChanged();
    this.render();
  }

  private deleteRole(): void {
    if (!this.selectedRoleId) {
      return;
    }

    const role = this.data.roles.find((item) => item.id === this.selectedRoleId);
    if (!role || !window.confirm(`Delete role ${role.name}? Role references will be cleared from positions and legacy people records.`)) {
      return;
    }

    this.data.roles = this.data.roles.filter((item) => item.id !== role.id);
    this.data.positions.forEach((item) => {
      if (item.roleId === role.id) {
        item.roleId = undefined;
      }
    });
    this.data.people.forEach((item) => {
      if (item.roleId === role.id) {
        item.roleId = undefined;
      }
    });
    this.selectedRoleId = null;
    this.notifyChanged();
    this.render();
  }

  private saveTeam(): void {
    const name = this.getInputValue('organisation-team-name');
    if (!name) {
      return;
    }

    const existing = this.selectedTeamId
      ? this.data.teams.find((item) => item.id === this.selectedTeamId)
      : undefined;

    const team: Team = {
      id: existing?.id ?? generateOrganisationId('team'),
      name,
      departmentId: this.getInputValue('organisation-team-department') || undefined,
    };

    if (existing) {
      Object.assign(existing, team);
    } else {
      this.data.teams.push(team);
    }

    this.selectedTeamId = team.id;
    this.notifyChanged();
    this.render();
  }

  private deleteTeam(): void {
    if (!this.selectedTeamId) {
      return;
    }

    const team = this.data.teams.find((item) => item.id === this.selectedTeamId);
    if (!team || !window.confirm(`Delete team ${team.name}? Team references will be cleared.`)) {
      return;
    }

    this.data.teams = this.data.teams.filter((item) => item.id !== team.id);
    this.data.positions.forEach((item) => {
      item.teamIds = item.teamIds.filter((teamId) => teamId !== team.id);
    });
    this.data.people.forEach((item) => {
      item.teamIds = item.teamIds.filter((teamId) => teamId !== team.id);
    });
    this.selectedTeamId = null;
    this.notifyChanged();
    this.render();
  }

  private async resetFromRepository(): Promise<void> {
    if (!window.confirm('Reset the organisation model to the repository version? All locally saved organisation changes will be discarded.')) {
      return;
    }

    try {
      const data = await this.options.onReset();
      this.data = structuredClone(data);
      this.selectedPersonId = null;
      this.selectedPositionId = null;
      this.selectedDepartmentId = null;
      this.selectedRoleId = null;
      this.selectedTeamId = null;
      this.notifyChanged();
      this.render();
    } catch (error) {
      console.error('Unable to reset organisation data.', error);
      window.alert('Unable to reset the organisation model from the repository.');
    }
  }
}
