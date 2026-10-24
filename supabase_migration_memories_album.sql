-- Applied to aisleflow-app on 2026-10-24 (migration: memories_album).
-- Memories (Premium): one random album link per event for photos, messages and voice notes.
alter table public.events add column if not exists album_token text unique;
alter table public.photos add column if not exists uploader_name text;

create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  guest_id uuid references public.guests(id) on delete set null,
  author_name text not null,
  message text,
  voice_url text,
  voice_storage_path text,
  is_approved boolean not null default true,
  created_at timestamptz default now(),
  constraint guestbook_has_content check (message is not null or voice_url is not null)
);
create index if not exists guestbook_entries_event_idx on public.guestbook_entries(event_id, created_at desc);
alter table public.guestbook_entries enable row level security;
notify pgrst, 'reload schema';
