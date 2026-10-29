import Link from 'next/link';
// Server-only: row-level security blocks the public key, so read with the service role.
import { supabaseAdmin } from '@/lib/supabase';
import TemplateDesignStudio, { TemplateDesignRow } from '@/components/owner/TemplateDesignStudio';
import { BUILTIN_THEMES } from '@/lib/theme-presets';
import { featureError, hasFeature } from '@/lib/plans';
import { normalizedSectionOrder } from '@/lib/portal-design';
import type {
  CustomRsvpQuestionRecord,
  EventRecord,
  GuestRecord,
  PhotoRecord,
  RegistryItemRecord,
  ScheduleItemRecord,
} from '@/lib/types';

interface PageProps {
  params: Promise<{ token: string }>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-3xl border border-aisle-border bg-white p-8 shadow-sm space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-aisle-charcoal">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default async function EventStudioPage({ params }: PageProps) {
  const { token } = await params;
  const { data } = await supabaseAdmin.from('events').select('*').eq('admin_token', token).maybeSingle();
  const event = data as EventRecord | null;

  if (!event) {
    return (
      <Card title="Protected Design Studio">
        <p className="text-xs text-aisle-muted">This link is invalid or has expired.</p>
      </Card>
    );
  }

  if (!hasFeature(event, 'design_studio')) {
    return (
      <Card title="Design Studio">
        <p className="text-sm text-aisle-muted leading-relaxed">{featureError('design_studio')}</p>
        <Link href={`/admin/${token}`} className="inline-block text-sm font-semibold text-aisle-terracotta hover:underline">
          Back to your dashboard to see plans
        </Link>
      </Card>
    );
  }

  const config = event.theme_config && typeof event.theme_config === 'object' ? event.theme_config : {};
  const merged = { ...(BUILTIN_THEMES[event.theme_id] || BUILTIN_THEMES['royal-floral']), ...config } as Record<string, any>;
  const initialDesign = {
    ...merged,
    container_layout: merged.container_layout || 'card',
    section_order: normalizedSectionOrder(merged),
    hidden_sections: merged.hidden_sections || [],
    section_styles: merged.section_styles || {},
  } as unknown as TemplateDesignRow;

  // The couple's own content, so the preview is their real invitation (same as the Editor's).
  const [guests, schedule, questions, registry, photos] = await Promise.all([
    supabaseAdmin.from('guests').select('*').eq('event_id', event.id).order('created_at', { ascending: true }).limit(2),
    supabaseAdmin.from('schedule_items').select('*').eq('event_id', event.id).order('display_order', { ascending: true }),
    supabaseAdmin.from('custom_rsvp_questions').select('*').eq('event_id', event.id).order('display_order', { ascending: true }),
    supabaseAdmin.from('registry_items').select('*').eq('event_id', event.id).order('display_order', { ascending: true }),
    supabaseAdmin.from('photos').select('*').eq('event_id', event.id).order('created_at', { ascending: false }),
  ]);

  return (
    <TemplateDesignStudio
      mode="event"
      eventId={event.id}
      adminToken={token}
      initialDesign={initialDesign}
      eventPreview={{
        event,
        guests: (guests.data || []) as GuestRecord[],
        schedule: (schedule.data || []) as ScheduleItemRecord[],
        questions: (questions.data || []) as CustomRsvpQuestionRecord[],
        registry: (registry.data || []) as RegistryItemRecord[],
        photos: (photos.data || []) as PhotoRecord[],
      }}
    />
  );
}
