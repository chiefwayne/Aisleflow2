import type { EventRecord } from '@/lib/types';

export type ReadinessTab = 'setup' | 'guests' | 'schedule' | 'questions' | 'registry';

export interface ReadinessItem {
  key: string;
  label: string;
  detail: string;
  done: boolean;
  required: boolean;
  tab: ReadinessTab;
}

export interface ReadinessCounts {
  guests: number;
  schedule: number;
  questions: number;
  registry: number;
}

const filled = (value?: string | null) => !!value && value.trim().length > 0;

/** Shared by the admin panel and the publish action, so both apply the same rules. */
export function getEventReadiness(event: EventRecord, counts: ReadinessCounts): ReadinessItem[] {
  return [
    {
      key: 'basics',
      label: 'Wedding basics',
      detail: 'Couple names, wedding date and RSVP deadline',
      done: filled(event.couple_names) && filled(event.wedding_date) && filled(event.rsvp_deadline),
      required: true,
      tab: 'setup',
    },
    {
      key: 'venue',
      label: 'Venue',
      detail: 'Venue name and address',
      done: filled(event.venue_name) && filled(event.venue_address),
      required: true,
      tab: 'setup',
    },
    {
      key: 'guests',
      label: 'Guest list',
      detail: counts.guests > 0 ? `${counts.guests} ${counts.guests === 1 ? 'guest' : 'guests'} added` : 'Add at least one guest',
      done: counts.guests > 0,
      required: true,
      tab: 'guests',
    },
    {
      key: 'schedule',
      label: 'Schedule',
      detail: counts.schedule > 0 ? `${counts.schedule} timeline items` : 'Add the day’s timeline',
      done: counts.schedule > 0,
      required: false,
      tab: 'schedule',
    },
    {
      key: 'questions',
      label: 'RSVP questions',
      detail: counts.questions > 0 ? `${counts.questions} questions` : 'Ask about meals, songs or travel',
      done: counts.questions > 0,
      required: false,
      tab: 'questions',
    },
    {
      key: 'registry',
      label: 'Gift registry',
      detail: counts.registry > 0 ? `${counts.registry} gifts or funds` : 'Add gifts or a honeymoon fund',
      done: counts.registry > 0,
      required: false,
      tab: 'registry',
    },
  ];
}

export function missingRequired(items: ReadinessItem[]): ReadinessItem[] {
  return items.filter((item) => item.required && !item.done);
}
