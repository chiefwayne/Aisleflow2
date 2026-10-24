'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreateEventModal from '@/components/CreateEventModal';
import { BUILTIN_THEMES } from '@/lib/theme-presets';
import { TemplateDesignRecord } from '@/lib/types';
import TemplatePreviewOverlay from '@/components/TemplatePreviewOverlay';
import { Sparkles, ArrowRight, Eye, Check } from 'lucide-react';

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePreviewTheme, setActivePreviewTheme] = useState<TemplateDesignRecord | null>(null);
  const [createModal, setCreateModal] = useState<{ open: boolean; themeId?: string }>({ open: false });

  const allThemes = Object.values(BUILTIN_THEMES);
  const categories = ['all', 'Classic Floral', 'Modern Minimal', 'Destination & Countryside', 'Elegant Dark / Gold', 'Cultural Heritage'];

  const filteredThemes = selectedCategory === 'all'
    ? allThemes
    : allThemes.filter((t) => t.taxonomy.toLowerCase().includes(selectedCategory.toLowerCase()));

  const handleOpenCreateModal = (theme: TemplateDesignRecord) => {
    setCreateModal({ open: true, themeId: theme.id });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-aisle-ink flex flex-col selection:bg-aisle-terracotta selection:text-white">
      <Navbar onCreateClick={() => setCreateModal({ open: true })} />

      <main className="mx-auto max-w-7xl w-full px-6 sm:px-8 lg:px-12 py-16 flex-1 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-aisle-border bg-white px-3.5 py-1 text-sm font-semibold text-aisle-gold-deep shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>The collection</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-aisle-charcoal">
            Eight designs.<br />
            <em className="italic text-aisle-terracotta font-editorial">All of them yours.</em>
          </h1>
          <p className="text-base text-aisle-muted leading-relaxed">
            Each design has its own typography, colours and opening moment. Preview any of them on a phone, then make it yours in a few minutes.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-aisle-charcoal text-white shadow-sm'
                  : 'border border-aisle-border bg-white text-aisle-warm hover:bg-aisle-sand'
              }`}
            >
              {cat === 'all' ? 'All designs' : cat}
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
                  <span className="text-xs uppercase font-bold tracking-widest text-aisle-gold-light">
                    {theme.taxonomy}
                  </span>
                  <h3 className="font-serif text-xl font-semibold">{theme.name}</h3>
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-sm text-aisle-muted line-clamp-2 leading-relaxed">
                  {theme.description}
                </p>

                <div className="pt-2 border-t border-aisle-border/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActivePreviewTheme(theme)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-aisle-muted hover:text-aisle-charcoal transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => handleOpenCreateModal(theme)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-aisle-terracotta hover:text-aisle-charcoal cursor-pointer"
                  >
                    <span>Use this design</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <TemplatePreviewOverlay
        theme={activePreviewTheme}
        onClose={() => setActivePreviewTheme(null)}
        onUse={(t) => {
          setActivePreviewTheme(null);
          handleOpenCreateModal(t);
        }}
      />

      <CreateEventModal
        open={createModal.open}
        onClose={() => setCreateModal({ open: false })}
        initialThemeId={createModal.themeId}
      />

      <Footer />
    </div>
  );
}
