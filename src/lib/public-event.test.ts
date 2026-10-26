import { describe, expect, it } from 'vitest';
import { toPublicEvent } from './public-event';
import type { EventRecord } from './types';

const event = {
  id: 'e1',
  slug: 'secret-slug',
  admin_token: 'admin_x',
  admin_email: 'couple@example.com',
  stripe_customer_id: 'cus_1',
  launch_notes: 'internal',
  publish_notes: 'internal',
  album_token: 'al_x',
  couple_names: 'A & B',
  custom_sections: { faq: { items: [] }, planning: { tasks: [] }, website: { status: 'draft' } },
} as unknown as EventRecord;

describe('toPublicEvent', () => {
  it('keeps only public fields and sections', () => {
    const pub = toPublicEvent(event) as unknown as Record<string, unknown>;
    expect(pub.admin_token).toBe('');
    expect(pub.admin_email).toBe('');
    expect(pub.slug).toBe('');
    expect(pub.album_token).toBeNull();
    expect(pub).not.toHaveProperty('stripe_customer_id');
    expect(pub).not.toHaveProperty('launch_notes');
    expect(pub.custom_sections).toEqual({ faq: { items: [] } });
  });

  it('passes the dress-code palette through to guests', () => {
    const withPalette = { ...event, custom_sections: { dress_palette: ['#C9B79C', '#7A8B6F'] } } as unknown as EventRecord;
    expect(toPublicEvent(withPalette).custom_sections).toEqual({ dress_palette: ['#C9B79C', '#7A8B6F'] });
  });

  it('keeps the album link for invited guests', () => {
    expect(toPublicEvent(event, { includeAlbum: true }).album_token).toBe('al_x');
  });
});
