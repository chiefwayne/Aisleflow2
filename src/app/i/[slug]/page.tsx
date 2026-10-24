import { notFound } from 'next/navigation';
// Server-only: row-level security blocks the public key, so read with the service role.
import { supabaseAdmin } from '@/lib/supabase';
import GuestPortalView from '@/components/guest/GuestPortalView';
import { hasFeature } from '@/lib/plans';
import type { EventRecord, RegistryItemRecord, ScheduleItemRecord } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** The couple's public short link: the published invitation without RSVP, uploads or private links. */
export default async function PublicInvitationPage({ params }: PageProps) {
  const { slug } = await params;
  const { data } = await supabaseAdmin.from('events').select('*').eq('custom_slug', slug.toLowerCase()).maybeSingle();
  const event = data as EventRecord | null;
  if (!event || !event.is_live || !hasFeature(event, 'custom_url')) notFound();

  const [{ data: schedule }, { data: registry }] = await Promise.all([
    supabaseAdmin
      .from('schedule_items')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_vip_only', false)
      .order('display_order'),
    supabaseAdmin.from('registry_items').select('*').eq('event_id', event.id),
  ]);

  // No admin, billing or album secrets on a public page.
  const publicEvent: EventRecord = {
    ...event,
    admin_token: '',
    admin_email: '',
    stripe_customer_id: null,
    album_token: null,
  };

  return (
    <GuestPortalView
      event={publicEvent}
      scheduleItems={(schedule || []) as ScheduleItemRecord[]}
      registryItems={(registry || []) as RegistryItemRecord[]}
      publicView
    />
  );
}
