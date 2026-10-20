import './processVersions.css';

import {
  PROCESS_BPMN_AUTOSAVE_PREFIX,
  PROCESS_CATALOG,
  PROCESS_METADATA_AUTOSAVE_PREFIX,
  type ProcessDefinition,
} from './processCatalog';

interface ProcessVersionSnapshot {
  id: string;
  revision: number;
  processId: string;
  createdAt: string;
  label: string;
  filename: string;
  bpmnXml: string;
  metadataJson: string;
}

const VERSION_KEY_PREFIX = 'enterprise-modeler.process-versions.v1.';

initialiseProcessVersions();

function initialiseProcessVersions(): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'process-versions-dialog';
  document.body.appendChild(dialog);

  injectSidebarAction();

  const sidebarObserver = new MutationObserver(injectSidebarAction);
  sidebarObserver.observe(document.body, { subtree: true, childList: true });

  async function openHistory(): Promise<void> {
    const process = getCurrentProcess();
    if (!process) {
      window.alert('Open a repository process before viewing version history.');
      return;
    }

    await ensureBaselineVersion(process);
    render(process);
    dialog.showModal();
  }

  function injectSidebarAction(): void {
    const processSection = document.querySelector<HTMLElement>('.enterprise-modeler-sidebar-section[data-section-id="process"] .enterprise-modeler-sidebar-submenu');
    if (!processSection || processSection.querySelector('[data-process-version-history]')) {
      return;
    }

    const button = document.createElement('button');
    button.className = 'enterprise-modeler-sidebar-submenu-button';
    button.type = 'button';
    button.dataset.processVersionHistory = 'true';
    button.textContent = 'Version History';
    button.addEventListener('click', () => void openHistory());
    processSection.appendChild(button);
  }

  function render(process: ProcessDefinition): void {
    const versions = loadVersions(process.id).sort((left, right) => right.revision - left.revision);

    dialog.innerHTML = `
      <div class="process-versions-shell">
        <header class="process-versions-header">
          <div>
            <div class="process-versions-title">Process Version History</div>
            <div class="process-versions-subtitle">${escapeHtml(process.level)} · ${escapeHtml(process.name)}</div>
          </div>
          <button class="process-versions-close" type="button" aria-label="Close">×</button>
        </header>
        <div class="process-versions-toolbar">
          <button class="process-versions-create" type="button">Create Version</button>
          <button class="process-versions-export" type="button">Export History</button>
          <span>${versions.length} version${versions.length === 1 ? '' : 's'}</span>
        </div>
        <div class="process-versions-list">
          ${versions.map((version, index) => `
            <article class="process-version-card${index === 0 ? ' process-version-card-current' : ''}">
              <div class="process-version-number">v${version.revision}</div>
              <div class="process-version-details">
                <strong>${escapeHtml(version.label)}</strong>
                <small>${escapeHtml(formatDate(version.createdAt))}</small>
              </div>
              <div class="process-version-actions">
                <button type="button" data-download-version="${escapeHtml(version.id)}">BPMN</button>
                <button type="button" data-restore-version="${escapeHtml(version.id)}">Restore</button>
              </div>
            </article>
          `).join('')}
        </div>
        <footer class="process-versions-note">
          Working history is stored locally in this browser. Published BPMN and metadata remain versioned by Git when committed to the repository.
        </footer>
      </div>
    `;

    dialog.querySelector<HTMLButtonElement>('.process-versions-close')?.addEventListener('click', () => dialog.close());
    dialog.querySelector<HTMLButtonElement>('.process-versions-create')?.addEventListener('click', async () => {
      const label = window.prompt('Version label / change summary:', 'Manual version')?.trim();
      if (!label) {
        return;
      }
      await createVersion(process, label);
      render(process);
    });
    dialog.querySelector<HTMLButtonElement>('.process-versions-export')?.addEventListener('click', () => exportHistory(process));

    dialog.querySelectorAll<HTMLButtonElement>('[data-restore-version]').forEach((button) => {
      button.addEventListener('click', () => void restoreVersion(process, button.dataset.restoreVersion ?? ''));
    });
    dialog.querySelectorAll<HTMLButtonElement>('[data-download-version]').forEach((button) => {
      button.addEventListener('click', () => downloadVersion(process, button.dataset.downloadVersion ?? ''));
    });
  }

  async function restoreVersion(process: ProcessDefinition, versionId: string): Promise<void> {
    const versions = loadVersions(process.id);
    const selected = versions.find((version) => version.id === versionId);
    if (!selected) {
      return;
    }

    if (!window.confirm(`Restore ${process.name} to v${selected.revision} — ${selected.label}? Current working changes will first be preserved as a version.`)) {
      return;
    }

    await createVersion(process, `Pre-restore backup before v${selected.revision}`);

    localStorage.setItem(`${PROCESS_BPMN_AUTOSAVE_PREFIX}${process.id}.xml`, selected.bpmnXml);
    localStorage.setItem(`${PROCESS_BPMN_AUTOSAVE_PREFIX}${process.id}.filename`, selected.filename);
    localStorage.setItem(`${PROCESS_METADATA_AUTOSAVE_PREFIX}${process.id}`, selected.metadataJson);

    appendSnapshot(process.id, {
      ...selected,
      id: `version-${crypto.randomUUID()}`,
      revision: nextRevision(process.id),
      createdAt: new Date().toISOString(),
      label: `Restored from v${selected.revision}`,
    });

    dialog.close();
    document.dispatchEvent(new CustomEvent('enterprise-modeler:open-process', { detail: { processId: process.id } }));
  }

  async function createVersion(process: ProcessDefinition, label: string): Promise<void> {
    const state = await getCurrentState(process);
    appendSnapshot(process.id, {
      id: `version-${crypto.randomUUID()}`,
      revision: nextRevision(process.id),
      processId: process.id,
      createdAt: new Date().toISOString(),
      label,
      filename: state.filename,
      bpmnXml: state.bpmnXml,
      metadataJson: state.metadataJson,
    });
  }

  async function ensureBaselineVersion(process: ProcessDefinition): Promise<void> {
    if (loadVersions(process.id).length > 0) {
      return;
    }
    await createVersion(process, 'Baseline');
  }

  async function getCurrentState(process: ProcessDefinition): Promise<{ filename: string; bpmnXml: string; metadataJson: string }> {
    const bpmnKey = `${PROCESS_BPMN_AUTOSAVE_PREFIX}${process.id}.xml`;
    const filenameKey = `${PROCESS_BPMN_AUTOSAVE_PREFIX}${process.id}.filename`;
    const metadataKey = `${PROCESS_METADATA_AUTOSAVE_PREFIX}${process.id}`;

    let bpmnXml = localStorage.getItem(bpmnKey) ?? '';
    if (!bpmnXml) {
      const response = await fetch(process.url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Unable to load BPMN for ${process.name}.`);
      }
      bpmnXml = await response.text();
    }

    let metadataJson = localStorage.getItem(metadataKey) ?? '';
    if (!metadataJson) {
      try {
        const response = await fetch(process.metadataUrl, { cache: 'no-store' });
        metadataJson = response.ok ? await response.text() : '{"schemaVersion":3,"nodes":{}}';
      } catch {
        metadataJson = '{"schemaVersion":3,"nodes":{}}';
      }
    }

    return {
      filename: localStorage.getItem(filenameKey) || process.filename,
      bpmnXml,
      metadataJson,
    };
  }

  function getCurrentProcess(): ProcessDefinition | null {
    const name = document.querySelector<HTMLElement>('#document-name')?.textContent?.trim() ?? '';
    const level = document.querySelector<HTMLElement>('#process-level')?.textContent?.trim() ?? '';
    return Object.values(PROCESS_CATALOG).find((process) => process.active && process.name === name && process.level === level) ?? null;
  }

  function loadVersions(processId: string): ProcessVersionSnapshot[] {
    const raw = localStorage.getItem(`${VERSION_KEY_PREFIX}${processId}`);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as ProcessVersionSnapshot[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function appendSnapshot(processId: string, snapshot: ProcessVersionSnapshot): void {
    const versions = loadVersions(processId);
    versions.push(snapshot);
    localStorage.setItem(`${VERSION_KEY_PREFIX}${processId}`, JSON.stringify(versions));
  }

  function nextRevision(processId: string): number {
    return Math.max(0, ...loadVersions(processId).map((version) => version.revision)) + 1;
  }

  function downloadVersion(process: ProcessDefinition, versionId: string): void {
    const version = loadVersions(process.id).find((candidate) => candidate.id === versionId);
    if (!version) {
      return;
    }
    downloadFile(`${process.id}-v${version.revision}.bpmn`, version.bpmnXml, 'application/xml;charset=utf-8');
  }

  function exportHistory(process: ProcessDefinition): void {
    downloadFile(`${process.id}-version-history.json`, `${JSON.stringify(loadVersions(process.id), null, 2)}\n`, 'application/json;charset=utf-8');
  }

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  const status = document.querySelector<HTMLElement>('#status');
  if (status) {
    let lastStatus = '';
    const observer = new MutationObserver(() => {
      const text = status.textContent?.trim() ?? '';
      if (text === lastStatus) {
        return;
      }
      lastStatus = text;
      if (text !== 'BPMN downloaded') {
        return;
      }
      const process = getCurrentProcess();
      if (process) {
        window.setTimeout(() => void createVersion(process, 'Manual BPMN save'), 60);
      }
    });
    observer.observe(status, { subtree: true, childList: true, characterData: true });
  }
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
