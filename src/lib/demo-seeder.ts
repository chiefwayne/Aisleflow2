import { supabaseAdmin } from './supabase';
import {
  EventRecord,
  GuestRecord,
  ScheduleItemRecord,
  CustomRsvpQuestionRecord,
  CustomRsvpResponseRecord,
  RegistryItemRecord,
  RegistryContributionRecord,
  PhotoRecord,
  PlanningTaskRecord,
  CommunicationTemplateRecord,
  CommunicationCampaignRecord
} from './types';

export const DEMO_ADMIN_TOKEN = 'admin_sophia_demo_7721';
export const DEMO_GUEST_TOKEN = 'guest_elena_vance';
export const DEMO_EVENT_ID = '00000000-0000-0000-0000-000000000001';

export const MOCK_DEMO_EVENT: EventRecord = {
  id: DEMO_EVENT_ID,
  slug: 'sophia-alexandre-como',
  admin_token: DEMO_ADMIN_TOKEN,
  couple_names: 'Sophia & Alexandre',
  admin_email: 'sophia.alexandre@example.com',
  wedding_date: '2026-09-18',
  rsvp_deadline: '2026-08-18',
  allow_late_rsvp: true,
  venue_name: 'Villa del Balbianello',
  venue_address: 'Lenno, Lake Como, Italy',
  theme_id: 'royal-floral',
  welcome_message: 'We request the honour of your presence at the celebration of our marriage on Lake Como.',
  our_story: 'From our first sunset espresso overlooking Bellagio to a lifetime of adventures together. We cannot wait to celebrate this intimate chapter with our favorite people.',
  dress_code: 'Black-Tie Optional · Earthy Summer Elegance',
  travel_info: 'Private water taxis will depart from Menaggio Pier starting at 3:30 PM. Accommodations reserved at Grand Hotel Tremezzo.',
  cover_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  story_image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
  venue_image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
  is_live: true,
  is_ready_for_testing: true,
  theme_config: {
    accent_color: '#9E5A44',
    bg_color: '#FAF7F2',
    text_color: '#2C2523',
    surface_color: '#FFFFFF',
    border_color: '#E8E0D7',
    font_family: 'classic-serif',
    opening_style: 'wax-seal',
    floron: '❦',
    eyebrow_text: 'Among the camellias & old oaks',
    poetic_line: 'A garden in bloom, a love in flower',
    invitation_phrase: 'request the honour of your presence at the celebration of their marriage',
  },
  custom_sections: {
    faq: {
      items: [
        { question: 'What is the dress code?', answer: 'Black-Tie Optional. Ladies in midi or floor-length gowns; gentlemen in dark suits or tuxedos.' },
        { question: 'How do we reach Villa del Balbianello?', answer: 'Complimentary private water taxi service will run continuously from Menaggio and Bellagio docks.' },
        { question: 'Are children invited?', answer: 'While we adore your little ones, our celebration is an adults-only gathering.' }
      ]
    },
    travel: {
      hotel_info: 'Grand Hotel Tremezzo & Villa Serbelloni (quote group code AISLE26 for 15% preferred rate).',
      shuttle_info: 'Private Riva motorboat transfers provided between hotels and venue.'
    },
    local_recs: {
      items: [
        { name: 'Bar Il Molo', type: 'Drink', description: 'Scenic waterfront spritzes in Varenna.' },
        { name: 'Ristorante La Punta', type: 'Dining', description: 'Fresh lake fish with panoramic views of Lake Como.' }
      ]
    },
    registry: {
      enabled: true,
      venmo_handle: 'Sophia-Alexandre',
      zelle_info: 'sophia.como26@example.com',
      cashapp_tag: 'SophiaComo',
      payout_note: 'If sending via Venmo or Zelle, please include your name so we can properly thank you!'
    }
  },
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z'
};

export const MOCK_DEMO_GUESTS: GuestRecord[] = [
  {
    id: 'demo-guest-elena',
    event_id: DEMO_EVENT_ID,
    access_token: DEMO_GUEST_TOKEN,
    party_id: 'demo-hh-vance',
    party_name: 'The Vance Family',
    first_name: 'Elena',
    last_name: 'Vance',
    email: 'elena.vance@example.com',
    phone: '+14155552671',
    is_vip: true,
    relationship: 'Maid of Honor',
    rsvp_status: 'attending',
    dietary_notes: 'Pescatarian, Gluten-Free',
    plus_one_allowed: true,
    tags: ['vip', 'wedding-party'],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'demo-guest-marcus',
    event_id: DEMO_EVENT_ID,
    access_token: 'gt_marcus_vance',
    party_id: 'demo-hh-vance',
    party_name: 'The Vance Family',
    first_name: 'Marcus',
    last_name: 'Vance',
    email: 'marcus.vance@example.com',
    phone: '+14155552672',
    is_vip: true,
    relationship: 'Honored Guest',
    rsvp_status: 'attending',
    dietary_notes: 'None',
    plus_one_allowed: false,
    tags: ['vip'],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'demo-guest-julian',
    event_id: DEMO_EVENT_ID,
    access_token: 'gt_julian_sterling',
    first_name: 'Julian',
    last_name: 'Sterling',
    email: 'julian.sterling@example.com',
    phone: '+14155559821',
    is_vip: false,
    relationship: 'University Friend',
    rsvp_status: 'pending',
    dietary_notes: '',
    plus_one_allowed: true,
    tags: ['friend'],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
];

export const MOCK_DEMO_SCHEDULE: ScheduleItemRecord[] = [
  {
    id: 'demo-sched-1',
    event_id: DEMO_EVENT_ID,
    title: 'Sunset Welcome Aperitivo',
    location_name: 'Grand Hotel Tremezzo Terrace',
    start_time: '2026-09-17T17:30:00Z',
    description: 'Aperol spritzes & wood-fired focaccia by the water.',
    is_vip_only: false,
    requires_rsvp: true,
    dress_code: 'Smart Casual Summer Linen',
    display_order: 1,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'demo-sched-2',
    event_id: DEMO_EVENT_ID,
    title: 'The Wedding Ceremony',
    location_name: 'Loggia Durini, Villa Balbianello',
    start_time: '2026-09-18T16:00:00Z',
    description: 'Vows overlooking Lake Como followed by garden toasts.',
    is_vip_only: false,
    requires_rsvp: true,
    dress_code: 'Black-Tie Optional',
    display_order: 2,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'demo-sched-3',
    event_id: DEMO_EVENT_ID,
    title: 'Reception Dinner & Dancing',
    location_name: 'Glass Pavilion, Villa Balbianello',
    start_time: '2026-09-18T18:30:00Z',
    description: 'Four-course Italian dinner, live jazz, and dancing under the stars.',
    is_vip_only: false,
    requires_rsvp: true,
    dress_code: 'Black-Tie Optional',
    display_order: 3,
    created_at: '2026-03-01T00:00:00Z',
  },
];

export const MOCK_DEMO_QUESTIONS: CustomRsvpQuestionRecord[] = [
  {
    id: 'demo-q-1',
    event_id: DEMO_EVENT_ID,
    prompt: 'Welcome drink preference on arrival?',
    question_type: 'single_choice',
    options: ['Franciacorta Sparkling', 'Classic Aperol Spritz', 'Botanical Fizz (Non-Alcoholic)'],
    is_required: true,
    display_order: 1,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'demo-q-2',
    event_id: DEMO_EVENT_ID,
    prompt: 'Which song is guaranteed to get you dancing?',
    question_type: 'text',
    options: [],
    is_required: false,
    display_order: 2,
    created_at: '2026-03-01T00:00:00Z',
  },
];

export const MOCK_DEMO_RESPONSES: CustomRsvpResponseRecord[] = [
  {
    id: 'demo-resp-1',
    guest_id: 'demo-guest-elena',
    question_id: 'demo-q-1',
    response_value: 'Franciacorta Sparkling',
    created_at: '2026-03-01T00:00:00Z',
  },
];

export const MOCK_DEMO_REGISTRY: RegistryItemRecord[] = [
  {
    id: 'demo-reg-1',
    event_id: DEMO_EVENT_ID,
    title: 'Lake Como Honeymoon Boat Charter',
    description: 'Private vintage Riva wooden speedboat cruise exploring hidden coves and villas.',
    is_cash_fund: true,
    target_amount: 4500,
    current_amount: 2850,
    display_order: 1,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'demo-reg-2',
    event_id: DEMO_EVENT_ID,
    title: 'Private Vineyard Tasting & Cellar Tour',
    description: 'A romantic afternoon tasting rare Nebbiolo vintages in Piedmont.',
    is_cash_fund: true,
    target_amount: 1200,
    current_amount: 800,
    display_order: 2,
    created_at: '2026-03-01T00:00:00Z',
  },
];

export const MOCK_DEMO_CONTRIBUTIONS: RegistryContributionRecord[] = [];

export const MOCK_DEMO_PHOTOS: PhotoRecord[] = [
  {
    id: 'demo-photo-1',
    event_id: DEMO_EVENT_ID,
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    caption: 'Sunset over Villa Balbianello',
    is_approved: true,
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'demo-photo-2',
    event_id: DEMO_EVENT_ID,
    image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    caption: 'Sophia & Alexandre in Bellagio',
    is_approved: true,
    created_at: '2026-03-01T00:00:00Z',
  },
];

export const MOCK_DEMO_TASKS: PlanningTaskRecord[] = [
  {
    id: 'demo-task-1',
    event_id: DEMO_EVENT_ID,
    title: 'Finalize floral arrangements with Como Botanicals',
    category: 'Styling',
    status: 'done',
    priority: 'high',
    display_order: 1,
  },
  {
    id: 'demo-task-2',
    event_id: DEMO_EVENT_ID,
    title: 'Review private water taxi departure schedule',
    category: 'Logistics',
    status: 'todo',
    priority: 'high',
    display_order: 2,
  },
  {
    id: 'demo-task-3',
    event_id: DEMO_EVENT_ID,
    title: 'Send dietary preferences summary to Villa catering team',
    category: 'Catering',
    status: 'todo',
    priority: 'medium',
    display_order: 3,
  },
];

export const MOCK_DEMO_TEMPLATES: CommunicationTemplateRecord[] = [
  {
    id: 'demo-tpl-1',
    event_id: DEMO_EVENT_ID,
    template_key: 'formal_invitation',
    name: 'Formal Digital Invitation',
    lifecycle_type: 'invitation',
    channel: 'both',
    subject: 'Formal Wedding Invitation: Sophia & Alexandre',
    email_body: 'Dear {name},\n\nWe request the honour of your presence at the celebration of our marriage on {eventDate} at {venueName}.\n\nPlease open your personalized portal to RSVP:\n{link}\n\nWith love,\n{coupleNames}',
    sms_body: '{coupleNames} invite you to celebrate their wedding on {eventDate} at {venueName}. Open your personalized portal to RSVP: {link}',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'demo-tpl-2',
    event_id: DEMO_EVENT_ID,
    template_key: 'friendly_reminder',
    name: 'Friendly RSVP Reminder',
    lifecycle_type: 'reminder',
    channel: 'both',
    subject: "Friendly Reminder: RSVP for Sophia & Alexandre's Wedding",
    email_body: 'Dear {name},\n\nThis is a gentle reminder to please confirm your attendance for our wedding by {rsvpDeadline}.\n\nYou can view event details and RSVP in seconds at:\n{link}\n\nWarmly,\n{coupleNames}',
    sms_body: 'Hi {name}! Gentle reminder to confirm your RSVP for {coupleNames}\'s wedding by {rsvpDeadline}. View your details here: {link}',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
];

export const MOCK_DEMO_CAMPAIGNS: CommunicationCampaignRecord[] = [];

export function isDemoEvent(eventId?: string | null, adminToken?: string | null): boolean {
  if (eventId === DEMO_EVENT_ID) return true;
  if (!adminToken) return false;
  return (
    adminToken === DEMO_ADMIN_TOKEN ||
    adminToken.startsWith('admin_sophia_demo') ||
    adminToken.startsWith('demo')
  );
}

export function updateMockDemoEvent(updates: Partial<EventRecord>): EventRecord {
  if (updates.theme_config && MOCK_DEMO_EVENT.theme_config) {
    updates.theme_config = { ...MOCK_DEMO_EVENT.theme_config, ...updates.theme_config };
  }
  if (updates.custom_sections && MOCK_DEMO_EVENT.custom_sections) {
    updates.custom_sections = { ...MOCK_DEMO_EVENT.custom_sections, ...updates.custom_sections };
  }
  Object.assign(MOCK_DEMO_EVENT, updates, { updated_at: new Date().toISOString() });
  return { ...MOCK_DEMO_EVENT };
}

export function getMockDemoData() {
  return {
    event: MOCK_DEMO_EVENT,
    guests: MOCK_DEMO_GUESTS,
    schedule: MOCK_DEMO_SCHEDULE,
    questions: MOCK_DEMO_QUESTIONS,
    responses: MOCK_DEMO_RESPONSES,
    registry: MOCK_DEMO_REGISTRY,
    contributions: MOCK_DEMO_CONTRIBUTIONS,
    photos: MOCK_DEMO_PHOTOS,
    tasks: MOCK_DEMO_TASKS,
    templates: MOCK_DEMO_TEMPLATES,
    campaigns: MOCK_DEMO_CAMPAIGNS,
  };
}

export async function ensureDemoEventSeeded(): Promise<EventRecord> {
  try {
    // 1. Check if demo event already exists in DB
    const { data: existingEvent } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('admin_token', DEMO_ADMIN_TOKEN)
      .maybeSingle();

    if (existingEvent) {
      return existingEvent as EventRecord;
    }

    // 2. Insert Demo Event
    const { data: newEvent, error: eventErr } = await supabaseAdmin
      .from('events')
      .insert({
        slug: MOCK_DEMO_EVENT.slug,
        admin_token: DEMO_ADMIN_TOKEN,
        couple_names: MOCK_DEMO_EVENT.couple_names,
        admin_email: MOCK_DEMO_EVENT.admin_email,
        wedding_date: MOCK_DEMO_EVENT.wedding_date,
        rsvp_deadline: MOCK_DEMO_EVENT.rsvp_deadline,
        venue_name: MOCK_DEMO_EVENT.venue_name,
        venue_address: MOCK_DEMO_EVENT.venue_address,
        theme_id: MOCK_DEMO_EVENT.theme_id,
        welcome_message: MOCK_DEMO_EVENT.welcome_message,
        our_story: MOCK_DEMO_EVENT.our_story,
        dress_code: MOCK_DEMO_EVENT.dress_code,
        travel_info: MOCK_DEMO_EVENT.travel_info,
        cover_image_url: MOCK_DEMO_EVENT.cover_image_url,
        story_image_url: MOCK_DEMO_EVENT.story_image_url,
        venue_image_url: MOCK_DEMO_EVENT.venue_image_url,
        is_live: true,
        is_ready_for_testing: true,
        theme_config: MOCK_DEMO_EVENT.theme_config,
        custom_sections: MOCK_DEMO_EVENT.custom_sections,
      })
      .select()
      .single();

    if (eventErr || !newEvent) {
      console.warn('Could not insert to Supabase DB, falling back to mock demo data:', eventErr?.message || eventErr);
      return MOCK_DEMO_EVENT;
    }

    const eventId = newEvent.id;

    // 3. Insert Demo Guests
    const householdId = 'demo-hh-vance';
    await supabaseAdmin.from('guests').insert(
      MOCK_DEMO_GUESTS.map((g) => ({
        ...g,
        id: undefined,
        event_id: eventId,
      }))
    );

    // 4. Insert Demo Schedule Items
    await supabaseAdmin.from('schedule_items').insert(
      MOCK_DEMO_SCHEDULE.map((s) => ({
        ...s,
        id: undefined,
        event_id: eventId,
      }))
    );

    // 5. Insert Demo Custom RSVP Questions
    await supabaseAdmin.from('custom_rsvp_questions').insert(
      MOCK_DEMO_QUESTIONS.map((q) => ({
        ...q,
        id: undefined,
        event_id: eventId,
      }))
    );

    // 6. Insert Demo Registry Items
    await supabaseAdmin.from('registry_items').insert(
      MOCK_DEMO_REGISTRY.map((r) => ({
        ...r,
        id: undefined,
        event_id: eventId,
      }))
    );

    // 7. Insert Demo Photos
    await supabaseAdmin.from('photos').insert(
      MOCK_DEMO_PHOTOS.map((p) => ({
        ...p,
        id: undefined,
        event_id: eventId,
      }))
    );

    // 8. Insert Demo Planning Tasks
    await supabaseAdmin.from('planning_tasks').insert(
      MOCK_DEMO_TASKS.map((t) => ({
        ...t,
        id: undefined,
        event_id: eventId,
      }))
    );

    // 9. Insert Demo Communication Templates
    await supabaseAdmin.from('communication_templates').insert(
      MOCK_DEMO_TEMPLATES.map((tpl) => ({
        ...tpl,
        id: undefined,
        event_id: eventId,
      }))
    );

    return newEvent as EventRecord;
  } catch (err: any) {
    console.warn('ensureDemoEventSeeded caught error, falling back to mock demo data:', err?.message || err);
    return MOCK_DEMO_EVENT;
  }
}
