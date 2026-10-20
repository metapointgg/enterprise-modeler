import './processContextPad.css';

interface SelectedNode {
  id: string;
  name: string;
}

const canvas = document.querySelector<HTMLElement>('#canvas');

if (!canvas) {
  console.warn('Enterprise Modeler process Context Pad extension could not initialise because #canvas was not found.');
} else {
  initialiseProcessContextPad(canvas);
}

function initialiseProcessContextPad(canvasElement: HTMLElement): void {
  let injectionScheduled = false;

  function getSelectedNode(): SelectedNode | null {
    const selected = canvasElement.querySelector<HTMLElement>(
      '.djs-element.djs-shape.selected[data-element-id]',
    );

    const id = selected?.dataset.elementId?.trim();
    if (!selected || !id) {
      return null;
    }

    const label = selected.querySelector<SVGTextElement>('.djs-label')
      ?.textContent
      ?.replace(/\s+/g, ' ')
      .trim();

    return {
      id,
      name: label || id,
    };
  }

  function isSupportedNodeType(): boolean {
    const type = document.querySelector<HTMLElement>('#metadata-node-type')
      ?.textContent
      ?.trim()
      .toLowerCase() ?? '';

    return (
      type.endsWith('task') ||
      type.endsWith('event') ||
      type.endsWith('gateway') ||
      type === 'sub process' ||
      type === 'subprocess' ||
      type === 'call activity'
    );
  }

  function dispatchLinkAction(): void {
    const selected = getSelectedNode();
    if (!selected) {
      return;
    }

    document.dispatchEvent(new CustomEvent('enterprise-modeler:link-process-from-context-pad', {
      detail: {
        elementId: selected.id,
        elementName: selected.name,
      },
    }));
  }

  function openMetadataPanel(): void {
    const metadataButton = document.querySelector<HTMLButtonElement>('#metadata-button');
    if (!metadataButton) {
      return;
    }

    if (metadataButton.getAttribute('aria-pressed') !== 'true') {
      metadataButton.click();
    }
  }

  function createContextEntry(
    className: string,
    title: string,
    actionName: string,
    onActivate: () => void,
  ): HTMLDivElement {
    const entry = document.createElement('div');
    entry.className = `entry ${className}`;
    entry.title = title;
    entry.dataset.action = actionName;
    entry.setAttribute('role', 'button');
    entry.setAttribute('tabindex', '0');
    entry.setAttribute('aria-label', title);

    entry.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onActivate();
    });

    entry.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onActivate();
    });

    return entry;
  }

  function injectEntries(): void {
    injectionScheduled = false;

    const contextPad = canvasElement.querySelector<HTMLElement>('.djs-context-pad');
    if (!contextPad || !getSelectedNode() || !isSupportedNodeType()) {
      return;
    }

    if (!contextPad.querySelector('[data-action="enterprise-modeler-link-process"]')) {
      contextPad.appendChild(createContextEntry(
        'bpmn-icon-call-activity enterprise-modeler-link-process-entry',
        'Link to Process',
        'enterprise-modeler-link-process',
        dispatchLinkAction,
      ));
    }

    if (!contextPad.querySelector('[data-action="enterprise-modeler-view-metadata"]')) {
      const metadataEntry = createContextEntry(
        'enterprise-modeler-metadata-entry',
        'View Metadata',
        'enterprise-modeler-view-metadata',
        openMetadataPanel,
      );
      metadataEntry.textContent = 'i';
      contextPad.appendChild(metadataEntry);
    }
  }

  function scheduleInjection(): void {
    if (injectionScheduled) {
      return;
    }

    injectionScheduled = true;
    window.requestAnimationFrame(injectEntries);
  }

  const observer = new MutationObserver(scheduleInjection);
  observer.observe(canvasElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  canvasElement.addEventListener('pointerup', scheduleInjection);
  canvasElement.addEventListener('keyup', scheduleInjection);

  scheduleInjection();
}
