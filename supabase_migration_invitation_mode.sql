-- Applied to aisleflow-app on 2026-10-24 (migration: invitation_mode).
-- Save-the-date mode (Premium): the same guest link shows a save-the-date until the couple switches to the full invitation.
alter table public.events add column if not exists invitation_mode text not null default 'invitation' check (invitation_mode in ('save_the_date', 'invitation'));
notify pgrst, 'reload schema';
