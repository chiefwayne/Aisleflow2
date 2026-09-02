import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BUILTIN_THEMES } from '@/lib/theme-presets';
import PhoneMockup from '@/components/PhoneMockup';
import GuestPortalView from '@/components/guest/GuestPortalView';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SingleTemplatePage({ params }: PageProps) {
  const { id } = await params;
  const theme = BUILTIN_THEMES[id];

  if (!theme) {
    notFound();
  }

  const mockEvent: any = {
    id: 'single-tpl-event',
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

  const mockGuest: any = {
    id: 'single-tpl-guest',
    first_name: 'Elena',
    access_token: 'demo_token',
    is_vip: true,
    rsvp_status: 'pending',
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-aisle-ink flex flex-col selection:bg-aisle-terracotta selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full px-6 sm:px-8 lg:px-12 py-12 flex-1">
        <Link
          href="/templates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-aisle-muted hover:text-aisle-charcoal mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalogue
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Details Column */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-aisle-gold-deep block mb-1">
                {theme.taxonomy}
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-aisle-charcoal">
                {theme.name}
              </h1>
            </div>

            <p className="text-sm leading-relaxed text-aisle-muted">
              {theme.description}
            </p>

            <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-4 text-xs">
              <h3 className="font-serif text-base font-semibold text-aisle-charcoal">Design Highlights</h3>
              <ul className="space-y-2.5 text-aisle-warm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Opening Style:</strong> {theme.opening_style} (Tactile, sound-free)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Typography:</strong> {theme.font_family} with bespoke hierarchy</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Best Suited For:</strong> {theme.best_for}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Zero-Login Ready:</strong> Personalized tokenized party RSVP</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <Link
                href="/admin/admin_sophia_demo_7721"
                className="inline-flex items-center gap-2 rounded-full bg-aisle-charcoal px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-aisle-terracotta transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Experience In Live Demo Admin</span>
              </Link>
            </div>
          </div>

          {/* Interactive Phone Mockup */}
          <div className="lg:col-span-6 flex justify-center sticky top-24">
            <PhoneMockup badgeText={`${theme.name} · Live Phone View`}>
              <GuestPortalView
                event={mockEvent}
                primaryGuest={mockGuest}
                partyMembers={[mockGuest]}
                scheduleItems={[]}
                customQuestions={[]}
                registryItems={[]}
                initialPhotos={[]}
                customTheme={theme}
                previewMode={true}
              />
            </PhoneMockup>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
