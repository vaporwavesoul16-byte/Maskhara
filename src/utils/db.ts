import { createClient } from '@supabase/supabase-js';
import { Snapshot, BoardExport } from '../types';

// These are injected at build time from environment variables
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Board ID — one board per deployment. Change this string to have multiple boards.
export const BOARD_ID = 'maskhara-main';

let _client: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_ANON);
  return _client;
}

export function isConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON);
}

export interface BoardRow {
  id: string;
  board_title: string;
  data: Snapshot;
  updated_at: string;
}

// Load board from Supabase. Returns null if not found or error.
export async function loadBoard(): Promise<{ snapshot: Snapshot; title: string } | null> {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('boards')
    .select('*')
    .eq('id', BOARD_ID)
    .single();
  if (error || !data) return null;
  const row = data as BoardRow;
  return { snapshot: row.data, title: row.board_title };
}

// Save board to Supabase. Uses upsert so it creates or updates.
export async function saveBoard(title: string, snapshot: Snapshot): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  const { error } = await client
    .from('boards')
    .upsert({
      id: BOARD_ID,
      board_title: title,
      data: snapshot,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  return !error;
}

// Subscribe to real-time changes from other clients.
// Returns an unsubscribe function.
export function subscribeToBoard(
  onUpdate: (snapshot: Snapshot, title: string) => void,
): () => void {
  const client = getClient();
  if (!client) return () => {};

  const channel = client
    .channel(`board-${BOARD_ID}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${BOARD_ID}` },
      payload => {
        const row = payload.new as BoardRow;
        if (row?.data) onUpdate(row.data, row.board_title);
      },
    )
    .subscribe();

  return () => { client.removeChannel(channel); };
}
