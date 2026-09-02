import React from 'react';

export function BotanicalCorner({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-10 h-10 text-aisle-gold/60 ${className}`}
    >
      <path
        d="M6 6C18 6 30 18 30 30C30 42 42 54 54 54"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="36" cy="36" r="2.5" fill="currentColor" fillOpacity="0.4" />
      <path
        d="M20 10C24 16 26 22 22 26C18 30 12 28 6 24"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GoldHairlineDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-aisle-gold/60" />
      <span className="h-1.5 w-1.5 rotate-45 border border-aisle-gold bg-aisle-gold-light/40" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-aisle-gold/60" />
    </div>
  );
}
