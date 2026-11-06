/**
 * An RSVP comes from the guest's browser, so every id in it is untrusted.
 * This keeps only the parts that belong to the guest's own party and event.
 */
export interface RsvpScope {
  guestIds: string[];
  scheduleItemIds: string[];
  questionIds: string[];
}

export interface RsvpPayload {
  guests?: Array<{ id: string; rsvp_status?: string; [key: string]: unknown }>;
  subEvents?: Record<string, Record<string, string>>;
  customAnswers?: Record<string, unknown>;
}

const RSVP_STATUSES = new Set(['attending', 'declined', 'pending']);
const SUB_EVENT_STATUSES = new Set(['attending', 'declined']);

export function scopeRsvpPayload(
  payload: RsvpPayload,
  scope: RsvpScope
): { error: string } | Required<RsvpPayload> {
  const guestIds = new Set(scope.guestIds);
  const scheduleItemIds = new Set(scope.scheduleItemIds);
  const questionIds = new Set(scope.questionIds);

  const guests = payload.guests || [];
  if (guests.some((g) => !guestIds.has(g.id))) {
    return { error: 'This RSVP can only update your own party.' };
  }
  if (guests.some((g) => g.rsvp_status !== undefined && !RSVP_STATUSES.has(g.rsvp_status))) {
    return { error: 'Invalid RSVP status.' };
  }

  const subEvents: Record<string, Record<string, string>> = {};
  for (const [guestId, replies] of Object.entries(payload.subEvents || {})) {
    if (!guestIds.has(guestId)) continue;
    const kept = Object.fromEntries(
      Object.entries(replies || {}).filter(
        ([itemId, status]) => scheduleItemIds.has(itemId) && SUB_EVENT_STATUSES.has(status)
      )
    );
    if (Object.keys(kept).length > 0) subEvents[guestId] = kept;
  }

  const customAnswers = Object.fromEntries(
    Object.entries(payload.customAnswers || {}).filter(([questionId]) => questionIds.has(questionId))
  );

  return { guests, subEvents, customAnswers };
}
