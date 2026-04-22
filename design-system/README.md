# Häagen-Dazs Indonesia — Design System

A complete brand + UI design system derived from the Häagen-Dazs Indonesia customer PWA (mobile loyalty + ordering). The system is **editorial**, **wine-and-paper**, and **bilingual** (Indonesian / English), with an aesthetic closer to a printed menu at a fine patisserie than a typical food-delivery app.

## Sources

- **Codebase**: [github.com/putratogatorop/hd-app-mvp](https://github.com/putratogatorop/hd-app-mvp) — Next.js 14 + Tailwind + Supabase PWA. All tokens, components and screens were lifted from this repo.
- **Live site**: [haagendazs.co.id](https://www.haagendazs.co.id/) — the palette baseline was extracted from the live website on 2026-04-04.
- **Key source files** referenced:
  - `tailwind.config.ts` — colors, fonts, shadows, animations
  - `src/app/globals.css` — grain, paper texture, eyebrow, numeral, stagger
  - `src/components/ui/*` — Button, Card, Eyebrow, SectionHeader, Rule, Numeral
  - `src/app/(app)/home/HomeClient.tsx` — hero, order modes, member strip, shortlist
  - `src/app/(app)/menu/MenuClient.tsx` — sticky masthead, search, category nav, grid
  - `src/app/(app)/voucher/VoucherClient.tsx` — tabs, plan cards, reward rows
  - `src/app/(auth)/login/page.tsx` — split-pane burgundy masthead + form
  - `src/components/BottomNav.tsx` — 5-tab Indonesian nav
  - `CLAUDE.md` — branding rules (never bright-red, always wine burgundy)

## Product context

**Company.** Häagen-Dazs Indonesia — the Indonesian market of the premium ice-cream brand (est. 1960, tagline "A small luxury, measured in spoonfuls"). The local operation runs stores, cafés and delivery across Jakarta and other Indonesian cities.

**Digital product.** A progressive web app (`hd-app-mvp`) acting as a **customer-facing ordering + loyalty super-app**:

- **Customer app** — home feed, menu browse, cart & checkout, orders, vouchers & rewards (MyHD Plan subscription, tier points), account, QR dine-in scanner, gifting. Bilingual ID/EN copy.
- **Staff POS** — order queue, menu management, dashboard (referenced under `src/app/(pos)/`).
- **Admin analytics dashboard** — campaigns, RFM segments, transactional + gift analytics (referenced under `src/app/(dashboard)/analytics/`).

This design system focuses on the **customer mobile app** surface because that is the "most important thing" per the user's brief and is the most developed codebase surface.

## Tier 0 — brand one-liner

> **A small luxury, measured in spoonfuls.**
> *Ice Cream, perfected.*

The brand tone is restrained, elegant, and unhurried. Never loud, never discount-shouty. It reads like newspaper editorial of a menu at a wine bar, not a food-delivery app.

## Content fundamentals

### Voice & tone

- **Editorial, understated, sensory.** Sentences feel clipped and declarative: "Sealed, with a note." / "Brought to the door." / "At table, unhurried."
- **Never exclamatory.** No "Great!", no "Awesome!", no trailing "!". Periods are preferred. En-dashes and em-dashes are used freely: "A standing indulgence." / "For the occasion."
- **Personal but formal.** "Welcome back." / "You are at the summit." — second-person singular, polite. Avoids "Hey!" or "Hi there!".
- **Bilingual fluency.** Indonesian greetings coexist with English editorial headlines. The app greets you in ID ("Selamat pagi, Putra") then titles sections in EN ("The Shortlist", "Rewards, unclaimed").
- **Price-aware but not discount-driven.** Vouchers are called "**The Dividend**" or "rewards, unclaimed" — not "Save 20%!".

### Casing & punctuation

- **Headlines** — sentence case with an *italic flourish*: `Ice Cream, <i>perfected.</i>` / `The <i>Dividend</i>` / `Rewards, <i>unclaimed</i>`.
- **Eyebrow labels** — UPPERCASE, tracking 0.22em, ~0.6875rem: `MEMBER · SILVER`, `SCROLL TO BEGIN`, `FOR THE COUNTER`.
- **Button copy** — UPPERCASE, small, tracked: `APPLY`, `ENTER`, `ADD`, `SUBSCRIBE NOW →`.
- **Section numerals** — mono, padded: `01`, `02`, `03` — or Roman numerals for prestige items: `I`, `II`, `III`.
- **Dateline** — UPPERCASE mono: `22 APR 2026`.
- **Numbers** — always mono (`numeral` utility) with tabular figures: `1,250` points, `Rp 49K`.

### Vocabulary

| prefer | avoid |
|---|---|
| "The Selection" | "Menu" (for titles — we use "Menu" in nav) |
| "Shop" / "Counter" | "Store" |
| "Collected at the counter" | "Pick up in-store" |
| "Brought to the door" | "Delivered to you" |
| "At table, unhurried" | "Dine in" |
| "A small luxury" | "Premium" |
| "The Dividend" | "Promos" |
| "Rewards, unclaimed" | "X offers available" |
| "Members receive… without ceremony" | "Members get special perks" |
| "you are at the summit" | "you're Platinum!" |
| "Sealed, with a note" | "Gift it now" |
| "Scroll to begin" | "Swipe down" |

### Bilingual specifics (ID ↔ EN)

- **Bottom nav labels are always Indonesian**: *Beranda · Menu · Pesanan · Hadiah · Akun*.
- **Greeting is Indonesian, time-aware**: *Selamat pagi / siang / sore / malam, Putra*.
- **Page titles and editorial copy are English**: *The Menu*, *The Dividend*, *Welcome back.*
- **Currency is Rupiah**, formatted `Rp 49.000` or shortened `Rp 49K`.
- **Dates** use `DD MMM YYYY` UPPERCASE: `22 APR 2026`.

### Emoji

**Do not use emoji in brand UI.** `MenuItemCard` uses `🍨🍰🥤🧁` **only** as category placeholders when an image is missing, rendered *grayscale at 70% opacity*. Emoji never appear in copy, never in buttons, never in marketing. Icons come from **lucide-react** (stroke 1.5–2px, thin, monoline).

## Visual foundations

### Colors

**Primary · Burgundy.** The brand is built on deep wine, NOT bright red. Tailwind's `red-*` is explicitly forbidden.

- `#650A30` **burgundy** — primary brand. Buttons, active state, links, the rule below eyebrow labels.
- `#40061E` **burgundy-dark** — mastheads, hero sections, dark footers. The luxury-envelope color.
- `#801237` **burgundy-light** — hover, gradient mid-tones.

**Accent · Gold.** Reserved for loyalty, tiers, special moments.

- `#B8922A` **gold** — tier accents, active icons, stars.
- `#F5E6C8` **gold-light** — tier badges, eyebrows on dark hero copy.

**Neutrals · Cream + Ink.**

- `#FEF2E3` **cream** — page background everywhere.
- `#F4E3CA` **cream-deep** — tile backgrounds, image placeholders.
- `#FBF6EC` **paper** — card backgrounds, elevated surfaces.
- `#1A1414` **ink** — body text (warm near-black, not pure `#000`).
- `#2B2B2B` **dark** — alt charcoal for heavy body text.

**Rule.** Never introduce a new accent color — if you need "green for success" or "red for error", use **burgundy** with a thin rule and italic copy. The whole design works in two voices: cream+ink and burgundy+gold.

### Typography

Three typefaces, one role each — all available on Google Fonts.

The official Häagen-Dazs "Dazs" serif is a proprietary custom typeface (General Mills + Chase Design Group) — not publicly licensed. The three below are free Google Fonts selected to carry the same tonal palette: high-contrast European serif for display, clean geometric sans for body, monospace for numerals.

- **Display — Cormorant Garamond** (400/500/600/700 + italics). Every headline, price label, sectional title. Italics are a signature brand gesture (`<i>perfected.</i>`). Pairs the high-contrast, slightly condensed silhouette of the Dazs wordmark.
- **Sans — Jost** (300–700 + italics). Body copy, buttons, eyebrow labels, form inputs, tab labels. Geometric humanist — warm, upscale, neutral.
- **Mono — JetBrains Mono** (400–700). All numerals (prices, points, dates, section counters). Tabular figures via `font-feature-settings: "tnum"`.

**Scale.** Type is driven by `clamp()` — headlines scale with viewport. The home hero uses `display-xl` (~6.5rem at cap). Screen H1s use `display-lg`, section H2s use `display-md` (1.5rem inline variant for mobile).

**Signature tricks.**
- *italic flourish* inside headlines: `Ice Cream, <i>perfected.</i>`
- **eyebrow + rule + numeral** triple: `01 ─── THE SELECTION`
- **oversized numeral** as section opener: `00 vouchers await collection.`

### Spacing & layout

- **4px grid.** Nothing smaller. Most spacing is 16/20/24/32/48.
- **Mobile-first.** The whole customer surface lives inside `max-w-lg` (~512px). The bottom nav is fixed at `max-w-lg` centered.
- **Generous vertical breathing room** — sections use `pt-12` (48px) between them.
- **Safe area** — `env(safe-area-inset-bottom, 16px)` on fixed bottom elements.

### Borders, rules, radii

- **Hairline rules everywhere.** `border-hd-ink/10`, `/15`, `/25` are the dividers of choice. Bottom-borders of inputs replace box borders.
- **Radii are reserved.** The brand is emphatically **sharp-cornered**. No `rounded-lg`, no `rounded-2xl`. The only curves in the system are:
  - Badge counters (cart count) — `rounded-full` pill.
  - Progress bars — `h-[2px]` flat line, no rounding.
  - Cards — **completely square**.
- **Rule as structure.** Sections open with a horizontal rule + numeral + eyebrow + h2 triple. Below-input underline replaces bordered inputs.

### Shadows & elevation

Three named shadows — used sparingly:
- `shadow-paper` — `0 1px 2px ink/6%, 0 12px 32px -16px ink/18%` — default card lift.
- `shadow-editorial` — `0 1px 0 ink/8%, 0 24px 48px -24px burgundy/25%` — special hero card lift.
- `shadow-inset-rule` — `inset 0 -1px 0 ink/12%` — sticky header separator.

Almost every surface is flat-on-flat, separated by **rules, not shadows**.

### Backgrounds

- **Light surfaces**: cream page + paper cards. Subtle dotted texture (`texture-paper`) lives on some long-scroll pages.
- **Dark surfaces**: burgundy-dark masthead with grain texture (`texture-grain` — fractalNoise SVG at 0.35 opacity, multiply blend) + radial-gradient spotlight in gold/burgundy-light.
- **Never** gradient buttons or gradient UI panels. Gradients are reserved for atmospheric dark masthead glow.

### Motion

- **Easing**: `cubic-bezier(0.2, 0.8, 0.2, 1)` — the editorial ease. `cubic-bezier(0.76, 0, 0.24, 1)` for curtain reveals.
- **Durations**: 250ms fast, 500ms base, 900ms slow reveals.
- **Stagger reveal on load** — `stagger > *` with incremental delays 0.05s step.
- **Hover on icons** — `translate-x-0.5 -translate-y-0.5` diagonal drift (like an arrow lifting off the page).
- **Hover on buttons** — background darkens (`burgundy-dark`), never brightens.
- **Press** — `active:translate-y-[1px]`. 1px depress, no shrink, no scale.
- **No bounces, no spring physics, no confetti.** The motion is restrained and cinematic.

### Transparency & blur

- **Sticky headers** use `bg-hd-cream/95 backdrop-blur-md` — near-opaque cream with a light blur behind.
- **Bottom nav** uses the same recipe.
- **No frosted-glass panels** anywhere else; no heavy blur.
- Imagery is *warm*, unsaturated — tones that sit next to cream without clashing. No b&w, no grain on photos.

### Iconography

See [ICONOGRAPHY.md](./ICONOGRAPHY.md) for full detail. Summary:

- **Library**: [lucide-react](https://lucide.dev) (installed in the codebase). Stroke width ~1.5–2px, monoline, no fills.
- **Sizes**: almost always `w-4 h-4` or `w-3.5 h-3.5` inline; `w-5 h-5` for CTAs. Never larger than 24px.
- **Color**: icon color matches surrounding text (`text-hd-burgundy` on accent, `text-hd-ink/50` on body).
- **Signature arrow**: `ArrowUpRight` is the brand's navigation affordance — it links forward, "more", "details", "rewards".
- **No emoji in copy.** Category emojis in `MenuItemCard` are fallbacks only and rendered grayscale.

## File index

```
/
├── README.md                  ← this file
├── ICONOGRAPHY.md             ← iconography principles + usage
├── SKILL.md                   ← agent-skill bootstrap
├── colors_and_type.css        ← full design-token stylesheet (copy into any project)
│
├── assets/
│   ├── logos/                 ← haagen-dazs-logo.png + transparent variants
│   ├── icons/                 ← app-icon PWA PNGs
│   └── imagery/               ← menu photos + promo banners
│
├── preview/                   ← design-system-tab cards (do not ship)
│   ├── colors-*.html
│   ├── type-*.html
│   ├── spacing-*.html
│   ├── components-*.html
│   └── brand-*.html
│
└── ui_kits/
    └── customer_app/          ← mobile-app UI kit (main deliverable)
        ├── README.md
        ├── index.html         ← interactive clickable prototype
        └── *.jsx              ← reusable JSX components
```

## Quick start

1. **Copy `colors_and_type.css` into your project**, import once at the app root.
2. **Load the three Google Fonts** — they're imported at the top of that file.
3. **Copy `assets/logos/haagen-dazs-logo-transparent.png`** for any dark-surface logo placement.
4. **Icons**: `npm i lucide-react` (or load from CDN in prototypes: `https://esm.sh/lucide-react@0.417.0`).
5. **Follow the voice** — when in doubt, write it as if it were set in a printed menu at a wine bar.

## Caveats

See the end of the chat for open questions + asks for the user.
