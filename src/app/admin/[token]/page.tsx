import React from 'react';
import { notFound } from 'next/navigation';
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

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { token } = await params;

  // 1. Fetch Event by admin_token
  const { data: event, error: eventErr } = await supabase
    .from('events')
    .select('*')
    .eq('admin_token', token)
    .single();

  if (eventErr || !event) {
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

  // 2. Fetch Guests
  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: true });

  // 3. Fetch Schedule Items
  const { data: schedule } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  // 4. Fetch Custom RSVP Questions
  const { data: questions } = await supabase
    .from('custom_rsvp_questions')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  // 5. Fetch Custom RSVP Responses
  const { data: responses } = await supabase
    .from('custom_rsvp_responses')
    .select('*');

  // 6. Fetch Registry Items
  const { data: registry } = await supabase
    .from('registry_items')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  // 7. Fetch Registry Contributions
  const { data: contributions } = await supabase
    .from('registry_contributions')
    .select('*');

  // 8. Fetch Photos
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  // 9. Fetch Tasks
  const { data: tasks } = await supabase
    .from('planning_tasks')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order', { ascending: true });

  // 10. Fetch Templates
  const { data: templates } = await supabase
    .from('communication_templates')
    .select('*')
    .eq('event_id', event.id);

  // 11. Fetch Campaigns
  const { data: campaigns } = await supabase
    .from('communication_campaigns')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  return (
    <AdminDashboardView
      initialEvent={event as EventRecord}
      initialGuests={(guests || []) as GuestRecord[]}
      initialSchedule={(schedule || []) as ScheduleItemRecord[]}
      initialQuestions={(questions || []) as CustomRsvpQuestionRecord[]}
      initialResponses={(responses || []) as CustomRsvpResponseRecord[]}
      initialRegistry={(registry || []) as RegistryItemRecord[]}
      initialContributions={(contributions || []) as RegistryContributionRecord[]}
      initialPhotos={(photos || []) as PhotoRecord[]}
      initialTasks={(tasks || []) as PlanningTaskRecord[]}
      initialTemplates={(templates || []) as CommunicationTemplateRecord[]}
      initialCampaigns={(campaigns || []) as CommunicationCampaignRecord[]}
    />
  );
}
