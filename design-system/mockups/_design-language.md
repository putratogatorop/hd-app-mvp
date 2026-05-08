# Häagen-Dazs Indonesia — Master Design Language
**Version 1.0 · 07 May 2026 · Source of truth for all builder agents**

This document is synthesised directly from six Stitch HTML files and the Haute Indulgence DESIGN.md. Every rule here is observed behaviour, not aspiration. Other agents must not deviate without explicit PM sign-off.

---

## 0. Philosophy

The aesthetic target is **"Deliberate Decadence"** — the interface should feel as premium as the product. The reference mood boards are Kinfolk magazine, Cereal magazine, and high-end Parisian chocolatiers' websites. The enemy is high-frequency retail (Tokopedia-style bright chips, Gojek-style full-colour icons, and rounded-corner bubbly cards). Every design decision must ask: *would this look at home in a single-page spread of a luxury food journal?*

Key emotional axis: **slow · quiet · precise · sensory-rich**.

---

## 1. Typography Scale

All fonts must be loaded from Google Fonts in a single link tag in this order: Cormorant Garamond → Jost → JetBrains Mono.

```
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Jost:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap
```

### 1.1 Type Roles

| Role | Font | Size | Weight | Line-height | Letter-spacing | Style notes |
|---|---|---|---|---|---|---|
| `display-xl` | Cormorant Garamond | **72–82px** | 300 | 1.0–1.1 | -0.02em | Almost always italic; used for hero H1 only |
| `display-lg` | Cormorant Garamond | **56–64px** | 300 | 1.0 | -0.02em | Section splash headlines; italic encouraged |
| `headline` | Cormorant Garamond | **26–32px** | 500 | 1.15–1.2 | -0.02em | Section titles (within `.section-title-text`), card headings |
| `headline-sm` | Cormorant Garamond | **18–22px** | 500 | 1.1 | -0.02em | Sub-titles, product names on cards |
| `body` | Jost | **16px** | 400 | 1.6 | 0 | All descriptive prose |
| `body-sm` | Jost | **12–14px** | 300–400 | 1.5 | 0 | Supporting text, card taglines |
| `eyebrow` | Jost | **11px** | 600 | 1 | **0.22em** | Section labels, category tags, nav labels — always uppercase |
| `eyebrow-xs` | Jost | **9–10px** | 500–600 | 1 | 0.14–0.20em | Metadata lines, timestamps, progress labels — always uppercase |
| `price-numeral` | JetBrains Mono | **13–14px** | 500 | 1 | -0.02em | All monetary values, tabular data |
| `price-xl` | JetBrains Mono | **36–72px** | 500 | 1 | -0.04em | Hero point counts, large stat numerals |
| `section-numeral` | JetBrains Mono | **10–11px** | 400–500 | 1 | 0.04em | Section index numbers (01, 02 …); dimmed to 30–40% opacity |

### 1.2 Italic Rules

- `display-xl` and `display-lg`: **always** italic.
- `headline` on dark surfaces (masthead, card inside dark panel): italic preferred.
- `headline` on light surfaces (section headers, product cards): italic for editorial flavour words (e.g. *shortlist*, *cara*, *flavours*), roman for structural words.
- Body text: never italic unless quoting a flavour descriptor.
- Price numerals: never italic.
- Eyebrow labels: never italic.

### 1.3 Asymmetric / Staggered Headline Composition

Stitch consistently breaks display headlines at **meaningful semantic breaks**, not line-width breaks. Examples observed:

```
A Portrait of
             Indulgence          ← second line indented ~96px (pl-24 in Tailwind / ~6rem)

Pure Indulgence,
Crafted for the Senses.         ← line break before comma phrase

The Art of
Slow Melting.                   ← monosyllabic second line creates visual punch

A flavour
  for the season.               ← indented em-dash equivalent
```

Rule: the second (or third) line should be **indented by 20–40% of the line width** to create a magazine-style stagger. Never centre-align display text. Always left-align.

---

## 2. Colour System

### 2.1 Base Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#42001C` | Deepest burgundy — text on light, icon colour, active states |
| `primary-container` | `#650A30` | Primary brand colour — primary buttons, dark callout backgrounds |
| `hd-burgundy-dark` | `#40061E` | Masthead / hero dark backgrounds, status bar |
| `hd-burgundy-light` | `#801237` | Hover states on burgundy elements, gradient mid-tone |
| `surface` | `#FFF8F3` | Default page background |
| `surface-container-low` | `#FEF2E3` | Card backgrounds, member strip, warm panels |
| `surface-container` | `#F8ECDD` | Slightly deeper warm panel |
| `surface-container-high` | `#F2E6D8` | Tonal depth tier — use on elevated cards over surface-container-low |
| `surface-container-highest` | `#ECE1D2` | Footer backgrounds |
| `surface-dim` | `#E4D8CA` | Subdued backgrounds, locked-state overlays |
| `on-surface` | `#201B12` | Primary body text colour |
| `on-surface-variant` | `#554246` | Secondary / supporting text |
| `outline` | `#887176` | Subtle borders on light surfaces |
| `outline-variant` | `#DAC0C5` | Very subtle dividers |
| `secondary` (gold-dark) | `#775A00` | Used only on dark burgundy surfaces for gold-tone contrast |
| `secondary-container` | `#FED264` | Gold fill — loyalty progress bars, point count highlight |
| `hd-gold` | `#B8922A` | Gold — loyalty tier labels, points numerals, active tier lines |
| `hd-gold-light` | `#F5E6C8` | Light gold — tier badge backgrounds, subtle accent fills |
| `hd-ink` | `#2B2B2B` | Charcoal — used for hairlines and as alternate body text |
| `on-primary` | `#FFFFFF` | Text/icons on burgundy backgrounds |
| `on-primary-container` | `#E97597` | Text on dark burgundy panels when not white |
| `primary-fixed-dim` | `#FFB1C4` | Light pink — used as gold contrast label on dark surfaces |

### 2.2 Colour Usage Rules

**Burgundy:**
- `#650A30` (primary-container) = CTA buttons, full-bleed dark sections, membership card background.
- `#40061E` (hd-burgundy-dark) = masthead, status bar, the very darkest brand surface.
- `#42001C` (primary) = all icons, active nav items, section eyebrow text, link colour.
- Never use `red-*` Tailwind classes or `#C8102E`.

**Gold (`#B8922A`):**
- Gold is **exclusively for loyalty and rewards contexts**: tier badges, points numerals, progress bar fills, the `Active` status label on privilege cards, the tier-item underline when active.
- Gold MUST NOT appear on product cards, nav, or any transactional UI outside the Lounge.
- Gold is scarce by design — its scarcity maintains its premium signal.

**Cream (`#FEF2E3` / `#FFF8F3`):**
- Default background. Never pure white (`#FFFFFF`) for page backgrounds.
- Surface containers layer from `#FFF8F3` → `#FEF2E3` → `#F8ECDD` → `#F2E6D8` to create tonal depth without shadows.

**Hairlines and dividers:**
- Standard hairline: `rgba(43,43,43,0.12)` — used for section dividers and card borders.
- Soft hairline: `rgba(43,43,43,0.08)` — used inside cards and between list items.
- On dark burgundy surfaces: `rgba(254,242,227,0.15)` — cream hairlines.
- All hairlines are exactly **1px**.

**Opacity multipliers:**
- Disabled / locked content: `opacity: 0.55`.
- Dimmed section numerals (01, 02…): `rgba(43,43,43,0.30)` or `text-on-surface-variant/40`.
- Supporting metadata text: `rgba(43,43,43,0.45–0.50)`.
- Faintest watermark text (footer copy): `rgba(43,43,43,0.25)`.

---

## 3. Spacing Rhythm

All spacing is based on a **4px unit**. Key intervals:

| Context | Value |
|---|---|
| Base unit | 4px |
| Gutter (horizontal padding inside cards) | 16–24px |
| Page margin (horizontal padding on scroll area) | 20px (mobile) / 32–48px (desktop) |
| Between major page sections | **80px** (section_gap) — measured from the bottom of one section header to top of the next section's content |
| Between sub-sections within a section | 48–64px |
| Section header bottom border → first content item | 16–20px |
| Between heading and body paragraph | 14–16px |
| Between eyebrow label and display headline | 14–16px |
| Between display headline and sub-copy | 14–18px |
| Progress bar to labels | 6px |
| Card internal padding (small) | 14–16px |
| Card internal padding (medium) | 18–20px |
| Card internal padding (large / luxury) | 24–32px |
| Tier card (membership card) internal padding | 18–20px all sides |

**Section header anatomy:**
```
[MONO NUMERAL: 01]  [14px gap]  [DISPLAY/HEADLINE: Section title]  →  [EYEBROW LINK]
────────────────────────────────────────────────────────────────────────────────────── 1px hairline
[16–20px gap before content]
```

---

## 4. Component Patterns

### 4.1 Section Header Pattern

Every major scroll section starts with this exact structure:

```html
<div class="section-header">           <!-- flex, items-baseline, justify-between, border-bottom 1px, pb-14px, px-20px -->
  <div class="section-header-left">    <!-- flex, items-baseline, gap-14px -->
    <span class="section-num">01</span> <!-- JetBrains Mono 11px, rgba(43,43,43,0.35), letter-spacing 0.04em -->
    <span class="section-title-text">   <!-- Cormorant Garamond 26px, weight 500, letter-spacing -0.02em, line-height 1 -->
      The <em>shortlist</em>            <!-- em = italic Cormorant for editorial flavour word -->
    </span>
  </div>
  <a class="section-link">Semua ↗</a>  <!-- optional; Jost 11px, weight 600, letter-spacing 0.18em, uppercase, burgundy -->
</div>
```

**Never** use a large eyebrow-only label as a section header. Always pair the mono numeral + Cormorant title.

### 4.2 Membership / Member Card Pattern

- Aspect ratio: **1.6 / 1** (credit-card landscape).
- Background: `#40061E` (hd-burgundy-dark).
- Border: `1px solid rgba(184,146,42,0.25)` — gold hairline.
- Internal: grain texture overlay at 5% opacity.
- Internal: two radial gradients (gold top-right glow, burgundy-light bottom-left ambient).
- Layout — three rows stacked (justify-content: space-between):
  - **Top row**: Tier label in gold (`#B8922A`), Cormorant Garamond 13px, weight 300, letter-spacing 0.22em, uppercase.
  - **Mid row**: Cardholder name (Jost 14px, weight 600, letter-spacing 0.16em, uppercase, cream) + since date (JetBrains Mono 9px, cream/40%).
  - **Bottom row**: Points big numeral right-aligned (JetBrains Mono 42px, gold) + "Points" label (JetBrains Mono 9px, gold/60%).
- Corner accent: small SVG diamond/star in gold at 45% opacity.
- Transition on hover: `scale(1.01)` over 500ms.
- **No rounded corners** — 0px border-radius everywhere.

### 4.3 Product Card Pattern

- Aspect ratio: **4 / 5** (portrait, slightly taller than square).
- Image container: overflow hidden, background `surface-container-low` (#FEF2E3).
- Border: `1px solid rgba(43,43,43,0.08)` (rule-soft).
- **Editorial photo treatment**: images use `filter: grayscale(20%)` at rest; on hover: `filter: grayscale(0%)` over 700ms. This is the Stitch "editorial photo" signature — always apply to product imagery.
- Small index numeral: `JetBrains Mono 9px`, top-left corner, burgundy colour, cream/92% background pill — no radius.
- Product name: Cormorant Garamond 19px, weight 500, letter-spacing -0.02em.
- Footer (name-price row): `border-top: 1px solid rgba(43,43,43,0.08)`, padding-top 10px, flex space-between.
- Price: JetBrains Mono 13px.
- Arrow: `↗` character or thin SVG, rgba(43,43,43,0.30); on hover: burgundy + translate(2px,-2px).
- Hover on image: `transform: scale(1.05)` over 700ms (not 300ms — slow luxury).
- Card width in horizontal scroll: **220px** minimum.

### 4.4 Privilege Card Pattern (Lounge)

Two states: **Active** and **Locked**.

**Active state:**
- Border: `1px solid rgba(43,43,43,0.08)`.
- Left image: 88px wide, overflow hidden, image with 600ms scale(1.06) on hover.
- Title: Cormorant Garamond 19px, weight 500.
- Status label: `Active` in JetBrains Mono 9px, letter-spacing 0.12em, uppercase, **gold (#B8922A)**.

**Locked state:**
- Same visual except status area shows a small bordered pill label: `Locked · X pts` in JetBrains Mono 9px, rgba(43,43,43,0.40), border `1px solid rgba(43,43,43,0.15)`.
- The entire card does NOT grey out — only the CTA/status area reads locked.

**Curated Privileges (Stitch loyalty_dashboard variant) — editorial numbered grid:**

When displaying privilege items in a columnar grid (not the horizontal card layout), use the `03.1 / 03.2 / 03.3` notation:

```html
<div class="border-t border-hairline pt-8 flex flex-col">
  <span class="numeral text-[11px] text-on-surface/30 mb-8">03.1</span>
  <h3 class="cormorant italic text-[28-32px] mb-4">Boutique Escapade</h3>
  <p class="jost text-[16px] text-on-surface-variant mb-8 flex-grow">...</p>
  <div class="flex justify-between items-center">
    <span class="mono text-[16-20px] text-primary">500 pts</span>
    <button class="bg-primary-container text-white px-8 py-3 eyebrow uppercase">Redeem</button>
  </div>
</div>
```

### 4.5 Form Input Pattern

**No border boxes. Bottom-border only.**

```css
.input-underline {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 1px solid rgba(43,43,43,0.20);
  background: transparent;
  padding-left: 0;
  padding-right: 0;
  font-family: var(--font-sans);
  font-weight: 300;
}
.input-underline:focus {
  border-bottom-color: #42001c;
  outline: none;
  box-shadow: none;
}
```

Labels: Jost, 10px, letter-spacing 0.22em, uppercase, rgba(43,43,43,0.60).

### 4.6 Button Patterns

**Primary (Burgundy Block):**
```css
background: #650A30;   /* primary-container */
color: #FFFFFF;
font-family: Jost;
font-size: 11px;
font-weight: 600;
letter-spacing: 0.22–0.30em;
text-transform: uppercase;
padding: 16–20px vertical, 40–48px horizontal (or full-width);
border-radius: 0;       /* STRICTLY NO RADIUS */
transition: background 300ms;
```
Hover: `background: #42001C` (darker primary). Never use opacity fade for hover.

**Ghost (Outline):**
```css
background: transparent;
border: 1px solid rgba(43,43,43,0.30);  /* or 1px solid #42001c */
color: on-surface or primary;
/* same font rules as primary */
```
Hover: `background: surface-container-highest` (subtle tonal fill).

**Never:**
- Rounded corners (border-radius > 0).
- Drop shadows on buttons.
- Gradient fills on buttons.
- Bright green/blue/orange for any button state.

### 4.7 Sticky CTA Pattern

Used on detail/cart pages. Fixed to bottom, full-width:

```css
position: fixed;
bottom: 0;
left: 0;
right: 0;
background: rgba(254,242,227,0.95);
backdrop-filter: blur(4px);
border-top: 1px solid rgba(43,43,43,0.08);
padding: 16–24px var(--page-margin);
z-index: 50;
display: flex;
justify-content: space-between;
align-items: center;
```

Left side: eyebrow label (Jost 9px uppercase) + price (JetBrains Mono 18–20px, primary).
Right side: primary burgundy button.

---

## 5. Editorial Language Patterns

### 5.1 Transactional → Editorial Replacement Table

| Transactional (banned) | Editorial replacement (use this) |
|---|---|
| Add | *Tambahkan ke dalam pilihan* or just a `+` numeral action |
| Cart | Bag / Selection / *Your Selection* |
| Checkout | Proceed / *Send to Boutique* |
| Rewards | *Curated Privileges* / *The Vault* |
| Points | *Accrued Moments* (in copy) / `pts` in data labels |
| Order | *Selection* (noun) / *Curate an order* (verb) |
| Buy | *Reserve* / *Secure* |
| Delivery | *Delivered to your door* |
| Search | *Discover* |
| Filter | *Refine* |
| Sign Up | *Join the inner circle* |
| Login | *Return* |
| My Account | *Your Portrait* / *Profile* |
| History | *The Journal* |
| Redeem | *Exchange* / *Redeem Luxuries* (as a CTA) |
| Subscription plan | *MyHD Plan* |
| Referral | *Share the Sip* |
| Gift | *Send a gift* / *A gift to send* |
| Member tier | *Reserve · Maestro* / *Reserve · Grand Maestro* etc. |
| Loading | (no loading text — use editorial skeleton with hairline) |
| Error | *A small delay* |

### 5.2 30+ Specific Phrases with Context

| Phrase | Where it appears |
|---|---|
| *"A small luxury, measured in spoonfuls."* | Home intro italicised copy above section 01 |
| *"Selamat sore, Putra"* | Masthead greeting (Jost 11px, gold-light, uppercase) |
| *"A flavour for the season."* | Home H1 hero (display-xl italic) |
| *"Scroll untuk mulai"* | Scroll cue below hero copy |
| *"Your tasting journey, curated."* | Lounge header sub-label (Jost 12px, uppercase, cream/45%) |
| *"A small luxury."* | Lounge header H1 (display-xl italic, cream) |
| *"Curated Privileges"* | Lounge section 02 heading (not "Rewards") |
| *"The Journal"* | Transaction history section heading (not "History") |
| *"The Vault"* | Link to rewards from member strip |
| *"Reserve · Maestro"* | Tier label on card (Cormorant Garamond 13px weight 300, uppercase) |
| *"Grand Maestro"* | Next tier progress label |
| *"Earned this season"* | Stats section heading |
| *"Active"* | Privilege available indicator (gold, mono) |
| *"Locked · 2,500 pts"* | Privilege locked state label |
| *"The Golden Score"* | Points balance card headline (loyalty dashboard) |
| *"Your accrued moments of pure artisan excellence."* | Points card sub-copy |
| *"A Portrait of Indulgence"* | Loyalty dashboard H1 (display-xl, staggered) |
| *"Member Since"* | Member date label (eyebrow) |
| *"Boutique Escapade"* | Reward name (Cormorant italic) |
| *"The Artisan Pint"* | Reward name |
| *"Heritage Kit"* | Reward name |
| *"Chef's Platter"* | Reward name |
| *"Birthday Scoop"* | Privilege name |
| *"Early Access"* | Privilege name |
| *"Artisan Workshop"* | Privilege name |
| *"Begin tasting"* | Onboarding final CTA (eyebrow uppercase, with → arrow) |
| *"Join the inner circle"* | Footer concierge link / newsletter |
| *"EST. 1960"* | Heritage marker on dark panels |
| *"Don't Hold Back."* | Footer tagline (JetBrains Mono 10px, uppercase) |
| *"Savour the moment"* | Footer copyright tagline |
| *"© Häagen-Dazs Indonesia · The Lounge"* | Lounge footer copyright |
| *"by chat, always"* | Contact detail italic sub-line |
| *"Enquiries"* | Contact section label (not "Contact Us") |
| *"Boutique Visit — Grand Indonesia"* | Journal entry title format: [Type] — [Location] |
| *"The Craft of Indulgence"* | Footer brand headline |
| *"Signature Collection"* | Hero product label (mono 8px, gold-light) |
| *"07 Mei 2026 · Jakarta"* | Masthead dateline (mono 9px, cream/50%) |

### 5.3 Section Eyebrow Numerals

When sections appear in a full-page editorial layout (not inside a phone shell), prefix eyebrow labels with `01 —`, `02 —`, etc. in JetBrains Mono. When sections appear inside the phone shell, use the `section-num` pattern (mono, dimmed, preceding the Cormorant title).

Sub-items within a section use dot notation: `03.1`, `03.2`, `03.3` in the same mono style.

---

## 6. Interaction & Motion

| Element | Trigger | Property | Duration | Easing |
|---|---|---|---|---|
| Product card image | hover | scale(1.05) | 700ms | cubic-bezier(0.2,0.8,0.2,1) |
| Membership card | hover | scale(1.01) | 500ms | ease-out |
| Product card image (editorial) | rest → hover | grayscale(20%) → grayscale(0) | 700ms | ease-out |
| Arrow (↗ in cards) | parent hover | translate(2px,-2px), color → burgundy | 200ms | ease |
| Nav item active state | tap | scaleX(0→1) on top border | 300ms | cubic-bezier(0.2,0.8,0.2,1) |
| Mode row active | tap | border-left-color, title color+italic | 300ms | cubic-bezier(0.2,0.8,0.2,1) |
| Section stagger (page load) | DOM ready | opacity(0→1) + translateY(18→0) per child | 700ms | cubic-bezier(0.2,0.8,0.2,1) |
| Stagger delay offsets | — | 0.05s, 0.12s, 0.22s, 0.32s | — | — |
| Primary button | hover | background darkens (no scale) | 300ms | ease |
| Ghost button | hover | tonal fill | 300ms | ease |
| Progress bar | page load | width 0 → X% | 900ms | cubic-bezier(0.2,0.8,0.2,1) |
| Privilege/reward card hover | hover | border-color opacity increase | 300ms | ease |
| Privilege image | parent hover | scale(1.06) | 600ms | cubic-bezier(0.2,0.8,0.2,1) |
| Reward card image | parent hover | scale(1.10) | 700ms | ease-out |

**Named easing curve:** `--ease-ed: cubic-bezier(0.2, 0.8, 0.2, 1)` — used for all brand-specific animations.

---

## 7. Grain Texture

Dark burgundy surfaces (masthead, membership card, dark callout sections) MUST include a grain texture overlay:

```css
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03–0.05;   /* 3% on global overlay, 5% inside dark cards */
  pointer-events: none;
  position: absolute;
  inset: 0;
}
```

Light cream surfaces: never add grain. Grain is reserved exclusively for dark surfaces to simulate matte paper stock. Adding grain to the cream background would muddy the clean editorial feel.

---

## 8. Shape Language

**Border radius is 0px everywhere except:**
- `border-radius: 9999px` — permitted ONLY for progress bar fills (internal fill element, not the rail) and circular tier badge backgrounds.
- No 2px micro-radius. The original DESIGN.md mentions it but no Stitch file actually implements it. Builder agents should default to 0px.

---

## 9. Layout & Grid

### 9.1 Mobile Phone Shell (Mockup Context)
```css
.phone-shell {
  width: 390px;
  background: var(--hd-cream);
  /* no border-radius on the phone shell itself */
}
.status-bar { height: 44px; background: #40061E; }
.scroll-area { height: calc(100dvh - 44px - 68px); max-height: calc(844px - 44px - 68px); }
.bottom-nav { height: 68px; }
```

### 9.2 Desktop Layout (Stitch full-width context)
- Max content width: `1440px`, centered.
- Horizontal margins: `48px` (desktop) / `32px` (tablet) / `20px` (mobile).
- Grid: 12-column, gap `24px`.
- Masthead/hero aspect ratio: `21/9`.
- Large product (featured): `md:col-span-7`.
- Small product column: `md:col-span-5`.

### 9.3 Bottom Navigation

5 items, equal columns, no active state background fill. Active state = burgundy top border (1.5px, scaleX from 0→1) + burgundy icon + burgundy label. Inactive = rgba(43,43,43,0.35).

```
Beranda | Menu | Pesanan | Hadiah | Akun
```

Nav background: `--hd-paper` (#FEF2E3). Never burgundy background for cream nav.

---

## 10. The Anti-Fore Checklist (What NEVER To Do)

This is the most important section. Violating these rules produces a coffee-app clone, not a luxury brand experience.

1. **No chip-style badges** — Do not use pill/chip-shaped tags (border-radius > 0, colourful background) for categories, flavour filters, or status indicators. Use hairline-bordered boxes with 0px radius, or plain text with eyebrow typography.

2. **No full-colour CTAs as selector states** — When a user selects an order mode (pickup/delivery/dine-in), do NOT fill the entire row/card with a colour. Use a 2px left border (gold for active) and italic title. The background stays neutral.

3. **No question-mark headers** — Never title a section "What's your order?" or "How would you like it?". Use editorial noun phrases: *Cara*, *The Shortlist*, *Of Note*.

4. **No icons inside transactional flows** — Product cards, order mode rows, form inputs: no icons. Luxury is typographic. The exception is the nav bar (SVG line icons only, no filled icons) and the cart bag icon in the header.

5. **No rounded corners** — 0px everywhere. Cards, buttons, inputs, progress rails, image containers. No exceptions in primary UI.

6. **No Material Symbols** — Do not use Material Symbols Outlined in new components. The Stitch files use them for reference but the mockups use custom SVG line icons. If an icon is needed, draw it as a simple SVG path with `stroke-width: 1.5`, `stroke-linecap: square`.

7. **No bright primary color outside CTAs** — `#650A30` burgundy is for CTA buttons and dark surface backgrounds. It should NOT be used as a text fill on body copy, as a border on every card, or as a background chip. The cream/off-white palette is the dominant colour.

8. **No drop shadows** — No `box-shadow` on cards, modals, or buttons. Depth is achieved through tonal layering (different surface container levels) and hairline borders.

9. **No centred display headlines** — All display-xl and headline text is left-aligned. Centred large text looks like a landing page, not an editorial.

10. **No generic loading spinners** — Use skeleton hairlines or simply let content appear with the stagger animation.

11. **No filled icons in the nav** — Nav icons are always thin SVG outlines (stroke-width 1.5, no fill). Never use filled icons for active state — use colour change only.

12. **No vertical gradient backgrounds on cream pages** — The page background is a flat `#FEF2E3`. No gradient washes. Gradients are only used inside the masthead (dark burgundy surface) as ambient radial glows.

13. **No bright orange/yellow/green accents** — Gold (`#B8922A`) is the only accent colour. Do not interpret "accent" as permission to use bright saturated tones.

14. **No full-bleed imagery without editorial framing** — Images always sit inside a defined container with a hairline border or are in a clearly defined aspect-ratio box. Never let a photo bleed edge-to-edge on a light page without a containing frame.

15. **No tapping/click animations with scale > 1.02** — The `active:scale-95` pattern (scale down slightly on tap) is permitted on buttons. Scale-up on tap is not the HD brand feel.

---

## 11. Grain Texture SVG Data URI

The inline SVG data URI for grain is identical across all Stitch screens:

```
url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")
```

For membership cards use slightly higher frequency: `baseFrequency='0.75' numOctaves='4'`.

---

## 12. CSS Variables (required in every mockup `:root`)

```css
:root {
  --hd-burgundy:       #650A30;
  --hd-burgundy-dark:  #40061E;
  --hd-burgundy-light: #801237;
  --hd-gold:           #B8922A;
  --hd-gold-light:     #F5E6C8;
  --hd-cream:          #FEF2E3;
  --hd-cream-deep:     #F5E6C8;
  --hd-paper:          #FEF2E3;
  --hd-ink:            #2B2B2B;
  --rule:              rgba(43,43,43,0.12);
  --rule-soft:         rgba(43,43,43,0.08);
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-sans:    'Jost', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
  --ease-ed: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

---

## 13. Quick Reference — Key Violations to Catch in PRs

| Violation | Correct |
|---|---|
| `border-radius: 8px` on a card | `border-radius: 0` |
| `class="rounded-lg"` | Remove or replace with `rounded-none` |
| `background: #C8102E` | Use `#650A30` |
| Gold used on a product card | Gold only in loyalty/rewards context |
| Centred H1 (`text-center`) | `text-left` always for display headlines |
| `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` | Remove; use tonal layering |
| `filter: none` on product image | `filter: grayscale(20%)` at rest |
| `transition: all 200ms` on product image scale | `transition: transform 700ms var(--ease-ed)` |
| Filled Material Symbol icon in nav | Custom SVG line icon |
| `font-size: 48px; text-align: center` for hero | `font-size: 72px+; text-align: left; font-style: italic` |
| `background: #fed264` (yellow) on a CTA | Only on loyalty progress bars |
| Missing grain on dark surface | Add grain-overlay absolute div |
