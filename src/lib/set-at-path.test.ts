import { describe, expect, it } from 'vitest';
import { setAtPath } from './set-at-path';

describe('setAtPath', () => {
  it('replaces a nested array item field without touching the original', () => {
    const original = { faq: { enabled: true, items: [{ question: 'Q1', answer: 'A1' }, { question: 'Q2', answer: 'A2' }] } };
    const next = setAtPath(original, ['faq', 'items', '1', 'answer'], 'New');
    expect(next.faq.items[1]).toEqual({ question: 'Q2', answer: 'New' });
    expect(next.faq.items[0]).toBe(original.faq.items[0]);
    expect(original.faq.items[1].answer).toBe('A2');
    expect(Array.isArray(next.faq.items)).toBe(true);
  });

  it('creates missing objects along the way', () => {
    expect(setAtPath({}, ['travel', 'hotel_info'], 'Hotel')).toEqual({ travel: { hotel_info: 'Hotel' } });
  });
});
