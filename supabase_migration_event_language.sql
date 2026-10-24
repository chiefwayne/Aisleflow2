-- Applied to aisleflow-app on 2026-10-24 (migration: event_language).
-- Language of the fixed wording guests see (the couple's own text is shown as written).
alter table public.events add column if not exists language text not null default 'en' check (language in ('en', 'es', 'fr', 'it', 'pt', 'de'));
notify pgrst, 'reload schema';
