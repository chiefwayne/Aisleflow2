-- Applied to aisleflow-app on 2026-10-24 (migration: seating_tables).
-- Seating chart (Premium): named tables with capacity; each guest can be assigned a table.
create table if not exists public.seating_tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null,
  capacity integer not null default 8 check (capacity between 1 and 50),
  sort_order integer not null default 0,
  created_at timestamptz default now()
);
create index if not exists seating_tables_event_idx on public.seating_tables(event_id, sort_order);
alter table public.seating_tables enable row level security;
alter table public.guests add column if not exists table_id uuid references public.seating_tables(id) on delete set null;
notify pgrst, 'reload schema';
