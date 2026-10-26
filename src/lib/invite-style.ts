/** Small helpers for the invitation's hand-made details. */

/** "Tom & Jerry" → "TJ"; "Ana and Luís Costa" → "AL". Falls back to the first letter of the whole string. */
export function monogram(coupleNames: string | null | undefined): string {
  const parts = (coupleNames || '')
    .split(/\s*(?:&|\+|\band\b|\by\b|\bet\b|\be\b|\bund\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0].toUpperCase());
  if (initials.length > 0) return initials.join('');
  return (coupleNames || '').trim().charAt(0).toUpperCase();
}

/**
 * The wedding month as weeks starting on Monday, for the save-the-date calendar.
 * Dates are stored as midnight UTC, so the month is read in UTC. Empty cells are null.
 */
export function calendarMonth(isoDate: string): { year: number; month: number; day: number; weeks: (number | null)[][] } {
  const d = new Date(isoDate);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // Monday = 0

  const cells: (number | null)[] = [...Array(firstWeekday).fill(null)];
  for (let n = 1; n <= daysInMonth; n++) cells.push(n);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return { year, month, day, weeks };
}

function luminance(hex: string): number | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const full = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours (1 when either can't be read). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return 1;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Of the candidate colours, the one most readable on `background` (e.g. text on an accent-colour band). */
export function readableOn(background: string, candidates: string[]): string {
  return candidates.reduce((best, c) => (contrastRatio(c, background) > contrastRatio(best, background) ? c : best), candidates[0]);
}

function toHex(rgb: number[]): string {
  return '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
}

function parseHex(hex: string): number[] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const full = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

/**
 * `color`, moved step by step toward `toward` until it reaches `min` contrast on `background`.
 * Keeps the couple's hue where it already passes; unreadable colours come back as hex.
 */
export function ensureContrast(color: string, background: string, min: number, toward: string): string {
  if (contrastRatio(color, background) >= min) return color;
  const from = parseHex(color);
  const to = parseHex(toward);
  if (!from || !to) return toward;
  for (let t = 0.05; t <= 1; t += 0.05) {
    const candidate = toHex(from.map((v, i) => v + (to[i] - v) * t));
    if (contrastRatio(candidate, background) >= min) return candidate;
  }
  return toward;
}

/** True when text on this background should be light. */
export function isDarkBackground(background: string): boolean {
  return contrastRatio(background, '#FFFFFF') > contrastRatio(background, '#000000');
}
