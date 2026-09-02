'use client';

import Link from 'next/link';
import { Sparkles, Calendar, Heart, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onCreateClick?: () => void;
}

export default function Navbar({ onCreateClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-aisle-border/60 bg-[#FAF7F2]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-aisle-border bg-white shadow-sm transition-transform group-hover:scale-105">
            <Heart className="h-5 w-5 text-aisle-terracotta fill-aisle-terracotta/20" />
          </div>
          <div>
            <span className="font-editorial text-2xl font-semibold tracking-wide text-aisle-charcoal">
              Aisle<span className="italic text-aisle-terracotta">Flow</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-[0.2em] font-medium text-aisle-gold-deep">
              Boutique Guest OS
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-tight text-aisle-warm/80">
          <Link href="/templates" className="transition-colors hover:text-aisle-charcoal">
            Design Catalogue
          </Link>
          <Link href="/#features" className="transition-colors hover:text-aisle-charcoal">
            Guest Experience
          </Link>
          <Link href="/#compare" className="transition-colors hover:text-aisle-charcoal">
            Why AisleFlow
          </Link>
          <Link href="/studio" className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-aisle-muted hover:text-aisle-charcoal transition-colors">
            <ShieldCheck className="h-3.5 w-3.5" /> Studio
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/admin_sophia_demo_7721"
            className="hidden sm:inline-flex text-xs font-medium uppercase tracking-wider text-aisle-warm/80 hover:text-aisle-charcoal border-b border-transparent hover:border-aisle-charcoal transition-all py-1"
          >
            Live Demo Admin
          </Link>
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 rounded-full bg-aisle-charcoal px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-aisle-terracotta hover:shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Create Event</span>
          </button>
        </div>
      </div>
    </header>
  );
}
