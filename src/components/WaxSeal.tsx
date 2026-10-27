'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { portalStrings, PortalStrings } from '@/lib/portal-i18n';
import { isDarkBackground, monogram, readableOn } from '@/lib/invite-style';

interface WaxSealOpeningProps {
  coupleNames: string;
  openingStyle?: string;
  onOpen: () => void;
  guestName?: string;
  /** Wording in the invitation's language; English when not given. */
  strings?: PortalStrings;
  /** The invitation's colours; when given, the opening matches the invite instead of its default look. */
  palette?: { bg: string; surface: string; text: string; accent: string; border?: string; paper?: string; liner?: string; detail?: EnvelopeDetail };
  /** Names in the script face (default) or the theme's serif, to match the invitation. */
  nameStyle?: 'script' | 'serif';
}

/** The one physical detail a preset's envelope owns (see TemplateDesignRecord.envelope_detail). */
type EnvelopeDetail = 'gilt-edge' | 'stitch' | 'foil-stars' | 'bead-edge' | 'airmail' | 'tassel' | 'twine';

/** Gilt for edges and tassels, and the clay of Boho's twine: fixed materials, whatever the accent. */
const GILT = '#B8994E';
export const TWINE = '#A9785A';

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
  nameStyle = 'script',
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
        nameStyle={nameStyle}
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
      nameStyle={nameStyle}
      fastening={openingStyle === 'envelope' ? 'ribbon' : 'seal'}
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
  nameStyle,
  fastening,
}: {
  coupleNames: string;
  onOpen: () => void;
  guestName?: string;
  strings: PortalStrings;
  palette: NonNullable<WaxSealOpeningProps['palette']>;
  /** A wax seal with the couple's initials, or a ribbon tied in a bow across the envelope. */
  fastening: 'seal' | 'ribbon';
  nameStyle: 'script' | 'serif';
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
    '--env-paper': palette.paper || `color-mix(in srgb, ${palette.surface} 62%, ${palette.bg})`,
    '--env-accent': palette.accent,
    // Folds are shaded toward the ink; light paper on a dark theme (Marigold's cream) needs a dark ink
    '--env-ink': palette.paper && !isDarkBackground(palette.paper) && isDarkBackground(palette.bg) ? '#2B2118' : palette.text,
    // Shadows stay dark even when the theme's text colour is light (night themes)
    '--env-shadow': isDarkBackground(palette.bg) ? '#000000' : palette.text,
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
            <span className={`env-layer env-lining env-liner-${palette.liner || 'stripes'}`} />
            <span className="env-layer env-fold-left" />
            <span className="env-layer env-fold-right" />
            <span className="env-layer env-fold-bottom" />
            {palette.detail === 'foil-stars' && <span className="env-layer env-foil-stars" />}
            <span className="env-layer env-flap">
              {/* Edges drawn along the flap: a gilt edge, a running stitch, or a row of marigold beads */}
              {(palette.detail === 'gilt-edge' || palette.detail === 'stitch' || palette.detail === 'bead-edge') && (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none">
                  {palette.detail === 'gilt-edge' && (
                    <polyline points="0,0 50,100 100,0" stroke={GILT} strokeWidth="4" vectorEffect="non-scaling-stroke" />
                  )}
                  {palette.detail === 'stitch' && (
                    <polyline points="7,0 50,86 93,0" stroke={palette.accent} strokeWidth="1.4" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                  )}
                  {palette.detail === 'bead-edge' && (
                    <polyline points="5,0 50,90 95,0" stroke={palette.accent} strokeWidth="5" strokeLinecap="round" strokeDasharray="0 9" vectorEffect="non-scaling-stroke" />
                  )}
                </svg>
              )}
            </span>
            {palette.detail === 'airmail' && <span className="env-layer env-airmail" />}
            {fastening === 'ribbon' ? (
              <>
                <span className={`env-ribbon ${palette.detail === 'twine' ? 'env-twine' : ''}`} />
                <span className="env-bow">
                  <BowSvg accent={palette.detail === 'twine' ? TWINE : palette.accent} twine={palette.detail === 'twine'} />
                </span>
                {palette.detail === 'tassel' && (
                  <span className="env-tassel">
                    <svg viewBox="0 0 20 60" className="h-full w-full" fill="none">
                      <path d="M10 0 C 8 10, 12 16, 10 24" stroke={GILT} strokeWidth="1.6" strokeLinecap="round" />
                      <circle cx="10" cy="27" r="3.6" fill={GILT} />
                      <path d="M10 30 L 4 58 L 16 58 Z" fill={GILT} />
                      <path d="M7 34 L 6 57 M10 34 L 10 57 M13 34 L 14 57" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
                    </svg>
                  </span>
                )}
              </>
            ) : (
              <span className="env-seal">
                <SealSvg initials={monogram(coupleNames)} accent={palette.accent} />
              </span>
            )}
          </span>
        </button>

        <div className="space-y-3">
          {guestName && (
            <p className={nameStyle === 'serif' ? 'couple-names font-serif text-3xl sm:text-4xl font-medium tracking-tight' : 'couple-names font-script text-4xl sm:text-5xl leading-tight'}>
              {guestName}
            </p>
          )}
          <p className="env-hint font-editorial text-lg italic" style={{ color: palette.accent }}>
            {tr.tapToOpen} ✦
          </p>
        </div>
      </div>
    </div>
  );
}

/** Scalloped wax disc with the couple's initials pressed into it. */
export function SealSvg({ initials, accent }: { initials: string; accent: string }) {
  // An uneven, softly lobed edge like pressed wax
  const steps = 120;
  const points = Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    const r = 45.5 + 1.5 * Math.cos(11 * t) + 1.1 * Math.sin(4 * t + 1) + 0.6 * Math.cos(7 * t + 2);
    return `${(50 + r * Math.cos(t)).toFixed(2)},${(50 + r * Math.sin(t)).toFixed(2)}`;
  }).join(' ');
  const id = 'seal-' + (initials.replace(/\W/g, '') || 'x');
  const size = initials.length > 1 ? 26 : 32;
  // Pressed letters stay legible on light seals (gold, blush) as well as dark ones
  const lightLetters = readableOn(accent, ['#FFFFFF', '#1A1A1A']) === '#FFFFFF';
  const face = lightLetters ? 'rgba(255,255,255,0.88)' : 'rgba(26,26,26,0.78)';
  const press = lightLetters ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.45)';
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
      <text x="50" y="51.5" textAnchor="middle" dominantBaseline="middle" className="font-editorial" fontSize={size} fontWeight={600} fill={press} letterSpacing="1">
        {initials}
      </text>
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="font-editorial" fontSize={size} fontWeight={600} fill={face} letterSpacing="1">
        {initials}
      </text>
    </svg>
  );
}

/** Curtain and minimal openings: a single sheet of stationery in the invite's colours, no box chrome. */
function CardOpening({
  coupleNames,
  openingStyle,
  onOpen,
  guestName,
  strings: tr,
  palette,
  nameStyle,
}: {
  coupleNames: string;
  openingStyle: 'curtain' | 'minimal-fade';
  onOpen: () => void;
  guestName?: string;
  strings: PortalStrings;
  palette?: WaxSealOpeningProps['palette'];
  nameStyle: 'script' | 'serif';
}) {
  const [isOpening, setIsOpening] = useState(false);
  const p = palette || (openingStyle === 'curtain'
    ? { bg: '#0D1526', surface: '#142036', text: '#F3EEE3', accent: '#CDB073', border: '#2B3A57' }
    : DEFAULT_PALETTE);
  const dark = isDarkBackground(p.bg);

  const handleOpen = () => {
    setIsOpening(true);
    setTimeout(onOpen, 650);
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isOpening ? 0 : 1 }}
      transition={{ duration: 0.55, delay: isOpening ? 0.1 : 0 }}
      className="paper-grain fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: p.bg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm p-2 text-center"
        style={{
          backgroundColor: p.surface,
          color: p.text,
          boxShadow: `0 30px 50px -30px ${dark ? 'rgba(0,0,0,0.7)' : 'rgba(40,30,20,0.35)'}, 0 2px 6px -2px ${dark ? 'rgba(0,0,0,0.5)' : 'rgba(40,30,20,0.12)'}`,
        }}
      >
        {/* Double rule, like printed stationery */}
        <div className="px-7 py-12 sm:px-9 sm:py-14 space-y-5" style={{ border: `1px solid color-mix(in srgb, ${p.accent} 45%, transparent)` }}>
          <p className="font-editorial text-sm uppercase tracking-[0.32em]" style={{ color: p.accent }}>
            {tr.youreInvited}
          </p>
          {/* The couple first; the guest is the greeting beneath them */}
          <h2
            className={nameStyle === 'serif' ? 'couple-names font-serif text-3xl sm:text-4xl font-medium tracking-tight [text-wrap:balance]' : 'couple-names font-script text-5xl leading-tight [text-wrap:balance]'}
          >
            {coupleNames}
          </h2>
          <span aria-hidden="true" className="mx-auto block h-px w-12" style={{ backgroundColor: p.accent, opacity: 0.5 }} />
          {guestName && (
            <p className="font-editorial text-xl italic">
              {tr.forGuest} {guestName}
            </p>
          )}
          <p className="font-editorial text-lg italic opacity-85 leading-relaxed">
            {openingStyle === 'curtain' ? tr.openingCurtain : tr.openingMinimal}
          </p>
          <button
            type="button"
            onClick={handleOpen}
            disabled={isOpening}
            className="mt-2 inline-flex min-h-[44px] items-center px-4 font-editorial text-lg italic underline decoration-1 underline-offset-[6px] transition-opacity hover:opacity-75 cursor-pointer"
            style={{ color: p.accent }}
          >
            {tr.tapToOpen}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** The ribbon's bow, shared by the envelope and the thank-you so a ribbon opening closes with a ribbon too. */
export function BowSvg({ accent, twine = false }: { accent: string; twine?: boolean }) {
  if (twine) {
    // Twine tied in a loose bow: outlined loops and frayed ends, no satin
    return (
      <svg viewBox="0 0 60 36" className="h-full w-full" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round">
        <path d="M30 18 C 22 6, 8 8, 10 16 C 12 24, 24 22, 30 18" />
        <path d="M30 18 C 38 6, 52 8, 50 16 C 48 24, 36 22, 30 18" />
        <path d="M29 19 C 26 26, 22 30, 18 34 M31 19 C 34 26, 38 30, 42 34" />
        <path d="M18 34 l -2 1 M18 34 l -1 2 M42 34 l 2 1 M42 34 l 1 2" strokeWidth="1" />
        <circle cx="30" cy="18" r="2.6" fill={accent} stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 36" className="h-full w-full" fill="none">
      <path d="M30 18 C 20 4, 4 6, 6 16 C 8 26, 22 24, 30 18 Z" fill={accent} />
      <path d="M30 18 C 40 4, 56 6, 54 16 C 52 26, 38 24, 30 18 Z" fill={accent} />
      <path d="M28 19 L 20 34 M32 19 L 40 34" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="18" r="4" fill={accent} stroke="rgba(0,0,0,0.2)" />
      <path d="M12 14 C 18 12, 24 14, 28 17 M48 14 C 42 12, 36 14, 32 17" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    </svg>
  );
}
