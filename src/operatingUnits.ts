import type { OrganisationData, Position } from './organisation';

export type OperatingUnitType = 'business-unit' | 'office-site' | 'legal-entity' | 'function' | 'other';

export interface OperatingUnit {
  id: string;
  name: string;
  type: OperatingUnitType;
  code: string;
  positionIds: string[];
  active: boolean;
  notes: string;
}

export interface OperatingUnitsData {
  schemaVersion: number;
  units: OperatingUnit[];
}

const OPERATING_UNITS_URL = '/organisation/operating-units.json';
const OPERATING_UNITS_AUTOSAVE_KEY = 'enterprise-modeler.operating-units.v1';
const VALID_TYPES = new Set<OperatingUnitType>(['business-unit', 'office-site', 'legal-entity', 'function', 'other']);

export function createEmptyOperatingUnits(): OperatingUnitsData {
  return { schemaVersion: 1, units: [] };
}

function normaliseOperatingUnits(value: Partial<OperatingUnitsData>): OperatingUnitsData {
  return {
    schemaVersion: 1,
    units: Array.isArray(value.units)
      ? value.units.map((unit) => ({
          ...unit,
          type: VALID_TYPES.has(unit.type as OperatingUnitType) ? unit.type as OperatingUnitType : 'business-unit',
          code: unit.code || '',
          positionIds: Array.isArray(unit.positionIds) ? unit.positionIds : [],
          active: unit.active !== false,
          notes: unit.notes || '',
        }))
      : [],
  };
}

export async function fetchRepositoryOperatingUnits(): Promise<OperatingUnitsData> {
  const response = await fetch(OPERATING_UNITS_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Unable to load operating units. HTTP ${response.status}.`);
  return normaliseOperatingUnits(await response.json() as Partial<OperatingUnitsData>);
}

export async function loadOperatingUnits(preferAutosave = true): Promise<OperatingUnitsData> {
  if (preferAutosave) {
    const autosaved = localStorage.getItem(OPERATING_UNITS_AUTOSAVE_KEY);
    if (autosaved) {
      try { return normaliseOperatingUnits(JSON.parse(autosaved) as Partial<OperatingUnitsData>); }
      catch (error) { console.warn('Unable to parse locally saved operating units; repository data will be used.', error); }
    }
  }
  try { return await fetchRepositoryOperatingUnits(); }
  catch (error) { console.warn('Unable to load repository operating units; using an empty unit model.', error); return createEmptyOperatingUnits(); }
}

export function saveOperatingUnitsLocally(data: OperatingUnitsData): void {
  localStorage.setItem(OPERATING_UNITS_AUTOSAVE_KEY, JSON.stringify(normaliseOperatingUnits(data), null, 2));
}

export async function resetOperatingUnitsToRepository(): Promise<OperatingUnitsData> {
  localStorage.removeItem(OPERATING_UNITS_AUTOSAVE_KEY);
  return fetchRepositoryOperatingUnits();
}

export function exportOperatingUnitsJson(data: OperatingUnitsData): void {
  const blob = new Blob([`${JSON.stringify(normaliseOperatingUnits(data), null, 2)}\n`], { type: 'application/json;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = 'operating-units.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function generateOperatingUnitId(): string { return `unit-${crypto.randomUUID()}`; }
export function getUnitForPosition(data: OperatingUnitsData, positionId?: string): OperatingUnit | undefined {
  return positionId ? data.units.find((unit) => unit.positionIds.includes(positionId)) : undefined;
}
export function getUnitNameForPosition(data: OperatingUnitsData, positionId?: string): string {
  return getUnitForPosition(data, positionId)?.name ?? '';
}
export function getPositionsForUnit(organisation: OrganisationData, unit: OperatingUnit): Position[] {
  const ids = new Set(unit.positionIds);
  return organisation.positions.filter((position) => ids.has(position.id));
}
export function getUnassignedPositions(organisation: OrganisationData, data: OperatingUnitsData): Position[] {
  const assigned = new Set(data.units.flatMap((unit) => unit.positionIds));
  return organisation.positions.filter((position) => !assigned.has(position.id));
}
