import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const eventType = payload.type;
    const emailId = payload.data?.email_id || payload.data?.id;

    if (emailId) {
      const { data: message } = await supabaseAdmin
        .from('communication_messages')
        .select('*')
        .eq('provider_message_id', emailId)
        .single();

      if (message) {
        let status = message.status;
        if (eventType === 'email.delivered') status = 'sent';
        if (eventType === 'email.bounced' || eventType === 'email.failed') status = 'failed';
        if (eventType === 'email.opened') status = 'opened';
        if (eventType === 'email.clicked') status = 'clicked';

        await supabaseAdmin
          .from('communication_messages')
          .update({
            provider_status: eventType.replace('email.', '') as any,
            status,
          })
          .eq('id', message.id);

        await supabaseAdmin.from('communication_events').insert({
          message_id: message.id,
          event_id: message.event_id,
          guest_id: message.guest_id,
          event_type: eventType,
          metadata: payload,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Email status webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
