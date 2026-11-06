'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAccess } from '@/lib/admin-auth';
import { requireOwnerAccess } from '@/lib/owner-auth';
import { sendEmail } from '@/lib/email';

export type DesignRequestStatus = 'new' | 'quoted' | 'in_progress' | 'done' | 'declined';

export interface DesignServiceRequest {
  id: string;
  event_id: string;
  contact_email: string;
  details: string;
  inspiration: string | null;
  status: DesignRequestStatus;
  created_at: string;
  events?: { couple_names: string; wedding_date: string } | null;
}

const STATUSES: DesignRequestStatus[] = ['new', 'quoted', 'in_progress', 'done', 'declined'];

/** A couple asks the team to design their invitation. The owner is emailed when OWNER_NOTIFY_EMAIL is set. */
export async function requestDesignServiceAction(input: {
  eventId: string;
  adminToken: string;
  contactEmail: string;
  details: string;
  inspiration?: string;
}): Promise<{ request: DesignServiceRequest } | { error: string }> {
  try {
    await requireAdminAccess(input.eventId, input.adminToken);
    const email = input.contactEmail.trim().slice(0, 200);
    const details = input.details.trim().slice(0, 4000);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email address.' };
    if (details.length < 10) return { error: 'Tell us a little about the look you want.' };

    const { data, error } = await supabaseAdmin
      .from('design_service_requests')
      .insert({
        event_id: input.eventId,
        contact_email: email,
        details,
        inspiration: input.inspiration?.trim().slice(0, 2000) || null,
      })
      .select('id, event_id, contact_email, details, inspiration, status, created_at')
      .single();
    if (error) throw error;

    const notify = process.env.OWNER_NOTIFY_EMAIL;
    if (notify) {
      await sendEmail({
        to: notify,
        subject: 'New design service request',
        text: `A couple asked for a custom design.\n\nContact: ${email}\n\n${details}`,
      });
    }
    return { request: data as DesignServiceRequest };
  } catch (err: any) {
    console.error('requestDesignServiceAction error:', err);
    return { error: 'Could not send your request. Please try again.' };
  }
}

export async function listEventDesignRequestsAction(eventId: string, adminToken: string): Promise<{ requests: DesignServiceRequest[] }> {
  try {
    await requireAdminAccess(eventId, adminToken);
    const { data } = await supabaseAdmin
      .from('design_service_requests')
      .select('id, event_id, contact_email, details, inspiration, status, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    return { requests: (data || []) as DesignServiceRequest[] };
  } catch {
    return { requests: [] };
  }
}

// ---- Owner (platform operator) ----

export async function listDesignRequestsAction(ownerToken: string): Promise<{ requests: DesignServiceRequest[] } | { error: string }> {
  try {
    requireOwnerAccess(ownerToken);
    const { data, error } = await supabaseAdmin
      .from('design_service_requests')
      .select('id, event_id, contact_email, details, inspiration, status, created_at, events(couple_names, wedding_date)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return { requests: (data || []) as unknown as DesignServiceRequest[] };
  } catch {
    return { error: 'Could not load requests.' };
  }
}

export async function setDesignRequestStatusAction(
  ownerToken: string,
  id: string,
  status: DesignRequestStatus
): Promise<{ success: boolean }> {
  try {
    requireOwnerAccess(ownerToken);
    if (!STATUSES.includes(status)) return { success: false };
    const { error } = await supabaseAdmin.from('design_service_requests').update({ status }).eq('id', id);
    return { success: !error };
  } catch {
    return { success: false };
  }
}
