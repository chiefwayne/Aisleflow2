import { describe, expect, it } from 'vitest';
import { scopeRsvpPayload } from './rsvp-scope';

const scope = {
  guestIds: ['me', 'partner'],
  scheduleItemIds: ['ceremony', 'brunch'],
  questionIds: ['song'],
};

describe('scopeRsvpPayload', () => {
  it('keeps updates for guests in the party', () => {
    const result = scopeRsvpPayload(
      { guests: [{ id: 'me', rsvp_status: 'attending' }, { id: 'partner', rsvp_status: 'declined' }] },
      scope
    );
    expect(result).toEqual({
      guests: [{ id: 'me', rsvp_status: 'attending' }, { id: 'partner', rsvp_status: 'declined' }],
      subEvents: {},
      customAnswers: {},
    });
  });

  it('rejects a guest outside the party', () => {
    expect(scopeRsvpPayload({ guests: [{ id: 'stranger', rsvp_status: 'declined' }] }, scope)).toEqual({
      error: 'This RSVP can only update your own party.',
    });
  });

  it('rejects an unknown RSVP status', () => {
    expect(scopeRsvpPayload({ guests: [{ id: 'me', rsvp_status: 'hacked' }] }, scope)).toEqual({
      error: 'Invalid RSVP status.',
    });
  });

  it('drops sub-event replies for other guests, other events and bad statuses', () => {
    const result = scopeRsvpPayload(
      {
        subEvents: {
          me: { ceremony: 'attending', otherwedding: 'attending', brunch: 'maybe' },
          stranger: { ceremony: 'declined' },
        },
      },
      scope
    );
    expect(result).toEqual({ guests: [], subEvents: { me: { ceremony: 'attending' } }, customAnswers: {} });
  });

  it('drops answers to questions from other events', () => {
    const result = scopeRsvpPayload({ customAnswers: { song: 'Dancing Queen', foreign: 'x' } }, scope);
    expect(result).toEqual({ guests: [], subEvents: {}, customAnswers: { song: 'Dancing Queen' } });
  });

  it('treats a missing payload as empty', () => {
    expect(scopeRsvpPayload({}, scope)).toEqual({ guests: [], subEvents: {}, customAnswers: {} });
  });
});
