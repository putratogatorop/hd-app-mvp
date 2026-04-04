# Promo Popup & Voucher Page Redesign — Design Spec

> Date: 2026-04-04
> Scope: Home page promo popup + Voucher page full redesign
> Reference mockups: `.superpowers/brainstorm/2050-1775310973/content/`

---

## Feature 1: Promo Popup

### Behavior
- Full-screen modal overlay on `/home`
- Appears **once per session** (tracked via `sessionStorage`)
- Dark backdrop with `backdrop-filter: blur(4px)`
- Dismissible via X close button (white circle, top-right, floating above image)
- Tapping outside the popup also dismisses it

### Content
- **Image-based**: The popup displays a single promotional image (e.g., Häagen-Dazs campaign creative)
- Image is stored at `/public/promo/popup-banner.jpg` — swappable without code changes
- Image rendered in a rounded card (`border-radius: 20px`) with drop shadow
- Below the image: "Pesan Sekarang →" CTA button (white bg, burgundy text, full-width, rounded)
- CTA links to `/menu` (or configurable route)

### Implementation
- New component: `src/components/PromoPopup.tsx`
- Rendered inside `HomeClient.tsx`
- On mount: check `sessionStorage.getItem('hd-promo-seen')`
  - If not set → show popup, set `sessionStorage.setItem('hd-promo-seen', 'true')`
  - If set → don't show
- Image: `<Image src="/promo/popup-banner.jpg" />`
- Place the promo image file in `public/promo/popup-banner.jpg`

---

## Feature 2: Voucher Page Redesign

### Route
- `/voucher` (existing)

### Header
- Clean white header: "Voucher" centered, no colored background

### Promo Code Input Bar
- Sits below header
- Gray rounded bar with burgundy icon on left
- Placeholder: "Punya kode promo? Masukkan disini"
- "Gunakan" submit button (burgundy) on right
- On submit: validate code against vouchers table, apply if found, redirect to `/menu`

### Main Tabs (3 tabs)
- `Voucher` | `MyHD Plan` | `HD Rewards`
- Style: text tabs with underline indicator (not pill tabs)
- Active tab: burgundy text + burgundy underline bar
- Inactive tab: gray text

---

### Tab 1: Voucher

#### Pill Filters
- Horizontal scrollable pills below tabs
- Filters: `Semua` | `Diskon` | `Cashback` | `Delivery`
- Active pill: burgundy filled, white text
- Inactive pill: white bg, gray border, gray text
- Filter logic:
  - Semua: show all vouchers
  - Diskon: `discount_type === 'percentage'`
  - Cashback: `discount_type === 'fixed'` (fixed-amount discounts displayed as "cashback" in UI — no actual cashback mechanism)
  - Delivery: `applicable_modes` includes `'delivery'`

#### Voucher Sections
- Group vouchers by type with section headers
- **"Voucher Belanja"** — vouchers with `applicable_modes` including pickup/dinein
- **"Voucher Delivery"** — vouchers where `applicable_modes` is delivery-only
- Each section header: bold title left, "X voucher" count right

#### Info Banner
- Between sections (before Voucher Delivery)
- Light blue rounded card with ℹ️ icon
- Text: "Voucher delivery hanya bisa kamu gunakan pada halaman checkout"

#### Voucher Card Design
- White card with subtle border, rounded corners (16px)
- **Left badge area** (72px wide):
  - Colored background: red for percentage, green for fixed/delivery, gold for tier
  - Large discount value (e.g., "25%", "10K")
  - Small label below ("Diskon" or "Potongan")
  - Dashed border on the right side (ticket-tear effect)
- **Center info area**:
  - Context label at top: "Pakai di App" (red) or "Delivery GoSend" (green)
  - Bold voucher title
  - Description text (gray, smaller)
  - Meta row: "Berlaku Hingga" + date | "Min Transaksi" + amount
  - Optional: mode pills (Pick Up / Delivery / Dine-in) for multi-mode vouchers
- **Right action area**:
  - "Pakai" button (burgundy for discount, green for delivery)
  - "Terpakai" disabled state for used vouchers

---

### Tab 2: MyHD Plan

#### Hero Card
- Burgundy gradient card with gold accents (radial gradient overlays)
- Gold eyebrow text: "✨ HÄAGEN-DAZS EXCLUSIVE"
- Headline: "Hematnya Bikin Untung!" with italic gold emphasis
- Subtitle: "Diskon spesial setiap hari tanpa batas"

#### Plan Cards (3 tiers)
- Silver Plan — Rp29K/bulan — 10% off, All menu
- Gold Plan — Rp49K/bulan — 20% off, Free ongkir (tagged "POPULER", featured border)
- Platinum Plan — Rp79K/bulan — 25% off, Free ongkir, Gift bulanan
- Each card: tier icon (emoji) left, name + perk pills center, price right
- Featured card: red border, light red background, "POPULER" tag top-right

#### CTA
- "Langganan Sekarang!" full-width burgundy button
- Subtitle: "Berlaku untuk pickup, delivery & dine-in"

#### Note
- MyHD Plan is **UI-only for MVP** — no actual subscription backend
- Tapping CTA can show a toast: "Segera hadir!" or link to WhatsApp

---

### Tab 3: HD Rewards

#### Tier Progress Card
- Gold gradient card (replacing current multi-color tier cards)
- Shows: current tier label, tier name with emoji, total points (large)
- Points box with semi-transparent background
- Progress bar: current points toward next tier
- Hint text: "X poin lagi ke [Next Tier]"

#### Tukar Poin Section
- Section title: "Tukar Poin"
- List of redeemable rewards, each card:
  - Reward icon (emoji in colored circle)
  - Reward name + point cost
  - "Tukar" button (gray, right-aligned)
- Rewards list (hardcoded for MVP):
  - Voucher Diskon 10% — 500 poin
  - Free 1 Scoop Ice Cream — 1,000 poin
  - HD Gift Box Special — 2,500 poin
  - Voucher Free Delivery — 300 poin

#### Note
- Reward redemption is **UI-only for MVP**
- Tapping "Tukar" can deduct points and generate a voucher in the future

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/PromoPopup.tsx` | Create — popup component |
| `public/promo/popup-banner.jpg` | Create — promo image |
| `src/app/(app)/home/HomeClient.tsx` | Modify — add PromoPopup |
| `src/app/(app)/voucher/VoucherClient.tsx` | Rewrite — full redesign |
| `src/app/(app)/voucher/page.tsx` | Minor updates if needed |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Badge red bg | `#FFF5F5` → `#FFF0F0` | Discount voucher badge |
| Badge green bg | `#F0FFF4` → `#ECFDF5` | Delivery voucher badge |
| Badge gold bg | `#FFFBEB` → `#FEF3C7` | Tier voucher badge |
| Context label red | `#C8102E` | "Pakai di App" |
| Context label green | `#059669` | "Delivery GoSend" |
| Tab underline | `#C8102E`, 2.5px | Active tab indicator |
| Pill active | `#C8102E` bg, white text | Active filter pill |
