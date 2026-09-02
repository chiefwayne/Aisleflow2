'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PhoneMockup from '@/components/PhoneMockup';
import GuestPortalView from '@/components/guest/GuestPortalView';
import { BUILTIN_THEMES } from '@/lib/theme-presets';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  MessageSquare,
  Camera,
  Calendar,
  Gift,
  Check,
  X,
  Heart,
  QrCode,
  Users
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Event Creation Form State
  const [form, setForm] = useState({
    couple_names: '',
    admin_email: '',
    wedding_date: '',
    venue_name: '',
    venue_address: '',
    theme_id: 'royal-floral',
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.admin_url) {
        router.push(data.admin_url);
      } else {
        setErrorMessage(data.error || 'Unable to create event. Please try again.');
        setIsProvisioning(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Connection error. Please try again.');
      setIsProvisioning(false);
    }
  };

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
              <div className="inline-flex items-center gap-2 rounded-full border border-aisle-border bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-aisle-gold-deep shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-aisle-terracotta" />
                <span>Boutique Guest Operating System</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl font-semibold tracking-tight text-aisle-charcoal leading-[1.08]">
                Digital Wedding Invitations<br />
                <em className="italic text-aisle-terracotta font-editorial font-normal">
                  as intimate as your celebration.
                </em>
              </h1>

              <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-aisle-muted leading-relaxed">
                Designed specifically for micro-weddings and high-touch private events. Zero-login tokenized portals, two-way SMS RSVP, VIP timelines, and live photo stream — all unified in one private dashboard.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-aisle-charcoal px-8 py-4 text-xs font-semibold uppercase tracking-wider text-white shadow-wedding hover:bg-aisle-terracotta hover:shadow-wedding-lg transition-all cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-aisle-gold-light" />
                  <span>Create Your Event Free</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </button>

                <Link
                  href="/admin/admin_sophia_demo_7721"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-aisle-border bg-white px-6 py-4 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand shadow-sm transition-all"
                >
                  <span>Explore Live Demo Admin</span>
                </Link>
              </div>

              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-aisle-muted">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" /> Zero Guest Accounts Needed
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" /> Two-Way SMS Sync
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" /> Micro-Wedding Focused
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

      {/* SPREADSHEET CHAOS VS AISLEFLOW CALM */}
      <section id="compare" className="border-t border-aisle-border bg-[#F4EDE2]/50 py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-aisle-charcoal">
              From Spreadsheet Chaos to Wedding Calm
            </h2>
            <p className="text-sm text-aisle-muted leading-relaxed">
              Replace scattered WhatsApp threads and outdated spreadsheets with a unified, high-touch guest operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="rounded-3xl border border-rose-200 bg-white/80 p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs uppercase tracking-wider">
                <X className="h-4 w-4 text-rose-600" />
                <span>The Spreadsheet & Chat Scramble</span>
              </div>
              <ul className="space-y-4 text-xs text-aisle-warm/90">
                <li className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-bold shrink-0">✕</span>
                  <span>RSVPs scattered across WhatsApp messages, DMs, text messages, and phone calls.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-bold shrink-0">✕</span>
                  <span>Manual copy-pasting of dietary notes and plus-ones after every reply.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-bold shrink-0">✕</span>
                  <span>Generic wedding websites forcing guests to register accounts or navigate clunky forms.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-bold shrink-0">✕</span>
                  <span>Zero insight into who opened your links or scanned your QR codes.</span>
                </li>
              </ul>
            </div>

            {/* With AisleFlow */}
            <div className="rounded-3xl border border-emerald-300 bg-white p-8 shadow-wedding space-y-6">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>With AisleFlow</span>
              </div>
              <ul className="space-y-4 text-xs text-aisle-warm">
                <li className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                  <span><strong>Zero-Login Portals:</strong> Each guest receives a personalized, secure token that opens instantly.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                  <span><strong>Two-Way SMS RSVP:</strong> Guests can text back "YES" or "NO" to update your live dashboard automatically.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                  <span><strong>VIP-Only Timelines:</strong> Rehearsal dinners and VIP events appear only to matching guest tags.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                  <span><strong>Live Photo Stream:</strong> Guests upload memories directly from their phones with printable table QR cards.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CORE HIGHLIGHTS SECTION */}
      <section id="features" className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-aisle-gold-deep">
              Crafted For Precision
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-aisle-charcoal">
              Everything Your Guests Need in One Seamless Link
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-3xl border border-aisle-border bg-white p-7 shadow-sm space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-aisle-sand flex items-center justify-center text-aisle-terracotta">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-aisle-charcoal">
                Zero-Login Guest Access
              </h3>
              <p className="text-xs text-aisle-muted leading-relaxed">
                Guests tap their unique tokenized link or scan their QR code and instantly see their personalized family invitation. No passwords, no registration hurdles.
              </p>
            </div>

            <div className="rounded-3xl border border-aisle-border bg-white p-7 shadow-sm space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-aisle-sand flex items-center justify-center text-aisle-terracotta">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-aisle-charcoal">
                Two-Way Twilio SMS RSVP
              </h3>
              <p className="text-xs text-aisle-muted leading-relaxed">
                Send SMS invitations and reminders. When guests text back "YES" or "NO", their status and meal choices update inside your live admin dashboard automatically.
              </p>
            </div>

            <div className="rounded-3xl border border-aisle-border bg-white p-7 shadow-sm space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-aisle-sand flex items-center justify-center text-aisle-terracotta">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-aisle-charcoal">
                Live Guest Photo Stream
              </h3>
              <p className="text-xs text-aisle-muted leading-relaxed">
                Print elegant QR cards for reception tables. Guests scan the card to upload candid photos directly to your shared event stream in full quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CURATED TEMPLATE CATALOGUE PREVIEW */}
      <section className="border-t border-aisle-border bg-[#F4EDE2]/40 py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-aisle-gold-deep block mb-1">
                The Collection
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-aisle-charcoal">
                Eight Bespoke Design Aesthetics
              </h2>
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-aisle-charcoal hover:text-aisle-terracotta"
            >
              <span>View All Templates</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(BUILTIN_THEMES).slice(0, 4).map((thm) => (
              <Link
                key={thm.id}
                href={`/templates/${thm.id}`}
                className="group rounded-3xl border border-aisle-border bg-white overflow-hidden shadow-sm hover:shadow-wedding-lg transition-all"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-aisle-sand">
                  <img
                    src={thm.sample_image_url || ''}
                    alt={thm.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[9px] uppercase tracking-widest text-aisle-gold-light font-bold">
                      {thm.taxonomy}
                    </span>
                    <h3 className="font-serif text-lg font-semibold">{thm.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CREATE EVENT / CHECKOUT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-aisle-border pb-4">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-aisle-charcoal">
                  Create Your Wedding Event
                </h3>
                <p className="text-xs text-aisle-muted mt-0.5">
                  Provisions your private admin link, guest database, and live portal
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-aisle-muted hover:text-aisle-charcoal text-lg"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-aisle-warm mb-1">Couple Display Names</label>
                <input
                  type="text"
                  placeholder="e.g. Charlotte & William"
                  value={form.couple_names}
                  onChange={(e) => setForm({ ...form, couple_names: e.target.value })}
                  required
                  className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div>
                <label className="block font-medium text-aisle-warm mb-1">Admin Email (for private access link)</label>
                <input
                  type="email"
                  placeholder="charlotte.william@example.com"
                  value={form.admin_email}
                  onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                  required
                  className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-aisle-warm mb-1">Wedding Date</label>
                  <input
                    type="date"
                    value={form.wedding_date}
                    onChange={(e) => setForm({ ...form, wedding_date: e.target.value })}
                    required
                    className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>

                <div>
                  <label className="block font-medium text-aisle-warm mb-1">Venue Name</label>
                  <input
                    type="text"
                    placeholder="Château de Varennes"
                    value={form.venue_name}
                    onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                    required
                    className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-aisle-warm mb-1">Venue Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Lenno, Lake Como, Italy"
                  value={form.venue_address}
                  onChange={(e) => setForm({ ...form, venue_address: e.target.value })}
                  required
                  className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div>
                <label className="block font-medium text-aisle-warm mb-1">Aesthetic Invitation Preset</label>
                <select
                  value={form.theme_id}
                  onChange={(e) => setForm({ ...form, theme_id: e.target.value })}
                  className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs bg-white focus:outline-none focus:border-aisle-terracotta"
                >
                  {Object.values(BUILTIN_THEMES).map((thm) => (
                    <option key={thm.id} value={thm.id}>
                      {thm.name} — {thm.taxonomy}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="w-full rounded-full bg-aisle-charcoal py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-aisle-terracotta transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isProvisioning ? 'Provisioning Event...' : 'Provision Event & Open Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
