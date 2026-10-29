'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAccess } from '@/lib/admin-auth';
import { featureError, hasFeature } from '@/lib/plans';
import type { SeatingTable } from '@/lib/seating';

/** Admin link plus the Premium seating feature; every query is scoped to this event. */
async function requireSeating(eventId: string, adminToken: string): Promise<string | null> {
  await requireAdminAccess(eventId, adminToken);
  const { data } = await supabaseAdmin.from('events').select('plan').eq('id', eventId).single();
  return hasFeature(data || {}, 'seating') ? null : featureError('seating');
}

export async function listSeatingTablesAction(eventId: string, adminToken: string): Promise<{ tables: SeatingTable[] } | { error: string }> {
  try {
    const denied = await requireSeating(eventId, adminToken);
    if (denied) return { error: denied };
    const { data, error } = await supabaseAdmin
      .from('seating_tables')
      .select('id, event_id, name, capacity, sort_order')
      .eq('event_id', eventId)
      .order('sort_order')
      .order('created_at');
    if (error) throw error;
    return { tables: (data || []) as SeatingTable[] };
  } catch {
    return { error: 'Could not load tables.' };
  }
}

export async function saveSeatingTableAction(input: {
  eventId: string;
  adminToken: string;
  id?: string;
  name: string;
  capacity: number;
}): Promise<{ table: SeatingTable } | { error: string }> {
  try {
    const denied = await requireSeating(input.eventId, input.adminToken);
    if (denied) return { error: denied };
    const name = input.name.trim().slice(0, 60);
    const capacity = Math.round(Number(input.capacity));
    if (!name) return { error: 'Give the table a name.' };
    if (!(capacity >= 1 && capacity <= 50)) return { error: 'Capacity must be between 1 and 50.' };

    const query = input.id
      ? supabaseAdmin.from('seating_tables').update({ name, capacity }).eq('id', input.id).eq('event_id', input.eventId)
      : supabaseAdmin.from('seating_tables').insert({ event_id: input.eventId, name, capacity, sort_order: Date.now() % 1_000_000 });
    const { data, error } = await query.select('id, event_id, name, capacity, sort_order').single();
    if (error) throw error;
    revalidatePath(`/admin/${input.adminToken}`);
    return { table: data as SeatingTable };
  } catch {
    return { error: 'Could not save the table.' };
  }
}

export async function deleteSeatingTableAction(eventId: string, adminToken: string, tableId: string): Promise<{ success: boolean }> {
  try {
    if (await requireSeating(eventId, adminToken)) return { success: false };
    // Guests at the table become unassigned (foreign key: on delete set null).
    const { error } = await supabaseAdmin.from('seating_tables').delete().eq('id', tableId).eq('event_id', eventId);
    return { success: !error };
  } catch {
    return { success: false };
  }
}

export async function assignGuestTableAction(
  eventId: string,
  adminToken: string,
  guestId: string,
  tableId: string | null
): Promise<{ success: boolean }> {
  try {
    if (await requireSeating(eventId, adminToken)) return { success: false };
    if (tableId) {
      const { data: table } = await supabaseAdmin.from('seating_tables').select('id').eq('id', tableId).eq('event_id', eventId).maybeSingle();
      if (!table) return { success: false };
    }
    const { error } = await supabaseAdmin
      .from('guests')
      .update({ table_id: tableId, updated_at: new Date().toISOString() })
      .eq('id', guestId)
      .eq('event_id', eventId);
    return { success: !error };
  } catch {
    return { success: false };
  }
}
