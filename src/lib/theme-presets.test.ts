import { describe, expect, it } from 'vitest';
import { BUILTIN_THEMES } from './theme-presets';
import { contrastRatio } from './invite-style';

describe('built-in theme presets', () => {
  for (const [id, theme] of Object.entries(BUILTIN_THEMES)) {
    it(`${id}: text, muted and accent colours read at 4.5:1 on the page`, () => {
      expect(contrastRatio(theme.text_color, theme.bg_color)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.muted_color, theme.bg_color)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.accent_color, theme.bg_color)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${id}: the RSVP band can use the theme's own page or text colour`, () => {
      const best = Math.max(contrastRatio(theme.bg_color, theme.accent_color), contrastRatio(theme.text_color, theme.accent_color));
      expect(best).toBeGreaterThanOrEqual(4.5);
    });
  }
});
