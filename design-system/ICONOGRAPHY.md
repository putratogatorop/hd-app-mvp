# Iconography — Häagen-Dazs Indonesia

## System

**Library — [lucide-react](https://lucide.dev).** Installed in the codebase as `lucide-react`. This is the **only** icon system in the product; there is no custom icon font and no SVG sprite.

- **Stroke width**: 1.5–2px (default is 2, we often drop to 1.75 on larger icons).
- **Style**: monoline, no fills, rounded caps & joins.
- **Grid**: 24×24 viewBox.
- **Color**: always inherits `currentColor`. Never hard-coded in the SVG.

## Sizes

| Usage | Size |
|---|---|
| Inline with body copy / eyebrow | `w-3.5 h-3.5` (14px) |
| Default inline | `w-4 h-4` (16px) |
| CTA trailing icon | `w-4 h-4` (16px) |
| Order-mode row, large list item | `w-5 h-5` (20px) |
| **Max** | 24px — anything bigger reads as illustration, not icon |

## The signature arrow

`ArrowUpRight` is the brand's navigation affordance. It means "more", "forward", "details", "go". It appears next to "All", "Rewards", row accessories, and nearly every link that leads to a deeper view.

- Hover behavior: `translate-x-0.5 -translate-y-0.5` — a tiny diagonal lift, as if the arrow is leaving the page.
- Color: matches accent. On burgundy headers → cream. On cream surfaces → burgundy or ink.

## Frequently used icons (from the codebase)

From `lucide-react`:
`ArrowUpRight`, `MapPin`, `ShoppingBag`, `Truck`, `UtensilsCrossed`, `Gift`, `Cake`, `QrCode`, `Plus`, `Minus`, `Search`, `Check`, `X`, `ChevronRight`, `ChevronDown`, `Star`, `User`, `Clock`, `Heart`.

## Color rules

- On **cream/paper** surfaces — icon uses `text-hd-ink/50` (muted) by default, `text-hd-burgundy` when the icon leads to an action.
- On **burgundy-dark** surfaces — icon is `text-hd-cream` at full opacity, or `text-hd-gold-light` for tier/loyalty accents.
- **Never** introduce a color not in the palette. Success ✓, error ✕, warning ⚠ all use burgundy or ink — not green/red/amber.

## Prototyping in HTML

If you're not using React, inline the SVG you want from lucide.dev with `stroke="currentColor"` and `stroke-width="1.75"`. Example pattern used across this system:

```html
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="1.75"
     stroke-linecap="round" stroke-linejoin="round">
  <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
</svg>
```

That's the `ArrowUpRight`. Treat every other icon the same way.

## Emoji

**Do not use emoji in copy, buttons, or marketing.** The only exception is a category fallback in `MenuItemCard` (🍨🍰🥤🧁) when an item has no image — and even then it renders grayscale at 70% opacity. Emoji never live in headlines, eyebrows, nav labels, or CTAs.

## Unicode as typography

The system uses a few typographic unicode characters as structural elements, not as icons:

- `·` (middle dot, U+00B7) — separator in eyebrows and meta lines: `MEMBER · GOLD`, `BY CHAT · ALWAYS`.
- `→` `↗` — only inside buttons with uppercase eyebrow styling: `SUBSCRIBE NOW →`, `APPLY ↗`.
- `—` (em-dash) — editorial flourish: `Ice Cream — perfected.`
- No decorative stars, no hearts, no ornaments.

## Logos

Stored in `assets/logos/`:
- `haagen-dazs-logo.png` — primary burgundy mark on transparent.
- `haagen-dazs-logo-transparent.png` — same with optimised transparency, used everywhere in the app (e.g. masthead).
- `haagen-dazs-logo-alt.png` — alternate lockup.

On dark surfaces the transparent logo is colour-filtered to cream using `filter: brightness(0) invert(1) sepia(0.4) saturate(0.3)` — this matches the `goldLight` cream tone and keeps the mark warm.
