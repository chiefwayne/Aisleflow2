import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-aisle-border bg-[#F4EDE2]/50 px-6 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-aisle-border bg-white">
                <Heart className="h-4 w-4 text-aisle-terracotta fill-aisle-terracotta/20" />
              </div>
              <span className="font-editorial text-2xl font-semibold tracking-wide text-aisle-charcoal">
                Aisle<span className="italic text-aisle-terracotta">Flow</span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-aisle-muted">
              The premier guest-experience platform designed specifically for micro-weddings, destination celebrations, and high-touch private events. Zero-login portals, live RSVP tracking, and bespoke editorial designs.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-aisle-muted">
              <span>© {new Date().getFullYear()} AisleFlow Inc.</span>
              <span>·</span>
              <span>Crafted with meticulous attention to detail.</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-aisle-charcoal">Product</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-aisle-muted">
              <li><Link href="/templates" className="hover:text-aisle-charcoal transition-colors">Design Collection</Link></li>
              <li><Link href="/#features" className="hover:text-aisle-charcoal transition-colors">Zero-Login Portals</Link></li>
              <li><Link href="/#rsvp" className="hover:text-aisle-charcoal transition-colors">Two-Way SMS RSVP</Link></li>
              <li><Link href="/#photos" className="hover:text-aisle-charcoal transition-colors">Live Photo Stream</Link></li>
              <li><Link href="/admin/admin_sophia_demo_7721" className="hover:text-aisle-charcoal transition-colors">Demo Admin Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-aisle-charcoal">Platform</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-aisle-muted">
              <li><Link href="/studio" className="hover:text-aisle-charcoal transition-colors">Owner Template Studio</Link></li>
              <li><Link href="/g/guest_elena_vance" className="hover:text-aisle-charcoal transition-colors">Sample Guest Portal</Link></li>
              <li><span className="text-xs text-aisle-gold-deep font-medium">✨ Powered by Supabase & Twilio</span></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
