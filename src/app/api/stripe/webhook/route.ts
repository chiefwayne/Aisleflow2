import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { applyStripeEvent, BillingStore } from '@/lib/billing-webhook';
import { planOf } from '@/lib/plans';

const store: BillingStore = {
  async alreadyProcessed(stripeEventId) {
    const { data } = await supabaseAdmin
      .from('billing_events')
      .select('stripe_event_id')
      .eq('stripe_event_id', stripeEventId)
      .maybeSingle();
    return !!data;
  },
  async currentPlan(eventId) {
    const { data } = await supabaseAdmin.from('events').select('plan').eq('id', eventId).maybeSingle();
    return data ? planOf(data) : null;
  },
  async activatePlan(eventId, plan, stripeCustomerId) {
    const { error } = await supabaseAdmin
      .from('events')
      .update({
        plan,
        plan_activated_at: new Date().toISOString(),
        ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
      })
      .eq('id', eventId);
    if (error) throw error;
  },
  async recordEvent(row) {
    const { error } = await supabaseAdmin.from('billing_events').insert(row);
    // 23505: another delivery of the same event recorded it first, which is fine.
    if (error && error.code !== '23505') throw error;
  },
};

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe is not configured.' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) return Response.json({ error: 'Missing signature.' }, { status: 400 });

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return Response.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    await applyStripeEvent(event, store);
    return Response.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
