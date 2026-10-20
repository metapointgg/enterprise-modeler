import './nodeMetadataBpmnLinks.css';

import { findProcessByBpmnId } from './processCatalog';

let scheduled = false;

function scheduleEnhancement(): void {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    enhanceBpmnCallLink();
  });
}

function enhanceBpmnCallLink(): void {
  const linksContainer = document.querySelector<HTMLDivElement>('#metadata-process-links');
  const calledElementRow = document.querySelector<HTMLElement>('#metadata-called-element-row');
  const calledElementInput = document.querySelector<HTMLInputElement>('#metadata-called-element');

  if (!linksContainer || !calledElementRow || !calledElementInput) return;

  const calledElement = calledElementRow.hidden ? '' : calledElementInput.value.trim();
  const existing = linksContainer.querySelector<HTMLElement>('[data-bpmn-call-link]');

  if (!calledElement) {
    existing?.remove();
    return;
  }

  const target = findProcessByBpmnId(calledElement);
  const targetKey = target?.id ?? calledElement;

  if (existing?.dataset.bpmnCallLink === targetKey) {
    removeMisleadingEmptyMessage(linksContainer);
    return;
  }

  existing?.remove();
  removeMisleadingEmptyMessage(linksContainer);

  const row = document.createElement('div');
  row.className = 'process-link-row bpmn-call-link-row';
  row.dataset.bpmnCallLink = targetKey;

  const copy = document.createElement('div');
  copy.className = 'process-link-copy';

  const primary = document.createElement('div');
  primary.className = 'process-link-primary';
  primary.textContent = `BPMN Call → ${target?.name ?? calledElement}`;

  const secondary = document.createElement('div');
  secondary.className = 'process-link-secondary';
  secondary.textContent = target
    ? `${target.level} · ${calledElement} · Portable BPMN relationship`
    : `${calledElement} · Target process is not currently in the Process Catalogue`;

  copy.append(primary, secondary);
  row.appendChild(copy);

  if (target) {
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'process-link-open';
    open.textContent = 'Open';
    open.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('enterprise-modeler:open-process', {
        detail: { processId: target.id },
      }));
    });
    row.appendChild(open);
  }

  linksContainer.prepend(row);
}

function removeMisleadingEmptyMessage(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('.organisation-muted').forEach((element) => {
    if (element.textContent?.trim() === 'No linked processes.') {
      element.remove();
    }
  });
}

const metadataPanel = document.querySelector<HTMLElement>('#metadata-panel');
if (metadataPanel) {
  new MutationObserver(scheduleEnhancement).observe(metadataPanel, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['hidden'],
  });

  metadataPanel.addEventListener('input', scheduleEnhancement);
  metadataPanel.addEventListener('change', scheduleEnhancement);
  scheduleEnhancement();
}
