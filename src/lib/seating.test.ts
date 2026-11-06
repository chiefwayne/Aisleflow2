import { describe, expect, it } from 'vitest';
import { seatsFor, tableOccupancy } from './seating';

const guest = (id: string, extra: Record<string, unknown> = {}) => ({ id, rsvp_status: 'attending', table_id: null, plus_one_name: null, ...extra });

describe('seating', () => {
  it('counts a named plus-one as a second seat', () => {
    expect(seatsFor(guest('a'))).toBe(1);
    expect(seatsFor(guest('a', { plus_one_name: 'Sam' }))).toBe(2);
  });

  it('sums seats per table and flags tables over capacity', () => {
    const guests = [
      guest('a', { table_id: 't1', plus_one_name: 'Sam' }),
      guest('b', { table_id: 't1' }),
      guest('c', { table_id: 't2' }),
      guest('d', { table_id: 't1', rsvp_status: 'declined' }),
    ];
    const occupancy = tableOccupancy([{ id: 't1', capacity: 2 }, { id: 't2', capacity: 8 }], guests);
    expect(occupancy.t1).toEqual({ seated: 3, capacity: 2, over: true });
    expect(occupancy.t2).toEqual({ seated: 1, capacity: 8, over: false });
  });
});
