import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const url = new URL(request.url);

    const { data: guest } = await supabaseAdmin
      .from('guests')
      .select('id, event_id, access_token')
      .eq('access_token', token)
      .single();

    if (guest) {
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('guests')
        .update({ last_clicked_at: now })
        .eq('id', guest.id);

      await supabaseAdmin.from('communication_events').insert({
        event_id: guest.event_id,
        guest_id: guest.id,
        event_type: 'guest_link_clicked',
        metadata: { timestamp: now },
      });
    }

    return NextResponse.redirect(`${url.origin}/g/${token}`);
  } catch (err) {
    console.error('Guest click tracking error:', err);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
