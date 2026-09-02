'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BUILTIN_THEMES } from '@/lib/theme-presets';
import { TemplateDesignRecord } from '@/lib/types';
import PhoneMockup from '@/components/PhoneMockup';
import GuestPortalView from '@/components/guest/GuestPortalView';
import { Sparkles, ArrowRight, Eye, Check } from 'lucide-react';

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePreviewTheme, setActivePreviewTheme] = useState<TemplateDesignRecord | null>(null);

  const allThemes = Object.values(BUILTIN_THEMES);
  const categories = ['all', 'Classic Floral', 'Modern Minimal', 'Destination & Countryside', 'Elegant Dark / Gold', 'Cultural Heritage'];

  const filteredThemes = selectedCategory === 'all'
    ? allThemes
    : allThemes.filter((t) => t.taxonomy.toLowerCase().includes(selectedCategory.toLowerCase()));

  const mockEvent: any = {
    id: 'tpl-preview-event',
    couple_names: 'Sophia & Alexandre',
    wedding_date: '2026-09-18',
    rsvp_deadline: '2026-08-18',
    venue_name: 'Villa del Balbianello',
    venue_address: 'Lenno, Lake Como, Italy',
    theme_id: activePreviewTheme?.id || 'royal-floral',
    cover_image_url: activePreviewTheme?.sample_image_url,
    welcome_message: 'We request the pleasure of your company on Lake Como.',
    our_story: 'From our first meeting in Bellagio to forever.',
  };

  const mockGuest: any = {
    id: 'tpl-guest',
    first_name: 'Elena',
    access_token: 'demo_token',
    is_vip: true,
    rsvp_status: 'pending',
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-aisle-ink flex flex-col selection:bg-aisle-terracotta selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full px-6 sm:px-8 lg:px-12 py-16 flex-1 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-aisle-border bg-white px-3.5 py-1 text-xs font-semibold text-aisle-gold-deep shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>The AisleFlow Collection</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-aisle-charcoal">
            Eight Curated Aesthetics.<br />
            <em className="italic text-aisle-terracotta font-editorial">Endlessly Yours.</em>
          </h1>
          <p className="text-sm text-aisle-muted leading-relaxed">
            Every invitation design is hand-crafted with distinct typography, tailored opening reveals, and mobile-first layouts for intimate celebrations.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-aisle-charcoal text-white shadow-sm'
                  : 'border border-aisle-border bg-white text-aisle-warm hover:bg-aisle-sand'
              }`}
            >
              {cat === 'all' ? 'All Aesthetics' : cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredThemes.map((theme) => (
            <div
              key={theme.id}
              className="group rounded-3xl border border-aisle-border bg-white overflow-hidden shadow-sm hover:shadow-wedding-lg transition-all duration-300 flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[3/4] overflow-hidden bg-aisle-sand">
                <img
                  src={theme.sample_image_url || ''}
                  alt={theme.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-aisle-gold-light">
                    {theme.taxonomy}
                  </span>
                  <h3 className="font-serif text-xl font-semibold">{theme.name}</h3>
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-aisle-muted line-clamp-2 leading-relaxed">
                  {theme.description}
                </p>

                <div className="pt-2 border-t border-aisle-border/60 flex items-center justify-between">
                  <button
                    onClick={() => setActivePreviewTheme(theme)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-aisle-terracotta hover:text-aisle-charcoal transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Live Preview</span>
                  </button>

                  <Link
                    href={`/templates/${theme.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-aisle-charcoal hover:text-aisle-terracotta"
                  >
                    <span>Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Live Phone Preview Modal */}
      {activePreviewTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="relative flex flex-col items-center max-h-[90vh]">
            <button
              onClick={() => setActivePreviewTheme(null)}
              className="mb-4 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/40"
            >
              ✕ Close Preview
            </button>
            <PhoneMockup badgeText={`${activePreviewTheme.name} · Preview`}>
              <GuestPortalView
                event={mockEvent}
                primaryGuest={mockGuest}
                partyMembers={[mockGuest]}
                scheduleItems={[]}
                customQuestions={[]}
                registryItems={[]}
                initialPhotos={[]}
                customTheme={activePreviewTheme}
                previewMode={true}
              />
            </PhoneMockup>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
