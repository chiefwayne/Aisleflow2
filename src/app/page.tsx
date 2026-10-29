'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreateEventModal from '@/components/CreateEventModal';
import PhoneMockup from '@/components/PhoneMockup';
import GuestPortalView from '@/components/guest/GuestPortalView';
import { BUILTIN_THEMES } from '@/lib/theme-presets';
import {
  ArrowRight,
  Smartphone,
  MessageSquare,
  Camera,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Mock Event & Guest for Hero Phone Demo
  const heroDemoEvent: any = {
    id: 'hero-demo-event',
    couple_names: 'Sophia & Alexandre',
    wedding_date: '2026-09-18',
    rsvp_deadline: '2026-08-18',
    venue_name: 'Villa del Balbianello',
    venue_address: 'Lake Como, Italy',
    theme_id: 'royal-floral',
    cover_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    welcome_message: 'We are overjoyed to celebrate our wedding with you.',
    our_story: 'From our first meeting at the Bellagio ferry to forever.',
  };

  const heroDemoGuest: any = {
    id: 'hero-guest',
    first_name: 'Elena',
    last_name: 'Vance',
    access_token: 'guest_elena_vance',
    is_vip: true,
    rsvp_status: 'attending',
    meal_choice: 'Seared Branzino with Citrus Emulsion',
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-aisle-ink flex flex-col selection:bg-aisle-terracotta selection:text-white">
      <Navbar onCreateClick={() => setCreateModalOpen(true)} />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-aisle-border bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-aisle-gold-deep shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-aisle-terracotta" />
                <span>Digital wedding invitations</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl font-semibold tracking-tight text-aisle-charcoal leading-[1.08]">
                One beautiful link<br />
                <em className="italic text-aisle-terracotta font-editorial font-normal">for your whole celebration.</em>
              </h1>

              <p className="max-w-xl mx-auto lg:mx-0 text-lg text-aisle-muted leading-relaxed">
                Send a gorgeous invitation that holds your schedule, venue, RSVP and photos. Guests open it with a tap — no accounts, no apps — and you watch the replies arrive.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-aisle-charcoal px-8 py-4 text-sm font-semibold tracking-wide text-white shadow-wedding hover:bg-aisle-terracotta hover:shadow-wedding-lg transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aisle-terracotta"
                >
                  <span>Start your invitation — free</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  href="/templates"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-aisle-border bg-white px-6 py-4 text-sm font-semibold text-aisle-charcoal hover:bg-aisle-sand shadow-sm transition-all"
                >
                  <span>Browse designs</span>
                </Link>
              </div>

              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-aisle-muted">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-aisle-olive" /> No guest sign-ups
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-aisle-olive" /> RSVP by tap or text reply
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-aisle-olive" /> Ready in minutes
                </span>
              </div>
            </div>

            {/* Right Phone Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <PhoneMockup badgeText="Live Interactive Guest Portal">
                <GuestPortalView
                  event={heroDemoEvent}
                  primaryGuest={heroDemoGuest}
                  partyMembers={[heroDemoGuest]}
                  scheduleItems={[
                    {
                      id: 's1',
                      event_id: 'e1',
                      title: 'Sunset Welcome Aperitivo',
                      location_name: 'Grand Hotel Tremezzo Terrace',
                      start_time: '2026-09-17T17:30:00Z',
                      description: 'Aperol spritzes & wood-fired focaccia by the water.',
                      is_vip_only: false,
                      requires_rsvp: true,
                      display_order: 1,
                      created_at: new Date().toISOString(),
                    },
                    {
                      id: 's2',
                      event_id: 'e1',
                      title: 'The Wedding Ceremony',
                      location_name: 'Loggia Durini, Villa Balbianello',
                      start_time: '2026-09-18T16:00:00Z',
                      description: 'Vows overlooking Lake Como.',
                      is_vip_only: false,
                      requires_rsvp: true,
                      display_order: 2,
                      created_at: new Date().toISOString(),
                    },
                  ]}
                  customQuestions={[
                    {
                      id: 'q1',
                      event_id: 'e1',
                      prompt: 'Welcome drink on arrival?',
                      question_type: 'single_choice',
                      options: ['Franciacorta Sparkling', 'Aperol Spritz', 'Botanical Fizz'],
                      is_required: true,
                      display_order: 1,
                      created_at: new Date().toISOString(),
                    },
                  ]}
                  registryItems={[
                    {
                      id: 'r1',
                      event_id: 'e1',
                      title: 'Lake Como Honeymoon Boat Charter',
                      description: 'Explore historic villas along the lake.',
                      is_cash_fund: true,
                      target_amount: 4500,
                      current_amount: 2750,
                      display_order: 1,
                      created_at: new Date().toISOString(),
                    },
                  ]}
                  initialPhotos={[
                    {
                      id: 'p1',
                      event_id: 'e1',
                      image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
                      caption: 'Sunset over Villa Balbianello',
                      is_approved: true,
                      created_at: new Date().toISOString(),
                    },
                  ]}
                  previewMode={true}
                />
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="compare" className="border-t border-aisle-border bg-[#F4EDE2]/50 py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-aisle-gold-deep">
              How it works
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-aisle-charcoal">
              From “save the date” to “see you there”
            </h2>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {[
              { n: '01', title: 'Choose your design', body: 'Pick a look that feels like you, then add your names, date and venue. Your invitation is live in minutes.' },
              { n: '02', title: 'Send one link', body: 'Each guest or family gets their own personal link or QR code, by text or email. Nothing to download or sign up for.' },
              { n: '03', title: 'Watch replies arrive', body: 'RSVPs, meal choices and notes land in one tidy dashboard. Guests can even reply YES or NO by text.' },
            ].map((step) => (
              <li key={step.n} className="text-center md:text-left">
                <span className="font-editorial text-5xl italic text-aisle-terracotta/70">{step.n}</span>
                <div className="gold-divider my-4" />
                <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">{step.title}</h3>
                <p className="mt-2 text-base text-aisle-muted leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CORE HIGHLIGHTS SECTION */}
      <section id="features" className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-aisle-gold-deep">
              Made for your guests
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-aisle-charcoal">
              Everything they need, in one place
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { Icon: Smartphone, title: 'Opens with a tap', body: 'Guests see an invitation made just for them or their family — no passwords, no accounts, nothing to install.' },
              { Icon: MessageSquare, title: 'RSVP the easy way', body: 'Tap to reply on the page, or text back YES or NO. Meal choices and plus-ones update your guest list automatically.' },
              { Icon: Camera, title: 'A shared photo album', body: 'Print a QR card for each table. Guests scan it and add their favourite moments to your album as the day unfolds.' },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="rounded-3xl border border-aisle-border bg-white p-8 shadow-sm space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-aisle-sand flex items-center justify-center text-aisle-terracotta">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">{title}</h3>
                <p className="text-base text-aisle-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURATED TEMPLATE CATALOGUE PREVIEW */}
      <section className="border-t border-aisle-border bg-[#F4EDE2]/40 py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-aisle-gold-deep block mb-1">
                The collection
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-aisle-charcoal">
                A design for every kind of wedding
              </h2>
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-aisle-charcoal hover:text-aisle-terracotta"
            >
              <span>See all designs</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(BUILTIN_THEMES).slice(0, 8).map((thm) => (
              <Link
                key={thm.id}
                href={`/templates/${thm.id}`}
                className="group rounded-3xl border border-aisle-border bg-white overflow-hidden shadow-sm hover:shadow-wedding-lg transition-shadow"
              >
                <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: thm.bg_color }}>
                  <img
                    src={thm.sample_image_url || ''}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5" style={{ backgroundColor: thm.bg_color, color: thm.text_color }}>
                  <div className="flex items-center gap-1.5 mb-3" aria-hidden="true">
                    {[thm.bg_color, thm.accent_color, thm.text_color].map((c) => (
                      <span key={c} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                    ))}
                    <span className="ml-1 text-sm" style={{ color: thm.accent_color }}>{thm.floron}</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold">{thm.name}</h3>
                  <p className="mt-1 text-sm leading-snug" style={{ color: thm.muted_color }}>{thm.best_for}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CreateEventModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />

      <Footer />
    </div>
  );
}
