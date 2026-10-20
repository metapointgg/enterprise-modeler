import './processMapLinker.css';

import {
  PROCESS_CATALOG,
  PROCESS_LAYERS,
  type ProcessDefinition,
  type ProcessLayer,
} from './processCatalog';

type ProcessLinkType = 'drill-down' | 'related' | 'exception' | 'supporting';

interface SelectedNode {
  id: string;
  name: string;
}

interface ContextPadLinkEventDetail {
  elementId?: string;
  elementName?: string;
}

interface PendingProcessCreation {
  knownProcessIds: Set<string>;
  layerId: string;
  relationshipType: ProcessLinkType;
  sourceElementId: string;
}

interface PendingLayerCreation {
  knownLayerIds: Set<string>;
}

const canvas = document.querySelector<HTMLElement>('#canvas');

if (!canvas) {
  console.warn('Process-map linker could not initialise because the modeler canvas was not found.');
} else {
  initialiseProcessMapLinker();
}

function initialiseProcessMapLinker(): void {
  const dialog = document.createElement('dialog');
  dialog.id = 'process-map-link-dialog';
  dialog.className = 'process-map-link-dialog';
  document.body.appendChild(dialog);

  let pendingProcessCreation: PendingProcessCreation | null = null;
  let pendingLayerCreation: PendingLayerCreation | null = null;
  let activeNode: SelectedNode | null = null;

  function getCurrentProcess(): ProcessDefinition | null {
    const name = document.querySelector<HTMLElement>('#document-name')?.textContent?.trim() ?? '';
    const level = document.querySelector<HTMLElement>('#process-level')?.textContent?.trim() ?? '';

    const exactMatch = Object.values(PROCESS_CATALOG).find(
      (process) => process.active && process.name === name && process.level === level,
    );

    if (exactMatch) {
      return exactMatch;
    }

    const nameMatches = Object.values(PROCESS_CATALOG).filter(
      (process) => process.active && process.name === name,
    );

    return nameMatches.length === 1 ? nameMatches[0] : null;
  }

  function sortedActiveLayers(): ProcessLayer[] {
    return [...PROCESS_LAYERS]
      .filter((layer) => layer.active)
      .sort((left, right) => left.sequence - right.sequence || left.code.localeCompare(right.code));
  }

  function getDefaultTargetLayerId(currentProcess: ProcessDefinition | null): string {
    const layers = sortedActiveLayers();
    if (layers.length === 0) {
      return '';
    }

    if (!currentProcess) {
      return layers[0].id;
    }

    const currentLayer = PROCESS_LAYERS.find((layer) => layer.id === currentProcess.layerId);
    if (!currentLayer) {
      return layers[0].id;
    }

    return layers.find((layer) => layer.sequence > currentLayer.sequence)?.id
      ?? currentLayer.id;
  }

  function renderTargetProcesses(layerId: string): void {
    const processSelect = dialog.querySelector<HTMLSelectElement>('#process-map-link-process');
    if (!processSelect) {
      return;
    }

    processSelect.replaceChildren();
    processSelect.add(new Option('Select existing process', ''));

    const currentProcess = getCurrentProcess();
    const processes = Object.values(PROCESS_CATALOG)
      .filter((process) => (
        process.active &&
        process.layerId === layerId &&
        process.id !== currentProcess?.id
      ))
      .sort((left, right) => left.name.localeCompare(right.name));

    processes.forEach((process) => {
      processSelect.add(new Option(`${process.level} — ${process.name}`, process.id));
    });

    if (processes.length === 0) {
      const option = new Option('No active processes in this layer', '');
      option.disabled = true;
      processSelect.add(option);
    }
  }

  function renderLinkDialog(selected: SelectedNode, preferredLayerId?: string): void {
    activeNode = selected;

    const currentProcess = getCurrentProcess();
    const layers = sortedActiveLayers();
    const selectedLayerId = preferredLayerId
      && layers.some((layer) => layer.id === preferredLayerId)
      ? preferredLayerId
      : getDefaultTargetLayerId(currentProcess);

    const layerOptions = layers.map((layer) => `
      <option value="${escapeHtml(layer.id)}"${layer.id === selectedLayerId ? ' selected' : ''}>
        ${escapeHtml(layer.code)} — ${escapeHtml(layer.name)}
      </option>
    `).join('');

    dialog.innerHTML = `
      <div class="process-map-link-shell">
        <header class="process-map-link-header">
          <div>
            <div class="process-map-link-title">Link to Process</div>
            <div class="process-map-link-subtitle">
              ${escapeHtml(selected.name)} · ${escapeHtml(selected.id)}
            </div>
          </div>
          <button id="process-map-link-close" class="metadata-close-button" type="button" title="Close">×</button>
        </header>

        <div class="process-map-link-body">
          <div class="process-map-link-context">
            <span>Current process</span>
            <strong>${escapeHtml(currentProcess ? `${currentProcess.level} — ${currentProcess.name}` : 'Custom / unresolved process')}</strong>
          </div>

          <label class="metadata-field">
            <span>Relationship</span>
            <select id="process-map-link-type">
              <option value="drill-down">Drill down</option>
              <option value="related">Related</option>
              <option value="exception">Exception</option>
              <option value="supporting">Supporting</option>
            </select>
          </label>

          <div class="process-map-link-layer-row">
            <label class="metadata-field process-map-link-layer-field">
              <span>Target layer</span>
              <select id="process-map-link-layer"${layers.length === 0 ? ' disabled' : ''}>
                ${layers.length > 0 ? layerOptions : '<option value="">No active layers</option>'}
              </select>
            </label>

            <button id="process-map-new-layer" class="toolbar-button" type="button">
              + New Layer
            </button>
          </div>

          <label class="metadata-field">
            <span>Existing process</span>
            <select id="process-map-link-process"${selectedLayerId ? '' : ' disabled'}>
              <option value="">Select existing process</option>
            </select>
          </label>

          <label class="metadata-field">
            <span>Link label</span>
            <input id="process-map-link-label" type="text" placeholder="Optional display label" />
          </label>

          <div class="process-map-link-actions">
            <button id="process-map-link-existing" class="toolbar-button toolbar-button-primary" type="button">
              Link Existing Process
            </button>
            <button id="process-map-create-process" class="toolbar-button" type="button"${selectedLayerId ? '' : ' disabled'}>
              Create New Process
            </button>
            <button id="process-map-link-cancel" class="toolbar-button" type="button">Cancel</button>
          </div>

          <div class="metadata-help">
            Select a target layer to filter the process list. Create New Process opens the normal Process Manager with the layer and current process preselected; when saved, the new process is linked back to this node automatically.
          </div>
        </div>
      </div>
    `;

    if (selectedLayerId) {
      renderTargetProcesses(selectedLayerId);
    }

    bindDialogEvents(selected);

    if (!dialog.open) {
      dialog.showModal();
    }
  }

  function bindDialogEvents(selected: SelectedNode): void {
    dialog.querySelector<HTMLButtonElement>('#process-map-link-close')
      ?.addEventListener('click', () => dialog.close());
    dialog.querySelector<HTMLButtonElement>('#process-map-link-cancel')
      ?.addEventListener('click', () => dialog.close());

    dialog.querySelector<HTMLSelectElement>('#process-map-link-layer')
      ?.addEventListener('change', (event) => {
        const layerId = (event.currentTarget as HTMLSelectElement).value;
        renderTargetProcesses(layerId);

        const createButton = dialog.querySelector<HTMLButtonElement>('#process-map-create-process');
        if (createButton) {
          createButton.disabled = !layerId;
        }
      });

    dialog.querySelector<HTMLButtonElement>('#process-map-link-existing')
      ?.addEventListener('click', () => {
        const targetProcessId = dialog.querySelector<HTMLSelectElement>('#process-map-link-process')?.value ?? '';
        const relationshipType = getDialogRelationshipType();
        const label = dialog.querySelector<HTMLInputElement>('#process-map-link-label')?.value.trim() ?? '';

        if (!targetProcessId) {
          window.alert('Select an existing process to link.');
          return;
        }

        if (applyLinkThroughMetadata(selected.id, targetProcessId, relationshipType, label)) {
          dialog.close();
        }
      });

    dialog.querySelector<HTMLButtonElement>('#process-map-create-process')
      ?.addEventListener('click', () => {
        const layerId = dialog.querySelector<HTMLSelectElement>('#process-map-link-layer')?.value ?? '';
        if (!layerId) {
          window.alert('Select a target layer before creating a process.');
          return;
        }

        const currentProcess = getCurrentProcess();
        pendingProcessCreation = {
          knownProcessIds: new Set(Object.keys(PROCESS_CATALOG)),
          layerId,
          relationshipType: getDialogRelationshipType(),
          sourceElementId: selected.id,
        };

        dialog.close();
        void openProcessManagerForNewProcess(layerId, currentProcess?.id, selected.name);
      });

    dialog.querySelector<HTMLButtonElement>('#process-map-new-layer')
      ?.addEventListener('click', () => {
        pendingLayerCreation = {
          knownLayerIds: new Set(PROCESS_LAYERS.map((layer) => layer.id)),
        };

        dialog.close();
        void openProcessManagerForNewLayer();
      });
  }

  function getDialogRelationshipType(): ProcessLinkType {
    const value = dialog.querySelector<HTMLSelectElement>('#process-map-link-type')?.value;
    return value === 'related' || value === 'exception' || value === 'supporting'
      ? value
      : 'drill-down';
  }

  function applyLinkThroughMetadata(
    sourceElementId: string,
    targetProcessId: string,
    relationshipType: ProcessLinkType,
    label: string,
  ): boolean {
    const selectedElementId = document.querySelector<HTMLInputElement>('#metadata-node-id')?.value.trim() ?? '';
    if (selectedElementId !== sourceElementId) {
      window.alert('The original BPMN node is no longer selected. Select it again and retry the link.');
      return false;
    }

    const typeSelect = document.querySelector<HTMLSelectElement>('#metadata-link-type');
    const targetSelect = document.querySelector<HTMLSelectElement>('#metadata-link-target');
    const labelInput = document.querySelector<HTMLInputElement>('#metadata-link-label');
    const addButton = document.querySelector<HTMLButtonElement>('#metadata-link-add');

    if (!typeSelect || !targetSelect || !labelInput || !addButton) {
      window.alert('The node metadata link controls are not available.');
      return false;
    }

    const targetExists = Array.from(targetSelect.options).some(
      (option) => option.value === targetProcessId,
    );

    if (!targetExists) {
      window.alert('The target process is not available in the current process repository.');
      return false;
    }

    typeSelect.value = relationshipType;
    targetSelect.value = targetProcessId;
    labelInput.value = label;
    addButton.click();
    return true;
  }

  async function openProcessManagerForNewProcess(
    layerId: string,
    parentProcessId: string | undefined,
    suggestedName: string,
  ): Promise<void> {
    const managerButton = document.querySelector<HTMLButtonElement>('#process-manager-button');
    if (!managerButton) {
      window.alert('Process Manager is not available.');
      pendingProcessCreation = null;
      return;
    }

    managerButton.click();

    const newProcessButton = await waitForElement<HTMLButtonElement>('#process-manager-new-process');
    if (!newProcessButton) {
      window.alert('Unable to open the new process form.');
      pendingProcessCreation = null;
      return;
    }

    newProcessButton.click();

    const layerSelect = await waitForElement<HTMLSelectElement>('#process-manager-process-layer');
    const parentSelect = await waitForElement<HTMLSelectElement>('#process-manager-process-parent');
    const nameInput = await waitForElement<HTMLInputElement>('#process-manager-process-name');

    if (layerSelect && Array.from(layerSelect.options).some((option) => option.value === layerId)) {
      layerSelect.value = layerId;
    }

    if (
      parentSelect &&
      parentProcessId &&
      Array.from(parentSelect.options).some((option) => option.value === parentProcessId)
    ) {
      parentSelect.value = parentProcessId;
    }

    if (nameInput && !nameInput.value && suggestedName) {
      nameInput.value = suggestedName;
      nameInput.focus();
      nameInput.select();
    } else {
      nameInput?.focus();
    }
  }

  async function openProcessManagerForNewLayer(): Promise<void> {
    const managerButton = document.querySelector<HTMLButtonElement>('#process-manager-button');
    if (!managerButton) {
      window.alert('Process Manager is not available.');
      pendingLayerCreation = null;
      return;
    }

    managerButton.click();

    const layersTab = await waitForElement<HTMLButtonElement>(
      '[data-process-manager-tab="layers"]',
    );
    if (!layersTab) {
      window.alert('Unable to open Process Manager layers.');
      pendingLayerCreation = null;
      return;
    }

    layersTab.click();

    const newLayerButton = await waitForElement<HTMLButtonElement>('#process-manager-new-layer');
    if (!newLayerButton) {
      window.alert('Unable to open the new layer form.');
      pendingLayerCreation = null;
      return;
    }

    newLayerButton.click();
    const codeInput = await waitForElement<HTMLInputElement>('#process-manager-layer-code');
    codeInput?.focus();
  }

  function handleRepositoryChanged(): void {
    if (pendingLayerCreation) {
      const newLayer = PROCESS_LAYERS.find(
        (layer) => !pendingLayerCreation?.knownLayerIds.has(layer.id),
      );

      if (newLayer) {
        pendingLayerCreation = null;
        closeProcessManagerDialog();
        if (activeNode) {
          window.setTimeout(() => renderLinkDialog(activeNode as SelectedNode, newLayer.id), 0);
        }
        return;
      }
    }

    if (pendingProcessCreation) {
      const pending = pendingProcessCreation;
      const newProcess = Object.values(PROCESS_CATALOG).find(
        (process) => (
          !pending.knownProcessIds.has(process.id) &&
          process.layerId === pending.layerId
        ),
      );

      if (newProcess) {
        pendingProcessCreation = null;
        closeProcessManagerDialog();

        window.setTimeout(() => {
          applyLinkThroughMetadata(
            pending.sourceElementId,
            newProcess.id,
            pending.relationshipType,
            '',
          );
        }, 0);
      }
    }
  }

  function handleContextPadLinkEvent(event: Event): void {
    const detail = (event as CustomEvent<ContextPadLinkEventDetail>).detail;
    const elementId = detail?.elementId?.trim() ?? '';

    if (!elementId) {
      window.alert('Unable to determine which BPMN node should be linked.');
      return;
    }

    renderLinkDialog({
      id: elementId,
      name: detail?.elementName?.trim() || elementId,
    });
  }

  function closeProcessManagerDialog(): void {
    const managerDialog = document.querySelector<HTMLDialogElement>('.process-manager-dialog');
    if (managerDialog?.open) {
      managerDialog.close();
    }
  }

  async function waitForElement<T extends Element>(
    selector: string,
    timeoutMs = 2500,
  ): Promise<T | null> {
    const startedAt = performance.now();

    while (performance.now() - startedAt < timeoutMs) {
      const element = document.querySelector<T>(selector);
      if (element) {
        return element;
      }
      await new Promise<void>((resolve) => window.setTimeout(resolve, 25));
    }

    return null;
  }

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  document.addEventListener('enterprise-modeler:process-repository-changed', handleRepositoryChanged);
  document.addEventListener('enterprise-modeler:link-process-from-context-pad', handleContextPadLinkEvent);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
