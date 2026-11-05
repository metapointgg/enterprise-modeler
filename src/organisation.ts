import { modelUrl } from './modelRepository';

export interface Department {
  id: string;
  name: string;
  parentDepartmentId?: string;
}

export interface Team {
  id: string;
  name: string;
  departmentId?: string;
}

export interface Role {
  id: string;
  name: string;
  departmentId?: string;
}

export interface Position {
  id: string;
  name: string;
  roleId?: string;
  departmentId?: string;
  managerPositionId?: string;
  teamIds: string[];
  active: boolean;
  notes: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  positionId?: string;

  /**
   * Legacy person-level organisation fields retained for backwards compatibility.
   * New organisation structures should assign a Position and keep role/department/
   * reporting/team structure on that Position.
   */
  departmentId?: string;
  roleId?: string;
  managerPersonId?: string;
  teamIds: string[];

  active: boolean;
  notes: string;
}

export interface OrganisationData {
  schemaVersion: number;
  departments: Department[];
  teams: Team[];
  roles: Role[];
  positions: Position[];
  people: Person[];
}

const ORGANISATION_URL = modelUrl('/organisation/org-chart.json');
const ORGANISATION_AUTOSAVE_KEY = 'enterprise-modeler.organisation.v2';
const LEGACY_ORGANISATION_AUTOSAVE_KEY = 'enterprise-modeler.organisation.v1';

export function createEmptyOrganisation(): OrganisationData {
  return {
    schemaVersion: 2,
    departments: [],
    teams: [],
    roles: [],
    positions: [],
    people: [],
  };
}

function normaliseOrganisation(value: Partial<OrganisationData>): OrganisationData {
  return {
    schemaVersion: 2,
    departments: Array.isArray(value.departments) ? value.departments : [],
    teams: Array.isArray(value.teams) ? value.teams : [],
    roles: Array.isArray(value.roles) ? value.roles : [],
    positions: Array.isArray(value.positions)
      ? value.positions.map((position) => ({
          ...position,
          teamIds: Array.isArray(position.teamIds) ? position.teamIds : [],
          active: position.active !== false,
          notes: position.notes || '',
        }))
      : [],
    people: Array.isArray(value.people)
      ? value.people.map((person) => ({
          ...person,
          teamIds: Array.isArray(person.teamIds) ? person.teamIds : [],
          active: person.active !== false,
          notes: person.notes || '',
        }))
      : [],
  };
}

export async function fetchRepositoryOrganisation(): Promise<OrganisationData> {
  const response = await fetch(ORGANISATION_URL, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Unable to load organisation data. HTTP ${response.status}.`);
  }

  const parsed = await response.json() as Partial<OrganisationData>;
  return normaliseOrganisation(parsed);
}

export async function loadOrganisation(preferAutosave = true): Promise<OrganisationData> {
  if (preferAutosave) {
    const autosaved = localStorage.getItem(ORGANISATION_AUTOSAVE_KEY)
      ?? localStorage.getItem(LEGACY_ORGANISATION_AUTOSAVE_KEY);

    if (autosaved) {
      try {
        return normaliseOrganisation(JSON.parse(autosaved) as Partial<OrganisationData>);
      } catch (error) {
        console.warn('Unable to parse locally saved organisation data; repository data will be used.', error);
      }
    }
  }

  try {
    return await fetchRepositoryOrganisation();
  } catch (error) {
    console.warn('Unable to load repository organisation data; using an empty organisation model.', error);
    return createEmptyOrganisation();
  }
}

export function saveOrganisationLocally(data: OrganisationData): void {
  localStorage.setItem(
    ORGANISATION_AUTOSAVE_KEY,
    JSON.stringify(normaliseOrganisation(data), null, 2),
  );
  localStorage.removeItem(LEGACY_ORGANISATION_AUTOSAVE_KEY);
}

export async function resetOrganisationToRepository(): Promise<OrganisationData> {
  localStorage.removeItem(ORGANISATION_AUTOSAVE_KEY);
  localStorage.removeItem(LEGACY_ORGANISATION_AUTOSAVE_KEY);
  return fetchRepositoryOrganisation();
}

export function exportOrganisationJson(data: OrganisationData): void {
  const blob = new Blob(
    [`${JSON.stringify(normaliseOrganisation(data), null, 2)}\n`],
    { type: 'application/json;charset=utf-8' },
  );

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = 'org-chart.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function generateOrganisationId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function getDepartmentName(data: OrganisationData, departmentId?: string): string {
  if (!departmentId) {
    return '';
  }

  return data.departments.find((department) => department.id === departmentId)?.name ?? departmentId;
}

export function getRoleName(data: OrganisationData, roleId?: string): string {
  if (!roleId) {
    return '';
  }

  return data.roles.find((role) => role.id === roleId)?.name ?? roleId;
}

export function getTeamName(data: OrganisationData, teamId?: string): string {
  if (!teamId) {
    return '';
  }

  return data.teams.find((team) => team.id === teamId)?.name ?? teamId;
}

export function getPosition(data: OrganisationData, positionId?: string): Position | undefined {
  if (!positionId) {
    return undefined;
  }

  return data.positions.find((position) => position.id === positionId);
}

export function getPositionName(data: OrganisationData, positionId?: string): string {
  if (!positionId) {
    return '';
  }

  return getPosition(data, positionId)?.name ?? positionId;
}

export function getPersonPosition(data: OrganisationData, person: Person): Position | undefined {
  return getPosition(data, person.positionId);
}

export function getPersonRoleId(data: OrganisationData, person: Person): string | undefined {
  return getPersonPosition(data, person)?.roleId ?? person.roleId;
}

export function getPersonDepartmentId(data: OrganisationData, person: Person): string | undefined {
  return getPersonPosition(data, person)?.departmentId ?? person.departmentId;
}

export function getPersonTeamIds(data: OrganisationData, person: Person): string[] {
  const position = getPersonPosition(data, person);
  return position ? position.teamIds : person.teamIds;
}

export function getPositionOccupant(data: OrganisationData, positionId: string): Person | undefined {
  return data.people.find((person) => person.active && person.positionId === positionId);
}

export function getPositionOccupants(data: OrganisationData, positionId: string): Person[] {
  return data.people.filter((person) => person.active && person.positionId === positionId);
}
