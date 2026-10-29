import 'server-only';

import { timingSafeEqual } from 'crypto';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Owner (platform operator) access is controlled by OWNER_STUDIO_SECRET.
 * Without it, access is allowed only in local development and denied in production.
 */
export function verifyOwnerAccess(token?: string | null): boolean {
  const secret = process.env.OWNER_STUDIO_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!token) return false;
  return safeEqual(secret, token);
}

export function requireOwnerAccess(token?: string | null) {
  if (!verifyOwnerAccess(token)) {
    throw new Error('Owner authorization is required.');
  }
}
