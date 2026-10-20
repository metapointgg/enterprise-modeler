declare module 'bpmn-js/lib/Modeler' {
  export interface BpmnModelerOptions {
    container?: string | Element;
    keyboard?: {
      bindTo?: EventTarget;
    };
    additionalModules?: unknown[];
    moddleExtensions?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface BpmnImportResult {
    warnings?: unknown[];
  }

  export interface BpmnSaveXmlResult {
    xml?: string;
  }

  export interface BpmnSaveSvgResult {
    svg?: string;
  }

  export default class BpmnModeler<ServiceMap = Record<string, unknown>> {
    constructor(options?: BpmnModelerOptions);

    importXML(xml: string, bpmnDiagram?: unknown): Promise<BpmnImportResult>;
    createDiagram(): Promise<BpmnImportResult>;
    saveXML(options?: { format?: boolean }): Promise<BpmnSaveXmlResult>;
    saveSVG(): Promise<BpmnSaveSvgResult>;

    get<T = unknown>(serviceName: string): T;
    on<TEvent = unknown>(eventName: string, callback: (event: TEvent) => void): void;
    off<TEvent = unknown>(eventName: string, callback: (event: TEvent) => void): void;
    destroy(): void;
  }
}
