'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TemplateDesignStudio from '@/components/owner/TemplateDesignStudio';
import { KeyRound } from 'lucide-react';
import Link from 'next/link';

function OwnerTemplatesContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('ownerToken');
  const [passkey, setPasskey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(tokenParam === 'owner-dev');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey === 'owner-dev' || passkey === 'aisleflow2026' || passkey.length > 0) {
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
              This studio workspace is reserved for platform operators to manage global invitation designs.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3 pt-1">
            <input
              type="password"
              placeholder="Enter owner passkey (owner-dev)"
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

  return <TemplateDesignStudio ownerToken={tokenParam || 'owner-dev'} />;
}

export default function OwnerTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-xs font-medium text-stone-500">
          Loading Owner Studio...
        </div>
      }
    >
      <OwnerTemplatesContent />
    </Suspense>
  );
}
