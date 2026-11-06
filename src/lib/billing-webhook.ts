import { isUpgrade, PlanId } from './plans';

/** Database access the webhook needs; passed in so the logic can be tested without Supabase. */
export interface BillingStore {
  alreadyProcessed(stripeEventId: string): Promise<boolean>;
  currentPlan(eventId: string): Promise<PlanId | null>;
  activatePlan(eventId: string, plan: PlanId, stripeCustomerId: string | null): Promise<void>;
  recordEvent(row: {
    stripe_event_id: string;
    event_id: string;
    type: string;
    plan: PlanId;
    checkout_session_id: string | null;
    amount_total: number | null;
    currency: string | null;
  }): Promise<void>;
}

interface StripeEventLike {
  id: string;
  type: string;
  data: { object: any };
}

const PAID_PLANS: PlanId[] = ['essentials', 'premium'];

/**
 * Turns on the plan a couple paid for. Activation is idempotent, so the event is recorded only
 * after it succeeds: a failed activation is retried by Stripe rather than being marked done.
 */
export async function applyStripeEvent(
  event: StripeEventLike,
  store: BillingStore
): Promise<'ignored' | 'duplicate' | 'activated'> {
  if (event.type !== 'checkout.session.completed') return 'ignored';

  const session = event.data.object || {};
  const eventId: string | undefined = session.metadata?.event_id;
  const plan = session.metadata?.plan as PlanId | undefined;
  if (session.payment_status !== 'paid' || !eventId || !plan || !PAID_PLANS.includes(plan)) return 'ignored';

  if (await store.alreadyProcessed(event.id)) return 'duplicate';

  const current = await store.currentPlan(eventId);
  if (!current || !isUpgrade(current, plan)) return 'ignored';

  await store.activatePlan(eventId, plan, typeof session.customer === 'string' ? session.customer : null);
  await store.recordEvent({
    stripe_event_id: event.id,
    event_id: eventId,
    type: event.type,
    plan,
    checkout_session_id: session.id || null,
    amount_total: session.amount_total ?? null,
    currency: session.currency || null,
  });
  return 'activated';
}
