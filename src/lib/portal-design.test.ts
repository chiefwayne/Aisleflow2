import { describe, expect, it } from 'vitest';
import { isStudioDesign, orderedVisibleSections, stripStudioLayout } from './portal-design';

describe('stripStudioLayout', () => {
  it('removes Studio-only layout keys and keeps everything else', () => {
    const stripped = stripStudioLayout<Record<string, unknown>>({ accent_color: '#123456', container_layout: 'inset', section_order: ['rsvp'] });
    expect(stripped).toEqual({ accent_color: '#123456' });
    expect(isStudioDesign(stripped as { container_layout?: never })).toBe(false);
  });
});

describe('orderedVisibleSections', () => {
  it('drops unknown and hidden ids and appends missing sections', () => {
    const order = orderedVisibleSections({ section_order: ['rsvp', 'hero', 'faq'], hidden_sections: ['photos'] });
    expect(order[0]).toBe('rsvp');
    expect(order[1]).toBe('faq');
    expect(order).not.toContain('photos');
    expect(order).not.toContain('hero' as never);
    expect(order).toHaveLength(8);
  });
});
