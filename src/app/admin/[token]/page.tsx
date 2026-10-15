import React from 'react';
import { supabase } from '@/lib/supabase';
import AdminDashboardView from '@/components/admin/AdminDashboardView';
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
} from '@/lib/types';

import { ensureDemoEventSeeded, DEMO_ADMIN_TOKEN, getMockDemoData } from '@/lib/demo-seeder';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { token } = await params;
  const mockData = getMockDemoData();

  const isDemoToken = token === DEMO_ADMIN_TOKEN || token.startsWith('admin_sophia_demo') || token === 'admin_demo';
  if (isDemoToken) {
    return (
      <AdminDashboardView
        initialEvent={mockData.event}
        initialGuests={mockData.guests}
        initialSchedule={mockData.schedule}
        initialQuestions={mockData.questions}
        initialResponses={mockData.responses}
        initialRegistry={mockData.registry}
        initialContributions={mockData.contributions}
        initialPhotos={mockData.photos}
        initialTasks={mockData.tasks}
        initialTemplates={mockData.templates}
        initialCampaigns={mockData.campaigns}
      />
    );
  }

  // 1. Fetch Event by admin_token
  let event: EventRecord | null = null;
  try {
    const { data: dbEvent } = await supabase
      .from('events')
      .select('*')
      .eq('admin_token', token)
      .maybeSingle();
    event = dbEvent as EventRecord | null;
  } catch (err) {
    console.warn('Supabase fetch event failed:', err);
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-3xl border border-aisle-border bg-white p-8 shadow-sm space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-aisle-charcoal">Protected Admin Dashboard</h2>
          <p className="text-xs text-aisle-muted leading-relaxed">
            This administration link is invalid or has expired. Please check your secure access email or contact support.
          </p>
        </div>
      </div>
    );
  }

  const isUsingMock = isDemoToken || event.id === mockData.event.id;

  // 2. Fetch Guests
  let guests: GuestRecord[] = [];
  try {
    const { data } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true });
    if (data && data.length > 0) guests = data as GuestRecord[];
  } catch (err) {}
  if (guests.length === 0 && isUsingMock) {
    guests = mockData.guests;
  }

  // 3. Fetch Schedule Items
  let schedule: ScheduleItemRecord[] = [];
  try {
    const { data } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('event_id', event.id)
      .order('display_order', { ascending: true });
    if (data && data.length > 0) schedule = data as ScheduleItemRecord[];
  } catch (err) {}
  if (schedule.length === 0 && isUsingMock) {
    schedule = mockData.schedule;
  }

  // 4. Fetch Custom RSVP Questions
  let questions: CustomRsvpQuestionRecord[] = [];
  try {
    const { data } = await supabase
      .from('custom_rsvp_questions')
      .select('*')
      .eq('event_id', event.id)
      .order('display_order', { ascending: true });
    if (data && data.length > 0) questions = data as CustomRsvpQuestionRecord[];
  } catch (err) {}
  if (questions.length === 0 && isUsingMock) {
    questions = mockData.questions;
  }

  // 5. Fetch Custom RSVP Responses
  let responses: CustomRsvpResponseRecord[] = [];
  try {
    const { data } = await supabase
      .from('custom_rsvp_responses')
      .select('*');
    if (data && data.length > 0) responses = data as CustomRsvpResponseRecord[];
  } catch (err) {}
  if (responses.length === 0 && isUsingMock) {
    responses = mockData.responses;
  }

  // 6. Fetch Registry Items
  let registry: RegistryItemRecord[] = [];
  try {
    const { data } = await supabase
      .from('registry_items')
      .select('*')
      .eq('event_id', event.id)
      .order('display_order', { ascending: true });
    if (data && data.length > 0) registry = data as RegistryItemRecord[];
  } catch (err) {}
  if (registry.length === 0 && isUsingMock) {
    registry = mockData.registry;
  }

  // 7. Fetch Registry Contributions
  let contributions: RegistryContributionRecord[] = [];
  try {
    const { data } = await supabase
      .from('registry_contributions')
      .select('*');
    if (data && data.length > 0) contributions = data as RegistryContributionRecord[];
  } catch (err) {}
  if (contributions.length === 0 && isUsingMock) {
    contributions = mockData.contributions;
  }

  // 8. Fetch Photos
  let photos: PhotoRecord[] = [];
  try {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) photos = data as PhotoRecord[];
  } catch (err) {}
  if (photos.length === 0 && isUsingMock) {
    photos = mockData.photos;
  }

  // 9. Fetch Tasks
  let tasks: PlanningTaskRecord[] = [];
  try {
    const { data } = await supabase
      .from('planning_tasks')
      .select('*')
      .eq('event_id', event.id)
      .order('display_order', { ascending: true });
    if (data && data.length > 0) tasks = data as PlanningTaskRecord[];
  } catch (err) {}
  if (tasks.length === 0 && isUsingMock) {
    tasks = mockData.tasks;
  }

  // 10. Fetch Templates
  let templates: CommunicationTemplateRecord[] = [];
  try {
    const { data } = await supabase
      .from('communication_templates')
      .select('*')
      .eq('event_id', event.id);
    if (data && data.length > 0) templates = data as CommunicationTemplateRecord[];
  } catch (err) {}
  if (templates.length === 0 && isUsingMock) {
    templates = mockData.templates;
  }

  // 11. Fetch Campaigns
  let campaigns: CommunicationCampaignRecord[] = [];
  try {
    const { data } = await supabase
      .from('communication_campaigns')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) campaigns = data as CommunicationCampaignRecord[];
  } catch (err) {}
  if (campaigns.length === 0 && isUsingMock) {
    campaigns = mockData.campaigns;
  }

  return (
    <AdminDashboardView
      initialEvent={event as EventRecord}
      initialGuests={guests}
      initialSchedule={schedule}
      initialQuestions={questions}
      initialResponses={responses}
      initialRegistry={registry}
      initialContributions={contributions}
      initialPhotos={photos}
      initialTasks={tasks}
      initialTemplates={templates}
      initialCampaigns={campaigns}
    />
  );
}
