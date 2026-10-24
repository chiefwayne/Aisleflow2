'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { BUILTIN_THEMES } from '@/lib/theme-presets';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selects a design. When set, the design step is skipped. */
  initialThemeId?: string;
}

const inputClass =
  'w-full rounded-xl border border-aisle-border px-4 py-3 text-base focus:outline-none focus:border-aisle-terracotta focus:ring-2 focus:ring-aisle-terracotta/20';

const emptyForm = {
  couple_names: '',
  admin_email: '',
  wedding_date: '',
  venue_name: '',
  venue_address: '',
};

export default function CreateEventModal({ open, onClose, initialThemeId }: CreateEventModalProps) {
  const router = useRouter();
  const firstStep = initialThemeId ? 2 : 1;
  const [step, setStep] = useState(firstStep);
  const [themeId, setThemeId] = useState(initialThemeId || 'royal-floral');
  const [form, setForm] = useState(emptyForm);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Re-open fresh on the right step and design each time the modal is shown.
  useEffect(() => {
    if (!open) return;
    setStep(initialThemeId ? 2 : 1);
    if (initialThemeId) setThemeId(initialThemeId);
    setErrorMessage('');
  }, [open, initialThemeId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const theme = BUILTIN_THEMES[themeId];
  const stepCount = initialThemeId ? 2 : 3;
  const stepNumber = step - firstStep + 1;

  const handleNext = () => {
    if (step === 2) {
      if (!form.couple_names.trim() || !form.wedding_date || !form.venue_name.trim() || !form.venue_address.trim()) {
        setErrorMessage('Please fill in all of the details so your invitation looks right.');
        return;
      }
    }
    setErrorMessage('');
    setStep(step + 1);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, theme_id: themeId }),
      });

      const data = await res.json();
      if (data.admin_url) {
        router.push(data.admin_url);
      } else {
        setErrorMessage(data.error || 'Unable to create event. Please try again.');
        setIsProvisioning(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Connection error. Please try again.');
      setIsProvisioning(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="create-title" className="font-serif text-2xl font-semibold text-aisle-charcoal">
              {step === 1 && 'Pick your design'}
              {step === 2 && (initialThemeId ? `Your day, in ${theme?.name}` : 'Tell us about your day')}
              {step === 3 && 'Where should we send your link?'}
            </h3>
            <p className="text-sm text-aisle-muted mt-1">
              Step {stepNumber} of {stepCount} — free, no card needed
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-11 w-11 shrink-0 rounded-full text-aisle-muted hover:bg-aisle-sand hover:text-aisle-charcoal text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2" aria-hidden="true">
          {Array.from({ length: stepCount }, (_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i < stepNumber ? 'bg-aisle-terracotta' : 'bg-aisle-border'}`}
            />
          ))}
        </div>

        {errorMessage && (
          <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleCreateEvent} className="space-y-6">
          {step === 1 && (
            <fieldset>
              <legend className="sr-only">Invitation design</legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.values(BUILTIN_THEMES).map((thm) => {
                  const selected = themeId === thm.id;
                  return (
                    <label
                      key={thm.id}
                      className={`relative cursor-pointer rounded-2xl border-2 p-3 transition-all focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-aisle-terracotta ${
                        selected ? 'border-aisle-terracotta shadow-wedding' : 'border-aisle-border hover:border-aisle-muted/50'
                      }`}
                      style={{ backgroundColor: thm.bg_color, color: thm.text_color }}
                    >
                      <input
                        type="radio"
                        name="theme_id"
                        value={thm.id}
                        checked={selected}
                        onChange={() => setThemeId(thm.id)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-1 mb-3" aria-hidden="true">
                        {[thm.bg_color, thm.accent_color, thm.text_color].map((c) => (
                          <span key={c} className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span className="block text-center text-lg" style={{ color: thm.accent_color }} aria-hidden="true">{thm.floron}</span>
                      <span className="block font-serif text-base font-semibold leading-tight text-center mt-1">{thm.name}</span>
                      <span className="block text-xs text-center mt-1" style={{ color: thm.muted_color }}>{thm.taxonomy}</span>
                      {selected && (
                        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-aisle-terracotta text-white flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              <p className="text-sm text-aisle-muted mt-4">You can change your design any time.</p>
            </fieldset>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="couple_names" className="block text-sm font-medium text-aisle-warm mb-1.5">Your names</label>
                <input
                  id="couple_names"
                  type="text"
                  placeholder="e.g. Charlotte & William"
                  value={form.couple_names}
                  onChange={(e) => setForm({ ...form, couple_names: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wedding_date" className="block text-sm font-medium text-aisle-warm mb-1.5">Wedding date</label>
                  <input
                    id="wedding_date"
                    type="date"
                    value={form.wedding_date}
                    onChange={(e) => setForm({ ...form, wedding_date: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="venue_name" className="block text-sm font-medium text-aisle-warm mb-1.5">Venue</label>
                  <input
                    id="venue_name"
                    type="text"
                    placeholder="Château de Varennes"
                    value={form.venue_name}
                    onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="venue_address" className="block text-sm font-medium text-aisle-warm mb-1.5">Venue location</label>
                <input
                  id="venue_address"
                  type="text"
                  placeholder="e.g. Lenno, Lake Como, Italy"
                  value={form.venue_address}
                  onChange={(e) => setForm({ ...form, venue_address: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="admin_email" className="block text-sm font-medium text-aisle-warm mb-1.5">Your email</label>
                <input
                  id="admin_email"
                  type="email"
                  placeholder="charlotte.william@example.com"
                  value={form.admin_email}
                  onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                  required
                  className={inputClass}
                />
                <p className="text-sm text-aisle-muted mt-2">
                  We’ll send you a private link to manage your guest list and RSVPs. There’s no password to remember.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {step > firstStep ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="min-h-[44px] rounded-full px-5 py-3 text-sm font-semibold text-aisle-charcoal hover:bg-aisle-sand cursor-pointer"
              >
                Back
              </button>
            ) : <span />}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[44px] rounded-full bg-aisle-charcoal px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-aisle-terracotta transition-colors cursor-pointer"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isProvisioning}
                className="min-h-[44px] rounded-full bg-aisle-charcoal px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-aisle-terracotta transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isProvisioning ? 'Creating your invitation…' : 'Create my invitation'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
