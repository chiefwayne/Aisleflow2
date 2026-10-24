-- Applied to aisleflow-app on 2026-10-24 (migration: rsvp_lock_and_guest_views).
-- RSVP lock: couples can close replies by hand, in addition to the deadline.
alter table public.events add column if not exists rsvp_locked boolean not null default false;

-- Per-guest link views, so couples see who opened their invitation however it was shared.
alter table public.guests add column if not exists first_viewed_at timestamptz;
alter table public.guests add column if not exists last_viewed_at timestamptz;
alter table public.guests add column if not exists view_count integer not null default 0;
