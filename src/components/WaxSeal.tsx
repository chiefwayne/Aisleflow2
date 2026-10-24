'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, MailOpen } from 'lucide-react';
import { portalStrings, PortalStrings } from '@/lib/portal-i18n';

interface WaxSealOpeningProps {
  coupleNames: string;
  openingStyle?: string;
  onOpen: () => void;
  guestName?: string;
  /** Wording in the invitation's language; English when not given. */
  strings?: PortalStrings;
}

export default function WaxSealOpening({
  coupleNames,
  openingStyle = 'wax-seal',
  onOpen,
  guestName,
  strings = portalStrings('en'),
}: WaxSealOpeningProps) {
  const tr = strings;
  const [isCracking, setIsCracking] = useState(false);

  const handleCrack = () => {
    setIsCracking(true);
    setTimeout(() => {
      onOpen();
    }, 650);
  };

  const isDarkCurtain = openingStyle === 'curtain';
  const isEnvelope = openingStyle === 'envelope';
  const isMinimal = openingStyle === 'minimal-fade';

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, transition: { duration: 0.55 } }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
        isDarkCurtain ? 'bg-[#0B0F15]/95' : 'bg-[#23201D]/90'
      }`}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-8 sm:p-10 text-center shadow-2xl ${
          isDarkCurtain
            ? 'border-[#D4AF37]/30 bg-[#161D27] text-[#F2EFE9]'
            : isMinimal
            ? 'border-stone-200 bg-white text-stone-900'
            : 'border-[#E8E0D7]/30 bg-[#FAF7F2] text-[#2C2523]'
        }`}
      >
        {/* Decorative corner flourishes */}
        {!isMinimal && (
          <>
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-aisle-gold/40 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-aisle-gold/40 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-aisle-gold/40 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-aisle-gold/40 rounded-br-sm pointer-events-none" />
          </>
        )}

        <div className="mx-auto mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-aisle-gold" />
          <span
            className={`text-[11px] font-medium uppercase tracking-[0.25em] ${
              isDarkCurtain ? 'text-[#D4AF37]' : 'text-aisle-gold-deep'
            }`}
          >
            {isEnvelope ? tr.sealedEnvelope : isDarkCurtain ? tr.eveningInvitation : tr.privateInvitation}
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-aisle-gold" />
        </div>

        {guestName && (
          <p
            className={`font-editorial text-lg italic mb-2 ${
              isDarkCurtain ? 'text-[#D4AF37]' : 'text-aisle-terracotta'
            }`}
          >
            {tr.forGuest} {guestName}
          </p>
        )}

        <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
          {coupleNames}
        </h2>

        <p className="mt-3 text-xs sm:text-sm opacity-75 max-w-xs mx-auto leading-relaxed">
          {isEnvelope
            ? tr.openingEnvelope
            : isDarkCurtain
            ? tr.openingCurtain
            : isMinimal
            ? tr.openingMinimal
            : tr.openingSeal}
        </p>

        {/* Action Trigger Button */}
        <div className="my-8 flex justify-center">
          {isMinimal ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCrack}
              disabled={isCracking}
              className="rounded-full bg-stone-900 px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-800 cursor-pointer shadow-md"
            >
              {isCracking ? tr.openingPortal : tr.openInvitation}
            </motion.button>
          ) : isEnvelope ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCrack}
              disabled={isCracking}
              className="flex items-center gap-2 rounded-full border border-amber-900/20 bg-[#F4EDE2] px-7 py-3.5 text-xs font-serif font-semibold text-amber-950 hover:bg-[#EDE3D4] cursor-pointer shadow-md"
            >
              <MailOpen className="h-4 w-4 text-amber-800" />
              <span>{isCracking ? tr.unfolding : tr.unfoldInvitation}</span>
            </motion.button>
          ) : isDarkCurtain ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCrack}
              disabled={isCracking}
              className="flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/30 to-[#D4AF37]/20 px-8 py-3.5 text-xs font-serif uppercase tracking-widest text-[#D4AF37] hover:border-[#D4AF37] cursor-pointer shadow-lg"
            >
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <span>{isCracking ? tr.entering : tr.enterEvening}</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCrack}
              disabled={isCracking}
              className="group relative flex h-24 w-24 items-center justify-center rounded-full wax-seal cursor-pointer"
            >
              <motion.div
                animate={isCracking ? { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 0.8, 0] } : {}}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center justify-center text-white"
              >
                <Heart className="h-7 w-7 fill-white/30 text-white stroke-[1.5]" />
                <span className="mt-1 font-display text-[9px] uppercase tracking-widest font-bold">
                  {isCracking ? tr.opening : tr.open}
                </span>
              </motion.div>
              <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-25" />
            </motion.button>
          )}
        </div>

        <p className="text-[11px] uppercase tracking-[0.18em] opacity-60">
          {tr.personalNoAccount}
        </p>
      </motion.div>
    </motion.div>
  );
}
