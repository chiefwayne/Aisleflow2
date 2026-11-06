'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Menu, X } from 'lucide-react';

interface NavbarProps {
  onCreateClick?: () => void;
}

export default function Navbar({ onCreateClick }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: '/templates', label: 'Designs' },
    { href: '/#features', label: 'For Your Guests' },
    { href: '/#compare', label: 'How It Works' },
    { href: '/admin/admin_sophia_demo_7721', label: 'See a demo' },
  ];

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
            <span className="hidden sm:inline-block ml-2 text-[11px] uppercase tracking-[0.2em] font-medium text-aisle-gold-deep">
              Wedding Invitations
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8 whitespace-nowrap text-[15px] font-medium tracking-tight text-aisle-warm/80">
          <Link href="/templates" className="transition-colors hover:text-aisle-charcoal">
            Designs
          </Link>
          <Link href="/#features" className="transition-colors hover:text-aisle-charcoal">
            For Your Guests
          </Link>
          <Link href="/#compare" className="transition-colors hover:text-aisle-charcoal">
            How It Works
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/admin_sophia_demo_7721"
            className="hidden lg:inline-flex whitespace-nowrap text-sm font-medium text-aisle-warm/80 hover:text-aisle-charcoal border-b border-transparent hover:border-aisle-charcoal transition-all py-1"
          >
            See a demo
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-aisle-border bg-white text-aisle-charcoal cursor-pointer"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-aisle-charcoal px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-aisle-terracotta hover:shadow-md"
          >
            <span>Start free</span>
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="md:hidden border-t border-aisle-border/60 bg-[#FAF7F2] px-6 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-[48px] items-center text-base font-medium text-aisle-charcoal border-b border-aisle-border/40 last:border-0"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
