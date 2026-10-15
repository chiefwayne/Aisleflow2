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

import { ensureDemoEventSeeded, DEMO_GUEST_TOKEN, getMockDemoData } from '@/lib/demo-seeder';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function GuestPortalPage({ params }: PageProps) {
  const { token } = await params;
  const mockData = getMockDemoData();

  let primaryGuest: GuestRecord | null = null;
  let event: EventRecord | null = null;

  const isDemoGuestToken =
    token === DEMO_GUEST_TOKEN ||
    token === 'guest_elena_vance' ||
    token === 'gt_marcus_vance' ||
    token === 'gt_julian_sterling' ||
    token.startsWith('demo') ||
    token.startsWith('sample') ||
    token === 'preview';

  if (isDemoGuestToken) {
    const matchedGuest = mockData.guests.find((g) => g.access_token === token) || mockData.guests[0];
    const partyMembers = matchedGuest.party_id
      ? mockData.guests.filter((g) => g.party_id === matchedGuest.party_id && g.id !== matchedGuest.id)
      : [];
    return (
      <GuestPortalView
        event={mockData.event}
        primaryGuest={matchedGuest}
        partyMembers={partyMembers}
        scheduleItems={mockData.schedule}
        customQuestions={mockData.questions}
        registryItems={mockData.registry}
        initialPhotos={mockData.photos}
        initialResponses={mockData.responses.filter((r) => r.guest_id === matchedGuest.id)}
        initialScheduleRsvps={[]}
        previewMode={false}
      />
    );
  }

  // 1. Try finding Guest by access_token in DB
  try {
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
  } catch (err) {
    console.warn('Guest lookup in DB failed:', err);
  }

  // 2. If not found by guest access_token, check if token is an admin_token or event slug
  if (!event) {
    try {
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
    } catch (err) {}
  }

  // 3. Fallback for sample/demo links
  if (!event && isDemoGuestToken) {
    event = await ensureDemoEventSeeded();
    const matchedGuest = mockData.guests.find((g) => g.access_token === token);
    primaryGuest = matchedGuest || mockData.guests[0];
  }

  // If still no event could be resolved, 404
  if (!event) {
    notFound();
  }

  const isUsingMock = isDemoGuestToken || event.id === mockData.event.id;

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
    const partyId = primaryGuest.party_id;
    try {
      const { data: party } = await supabase
        .from('guests')
        .select('*')
        .eq('party_id', partyId);
      if (party && party.length > 0) partyMembers = party as GuestRecord[];
    } catch (err) {}
    if (partyMembers.length === 0 && isUsingMock) {
      partyMembers = mockData.guests.filter(
        (g) => g.party_id === partyId && g.id !== primaryGuest?.id
      );
    }
  }

  // 5. Fetch Schedule Items
  let scheduleItems: ScheduleItemRecord[] = [];
  try {
    const { data } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('event_id', event.id)
      .order('display_order', { ascending: true });
    if (data && data.length > 0) scheduleItems = data as ScheduleItemRecord[];
  } catch (err) {}
  if (scheduleItems.length === 0 && isUsingMock) {
    scheduleItems = mockData.schedule;
  }

  // 6. Fetch Custom RSVP Questions
  let customQuestions: CustomRsvpQuestionRecord[] = [];
  try {
    const { data } = await supabase
      .from('custom_rsvp_questions')
      .select('*')
      .eq('event_id', event.id)
      .order('display_order', { ascending: true });
    if (data && data.length > 0) customQuestions = data as CustomRsvpQuestionRecord[];
  } catch (err) {}
  if (customQuestions.length === 0 && isUsingMock) {
    customQuestions = mockData.questions;
  }

  // 7. Fetch Registry Items
  let registryItems: RegistryItemRecord[] = [];
  try {
    const { data } = await supabase
      .from('registry_items')
      .select('*')
      .eq('event_id', event.id)
      .order('display_order', { ascending: true });
    if (data && data.length > 0) registryItems = data as RegistryItemRecord[];
  } catch (err) {}
  if (registryItems.length === 0 && isUsingMock) {
    registryItems = mockData.registry;
  }

  // 8. Fetch Photos
  let photos: PhotoRecord[] = [];
  try {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) photos = data as PhotoRecord[];
  } catch (err) {}
  if (photos.length === 0 && isUsingMock) {
    photos = mockData.photos;
  }

  // 9. Fetch existing custom RSVP responses for primary guest
  let customResponses: any[] = [];
  try {
    const { data } = await supabase
      .from('custom_rsvp_responses')
      .select('*')
      .eq('guest_id', primaryGuest.id);
    if (data && data.length > 0) customResponses = data;
  } catch (err) {}
  if (customResponses.length === 0 && isUsingMock) {
    customResponses = mockData.responses.filter((r) => r.guest_id === primaryGuest?.id);
  }

  // 10. Fetch existing schedule RSVPs for all party members
  const allGuestIds = [primaryGuest.id, ...partyMembers.map((p) => p.id)].filter(id => id !== 'preview-guest');
  let scheduleRsvps: any[] = [];
  if (allGuestIds.length > 0) {
    try {
      const { data: rsvps } = await supabase
        .from('guest_schedule_rsvps')
        .select('*')
        .in('guest_id', allGuestIds);
      if (rsvps) scheduleRsvps = rsvps;
    } catch (err) {}
  }

  return (
    <GuestPortalView
      event={event as EventRecord}
      primaryGuest={primaryGuest as GuestRecord}
      partyMembers={partyMembers}
      scheduleItems={scheduleItems}
      customQuestions={customQuestions}
      registryItems={registryItems}
      initialPhotos={photos}
      initialResponses={customResponses}
      initialScheduleRsvps={scheduleRsvps}
      previewMode={primaryGuest.id === 'preview-guest'}
    />
  );
}
