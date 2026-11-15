-- StudySprint account sync schema for Supabase.
-- Run this in the provider's SQL editor after creating the project.
create table if not exists public.study_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.study_data enable row level security;

drop policy if exists "Users can read their own StudySprint data" on public.study_data;
create policy "Users can read their own StudySprint data"
  on public.study_data for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own StudySprint data" on public.study_data;
create policy "Users can insert their own StudySprint data"
  on public.study_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own StudySprint data" on public.study_data;
create policy "Users can update their own StudySprint data"
  on public.study_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists study_data_updated_at_idx on public.study_data(updated_at);
