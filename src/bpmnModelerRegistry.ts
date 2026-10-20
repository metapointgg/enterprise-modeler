import BpmnModeler from 'bpmn-js/lib/Modeler';

interface RegisteredCanvasService {
  getContainer(): HTMLElement;
}

interface RegisteredModeler extends BpmnModeler {
  get<T>(serviceName: string): T;
}

type ModelerContainer = HTMLElement & {
  __enterpriseModelerBpmnModeler?: RegisteredModeler;
};

type ModelerPrototype = {
  importXML: (xml: string, bpmnDiagram?: unknown) => Promise<unknown>;
  destroy: () => void;
  __enterpriseModelerRegistryPatched?: boolean;
};

const prototype = BpmnModeler.prototype as unknown as ModelerPrototype;

if (!prototype.__enterpriseModelerRegistryPatched) {
  prototype.__enterpriseModelerRegistryPatched = true;

  const nativeImportXML = prototype.importXML;
  const nativeDestroy = prototype.destroy;

  prototype.importXML = async function importXMLWithRegistration(
    this: RegisteredModeler,
    xml: string,
    bpmnDiagram?: unknown,
  ): Promise<unknown> {
    const result = await nativeImportXML.call(this, xml, bpmnDiagram);
    registerModeler(this);
    return result;
  };

  prototype.destroy = function destroyWithRegistration(this: RegisteredModeler): void {
    unregisterModeler(this);
    nativeDestroy.call(this);
  };
}

function registerModeler(modeler: RegisteredModeler): void {
  try {
    const canvas = modeler.get<RegisteredCanvasService>('canvas');
    const container = canvas.getContainer() as ModelerContainer;
    container.__enterpriseModelerBpmnModeler = modeler;
    container.dispatchEvent(new CustomEvent('enterprise-modeler:bpmn-modeler-registered', {
      bubbles: true,
    }));
  } catch (error) {
    console.warn('Unable to register BPMN modeler canvas.', error);
  }
}

function unregisterModeler(modeler: RegisteredModeler): void {
  try {
    const canvas = modeler.get<RegisteredCanvasService>('canvas');
    const container = canvas.getContainer() as ModelerContainer;
    if (container.__enterpriseModelerBpmnModeler === modeler) {
      delete container.__enterpriseModelerBpmnModeler;
    }
  } catch {
    // The modeler may already be partly destroyed. Nothing remains to unregister.
  }
}

export function getBpmnModelerForCanvas(canvasHost: HTMLElement): RegisteredModeler | null {
  const candidates: ModelerContainer[] = [
    canvasHost as ModelerContainer,
    ...Array.from(canvasHost.querySelectorAll<HTMLElement>('.djs-container')) as ModelerContainer[],
  ];

  for (const candidate of candidates) {
    if (candidate.__enterpriseModelerBpmnModeler) return candidate.__enterpriseModelerBpmnModeler;
  }

  return null;
}
