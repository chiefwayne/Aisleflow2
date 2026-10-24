'use client';

import React, { useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import GuestPortalView from '@/components/guest/GuestPortalView';
import { TemplateDesignRecord } from '@/lib/types';

interface TemplatePreviewOverlayProps {
  theme: TemplateDesignRecord | null;
  onClose: () => void;
  onUse: (theme: TemplateDesignRecord) => void;
}

const now = () => new Date().toISOString();

export default function TemplatePreviewOverlay({ theme, onClose, onUse }: TemplatePreviewOverlayProps) {
  useEffect(() => {
    if (!theme) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [theme, onClose]);

  if (!theme) return null;

  const event: any = {
    id: 'preview-event',
    couple_names: 'Sophia & Alexandre',
    wedding_date: '2026-09-18',
    rsvp_deadline: '2026-08-18',
    venue_name: 'Villa del Balbianello',
    venue_address: 'Lenno, Lake Como, Italy',
    theme_id: theme.id,
    cover_image_url: theme.sample_image_url,
    welcome_message: 'We request the pleasure of your company on Lake Como.',
    our_story: 'From our first meeting in Bellagio to forever.',
  };

  const guest: any = {
    id: 'preview-guest',
    first_name: 'Elena',
    access_token: 'demo_token',
    is_vip: false,
    rsvp_status: 'pending',
  };

  const schedule: any[] = [
    {
      id: 'ps1',
      event_id: 'preview-event',
      title: 'Welcome Aperitivo',
      location_name: 'Grand Hotel Tremezzo Terrace',
      start_time: '2026-09-17T17:30:00Z',
      description: 'Sparkling wine and small bites by the water.',
      is_vip_only: false,
      requires_rsvp: true,
      display_order: 1,
      created_at: now(),
    },
    {
      id: 'ps2',
      event_id: 'preview-event',
      title: 'The Ceremony',
      location_name: 'Villa del Balbianello',
      start_time: '2026-09-18T16:00:00Z',
      description: 'Vows overlooking the lake.',
      is_vip_only: false,
      requires_rsvp: true,
      display_order: 2,
      created_at: now(),
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${theme.name} preview`}
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{ backgroundColor: theme.bg_color }}
    >
      <div className="sticky top-0 z-[70] flex items-center justify-between gap-3 border-b border-black/10 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aisle-gold-deep">Preview</p>
          <p className="truncate font-serif text-lg font-semibold text-aisle-charcoal">{theme.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onUse(theme)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-aisle-charcoal px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-aisle-terracotta transition-colors cursor-pointer"
          >
            <span>Use this design</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-aisle-border bg-white text-aisle-charcoal hover:bg-aisle-sand cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <GuestPortalView
        event={event}
        primaryGuest={guest}
        partyMembers={[guest]}
        scheduleItems={schedule}
        customQuestions={[]}
        registryItems={[]}
        initialPhotos={[]}
        customTheme={theme}
        previewMode={true}
      />
    </div>
  );
}
