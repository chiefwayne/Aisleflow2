import { describe, expect, it } from 'vitest';
import { calendarMonth, contrastRatio, monogram, readableOn } from './invite-style';

describe('monogram', () => {
  it('takes the first letter of each partner', () => {
    expect(monogram('Tom & Jerry')).toBe('TJ');
    expect(monogram('Grace and Noah')).toBe('GN');
    expect(monogram('ana y luís')).toBe('AL');
  });

  it('copes with one name or nothing', () => {
    expect(monogram('Madeleine')).toBe('M');
    expect(monogram('')).toBe('');
    expect(monogram(null)).toBe('');
  });
});

describe('calendarMonth', () => {
  it('lays out August 2027 starting on Sunday the 1st, Monday first', () => {
    const cal = calendarMonth('2027-08-14T00:00:00.000Z');
    expect(cal).toMatchObject({ year: 2027, month: 7, day: 14 });
    expect(cal.weeks[0]).toEqual([null, null, null, null, null, null, 1]);
    expect(cal.weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(cal.weeks.every((w) => w.length === 7)).toBe(true);
  });

  it('reads the date in UTC so the day never shifts', () => {
    expect(calendarMonth('2027-06-12').day).toBe(12);
  });
});

describe('readableOn', () => {
  it('picks light text on a dark accent and dark text on a light one', () => {
    expect(readableOn('#4A4A4A', ['#2C2523', '#FAF7F2'])).toBe('#FAF7F2');
    expect(readableOn('#E9D8A6', ['#2C2523', '#FAF7F2'])).toBe('#2C2523');
  });

  it('gives black on white a 21:1 ratio', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 0);
  });
});
