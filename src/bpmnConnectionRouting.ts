import { getBpmnModelerForCanvas } from './bpmnModelerRegistry';

interface DiagramPoint {
  x: number;
  y: number;
}

interface DiagramConnection {
  id: string;
  waypoints?: DiagramPoint[];
}

interface ElementRegistryService {
  getAll(): DiagramConnection[];
}

interface BpmnLayouterService {
  layoutConnection(connection: DiagramConnection): DiagramPoint[];
}

interface ModelingService {
  updateWaypoints(connection: DiagramConnection, waypoints: DiagramPoint[]): void;
}

interface CommandStackService {
  clear(): void;
}

const MAIN_CANVAS_SELECTOR = '#canvas';
const COORDINATE_TOLERANCE = 0.5;

function hasDiagonalSegment(waypoints: DiagramPoint[] | undefined): boolean {
  if (!waypoints || waypoints.length < 2) return false;

  for (let index = 1; index < waypoints.length; index += 1) {
    const previous = waypoints[index - 1];
    const current = waypoints[index];
    if (!previous || !current) continue;

    const horizontalChange = Math.abs(current.x - previous.x);
    const verticalChange = Math.abs(current.y - previous.y);

    if (
      horizontalChange > COORDINATE_TOLERANCE &&
      verticalChange > COORDINATE_TOLERANCE
    ) {
      return true;
    }
  }

  return false;
}

function normaliseImportedConnections(canvasHost: HTMLElement): void {
  const modeler = getBpmnModelerForCanvas(canvasHost);
  if (!modeler) return;

  const elementRegistry = modeler.get<ElementRegistryService>('elementRegistry');
  const layouter = modeler.get<BpmnLayouterService>('layouter');
  const modeling = modeler.get<ModelingService>('modeling');
  const commandStack = modeler.get<CommandStackService>('commandStack');

  let updatedConnections = 0;

  elementRegistry.getAll().forEach((element) => {
    if (!hasDiagonalSegment(element.waypoints)) return;

    try {
      const routedWaypoints = layouter.layoutConnection(element);
      if (!routedWaypoints || routedWaypoints.length < 2) return;

      modeling.updateWaypoints(element, routedWaypoints);
      updatedConnections += 1;
    } catch (error) {
      console.warn(`Unable to normalise BPMN connection ${element.id}.`, error);
    }
  });

  if (updatedConnections > 0) {
    commandStack.clear();
    console.info(`Normalised ${updatedConnections} BPMN connection route${updatedConnections === 1 ? '' : 's'} after import.`);
  }
}

function normaliseMainCanvas(): void {
  const canvasHost = document.querySelector<HTMLElement>(MAIN_CANVAS_SELECTOR);
  if (!canvasHost) return;
  normaliseImportedConnections(canvasHost);
}

document.addEventListener('enterprise-modeler:bpmn-modeler-registered', (event) => {
  const canvasHost = document.querySelector<HTMLElement>(MAIN_CANVAS_SELECTOR);
  if (!canvasHost) return;

  const target = event.target;
  if (!(target instanceof Node) || !canvasHost.contains(target)) return;

  normaliseImportedConnections(canvasHost);
});

normaliseMainCanvas();
