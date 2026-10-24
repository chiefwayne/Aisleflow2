import { NextResponse } from 'next/server';
// Server-only: row-level security blocks the public key, so read with the service role.
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fromPhone = (formData.get('From') as string) || '';
    const bodyText = (formData.get('Body') as string) || '';

    const cleanFromPhone = fromPhone.replace(/\D/g, '');
    const cleanBody = bodyText.trim().toUpperCase();

    // Find guest by phone
    const { data: guests } = await supabase
      .from('guests')
      .select('*, events(*)')
      .limit(100);

    const matchedGuest = guests?.find((g) => {
      if (!g.phone) return false;
      const cleanGPhone = g.phone.replace(/\D/g, '');
      return cleanGPhone.includes(cleanFromPhone) || cleanFromPhone.includes(cleanGPhone);
    });

    let replyMessage = '';

    if (matchedGuest) {
      const event = matchedGuest.events;
      const eventName = event ? event.couple_names : 'the';

      if (cleanBody.includes('YES') || cleanBody.includes('ATTENDING') || cleanBody.includes('CONFIRM')) {
        await supabase
          .from('guests')
          .update({ rsvp_status: 'attending', updated_at: new Date().toISOString() })
          .eq('id', matchedGuest.id);

        replyMessage = `Thank you ${matchedGuest.first_name}! You are confirmed as ATTENDING for ${eventName}'s celebration. View your itinerary here: https://aisleflow.com/g/${matchedGuest.access_token}`;
      } else if (cleanBody.includes('NO') || cleanBody.includes('DECLINE') || cleanBody.includes('CANNOT')) {
        await supabase
          .from('guests')
          .update({ rsvp_status: 'declined', updated_at: new Date().toISOString() })
          .eq('id', matchedGuest.id);

        replyMessage = `Thank you for letting us know, ${matchedGuest.first_name}. We will miss you at ${eventName}'s celebration!`;
      } else {
        replyMessage = `Hi ${matchedGuest.first_name}! Reply 'YES' to confirm attending or 'NO' to decline. Or view your personalized portal: https://aisleflow.com/g/${matchedGuest.access_token}`;
      }
    } else {
      replyMessage = `Thank you for reaching out to AisleFlow. Please open your private wedding invitation link to manage your RSVP.`;
    }

    // Return TwiML XML response for Twilio
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${replyMessage}</Message>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (err: any) {
    console.error('Twilio SMS webhook error:', err);
    return new NextResponse('<Response><Message>Received. Thank you!</Message></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
