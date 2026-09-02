import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = (formData.get('MessageStatus') as string)?.toLowerCase();
    const url = new URL(request.url);
    const messageId = url.searchParams.get('messageId');

    let query = supabaseAdmin.from('communication_messages').update({
      provider_status: messageStatus as any,
      status: messageStatus === 'delivered' ? 'sent' : messageStatus === 'failed' ? 'failed' : 'sent',
    });

    if (messageId) {
      query = query.eq('id', messageId);
    } else if (messageSid) {
      query = query.eq('provider_message_id', messageSid);
    }

    const { data: updated } = await query.select().single();

    if (updated) {
      await supabaseAdmin.from('communication_events').insert({
        message_id: updated.id,
        event_id: updated.event_id,
        guest_id: updated.guest_id,
        event_type: `twilio_${messageStatus}`,
        metadata: { messageSid, messageStatus },
      });
    }

    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err) {
    console.error('Twilio status callback error:', err);
    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
