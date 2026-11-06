# Premium invitation research (25 Oct 2026)

What makes Vowpost, Cardia Studios and Areone feel premium, how their openings work, and what AisleFlow should adopt. Each template was opened and read in the browser at phone size, including the CSS behind the openings.

## How the openings work

### Vowpost: a CSS envelope (`/i/grace-noah`, `/i/charlotte-james`, `/i/willow-river`)
- **The envelope is made of HTML and CSS.** It uses no images: five layered triangles cut with `clip-path` (back, pocket, two folds and the flap), soft paper gradients, and an inset 1px border in the accent colour.
- **The seal carries the couple's initials** ("GN", "CJ", "WR"), drawn on a scalloped wax disc.
- **At rest:**
  - the envelope floats up and down by 6px every 6.5s;
  - a soft glow behind it pulses;
  - an SVG paper grain sits at 50% opacity;
  - the edges carry a vignette in the accent colour.
- **Wording:** "You're invited" above the envelope and "Tap to open ✦" below it. That's all.
- **On tap:**
  - **Seal:** it lifts, tilts and fades (0.55s).
  - **Flap:** it swings open in 3D, `rotateX(176deg)`, over 0.85s.
  - **Envelope:** it slides up off the screen and fades (0.8s).
  - **Invitation:** it rises in underneath.
  - **Reduced motion:** with reduced motion on, it simply crossfades.
- **Load time:** almost nothing to download, so it appears instantly.
- **Customising:** the envelope and opening are identical for every couple. Only the initials and the photo behind change.

### Cardia Studios: a filmed envelope (Royal Gold, Wine, Quiet Luxury)
- **Loading screen:** the couple's names or monogram, with a progress ring or bar labelled "Preparing your invitation".
- **The first frame:** a 4-second video, paused on its first frame, fills the screen. It shows a close-up of a textured envelope with a photographed metal-look wax seal.
- **Overlay:** the names in script, the date and place in spaced capitals, and a frosted "Open invitation" button.
- **On tap:** the video plays (the seal breaks and the envelope opens), then crossfades into the page.
- **Colours:** each colour option is a separate video. Quiet Luxury switches between blue, pink with a pearl seal, and so on.
- **Downside:** heavy. Quiet Luxury was still at 9% after 15 seconds on a desktop connection.

### Areone
- **No real opening:** the page fades in. Classic is a printed card with a double-rule border, and Celestial is a night sky.

## What makes each one feel premium

| | Vowpost (simple) | Cardia (luxurious) | Areone (busy) |
|---|---|---|---|
| **Hero** | Full-bleed photo with names overlaid; the content panel slides up over it | Script names on paper, with a watercolour or engraved illustration | Names in a double-rule paper frame and a circle monogram |
| **Type** | Script or tall serif for names and headings, Garamond for text, one small sans for labels | Script headings, Garamond text, spaced small caps | Serif plus sans, with many styles |
| **Sections** | Flat, no cards; alternating background tints; a small flower glyph between sections | Light sections alternating with **deep accent-colour bands**; engraved line illustrations between sections | Boxes, outlines and many buttons |
| **Colour** | One accent plus tinted neutrals | One accent (plum, emerald, …) with soft and pale steps | Theme-specific, often loud |
| **Texture** | Light paper grain | Linen paper photo, torn deckle edges | Flat cream or a tartan grid |
| **Details** | Dress-code palette swatches, timeline programme, menu with a photo, falling petals, music button | Countdown in italic numerals with hairlines, calendar with a **hand-drawn heart** around the date, alternating left/right timeline, "Dear Guest," RSVP card, colour switcher | Sticky "RSVP · Reply by 1 Oct" bar, add-to-calendar buttons |

**What the premium ones avoid:**
- interface language;
- many type styles;
- cards around every section;
- a label above every heading.

**What they share:**
- a real object (an envelope or a sheet of paper);
- a romantic display face for the names;
- one accent colour used with restraint;
- small hand-made touches.

## Our invite today (Tom & Jerry, phone size)

- **Opening:**
  - It's a UI card with a round button. The wording is software-like: "open your private guest portal", "Personalized · No account required".
  - Its smaller text is in the app's sans-serif.
- **Hero:**
  - Text comes first, with the photo in a rounded card below it.
  - There are four type styles in the first screen: sans capitals, italic serif, display serif, and sans capitals again.
- **Sections:**
  - Every section has a "CHAPTER IV" style label, which is the generic AI pattern.
  - Most sections sit in cards, so there's no rhythm of light and colour.
- **RSVP:** now matches the theme, but "Joyfully Accept" and "Regretfully Decline" wrap onto two lines at phone width.
- **No paper texture, illustrations or monogram.**

## Recommended upgrades (in order of impact)

1. **A real envelope opening (Vowpost technique, Cardia finish).**
   - **Build:** a CSS envelope in the theme's colours, with a wax seal carrying the couple's initials.
   - **Motion:** the seal lifts, the flap opens, the envelope slides away and the invite rises.
   - **Wording:** "You're invited" and "Tap to open", with no app wording.
   - **Speed and colours:** it loads instantly and recolours to any theme.
   - **Later option:** a filmed envelope video for a "signature" tier.
2. **A cover hero.**
   - **Photo layout:** a full-bleed couple photo with names overlaid, and content that slides up over it.
   - **Stationery layout:** a framed hero with a double rule and a monogram, for couples without a photo.
3. **A tighter type system.**
   - **Names:** a display face, with a choice of script (Great Vibes / Pinyon style) or tall serif.
   - **Text:** one serif.
   - **Small sans:** only for tiny labels.
   - **Section headings:** in the display face.
   - **Chapter labels:** off by default.
4. **Section rhythm instead of cards.**
   - **Layout:** flat sections on alternating tints, with an ornament divider between them.
   - **Accent bands:** for one or two key moments (venue and RSVP), as Cardia does.
5. **Paper grain (optional).**
   - A subtle SVG noise texture, switchable per design, with no grid or tartan.
6. **Hand-made details.**
   - a monogram used on the seal, loader and footer;
   - a calendar with a hand-drawn heart around the date;
   - dress-code palette swatches;
   - a "Dear Elena," letter-style RSVP opening;
   - a sticky "RSVP · Reply by" pill.
7. **Engraved line illustrations** (venue, florals, rings), recoloured to the accent. This needs a licensed SVG set, so it's best as a later phase.
8. **Copy and motion polish.**
   - remove remaining app wording;
   - scroll reveals that never hide content;
   - fix the RSVP button wrapping;
   - a reduced-motion version of every animation.

## Built (first round, 25 Oct 2026)

- **1. Envelope opening:** done. "Wax seal" and "Envelope" now both show the CSS envelope; Builder → Opening lists it as **Sealed Envelope**. Curtain and Minimal keep their card, with the app wording removed.
- **2. Cover hero:** done. Builder → Presets → Invitation layout → Cover offers **Full photo** or **Framed stationery**. Full photo is the default when a cover photo exists.
- **3. Type:**
  - **Names and headings:** set in Corinthia (script) or the theme serif (Presets → "Names & headings").
  - **Body text:** follows the theme's text face, so it's Garamond for the serif themes.
  - **Chapter labels:** optional; the default is an ornament.
- **4. Rhythm:**
  - flat sections with ornaments;
  - a soft-tint "Save the date" band;
  - the RSVP on an accent-colour band, with text colour picked for contrast.
- **5. Paper grain:** optional (Presets → Paper texture).
- **6. Details:**
  - monogram on the seal and the stationery frame;
  - calendar with a hand-drawn heart;
  - dress code with palette swatches (Editor → Dress Code Colours);
  - "Dear Elena," on the RSVP;
  - a floating "RSVP · Reply by …" pill.
- **8. Polish:**
  - Accept/Decline stack on narrow phones;
  - every animation has a reduced-motion version;
  - the content shows even if the entrance animation doesn't run.

**Not yet:**
- **7. Engraved illustrations:** these need a licensed SVG set.
- **Filmed envelope video:** possible later as a "signature" option.
