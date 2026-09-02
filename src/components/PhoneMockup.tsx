'use client';

import React from 'react';

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
  badgeText?: string;
}

export default function PhoneMockup({ children, className = '', badgeText }: PhoneMockupProps) {
  return (
    <div className={`relative mx-auto flex flex-col items-center ${className}`}>
      {badgeText && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-aisle-border bg-white px-3 py-1 text-[11px] font-medium text-aisle-warm shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {badgeText}
        </div>
      )}

      {/* Phone chassis */}
      <div className="relative w-[320px] sm:w-[360px] h-[660px] sm:h-[720px] rounded-[48px] bg-[#1A1816] p-3 shadow-phone border-[4px] border-[#36322E]">
        {/* Speaker / Dynamic island notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 h-5 w-28 rounded-full bg-black/90 flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-[#111] mr-3" />
          <div className="h-1.5 w-8 rounded-full bg-[#222]" />
        </div>

        {/* Screen container */}
        <div className="relative h-full w-full overflow-y-auto overflow-x-hidden rounded-[38px] bg-[#FAF7F2] text-aisle-ink select-none pt-7 custom-scrollbar">
          {children}
        </div>

        {/* Bottom home indicator */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-30 h-1 w-32 rounded-full bg-black/40" />
      </div>
    </div>
  );
}
