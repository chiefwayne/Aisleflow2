import { describe, expect, it } from 'vitest';
import { chapterSettings, DEFAULT_SECTION_ORDER, isStudioDesign, orderedVisibleSections, stripStudioLayout } from './portal-design';

describe('stripStudioLayout', () => {
  it('removes Studio-only layout keys and keeps everything else', () => {
    const stripped = stripStudioLayout<Record<string, unknown>>({ accent_color: '#123456', container_layout: 'inset', page_background_mode: 'pattern', section_order: ['rsvp'] });
    expect(stripped).toEqual({ accent_color: '#123456', section_order: ['rsvp'] });
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

describe('chapterSettings', () => {
  it('defaults to the original order with nothing hidden', () => {
    expect(chapterSettings(null)).toEqual({ order: DEFAULT_SECTION_ORDER, hidden: [] });
  });

  it('keeps the couple\'s order and never hides the RSVP', () => {
    const settings = chapterSettings({ section_order: ['rsvp', 'faq'], hidden_sections: ['faq', 'rsvp', 'bogus'] });
    expect(settings.order.slice(0, 2)).toEqual(['rsvp', 'faq']);
    expect(settings.order).toHaveLength(9);
    expect(settings.hidden).toEqual(['faq']);
  });
});
