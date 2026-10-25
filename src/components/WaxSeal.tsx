'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { portalStrings, PortalStrings } from '@/lib/portal-i18n';
import { monogram } from '@/lib/invite-style';

interface WaxSealOpeningProps {
  coupleNames: string;
  openingStyle?: string;
  onOpen: () => void;
  guestName?: string;
  /** Wording in the invitation's language; English when not given. */
  strings?: PortalStrings;
  /** The invitation's colours; when given, the opening matches the invite instead of its default look. */
  palette?: { bg: string; surface: string; text: string; accent: string; border?: string };
}

const DEFAULT_PALETTE = { bg: '#FAF7F2', surface: '#FFFFFF', text: '#2C2523', accent: '#9E5A44', border: '#E8E0D7' };

/** How long the envelope takes to open before the invitation shows (matches globals.css). */
const OPEN_MS = 1600;

export default function WaxSealOpening({
  coupleNames,
  openingStyle = 'wax-seal',
  onOpen,
  guestName,
  strings = portalStrings('en'),
  palette,
}: WaxSealOpeningProps) {
  if (openingStyle === 'curtain' || openingStyle === 'minimal-fade') {
    return (
      <CardOpening
        coupleNames={coupleNames}
        openingStyle={openingStyle}
        onOpen={onOpen}
        guestName={guestName}
        strings={strings}
        palette={palette}
      />
    );
  }
  return (
    <EnvelopeOpening
      coupleNames={coupleNames}
      onOpen={onOpen}
      guestName={guestName}
      strings={strings}
      palette={palette || DEFAULT_PALETTE}
    />
  );
}

/** A paper envelope sealed with the couple's initials. Tap: the seal lifts, the flap opens, the envelope slides away. */
function EnvelopeOpening({
  coupleNames,
  onOpen,
  guestName,
  strings: tr,
  palette,
}: {
  coupleNames: string;
  onOpen: () => void;
  guestName?: string;
  strings: PortalStrings;
  palette: NonNullable<WaxSealOpeningProps['palette']>;
}) {
  const [opening, setOpening] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const open = () => {
    if (opening) return;
    setOpening(true);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer.current = setTimeout(onOpen, reduced ? 200 : OPEN_MS);
  };

  const vars = {
    // Paper a shade warmer than the card colour, so the envelope sits in the page rather than on it
    '--env-paper': `color-mix(in srgb, ${palette.surface} 62%, ${palette.bg})`,
    '--env-accent': palette.accent,
    '--env-ink': palette.text,
    '--tw-ring-color': palette.accent,
  } as React.CSSProperties;

  return (
    <div
      className={`paper-grain fixed inset-0 z-50 grid place-items-center overflow-hidden px-6 ${opening ? 'env-open env-backdrop-out' : ''}`}
      style={{
        ...vars,
        backgroundColor: palette.bg,
        color: palette.text,
        backgroundImage: `radial-gradient(120% 85% at 50% 10%, color-mix(in srgb, ${palette.accent} 9%, transparent) 0%, transparent 60%),
          radial-gradient(115% 80% at 50% 46%, transparent 55%, color-mix(in srgb, ${palette.accent} 12%, transparent) 100%)`,
      }}
    >
      <div className="flex flex-col items-center gap-9 text-center">
        <p className="font-editorial text-sm uppercase tracking-[0.32em]" style={{ color: palette.accent }}>
          {tr.youreInvited}
        </p>

        <button
          type="button"
          onClick={open}
          aria-label={tr.tapToOpen}
          className="env rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-8"
        >
          <span className="env-stage" aria-hidden="true">
            <span className="env-layer env-back" />
            <span className="env-layer env-lining" />
            <span className="env-layer env-fold-left" />
            <span className="env-layer env-fold-right" />
            <span className="env-layer env-fold-bottom" />
            <span className="env-layer env-flap" />
            <span className="env-seal">
              <SealSvg initials={monogram(coupleNames)} accent={palette.accent} />
            </span>
          </span>
        </button>

        <div className="space-y-3">
          {guestName && <p className="font-script text-4xl sm:text-5xl leading-tight">{guestName}</p>}
          <p className="env-hint font-editorial text-sm uppercase tracking-[0.3em]" style={{ color: palette.accent }}>
            {tr.tapToOpen} ✦
          </p>
        </div>
      </div>
    </div>
  );
}

/** Scalloped wax disc with the couple's initials pressed into it. */
function SealSvg({ initials, accent }: { initials: string; accent: string }) {
  // An uneven, softly lobed edge like pressed wax
  const steps = 120;
  const points = Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    const r = 45.5 + 1.5 * Math.cos(11 * t) + 1.1 * Math.sin(4 * t + 1) + 0.6 * Math.cos(7 * t + 2);
    return `${(50 + r * Math.cos(t)).toFixed(2)},${(50 + r * Math.sin(t)).toFixed(2)}`;
  }).join(' ');
  const id = 'seal-' + (initials.replace(/\W/g, '') || 'x');
  const size = initials.length > 1 ? 26 : 32;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="75%">
          <stop offset="0%" style={{ stopColor: `color-mix(in srgb, ${accent} 62%, white)` }} />
          <stop offset="55%" style={{ stopColor: accent }} />
          <stop offset="100%" style={{ stopColor: `color-mix(in srgb, ${accent} 70%, black)` }} />
        </radialGradient>
      </defs>
      <polygon points={points} fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="33" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
      {/* Pressed letters: a dark offset under a light face */}
      <text x="50" y="51.5" textAnchor="middle" dominantBaseline="middle" className="font-editorial" fontSize={size} fontWeight={600} fill="rgba(0,0,0,0.28)" letterSpacing="1">
        {initials}
      </text>
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="font-editorial" fontSize={size} fontWeight={600} fill="rgba(255,255,255,0.85)" letterSpacing="1">
        {initials}
      </text>
    </svg>
  );
}

/** Curtain and minimal openings: a card in the invite's colours. */
function CardOpening({
  coupleNames,
  openingStyle,
  onOpen,
  guestName,
  strings: tr,
  palette,
}: {
  coupleNames: string;
  openingStyle: 'curtain' | 'minimal-fade';
  onOpen: () => void;
  guestName?: string;
  strings: PortalStrings;
  palette?: WaxSealOpeningProps['palette'];
}) {
  const [isOpening, setIsOpening] = useState(false);
  const isDarkCurtain = openingStyle === 'curtain';

  const handleOpen = () => {
    setIsOpening(true);
    setTimeout(onOpen, 650);
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isOpening ? 0 : 1 }}
      transition={{ duration: 0.55, delay: isOpening ? 0.1 : 0 }}
      className={`paper-grain fixed inset-0 z-50 flex items-center justify-center p-4 ${
        palette ? '' : isDarkCurtain ? 'bg-[#0B0F15]' : 'bg-[#23201D]'
      }`}
      style={palette ? { backgroundColor: palette.bg } : undefined}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-9 sm:p-11 text-center shadow-2xl ${
          palette ? '' : isDarkCurtain ? 'border-[#D4AF37]/30 bg-[#161D27] text-[#F2EFE9]' : 'border-stone-200 bg-white text-stone-900'
        }`}
        style={palette ? { backgroundColor: palette.surface, color: palette.text, borderColor: palette.border || palette.accent } : undefined}
      >
        <p className="font-editorial text-sm uppercase tracking-[0.32em]" style={{ color: palette?.accent || (isDarkCurtain ? '#D4AF37' : undefined) }}>
          {isDarkCurtain ? tr.eveningInvitation : tr.youreInvited}
        </p>

        {guestName && (
          <p className="font-editorial text-lg italic mt-5" style={palette ? { color: palette.accent } : undefined}>
            {tr.forGuest} {guestName}
          </p>
        )}

        <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight mt-2 [text-wrap:balance]">{coupleNames}</h2>

        <p className="font-editorial text-base italic opacity-80 max-w-xs mx-auto leading-relaxed mt-3">
          {isDarkCurtain ? tr.openingCurtain : tr.openingMinimal}
        </p>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleOpen}
            disabled={isOpening}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-8 py-3 font-editorial text-sm uppercase tracking-[0.25em] transition-opacity hover:opacity-85 cursor-pointer"
            style={
              palette
                ? isDarkCurtain
                  ? { color: palette.accent, borderColor: palette.accent }
                  : { backgroundColor: palette.text, color: palette.surface, borderColor: palette.text }
                : undefined
            }
          >
            {isDarkCurtain && <Sparkles className="h-4 w-4" />}
            {isDarkCurtain ? tr.enterEvening : tr.tapToOpen}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
