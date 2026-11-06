import { describe, expect, it } from 'vitest';
import { normalizeCustomSlug } from './custom-slug';

describe('normalizeCustomSlug', () => {
  it('turns a phrase into a short link', () => {
    expect(normalizeCustomSlug('Sarah & James 2027')).toEqual({ slug: 'sarah-james-2027' });
  });

  it('rejects links that are too short, too long or reserved', () => {
    expect(normalizeCustomSlug('ab')).toHaveProperty('error');
    expect(normalizeCustomSlug('a'.repeat(41))).toHaveProperty('error');
    expect(normalizeCustomSlug('admin')).toHaveProperty('error');
  });
});
