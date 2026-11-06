'use client';

import React, { useState } from 'react';
import { Check, ChevronRight, Circle } from 'lucide-react';
import type { EventRecord } from '@/lib/types';
import { getEventReadiness, missingRequired, ReadinessCounts, ReadinessTab } from '@/lib/event-readiness';
import { featureError, hasFeature } from '@/lib/plans';
import { setEventPublishedAction } from '@/app/actions/wedding-actions';

interface PublishReadinessPanelProps {
  event: EventRecord;
  counts: ReadinessCounts;
  onNavigate: (tab: ReadinessTab) => void;
  onEventChange: (event: EventRecord) => void;
}

export default function PublishReadinessPanel({ event, counts, onNavigate, onEventChange }: PublishReadinessPanelProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const items = getEventReadiness(event, counts);
  const blockers = missingRequired(items);
  const planAllowsPublish = hasFeature(event, 'publish');
  const canPublish = blockers.length === 0 && planAllowsPublish;

  const changePublished = async (publish: boolean) => {
    if (!publish && !window.confirm('Unpublish? Guests can still open their links, but you won’t be able to send messages until you publish again.')) {
      return;
    }
    setPending(true);
    setError('');
    try {
      const result = await setEventPublishedAction({ eventId: event.id, adminToken: event.admin_token, publish });
      if (result.success && result.event) onEventChange(result.event as EventRecord);
      else setError(result.error || 'Could not change publish status.');
    } catch (err: any) {
      setError(err?.message || 'Could not change publish status.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-aisle-border bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Publish readiness</h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                event.is_live ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {event.is_live ? 'Live' : 'Draft'}
            </span>
          </div>
          <p className="text-xs text-aisle-muted mt-1">
            {event.is_live
              ? 'Your event is live. You can send invitations and reminders.'
              : blockers.length > 0
                ? `Finish ${blockers.length} required ${blockers.length === 1 ? 'item' : 'items'} to publish.`
                : planAllowsPublish
                  ? 'Everything required is done. Publish to start sending invitations.'
                  : featureError('publish')}
          </p>
        </div>

        {event.is_live ? (
          <button
            type="button"
            onClick={() => changePublished(false)}
            disabled={pending}
            className="min-h-[44px] rounded-full border border-aisle-border px-5 text-xs font-semibold uppercase tracking-wider text-aisle-charcoal hover:bg-aisle-sand disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Unpublish'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => changePublished(true)}
            disabled={pending || !canPublish}
            className="min-h-[44px] rounded-full bg-aisle-charcoal px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-aisle-terracotta transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? 'Publishing…' : 'Publish / Go live'}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => onNavigate(item.tab)}
              className="group flex w-full min-h-[44px] items-center gap-3 rounded-2xl border border-aisle-border bg-aisle-sand/30 p-3.5 text-left hover:border-aisle-terracotta hover:bg-white transition-colors"
            >
              {item.done ? (
                <Check className="h-4 w-4 text-emerald-600 shrink-0" aria-label="Done" />
              ) : (
                <Circle
                  className={`h-4 w-4 shrink-0 ${item.required ? 'text-amber-600' : 'text-aisle-muted'}`}
                  aria-label="Not done"
                />
              )}
              <span className="flex-1">
                <strong className="text-aisle-charcoal">{item.label}</strong>
                {item.required && !item.done && (
                  <span className="ml-2 text-xs font-semibold text-amber-700">Required</span>
                )}
                {!item.required && !item.done && (
                  <span className="ml-2 text-xs text-aisle-muted">Recommended</span>
                )}
                <span className="block text-aisle-muted text-xs">{item.detail}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-aisle-muted shrink-0 group-hover:text-aisle-terracotta" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
