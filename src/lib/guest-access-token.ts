import { randomBytes } from 'crypto';

export function createGuestAccessToken(): string {
  return `gt_${randomBytes(16).toString('hex')}`;
}
