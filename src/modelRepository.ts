const configuredModelRoot = String(import.meta.env.VITE_MODEL_ROOT ?? '').trim();

export const MODEL_ROOT = normaliseRoot(configuredModelRoot);
export const MODEL_NAMESPACE = MODEL_ROOT ? MODEL_ROOT.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') : 'default';

export function modelUrl(path: string): string {
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  if (!MODEL_ROOT) return normalisedPath;
  if (normalisedPath === MODEL_ROOT || normalisedPath.startsWith(`${MODEL_ROOT}/`)) return normalisedPath;
  return `${MODEL_ROOT}${normalisedPath}`;
}

function normaliseRoot(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}
