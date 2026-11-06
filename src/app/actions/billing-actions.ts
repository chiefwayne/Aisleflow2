'use server';

import { requireAdminAccess } from '@/lib/admin-auth';
import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { isUpgrade, planOf, PlanId } from '@/lib/plans';

/** Stripe price for moving from one plan to another. Premium from Essentials uses the upgrade price. */
function priceFor(from: PlanId, to: PlanId): string | undefined {
  if (to === 'essentials') return process.env.STRIPE_PRICE_ESSENTIALS;
  if (from === 'essentials') return process.env.STRIPE_PRICE_PREMIUM_UPGRADE;
  return process.env.STRIPE_PRICE_PREMIUM;
}

export async function startUpgradeCheckoutAction(input: {
  eventId: string;
  adminToken: string;
  plan: PlanId;
}): Promise<{ url: string } | { error: string }> {
  try {
    await requireAdminAccess(input.eventId, input.adminToken);

    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id, plan, admin_email, couple_names')
      .eq('id', input.eventId)
      .single();
    if (!event) return { error: 'Event not found.' };

    const current = planOf(event);
    if (!isUpgrade(current, input.plan)) return { error: `This event is already on ${current}.` };

    const price = priceFor(current, input.plan);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!price || !siteUrl) return { error: 'Payments are not set up yet. Please try again later.' };

    // The admin token never goes to Stripe: Checkout returns to a static page.
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: event.id,
      metadata: { event_id: event.id, plan: input.plan },
      customer_email: event.admin_email || undefined,
      success_url: `${siteUrl}/upgrade/complete`,
      cancel_url: `${siteUrl}/upgrade/complete?cancelled=1`,
    });
    if (!session.url) return { error: 'Could not start checkout.' };
    return { url: session.url };
  } catch (err: any) {
    console.error('startUpgradeCheckoutAction error:', err);
    return { error: err.message === 'Stripe is not configured.' ? 'Payments are not set up yet. Please try again later.' : 'Could not start checkout.' };
  }
}

export async function getEventPlanAction(eventId: string, adminToken: string): Promise<{ plan: PlanId } | { error: string }> {
  try {
    await requireAdminAccess(eventId, adminToken);
    const { data } = await supabaseAdmin.from('events').select('plan').eq('id', eventId).single();
    return { plan: planOf(data || {}) };
  } catch {
    return { error: 'Could not load the plan.' };
  }
}
