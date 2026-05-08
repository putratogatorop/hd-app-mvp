# Google Stitch prompts for HD App UI/UX upgrade

Generated 2026-05-07 to drive the next visual iteration of the customer PWA.
Use the master context block at the top of every Stitch session, then drop in
the screen-specific prompt below it.

## Master context block

```
Brand: Häagen-Dazs Indonesia. Premium ice cream PWA for Indonesian customers.
Mobile-first (iPhone 15 portrait, 390×844).

Design language: luxury editorial magazine layout (think Cereal Magazine, Kinfolk)
fused with modern F&B-app structural UX (Fore Coffee, Starbucks Reserve).
Sharp corners (0–2px radius only — NEVER rounded buttons), grain textures on
dark surfaces, oversized italic display headlines, ample whitespace,
numbered editorial sections (01, 02, 03), hairline rules as dividers.

Color palette (use ONLY these):
- Deep wine burgundy #650A30 (primary buttons, CTAs, links)
- Burgundy dark #40061E (mastheads, dark hero panes)
- Burgundy light #801237 (gradient mid-tones, hover)
- Gold #B8922A (loyalty rewards, tier accents)
- Light gold #F5E6C8 (tier badge backgrounds)
- Warm cream #FEF2E3 (page background, light surface)
- Charcoal #2B2B2B (headings, body text)
NEVER use bright red, generic gray, or off-brand colors.

Typography:
- Display: Cormorant Garamond (serif), large size, italic for emphasis, optical sizing
- Body/UI: Jost (geometric sans), regular weight
- Eyebrow labels: Jost uppercase, 11px, 0.22em letter-spacing
- Numerals (prices, points, timestamps): JetBrains Mono (tabular)

Voice: deliberate, understated luxury English with Indonesian context.
Sample microcopy: "A small luxury", "Savour the moment", "Ice cream, perfected.",
"The shortlist", "Of note". Use Rp pricing (e.g., Rp 65.000).

Always include status bar, no system chrome. Output Figma-ready frames.
```

## Prompt 1 — Onboarding / first-run (currently missing)

```
Design a 4-screen first-run onboarding for the Häagen-Dazs PWA, mobile portrait.

Screen 1 — Splash welcome: full-bleed burgundy-dark hero with grain texture,
HD wordmark logo at top, oversized italic Cormorant headline "Begin." with subtitle
in Jost: "An ice cream membership, refined for you." Single cream-colored CTA
"Continue" at bottom. Top-right link: "Sign in".

Screen 2 — Account creation: cream background, eyebrow "01 — Identity",
display headline "Tell us your name." Single underlined text input (no boxed
fields — hairline-bottom only). Subtle "Why?" link. Burgundy "Next →" CTA.

Screen 3 — Personalisation: eyebrow "02 — Preferences", headline "Pick three
flavours you love." Show 6 product cards in 2-column grid using HD product
photography (vanilla bean, dulce de leche, matcha green tea, salted caramel,
strawberry, cookies & cream). Selected cards get a thin gold border + small
serial number badge.

Screen 4 — Tier introduction: eyebrow "03 — Welcome", headline "You're a
Connoisseur." Animated tier badge in gold-light with serif tier name.
Below: "Earn 1 point per Rp 1.000. 500 points to Maestro tier."
With horizontal progress bar (charcoal hairline, gold fill).
Final CTA "Begin tasting →" launches /home.

Style: numbered editorial sections, hairline rules between fields,
no rounded corners, generous vertical rhythm. Show two style variants.
```

## Prompt 2 — Home v2 (Fore density + editorial)

```
Redesign the customer home screen for the HD PWA. Reference the Fore Coffee app
home structure (high card density, horizontal scroll, clear hierarchy) but in HD
editorial luxury style.

Sections, top to bottom:
1. Sticky header: HD wordmark left, points strip right showing "1,240 pts · Maestro"
   in Jost mono, tappable.
2. Hero masthead: burgundy-dark grain texture pane, eyebrow "MAY 2026 · JAKARTA",
   oversized italic Cormorant "A flavour for the season." with subtitle
   "Limited collection — Mango Sorbet & Salted Honeycomb." Full-bleed product
   photography on the right.
3. Horizontal pill switcher: Pickup · Delivery · Dine-in · Gift — current selection
   shown with burgundy underline.
4. "01 — The shortlist" — horizontal-scroll product strip, 2.5 cards visible,
   each with full-image card (no rounded corners), product name in Cormorant,
   price in JetBrains Mono ("Rp 65.000"), small "+" CTA in corner.
5. "02 — Of note" — 2x2 editorial grid of contextual links:
   (Loyalty rewards · Voucher wallet · Order history · Find a store),
   each tile with gold accent line on left edge.
6. "03 — A reason to return" — horizontal carousel of campaign banners
   (real HD photography), e.g., "Buy 1 Get 1 — weekdays" and "Lunar Prosperity collection".
7. "04 — In your kitchen" — recipe-card style row showing serving suggestions.
8. Floating cart FAB: fixed bottom-right, burgundy circle with item count badge.
9. Bottom nav: 5-tab dark burgundy bar (Home · Menu · Orders · Voucher · Account).

Show three states: empty cart, 2-item cart, 6-item cart (different FAB density).
Generate two variants — one denser like Fore, one airier editorial.
```

## Prompt 3 — Loyalty / tier dashboard (new dedicated screen)

```
Design a dedicated loyalty/tier dashboard screen for the HD PWA.
This is the user's "trophy room" — celebrating their journey.

Layout, top to bottom:
1. Editorial header: eyebrow "LOYALTY · 2026", italic display "Your tasting journey."
2. Hero tier badge: full-width gold-light card, eyebrow "CURRENT TIER",
   Cormorant italic "Maestro" in burgundy, with serif tier monogram.
   Below: "Member since April 2026 · 7 visits this month."
3. Tier progress bar: charcoal hairline track, gold fill at 62%,
   labels "1,240 pts" → "2,000 pts (Grand Maestro)" in JetBrains Mono.
4. "01 — Earned this month": horizontal stat row — 3 metrics
   (Points earned · Visits · Vouchers used), each in tabular numerals.
5. "02 — Tier benefits": vertical list of perks, each with
   gold accent dot + Cormorant title + small Jost description.
   Examples: "Birthday scoop on us", "Exclusive seasonal previews",
   "Priority pickup queue".
6. "03 — Tiers": horizontal tier ladder showing all 4 tiers
   (Initiate · Connoisseur · Maestro · Grand Maestro),
   user position highlighted with thin gold underline.
7. "04 — Redeem": grid of 4 reward cards, each with HD product
   photography, point cost in JetBrains Mono, "Redeem" thin CTA.

Style: cathedral-ceiling vertical rhythm (lots of whitespace),
numbered sections, all monetary values in tabular mono.
Generate two variants.
```

## Prompt 4 — Cart with gift mode (HD's hero feature)

```
Design the cart screen for the HD PWA with a unique gift-mode toggle
that morphs the entire screen layout. This is HD's hero feature.

Default mode (Personal):
1. Sticky header: "Your basket" Cormorant italic + small item count.
2. Toggle row: two pill buttons "For me" / "As a gift" — animated underline slides between.
3. Items list: each row shows product image (square, no radius),
   name in Cormorant, qty stepper in mono numerals, line price in mono,
   strike-through original if discounted.
4. "01 — Order mode": pickup/delivery/dine-in selector with hairline divider.
5. "02 — A small addition": horizontal scroll of upsell items
   (toppings AND complementary cross-sell — sauces, wafers).
6. "03 — Notes for the kitchen": underlined text input, optional.
7. "04 — Voucher": current voucher chip OR "Apply a voucher" link.
8. "05 — Payment": 2x2 grid of payment logos (GoPay, OVO, Dana, Credit Card).
9. Order summary: subtotal, voucher discount, points earned, total —
   each in JetBrains Mono with dotted-leader rule between label and value.
10. Sticky CTA: full-width burgundy "Place order — Rp 145.000".

Gift mode (toggle ON, layout morphs):
- Header changes: "A gift to send" instead of "Your basket"
- New section above items: "00 — Recipient":
  - Underlined text inputs for name, phone, WhatsApp toggle
  - Date picker for delivery date (subtle, hairline-only)
  - Personal note textarea: "Write something thoughtful."
    (max 200 chars, char counter in mono numerals)
  - Gift wrap upgrade: small image preview + "+Rp 25.000 — Editorial wrap"
- Items list compresses; "Send a gift" replaces "Place order" CTA.

Show both states side by side. Generate two variants.
```

## Prompt 5 — Order tracking detail (currently bare)

```
Redesign the order detail / live tracking screen for the HD PWA.
Current status states: confirmed · preparing · ready / out for delivery · completed.

Layout:
1. Editorial header: eyebrow "ORDER · #HD-2026-0512",
   Cormorant italic "Your order is on the way." (status-driven copy).
2. Visual timeline: vertical, 4 stages, each with:
   - Hairline serif numeral on left (01–04)
   - Title in Cormorant, time stamp in mono on right
   - Completed stages in burgundy, current pulses gold, future is hairline gray
   - Estimated time gap labelled in mono between stages
3. "Item list": minimal — product images in row, qty as small mono superscript.
4. "Store" or "Delivery to": for pickup, store address + map thumbnail with
   "Get directions" link; for delivery, courier name, contact, vehicle plate.
5. "Payment" recap: amount + method, subtle.
6. "Points earned" callout: gold-light card with serif mono count "+45 pts".
7. Two CTAs: "Order again" (burgundy primary), "Need help?" (text link).

For delivery mode add a static map view showing courier pin + destination.
For pickup add a QR code (sharp corners — square code, no styling)
for staff to scan at counter.

Show all 4 status states as separate frames in one canvas.
Generate two variants — one minimal-typographic, one with more imagery.
```

## After generating in Stitch

1. Don't export Stitch's React/CSS — it ignores design tokens; you'd remap every hex.
2. Export to Figma instead — preserves layers/components, useful as a dev reference.
3. Use Stitch as art director, not code generator.
4. Feed existing screen PNGs as image references when iterating to keep aesthetic continuity.

## Future prompts to write when these are exhausted

- Search-and-discovery flow (current /menu has minimal search affordance)
- Empty states (cart, orders, vouchers — currently text-only)
- Profile editing (currently view-only)
- Address book + delivery autocomplete (currently re-type each order)
- Referral share screen (currently text card only)
- Promo/campaign landing page (e.g., Lunar Prosperity, BOGO)
