// Server-only: row-level security blocks the public key, so read with the service role.
import { supabaseAdmin } from '@/lib/supabase';
import { featureError, hasFeature } from '@/lib/plans';
import type { EventRecord, GuestRecord } from '@/lib/types';
import type { SeatingTable } from '@/lib/seating';
import PrintButton from '@/components/admin/PrintButton';

interface PageProps {
  params: Promise<{ token: string }>;
}

/** Printable table plan followed by one place card per seated person (plus-ones included). */
export default async function SeatingPrintPage({ params }: PageProps) {
  const { token } = await params;
  const { data } = await supabaseAdmin.from('events').select('*').eq('admin_token', token).maybeSingle();
  const event = data as EventRecord | null;
  if (!event) return <p className="p-8 text-sm">This link is invalid or has expired.</p>;
  if (!hasFeature(event, 'seating')) return <p className="p-8 text-sm">{featureError('seating')}</p>;

  const [{ data: tableRows }, { data: guestRows }] = await Promise.all([
    supabaseAdmin.from('seating_tables').select('id, name, capacity, sort_order').eq('event_id', event.id).order('sort_order'),
    supabaseAdmin
      .from('guests')
      .select('id, first_name, last_name, plus_one_name, table_id, rsvp_status, meal_choice, plus_one_meal')
      .eq('event_id', event.id)
      .neq('rsvp_status', 'declined'),
  ]);
  const tables = (tableRows || []) as SeatingTable[];
  const guests = (guestRows || []) as GuestRecord[];
  const cards = tables.flatMap((table) =>
    guests
      .filter((g) => g.table_id === table.id)
      .flatMap((g) => [
        { name: `${g.first_name} ${g.last_name || ''}`.trim(), table: table.name, meal: g.meal_choice },
        ...(g.plus_one_name ? [{ name: g.plus_one_name, table: table.name, meal: g.plus_one_meal }] : []),
      ])
  );

  return (
    <main className="bg-white text-aisle-charcoal p-8 print:p-0">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="font-serif text-2xl font-semibold">{event.couple_names} · Seating</h1>
        <PrintButton />
      </div>

      <section className="break-after-page">
        <h2 className="font-serif text-xl font-semibold mb-4">Table plan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="rounded-xl border border-aisle-border p-4 break-inside-avoid">
              <h3 className="font-serif text-lg font-semibold">{table.name}</h3>
              <ul className="mt-2 space-y-0.5 text-sm">
                {guests
                  .filter((g) => g.table_id === table.id)
                  .flatMap((g) => [`${g.first_name} ${g.last_name || ''}`.trim(), ...(g.plus_one_name ? [g.plus_one_name] : [])])
                  .map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 print:mt-0">
        <h2 className="font-serif text-xl font-semibold mb-4 print:hidden">Place cards</h2>
        <div className="grid grid-cols-2 gap-0">
          {cards.map((card, i) => (
            <div key={i} className="border border-dashed border-aisle-border h-40 flex flex-col items-center justify-center text-center break-inside-avoid">
              <p className="font-serif text-2xl">{card.name}</p>
              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-aisle-terracotta">{card.table}</p>
              {card.meal && <p className="mt-1 text-xs text-aisle-muted">{card.meal}</p>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
