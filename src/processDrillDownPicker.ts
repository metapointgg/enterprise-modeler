import './processDrillDownPicker.css';

import {
  PROCESS_CATALOG,
  PROCESS_METADATA_AUTOSAVE_PREFIX,
  type ProcessDefinition,
} from './processCatalog';

interface ProcessLink {
  type?: string;
  targetProcessId?: string;
  label?: string;
}

interface NodeMetadata {
  links?: ProcessLink[];
}

interface ProcessMetadata {
  nodes?: Record<string, NodeMetadata>;
}

const canvas = document.querySelector<HTMLElement>('#canvas');

if (!canvas) {
  console.warn('Process drill-down picker could not initialise because #canvas was not found.');
} else {
  initialiseProcessDrillDownPicker(canvas);
}

function initialiseProcessDrillDownPicker(canvasElement: HTMLElement): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'process-drilldown-dialog';
  document.body.appendChild(dialog);

  let repositoryMetadata: ProcessMetadata = { nodes: {} };
  let repositoryProcessId = '';

  async function refreshRepositoryMetadata(): Promise<void> {
    const process = getCurrentProcess();
    if (!process || process.id === repositoryProcessId) {
      return;
    }

    repositoryProcessId = process.id;
    try {
      const response = await fetch(process.metadataUrl, { cache: 'no-store' });
      repositoryMetadata = response.ok
        ? await response.json() as ProcessMetadata
        : { nodes: {} };
    } catch {
      repositoryMetadata = { nodes: {} };
    }
  }

  function getCurrentProcess(): ProcessDefinition | null {
    const name = document.querySelector<HTMLElement>('#document-name')?.textContent?.trim() ?? '';
    const level = document.querySelector<HTMLElement>('#process-level')?.textContent?.trim() ?? '';
    return Object.values(PROCESS_CATALOG).find(
      (process) => process.active && process.name === name && process.level === level,
    ) ?? null;
  }

  function getCurrentMetadata(process: ProcessDefinition): ProcessMetadata {
    const local = localStorage.getItem(`${PROCESS_METADATA_AUTOSAVE_PREFIX}${process.id}`);
    if (local) {
      try {
        return JSON.parse(local) as ProcessMetadata;
      } catch {
        // Fall back to the repository copy already loaded for the process.
      }
    }

    return repositoryProcessId === process.id ? repositoryMetadata : { nodes: {} };
  }

  function getDrillDownTargets(elementId: string): Array<{ process: ProcessDefinition; label: string }> {
    const current = getCurrentProcess();
    if (!current) {
      return [];
    }

    const metadata = getCurrentMetadata(current);
    const links = metadata.nodes?.[elementId]?.links ?? [];

    return links
      .filter((link) => link.type === 'drill-down' && Boolean(link.targetProcessId))
      .map((link) => ({
        process: PROCESS_CATALOG[link.targetProcessId ?? ''],
        label: link.label?.trim() ?? '',
      }))
      .filter((item): item is { process: ProcessDefinition; label: string } => Boolean(item.process?.active));
  }

  function openPicker(elementName: string, targets: Array<{ process: ProcessDefinition; label: string }>): void {
    dialog.innerHTML = `
      <div class="process-drilldown-shell">
        <header class="process-drilldown-header">
          <div>
            <div class="process-drilldown-title">Select Process</div>
            <div class="process-drilldown-subtitle">${escapeHtml(elementName)}</div>
          </div>
          <button class="process-drilldown-close" type="button" aria-label="Close">×</button>
        </header>
        <div class="process-drilldown-options">
          ${targets.map((target) => `
            <button class="process-drilldown-option" type="button" data-process-id="${escapeHtml(target.process.id)}">
              <span class="process-drilldown-level">${escapeHtml(target.process.level)}</span>
              <span class="process-drilldown-copy">
                <strong>${escapeHtml(target.process.name)}</strong>
                ${target.label ? `<small>${escapeHtml(target.label)}</small>` : ''}
              </span>
              <span class="process-drilldown-arrow">→</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    dialog.querySelector<HTMLButtonElement>('.process-drilldown-close')
      ?.addEventListener('click', () => dialog.close());

    dialog.querySelectorAll<HTMLButtonElement>('[data-process-id]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const processId = button.dataset.processId;
          if (!processId) {
            return;
          }
          dialog.close();
          document.dispatchEvent(new CustomEvent('enterprise-modeler:open-process', {
            detail: { processId },
          }));
        });
      });

    dialog.showModal();
  }

  canvasElement.addEventListener('dblclick', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<SVGElement>('.djs-element.djs-shape[data-element-id]')
      : null;
    const elementId = target?.dataset.elementId?.trim() ?? '';
    if (!elementId) {
      return;
    }

    const targets = getDrillDownTargets(elementId);
    if (targets.length < 2) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const label = target?.querySelector<SVGTextElement>('.djs-label')
      ?.textContent
      ?.replace(/\s+/g, ' ')
      .trim() || elementId;

    openPicker(label, targets);
  }, true);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  const status = document.querySelector<HTMLElement>('#status');
  if (status) {
    const observer = new MutationObserver(() => {
      const text = status.textContent?.trim() ?? '';
      if (/^(Process loaded|Restored\b)/i.test(text)) {
        repositoryProcessId = '';
        void refreshRepositoryMetadata();
      }
    });
    observer.observe(status, { subtree: true, childList: true, characterData: true });
  }

  document.addEventListener('enterprise-modeler:process-repository-changed', () => {
    repositoryProcessId = '';
    void refreshRepositoryMetadata();
  });

  window.setTimeout(() => void refreshRepositoryMetadata(), 300);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
