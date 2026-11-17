-- Startovka: uložené závody uživatelů (spustit v Supabase SQL editoru)
create table if not exists public.saved_races (
  user_id uuid not null references auth.users(id) on delete cascade,
  race_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, race_id)
);
alter table public.saved_races enable row level security;
create policy "vlastni zavody - cteni" on public.saved_races for select using (auth.uid() = user_id);
create policy "vlastni zavody - vlozeni" on public.saved_races for insert with check (auth.uid() = user_id);
create policy "vlastni zavody - mazani" on public.saved_races for delete using (auth.uid() = user_id);
