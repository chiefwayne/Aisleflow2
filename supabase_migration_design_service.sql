-- Applied to aisleflow-app on 2026-10-24 (migration: design_service_requests).
-- Done-for-you design: couples ask the AisleFlow team to design their invitation; the owner quotes and builds it.
create table if not exists public.design_service_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  contact_email text not null,
  details text not null,
  inspiration text,
  status text not null default 'new' check (status in ('new', 'quoted', 'in_progress', 'done', 'declined')),
  created_at timestamptz default now()
);
create index if not exists design_service_requests_status_idx on public.design_service_requests(status, created_at desc);
alter table public.design_service_requests enable row level security;
notify pgrst, 'reload schema';
