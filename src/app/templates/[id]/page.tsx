'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreateEventModal from '@/components/CreateEventModal';
import { BUILTIN_THEMES } from '@/lib/theme-presets';
import TemplatePreviewOverlay from '@/components/TemplatePreviewOverlay';
import { ArrowLeft, Check, Sparkles, ArrowRight, Eye } from 'lucide-react';

export default function SingleTemplatePage() {
  const params = useParams();
  const id = params?.id as string;
  const theme = BUILTIN_THEMES[id];

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!theme) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-aisle-ink flex flex-col selection:bg-aisle-terracotta selection:text-white">
      <Navbar onCreateClick={() => setCreateModalOpen(true)} />

      <main className="mx-auto max-w-7xl w-full px-6 sm:px-8 lg:px-12 py-12 flex-1">
        <Link
          href="/templates"
          className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-aisle-muted hover:text-aisle-charcoal mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all designs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Details Column */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-sm uppercase tracking-[0.2em] font-semibold text-aisle-gold-deep block mb-1">
                {theme.taxonomy}
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-aisle-charcoal">
                {theme.name}
              </h1>
            </div>

            <p className="text-base leading-relaxed text-aisle-muted">
              {theme.description}
            </p>

            <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-4 text-sm">
              <h3 className="font-serif text-base font-semibold text-aisle-charcoal">Design highlights</h3>
              <ul className="space-y-2.5 text-aisle-warm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Opening moment:</strong> {theme.opening_style.replace(/-/g, ' ')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Typography:</strong> {theme.font_family.replace(/-/g, ' ')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Best for:</strong> {theme.best_for}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Easy for guests:</strong> One personal link, RSVP in a few taps</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-aisle-charcoal px-8 py-3.5 text-sm font-semibold tracking-wide text-white shadow-sm hover:bg-aisle-terracotta transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-aisle-gold-light" />
                <span>Use this design</span>
                <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
              </button>

              <Link
                href="/admin/admin_sophia_demo_7721"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-aisle-border bg-white px-6 py-3.5 text-sm font-semibold text-aisle-charcoal hover:bg-aisle-sand shadow-sm transition-all"
              >
                <span>See the couple's dashboard</span>
              </Link>
            </div>
          </div>

          {/* Full-screen preview entry */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="group relative block w-full overflow-hidden rounded-3xl border border-aisle-border shadow-wedding-lg cursor-pointer text-left"
              style={{ backgroundColor: theme.bg_color }}
            >
              <img
                src={theme.sample_image_url || ''}
                alt={`${theme.name} sample`}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3 text-white">
                <span className="font-serif text-xl font-semibold">{theme.name}</span>
                <span className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-aisle-charcoal shadow-sm">
                  <Eye className="h-4 w-4" />
                  Preview full screen
                </span>
              </span>
            </button>
            <p className="mt-3 text-center text-sm text-aisle-muted">
              See the whole invitation, exactly as your guests will.
            </p>
          </div>
        </div>
      </main>

      <TemplatePreviewOverlay
        theme={previewOpen ? theme : null}
        onClose={() => setPreviewOpen(false)}
        onUse={() => {
          setPreviewOpen(false);
          setCreateModalOpen(true);
        }}
      />

      <CreateEventModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} initialThemeId={theme.id} />

      <Footer />
    </div>
  );
}
