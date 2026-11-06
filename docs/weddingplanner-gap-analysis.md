# Gap analysis: UpdateSpec vs WeddingPlanner vs AisleFlow2

Date: 2026-10-24. Read-only review. No code in either project was changed for this analysis.

## 1. What the spec asks for

**The base is WeddingPlanner (WP).** Bring the chosen parts of AisleFlow2 (AF2) into it, then run a full development pass and "only stop when it is production ready".

Items taken from the spec:

| # | Spec requirement |
|---|---|
| S1 | AF2's **invitation template designs, gallery layout and opening animations** replace WP's. Applies only to the invite and opening templates. |
| S2 | Keep WP's backend layout: **top tab bar with the dashboard items below**. |
| S3 | **Pending RSVP reminder** must only message guests whose RSVP is `pending`. |
| S4 | **Setup page**: readiness must be **interactive**, not static. "Mark Ready for Testing" becomes **Publish / Go live**. |
| S5 | **Guest registry**: AF2's functionality, formatting and highlighting, shown under the top tabs (no side menu). |
| S6 | **Comms**: keep WP's comms screen. **Channel drop-down** controls which bodies show: Email shows only the email body, SMS only the SMS body, "Email and SMS" shows both. Purpose: sell a cheaper email-only plan and a premium email + SMS plan. |
| S7 | **Portal builder, guest copy, schedule/VIP, RSVP questions, gift registry**: use AF2's functionality. |
| S8 | **Portal builder preview**: a full-height preview like WP's editor, **click any text in the preview to edit it**. Preview centred, edit boxes to the right. Same for guest copy, RSVP questions and gift registry. |

## 2. State of each project today

| | WeddingPlanner (base) | AisleFlow2 |
|---|---|---|
| Stack | Next 14.2, React 18, Tailwind 3 | Next 16.3, React 19, Tailwind 3 |
| Typecheck | Passes (`tsc --noEmit` clean) | Passes. Production build passes. |
| Admin shell | Top tab bar: Dashboard, Setup, Guests, Comms, Builder, Editor, Plan, Registry, RSVP Qs, Photos | Left side menu: Overview, Setup Wizard, Guest Registry, Communications, Portal Builder, Guest Copy, Schedule / VIP, RSVP Questions, Gift Registry, Photo Stream, Task Workspace |
| Admin code layout | ~12 focused components, 250 to 1,200 lines each | One 5,200-line component (`AdminDashboardView.tsx`) |
| Data layer | Server actions with admin-token check (`requireAdminAccess`) | Server actions plus direct browser Supabase calls as a fallback |
| Auth | Signed admin tokens. Dev bypass is on whenever `NODE_ENV !== 'production'`. | Admin links by token |
| Billing | Stripe webhook plus a checkout simulator on the home page. No plan or tier concept in code. | None |
| Tests | None | None |
| Migrations | 10 loose `supabase_*.sql` files | One `supabase_migration_unified.sql` |

Data-model differences matter for porting:

- **Different table and column names.** WP uses `schedules`, `event_date`, `party_id`, `custom_sections`. AF2 uses `schedule_items`, `wedding_date`, `theme_id` and different party fields. AF2 components cannot be dropped in as-is; they need an adapter or a rename.
- **Different dependencies.** AF2 uses `framer-motion`, `canvas-confetti`, `papaparse` and `date-fns`. WP has none of them.

## 3. Gap table

Effort: S under half a day, M 1 to 2 days, L 3 to 5 days, XL a week or more. These are my estimates and not measured.

| Spec | WeddingPlanner today | AisleFlow2 today | Gap | Effort |
|---|---|---|---|---|
| **S1** Template designs, gallery, openings | 5 templates (editorial, minimal, destination, garden, royal-floral), a palette picker, 6 opening styles in `InvitationCover`, and a gallery at `/templates` | 8 themes in `theme-presets.ts`, each with its own motif, fonts, flourish and opening (wax seal, envelope, curtain, venue reveal, paper cut, minimal fade). Gallery with full-screen preview. | Port the 8 themes and the 8 opening animations (`WaxSeal.tsx`, `MotifDecorations.tsx`). Replace WP's template registry (`guest-portal-templates.ts`, `guest-portal-designs.ts`, `template-design-records.ts`) and the `/templates` pages. WP's saved designs need a one-time migration to the new theme ids. Needs `framer-motion` and `canvas-confetti` added to WP. | L |
| **S2** Top tab bar | Already there (`AdminTabs.tsx`) | Side menu | Nothing to build. Keep WP's shell. | None |
| **S3** Reminder only to pending | `ReminderPanel` already calls `broadcastSmsAction(..., 'pending')`. But it is SMS-only and **`Remind N` counts all pending guests, including those with no phone**. | Not applicable | Verify the audience filter inside `sendCommunicationAction` really filters on `rsvp_status = 'pending'`. Make the reminder channel-aware (email if the plan has no SMS). Show "N pending, M reachable". | S |
| **S4** Interactive readiness, Publish | `SetupWizard` saves settings. The readiness panel is derived once on the server and the button reads "Mark Ready for Testing". | Setup wizard exists but is also largely static | Make each readiness row a live link ("Add contacts" opens Guests, "Add questions" opens RSVP Qs). Recompute on save without a reload. Rename the button to **Publish** or **Go live**, add an unpublish option, and decide what an unpublished portal shows to guests (see question 3). Today `setup_completed` is only a flag and nothing reads it. | M |
| **S5** Guest registry from AF2 | `GuestRegistryManager` (814 lines): party grouping, VIP, CSV import, token rotation. No QR per guest in the table, no visible dietary column. | Table with party chips, VIP badges, status pills, dietary tags, QR, copy-link, rotate-link, delete, bulk party grouping, CSV import and export | Restyle WP's table to AF2's layout and highlighting. Add the QR, copy-link and dietary columns. Add CSV export (WP has `CsvExporter` but check it matches). Most logic already exists in WP, so this is mainly a UI pass. | M |
| **S6** Channel-driven comms | `CommunicationCenter` shows **both** Email body and SMS body regardless of channel. Channel options: email, SMS, both. | AF2's comms is simpler | Show only the fields for the chosen channel (small). The commercial part is bigger: **plan gating**. There is no plan field on `events`, no Stripe price to plan mapping, and SMS sends are not blocked for email-only events. Needs: `events.plan` (or entitlements), webhook sets it, server actions enforce it (not just the UI), upgrade prompt in the UI. | M for the UI, L with real plan enforcement and Stripe prices |
| **S7a** Portal builder | Builder is palette- and layout-focused | Presets, Colors, Typography, Opening, Imagery, Chapters (section order) tabs, driven by the 8 themes | Port AF2's builder controls, but wired to WP's saved-design format. Depends on S1. | L |
| **S7b** Guest copy | `GuestCopyEditor` (817 lines) edits welcome, story, travel, registry, FAQ, local tips and wedding party | Welcome, story, dress code, FAQ, local recommendations with curated photo presets, wedding party | WP already covers most of it. Missing from WP: curated image presets, dress code note. Mostly merge. | M |
| **S7c** Schedule / VIP | **No admin UI for the `schedules` table.** Guests see a timeline, but couples cannot add or edit events, times, dress codes or VIP-only rules. | Full add/edit/delete with RSVP-required and VIP-only flags | **The biggest functional gap.** Build a Schedule / VIP tab (new tab in the top bar) from AF2's version, mapped to WP's `schedules` table. | M |
| **S7d** RSVP questions | `CustomQuestionsManager` (262 lines) | Same idea, with single choice, text and required | Compare question types. Likely a small merge. | S |
| **S7e** Gift registry | `GiftRegistryManager` (344 lines) with cash-fund widget | Direct payout handles (Venmo, Zelle, CashApp, PayPal), cash funds with progress, live contributions ledger | Add AF2's payout-handles block and the contributions ledger to WP. | M |
| **S8** Full preview, click to edit, centred with edit panel to the right | `GuestCopyEditor` has click-a-section-to-edit, but the preview is a simplified stand-in (cards labelled "Schedule", "Registry"), **not the real portal**, and it covers only the copy editor | Builder uses a phone frame with the real portal, but no click-to-edit | Render the real guest portal in the editor and make each text block clickable. This needs an "edit mode" in the portal component: every editable string carries a field id, click selects it, the right panel shows that field. Apply the same shell to Builder, Guest copy, RSVP questions and Gift registry. Prerequisite: the portal must be one component used in both places (WP's guest page is a 1,117-line server page, so it needs extracting). | XL |

## 4. Gaps the spec does not mention but production-ready needs

| Area | Finding | Why it matters | Effort |
|---|---|---|---|
| Admin auth | `isAdminAuthBypassed()` returns true whenever `NODE_ENV !== 'production'`, and `ADMIN_AUTH_BYPASS=true` disables it in production. Admin access is a signed link only: no sign-in, no expiry, no revoke. | A forwarded or leaked admin link gives full control. Fine for a prototype, risky for paying customers. | M |
| Billing | Stripe handler works with a simulator. No plan model, no subscription lifecycle (cancel, past due), no customer portal. | Needed to sell the two tiers in S6. | L |
| Tests | None, in both projects. No unit tests for the RSVP, reminder-audience or token code. | A "stop only when production ready" bar needs at least a smoke suite for RSVP, comms audience and publish. | L |
| Migrations | 10 unordered SQL files in WP. No single source of truth for the schema. | A fresh production database cannot be built reliably. | S to M |
| Repo hygiene | `.next-stale-*` folders, scratch files, screenshots and reference images in the project root, boilerplate README, two uncommitted modified files. | Clean-up before release. | S |
| Delivery tracking | Open and click tracking, Twilio status and inbound SMS routes exist. Check that the webhook signatures are verified. | Spoofable status webhooks can corrupt campaign data. | S |
| Accessibility and mobile | AF2 got a pass this session (16px inputs, 44px targets, reduced motion). WP's own `PRODUCT.md` sets WCAG AA as the target, but I have not audited WP. | Guests use phones in poor light. | M |
| Error and empty states, loading | Not reviewed in WP. | Part of "production ready". | M |
| Observability and deploy | No error reporting, no env validation. `vercel.json` is minimal. | Needed to run it in production. | S to M |

## 5. Recommended order

1. **Foundation (S):** clean the repo, commit WP's two pending changes, consolidate the migrations, add the missing dependencies.
2. **Quick wins (S/M):** S3 reminder audience and reachable count, S6 channel-driven fields, S4 interactive readiness and Publish.
3. **Missing capability (M):** Schedule / VIP tab, then gift registry payout handles and ledger, guest registry restyle.
4. **Template swap (L):** port the 8 themes, the openings, the gallery and the preview overlay. Migrate saved designs.
5. **Portal editor (XL):** extract the portal into one shared component, add edit mode and click-to-edit, then rebuild Builder, Guest copy, RSVP questions and Gift registry on the new shell.
6. **Commercial and hardening (L):** plan model and enforcement, real admin auth, tests, accessibility audit, monitoring.

Rough total: 4 to 6 weeks of focused work, with step 5 the main risk.

## 6. Open questions

1. **Direction of the port.** I read the spec as "WP is the base, bring AF2's templates and chosen features into it". Is that right? AF2's own admin (5,200-line single component) would be retired.
2. **Which data model wins** for table and column names, WP's (`schedules`, `event_date`) or AF2's (`schedule_items`, `wedding_date`)? I would keep WP's, since it is the base and already has the more careful guest-token security.
3. **Publish behaviour.** When a portal is unpublished, should guest links show a "coming soon" page, or keep working for testing as they do now?
4. **Plans.** Is the tiering just email-only vs email + SMS, or are there other limits (guest count, photo storage, number of designs)? And is there a Stripe account with prices yet?
5. **"Click and edit copy on the full preview".** Should this also cover images (swap a photo by clicking it), or text only?
6. **Template migration.** Do any real WP events have saved designs that must be preserved, or can the new templates apply to new events only?

---

## 7. Addendum: AisleFlow2 as the base instead

Proposed after the first analysis: keep AisleFlow2 and import the best of WeddingPlanner into it. I checked the code and recommend this direction.

### Why it fits better
- **Most of the spec already exists in AisleFlow2.** The 8 templates and openings, the gallery, the full-screen preview, the portal builder (presets, colours, typography, opening, imagery, chapters), guest registry with QR and dietary tags, Schedule / VIP, RSVP questions, gift registry with payout handles, a comms tab with campaign ledger and scheduling, and a one-click pending reminder.
- **The shared backend is already close.** The communications, tracking, QR, Twilio, email and inbound-SMS routes exist in both projects. Most shared libs differ by 4 to 70 lines, so importing is a merge, not a port.
- **The hardest item gets easier.** Click-to-edit on the real portal needs the portal to be one reusable component. In AisleFlow2 it already is (`GuestPortalView`, used by the gallery, preview and guest page). In WeddingPlanner it is a 1,117-line server page.
- **No template migration.** The designs you prefer stay where they are.
- **Newer stack:** Next 16 and React 19.

### What to import from WeddingPlanner

| Import | Where it comes from | Effort |
|---|---|---|
| Top tab bar with dashboard items below (spec S2) | `AdminTabs.tsx` | S |
| Publish checklist, interactive readiness, Publish / Go live (S4) | `PublishChecklist.tsx`, `SetupWizard.tsx`, `updateEventSetupAction` | M |
| Pending reminder panel, made channel-aware and showing "N pending, M reachable" (S3) | `ReminderPanel.tsx` | S |
| Comms layout: lifecycle stat tiles, template library, token preview, QR links, campaign table (S6) | `CommunicationCenter.tsx`, `communication-templates.ts` | M |
| Channel drop-down that shows only the relevant body, plus plan gating for email-only vs email + SMS (S6) | New in both projects | M for the UI, L with Stripe and enforcement |
| Click-to-edit interaction on a full-height, centred preview with edit panel on the right (S8) | Pattern from `GuestCopyEditor.tsx`, rebuilt on the real `GuestPortalView` | L |
| **Real admin authentication** | `lib/admin-auth.ts` (signed token, timing-safe compare, secret required) | S |
| Guest-token and photo-upload hardening | `supabase_guest_token_security.sql`, `supabase_photo_upload_security.sql`, `lib/guest-access-token.ts` | S |
| Stripe checkout and webhook | `app/api/stripe/webhook/route.ts`, `lib/stripe.ts` | M |

### Problems in AisleFlow2 that must be fixed (found while comparing)
1. **Admin access is effectively open.** `verifyAdminToken` returns true for any token of 8 or more characters, and `requireAdminAccess` only logs a warning and never blocks. The signing secret also falls back to a hardcoded string. Anyone who guesses or is given a short token string can edit an event. WeddingPlanner's version is much stricter. This is the first thing to replace.
2. **Demo and fallback behaviour hides failures.** Several actions fall back to in-memory demo data or direct browser Supabase calls when the server action errors. That is fine for a demo and unsafe in production, because a failed save looks successful. These fallbacks need to be removed or limited to the demo event.
3. **`AdminDashboardView.tsx` is a 5,200-line single component.** Split it by tab as each tab is reworked.
4. **No tests, no plan model**, and the guest page accepts several hardcoded demo tokens in production.

### Revised order
1. Security first: replace admin auth, remove production fallbacks, confirm guest and photo security SQL is applied.
2. Admin shell: top tab bar, split the monolith as you go.
3. Quick wins: pending reminder, channel-driven comms fields, interactive readiness and Publish.
4. Guest registry restyle (already close), comms layout.
5. Click-to-edit on the real portal across Builder, Guest copy, RSVP questions and Gift registry.
6. Plan model, Stripe, tests, accessibility audit, monitoring.

Rough total with this direction: 3 to 4 weeks, against 4 to 6 for the first plan. These are estimates, not measured.

### What you give up
WeddingPlanner's 5 templates (you prefer AisleFlow's), its simplified copy-editor preview, and its `BespokePageBuilder` per-section style controls (container, padding, text frame). Say if you want those controls brought across.
