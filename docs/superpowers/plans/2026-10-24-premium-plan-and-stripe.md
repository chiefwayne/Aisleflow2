# Premium Plan (SMS + Design Studio) and Stripe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every event has a plan. **Essentials** is email only with the built-in themes and Builder. **Premium** adds SMS and a per-event Design Studio. Couples upgrade with Stripe Checkout, and a signed webhook turns Premium on.

**Architecture:** A `plan` column on `events` is the single source of truth. A pure module `src/lib/plans.ts` maps plans to features. Every server action that sends SMS or saves a Studio design checks it, so the UI is never the only gate. Upgrading is a one-off Stripe Checkout payment for an existing event (`metadata.event_id`). The webhook verifies the signature, records `stripe_event_id` in `billing_events` so repeat deliveries are ignored, and sets `events.plan = 'premium'`. The couple-mode Studio reuses `TemplateDesignStudio` with a `mode="event"` prop and saves into `events.theme_config`, which the guest portal already renders (commit fc1e591).

**Tech Stack:** Next.js 16.3.3 (App Router, server actions, route handlers), React 19, Supabase (service role on the server), `stripe` (Node SDK, new dependency), `vitest` (new dev dependency, the project's first tests).

**Spec:** `/Users/wheather/Projects/WeddingPlanner/UPdateSpec.docx` items S6 (email-only vs email + SMS plans, enforced on the server) and the Stripe item; `docs/weddingplanner-gap-analysis.md` §7; `docs/weddingplanner-db-schema-reference.md` (Plan tiers, Stripe checkout rows). Decision from chat on 2026-10-24: bundle SMS **and** the Design Studio into one higher tier.

## Decisions and assumptions (confirm before Task 3)

1. **Tier names:** `essentials` and `premium` in code. Change the display names freely; changing the ids later needs a data migration.
2. **Essentials is free for now.** Only Premium has a Stripe price. If Essentials also becomes paid, add a second price and gate Publish on it; nothing below blocks that.
3. **One-off payment, not a subscription** (Checkout `mode: 'payment'`), because a wedding is a single event.
4. **Existing events default to `essentials`.** Any event already sending SMS loses SMS until upgraded. To grandfather them instead, set `plan = 'premium'` for chosen events in the migration.
5. **No automatic downgrade on refund.** Refunds are handled by hand in the Stripe dashboard plus a one-line SQL update. Add a `charge.refunded` handler only if this becomes routine.
6. **The admin token never goes to Stripe.** `success_url` is a static `/upgrade/complete` page. Checkout opens in a new tab, and the dashboard re-reads its plan when the window regains focus.
7. **The demo event is always Premium** (in-memory, `DEMO_EVENT_ID`), so demos show every feature.

## Global Constraints

- Never read, print or commit `.env*` files. New variables are listed in Task 3; the user adds them.
- Next.js 16: read `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md` ("Consuming request payloads", "Webhooks and callback URLs") before writing the route handler. Read the raw body once with `await request.text()`.
- Feature checks run on the server in every action that sends SMS or saves a Studio design. Hiding UI is extra, never the check.
- The webhook rejects every request it can't verify. If `STRIPE_WEBHOOK_SECRET` or `STRIPE_SECRET_KEY` is missing it returns 500 and processes nothing. Never fall back to parsing unsigned JSON (WeddingPlanner's webhook does this; do not copy it).
- Prices come only from `STRIPE_PRICE_PREMIUM`. Never accept a price or amount from the browser.
- Plan values are exactly `'essentials' | 'premium'`. Feature keys are exactly `'sms' | 'design_studio'`.
- Modules under test must not import `server-only` or `@/lib/supabase` (vitest can't load them). Keep logic pure and pass database calls in.
- Leave `next-env.d.ts` uncommitted.

## Review Focus

1. **Stripe delivers the same event twice** → the second delivery returns 200 and changes nothing. Test: `applyStripeEvent` with a repeat `stripe_event_id` (Task 4).
2. **Webhook called without a valid signature, or with secrets unset** → 400 / 500 and no database write. Test: the route returns 400 for a bad signature and 500 with no secret (Task 4).
3. **Essentials event sends with channel `both` or `sms`, including a scheduled campaign created earlier** → refused with "SMS is part of Premium." Nothing is sent and the campaign isn't marked completed. Test: `assertChannelAllowed` cases, and the gate placed before campaign creation and in `dispatchExistingCampaignAction` (Task 2).
4. **Checkout started for an event that is already Premium, or with a wrong admin token** → no session is created and a clear error is returned. Test: `startUpgradeCheckoutAction` guards (Task 3).
5. **Couple saves a Studio design without Premium, or by calling the action directly** → refused on the server, and `theme_config` is unchanged. Test: `saveEventStudioDesignAction` refuses Essentials (Task 5).

---

### Task 1: Plan model, feature map and test harness

**Files:**
- Create: `vitest.config.ts`, `src/lib/plans.ts`, `src/lib/plans.test.ts`, `supabase_migration_plans_billing.sql`
- Modify: `package.json` (add `"test": "vitest run"`), `src/lib/types.ts` (`EventRecord`), `src/lib/demo-seeder.ts` (`MOCK_DEMO_EVENT.plan = 'premium'`)

**Interfaces:**
- Produces:
  - `export type PlanId = 'essentials' | 'premium'`
  - `export type Feature = 'sms' | 'design_studio'`
  - `export const PLAN_FEATURES: Record<PlanId, Record<Feature, boolean>>`
  - `export function planOf(event: { plan?: string | null }): PlanId` (unknown or missing → `'essentials'`)
  - `export function hasFeature(event: { plan?: string | null }, feature: Feature): boolean`
  - `export function featureError(feature: Feature): string` → `'SMS is part of Premium. Upgrade to send text messages.'` / `'The Design Studio is part of Premium. Upgrade to customise your invitation.'`
  - `EventRecord.plan?: PlanId`, `EventRecord.plan_activated_at?: string | null`

- [ ] **Step 1: Install and configure the test runner.** `npm install -D vitest`. Create `vitest.config.ts` with `resolve.alias` mapping `@` to `./src` and `test.include: ['src/**/*.test.ts']`. Add `"test": "vitest run"` to `package.json`.
- [ ] **Step 2: Write the failing tests** in `src/lib/plans.test.ts`:

```ts
expect(planOf({})).toBe('essentials');
expect(planOf({ plan: 'bogus' })).toBe('essentials');
expect(hasFeature({ plan: 'essentials' }, 'sms')).toBe(false);
expect(hasFeature({ plan: 'essentials' }, 'design_studio')).toBe(false);
expect(hasFeature({ plan: 'premium' }, 'sms')).toBe(true);
expect(hasFeature({ plan: 'premium' }, 'design_studio')).toBe(true);
expect(featureError('sms')).toMatch(/Premium/);
```

- [ ] **Step 3: Run** `npm test`. Expected: FAIL, cannot find `./plans`.
- [ ] **Step 4: Implement `src/lib/plans.ts`** with the signatures above. No imports except types.
- [ ] **Step 5: Run** `npm test`. Expected: PASS.
- [ ] **Step 6: Write `supabase_migration_plans_billing.sql`:**
  - `alter table events add column plan text not null default 'essentials' check (plan in ('essentials','premium'))`
  - `add column plan_activated_at timestamptz`
  - `create table billing_events (stripe_event_id text primary key, event_id uuid references events(id) on delete set null, type text not null, checkout_session_id text, amount_total integer, currency text, created_at timestamptz default now())`
  - `alter table billing_events enable row level security` with no policies (service role only, like the other 16 tables).
- [ ] **Step 7: Apply it** to aisleflow-app (`xwiqlfndwstngonkekax`) with the Supabase connector's `apply_migration` (name `plans_and_billing`). Verify with `select plan, count(*) from events group by plan` → every row is `essentials`.
- [ ] **Step 8: Add the fields** to `EventRecord`, and set `plan: 'premium'` on `MOCK_DEMO_EVENT` in `demo-seeder.ts`. Run `npx tsc --noEmit -p .`. Expected: no output.
- [ ] **Step 9: Commit:** `git add vitest.config.ts package.json package-lock.json src/lib/plans.ts src/lib/plans.test.ts src/lib/types.ts src/lib/demo-seeder.ts supabase_migration_plans_billing.sql && git commit -m "feat: add plan model with Essentials and Premium features"`

### Task 2: Enforce SMS on the server and in the Comms UI

**Files:**
- Modify: `src/lib/plans.ts`, `src/lib/plans.test.ts`, `src/app/actions/wedding-actions.ts` (`sendCommunicationAction`, `dispatchExistingCampaignAction`, `broadcastSmsAction`), `src/components/admin/AdminDashboardView.tsx` (Comms tab channel picker around the `newCampaignForm.channel` buttons, and the "1-Click SMS Reminder" button)

**Interfaces:**
- Consumes: `hasFeature`, `featureError` from Task 1.
- Produces: `export function assertChannelAllowed(event: { plan?: string | null }, channel: 'email' | 'sms' | 'both'): string | null`, which returns the error text or `null`.

- [ ] **Step 1: Write the failing tests:**

```ts
expect(assertChannelAllowed({ plan: 'essentials' }, 'email')).toBeNull();
expect(assertChannelAllowed({ plan: 'essentials' }, 'sms')).toBe(featureError('sms'));
expect(assertChannelAllowed({ plan: 'essentials' }, 'both')).toBe(featureError('sms'));
expect(assertChannelAllowed({ plan: 'premium' }, 'both')).toBeNull();
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL, `assertChannelAllowed` is not exported.
- [ ] **Step 3: Implement `assertChannelAllowed`** in `plans.ts`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Gate the actions.** In `sendCommunicationAction`, right after the event is loaded and **before** the campaign insert, return `{ error }` when `assertChannelAllowed(event, channel)` gives an error. This covers drafts and scheduled campaigns too, so none can later fire as SMS. In `dispatchExistingCampaignAction`, check `campaign.events` and `campaign.channel` after loading the campaign and before setting status `sending`. `broadcastSmsAction` goes through `sendCommunicationAction`, so it needs no extra check.
- [ ] **Step 6: Update the UI.** For Essentials events (`hasFeature(event, 'sms')` false), disable the "SMS" and "Both" channel buttons, show a "Premium" badge on them, and add an "Upgrade" link that switches to the Setup tab (Task 3 puts the plan card there). Disable the "1-Click SMS Reminder" button with the tooltip `featureError('sms')`.
- [ ] **Step 7: Verify in the browser** on the "Publish Test" event (Essentials): a broadcast with channel Email sends (dry run without email keys); calling the action with channel `sms` from the console returns the error. Run `npx tsc --noEmit -p .`. Expected: no output.
- [ ] **Step 8: Commit:** `git commit -m "feat: limit SMS to the Premium plan"`

### Task 3: Upgrade checkout

**Files:**
- Create: `src/lib/stripe.ts`, `src/app/actions/billing-actions.ts`, `src/app/upgrade/complete/page.tsx`, `src/components/admin/PlanCard.tsx`
- Modify: `src/components/admin/AdminDashboardView.tsx` (render `PlanCard` at the top of the Setup tab under `PublishReadinessPanel`; re-fetch the plan on `window` focus)

**Interfaces:**
- Consumes: `planOf` from Task 1; `requireAdminAccess` from `@/lib/admin-auth`.
- Produces:
  - `src/lib/stripe.ts`: `import 'server-only'`; `export function getStripe(): Stripe` (throws `'Stripe is not configured.'` when `STRIPE_SECRET_KEY` is unset; no module-level client, no hard-coded `apiVersion`, the SDK default is used)
  - `startUpgradeCheckoutAction(input: { eventId: string; adminToken: string }): Promise<{ url: string } | { error: string }>`
  - `getEventPlanAction(eventId: string, adminToken: string): Promise<{ plan: PlanId } | { error: string }>`
  - `<PlanCard event={EventRecord} onPlanChange={(plan: PlanId) => void} />`

- [ ] **Step 1: Ask the user to add the env vars** (do not open `.env.local` or `.env.example` yourself): `STRIPE_SECRET_KEY` (test mode `sk_test_…`), `STRIPE_WEBHOOK_SECRET` (from `stripe listen`), `STRIPE_PRICE_PREMIUM` (a one-time price id `price_…`), and `NEXT_PUBLIC_SITE_URL` (for example `http://localhost:3010`).
- [ ] **Step 2: Install** `npm install stripe` and write `src/lib/stripe.ts` as specified.
- [ ] **Step 3: Implement `startUpgradeCheckoutAction`.** It runs `requireAdminAccess`, loads the event, and returns `{ error: 'This event is already on Premium.' }` when `planOf(event) === 'premium'`. Then it calls `stripe.checkout.sessions.create` with:
  - `mode: 'payment'`
  - `line_items: [{ price: process.env.STRIPE_PRICE_PREMIUM, quantity: 1 }]`
  - `client_reference_id: event.id`
  - `metadata: { event_id: event.id, plan: 'premium' }`
  - `customer_email: event.admin_email`
  - `success_url: ${NEXT_PUBLIC_SITE_URL}/upgrade/complete`
  - `cancel_url` set to the same URL with `?cancelled=1`

  It returns `{ url: session.url }`, and returns `{ error }` when `STRIPE_PRICE_PREMIUM` is unset.
- [ ] **Step 4: Implement `getEventPlanAction`** (admin-token checked, selects `plan` only).
- [ ] **Step 5: Write `/upgrade/complete/page.tsx`.** A static page: "Payment received. Premium switches on within a minute. Go back to your dashboard tab." With `?cancelled=1`: "Checkout was cancelled. Nothing was charged." No event data, no tokens.
- [ ] **Step 6: Build `PlanCard`.** It shows the current plan and what Premium adds (SMS invitations and reminders, Design Studio). The "Upgrade to Premium" button calls the action and `window.open(url, '_blank')`. The dashboard calls `getEventPlanAction` on window `focus` and updates `event.plan`. Match `PublishReadinessPanel`'s styling and 44px buttons.
- [ ] **Step 7: Verify in the browser** with Stripe test mode: clicking Upgrade opens Checkout with the Premium price, and a second click on a Premium event (set by hand in SQL) shows the "already on Premium" error. Run `npx tsc --noEmit -p .`. Expected: no output.
- [ ] **Step 8: Commit:** `git commit -m "feat: add Premium upgrade checkout"`

### Task 4: Signed, idempotent Stripe webhook

**Files:**
- Create: `src/lib/billing-webhook.ts`, `src/lib/billing-webhook.test.ts`, `src/app/api/stripe/webhook/route.ts`

**Interfaces:**
- Consumes: `PlanId` from Task 1; `getStripe` from Task 3.
- Produces:
  - `export interface BillingStore { recordEvent(row: { stripe_event_id: string; event_id: string | null; type: string; checkout_session_id: string | null; amount_total: number | null; currency: string | null }): Promise<'inserted' | 'duplicate'>; activatePremium(eventId: string, stripeCustomerId: string | null): Promise<void> }`
  - `export async function applyStripeEvent(event: { id: string; type: string; data: { object: any } }, store: BillingStore): Promise<'ignored' | 'duplicate' | 'activated'>`
  - `POST /api/stripe/webhook` → 200 `{ received: true }`, 400 for a bad or missing signature, 500 when secrets are unset

- [ ] **Step 1: Write the failing tests** in `billing-webhook.test.ts`, using an in-memory `BillingStore`:
  - `checkout.session.completed` with `payment_status: 'paid'` and `metadata: { event_id: 'e1', plan: 'premium' }` returns `'activated'`, and `activatePremium` is called once with `'e1'`.
  - The same `event.id` applied again returns `'duplicate'`, and `activatePremium` is still called only once.
  - `payment_status: 'unpaid'` returns `'ignored'` with no activation.
  - A missing `metadata.event_id` returns `'ignored'`.
  - `type: 'payment_intent.created'` returns `'ignored'`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `applyStripeEvent`.** For any type other than `checkout.session.completed`, return `'ignored'`. Then call `recordEvent` first; if it returns `'duplicate'`, return `'duplicate'`. Activate only when `payment_status === 'paid'` and `metadata.plan === 'premium'` and `metadata.event_id` is set.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Write the route.** If either secret is unset, return 500 and write nothing. Otherwise:
  - `const body = await request.text()`
  - `stripe.webhooks.constructEvent(body, signature, secret)`; on failure, return 400.
  - Call `applyStripeEvent` with a Supabase-backed store:
    - `recordEvent` inserts into `billing_events`; Postgres error code `23505` means `'duplicate'`.
    - `activatePremium` updates `events` to set `plan`, `plan_activated_at` and `stripe_customer_id`.
  - Return 200. Never return tokens or event data.
- [ ] **Step 6: Verify end to end** with the Stripe CLI: `stripe listen --forward-to localhost:3010/api/stripe/webhook`, pay with test card 4242 4242 4242 4242, and check `select plan from events where id = '<event>'` returns `premium`. Then `stripe events resend <evt_id>` and check that `billing_events` still has one row. A `curl -X POST` with no signature returns 400.
- [ ] **Step 7: Commit:** `git commit -m "feat: activate Premium from a signed Stripe webhook"`

### Task 5: Couple-mode Design Studio (Premium)

**Files:**
- Create: `src/app/admin/[token]/studio/page.tsx`
- Modify: `src/components/owner/TemplateDesignStudio.tsx`, `src/app/actions/template-design-actions.ts` (export `TEMPLATE_DESIGN_COLUMNS`), `src/app/actions/wedding-actions.ts` (new action), `src/components/admin/AdminDashboardView.tsx` (Builder: "Open Design Studio" button)

**Interfaces:**
- Consumes: `hasFeature`, `featureError` from Task 1; `requireAdminAccess`; `uploadWebsiteImageAction` (existing, admin-token checked) for image uploads in event mode.
- Produces:
  - `saveEventStudioDesignAction(input: { eventId: string; adminToken: string; design: string /* JSON */ }): Promise<{ success: true; event: EventRecord } | { error: string }>`
  - `TemplateDesignStudio` props: `mode?: 'owner' | 'event'` (default `'owner'`), `eventId?: string`, `adminToken?: string`, `initialDesign?: TemplateDesignRow`

- [ ] **Step 1: Write the action.** `saveEventStudioDesignAction` runs `requireAdminAccess`, loads the event, and returns `{ error: featureError('design_studio') }` unless `hasFeature(event, 'design_studio')`. It copies only `TEMPLATE_DESIGN_COLUMNS` minus `status` from the parsed design into a snapshot, and sets `container_layout` to `'card'` when it is missing, so the portal treats it as a Studio design. It then updates `events.theme_config` with the snapshot (replace, not merge), revalidates `/admin/${adminToken}` and `/g/[token]`, and returns the event.
- [ ] **Step 2: Add event mode to `TemplateDesignStudio`.** With `mode === 'event'`:
  - Start from `initialDesign` and skip the database load effect.
  - Hide the catalogue panels ("Owner Created Designs", "Start from System Design", New, Duplicate, Delete) and the media-library delete.
  - Hide the save dialog's Publish Status and URL Slug fields.
  - Save calls `saveEventStudioDesignAction`, and image upload calls `uploadWebsiteImageAction`.
  - Change the header pill to "Design Studio" and point the back link to `/admin/${adminToken}`.
- [ ] **Step 3: Write `/admin/[token]/studio/page.tsx`** (server). Load the event by `admin_token` (same lookup as `/admin/[token]/page.tsx`) and return the existing "invalid link" card when it isn't found. If `!hasFeature(event, 'design_studio')`, render a short upgrade card with a link back to the Setup tab. Otherwise render `<TemplateDesignStudio mode="event" … initialDesign={{ ...BUILTIN_THEMES[event.theme_id] ?? BUILTIN_THEMES['royal-floral'], ...event.theme_config }} />`.
- [ ] **Step 4: Add the Builder entry point.** In the Builder Presets sub-tab, add an "Open Design Studio" button (a link to `/admin/${event.admin_token}/studio`) with a "Premium" badge and a lock icon for Essentials.
- [ ] **Step 5: Verify in the browser.**
  - Essentials event: `/admin/<token>/studio` shows the upgrade card. Calling `saveEventStudioDesignAction` from the console returns the Premium error, and `theme_config` is unchanged in SQL.
  - Premium event: move RSVP first, save, and the guest link shows RSVP first.
  - Run `npm test` and `npx tsc --noEmit -p .`. Expected: PASS and no output.
- [ ] **Step 6: Commit:** `git commit -m "feat: per-event Design Studio for Premium couples"`

---

## Out of scope (separate plans)

- Channel-aware pending reminder ("N pending, M reachable", email when SMS isn't on the plan).
- Moving the Studio preview onto the real `GuestPortalView`.
- Refunds, subscriptions, invoices, and paying at sign-up instead of upgrading later.
- `processDueCommunicationCampaigns` re-sends scheduled campaigns on every run (found 2026-10-24); fix it before scheduled SMS goes live.
