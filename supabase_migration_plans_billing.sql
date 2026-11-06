-- Applied to aisleflow-app on 2026-10-24 (migration: plans_and_billing).
-- Plans: free (build and preview), essentials (publish, email), premium (adds SMS, music, Design Studio).
alter table public.events add column if not exists plan text not null default 'free' check (plan in ('free', 'essentials', 'premium'));
alter table public.events add column if not exists plan_activated_at timestamptz;
-- Events that already exist were created before plans; keep them working as Essentials.
update public.events set plan = 'essentials' where plan = 'free';

-- One row per processed Stripe webhook event, so repeat deliveries are ignored.
create table if not exists public.billing_events (
  stripe_event_id text primary key,
  event_id uuid references public.events(id) on delete set null,
  type text not null,
  plan text,
  checkout_session_id text,
  amount_total integer,
  currency text,
  created_at timestamptz default now()
);
alter table public.billing_events enable row level security;
notify pgrst, 'reload schema';
