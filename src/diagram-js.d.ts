declare module 'diagram-js' {
  export default class Diagram {
    constructor(options?: {
      canvas?: { container?: Element };
      modules?: unknown[];
      [key: string]: unknown;
    });

    get<T = unknown>(name: string): T;
    destroy(): void;
  }
}

declare module 'diagram-js/assets/diagram-js.css';
