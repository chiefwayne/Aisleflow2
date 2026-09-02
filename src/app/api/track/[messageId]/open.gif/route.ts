import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 1x1 transparent GIF buffer
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: Request,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await context.params;

    // Lookup message by ID or tracking_token
    const { data: message } = await supabaseAdmin
      .from('communication_messages')
      .select('id, event_id, guest_id, campaign_id, opened_at')
      .or(`id.eq.${messageId},tracking_token.eq.${messageId}`)
      .single();

    if (message) {
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('communication_messages')
        .update({
          opened_at: message.opened_at || now,
          status: 'opened',
        })
        .eq('id', message.id);

      // Log event
      await supabaseAdmin.from('communication_events').insert({
        message_id: message.id,
        event_id: message.event_id,
        guest_id: message.guest_id,
        event_type: 'opened',
        metadata: { timestamp: now, userAgent: request.headers.get('user-agent') },
      });

      // Increment campaign opened count
      if (message.campaign_id) {
        const { data: camp } = await supabaseAdmin
          .from('communication_campaigns')
          .select('opened_count')
          .eq('id', message.campaign_id)
          .single();

        if (camp) {
          await supabaseAdmin
            .from('communication_campaigns')
            .update({ opened_count: (camp.opened_count || 0) + 1 })
            .eq('id', message.campaign_id);
        }
      }
    }

    return new NextResponse(TRANSPARENT_GIF_BUFFER, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (err) {
    console.error('Open pixel error:', err);
    return new NextResponse(TRANSPARENT_GIF_BUFFER, {
      headers: { 'Content-Type': 'image/gif' },
    });
  }
}
