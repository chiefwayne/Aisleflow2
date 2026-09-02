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

  // 1. Fetch Primary Guest by token
  const { data: primaryGuest, error: guestErr } = await supabase
    .from('guests')
    .select('*')
    .eq('access_token', token)
    .single();

  if (guestErr || !primaryGuest) {
    notFound();
  }

  // 2. Fetch Event
  const { data: event, error: eventErr } = await supabase
    .from('events')
    .select('*')
    .eq('id', primaryGuest.event_id)
    .single();

  if (eventErr || !event) {
    notFound();
  }

  // 3. Fetch Party Members if in party
  let partyMembers: GuestRecord[] = [];
  if (primaryGuest.party_id) {
    const { data: party } = await supabase
      .from('guests')
      .select('*')
      .eq('party_id', primaryGuest.party_id);
    if (party) partyMembers = party as GuestRecord[];
  }

  // 4. Fetch Schedule Items
  const { data: scheduleItems } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  // 5. Fetch Custom RSVP Questions
  const { data: customQuestions } = await supabase
    .from('custom_rsvp_questions')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  // 6. Fetch Registry Items
  const { data: registryItems } = await supabase
    .from('registry_items')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  // 7. Fetch Photos
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  // 8. Fetch existing custom RSVP responses for primary guest
  const { data: customResponses } = await supabase
    .from('custom_rsvp_responses')
    .select('*')
    .eq('guest_id', primaryGuest.id);

  // 9. Fetch existing schedule RSVPs for all party members
  const allGuestIds = [primaryGuest.id, ...partyMembers.map((p) => p.id)];
  const { data: scheduleRsvps } = await supabase
    .from('guest_schedule_rsvps')
    .select('*')
    .in('guest_id', allGuestIds);

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
      initialScheduleRsvps={(scheduleRsvps || []) as any[]}
    />
  );
}
