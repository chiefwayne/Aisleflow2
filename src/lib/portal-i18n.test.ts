import { describe, expect, it } from 'vitest';
import { fill, PORTAL_LANGUAGES, portalLanguageOf, portalStrings } from './portal-i18n';

const placeholders = (text: string) => (text.match(/\{\w+\}/g) || []).sort();

describe('portal translations', () => {
  const english = portalStrings('en');

  for (const code of Object.keys(PORTAL_LANGUAGES)) {
    it(`${code} fills every string and keeps the same placeholders`, () => {
      const strings = portalStrings(code);
      for (const [key, value] of Object.entries(english)) {
        const translated = strings[key as keyof typeof english];
        expect(translated, `${code}.${key}`).toBeTruthy();
        expect(placeholders(translated), `${code}.${key}`).toEqual(placeholders(value));
      }
    });
  }

  it('falls back to English for unknown languages', () => {
    expect(portalLanguageOf('xx')).toBe('en');
    expect(portalStrings(null).thankYou).toBe('Thank You');
  });

  it('fills placeholders', () => {
    expect(fill('Step {step} of 4', { step: 2 })).toBe('Step 2 of 4');
  });
});
