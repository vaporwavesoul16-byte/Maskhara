import { useEffect, useRef, useState, useCallback } from 'react';
import { Snapshot } from '../types';
import { loadBoard, saveBoard, subscribeToBoard, isConfigured } from '../utils/db';

export type SyncStatus = 'loading' | 'saved' | 'saving' | 'unsaved' | 'offline' | 'unconfigured';

interface UseSyncOptions {
  boardTitle: string;
  onLoad: (snapshot: Snapshot, title: string) => void;
  onRemoteUpdate: (snapshot: Snapshot, title: string) => void;
}

// Debounce delay — saves 2s after last change
const SAVE_DELAY = 2000;

export function useSync({ boardTitle, onLoad, onRemoteUpdate }: UseSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>('loading');
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved  = useRef<string>(''); // stringified last saved snapshot
  const isRemoteUpdate = useRef(false);  // flag to skip re-saving incoming remote changes
  const boardTitleRef = useRef(boardTitle);
  boardTitleRef.current = boardTitle;

  // Initial load
  useEffect(() => {
    if (!isConfigured()) { setStatus('unconfigured'); return; }
    loadBoard().then(result => {
      if (result) {
        lastSaved.current = JSON.stringify(result.snapshot);
        isRemoteUpdate.current = true;
        onLoad(result.snapshot, result.title);
        isRemoteUpdate.current = false;
        setStatus('saved');
      } else {
        // No existing board — board is new, will save on first change
        setStatus('unsaved');
      }
    }).catch(() => setStatus('offline'));
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!isConfigured()) return;
    const unsub = subscribeToBoard((snapshot, title) => {
      const incoming = JSON.stringify(snapshot);
      if (incoming === lastSaved.current) return; // already have this
      lastSaved.current = incoming;
      isRemoteUpdate.current = true;
      onRemoteUpdate(snapshot, title);
      isRemoteUpdate.current = false;
      setStatus('saved');
    });
    return unsub;
  }, []);

  // Call this whenever local state changes
  const markDirty = useCallback((snapshot: Snapshot) => {
    if (isRemoteUpdate.current) return; // don't save incoming remote changes
    if (!isConfigured()) return;

    const current = JSON.stringify(snapshot);
    if (current === lastSaved.current) return; // no actual change

    setStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setStatus('saving');
      const ok = await saveBoard(boardTitleRef.current, snapshot);
      if (ok) {
        lastSaved.current = current;
        setStatus('saved');
      } else {
        setStatus('offline');
      }
    }, SAVE_DELAY);
  }, []);

  // Force immediate save (e.g. before browser close)
  const saveNow = useCallback(async (snapshot: Snapshot) => {
    if (!isConfigured()) return;
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    setStatus('saving');
    const ok = await saveBoard(boardTitleRef.current, snapshot);
    if (ok) { lastSaved.current = JSON.stringify(snapshot); setStatus('saved'); }
    else setStatus('offline');
  }, []);

  return { status, markDirty, saveNow };
}
