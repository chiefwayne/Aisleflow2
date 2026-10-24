-- Applied to aisleflow-app on 2026-10-24 (migration: custom_slug).
-- Custom short link (Premium): /i/<custom_slug> shows the public invitation without RSVP.
alter table public.events add column if not exists custom_slug text unique check (custom_slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$');
notify pgrst, 'reload schema';
