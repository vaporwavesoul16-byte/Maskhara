export interface SnapGuide {
  type: 'h' | 'v' | 'angle';
  pos?: number; start?: number; end?: number;
  cx?: number; cy?: number; angleDeg?: number; length?: number;
}

export interface SnapResult { x: number; y: number; guides: SnapGuide[]; }

interface Rect { id: string; x: number; y: number; width: number; height: number; }

const THRESHOLD = 8;

function edges(r: Rect) {
  return {
    left: r.x, right: r.x + r.width, centerX: r.x + r.width / 2,
    top: r.y, bottom: r.y + r.height, centerY: r.y + r.height / 2,
  };
}

export function computeSnap(dragging: Rect, others: Rect[], zoom: number): SnapResult {
  const thresh = THRESHOLD / zoom;
  let bestDx = Infinity, bestDy = Infinity;
  const xGuides: SnapGuide[] = [], yGuides: SnapGuide[] = [];

  const d = edges(dragging);
  const xSources = [{ key: 'left', offset: 0 }, { key: 'right', offset: dragging.width }, { key: 'centerX', offset: dragging.width / 2 }] as const;
  const ySources = [{ key: 'top', offset: 0 }, { key: 'bottom', offset: dragging.height }, { key: 'centerY', offset: dragging.height / 2 }] as const;

  for (const other of others) {
    if (other.id === dragging.id) continue;
    const o = edges(other);

    for (const { key } of xSources) {
      for (const target of [o.left, o.right, o.centerX]) {
        const diff = (d as any)[key] - target;
        if (Math.abs(diff) < thresh && Math.abs(diff) < Math.abs(bestDx)) {
          bestDx = diff;
          const top = Math.min(dragging.y, other.y) - 20;
          const bottom = Math.max(dragging.y + dragging.height, other.y + other.height) + 20;
          xGuides.length = 0;
          xGuides.push({ type: 'v', pos: target, start: top, end: bottom });
        }
      }
    }
    for (const { key } of ySources) {
      for (const target of [o.top, o.bottom, o.centerY]) {
        const diff = (d as any)[key] - target;
        if (Math.abs(diff) < thresh && Math.abs(diff) < Math.abs(bestDy)) {
          bestDy = diff;
          const left = Math.min(dragging.x, other.x) - 20;
          const right = Math.max(dragging.x + dragging.width, other.x + other.width) + 20;
          yGuides.length = 0;
          yGuides.push({ type: 'h', pos: target, start: left, end: right });
        }
      }
    }
  }

  const snapX = Math.abs(bestDx) < thresh ? dragging.x - bestDx : dragging.x;
  const snapY = Math.abs(bestDy) < thresh ? dragging.y - bestDy : dragging.y;
  const guides: SnapGuide[] = [];
  if (Math.abs(bestDx) < thresh) guides.push(...xGuides);
  if (Math.abs(bestDy) < thresh) guides.push(...yGuides);

  return { x: snapX, y: snapY, guides };
}

export function computeEdgeSnap(
  edge: string,
  proposed: { x: number; y: number; width: number; height: number },
  others: Rect[], zoom: number, excludeId: string,
): { x: number; y: number; width: number; height: number; guides: SnapGuide[] } {
  const thresh = THRESHOLD / zoom;
  const guides: SnapGuide[] = [];
  let { x, y, width, height } = proposed;

  for (const other of others) {
    if (other.id === excludeId) continue;
    const o = edges(other);
    if (edge.includes('e')) {
      for (const t of [o.left, o.right, o.centerX]) {
        if (Math.abs(x + width - t) < thresh) { width = t - x; guides.push({ type:'v', pos:t, start:Math.min(y,other.y)-20, end:Math.max(y+height,other.y+other.height)+20 }); break; }
      }
    }
    if (edge.includes('s')) {
      for (const t of [o.top, o.bottom, o.centerY]) {
        if (Math.abs(y + height - t) < thresh) { height = t - y; guides.push({ type:'h', pos:t, start:Math.min(x,other.x)-20, end:Math.max(x+width,other.x+other.width)+20 }); break; }
      }
    }
    if (edge.includes('w')) {
      for (const t of [o.left, o.right, o.centerX]) {
        if (Math.abs(x - t) < thresh) { const r=x+width; x=t; width=r-t; guides.push({ type:'v', pos:t, start:Math.min(y,other.y)-20, end:Math.max(y+height,other.y+other.height)+20 }); break; }
      }
    }
    if (edge.includes('n')) {
      for (const t of [o.top, o.bottom, o.centerY]) {
        if (Math.abs(y - t) < thresh) { const b=y+height; y=t; height=b-t; guides.push({ type:'h', pos:t, start:Math.min(x,other.x)-20, end:Math.max(x+width,other.x+other.width)+20 }); break; }
      }
    }
  }
  return { x, y, width, height, guides };
}

// Snap angle to nearest multiple of 15° with 5° tolerance
export function snapAngle(angleDeg: number): { snapped: number; didSnap: boolean } {
  const step = 15;
  const nearest = Math.round(angleDeg / step) * step;
  const diff = Math.abs(angleDeg - nearest);
  if (diff < 5) return { snapped: nearest, didSnap: true };
  return { snapped: angleDeg, didSnap: false };
}

// Snap a point while drawing a shape
export function snapDrawPoint(
  cx: number, cy: number, others: Rect[], zoom: number, excludeId?: string,
): { x: number; y: number; guides: SnapGuide[] } {
  return computeSnap(
    { id: excludeId ?? '__draw__', x: cx - 1, y: cy - 1, width: 2, height: 2 },
    others, zoom,
  );
}
