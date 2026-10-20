import './repositorySyncUi.css';

import {
  isRemoteRepositoryEnabled,
  type RepositorySyncEventDetail,
} from './repositoryTransport';

let banner: HTMLElement | null = null;
let blockingConflict: RepositorySyncEventDetail | null = null;

export async function initialiseRepositorySyncUi(): Promise<void> {
  if (!await isRemoteRepositoryEnabled()) return;

  ensureStatusElement();
  updateFooter();

  document.addEventListener('enterprise-modeler:repository-sync-status', (event) => {
    const detail = (event as CustomEvent<RepositorySyncEventDetail>).detail;
    if (!detail) return;
    renderStatus(detail);
  });
}

function ensureStatusElement(): HTMLElement | null {
  const details = document.querySelector<HTMLElement>('.auth-user-details');
  if (!details) return null;

  const existing = details.querySelector<HTMLElement>('.auth-repository-status');
  if (existing) return existing;

  const status = document.createElement('small');
  status.className = 'auth-repository-status';
  status.dataset.state = 'synced';
  status.textContent = 'Shared repository ready';
  details.appendChild(status);
  return status;
}

function renderStatus(detail: RepositorySyncEventDetail): void {
  if (detail.state === 'conflict') blockingConflict = detail;
  const displayDetail = blockingConflict ?? detail;

  const status = ensureStatusElement();
  if (status) {
    status.dataset.state = displayDetail.state;
    status.textContent = displayDetail.message;
    status.title = displayDetail.key;
  }

  if (blockingConflict) {
    showBanner(blockingConflict);
    return;
  }

  if (detail.state === 'error') showBanner(detail);
  else if (detail.state === 'synced') dismissBanner();
}

function showBanner(detail: RepositorySyncEventDetail): void {
  if (banner?.dataset.key === detail.key && banner.dataset.state === detail.state) return;
  dismissBanner();

  banner = document.createElement('div');
  banner.className = 'repository-sync-banner';
  banner.dataset.state = detail.state;
  banner.dataset.key = detail.key;
  banner.innerHTML = `
    <div>
      <strong>${detail.state === 'conflict' ? 'Shared repository conflict' : 'Repository save failed'}</strong>
      <span>${escapeHtml(detail.message)} <small>${escapeHtml(detail.key)}</small></span>
    </div>
    <button type="button">Reload</button>
  `;

  banner.querySelector<HTMLButtonElement>('button')?.addEventListener('click', () => window.location.reload());
  document.body.appendChild(banner);
}

function dismissBanner(): void {
  banner?.remove();
  banner = null;
}

function updateFooter(): void {
  const footer = document.querySelector<HTMLElement>('.application-footer');
  if (!footer) return;

  const spans = footer.querySelectorAll<HTMLSpanElement>('span');
  if (spans[0]) spans[0].textContent = 'Browser autosave is a working draft for the current session.';
  if (spans[1]) spans[1].textContent = 'The authenticated private S3 repository is the shared system of record.';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
