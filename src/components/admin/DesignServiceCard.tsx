'use client';

import React, { useEffect, useState } from 'react';
import type { EventRecord } from '@/lib/types';
import {
  DesignServiceRequest,
  listEventDesignRequestsAction,
  requestDesignServiceAction,
} from '@/app/actions/design-service-actions';

const STATUS_LABELS: Record<DesignServiceRequest['status'], string> = {
  new: 'Received, we will reply with a quote',
  quoted: 'Quote sent, check your email',
  in_progress: 'Our designers are working on it',
  done: 'Done',
  declined: 'Closed',
};

/** Done-for-you design: the couple describes what they want; the team replies with a quote and builds it. */
export default function DesignServiceCard({ event }: { event: EventRecord }) {
  const [requests, setRequests] = useState<DesignServiceRequest[]>([]);
  const [email, setEmail] = useState(event.admin_email || '');
  const [details, setDetails] = useState('');
  const [inspiration, setInspiration] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    listEventDesignRequestsAction(event.id, event.admin_token).then((r) => setRequests(r.requests));
  }, [event.id, event.admin_token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const result = await requestDesignServiceAction({
      eventId: event.id,
      adminToken: event.admin_token,
      contactEmail: email,
      details,
      inspiration,
    });
    setPending(false);
    if ('error' in result) return setMessage({ text: result.error, ok: false });
    setRequests((prev) => [result.request, ...prev]);
    setDetails('');
    setInspiration('');
    setMessage({ text: 'Thank you! We will email you a quote shortly.', ok: true });
  };

  return (
    <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-4 text-xs">
      <div>
        <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Have our designers build it</h3>
        <p className="text-aisle-muted mt-1">
          Tell us the look you want and our team will design your invitation for you. We reply with a quote before any work starts.
        </p>
      </div>

      {requests.length > 0 && (
        <ul className="space-y-1.5">
          {requests.map((r) => (
            <li key={r.id} className="rounded-xl bg-aisle-sand/40 px-3 py-2">
              <strong className="text-aisle-charcoal">{STATUS_LABELS[r.status]}</strong>
              <span className="text-aisle-muted"> · sent {new Date(r.created_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="block font-medium text-aisle-warm mb-1">Your email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-aisle-border px-3 py-2.5 focus:outline-none focus:border-aisle-terracotta"
          />
        </label>
        <label className="block">
          <span className="block font-medium text-aisle-warm mb-1">What would you like?</span>
          <textarea
            required
            rows={3}
            maxLength={4000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Colours, mood, venue style, anything you love or want to avoid"
            className="w-full rounded-xl border border-aisle-border px-3 py-2.5 focus:outline-none focus:border-aisle-terracotta"
          />
        </label>
        <label className="block">
          <span className="block font-medium text-aisle-warm mb-1">Inspiration links (optional)</span>
          <input
            value={inspiration}
            onChange={(e) => setInspiration(e.target.value)}
            maxLength={2000}
            placeholder="Pinterest boards, photos, your paper invitation…"
            className="w-full rounded-xl border border-aisle-border px-3 py-2.5 focus:outline-none focus:border-aisle-terracotta"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-[44px] rounded-full bg-aisle-charcoal px-5 font-semibold uppercase tracking-wider text-white hover:bg-aisle-terracotta disabled:opacity-50"
        >
          {pending ? 'Sending…' : 'Request a quote'}
        </button>
        {message && (
          <p role="status" className={`rounded-xl px-4 py-3 ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
}
