# WeddingPlanner database schema (reference)

Saved 2026-10-24 from the Supabase project `xivonyeazixmqtuuvkyb` ("chiefwayne's Project") before it was paused. All tables had row-level security enabled with no policies. Row counts were near zero: `guest_schedules_rsvp` 3, `communication_events` 1, everything else 0.

Nothing was dropped or changed. This file exists so the design ideas below stay available while AisleFlow2 gets its own database.

## Ideas worth carrying into AisleFlow2

These map directly to the update spec.

| Concept | Where | Use in AisleFlow2 |
|---|---|---|
| Plan tiers | `events.communication_entitlement` (`email` or `email_sms`), `events.communication_mode` (`email_only` or `email_sms`), table `customer_packages` | Email-only vs email + SMS plans (spec S6). Enforce on the server, not only in the UI. |
| Publish lifecycle | `events.publication_status` (`draft`, `live`, `paused`), `published_at`, `paused_at`, `published_by` | Publish / Go live button (spec S4). Replaces the single `setup_completed` flag. |
| Stripe checkout | `checkout_provision_requests` (pending to completed), `checkout_payment_events` (keyed by `stripe_event_id`, so webhooks are idempotent), `customer_packages` | Billing groundwork. The primary key on `stripe_event_id` prevents double processing. |
| Multi-user access | `wedding_memberships` (roles `owner`, `partner`, `planner`; status `active`/`revoked`), `wedding_invitations` (hashed invite token, expiry) | Real admin accounts instead of a secret link. Both reference `auth.users`. |
| Per-section styling | `template_designs`: `container_*`, `text_frame_*`, `page_background_*`, `section_styles` (jsonb), `section_order`, `hidden_sections` | The per-section style controls from WeddingPlanner's builder, if wanted. |
| Delivery tracking | `communication_messages` (`provider_status`: queued, sent, delivered, opened, clicked, failed, dry_run; tracking URL, QR svg), `communication_events` | Already mirrored in AisleFlow2's comms routes. |

## Tables and columns

Types abbreviated. `id` is uuid primary key unless stated.

**events:** slug (unique), couple_names, event_date, venue_name, venue_address, admin_email, stripe_customer_id, custom_sections (jsonb), theme_bg_color, theme_text_color, theme_accent_color, theme_font_family, invitation_template, setup_completed, setup_completed_at, rsvp_deadline, allow_late_rsvp, reminder_last_sent_at, reminder_last_count, publish_notes, publication_status, communication_entitlement, communication_mode, published_at, paused_at, published_by (to auth.users), created_at.

**guests:** event_id, name, phone, email, rsvp_status (pending/attending/declined), dietary_notes, is_vip, access_token (unique, 12 hex), meal_choice, song_request, plus_one_name, plus_one_meal, dietary_tags[], party_id, party_name, tags[], mailing_address, connection_to_couple, invite_sent_at, reminder_sent_at, invite_last_sent_at, save_the_date_sent_at, last_clicked_at, last_opened_at.

**schedules:** event_id, title, location_name, start_time, end_time, description, dress_code, is_vip_only, visibility_tags[], requires_rsvp, display_order.

**guest_schedules_rsvp:** guest_id, schedule_id, rsvp_status, updated_at.

**custom_questions:** event_id, question_text, question_type (text/single_choice/multiple_choice), options[], is_required, display_order. **custom_question_responses:** guest_id, question_id, response_text.

**registry_items:** event_id, title, description, target_amount, current_amount, url, is_cash_fund. **registry_contributions:** registry_item_id, contributor_name, amount, message.

**photos:** event_id, guest_id, image_url.

**communication_templates:** event_id (nullable), template_key, name, lifecycle_type (invitation/save_the_date/reminder/update), subject, body, sms_body, channel_default (sms/email/both). **communication_campaigns:** event_id, template_id, name, lifecycle_type, audience (all/pending/attending/declined/vip), channel, subject, body, sms_body, status (draft/scheduled/sending/sent/failed), scheduled_for, sent_at. **communication_messages:** campaign_id, event_id, guest_id, template_id, channel (sms/email), subject, body, tracking_url, qr_code_svg, provider_message_id, provider_status, provider_error, sent_at, delivered_at, opened_at, clicked_at. **communication_events:** message_id, event_id, guest_id, event_type, metadata (jsonb).

**template_designs:** slug (unique), name, taxonomy, description, best_for, colours (bg, text, accent, muted, surface, border, shadow), font_family, opening_style (envelope/minimal-fade/photo-reveal/venue-reveal/wax-seal/paper-cut), hero_treatment, motif, needs_photo, sample_image_url, status (draft/published/archived), container and text-frame style fields, canvas_width, page_background_*, section_order, hidden_sections, section_styles. **template_media_assets:** title, category, image_url, storage_path (unique), content_type, file_size.

**wedding_memberships:** event_id, user_id, role, status, invited_by, accepted_at, revoked_at. **wedding_invitations:** event_id, invitee_email, role, token_hash, status, invited_by, expires_at, accepted_at.

**checkout_provision_requests:** couple_names, owner_email, event_date, venue_name, venue_address, requested_package (email/email_sms), stripe_checkout_session_id (unique), status, event_id, completed_at. **checkout_payment_events:** stripe_event_id (primary key), stripe_checkout_session_id, stripe_customer_id, stripe_price_id, event_type, livemode, status (processing/completed/failed), event_id, error_code, completed_at. **customer_packages:** event_id (primary key), stripe_customer_id, stripe_checkout_session_id (unique), stripe_price_id, communication_entitlement, status (active/past_due/cancelled), activated_at.

## Differences from AisleFlow2's schema

- Table names: `schedules` vs `schedule_items`; `custom_questions` vs `custom_rsvp_questions`; `custom_question_responses` vs `custom_rsvp_responses`; `guest_schedules_rsvp` vs `guest_schedule_rsvps`.
- Column names: `event_date` vs `wedding_date`; guest `name` is a plain column here and a generated column in AisleFlow2; `question_text` vs `prompt`; registry `url` vs `external_url`.
- AisleFlow2 has `admin_token` on events and `planning_tasks`; this database has neither.
- This database has memberships, invitations, packages and checkout tables that AisleFlow2 lacks.
