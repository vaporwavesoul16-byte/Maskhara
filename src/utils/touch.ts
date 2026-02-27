// Touch utility — returns unified touch pan/pinch state

export interface TouchPanState {
  kind: 'touch-pan';
  startTX: number; startTY: number;
  startPX: number; startPY: number;
}

export interface TouchPinchState {
  kind: 'touch-pinch';
  startDist: number;
  startZoom: number;
  startMidX: number; startMidY: number;
  startPX: number; startPY: number;
}

export type TouchState = TouchPanState | TouchPinchState | null;

export function getTouchDist(t1: React.Touch, t2: React.Touch): number {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

export function getTouchMid(t1: React.Touch, t2: React.Touch) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}
