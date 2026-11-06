export interface IcsEvent {
  uid: string;
  title: string;
  start: string; // ISO date-time, or YYYY-MM-DD for an all-day event
  end?: string | null;
  location?: string;
  description?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

const toUtc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const escapeText = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function buildIcs(events: IcsEvent[]): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AisleFlow//Wedding//EN', 'CALSCALE:GREGORIAN'];
  const stamp = toUtc(new Date());

  for (const ev of events) {
    lines.push('BEGIN:VEVENT', `UID:${ev.uid}@aisleflow`, `DTSTAMP:${stamp}`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(ev.start)) {
      const day = ev.start.replace(/-/g, '');
      const next = new Date(`${ev.start}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${toUtc(next).slice(0, 8)}`);
    } else {
      const start = new Date(ev.start);
      // Default to a two-hour block when no end time is stored.
      const end = ev.end ? new Date(ev.end) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      lines.push(`DTSTART:${toUtc(start)}`, `DTEND:${toUtc(end)}`);
    }
    lines.push(`SUMMARY:${escapeText(ev.title)}`);
    if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
