-- Startovka: uložené závody uživatelů (nasazeno v projektu vgocmdiaugdnmhjhalgw)
create table if not exists public.saved_races (
  user_id uuid not null references auth.users(id) on delete cascade,
  race_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, race_id)
);
alter table public.saved_races enable row level security;
create policy "vlastni zavody - cteni" on public.saved_races for select to authenticated using ((select auth.uid()) = user_id);
create policy "vlastni zavody - vlozeni" on public.saved_races for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "vlastni zavody - mazani" on public.saved_races for delete to authenticated using ((select auth.uid()) = user_id);
