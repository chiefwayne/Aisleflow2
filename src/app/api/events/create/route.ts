import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createGuestAccessToken } from '@/lib/guest-access-token';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { couple_names, admin_email, wedding_date, venue_name, venue_address } = body;

    if (!couple_names || !admin_email || !wedding_date || !venue_name || !venue_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const slug =
      couple_names.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
      '-' +
      Math.random().toString(36).substring(2, 6);

    const admin_token = 'admin_' + Math.random().toString(36).substring(2, 14);

    // Calculate default RSVP deadline (30 days before wedding date)
    const weddingDateTime = new Date(wedding_date).getTime();
    const rsvpDeadlineDate = new Date(weddingDateTime - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // 1. Create Event Record
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .insert({
        slug,
        admin_token,
        couple_names,
        admin_email,
        wedding_date,
        rsvp_deadline: rsvpDeadlineDate,
        venue_name,
        venue_address,
        theme_id: 'royal-floral',
        welcome_message: `We are so excited to celebrate our wedding with you at ${venue_name}!`,
        our_story: 'Thank you for being an essential part of our lives and journey together.',
        cover_image_url:
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        venue_image_url:
          'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
        is_live: true,
        is_ready_for_testing: false,
        launch_notes: 'Initial event provisioned. Complete setup wizard before sending invites.',
      })
      .select()
      .single();

    if (eventErr || !event) {
      console.error('Error creating event:', eventErr);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // 2. Create Default Schedule Items
    await supabase.from('schedule_items').insert([
      {
        event_id: event.id,
        title: 'Welcome Drinks & Arrival',
        location_name: venue_name,
        start_time: `${wedding_date}T15:30:00Z`,
        description: 'Welcome cocktails and light passed bites.',
        display_order: 1,
        requires_rsvp: false,
      },
      {
        event_id: event.id,
        title: 'Wedding Ceremony',
        location_name: venue_name,
        start_time: `${wedding_date}T16:30:00Z`,
        description: 'Exchange of vows followed by confetti toss.',
        display_order: 2,
        requires_rsvp: true,
      },
      {
        event_id: event.id,
        title: 'Reception Dinner & Dancing',
        location_name: venue_name,
        start_time: `${wedding_date}T18:00:00Z`,
        description: 'Dinner, toasts, and celebrating late into the evening.',
        display_order: 3,
        requires_rsvp: true,
      },
    ]);

    // 3. Create Default Planning Tasks
    await supabase.from('planning_tasks').insert([
      {
        event_id: event.id,
        title: 'Confirm RSVP deadline and late-response policy',
        category: 'Logistics',
        status: 'todo',
        priority: 'high',
        display_order: 1,
      },
      {
        event_id: event.id,
        title: 'Import or paste your guest list into Guest Registry',
        category: 'Guests',
        status: 'todo',
        priority: 'high',
        display_order: 2,
      },
      {
        event_id: event.id,
        title: 'Review custom RSVP meal and dietary questions',
        category: 'Catering',
        status: 'todo',
        priority: 'medium',
        display_order: 3,
      },
    ]);

    // 4. Create Default Communication Template
    await supabase.from('communication_templates').insert([
      {
        event_id: event.id,
        name: 'Formal Digital Invitation',
        lifecycle_type: 'invitation',
        channel: 'both',
        subject: `You're Invited: ${couple_names}'s Wedding`,
        email_body: `Dear {name},\n\nWe request the pleasure of your company to celebrate our marriage on {eventDate} at {venueName}.\n\nPlease open your personalized portal to RSVP:\n{link}\n\nWith love,\n{coupleNames}`,
        sms_body: `{coupleNames} invite you to celebrate their wedding on {eventDate} at {venueName}. Open your personalized portal to RSVP: {link}`,
      },
    ]);

    // 5. Create Initial Sample VIP Guest
    const sampleGuestToken = createGuestAccessToken();
    await supabase.from('guests').insert({
      event_id: event.id,
      first_name: 'Elena',
      last_name: 'Vance',
      relationship: 'Honored Guest',
      is_vip: true,
      access_token: sampleGuestToken,
      rsvp_status: 'pending',
      plus_one_allowed: true,
      tags: ['vip', 'sample'],
    });

    return NextResponse.json({
      success: true,
      admin_url: `/admin/${admin_token}`,
      event,
    });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
