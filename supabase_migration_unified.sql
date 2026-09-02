-- ==============================================================================
-- AISLEFLOW UNIFIED DATABASE SCHEMA MIGRATION
-- Enables extensions, creates all tables, foreign keys, cascades, indexes,
-- RLS policies, and provisions storage buckets ('wedding-photos', 'template-media')
-- ==============================================================================

-- Enable UUID and Cryptographic extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. EVENTS TABLE
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  admin_token text not null,
  couple_names text not null,
  partner_one_name text,
  partner_two_name text,
  admin_email text not null,
  wedding_date timestamptz not null,
  rsvp_deadline timestamptz not null,
  allow_late_rsvp boolean default true,
  venue_name text not null,
  venue_address text not null,
  venue_lat numeric,
  venue_lng numeric,
  welcome_message text,
  our_story text,
  cover_image_url text,
  story_image_url text,
  venue_image_url text,
  gallery_image_urls text[] default '{}',
  dress_code text,
  travel_info text,
  custom_domain text,
  theme_id text default 'royal-floral',
  theme_config jsonb default '{}'::jsonb,
  custom_sections jsonb default '{
    "our_story": { "enabled": true, "text": "", "image_url": "" },
    "registry": { "enabled": false, "url": "", "message": "" },
    "travel": { "enabled": false, "hotel_info": "", "shuttle_info": "" },
    "faq": { "enabled": true, "items": [] },
    "local_recs": { "enabled": false, "items": [] },
    "wedding_party": { "enabled": false, "members": [] }
  }'::jsonb,
  is_live boolean default true,
  is_ready_for_testing boolean default false,
  setup_completed boolean default false,
  setup_completed_at timestamptz,
  reminder_last_sent_at timestamptz,
  reminder_last_count integer default 0,
  launch_notes text,
  publish_notes text,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. GUESTS TABLE
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  party_id uuid,
  party_name text,
  access_token text unique not null default ('gt_' || encode(gen_random_bytes(16), 'hex')),
  first_name text not null,
  last_name text,
  name text generated always as (
    case when last_name is not null and last_name != '' then first_name || ' ' || last_name else first_name end
  ) stored,
  email text,
  phone text,
  is_vip boolean default false,
  relationship text,
  mailing_address text,
  connection_to_couple text,
  tags text[] default '{}',
  rsvp_status text check (rsvp_status in ('pending', 'attending', 'declined')) default 'pending',
  meal_choice text,
  dietary_notes text,
  dietary_tags text[] default '{}',
  plus_one_allowed boolean default false,
  plus_one_name text,
  plus_one_meal text,
  plus_one_dietary text,
  invite_sent_at timestamptz,
  invite_last_sent_at timestamptz,
  save_the_date_sent_at timestamptz,
  reminder_sent_at timestamptz,
  last_sent_at timestamptz,
  last_clicked_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. SCHEDULE ITEMS TABLE
create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  title text not null,
  location_name text,
  start_time timestamptz not null,
  end_time timestamptz,
  description text,
  dress_code text,
  is_vip_only boolean default false,
  visibility_tags text[] default '{}',
  requires_rsvp boolean default false,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- 4. GUEST SCHEDULE RSVPS TABLE
create table if not exists public.guest_schedule_rsvps (
  id uuid primary key default gen_random_uuid(),
  schedule_item_id uuid references public.schedule_items(id) on delete cascade not null,
  guest_id uuid references public.guests(id) on delete cascade not null,
  status text check (status in ('attending', 'declined', 'pending')) default 'pending',
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (guest_id, schedule_item_id)
);

-- 5. CUSTOM RSVP QUESTIONS TABLE
create table if not exists public.custom_rsvp_questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  prompt text not null,
  question_type text check (question_type in ('text', 'single_choice', 'multiple_choice')) default 'text',
  options text[] default '{}',
  is_required boolean default false,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- 6. CUSTOM RSVP RESPONSES TABLE
create table if not exists public.custom_rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.custom_rsvp_questions(id) on delete cascade not null,
  guest_id uuid references public.guests(id) on delete cascade not null,
  response_value jsonb not null,
  response_text text,
  created_at timestamptz default now(),
  unique (guest_id, question_id)
);

-- 7. REGISTRY ITEMS TABLE
create table if not exists public.registry_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  title text not null,
  description text,
  external_url text,
  is_cash_fund boolean default false,
  target_amount numeric,
  current_amount numeric default 0,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- 8. REGISTRY CONTRIBUTIONS TABLE
create table if not exists public.registry_contributions (
  id uuid primary key default gen_random_uuid(),
  registry_item_id uuid references public.registry_items(id) on delete cascade not null,
  guest_id uuid references public.guests(id) on delete set null,
  contributor_name text not null,
  amount numeric not null,
  message text,
  created_at timestamptz default now()
);

-- 9. PHOTOS TABLE
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  guest_id uuid references public.guests(id) on delete set null,
  image_url text not null,
  storage_path text,
  caption text,
  is_approved boolean default true,
  created_at timestamptz default now()
);

-- 10. PLANNING TASKS TABLE
create table if not exists public.planning_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  title text not null,
  owner text default 'Couple',
  due_date timestamptz,
  category text default 'General',
  status text check (status in ('todo', 'doing', 'done')) default 'todo',
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  display_order integer default 0,
  created_at timestamptz default now()
);

-- 11. COMMUNICATION TEMPLATES TABLE
create table if not exists public.communication_templates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  template_key text not null,
  name text not null,
  lifecycle_type text not null check (lifecycle_type in ('invitation', 'save_the_date', 'reminder', 'update')),
  channel text not null default 'both' check (channel in ('sms', 'email', 'both')),
  subject text,
  email_body text,
  sms_body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, template_key)
);

-- 12. COMMUNICATION CAMPAIGNS TABLE
create table if not exists public.communication_campaigns (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  template_id uuid references public.communication_templates(id) on delete set null,
  name text not null,
  lifecycle_type text not null check (lifecycle_type in ('invitation', 'save_the_date', 'reminder', 'update')),
  target_audience text not null default 'pending' check (target_audience in ('all', 'pending', 'attending', 'declined', 'vip')),
  channel text not null default 'both' check (channel in ('sms', 'email', 'both')),
  subject text,
  body text,
  sms_body text,
  scheduled_for timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'completed', 'failed')),
  total_recipients integer default 0,
  sent_count integer default 0,
  opened_count integer default 0,
  clicked_count integer default 0,
  qr_scanned_count integer default 0,
  failed_count integer default 0,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 13. COMMUNICATION MESSAGES TABLE
create table if not exists public.communication_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.communication_campaigns(id) on delete set null,
  event_id uuid references public.events(id) on delete cascade not null,
  guest_id uuid references public.guests(id) on delete set null,
  template_id uuid references public.communication_templates(id) on delete set null,
  channel text not null check (channel in ('sms', 'email')),
  recipient_address text not null,
  rendered_subject text,
  rendered_body text,
  tracking_token text unique default ('trk_' || encode(gen_random_bytes(12), 'hex')),
  tracking_url text,
  qr_code_svg text,
  provider_message_id text,
  provider_status text not null default 'queued' check (provider_status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'dry_run')),
  provider_error text,
  status text not null default 'queued',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  qr_scanned_at timestamptz,
  created_at timestamptz default now()
);

-- 14. COMMUNICATION EVENTS AUDIT LOG
create table if not exists public.communication_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.communication_messages(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade not null,
  guest_id uuid references public.guests(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 15. TEMPLATE DESIGNS TABLE
create table if not exists public.template_designs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  taxonomy text default 'Boutique',
  description text,
  best_for text,
  opening_style text default 'wax-seal',
  hero_treatment text default 'paper-frame',
  motif text default 'floral',
  font_family text default 'classic-serif',
  canvas_width text default 'narrow',
  bg_color text default '#FAF4EC',
  text_color text default '#2B2020',
  accent_color text default '#9A4A4A',
  muted_color text default '#8E7770',
  surface_color text default '#FFFDF9',
  border_color text default '#E7D8CE',
  shadow_color text default 'rgba(104, 68, 58, 0.14)',
  page_background_image_url text,
  page_background_mode text default 'none',
  container_surface_color text default '#FFFDF9',
  container_border_color text default '#E7D8CE',
  container_shadow_color text default 'rgba(104, 68, 58, 0.14)',
  container_radius integer default 32,
  container_border_width integer default 1,
  container_layout text default 'card',
  container_padding text default 'balanced',
  text_frame_style text default 'glass',
  text_frame_radius integer default 20,
  text_frame_border_width integer default 1,
  section_order text[] default array['rsvp', 'schedule', 'our-story', 'travel', 'registry', 'faq', 'local-recs', 'wedding-party', 'photos'],
  hidden_sections text[] default '{}',
  section_styles jsonb default '{}'::jsonb,
  per_section_styles jsonb default '{}'::jsonb,
  sample_image_url text,
  eyebrow_text text,
  poetic_line text,
  invitation_phrase text,
  floron text,
  border_flair text default 'double-line',
  is_dark boolean default false,
  status text default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 16. TEMPLATE MEDIA ASSETS TABLE
create table if not exists public.template_media_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text check (category in ('hero', 'background', 'story', 'venue', 'gallery', 'texture', 'other')) default 'other',
  image_url text not null,
  storage_path text,
  content_type text,
  file_size integer,
  created_at timestamptz default now()
);

-- ==============================================================================
-- INDEXES FOR LOW-LATENCY ROUTING & SEARCH
-- ==============================================================================
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_admin_token on public.events(admin_token);
create index if not exists idx_guests_access_token on public.guests(access_token);
create index if not exists idx_guests_event on public.guests(event_id);
create index if not exists idx_guests_phone on public.guests(phone);
create index if not exists idx_guests_email on public.guests(email);
create index if not exists idx_guests_party on public.guests(party_id);
create index if not exists idx_guests_tags on public.guests using gin(tags);
create index if not exists idx_schedule_event on public.schedule_items(event_id);
create index if not exists idx_schedule_visibility_tags on public.schedule_items using gin(visibility_tags);
create index if not exists idx_guest_schedules_rsvp_guest on public.guest_schedule_rsvps(guest_id);
create index if not exists idx_custom_questions_event on public.custom_rsvp_questions(event_id);
create index if not exists idx_custom_responses_guest on public.custom_rsvp_responses(guest_id);
create index if not exists idx_registry_items_event on public.registry_items(event_id);
create index if not exists idx_registry_contributions_item on public.registry_contributions(registry_item_id);
create index if not exists idx_photos_event on public.photos(event_id);
create index if not exists idx_planning_tasks_event on public.planning_tasks(event_id);
create index if not exists idx_comm_templates_event on public.communication_templates(event_id);
create index if not exists idx_comm_campaigns_event_status on public.communication_campaigns(event_id, status, scheduled_for);
create index if not exists idx_comm_messages_event_guest on public.communication_messages(event_id, guest_id);
create index if not exists idx_comm_messages_tracking_token on public.communication_messages(tracking_token);
create index if not exists idx_comm_events_message on public.communication_events(message_id);

-- ==============================================================================
-- STORAGE BUCKET CREATION & RLS POLICIES
-- ==============================================================================
insert into storage.buckets (id, name, public) 
values ('wedding-photos', 'wedding-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('template-media', 'template-media', true)
on conflict (id) do nothing;

create policy "Public Read Access wedding-photos" on storage.objects for select using (bucket_id = 'wedding-photos');
create policy "Anon Upload Access wedding-photos" on storage.objects for insert with check (bucket_id = 'wedding-photos');

create policy "Public Read Access template-media" on storage.objects for select using (bucket_id = 'template-media');
create policy "Anon Upload Access template-media" on storage.objects for insert with check (bucket_id = 'template-media');
