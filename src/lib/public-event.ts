import type { EventRecord } from '@/lib/types';

/** custom_sections the guest page shows; internal ones (planning, website) never leave the server. */
const PUBLIC_SECTIONS = ['our_story', 'registry', 'travel', 'faq', 'local_recs', 'wedding_party', 'menu', 'music'] as const;

/**
 * The event as guests may see it: an allowlist of fields, with admin, billing and internal
 * notes left out. The album link is only kept for invited guests (`includeAlbum`).
 */
export function toPublicEvent(event: EventRecord, { includeAlbum = false } = {}): EventRecord {
  const sections = (event.custom_sections || {}) as Record<string, unknown>;
  const publicSections = Object.fromEntries(PUBLIC_SECTIONS.filter((key) => key in sections).map((key) => [key, sections[key]]));

  return {
    id: event.id,
    slug: '',
    admin_token: '',
    admin_email: '',
    couple_names: event.couple_names,
    wedding_date: event.wedding_date,
    rsvp_deadline: event.rsvp_deadline,
    allow_late_rsvp: event.allow_late_rsvp,
    rsvp_locked: event.rsvp_locked,
    venue_name: event.venue_name,
    venue_address: event.venue_address,
    welcome_message: event.welcome_message,
    our_story: event.our_story,
    cover_image_url: event.cover_image_url,
    story_image_url: event.story_image_url,
    venue_image_url: event.venue_image_url,
    dress_code: event.dress_code,
    travel_info: event.travel_info,
    theme_id: event.theme_id,
    theme_config: event.theme_config,
    custom_sections: publicSections,
    is_live: event.is_live,
    is_ready_for_testing: false,
    plan: event.plan,
    language: event.language,
    invitation_mode: event.invitation_mode,
    album_token: includeAlbum ? event.album_token : null,
    created_at: '',
    updated_at: '',
  };
}
