import { useEffect, useRef } from 'react';

interface Options {
  onPan: (dx: number, dy: number) => void;
  onPinch: (scale: number, originX: number, originY: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

function midpoint(t1: Touch, t2: Touch) {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
}
function dist(t1: Touch, t2: Touch) {
  const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx*dx + dy*dy);
}

export function useTouch({ onPan, onPinch, containerRef }: Options) {
  const lastTouches = useRef<TouchList | null>(null);
  const lastDist    = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      lastTouches.current = e.touches;
      if (e.touches.length === 2) {
        lastDist.current = dist(e.touches[0], e.touches[1]);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const prev = lastTouches.current;
      if (!prev) return;

      if (e.touches.length === 1 && prev.length === 1) {
        // Single finger pan
        const dx = e.touches[0].clientX - prev[0].clientX;
        const dy = e.touches[0].clientY - prev[0].clientY;
        onPan(dx, dy);

      } else if (e.touches.length === 2 && prev.length >= 1) {
        // Two finger pinch zoom
        const newDist = dist(e.touches[0], e.touches[1]);
        const scale = newDist / (lastDist.current || newDist);
        lastDist.current = newDist;
        const mid = midpoint(e.touches[0], e.touches[1]);
        const rect = el.getBoundingClientRect();
        onPinch(scale, mid.x - rect.left, mid.y - rect.top);

        // Also pan from midpoint movement
        if (prev.length === 2) {
          const prevMid = midpoint(prev[0], prev[1]);
          onPan(mid.x - prevMid.x, mid.y - prevMid.y);
        }
      }

      lastTouches.current = e.touches;
    };

    const onTouchEnd = () => { lastTouches.current = null; };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onPan, onPinch, containerRef]);
}
