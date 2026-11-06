export interface SeatingTable {
  id: string;
  event_id?: string;
  name: string;
  capacity: number;
  sort_order?: number;
}

type SeatedGuest = { rsvp_status?: string | null; table_id?: string | null; plus_one_name?: string | null };

/** A guest takes one seat, two when they bring a named plus-one. */
export function seatsFor(guest: SeatedGuest): number {
  return guest.plus_one_name ? 2 : 1;
}

/** Seats taken at each table by attending guests. Declined guests don't hold a seat. */
export function tableOccupancy(
  tables: Array<Pick<SeatingTable, 'id' | 'capacity'>>,
  guests: SeatedGuest[]
): Record<string, { seated: number; capacity: number; over: boolean }> {
  const result: Record<string, { seated: number; capacity: number; over: boolean }> = {};
  for (const table of tables) {
    const seated = guests
      .filter((g) => g.table_id === table.id && g.rsvp_status !== 'declined')
      .reduce((sum, g) => sum + seatsFor(g), 0);
    result[table.id] = { seated, capacity: table.capacity, over: seated > table.capacity };
  }
  return result;
}
