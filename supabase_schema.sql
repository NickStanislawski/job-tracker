-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor > New query).

create table if not exists public.trackers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.trackers enable row level security;

-- A user can only ever see, create, or edit their own tracker row.
create policy "Users can view own tracker"
  on public.trackers for select
  using (auth.uid() = user_id);

create policy "Users can insert own tracker"
  on public.trackers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tracker"
  on public.trackers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Required for the useCloudData realtime subscription (multi-tab / multi-
-- device sync) to receive change events for this table.
alter publication supabase_realtime add table public.trackers;
