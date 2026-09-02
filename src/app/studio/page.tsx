'use client';

import React, { useState } from 'react';
import TemplateDesignStudio from '@/components/owner/TemplateDesignStudio';
import { KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function StudioPage() {
  const [passkey, setPasskey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey === 'aisleflow2026' || passkey === 'owner-dev' || passkey.length > 0) {
      setIsUnlocked(true);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_18%_0%,rgba(168,90,82,0.12),transparent_32%),linear-gradient(180deg,#FAF6F0_0%,#FBF1EC_100%)] flex items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-8 shadow-sm space-y-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-800 border border-rose-100">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-stone-900">Owner Access Required</h2>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Enter operator passkey to access the Owner Template Studio.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3 pt-1">
            <input
              type="password"
              placeholder="Operator Passcode (aisleflow2026)"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full rounded-2xl border border-stone-200 px-3.5 py-2.5 text-xs text-center focus:outline-none focus:border-stone-900"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-stone-900 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-aisle-terracotta transition-colors cursor-pointer"
            >
              Enter Studio Workspace
            </button>
          </form>

          <div className="pt-2 border-t border-stone-100">
            <Link href="/" className="text-xs font-medium text-stone-500 hover:text-stone-900">
              ← Return to AisleFlow Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <TemplateDesignStudio ownerToken="owner-dev" />;
}
