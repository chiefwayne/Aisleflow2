import { describe, expect, it } from 'vitest';
import { whatsappShareUrl } from './share';

const event = { couple_names: 'Sarah & James' };

describe('whatsappShareUrl', () => {
  it('addresses the guest by phone number and includes their link', () => {
    const url = whatsappShareUrl({ first_name: 'Elena', phone: '+1 (415) 555-0100' }, event, 'https://aisleflow.app/g/gt_abc');
    expect(url.startsWith('https://wa.me/14155550100?text=')).toBe(true);
    const text = decodeURIComponent(url.split('?text=')[1]);
    expect(text).toContain('Elena');
    expect(text).toContain('Sarah & James');
    expect(text).toContain('https://aisleflow.app/g/gt_abc');
  });

  it('lets the sender pick a contact when the guest has no phone', () => {
    const url = whatsappShareUrl({ first_name: 'Elena', phone: null }, event, 'https://x.test/g/1');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
  });
});
