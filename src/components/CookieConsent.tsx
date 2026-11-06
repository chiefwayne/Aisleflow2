'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ClarityTag, { isMarketingPage } from '@/components/ClarityTag';

type Choice = 'granted' | 'denied';

const STORAGE_KEY = 'aisleflow-cookie-consent';
const OPEN_SETTINGS_EVENT = 'aisleflow:cookie-settings';

type ClarityFn = (...args: unknown[]) => void;

// The page this browser tab first loaded. A tab that began on a private couple or guest link keeps that
// address in its history, and Back returns to it without a reload, so Clarity must never start in that tab.
const firstPath = typeof window === 'undefined' ? null : window.location.pathname;

function readChoice(): Choice | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Asks visitors on the public pages before any analytics cookie is set.
 * Clarity loads only after "Accept", and only where analytics is enabled (the live site).
 */
export default function CookieConsent({ analyticsEnabled }: { analyticsEnabled: boolean }) {
  const pathname = usePathname();
  // undefined until we have read the stored choice, so the banner never flashes for returning visitors
  const [choice, setChoice] = useState<Choice | null | undefined>(undefined);

  useEffect(() => {
    setChoice(readChoice());
    const reopen = () => setChoice(null);
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, []);

  const decide = (next: Choice) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    // Withdrawing after an earlier "Accept": Clarity erases its cookies and stops tracking
    const clarity = (window as unknown as { clarity?: ClarityFn }).clarity;
    if (next === 'denied' && clarity) {
      clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
    }
    setChoice(next);
  };

  if (!isMarketingPage(pathname)) return null;

  return (
    <>
      {analyticsEnabled && choice === 'granted' && firstPath !== null && isMarketingPage(firstPath) && <ClarityTag />}

      {choice === null && (
        <section
          aria-label="Cookie choice"
          className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] rounded-2xl border border-aisle-border bg-white p-5 shadow-wedding-lg motion-safe:animate-[cookie-in_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <h2 className="font-serif text-lg font-semibold text-aisle-charcoal">May we use analytics cookies?</h2>
          <p className="mt-2 text-sm leading-relaxed text-aisle-muted">
            They show us how visitors use these pages, through Microsoft Clarity, so we can improve them. They never
            run on your invitation or dashboard.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => decide('denied')}
              className="min-h-11 rounded-full border border-aisle-border bg-white px-4 text-sm font-semibold text-aisle-charcoal transition-colors hover:bg-aisle-sand cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aisle-terracotta"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => decide('granted')}
              className="min-h-11 rounded-full bg-aisle-charcoal px-4 text-sm font-semibold text-white transition-colors hover:bg-aisle-terracotta cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aisle-terracotta"
            >
              Accept
            </button>
          </div>
        </section>
      )}
    </>
  );
}

/** Footer link that reopens the banner so a visitor can change their mind. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))} className={className}>
      Cookie settings
    </button>
  );
}
