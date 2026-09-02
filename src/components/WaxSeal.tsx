'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, MailOpen } from 'lucide-react';

interface WaxSealOpeningProps {
  coupleNames: string;
  openingStyle?: string;
  onOpen: () => void;
  guestName?: string;
}

export default function WaxSealOpening({
  coupleNames,
  openingStyle = 'wax-seal',
  onOpen,
  guestName,
}: WaxSealOpeningProps) {
  const [isCracking, setIsCracking] = useState(false);

  const handleCrack = () => {
    setIsCracking(true);
    setTimeout(() => {
      onOpen();
    }, 700);
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.6 } }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#23201D]/90 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E8E0D7]/30 bg-[#FAF7F2] p-8 sm:p-10 text-center shadow-2xl"
      >
        {/* Decorative corner flourishes */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-aisle-gold/40 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-aisle-gold/40 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-aisle-gold/40 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-aisle-gold/40 rounded-br-sm pointer-events-none" />

        <div className="mx-auto mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-aisle-gold" />
          <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-aisle-gold-deep">
            Private Invitation
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-aisle-gold" />
        </div>

        {guestName && (
          <p className="font-editorial text-lg italic text-aisle-terracotta mb-2">
            For {guestName}
          </p>
        )}

        <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-aisle-charcoal">
          {coupleNames}
        </h2>
        
        <p className="mt-3 text-xs sm:text-sm text-aisle-muted max-w-xs mx-auto leading-relaxed">
          Request the pleasure of your company. Tap the seal to open your private guest portal.
        </p>

        {/* Tactile Wax Seal Button */}
        <div className="my-8 flex justify-center">
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
                {isCracking ? 'Opening...' : 'Open'}
              </span>
            </motion.div>

            {/* Subtle pulsate ring */}
            <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-25" />
          </motion.button>
        </div>

        <p className="text-[11px] uppercase tracking-[0.18em] text-aisle-muted/80">
          Personalized · No Account Required
        </p>
      </motion.div>
    </motion.div>
  );
}
