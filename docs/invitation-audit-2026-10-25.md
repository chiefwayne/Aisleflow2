# Invitation audit: 8 theme presets (25 Oct 2026)

**Scope:**
- **Files:** the guest invitation (`GuestPortalView.tsx`, `WaxSeal.tsx`, `globals.css`), audited in all 8 presets from `theme-presets.ts`.
- **Parts checked:** opening, cover, save-the-date calendar, RSVP band and card (steps 1–3), and dress code.
- **Sizes:** 390×844 phone and 1280×800 desktop.

**Method:**
- **Contrast:** computed for every text and background pairing in every preset.
- **Detector:** the bundled design detector, run on the source.
- **Rendering:** Plan Test was cycled through the presets in the built-in browser, then reset to Royal Floral with no overrides.

**Not covered:**
- **Touch:** gestures were only tested by emulating a phone viewport, not on a real device.
- **Animation:** the browser pane was hidden, so animations were stepped manually rather than watched in real time.

## Audit health score

| # | Dimension | Score | Key finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | On dark themes the RSVP buttons and fields are unreadable (about 1.1:1) |
| 2 | Performance | 3 | Story and venue photos load eagerly; the full-page grain uses a blend mode |
| 3 | Theming | 2 | Fields, chips and buttons in RSVP steps 2–4 are hard-coded white, or white text |
| 4 | Responsive design | 3 | No overflow at 390 or 1280; Accept/Decline stack correctly; "1 HOURS" |
| 5 | Implementation integrity | 3 | The dress-code palette never reaches guests; one bounce animation |
| **Total** | | **13/20** | **Acceptable: the light themes are close to good; the dark theme needs work** |

## Implementation integrity verdict

**Pass, with two exceptions.** The new work expresses a coherent, product-specific system:
- the opening, cover, calendar, ornaments and RSVP band all take their colours from the theme;
- the RSVP band picks its text colour by measuring contrast;
- the detector found one advisory issue.

The exceptions are older RSVP internals that still assume a light card, and the dress-code palette being filtered out on its way to guests.

## Executive summary

- **Score:** 13/20 (Acceptable).
- **Issues:** 1 P0, 4 P1, 5 P2, 2 P3.
- **Top issues:**
  1. **P0:** On Celestial (the only dark preset), guests can't read the Continue, Review or Send buttons, or what they type into the meal and plus-one fields.
  2. **P1:** The dress-code colours couples add in the Editor never appear on guests' links.
  3. **P1:** The muted text (quote line, venue line) fails 4.5:1 in four presets.
  4. **P1:** Small labels drawn at 60% opacity (calendar weekdays, "Days", "Our palette") fail in seven presets.
  5. **P1:** The selected "Joyfully Accept" button on Celestial is white text on gold, about 2:1.

## Contrast by preset

| Preset | Body | Muted | Accent on page | RSVP band text | 60% labels | Seal initials |
|---|---|---|---|---|---|---|
| Royal Floral | 14.1 | **4.3** | 4.9 | 5.3 | **4.0** | 4.3 |
| Modern Minimal | 15.7 | 5.2 | 8.0 | 8.9 | **4.4** | 7.0 |
| Tuscan Wine | 13.4 | 4.6 | 6.3 | 6.7 | **3.9** | 5.3 |
| Celestial Magic | 16.1 | 7.7 | 8.8 | 8.8 | 6.3 | **1.9** |
| Indian Marigold | 14.3 | 5.2 | 5.4 | 5.7 | **4.1** | 4.5 |
| Persian Mirror | 13.6 | **3.9** | 5.6 | 5.8 | **3.9** | 4.7 |
| Destination Riviera | 13.6 | **3.5** | 5.5 | 5.9 | **4.0** | 4.8 |
| Boho Botanical | 13.3 | **3.9** | 5.1 | 5.4 | **3.9** | 4.4 |

Bold marks a value below 4.5:1, which fails for small text. The seal initials are decorative.

## Findings by severity

### [P0] Dark themes: RSVP buttons and fields unreadable

- **Location:** `GuestPortalView.tsx`.
  - **Buttons:** filled with the theme's text colour but carrying `text-white`, at lines 1229, 1254, 1330, 1360, 1679, 1768 and 1823.
  - **Fields and chips:** `bg-white` inputs and chips in steps 2–4, at lines 1294, 1451, 1502, 1532, 1545, 1569, 1610, 1637 and 1654.
- **Category:** Accessibility / Theming.
- **Impact:** Guests on Celestial see blank pale buttons. In the meal and plus-one fields they type white text into a white box (measured: white on rgb(242,239,233), and rgb(242,239,233) on white). Replying is close to impossible.
- **Standard:** WCAG 1.4.3.
- **Recommendation:**
  - Give filled buttons the surface colour as text: `color: surface` on a `text_color` fill.
  - Give fields and chips the theme's surface or a tint of it, with the theme's text colour, instead of white.
- **Suggested command:** `/impeccable harden`.

### [P1] Dress-code palette dropped from guest links

- **Location:** `src/lib/public-event.ts:4` (`PUBLIC_SECTIONS` is missing `dress_palette`).
- **Category:** Implementation integrity.
- **Impact:** Couples see the swatches in their own preview, but guests never do.
- **Recommendation:** Add `dress_palette` to the list, with a test in `public-event.test.ts`.
- **Suggested command:** `/impeccable harden`.

### [P1] Muted text below 4.5:1 in four presets

- **Location:** the quote line and venue line under the cover; `theme.muted_color` throughout.
- **Affected presets:** Riviera 3.5, Persian 3.9, Boho 3.9, Royal Floral 4.3.
- **Category:** Accessibility.
- **Impact:** Faint italic text that's hard to read outdoors on a phone.
- **Standard:** WCAG 1.4.3.
- **Recommendation:** Darken each preset's `muted_color` to at least 4.5:1 against its background, keeping its hue.
- **Suggested command:** `/impeccable colorize`.

### [P1] 60%-opacity small labels fail in seven presets

- **Location:** calendar weekdays, countdown labels, "Our palette" (`opacity-60` on `text-xs`).
- **Category:** Accessibility.
- **Impact:** These are the smallest text on the page and also the faintest.
- **Recommendation:** Use `opacity-80`, or the muted colour once it passes.
- **Suggested command:** `/impeccable colorize`.

### [P1] Celestial: selected Accept is white on gold (about 2:1)

- **Location:** step 1 and step 2 attending buttons (`text-white` on `accent_color`).
- **Category:** Accessibility.
- **Recommendation:** Choose the text colour with `readableOn(accent, …)`, as the RSVP band already does.
- **Suggested command:** `/impeccable harden`.

### [P2] Seal initials barely visible on gold seals

- **Location:** `WaxSeal.tsx`, `SealSvg` (white letters at 85%).
- **Affected presets:** Celestial 1.9:1; the others 4.3–7.0.
- **Recommendation:** Choose the letter colour from the seal colour, light or dark.
- **Suggested command:** `/impeccable polish`.

### [P2] Endlessly bouncing tick on the thank-you screen

- **Location:** `GuestPortalView.tsx:1093` (`motion-safe:animate-bounce`). Flagged by the detector.
- **Impact:** An app-like effect that never stops, against PRODUCT.md's "romantic, calm, crafted".
- **Recommendation:** Draw the tick in once with a stroke, or show it without animation.
- **Suggested command:** `/impeccable animate`.

### [P2] Gift modal uses app colours

- **Location:** the cash-fund modal's Venmo, Zelle, CashApp and PayPal badges (blue, purple, emerald and sky Tailwind colours, around lines 2297–2364), and the hard-coded cream confirmation box (`bg-[#FAF7F2]/60`).
- **Impact:** System colours inside the couple's palette, and a cream box on dark themes.
- **Suggested command:** `/impeccable colorize`.

### [P2] Photos load eagerly

- **Location:** story, venue and gallery `<img>` elements have no `loading="lazy"` or `decoding="async"`.
- **Impact:** Slower first view on phone data. The cover photo should stay eager.
- **Suggested command:** `/impeccable optimize`.

### [P2] "1 HOURS" / "1 MINUTES"

- **Location:** the calendar countdown (and the save-the-date page) always uses plural labels.
- **Suggested command:** `/impeccable clarify`.

### [P3] Global reduced-motion kill

- **Location:** `globals.css:25`, which sets every animation and transition to 0.01ms.
- **Impact:** It removes useful feedback too, such as fades and state changes. The envelope already has its own gentler reduced-motion version.
- **Suggested command:** `/impeccable animate`.

### [P3] Full-page grain uses `mix-blend-mode: multiply` on a fixed layer

- **Location:** `.paper-grain::before` (optional, off by default).
- **Impact:** Possible scroll jank on low-end Android phones.
- **Suggested command:** `/impeccable optimize`.

## Patterns and systemic issues

- **Older RSVP internals assume a light theme.** Everything built this week takes its colours from the theme, while the RSVP fields, chips and buttons from earlier work don't. One pass over the RSVP steps fixes the P0 and most of the theming score.
- **Preset muted colours were picked by eye.** Four of eight fail. A test asserting that every preset meets 4.5:1 for body, muted and accent text would stop this coming back.

## Positive findings

- **Envelope opening:** pure CSS with no images or video, so it's instant on phones. It recolours to every preset and has a reduced-motion version.
- **RSVP band:** picks its text colour by measured contrast and passes in every preset (5.3–8.9:1).
- **Body text:** 13.3–16.1:1 in every preset. Accent text on the page passes everywhere (4.9–8.8).
- **Layout:** no horizontal overflow at phone or desktop width. Accept/Decline stack cleanly on narrow phones. The floating pill hides while the RSVP is on screen.
- **Detector:** found only one advisory issue in the guest page source.

## Recommended actions

1. **[P0] `/impeccable harden`:** in the RSVP steps, set text colour by contrast on filled buttons and themed fields and chips (fixes Celestial). Add `dress_palette` to the public sections.
2. **[P1] `/impeccable colorize`:** bring every preset's `muted_color` to 4.5:1, raise the 60%-opacity labels, and re-theme the gift modal badges.
3. **[P2] `/impeccable animate`:** replace the bouncing tick with a calm one, and refine the global reduced-motion rule.
4. **[P2] `/impeccable optimize`:** lazy-load the non-cover photos, and check the grain layer on a low-end phone.
5. **[P2] `/impeccable clarify`:** singular and plural countdown labels in all six languages.
6. **`/impeccable polish`:** a final pass, including seal initials that stay legible on light seals.

---

## Fixes applied (same day)

All 12 findings are fixed. The detector now reports nothing on the guest page files, and 54 tests pass.

| Finding | Fix |
|---|---|
| **P0:** dark-theme RSVP unreadable | The guest page now sets colour variables from the theme (`--ink`, `--muted`, `--accent`, `--on-accent`, `--on-ink`, `--surface`, `--field-bg`, `--line`, `--tint`, `--error`). Every hard-coded white, charcoal, sand, terracotta, rose and gift-badge colour now uses them. Filled buttons pick their text colour by measured contrast. On Celestial: Continue 16:1, fields light on the dark card. |
| **P1:** palette dropped | `dress_palette` added to `PUBLIC_SECTIONS`, with a test. Verified on a real guest link (3 swatches). |
| **P1:** muted contrast | Four preset muted colours darkened, keeping their hue (4.7–4.8:1 on the page). The page also nudges any couple's muted colour to 5:1 at render time (`ensureContrast`). A new test asserts every preset's body, muted and accent text are at least 4.5:1. |
| **P1:** 60% labels | They now use the muted colour. Measured 4.66:1 on the tinted calendar band (was 4.0). |
| **P1:** Celestial Accept | Text on accent is chosen by contrast: dark on gold, 8.8:1. |
| **P2:** seal initials | The letter colour comes from the seal colour; dark letters on gold. |
| **P2:** bouncing tick | It rises in once. |
| **P2:** gift dialog | Payment rows and badges, the success box and the error box all use the theme. The emoji is replaced by a drawn icon. |
| **P2:** eager photos | Story, venue and gallery photos are `loading="lazy" decoding="async"`. The cover stays eager. |
| **P2:** "1 HOURS" | Singular labels added in all 6 languages. |
| **P3:** reduced motion | Nothing moves or loops, but colour and opacity changes remain as 0.15s fades. |
| **P3:** grain | The grain layer scrolls with the page instead of being fixed and re-blended on every frame. |

**Also fixed while verifying:**
- **Envelope shadow:** it glowed pale on dark themes. Shadows now use their own dark colour.
- **Browser defaults:** the placeholder text and the text cursor now take the theme's colours.

**Re-scored by the same method:**

| Dimension | Score |
|---|---|
| Accessibility | 3 |
| Performance | 4 |
| Theming | 4 |
| Responsive | 3 |
| Implementation integrity | 4 |
| **Total** | **18/20 (Excellent)** |

Accessibility and Responsive stay at 3 because touch was only tested by emulating a phone viewport, and screen-reader behaviour of the RSVP wizard wasn't checked.
