const REMOVE_SIDEBAR_TARGETS = new Set([
  'back-button',
  'new-button',
  'reset-button',
  'open-button',
  'save-button',
  'svg-button',
]);

function applyUiRefinements(): void {
  document
    .querySelectorAll<HTMLButtonElement>('.enterprise-modeler-sidebar-submenu-button[data-target-button]')
    .forEach((button) => {
      const target = button.dataset.targetButton ?? '';
      if (REMOVE_SIDEBAR_TARGETS.has(target)) {
        button.remove();
        return;
      }
      if (target === 'process-manager-button') {
        button.textContent = 'Process Definitions';
      }
    });

  document.querySelector<HTMLButtonElement>('#process-manager-reset')?.remove();

  const poolEntry = document.querySelector<HTMLElement>(
    '#canvas .djs-palette .entry[data-action="create.participant-expanded"]',
  );
  if (poolEntry) {
    poolEntry.classList.remove('enterprise-modeler-palette-secondary');
    poolEntry.title = 'Create Pool / Participant';
    poolEntry.setAttribute('aria-label', 'Create Pool / Participant');
  }
}

let scheduled = false;

function scheduleUiRefinements(): void {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    applyUiRefinements();
  });
}

const observer = new MutationObserver(scheduleUiRefinements);
observer.observe(document.body, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ['class'],
});

scheduleUiRefinements();
