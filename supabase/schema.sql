-- StudySprint Supabase account sync schema
create table if not exists public.study_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.study_data enable row level security;
drop policy if exists "study_data_select_own" on public.study_data;
drop policy if exists "study_data_insert_own" on public.study_data;
drop policy if exists "study_data_update_own" on public.study_data;
drop policy if exists "study_data_delete_own" on public.study_data;
create policy "study_data_select_own" on public.study_data for select using (auth.uid() = user_id);
create policy "study_data_insert_own" on public.study_data for insert with check (auth.uid() = user_id);
create policy "study_data_update_own" on public.study_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "study_data_delete_own" on public.study_data for delete using (auth.uid() = user_id);
create index if not exists study_data_updated_at_idx on public.study_data(updated_at);
