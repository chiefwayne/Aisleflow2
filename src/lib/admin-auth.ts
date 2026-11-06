import 'server-only';

import { randomBytes, timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

/** Creates the secret that forms a couple's private admin link: /admin/<token>. */
export function generateAdminToken(): string {
  return `admin_${randomBytes(24).toString('base64url')}`;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** True only when the token matches the one stored for this event. */
export async function verifyAdminToken(eventId?: string | null, token?: string | null): Promise<boolean> {
  if (!eventId || !token) return false;

  const { data, error } = await supabaseAdmin
    .from('events')
    .select('admin_token')
    .eq('id', eventId)
    .maybeSingle();

  if (error || !data?.admin_token) return false;
  return safeEqual(String(data.admin_token), token);
}

export async function requireAdminAccess(eventId?: string | null, token?: string | null): Promise<void> {
  if (!(await verifyAdminToken(eventId, token))) {
    throw new Error('Admin authorization is required.');
  }
}
