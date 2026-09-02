import { supabaseAdmin } from './supabase';
import { EventRecord } from './types';

export const DEMO_ADMIN_TOKEN = 'admin_sophia_demo_7721';
export const DEMO_GUEST_TOKEN = 'guest_elena_vance';

export async function ensureDemoEventSeeded(): Promise<EventRecord | null> {
  try {
    // 1. Check if demo event already exists
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
        slug: 'sophia-alexandre-como',
        admin_token: DEMO_ADMIN_TOKEN,
        couple_names: 'Sophia & Alexandre',
        admin_email: 'sophia.alexandre@example.com',
        wedding_date: '2026-09-18',
        rsvp_deadline: '2026-08-18',
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
              { q: 'What is the dress code?', a: 'Black-Tie Optional. Ladies in midi or floor-length gowns; gentlemen in dark suits or tuxedos.' },
              { q: 'How do we reach Villa del Balbianello?', a: 'Complimentary private water taxi service will run continuously from Menaggio and Bellagio docks.' },
              { q: 'Are children invited?', a: 'While we adore your little ones, our celebration is an adults-only gathering.' }
            ]
          },
          travel: {
            hotel_info: 'Grand Hotel Tremezzo & Villa Serbelloni (quote group code AISLE26 for 15% preferred rate).',
            shuttle_info: 'Private Riva motorboat transfers provided between hotels and venue.'
          },
          local_recs: {
            items: [
              { title: 'Bar Il Molo', category: 'Drink', desc: 'Scenic waterfront spritzes in Varenna.' },
              { title: 'Ristorante La Punta', category: 'Dining', desc: 'Fresh lake fish with panoramic views of Lake Como.' }
            ]
          }
        }
      })
      .select()
      .single();

    if (eventErr || !newEvent) {
      console.error('Failed to auto-seed demo event:', eventErr);
      return null;
    }

    const eventId = newEvent.id;

    // 3. Insert Demo Guests (Elena Vance household & others)
    const householdId = 'demo-hh-vance';
    await supabaseAdmin.from('guests').insert([
      {
        event_id: eventId,
        access_token: DEMO_GUEST_TOKEN,
        household_id: householdId,
        first_name: 'Elena',
        last_name: 'Vance',
        email: 'elena.vance@example.com',
        phone: '+14155552671',
        is_vip: true,
        relationship: 'Maid of Honor',
        rsvp_status: 'confirmed',
        dietary_requirements: 'Pescatarian, Gluten-Free',
        plus_one_allowed: true,
        tags: ['vip', 'wedding-party'],
      },
      {
        event_id: eventId,
        access_token: 'gt_marcus_vance',
        household_id: householdId,
        first_name: 'Marcus',
        last_name: 'Vance',
        email: 'marcus.vance@example.com',
        phone: '+14155552672',
        is_vip: true,
        relationship: 'Honored Guest',
        rsvp_status: 'confirmed',
        dietary_requirements: 'None',
        plus_one_allowed: false,
        tags: ['vip'],
      },
      {
        event_id: eventId,
        access_token: 'gt_julian_sterling',
        first_name: 'Julian',
        last_name: 'Sterling',
        email: 'julian.sterling@example.com',
        phone: '+14155559821',
        is_vip: false,
        relationship: 'University Friend',
        rsvp_status: 'pending',
        plus_one_allowed: true,
        tags: ['friend'],
      },
    ]);

    // 4. Insert Demo Schedule Items
    await supabaseAdmin.from('schedule_items').insert([
      {
        event_id: eventId,
        title: 'Sunset Welcome Aperitivo',
        location_name: 'Grand Hotel Tremezzo Terrace',
        start_time: '2026-09-17T17:30:00Z',
        description: 'Aperol spritzes & wood-fired focaccia by the water.',
        is_vip_only: false,
        requires_rsvp: true,
        dress_code: 'Smart Casual Summer Linen',
        display_order: 1,
      },
      {
        event_id: eventId,
        title: 'The Wedding Ceremony',
        location_name: 'Loggia Durini, Villa Balbianello',
        start_time: '2026-09-18T16:00:00Z',
        description: 'Vows overlooking Lake Como followed by garden toasts.',
        is_vip_only: false,
        requires_rsvp: true,
        dress_code: 'Black-Tie Optional',
        display_order: 2,
      },
      {
        event_id: eventId,
        title: 'Reception Dinner & Dancing',
        location_name: 'Glass Pavilion, Villa Balbianello',
        start_time: '2026-09-18T18:30:00Z',
        description: 'Four-course Italian dinner, live jazz, and dancing under the stars.',
        is_vip_only: false,
        requires_rsvp: true,
        dress_code: 'Black-Tie Optional',
        display_order: 3,
      },
    ]);

    // 5. Insert Demo Custom RSVP Questions
    await supabaseAdmin.from('custom_rsvp_questions').insert([
      {
        event_id: eventId,
        prompt: 'Welcome drink preference on arrival?',
        question_type: 'single_choice',
        options: ['Franciacorta Sparkling', 'Classic Aperol Spritz', 'Botanical Fizz (Non-Alcoholic)'],
        is_required: true,
        display_order: 1,
      },
      {
        event_id: eventId,
        prompt: 'Which song is guaranteed to get you dancing?',
        question_type: 'free_text',
        is_required: false,
        display_order: 2,
      },
    ]);

    // 6. Insert Demo Registry Items
    await supabaseAdmin.from('registry_items').insert([
      {
        event_id: eventId,
        title: 'Lake Como Honeymoon Boat Charter',
        description: 'Private vintage Riva wooden speedboat cruise exploring hidden coves and villas.',
        is_cash_fund: true,
        target_amount: 4500,
        current_amount: 2850,
        image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        display_order: 1,
      },
      {
        event_id: eventId,
        title: 'Private Vineyard Tasting & Cellar Tour',
        description: 'A romantic afternoon tasting rare Nebbiolo vintages in Piedmont.',
        is_cash_fund: true,
        target_amount: 1200,
        current_amount: 800,
        image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
        display_order: 2,
      },
    ]);

    // 7. Insert Demo Photos
    await supabaseAdmin.from('photos').insert([
      {
        event_id: eventId,
        image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        caption: 'Sunset over Villa Balbianello',
        is_approved: true,
      },
      {
        event_id: eventId,
        image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
        caption: 'Sophia & Alexandre in Bellagio',
        is_approved: true,
      },
    ]);

    // 8. Insert Demo Planning Tasks
    await supabaseAdmin.from('planning_tasks').insert([
      {
        event_id: eventId,
        title: 'Finalize floral arrangements with Como Botanicals',
        category: 'Styling',
        status: 'completed',
        priority: 'high',
        display_order: 1,
      },
      {
        event_id: eventId,
        title: 'Review private water taxi departure schedule',
        category: 'Logistics',
        status: 'todo',
        priority: 'high',
        display_order: 2,
      },
      {
        event_id: eventId,
        title: 'Send dietary preferences summary to Villa catering team',
        category: 'Catering',
        status: 'todo',
        priority: 'medium',
        display_order: 3,
      },
    ]);

    return newEvent as EventRecord;
  } catch (err) {
    console.error('ensureDemoEventSeeded error:', err);
    return null;
  }
}
