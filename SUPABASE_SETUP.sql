-- Run this SQL in your Supabase project's SQL Editor
-- Dashboard → SQL Editor → New query → paste this → Run

-- Create the boards table
create table if not exists boards (
  id           text primary key,
  board_title  text not null default 'Maskhara',
  data         jsonb not null default '{}',
  updated_at   timestamptz not null default now()
);

-- Enable Row Level Security (keeps data safe)
alter table boards enable row level security;

-- Allow anyone with the anon key to read and write
-- (This is appropriate for a private team board behind a secret URL)
create policy "Public read"  on boards for select using (true);
create policy "Public write" on boards for insert with check (true);
create policy "Public update" on boards for update using (true);

-- Enable real-time for this table
alter publication supabase_realtime add table boards;
