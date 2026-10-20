const PROCESS_RELATIONSHIP_SELECTOR = '.process-relationship-edge';

let scheduled = false;

function scheduleOrthogonalRouting(): void {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    routeRelationshipEdges();
  });
}

function routeRelationshipEdges(): void {
  document.querySelectorAll<SVGPathElement>(PROCESS_RELATIONSHIP_SELECTOR).forEach((edge) => {
    const current = edge.getAttribute('d') ?? '';
    if (!current.includes(' C ')) return;

    const endpoints = parseCubicEndpoints(current);
    if (!endpoints) return;

    const { startX, startY, endX, endY } = endpoints;
    const horizontalDistance = Math.abs(endX - startX);

    let path: string;
    if (horizontalDistance < 12) {
      const bendX = startX + 46;
      path = `M ${startX} ${startY} H ${bendX} V ${endY} H ${endX}`;
    } else {
      const middleX = startX + (endX - startX) / 2;
      path = `M ${startX} ${startY} H ${middleX} V ${endY} H ${endX}`;
    }

    edge.setAttribute('d', path);
    edge.dataset.orthogonal = 'true';
  });
}

function parseCubicEndpoints(path: string): {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
} | null {
  const match = path.match(
    /^M\s*(-?[\d.]+)\s+(-?[\d.]+)\s+C\s*-?[\d.]+\s+-?[\d.]+,\s*-?[\d.]+\s+-?[\d.]+,\s*(-?[\d.]+)\s+(-?[\d.]+)$/i,
  );

  if (!match) return null;

  const startX = Number.parseFloat(match[1] ?? '');
  const startY = Number.parseFloat(match[2] ?? '');
  const endX = Number.parseFloat(match[3] ?? '');
  const endY = Number.parseFloat(match[4] ?? '');

  if (![startX, startY, endX, endY].every(Number.isFinite)) return null;
  return { startX, startY, endX, endY };
}

new MutationObserver(scheduleOrthogonalRouting).observe(document.body, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ['d'],
});

scheduleOrthogonalRouting();
