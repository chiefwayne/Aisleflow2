import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
// Server-only: row-level security blocks the public key, so read with the service role.
import { supabaseAdmin as supabase } from '@/lib/supabase';

const twiml = (message: string, status = 200) =>
  new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n    <Message>${escapeXml(message)}</Message>\n</Response>`,
    { status, headers: { 'Content-Type': 'text/xml' } }
  );

function escapeXml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Twilio signs the full URL plus the sorted POST parameters with the account auth token. */
function isValidTwilioSignature(request: Request, params: Record<string, string>) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    // Without credentials nothing can be verified: allow local development only.
    if (process.env.NODE_ENV !== 'production') return true;
    return false;
  }

  const signature = request.headers.get('x-twilio-signature');
  if (!signature) return false;

  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const fullUrl = process.env.TWILIO_WEBHOOK_URL || `${proto}://${host}${url.pathname}${url.search}`;

  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], fullUrl);
  const expected = createHmac('sha1', authToken).update(data).digest('base64');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Digits only, treating a leading US country code as optional. */
function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === 'string') params[key] = value;
    });

    if (!isValidTwilioSignature(request, params)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const fromPhone = (params.From || '').trim();
    const cleanBody = (params.Body || '').trim().toUpperCase();
    const from = normalizePhone(fromPhone);

    if (from.length < 7) {
      return twiml('Thank you for reaching out to AisleFlow. Please open your private wedding invitation link to manage your RSVP.');
    }

    // Narrow by the last four digits, then require an exact normalised match.
    const { data: candidates } = await supabase
      .from('guests')
      .select('id, first_name, access_token, phone, events(couple_names)')
      .ilike('phone', `%${from.slice(-4)}%`)
      .limit(50);

    const matches = (candidates || []).filter((g) => g.phone && normalizePhone(g.phone) === from);

    // An ambiguous number must never change someone else's RSVP.
    if (matches.length !== 1) {
      return twiml('Thank you for reaching out to AisleFlow. Please open your private wedding invitation link to manage your RSVP.');
    }

    const matchedGuest = matches[0] as any;
    const eventName = matchedGuest.events?.couple_names || 'the';
    const portal = `https://aisleflow.com/g/${matchedGuest.access_token}`;

    if (cleanBody.includes('YES') || cleanBody.includes('ATTENDING') || cleanBody.includes('CONFIRM')) {
      await supabase
        .from('guests')
        .update({ rsvp_status: 'attending', updated_at: new Date().toISOString() })
        .eq('id', matchedGuest.id);
      return twiml(`Thank you ${matchedGuest.first_name}! You are confirmed as ATTENDING for ${eventName}'s celebration. View your itinerary here: ${portal}`);
    }

    if (cleanBody.includes('NO') || cleanBody.includes('DECLINE') || cleanBody.includes('CANNOT')) {
      await supabase
        .from('guests')
        .update({ rsvp_status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', matchedGuest.id);
      return twiml(`Thank you for letting us know, ${matchedGuest.first_name}. We will miss you at ${eventName}'s celebration!`);
    }

    return twiml(`Hi ${matchedGuest.first_name}! Reply 'YES' to confirm attending or 'NO' to decline. Or view your personalized portal: ${portal}`);
  } catch (err: any) {
    console.error('Twilio SMS webhook error:', err);
    return twiml('Received. Thank you!');
  }
}
