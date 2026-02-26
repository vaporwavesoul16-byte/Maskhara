import { useState, useRef, useCallback } from 'react';
import { Snapshot } from '../types';

const MAX_HISTORY = 80;

export function useHistory(initial: Snapshot) {
  const [present, setPresent] = useState<Snapshot>(initial);
  const past   = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Debounce timer for text edits
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSnap   = useRef<Snapshot | null>(null);

  const flushPending = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (pendingSnap.current) {
      past.current.push(pendingSnap.current);
      if (past.current.length > MAX_HISTORY) past.current.shift();
      pendingSnap.current = null;
      setCanUndo(true);
    }
  }, []);

  // Immediate snapshot — for moves, resizes, adds, deletes, color changes, status changes
  const saveNow = useCallback((snap: Snapshot) => {
    flushPending();
    past.current.push(snap);
    if (past.current.length > MAX_HISTORY) past.current.shift();
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [flushPending]);

  // Debounced snapshot — for text typing (waits 600ms of silence)
  const saveDebounced = useCallback((snap: Snapshot) => {
    if (!pendingSnap.current) {
      pendingSnap.current = snap; // save the BEFORE state
    }
    future.current = [];
    setCanRedo(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (pendingSnap.current) {
        past.current.push(pendingSnap.current);
        if (past.current.length > MAX_HISTORY) past.current.shift();
        pendingSnap.current = null;
        setCanUndo(true);
      }
      debounceTimer.current = null;
    }, 600);
  }, []);

  const undo = useCallback((current: Snapshot): Snapshot | null => {
    flushPending();
    if (!past.current.length) return null;
    future.current.push(current);
    const snap = past.current.pop()!;
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
    return snap;
  }, [flushPending]);

  const redo = useCallback((current: Snapshot): Snapshot | null => {
    if (!future.current.length) return null;
    past.current.push(current);
    const snap = future.current.pop()!;
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
    return snap;
  }, []);

  return { present, setPresent, saveNow, saveDebounced, undo, redo, canUndo, canRedo };
}
