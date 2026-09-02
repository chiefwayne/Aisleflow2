import React from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GuestPortalView from '@/components/guest/GuestPortalView';
import {
  EventRecord,
  GuestRecord,
  ScheduleItemRecord,
  CustomRsvpQuestionRecord,
  RegistryItemRecord,
  PhotoRecord
} from '@/lib/types';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function GuestPortalPage({ params }: PageProps) {
  const { token } = await params;

  let primaryGuest: GuestRecord | null = null;
  let event: EventRecord | null = null;

  // 1. Try finding Guest by access_token
  const { data: foundGuest } = await supabase
    .from('guests')
    .select('*')
    .eq('access_token', token)
    .maybeSingle();

  if (foundGuest) {
    primaryGuest = foundGuest as GuestRecord;
    const { data: foundEvent } = await supabase
      .from('events')
      .select('*')
      .eq('id', foundGuest.event_id)
      .maybeSingle();
    event = foundEvent as EventRecord | null;
  }

  // 2. If not found by guest access_token, check if token is an admin_token or event slug
  if (!event) {
    const { data: eventByAdminOrSlug } = await supabase
      .from('events')
      .select('*')
      .or(`admin_token.eq.${token},slug.eq.${token}`)
      .maybeSingle();

    if (eventByAdminOrSlug) {
      event = eventByAdminOrSlug as EventRecord;
      const { data: firstGuest } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstGuest) {
        primaryGuest = firstGuest as GuestRecord;
      }
    }
  }

  // 3. Fallback for sample/demo links (e.g. 'guest_elena_vance', 'preview', 'sample')
  if (!event && (token === 'guest_elena_vance' || token.startsWith('demo') || token.startsWith('sample') || token === 'preview')) {
    const { data: latestEvent } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestEvent) {
      event = latestEvent as EventRecord;
      const { data: firstGuest } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstGuest) {
        primaryGuest = firstGuest as GuestRecord;
      }
    }
  }

  // If still no event could be resolved, 404
  if (!event) {
    notFound();
  }

  // If no guest found, provide a mock preview guest
  if (!primaryGuest) {
    primaryGuest = {
      id: 'preview-guest',
      event_id: event.id,
      access_token: token,
      first_name: 'Elena',
      last_name: 'Vance',
      is_vip: true,
      relationship: 'Honored Guest',
      rsvp_status: 'pending',
      plus_one_allowed: true,
      tags: ['vip'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // 4. Fetch Party Members if in party
  let partyMembers: GuestRecord[] = [];
  if (primaryGuest.party_id) {
    const { data: party } = await supabase
      .from('guests')
      .select('*')
      .eq('party_id', primaryGuest.party_id);
    if (party) partyMembers = party as GuestRecord[];
  }

  // 5. Fetch Schedule Items
  const { data: scheduleItems } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  // 6. Fetch Custom RSVP Questions
  const { data: customQuestions } = await supabase
    .from('custom_rsvp_questions')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  // 7. Fetch Registry Items
  const { data: registryItems } = await supabase
    .from('registry_items')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  // 8. Fetch Photos
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  // 9. Fetch existing custom RSVP responses for primary guest
  const { data: customResponses } = await supabase
    .from('custom_rsvp_responses')
    .select('*')
    .eq('guest_id', primaryGuest.id);

  // 10. Fetch existing schedule RSVPs for all party members
  const allGuestIds = [primaryGuest.id, ...partyMembers.map((p) => p.id)].filter(id => id !== 'preview-guest');
  let scheduleRsvps: any[] = [];
  if (allGuestIds.length > 0) {
    const { data: rsvps } = await supabase
      .from('guest_schedule_rsvps')
      .select('*')
      .in('guest_id', allGuestIds);
    if (rsvps) scheduleRsvps = rsvps;
  }

  return (
    <GuestPortalView
      event={event as EventRecord}
      primaryGuest={primaryGuest as GuestRecord}
      partyMembers={partyMembers}
      scheduleItems={(scheduleItems || []) as ScheduleItemRecord[]}
      customQuestions={(customQuestions || []) as CustomRsvpQuestionRecord[]}
      registryItems={(registryItems || []) as RegistryItemRecord[]}
      initialPhotos={(photos || []) as PhotoRecord[]}
      initialResponses={(customResponses || []) as any[]}
      initialScheduleRsvps={scheduleRsvps}
      previewMode={primaryGuest.id === 'preview-guest'}
    />
  );
}
