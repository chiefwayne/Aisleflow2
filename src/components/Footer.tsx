import Link from 'next/link';
import { Heart } from 'lucide-react';

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
              Beautiful digital wedding invitations with RSVPs, schedules and shared photos — all in one link your guests can open with a tap.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-aisle-muted">
              <span>© {new Date().getFullYear()} AisleFlow Inc.</span>
              <span>·</span>
              <span>Made for couples who care about the details.</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-aisle-charcoal">Product</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-aisle-muted">
              <li><Link href="/templates" className="hover:text-aisle-charcoal transition-colors">Designs</Link></li>
              <li><Link href="/#features" className="hover:text-aisle-charcoal transition-colors">How It Works</Link></li>
              <li><Link href="/#features" className="hover:text-aisle-charcoal transition-colors">Easy RSVPs</Link></li>
              <li><Link href="/#features" className="hover:text-aisle-charcoal transition-colors">Shared Photo Album</Link></li>
              <li><Link href="/admin/admin_sophia_demo_7721" className="hover:text-aisle-charcoal transition-colors">See a Demo Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-aisle-charcoal">More</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-aisle-muted">
              <li><Link href="/studio" className="hover:text-aisle-charcoal transition-colors">Owner Template Studio</Link></li>
              <li><Link href="/g/guest_elena_vance" className="hover:text-aisle-charcoal transition-colors">Sample Guest Invitation</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
