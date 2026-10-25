'use client';

import React, { useEffect, useState } from 'react';
import {
  DesignRequestStatus,
  DesignServiceRequest,
  listDesignRequestsAction,
  setDesignRequestStatusAction,
} from '@/app/actions/design-service-actions';

const STATUSES: DesignRequestStatus[] = ['new', 'quoted', 'in_progress', 'done', 'declined'];

/** Owner inbox for done-for-you design requests. */
export default function OwnerDesignRequests({ ownerToken }: { ownerToken: string }) {
  const [requests, setRequests] = useState<DesignServiceRequest[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    listDesignRequestsAction(ownerToken).then((r) => ('error' in r ? setError(r.error) : setRequests(r.requests)));
  }, [ownerToken]);

  const setStatus = async (id: string, status: DesignRequestStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const result = await setDesignRequestStatusAction(ownerToken, id, status);
    if (!result.success) setError('Could not update the request.');
  };

  const open = requests.filter((r) => r.status === 'new' || r.status === 'quoted' || r.status === 'in_progress');

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-3 text-xs">
      <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block">
        Design requests ({open.length} open)
      </span>
      {error && <p className="text-rose-700">{error}</p>}
      {requests.length === 0 && !error && <p className="text-stone-500">No requests yet.</p>}
      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {requests.map((r) => (
          <li key={r.id} className="rounded-2xl border border-stone-100 p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <strong className="font-serif text-stone-900">{r.events?.couple_names || 'Event'}</strong>
              <select
                value={r.status}
                onChange={(e) => setStatus(r.id, e.target.value as DesignRequestStatus)}
                aria-label="Request status"
                className="rounded-lg border border-stone-200 px-1.5 py-1"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <a href={`mailto:${r.contact_email}`} className="text-stone-600 underline">
              {r.contact_email}
            </a>
            <p className="text-stone-700 whitespace-pre-line">{r.details}</p>
            {r.inspiration && <p className="text-stone-500 break-words">Inspiration: {r.inspiration}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
