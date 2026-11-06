import { describe, expect, it } from 'vitest';
import { applyStripeEvent, BillingStore } from './billing-webhook';

function memoryStore(currentPlan: 'free' | 'essentials' | 'premium' = 'free') {
  const seen = new Set<string>();
  const activations: Array<{ eventId: string; plan: string }> = [];
  const store: BillingStore = {
    async alreadyProcessed(stripeEventId) {
      return seen.has(stripeEventId);
    },
    async recordEvent(row) {
      seen.add(row.stripe_event_id);
    },
    async currentPlan() {
      return currentPlan;
    },
    async activatePlan(eventId, plan) {
      activations.push({ eventId, plan });
    },
  };
  return { store, activations };
}

const paidSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'evt_1',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_1',
      payment_status: 'paid',
      amount_total: 12900,
      currency: 'usd',
      customer: 'cus_1',
      metadata: { event_id: 'e1', plan: 'premium' },
      ...overrides,
    },
  },
});

describe('applyStripeEvent', () => {
  it('activates the paid plan once', async () => {
    const { store, activations } = memoryStore();
    expect(await applyStripeEvent(paidSession(), store)).toBe('activated');
    expect(activations).toEqual([{ eventId: 'e1', plan: 'premium' }]);
  });

  it('ignores a repeat delivery of the same event', async () => {
    const { store, activations } = memoryStore();
    await applyStripeEvent(paidSession(), store);
    expect(await applyStripeEvent(paidSession(), store)).toBe('duplicate');
    expect(activations).toHaveLength(1);
  });

  it('ignores unpaid sessions, missing metadata, unknown plans and other event types', async () => {
    const { store, activations } = memoryStore();
    expect(await applyStripeEvent({ ...paidSession({ payment_status: 'unpaid' }), id: 'evt_2' }, store)).toBe('ignored');
    expect(await applyStripeEvent({ ...paidSession({ metadata: {} }), id: 'evt_3' }, store)).toBe('ignored');
    expect(await applyStripeEvent({ ...paidSession({ metadata: { event_id: 'e1', plan: 'gold' } }), id: 'evt_4' }, store)).toBe('ignored');
    expect(await applyStripeEvent({ id: 'evt_5', type: 'payment_intent.created', data: { object: {} } }, store)).toBe('ignored');
    expect(activations).toHaveLength(0);
  });

  it('never downgrades an event', async () => {
    const { store, activations } = memoryStore('premium');
    const essentials = paidSession({ metadata: { event_id: 'e1', plan: 'essentials' } });
    expect(await applyStripeEvent(essentials, store)).toBe('ignored');
    expect(activations).toHaveLength(0);
  });
});
