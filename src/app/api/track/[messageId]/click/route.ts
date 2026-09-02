import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await context.params;
    const url = new URL(request.url);
    const destination = url.searchParams.get('to');

    // Find message
    const { data: message } = await supabaseAdmin
      .from('communication_messages')
      .select('id, event_id, guest_id, campaign_id, guests(access_token)')
      .or(`id.eq.${messageId},tracking_token.eq.${messageId}`)
      .single();

    if (message) {
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('communication_messages')
        .update({
          clicked_at: now,
          status: 'clicked',
        })
        .eq('id', message.id);

      await supabaseAdmin.from('communication_events').insert({
        message_id: message.id,
        event_id: message.event_id,
        guest_id: message.guest_id,
        event_type: 'clicked',
        metadata: { destination, timestamp: now },
      });

      if (message.campaign_id) {
        const { data: camp } = await supabaseAdmin
          .from('communication_campaigns')
          .select('clicked_count')
          .eq('id', message.campaign_id)
          .single();

        if (camp) {
          await supabaseAdmin
            .from('communication_campaigns')
            .update({ clicked_count: (camp.clicked_count || 0) + 1 })
            .eq('id', message.campaign_id);
        }
      }

      if (destination) {
        return NextResponse.redirect(destination);
      }

      const guestToken = (message as any).guests?.access_token;
      if (guestToken) {
        return NextResponse.redirect(`${url.origin}/g/${guestToken}`);
      }
    }

    return NextResponse.redirect(destination || `${url.origin}/`);
  } catch (err) {
    console.error('Click tracking error:', err);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
