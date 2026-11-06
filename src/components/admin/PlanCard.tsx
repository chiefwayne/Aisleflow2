'use client';

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import type { EventRecord } from '@/lib/types';
import { isUpgrade, planOf, PLAN_NAMES, PlanId } from '@/lib/plans';
import { getEventPlanAction, startUpgradeCheckoutAction } from '@/app/actions/billing-actions';

const PLAN_DETAILS: Array<{ id: Exclude<PlanId, 'free'>; blurb: string; features: string[] }> = [
  {
    id: 'essentials',
    blurb: 'Publish your invitation and email your guests.',
    features: ['Publish and share your invitation', 'Email invitations and reminders', 'RSVPs, meals and questions', 'Registry and guest photos'],
  },
  {
    id: 'premium',
    blurb: 'Everything in Essentials, plus the extras.',
    features: ['Text message invitations and reminders', 'Your own song when guests open it', 'Design Studio for your own layout'],
  },
];

interface PlanCardProps {
  event: EventRecord;
  onPlanChange: (plan: PlanId) => void;
}

export default function PlanCard({ event, onPlanChange }: PlanCardProps) {
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState('');
  const current = planOf(event);

  // Checkout opens in a new tab; re-read the plan when the couple comes back to this one.
  useEffect(() => {
    const refresh = async () => {
      const result = await getEventPlanAction(event.id, event.admin_token);
      if ('plan' in result && result.plan !== planOf(event)) onPlanChange(result.plan);
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [event, onPlanChange]);

  const upgrade = async (plan: PlanId) => {
    setPendingPlan(plan);
    setError('');
    const result = await startUpgradeCheckoutAction({ eventId: event.id, adminToken: event.admin_token, plan });
    setPendingPlan(null);
    if ('url' in result) window.open(result.url, '_blank', 'noopener');
    else setError(result.error);
  };

  return (
    <div className="rounded-3xl border border-aisle-border bg-white p-6 sm:p-8 shadow-sm space-y-5">
      <div>
        <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Your plan: {PLAN_NAMES[current]}</h3>
        <p className="text-xs text-aisle-muted mt-1">
          {current === 'free'
            ? 'Build and preview everything for free. Choose a plan when you are ready to publish.'
            : 'One-off payment for this wedding. No subscription.'}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLAN_DETAILS.map((plan) => {
          const owned = !isUpgrade(current, plan.id);
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-4 space-y-3 text-xs ${
                current === plan.id ? 'border-aisle-terracotta bg-aisle-sand/40' : 'border-aisle-border'
              }`}
            >
              <div>
                <strong className="font-serif text-base text-aisle-charcoal">{PLAN_NAMES[plan.id]}</strong>
                <p className="text-aisle-muted mt-0.5">{plan.blurb}</p>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-aisle-warm">
                    <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              {owned ? (
                <p className="font-semibold text-emerald-700">{current === plan.id ? 'Current plan' : 'Included'}</p>
              ) : (
                <button
                  type="button"
                  onClick={() => upgrade(plan.id)}
                  disabled={pendingPlan !== null}
                  className="min-h-[44px] w-full rounded-full bg-aisle-charcoal px-4 font-semibold uppercase tracking-wider text-white hover:bg-aisle-terracotta disabled:opacity-50"
                >
                  {pendingPlan === plan.id ? 'Opening checkout…' : `Choose ${PLAN_NAMES[plan.id]}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
