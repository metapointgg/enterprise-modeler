import './processManager.css';

import {
  exportProcessRepositoryJson,
  generateLayerId,
  generateProcessId,
  getProcessLayerCode,
  loadProcessRepository,
  resetProcessRepositoryToRepository,
  saveProcessRepositoryLocally,
  seedNewProcessDraft,
  toBpmnProcessId,
  type ProcessCatalogData,
  type ProcessDefinitionRecord,
  type ProcessLayer,
  type ProcessLayersData,
  type ProcessRepositorySnapshot,
} from './processCatalog';

type ProcessManagerTab = 'library' | 'layers';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sortedLayers(layers: ProcessLayer[]): ProcessLayer[] {
  return [...layers].sort(
    (left, right) => left.sequence - right.sequence || left.code.localeCompare(right.code),
  );
}

function getInputValue(root: HTMLElement, id: string): string {
  return root
    .querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`#${id}`)
    ?.value.trim() ?? '';
}

function notifyRepositoryChanged(): void {
  document.dispatchEvent(new CustomEvent('enterprise-modeler:process-repository-changed'));
}

class ProcessManager {
  private readonly anchorButton: HTMLButtonElement;
  private readonly button: HTMLButtonElement;
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;

  private snapshot: ProcessRepositorySnapshot = {
    layers: { schemaVersion: 1, layers: [] },
    catalog: { schemaVersion: 1, rootProcessId: '', processes: [] },
  };

  private activeTab: ProcessManagerTab = 'library';
  private selectedProcessId: string | null = null;
  private selectedLayerId: string | null = null;

  constructor(anchorButton: HTMLButtonElement) {
    this.anchorButton = anchorButton;

    this.button = document.createElement('button');
    this.button.id = 'process-manager-button';
    this.button.className = 'toolbar-button';
    this.button.type = 'button';
    this.button.textContent = 'Processes';
    this.anchorButton.insertAdjacentElement('afterend', this.button);

    this.dialog = document.createElement('dialog');
    this.dialog.className = 'process-manager-dialog';
    this.dialog.innerHTML = '<div id="process-manager-root"></div>';
    document.body.appendChild(this.dialog);

    const root = this.dialog.querySelector<HTMLDivElement>('#process-manager-root');
    if (!root) {
      throw new Error('Unable to initialise Process Manager root.');
    }

    this.root = root;

    this.button.addEventListener('click', () => void this.open());
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) {
        this.dialog.close();
      }
    });
  }

  private async open(): Promise<void> {
    this.snapshot = await loadProcessRepository(true);
    this.ensureSelectionsExist();
    this.render();

    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }

  private ensureSelectionsExist(): void {
    if (
      this.selectedProcessId &&
      !this.snapshot.catalog.processes.some((process) => process.id === this.selectedProcessId)
    ) {
      this.selectedProcessId = null;
    }

    if (
      this.selectedLayerId &&
      !this.snapshot.layers.layers.some((layer) => layer.id === this.selectedLayerId)
    ) {
      this.selectedLayerId = null;
    }
  }

  private persist(): void {
    saveProcessRepositoryLocally(this.snapshot);
    notifyRepositoryChanged();
  }

  private render(): void {
    this.root.innerHTML = `
      <div class="process-manager">
        <header class="process-manager-header">
          <div>
            <div class="organisation-title">Process Manager</div>
            <div class="organisation-subtitle">
              Repository-backed process catalogue, configurable layers and process navigation.
            </div>
          </div>

          <div class="organisation-header-actions">
            <button id="process-manager-export-catalog" class="toolbar-button" type="button">Export Catalogue</button>
            <button id="process-manager-export-layers" class="toolbar-button" type="button">Export Layers</button>
            <button id="process-manager-reset" class="toolbar-button" type="button">Reset</button>
            <button id="process-manager-close" class="metadata-close-button" type="button" title="Close">×</button>
          </div>
        </header>

        <div class="process-manager-tabs">
          ${this.renderTabButton('library', 'Process Library')}
          ${this.renderTabButton('layers', 'Layers')}
        </div>

        <div class="process-manager-content">
          ${this.activeTab === 'library' ? this.renderLibrary() : this.renderLayers()}
        </div>

        <footer class="organisation-footer-note">
          Catalogue and layer edits are browser-local working changes until exported and committed to the repository.
          Newly created processes receive a local starter BPMN and metadata record so they can be opened immediately.
        </footer>
      </div>
    `;

    this.bindCommonEvents();

    if (this.activeTab === 'library') {
      this.bindLibraryEvents();
    } else {
      this.bindLayerEvents();
    }
  }

  private renderTabButton(tab: ProcessManagerTab, label: string): string {
    return `
      <button
        class="process-manager-tab${this.activeTab === tab ? ' process-manager-tab-active' : ''}"
        type="button"
        data-process-manager-tab="${tab}"
      >
        ${label}
      </button>
    `;
  }

  private renderLibrary(): string {
    const layerMap = new Map(
      this.snapshot.layers.layers.map((layer) => [layer.id, layer]),
    );

    const processes = [...this.snapshot.catalog.processes].sort((left, right) => {
      const leftLayer = layerMap.get(left.layerId);
      const rightLayer = layerMap.get(right.layerId);
      const layerCompare = (leftLayer?.sequence ?? 9999) - (rightLayer?.sequence ?? 9999);
      return layerCompare || left.name.localeCompare(right.name);
    });

    const selected = this.selectedProcessId
      ? this.snapshot.catalog.processes.find((process) => process.id === this.selectedProcessId) ?? null
      : null;

    const rows = processes.length === 0
      ? '<div class="organisation-empty">No processes are defined.</div>'
      : processes.map((process) => {
          const layer = layerMap.get(process.layerId);
          const parent = process.parentId
            ? this.snapshot.catalog.processes.find((candidate) => candidate.id === process.parentId)
            : undefined;

          return `
            <button
              class="organisation-list-item${process.id === this.selectedProcessId ? ' organisation-list-item-selected' : ''}"
              type="button"
              data-edit-process="${escapeHtml(process.id)}"
            >
              <span class="organisation-list-primary">
                ${escapeHtml(process.name)}
                ${process.id === this.snapshot.catalog.rootProcessId ? '<span class="process-manager-pill">HOME</span>' : ''}
              </span>
              <span class="organisation-list-secondary">
                ${escapeHtml(layer?.code || 'Unlayered')} · ${escapeHtml(layer?.name || 'Layer not found')}
                ${parent ? ` · Parent: ${escapeHtml(parent.name)}` : ''}
                ${process.active ? '' : ' · Inactive'}
              </span>
            </button>
          `;
        }).join('');

    return `
      <div class="process-manager-split">
        <div class="process-manager-list-pane">
          <div class="organisation-section-heading">
            <span>Processes</span>
            <button id="process-manager-new-process" class="toolbar-button" type="button">New Process</button>
          </div>
          <div class="organisation-list">${rows}</div>
        </div>

        <div class="process-manager-editor-pane">
          ${this.renderProcessForm(selected)}
        </div>
      </div>
    `;
  }

  private renderProcessForm(process: ProcessDefinitionRecord | null): string {
    const layers = sortedLayers(this.snapshot.layers.layers);
    const selectedLayerId = process?.layerId || layers.find((layer) => layer.active)?.id || '';

    const layerOptions = layers
      .map((layer) => `
        <option value="${escapeHtml(layer.id)}"${layer.id === selectedLayerId ? ' selected' : ''}>
          ${escapeHtml(layer.code)} — ${escapeHtml(layer.name)}${layer.active ? '' : ' (inactive)'}
        </option>
      `)
      .join('');

    const parentOptions = this.snapshot.catalog.processes
      .filter((candidate) => candidate.id !== process?.id && candidate.active)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((candidate) => `
        <option value="${escapeHtml(candidate.id)}"${candidate.id === process?.parentId ? ' selected' : ''}>
          ${escapeHtml(getProcessLayerCode(candidate.layerId))} — ${escapeHtml(candidate.name)}
        </option>
      `)
      .join('');

    const isHome = process?.id === this.snapshot.catalog.rootProcessId;

    return `
      <form id="process-manager-process-form" class="organisation-form process-manager-form">
        <div class="organisation-editor-heading">${process ? 'Edit process' : 'Add process'}</div>
        ${process ? `<div class="organisation-record-id">${escapeHtml(process.id)}</div>` : ''}

        <label class="metadata-field">
          <span>Name</span>
          <input id="process-manager-process-name" type="text" required value="${escapeHtml(process?.name ?? '')}" placeholder="e.g. Customer Risk Assessment" />
        </label>

        <label class="metadata-field">
          <span>Layer</span>
          <select id="process-manager-process-layer" required>
            <option value="">Select layer</option>
            ${layerOptions}
          </select>
        </label>

        <label class="metadata-field">
          <span>Primary parent process</span>
          <select id="process-manager-process-parent">
            <option value="">None / top level</option>
            ${parentOptions}
          </select>
        </label>

        <label class="metadata-field">
          <span>BPMN process ID</span>
          <input id="process-manager-process-bpmn-id" type="text" value="${escapeHtml(process?.bpmnProcessId ?? '')}" placeholder="Generated from name when blank" />
        </label>

        <label class="metadata-field">
          <span>BPMN filename</span>
          <input id="process-manager-process-filename" type="text" value="${escapeHtml(process?.filename ?? '')}" placeholder="Generated from process ID when blank" />
        </label>

        <label class="metadata-field">
          <span>BPMN repository URL</span>
          <input id="process-manager-process-url" type="text" value="${escapeHtml(process?.url ?? '')}" placeholder="/processes/custom/process-name.bpmn" />
        </label>

        <label class="metadata-field">
          <span>Metadata repository URL</span>
          <input id="process-manager-process-metadata-url" type="text" value="${escapeHtml(process?.metadataUrl ?? '')}" placeholder="/metadata/custom/process-name.json" />
        </label>

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="process-manager-process-home" type="checkbox"${isHome ? ' checked' : ''} />
          <span>Home / root process</span>
        </label>

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="process-manager-process-active" type="checkbox"${process?.active !== false ? ' checked' : ''} />
          <span>Active</span>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${process ? 'Save Process' : 'Add Process'}</button>
          ${process ? '<button id="process-manager-open-process" class="toolbar-button" type="button">Open Process</button>' : ''}
        </div>

        <div class="metadata-help">
          Primary parent controls breadcrumbs only. Semantic BPMN drill-down remains defined by callActivity.calledElement;
          additional process relationships are maintained on node metadata.
        </div>
      </form>
    `;
  }

  private renderLayers(): string {
    const layers = sortedLayers(this.snapshot.layers.layers);
    const selected = this.selectedLayerId
      ? this.snapshot.layers.layers.find((layer) => layer.id === this.selectedLayerId) ?? null
      : null;

    const rows = layers.length === 0
      ? '<div class="organisation-empty">No process layers are defined.</div>'
      : layers.map((layer) => {
          const processCount = this.snapshot.catalog.processes.filter(
            (process) => process.layerId === layer.id,
          ).length;

          return `
            <button
              class="organisation-list-item${layer.id === this.selectedLayerId ? ' organisation-list-item-selected' : ''}"
              type="button"
              data-edit-process-layer="${escapeHtml(layer.id)}"
            >
              <span class="organisation-list-primary">
                ${escapeHtml(layer.code)} — ${escapeHtml(layer.name)}
              </span>
              <span class="organisation-list-secondary">
                Sequence ${layer.sequence} · ${processCount} process${processCount === 1 ? '' : 'es'}${layer.active ? '' : ' · Inactive'}
              </span>
            </button>
          `;
        }).join('');

    return `
      <div class="process-manager-split">
        <div class="process-manager-list-pane">
          <div class="organisation-section-heading">
            <span>Layers</span>
            <button id="process-manager-new-layer" class="toolbar-button" type="button">New Layer</button>
          </div>
          <div class="organisation-list">${rows}</div>
        </div>

        <div class="process-manager-editor-pane">
          ${this.renderLayerForm(selected)}
        </div>
      </div>
    `;
  }

  private renderLayerForm(layer: ProcessLayer | null): string {
    return `
      <form id="process-manager-layer-form" class="organisation-form process-manager-form">
        <div class="organisation-editor-heading">${layer ? 'Edit layer' : 'Add layer'}</div>
        ${layer ? `<div class="organisation-record-id">${escapeHtml(layer.id)}</div>` : ''}

        <label class="metadata-field">
          <span>Code</span>
          <input id="process-manager-layer-code" type="text" required value="${escapeHtml(layer?.code ?? '')}" placeholder="e.g. L3" />
        </label>

        <label class="metadata-field">
          <span>Name</span>
          <input id="process-manager-layer-name" type="text" required value="${escapeHtml(layer?.name ?? '')}" placeholder="e.g. Operational procedure" />
        </label>

        <label class="metadata-field">
          <span>Description</span>
          <textarea id="process-manager-layer-description" rows="4">${escapeHtml(layer?.description ?? '')}</textarea>
        </label>

        <label class="metadata-field">
          <span>Sequence</span>
          <input id="process-manager-layer-sequence" type="number" step="1" value="${layer?.sequence ?? this.getNextLayerSequence()}" />
        </label>

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="process-manager-layer-active" type="checkbox"${layer?.active !== false ? ' checked' : ''} />
          <span>Active</span>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${layer ? 'Save Layer' : 'Add Layer'}</button>
          ${layer ? '<button id="process-manager-delete-layer" class="toolbar-button toolbar-button-danger" type="button">Delete Layer</button>' : ''}
        </div>
      </form>
    `;
  }

  private getNextLayerSequence(): number {
    const sequences = this.snapshot.layers.layers.map((layer) => layer.sequence);
    return sequences.length === 0 ? 0 : Math.max(...sequences) + 10;
  }

  private bindCommonEvents(): void {
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-process-manager-tab]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const tab = button.dataset.processManagerTab;
          if (tab !== 'library' && tab !== 'layers') {
            return;
          }
          this.activeTab = tab;
          this.render();
        });
      });

    this.root.querySelector<HTMLButtonElement>('#process-manager-close')
      ?.addEventListener('click', () => this.dialog.close());

    this.root.querySelector<HTMLButtonElement>('#process-manager-export-catalog')
      ?.addEventListener('click', () => {
        exportProcessRepositoryJson(
          'process-catalog.json',
          this.snapshot.catalog as ProcessCatalogData,
        );
      });

    this.root.querySelector<HTMLButtonElement>('#process-manager-export-layers')
      ?.addEventListener('click', () => {
        exportProcessRepositoryJson(
          'process-layers.json',
          this.snapshot.layers as ProcessLayersData,
        );
      });

    this.root.querySelector<HTMLButtonElement>('#process-manager-reset')
      ?.addEventListener('click', () => void this.reset());
  }

  private bindLibraryEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#process-manager-new-process')
      ?.addEventListener('click', () => {
        this.selectedProcessId = null;
        this.render();
      });

    this.root.querySelectorAll<HTMLButtonElement>('[data-edit-process]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          this.selectedProcessId = button.dataset.editProcess ?? null;
          this.render();
        });
      });

    this.root.querySelector<HTMLFormElement>('#process-manager-process-form')
      ?.addEventListener('submit', (event) => {
        event.preventDefault();
        this.saveProcess();
      });

    this.root.querySelector<HTMLButtonElement>('#process-manager-open-process')
      ?.addEventListener('click', () => {
        if (!this.selectedProcessId) {
          return;
        }

        const processId = this.selectedProcessId;
        this.dialog.close();
        document.dispatchEvent(new CustomEvent('enterprise-modeler:open-process', {
          detail: { processId },
        }));
      });
  }

  private saveProcess(): void {
    const name = getInputValue(this.root, 'process-manager-process-name');
    const layerId = getInputValue(this.root, 'process-manager-process-layer');

    if (!name || !layerId) {
      window.alert('Process name and layer are required.');
      return;
    }

    const existing = this.selectedProcessId
      ? this.snapshot.catalog.processes.find((process) => process.id === this.selectedProcessId)
      : undefined;

    const id = existing?.id ?? generateProcessId(name);
    const filename = getInputValue(this.root, 'process-manager-process-filename') || `${id}.bpmn`;
    const bpmnProcessId = getInputValue(this.root, 'process-manager-process-bpmn-id') || toBpmnProcessId(id);
    const url = getInputValue(this.root, 'process-manager-process-url') || `/processes/custom/${filename}`;
    const metadataUrl = getInputValue(this.root, 'process-manager-process-metadata-url') || `/metadata/custom/${id}.json`;
    const parentId = getInputValue(this.root, 'process-manager-process-parent') || undefined;
    const active = this.root.querySelector<HTMLInputElement>('#process-manager-process-active')?.checked ?? true;
    const makeHome = this.root.querySelector<HTMLInputElement>('#process-manager-process-home')?.checked ?? false;

    if (
      this.snapshot.catalog.processes.some(
        (process) => process.id !== id && process.bpmnProcessId === bpmnProcessId,
      )
    ) {
      window.alert(`BPMN process ID ${bpmnProcessId} is already used by another process.`);
      return;
    }

    const process: ProcessDefinitionRecord = {
      id,
      bpmnProcessId,
      name,
      layerId,
      filename,
      url,
      metadataUrl,
      parentId,
      active,
    };

    if (existing) {
      Object.assign(existing, process);
    } else {
      this.snapshot.catalog.processes.push(process);
      seedNewProcessDraft(process);
    }

    if (makeHome || !this.snapshot.catalog.rootProcessId) {
      this.snapshot.catalog.rootProcessId = process.id;
    } else if (this.snapshot.catalog.rootProcessId === process.id && !active) {
      window.alert('The home process cannot be made inactive. Select another home process first.');
      process.active = true;
    }

    this.selectedProcessId = process.id;
    this.persist();
    this.render();
  }

  private bindLayerEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#process-manager-new-layer')
      ?.addEventListener('click', () => {
        this.selectedLayerId = null;
        this.render();
      });

    this.root.querySelectorAll<HTMLButtonElement>('[data-edit-process-layer]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          this.selectedLayerId = button.dataset.editProcessLayer ?? null;
          this.render();
        });
      });

    this.root.querySelector<HTMLFormElement>('#process-manager-layer-form')
      ?.addEventListener('submit', (event) => {
        event.preventDefault();
        this.saveLayer();
      });

    this.root.querySelector<HTMLButtonElement>('#process-manager-delete-layer')
      ?.addEventListener('click', () => this.deleteLayer());
  }

  private saveLayer(): void {
    const code = getInputValue(this.root, 'process-manager-layer-code');
    const name = getInputValue(this.root, 'process-manager-layer-name');

    if (!code || !name) {
      window.alert('Layer code and name are required.');
      return;
    }

    const existing = this.selectedLayerId
      ? this.snapshot.layers.layers.find((layer) => layer.id === this.selectedLayerId)
      : undefined;

    if (
      this.snapshot.layers.layers.some(
        (layer) => layer.id !== existing?.id && layer.code.toLowerCase() === code.toLowerCase(),
      )
    ) {
      window.alert(`Layer code ${code} already exists.`);
      return;
    }

    const sequenceText = getInputValue(this.root, 'process-manager-layer-sequence');
    const sequence = Number(sequenceText);

    const layer: ProcessLayer = {
      id: existing?.id ?? generateLayerId(code, name),
      code,
      name,
      description: getInputValue(this.root, 'process-manager-layer-description'),
      sequence: Number.isFinite(sequence) ? sequence : this.getNextLayerSequence(),
      active: this.root.querySelector<HTMLInputElement>('#process-manager-layer-active')?.checked ?? true,
    };

    if (existing) {
      Object.assign(existing, layer);
    } else {
      this.snapshot.layers.layers.push(layer);
    }

    this.selectedLayerId = layer.id;
    this.persist();
    this.render();
  }

  private deleteLayer(): void {
    if (!this.selectedLayerId) {
      return;
    }

    const layer = this.snapshot.layers.layers.find(
      (candidate) => candidate.id === this.selectedLayerId,
    );

    if (!layer) {
      return;
    }

    const usedBy = this.snapshot.catalog.processes.filter(
      (process) => process.layerId === layer.id,
    );

    if (usedBy.length > 0) {
      window.alert(
        `${layer.code} cannot be deleted because ${usedBy.length} process${usedBy.length === 1 ? '' : 'es'} still reference it. Reassign those processes first.`,
      );
      return;
    }

    if (!window.confirm(`Delete process layer ${layer.code} — ${layer.name}?`)) {
      return;
    }

    this.snapshot.layers.layers = this.snapshot.layers.layers.filter(
      (candidate) => candidate.id !== layer.id,
    );
    this.selectedLayerId = null;
    this.persist();
    this.render();
  }

  private async reset(): Promise<void> {
    if (!window.confirm(
      'Reset the process catalogue and layer definitions to the repository versions? Local process-library changes will be discarded.',
    )) {
      return;
    }

    try {
      this.snapshot = await resetProcessRepositoryToRepository();
      this.selectedProcessId = null;
      this.selectedLayerId = null;
      notifyRepositoryChanged();
      this.render();
    } catch (error) {
      console.error('Unable to reset process repository.', error);
      window.alert('Unable to reset the process repository.');
    }
  }
}

function initialiseProcessManager(): void {
  const metadataButton = document.querySelector<HTMLButtonElement>('#metadata-button');

  if (!metadataButton) {
    console.warn('Metadata button was not found; Process Manager was not initialised.');
    return;
  }

  new ProcessManager(metadataButton);
}

initialiseProcessManager();
