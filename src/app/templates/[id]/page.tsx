'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BUILTIN_THEMES } from '@/lib/theme-presets';
import PhoneMockup from '@/components/PhoneMockup';
import GuestPortalView from '@/components/guest/GuestPortalView';
import { ArrowLeft, Check, Sparkles, ArrowRight } from 'lucide-react';

export default function SingleTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const theme = BUILTIN_THEMES[id];

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    couple_names: '',
    admin_email: '',
    wedding_date: '',
    venue_name: '',
    venue_address: '',
    theme_id: id || 'royal-floral',
  });

  if (!theme) {
    notFound();
  }

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
                  <span><strong>Opening Style:</strong> {theme.opening_style} (Tactile reveal)</span>
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

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-aisle-charcoal px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-aisle-terracotta transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-aisle-gold-light" />
                <span>Use This Design</span>
                <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
              </button>

              <Link
                href="/admin/admin_sophia_demo_7721"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-aisle-border bg-white px-6 py-3.5 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand shadow-sm transition-all"
              >
                <span>Live Demo Admin</span>
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

      {/* CREATE EVENT MODAL WITH PRESELECTED THEME */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-aisle-border pb-4">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-aisle-charcoal">
                  Create with {theme.name}
                </h3>
                <p className="text-xs text-aisle-muted mt-0.5">
                  Provisions your private admin portal with {theme.name} aesthetic
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
                <label className="block font-medium text-aisle-warm mb-1">Admin Email (for access recovery)</label>
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
                    placeholder="e.g. Château de Varennes"
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
                  placeholder="e.g. Bourgogne, France"
                  value={form.venue_address}
                  onChange={(e) => setForm({ ...form, venue_address: e.target.value })}
                  required
                  className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                />
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
