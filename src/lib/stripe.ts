import 'server-only';

import Stripe from 'stripe';

let client: Stripe | null = null;

/** The Stripe client. Throws when STRIPE_SECRET_KEY is unset, so payments never fall back to a fake. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured.');
  client ??= new Stripe(key);
  return client;
}
