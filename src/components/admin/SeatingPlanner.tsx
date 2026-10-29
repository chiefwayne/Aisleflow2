'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Printer, Trash2 } from 'lucide-react';
import type { EventRecord, GuestRecord } from '@/lib/types';
import { SeatingTable, seatsFor, tableOccupancy } from '@/lib/seating';
import {
  assignGuestTableAction,
  deleteSeatingTableAction,
  listSeatingTablesAction,
  saveSeatingTableAction,
} from '@/app/actions/seating-actions';

interface SeatingPlannerProps {
  event: EventRecord;
  guests: GuestRecord[];
  onGuestsChange: (update: (prev: GuestRecord[]) => GuestRecord[]) => void;
}

/** Tables with capacities, and a table picker per attending guest. Plus-ones take a seat. */
export default function SeatingPlanner({ event, guests, onGuestsChange }: SeatingPlannerProps) {
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState(8);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'unassigned' | 'all'>('unassigned');

  useEffect(() => {
    listSeatingTablesAction(event.id, event.admin_token).then((result) => {
      if ('tables' in result) setTables(result.tables);
      else setError(result.error);
    });
  }, [event.id, event.admin_token]);

  const seatable = guests.filter((g) => g.rsvp_status !== 'declined');
  const occupancy = tableOccupancy(tables, seatable);
  const unassignedSeats = seatable.filter((g) => !g.table_id).reduce((sum, g) => sum + seatsFor(g), 0);
  const listed = filter === 'unassigned' ? seatable.filter((g) => !g.table_id) : seatable;

  const addTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await saveSeatingTableAction({
      eventId: event.id,
      adminToken: event.admin_token,
      name: newName || `Table ${tables.length + 1}`,
      capacity: newCapacity,
    });
    if ('error' in result) return setError(result.error);
    setTables((prev) => [...prev, result.table]);
    setNewName('');
  };

  const removeTable = async (table: SeatingTable) => {
    if (!confirm(`Remove ${table.name}? Its guests become unassigned.`)) return;
    const result = await deleteSeatingTableAction(event.id, event.admin_token, table.id);
    if (!result.success) return setError('Could not remove the table.');
    setTables((prev) => prev.filter((t) => t.id !== table.id));
    onGuestsChange((prev) => prev.map((g) => (g.table_id === table.id ? { ...g, table_id: null } : g)));
  };

  const assign = async (guest: GuestRecord, tableId: string | null) => {
    const previous = guest.table_id ?? null;
    onGuestsChange((prev) => prev.map((g) => (g.id === guest.id ? { ...g, table_id: tableId } : g)));
    const result = await assignGuestTableAction(event.id, event.admin_token, guest.id, tableId);
    if (!result.success) {
      onGuestsChange((prev) => prev.map((g) => (g.id === guest.id ? { ...g, table_id: previous } : g)));
      setError('Could not seat that guest. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
      <section className="lg:col-span-7 rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Tables</h3>
            <p className="text-aisle-muted mt-0.5">
              {unassignedSeats} {unassignedSeats === 1 ? 'seat' : 'seats'} still to place. Plus-ones take a seat.
            </p>
          </div>
          <a
            href={`/admin/${event.admin_token}/seating/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-aisle-border px-4 font-semibold text-aisle-charcoal hover:bg-aisle-sand"
          >
            <Printer className="h-3.5 w-3.5" /> Print plan & place cards
          </a>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={addTable} className="flex flex-wrap items-end gap-2">
          <label className="flex-1 min-w-[140px]">
            <span className="block font-medium text-aisle-warm mb-1">Table name</span>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Table ${tables.length + 1}`}
              maxLength={60}
              className="w-full rounded-xl border border-aisle-border px-3 py-2.5 focus:outline-none focus:border-aisle-terracotta"
            />
          </label>
          <label className="w-24">
            <span className="block font-medium text-aisle-warm mb-1">Seats</span>
            <input
              type="number"
              min={1}
              max={50}
              value={newCapacity}
              onChange={(e) => setNewCapacity(Number(e.target.value))}
              className="w-full rounded-xl border border-aisle-border px-3 py-2.5 focus:outline-none focus:border-aisle-terracotta"
            />
          </label>
          <button type="submit" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-aisle-charcoal px-4 font-semibold text-white hover:bg-aisle-terracotta">
            <Plus className="h-3.5 w-3.5" /> Add table
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tables.map((table) => {
            const seated = guests.filter((g) => g.table_id === table.id && g.rsvp_status !== 'declined');
            const occ = occupancy[table.id];
            return (
              <div key={table.id} className={`rounded-2xl border p-4 space-y-2 ${occ?.over ? 'border-red-300 bg-red-50/50' : 'border-aisle-border bg-aisle-sand/20'}`}>
                <div className="flex items-center justify-between gap-2">
                  <strong className="font-serif text-sm text-aisle-charcoal">{table.name}</strong>
                  <span className={occ?.over ? 'font-semibold text-red-700' : 'text-aisle-muted'}>
                    {occ?.seated ?? 0}/{table.capacity}
                  </span>
                </div>
                <ul className="space-y-1">
                  {seated.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-2">
                      <span>
                        {g.first_name} {g.last_name || ''}
                        {g.plus_one_name && <span className="text-aisle-muted"> + {g.plus_one_name}</span>}
                      </span>
                      <button type="button" onClick={() => assign(g, null)} className="text-aisle-muted hover:text-red-700 underline">
                        remove
                      </button>
                    </li>
                  ))}
                  {seated.length === 0 && <li className="text-aisle-muted">No one yet</li>}
                </ul>
                <button type="button" onClick={() => removeTable(table)} aria-label={`Remove ${table.name}`} className="inline-flex items-center gap-1 text-aisle-muted hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" /> Remove table
                </button>
              </div>
            );
          })}
          {tables.length === 0 && <p className="text-aisle-muted">Add your first table to start seating guests.</p>}
        </div>
      </section>

      <section className="lg:col-span-5 rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Guests</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'unassigned' | 'all')}
            aria-label="Which guests to show"
            className="rounded-xl border border-aisle-border px-3 py-2"
          >
            <option value="unassigned">Not seated yet</option>
            <option value="all">Everyone</option>
          </select>
        </div>
        <p className="text-aisle-muted">Guests who declined aren't listed. Pending guests can be seated in advance.</p>
        <ul className="divide-y divide-aisle-border/60">
          {listed.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-medium text-aisle-charcoal">{g.first_name} {g.last_name || ''}</span>
                {g.plus_one_name && <span className="text-aisle-muted"> + {g.plus_one_name}</span>}
                {g.rsvp_status === 'pending' && <span className="ml-1.5 text-amber-700">(pending)</span>}
              </span>
              <select
                value={g.table_id || ''}
                onChange={(e) => assign(g, e.target.value || null)}
                aria-label={`Table for ${g.first_name}`}
                disabled={tables.length === 0}
                className="rounded-xl border border-aisle-border px-2.5 py-2 max-w-[150px]"
              >
                <option value="">Not seated</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({occupancy[t.id]?.seated ?? 0}/{t.capacity})
                  </option>
                ))}
              </select>
            </li>
          ))}
          {listed.length === 0 && <li className="py-3 text-aisle-muted">Everyone is seated.</li>}
        </ul>
      </section>
    </div>
  );
}
