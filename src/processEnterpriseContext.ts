import { PROCESS_CATALOG } from './processCatalog';

interface NodeSelectionDetail {
  processId?: string;
  elementId?: string;
  name?: string;
  bpmnType?: string;
}

let selectedNode: NodeSelectionDetail | null = null;

function currentProcessId(): string {
  const name = document.querySelector<HTMLElement>('#document-name')?.textContent?.trim() ?? '';
  const level = document.querySelector<HTMLElement>('#process-level')?.textContent?.trim() ?? '';
  return Object.values(PROCESS_CATALOG).find((process) => process.name === name && process.level === level)?.id ?? '';
}

function installButtons(): void {
  const anchor = document.getElementById('metadata-button');
  if (!anchor || document.getElementById('enterprise-context-button')) return;

  const processButton = document.createElement('button');
  processButton.id = 'enterprise-context-button';
  processButton.className = 'toolbar-button';
  processButton.type = 'button';
  processButton.textContent = 'Process Context';
  processButton.title = 'Show people, systems, data and governance connected to this process';
  processButton.addEventListener('click', () => {
    const processId = currentProcessId();
    const process = PROCESS_CATALOG[processId];
    if (!process) return;
    document.dispatchEvent(new CustomEvent('enterprise-modeler:open-enterprise-explorer', {
      detail: { type: 'process', id: process.id, name: process.name, subtitle: process.level },
    }));
  });

  const stepButton = document.createElement('button');
  stepButton.id = 'enterprise-step-context-button';
  stepButton.className = 'toolbar-button';
  stepButton.type = 'button';
  stepButton.textContent = 'Step Context';
  stepButton.disabled = true;
  stepButton.title = 'Show enterprise relationships for the selected BPMN step';
  stepButton.addEventListener('click', () => {
    const processId = selectedNode?.processId || currentProcessId();
    const elementId = selectedNode?.elementId || '';
    if (!processId || !elementId) return;
    document.dispatchEvent(new CustomEvent('enterprise-modeler:open-enterprise-explorer', {
      detail: {
        type: 'process-node',
        id: `${processId}:${elementId}`,
        name: selectedNode?.name || elementId,
        subtitle: selectedNode?.bpmnType || 'BPMN Process Step',
      },
    }));
  });

  anchor.insertAdjacentElement('afterend', stepButton);
  anchor.insertAdjacentElement('afterend', processButton);
}

document.addEventListener('enterprise-modeler:process-node-selection-changed', (event) => {
  selectedNode = (event as CustomEvent<NodeSelectionDetail>).detail ?? null;
  const button = document.getElementById('enterprise-step-context-button') as HTMLButtonElement | null;
  if (button) button.disabled = !selectedNode?.elementId;
});

installButtons();
