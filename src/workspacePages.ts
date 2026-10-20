import './workspacePages.css';

const PAGE_DIALOG_CLASSES = new Set([
  'organisation-dialog',
  'process-manager-dialog',
  'org-chart-dialog',
  'process-dashboard-dialog',
  'systems-catalog-dialog',
  'process-relationship-dialog',
  'solution-architecture-dialog',
  'integration-manager-dialog',
  'regulation-manager-dialog',
  'process-versions-dialog',
  'global-search-dialog',
]);

interface DialogMethods {
  show: () => void;
  showModal: () => void;
  close: (returnValue?: string) => void;
}

const workspace = document.querySelector<HTMLElement>('.modeler-workspace');

if (!workspace) {
  console.warn('Enterprise Modeler workspace page host could not initialise because .modeler-workspace was not found.');
} else {
  initialiseWorkspacePages(workspace);
}

function initialiseWorkspacePages(workspaceElement: HTMLElement): void {
  const host = document.createElement('div');
  host.id = 'enterprise-modeler-workspace-page-host';
  host.className = 'enterprise-modeler-workspace-page-host';
  host.hidden = true;
  workspaceElement.appendChild(host);

  const nativeMethods = new WeakMap<HTMLDialogElement, DialogMethods>();
  let activeDialog: HTMLDialogElement | null = null;

  function isMenuPageDialog(dialog: HTMLDialogElement): boolean {
    return [...PAGE_DIALOG_CLASSES].some((className) => dialog.classList.contains(className));
  }

  function closeDialogNatively(dialog: HTMLDialogElement, returnValue?: string): void {
    const methods = nativeMethods.get(dialog);
    if (!methods || !dialog.open) return;
    methods.close(returnValue);
  }

  function showProcessWorkspace(): void {
    if (activeDialog) {
      closeDialogNatively(activeDialog);
      activeDialog = null;
    }

    host.hidden = true;
    workspaceElement.classList.remove('enterprise-modeler-workspace-page-mode');
    document.body.classList.remove('enterprise-modeler-workspace-page-active');
    document.dispatchEvent(new CustomEvent('enterprise-modeler:workspace-page-changed', {
      detail: { page: 'process' },
    }));
  }

  function activatePage(dialog: HTMLDialogElement): void {
    if (activeDialog && activeDialog !== dialog) {
      closeDialogNatively(activeDialog);
    }

    activeDialog = dialog;
    host.hidden = false;
    workspaceElement.classList.add('enterprise-modeler-workspace-page-mode');
    document.body.classList.add('enterprise-modeler-workspace-page-active');

    host.querySelectorAll<HTMLDialogElement>('dialog.enterprise-modeler-workspace-page[open]').forEach((candidate) => {
      if (candidate !== dialog) closeDialogNatively(candidate);
    });

    const methods = nativeMethods.get(dialog);
    if (methods && !dialog.open) methods.show();

    document.dispatchEvent(new CustomEvent('enterprise-modeler:workspace-page-changed', {
      detail: {
        page: dialog.dataset.workspacePageId ?? dialog.className,
      },
    }));
  }

  function adaptDialog(dialog: HTMLDialogElement): void {
    if (!isMenuPageDialog(dialog) || dialog.dataset.workspacePage === 'true') return;

    const methods: DialogMethods = {
      show: dialog.show.bind(dialog),
      showModal: dialog.showModal.bind(dialog),
      close: dialog.close.bind(dialog),
    };
    nativeMethods.set(dialog, methods);

    dialog.dataset.workspacePage = 'true';
    dialog.dataset.workspacePageId = [...PAGE_DIALOG_CLASSES]
      .find((className) => dialog.classList.contains(className)) ?? 'workspace-page';
    dialog.classList.add('enterprise-modeler-workspace-page');
    host.appendChild(dialog);

    Object.defineProperty(dialog, 'showModal', {
      configurable: true,
      value: () => activatePage(dialog),
    });

    Object.defineProperty(dialog, 'show', {
      configurable: true,
      value: () => activatePage(dialog),
    });

    Object.defineProperty(dialog, 'close', {
      configurable: true,
      value: (returnValue?: string) => {
        closeDialogNatively(dialog, returnValue);
        if (activeDialog === dialog) {
          activeDialog = null;
          host.hidden = true;
          workspaceElement.classList.remove('enterprise-modeler-workspace-page-mode');
          document.body.classList.remove('enterprise-modeler-workspace-page-active');
          document.dispatchEvent(new CustomEvent('enterprise-modeler:workspace-page-changed', {
            detail: { page: 'process' },
          }));
        }
      },
    });

    // Existing dialog implementations close themselves when the backdrop is clicked.
    // Embedded pages do not have a backdrop, so prevent blank page clicks from being
    // interpreted as a request to leave the page.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) event.stopImmediatePropagation();
    }, true);
  }

  function scan(): void {
    document.querySelectorAll<HTMLDialogElement>('dialog').forEach(adaptDialog);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { subtree: true, childList: true });
  scan();

  document.addEventListener('enterprise-modeler:open-process', () => showProcessWorkspace(), true);

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest('#home-button, #back-button, .breadcrumb-button')) {
      showProcessWorkspace();
    }
  }, true);
}
