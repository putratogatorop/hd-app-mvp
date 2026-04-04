# Analytics Dashboard Design Spec
**Häagen-Dazs Indonesia — COO Command Center**
Version: 1.0 | Date: 2026-04-05

---

## Overview

### Purpose

This dashboard gives the COO and senior management a single place to monitor the health of the business — revenue momentum, brand loyalty performance, store-level key account health, and marketing program returns — without needing to pull reports from multiple systems.

Every number on this dashboard is framed in business language. The goal is to support fast, confident decisions: which store needs attention, which marketing program is earning its budget, and where customer relationships are strengthening or at risk.

### Route & Access

- **Route:** `/dashboard`
- **Access:** Admin role only (enforced via Supabase Row Level Security + middleware route guard)
- **Entry point:** Accessible from the main navigation for users with `role = 'admin'`

### Technology

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Data fetching | Server Components + Next.js API Routes for aggregations |

### Branding

| Token | Hex | Usage |
|---|---|---|
| `hd-burgundy` | `#650A30` | Primary headings, KPI card borders, chart primary line |
| `hd-gold` | `#B8922A` | Accent highlights, positive delta indicators, tier badges |
| `hd-cream` | `#FEF2E3` | Page background, card backgrounds |
| White | `#FFFFFF` | Card surfaces |
| Charcoal | `#1A1A1A` | Body text |
| Success green | `#16A34A` | Positive trends |
| Alert red | `#DC2626` | Negative trends, churn warnings |

---

## Layout

### Global Controls — Sticky Top Bar

A full-width sticky bar pinned to the top of the viewport. Always visible while scrolling.

**Left side:**
- **Date range picker** — preset buttons: `7 Hari`, `30 Hari`, `90 Hari`, plus a `Custom` date range input.
- Default selection: `30 Hari`

**Right side:**
- **Store selector** — dropdown: `Semua Toko` (All Stores) or individual store names.
- When a single store is selected, all charts and KPIs filter to that store only.

> Implementation note: Store filter and date range are held in a shared Zustand store (`dashboard-context`) so all sections react simultaneously.

### Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Sticky Top Bar: Date Picker + Store Selector               │
├─────────────────────────────────────────────────────────────┤
│  KPI Strip (6 cards)                                        │
├─────────────────────────────────────────────────────────────┤
│  Section 1: Performa Pendapatan                             │
├─────────────────────────────────────────────────────────────┤
│  Section 2: Pelanggan & Brand Health                        │
├─────────────────────────────────────────────────────────────┤
│  Section 3: Performa Toko                                   │
├─────────────────────────────────────────────────────────────┤
│  Section 4: Marketing & Voucher ROI                         │
├─────────────────────────────────────────────────────────────┤
│  Section 5: Operasional                                     │
└─────────────────────────────────────────────────────────────┘
                                        ◉ AI Chat (floating)
```

### Responsive Grid

- **Mobile:** Single column. Sections are collapsible (tap header to expand/collapse).
- **Desktop (≥ 1024px):** Charts inside each section display in a 2-column grid where applicable. KPI strip is 6-across.
- **Collapsible sections:** Each section has a chevron toggle. State is persisted in `localStorage` so the COO's preferred expanded/collapsed layout is remembered between sessions.

### Floating AI Chat Button

- Fixed position, bottom-right corner (`bottom-6 right-6`).
- Circular button, `hd-burgundy` background, white chat icon.
- On click: opens a slide-up panel with a conversational AI assistant pre-seeded with the current dashboard data context.
- Example prompts pre-loaded: "Kenapa revenue minggu ini turun?", "Store mana yang butuh perhatian sekarang?", "Voucher apa yang paling efisien bulan ini?"

---

## KPI Strip

Six cards displayed as a horizontal strip (desktop) or 2×3 grid (mobile). Each card is identical in structure.

### Card Anatomy

```
┌──────────────────────────┐
│  Label (business name)   │
│  ─────────────────────── │
│  Current Value  ↑ +12%   │
│  vs. previous period     │
│  [sparkline ─────────╱]  │
└──────────────────────────┘
```

- **Current value:** Large, bold, `hd-burgundy`.
- **Delta badge:** Arrow + percentage vs. the previous equivalent period. Green for positive, red for negative.
- **Sparkline:** Small 20-point line chart showing trend over the selected date range. Uses Recharts `<Sparkline>`.
- **Card border:** 2px left border in `hd-gold`.

### The Six KPI Cards

| # | Label | Metric | Format |
|---|---|---|---|
| 1 | Total Pendapatan | Sum of completed order totals | `Rp 1.234.567` |
| 2 | Total Pesanan | Count of completed orders | `1.234` |
| 3 | Member Loyalty Aktif | Unique loyalty members who ordered at least once in period | `1.234` |
| 4 | Rata-Rata Nilai Pesanan (AOV) | Total revenue ÷ total orders | `Rp 123.456` |
| 5 | Tingkat Penukaran Voucher | (Vouchers redeemed ÷ vouchers issued) × 100 | `34,5%` |
| 6 | Konversi Referral Baru | New customers whose first order was referred | `123` |

---

## Dashboard Sections & Charts

Each section has:
- A bold section header with `hd-burgundy` text and a thin `hd-gold` bottom border.
- A one-sentence business summary ("What this section tells you").
- A chevron collapse toggle.

---

### Section 1: Performa Pendapatan

> **What this tells you:** Where revenue is coming from, which channels are growing, which stores are leading, and when customers buy.

---

#### Chart 1.1 — Tren Pendapatan per Saluran

**Business question:** Is revenue growing, and which order channel is driving it?

**Chart type:** Multi-line chart

**Axes:**
- X: Date (daily or weekly, depending on selected range)
- Y: Revenue in Rp

**Series:**
- `Pickup` — `hd-burgundy` line
- `Delivery` — `hd-gold` line
- `Dine-In` — muted grey line

**Interactions:**
- Hover tooltip showing Rp value per channel for that date.
- Click a series label to show/hide.

**Dummy data story:** Pickup is the dominant and growing channel. Delivery dips mid-week. Dine-In is flat.

---

#### Chart 1.2 — Pendapatan per Toko

**Business question:** Which store is contributing the most, and in what order?

**Chart type:** Horizontal bar chart, sorted descending by revenue.

**Axes:**
- Y: Store names
- X: Revenue in Rp

**Bar color:** `hd-burgundy` fill, `hd-gold` border on the top bar.

**Interactions:**
- Click a store bar to filter the entire dashboard to that store.

**Dummy data story:**
1. PIK Avenue — highest, growing
2. Grand Indonesia — second, but declining (bar marked with a red ↓ indicator)
3. Plaza Senayan — steady
4. Pakuwon Surabaya — lowest, but upward trend arrow

---

#### Chart 1.3 — Heatmap Waktu Pembelian

**Business question:** When are customers buying, and where are the dead zones we can activate?

**Chart type:** Heatmap grid

**Axes:**
- X: Day of week (Senin → Minggu)
- Y: Hour of day (08:00 → 22:00)

**Color scale:** White (zero orders) → light gold → `hd-gold` → `hd-burgundy` (peak orders). Color intensity encodes order volume.

**Annotations:**
- Peak cell labeled: e.g., "Puncak: Sabtu 14:00"
- Dead zone cells (Selasa & Rabu 13:00–16:00) labeled with a small "💡 Peluang Promo" tooltip on hover.

**Why this chart matters:** This is the single most operationally powerful chart on the dashboard. It tells the COO exactly which time windows are underutilized and where a targeted promotion — a flash voucher, a push notification — could move revenue with minimal cost.

**Dummy data story:** Saturday and Sunday afternoons are peak. Tuesday and Wednesday 13:00–16:00 show near-zero activity — the clear promo opportunity window.

---

### Section 2: Pelanggan & Brand Health

> **What this tells you:** The quality and loyalty depth of your customer base — which tier is driving value, who is drifting away, and whether your customers are buying on the strength of the brand or only when discounts push them.

---

#### Chart 2.1 — Kesehatan Segmen Pelanggan

**Business question:** Where does our revenue actually come from — loyal premium members or occasional buyers?

**Chart type:** Stacked bar chart (one bar per week or per selected period bucket)

**Segments (stacked):**
- Platinum tier — `hd-burgundy`
- Gold tier — `hd-gold`
- Silver tier — muted gold
- Non-member — light grey

**Y-axis:** Revenue in Rp.

**Dummy data story:** Gold tier generates 3× the revenue of Silver. Platinum is small but growing.

---

#### Chart 2.2 — Tingkat Churn per Tier

**Business question:** Which loyalty tier is at risk of going quiet?

**Chart type:** Multi-line chart

**Definition of churn rate shown:** % of members in each tier who had zero orders in the last 30 days.

**Series:** One line per tier (Platinum, Gold, Silver).

**Threshold line:** A dashed red horizontal line at 25% — the "attention threshold." Any tier line crossing above it should trigger a retention campaign.

**Dummy data story:** Silver churn is trending upward, crossing 30%. Gold is stable at ~15%. This signals Silver members need a re-engagement nudge.

---

#### Chart 2.3 — Pembeli Premium vs Pemburu Diskon

**Business question:** Are customers choosing us for the brand, or only when there's a voucher?

**Chart type:** Donut chart

**Segments:**
- Full-price orders (no voucher used) — `hd-burgundy`
- Voucher-assisted orders — `hd-gold`

**Center label:** The full-price percentage. Target: >60% full-price.

**Dummy data story:** 68% full-price, 32% voucher-assisted. Healthy brand pull, but the FREEONGKIR voucher is responsible for most of the 32%.

---

#### Chart 2.4 — Nilai Pelanggan Seumur Hidup per Saluran Akuisisi

**Business question:** Which customer acquisition channel brings us the most valuable long-term customers?

**Chart type:** Horizontal bar chart

**Y-axis:** Acquisition channel (Referral, Promo Campaign, Organic Search, Walk-In)
**X-axis:** Average Customer Lifetime Value (LTV) in Rp

**Bar colors:** Referral bar highlighted in `hd-gold`. Others in `hd-burgundy` variants.

**Dummy data story:** Referral customers have 2× LTV compared to promo-acquired customers. Organic and walk-in fall in between. This chart makes the case for investing in the referral program.

---

### Section 3: Performa Toko

> **What this tells you:** Each store treated as a key account — how it is performing against the others, and whether it is growing or needs intervention.

---

#### Chart 3.1 — Scorecard Performa Toko

**Business question:** At a glance, which stores are healthy and which need a conversation?

**Chart type:** Data table with inline trend indicators.

**Columns:**

| Toko | Pendapatan | Pesanan | AOV | Pertumbuhan (MoM) | Tren Traffic |
|---|---|---|---|---|---|
| PIK Avenue | Rp X | N | Rp X | +18% ↑ | Sparkline |
| Grand Indonesia | Rp X | N | Rp X | -8% ↓ | Sparkline |
| Plaza Senayan | Rp X | N | Rp X | +2% → | Sparkline |
| Pakuwon Surabaya | Rp X | N | Rp X | +31% ↑ | Sparkline |

**Row highlighting:**
- Green left border: MoM growth > +10%
- Red left border: MoM growth < -5%
- Amber left border: -5% to +10%

**Sortable columns:** Revenue, Orders, AOV, Growth (click header to sort).

**Dummy data story:** PIK Avenue is the star. Grand Indonesia's high AOV but declining traffic is a flag — the store has premium positioning but is losing footfall, possibly an operations or awareness issue.

---

#### Chart 3.2 — Perbandingan Toko

**Business question:** How do stores compare across key performance dimensions side by side?

**Chart type:** Grouped bar chart

**X-axis:** Store names
**Groups per store:** Revenue, Orders, AOV (each as a separate bar in the group)
**Colors:** Revenue = `hd-burgundy`, Orders = `hd-gold`, AOV = muted teal

**Interactions:** Toggle which metrics to show via checkboxes above the chart.

---

### Section 4: Marketing & Voucher ROI

> **What this tells you:** Whether the marketing budget is earning its keep — which voucher programs are profitable, how the referral engine is performing, and which customers are being acquired efficiently.

---

#### Chart 4.1 — Tabel Performa Voucher

**Business question:** Which voucher codes are worth keeping, and which are giving discounts without driving incremental orders?

**Chart type:** Sortable data table.

**Columns:**

| Kode Voucher | Jenis | Diterbitkan | Ditukar | Tingkat Penukaran | Est. ROI |
|---|---|---|---|---|---|
| FREEONGKIR | Free shipping | 2.000 | 1.340 | 67% | 4,2× |
| GOLDWELCOME | New member | 500 | 312 | 62% | 3,1× |
| FLASH20 | 20% discount | 1.000 | 180 | 18% | 0,9× |

**ROI definition shown:** (Revenue from orders using voucher − voucher cost) ÷ voucher cost. ROI < 1× highlighted in red.

**Dummy data story:** FREEONGKIR is the clear winner — high redemption, positive ROI because it drives order completion without deep discounting. FLASH20 has negative ROI; it is subsidizing customers who would have ordered anyway.

---

#### Chart 4.2 — Corong Referral

**Business question:** Where does the referral program leak, and how efficient is the pipeline from share to loyal customer?

**Chart type:** Horizontal funnel chart (left to right).

**Stages:**
1. Tautan Referral Dibagikan
2. Pendaftaran via Referral
3. Pesanan Pertama Selesai
4. Pesanan Kedua (Repeat)

**Each stage shows:** Count + conversion rate to next stage (e.g., "62% lanjut ke tahap berikutnya").

**Color:** Funnel narrows left to right. Fill color graduates from `hd-gold` (top) to `hd-burgundy` (bottom stage).

**Dummy data story:** Sign-up conversion is strong (78%), but first-to-repeat drop-off is the biggest leak (only 51% return for a second order). This points to a welcome/onboarding experience gap.

---

#### Chart 4.3 — Efektivitas Program Referral

**Business question:** Are referred customers meaningfully more valuable than customers we acquired through promotions?

**Chart type:** Side-by-side bar chart (2 bars per metric).

**Metrics compared:**
- Average LTV
- Average Order Frequency (orders/month)
- Average AOV

**Groups:** Referred vs. Non-Referred.

**Dummy data story:** Referred customers show 2× LTV, 1.4× order frequency, and 1.2× higher AOV. The referral program is the most efficient acquisition channel the brand operates.

---

### Section 5: Operasional

> **What this tells you:** The rhythm of the business at the operational level — when the kitchen is busy, how efficiently orders move from placement to completion, and whether loyalty points are circulating as intended.

---

#### Chart 5.1 — Pesanan per Jam

**Business question:** When does demand peak, and are we staffed accordingly?

**Chart type:** Grouped bar chart.

**X-axis:** Hour of day (08:00–22:00)
**Bars per hour:** Pickup, Delivery, Dine-In (same color coding as Section 1).

**Reference line:** Average orders per hour shown as a dashed horizontal line.

**Dummy data story:** Twin peaks at 12:00–13:00 (lunch) and 15:00–17:00 (afternoon). Tuesday/Wednesday afternoons are the visible troughs.

---

#### Chart 5.2 — Corong Pemenuhan Pesanan

**Business question:** How efficiently do orders flow through the system from placement to completion, and where do they stall?

**Chart type:** Vertical funnel chart (top to bottom).

**Stages:**
1. Pesanan Masuk (Placed)
2. Dikonfirmasi (Confirmed)
3. Sedang Disiapkan (In Preparation)
4. Selesai (Completed)

**Each stage shows:** Count + drop-off % to next stage.

**Color:** Stages colored in `hd-burgundy` gradient, darkening toward completion.

**Dummy data story:** The Confirmed → Prepared step shows a 12% drop — meaning some confirmed orders are being abandoned before preparation starts. Flag for operations to investigate.

---

#### Chart 5.3 — Poin Loyalty: Diperoleh vs Ditukar

**Business question:** Is the loyalty economy healthy — are members earning points and actually using them, or are points sitting idle?

**Chart type:** Grouped bar chart, weekly buckets.

**Groups per week:**
- Points Earned — `hd-gold`
- Points Redeemed — `hd-burgundy`

**KPI beneath chart:** Redemption ratio (Redeemed ÷ Earned). Target: >40%.

**Dummy data story:** Points earned is growing week-over-week. Redemption rate is at 38%, just below target, suggesting members are accumulating but not yet confident in the redemption mechanic. An in-app nudge ("You have X points expiring soon") could close this gap.

---

## Data Source & Architecture

### Source of Truth

All dashboard data reads from the existing Supabase PostgreSQL database. No separate analytics database is required for MVP.

### Key Tables Used

| Table | Used For |
|---|---|
| `orders` | Revenue, order counts, AOV, hourly/daily trends, fulfillment funnel |
| `order_items` | Revenue by product, channel breakdown |
| `profiles` | Loyalty member counts, tier segmentation, churn detection |
| `vouchers` + `voucher_redemptions` | Voucher performance, ROI |
| `referrals` | Referral funnel, referred vs. non-referred LTV |
| `loyalty_points` | Points earned vs. redeemed |
| `stores` | Store-level filtering and comparison |

### Data Access Pattern

- **KPI cards:** Server Components with direct Supabase queries. Cached with `next: { revalidate: 300 }` (5-minute refresh).
- **Charts:** API routes at `/api/dashboard/*` returning pre-aggregated JSON. Aggregation done server-side in PostgreSQL via `GROUP BY`, window functions, and date bucketing.
- **Heatmap:** Pre-aggregated on server: `SELECT EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at), COUNT(*) FROM orders GROUP BY 1, 2`.
- **Store filter + date range:** Passed as query params to all API routes. Zustand `dashboard-context` store holds state and triggers SWR refetch on change.

### MVP Performance Targets

- KPI strip initial load: < 1 second
- Chart section load (per section): < 2 seconds
- Full page load: < 4 seconds on a 4G connection

---

## Dummy Data Strategy

Seed data must tell a coherent business story — not random numbers. The narrative below is the intended story that the COO should be able to read off the dashboard without any explanation.

### Store Narratives

| Store | Story | Key Signal |
|---|---|---|
| PIK Avenue | Best performer, actively growing | Revenue rank #1, MoM +18%, sparkline trending up |
| Grand Indonesia | Premium positioning, high AOV, but footfall declining | Revenue rank #2, MoM -8%, AOV is highest of all stores |
| Plaza Senayan | Steady, reliable, no drama | Revenue rank #3, MoM +2%, flat sparkline |
| Pakuwon Surabaya | New store, ramping up fast | Revenue rank #4 but highest growth rate, MoM +31% |

### Customer & Loyalty Narratives

- Gold tier members generate **3× the revenue** of Silver tier members.
- Platinum tier is small (top 5% of members) but contributes 20% of total revenue.
- Silver tier churn rate is rising — needs a re-engagement campaign.
- Referred customers have **2× the lifetime value** of promo-acquired customers.

### Marketing Narratives

- `FREEONGKIR` voucher: 67% redemption rate, 4.2× ROI. Best-performing campaign.
- `FLASH20` (20% discount): 18% redemption rate, 0.9× ROI. Subsidizing existing buyers, not driving incremental orders.
- Referral program: Strong sign-up conversion, but first-to-repeat falloff is the biggest opportunity.

### Operational Narratives

- Peak ordering windows: Saturday and Sunday 14:00–17:00.
- Dead zones: Tuesday and Wednesday 13:00–16:00 (near-zero orders). These are the clearest promo activation opportunities.
- Loyalty points redemption rate: 38% — just below the 40% target.

---

## Component Inventory

| Component | Path | Notes |
|---|---|---|
| `DashboardTopBar` | `src/components/dashboard/DashboardTopBar.tsx` | Date picker + store selector, sticky |
| `KPICard` | `src/components/dashboard/KPICard.tsx` | Reusable, accepts label/value/delta/sparkline data |
| `KPIStrip` | `src/components/dashboard/KPIStrip.tsx` | 6-across grid wrapper |
| `DashboardSection` | `src/components/dashboard/DashboardSection.tsx` | Collapsible section wrapper |
| `RevenueOverTimeChart` | `src/components/dashboard/charts/RevenueOverTimeChart.tsx` | Recharts LineChart |
| `RevenueByStoreChart` | `src/components/dashboard/charts/RevenueByStoreChart.tsx` | Recharts BarChart horizontal |
| `OrderHeatmap` | `src/components/dashboard/charts/OrderHeatmap.tsx` | Custom SVG grid or Recharts ScatterChart |
| `CustomerSegmentChart` | `src/components/dashboard/charts/CustomerSegmentChart.tsx` | Recharts StackedBarChart |
| `ChurnChart` | `src/components/dashboard/charts/ChurnChart.tsx` | Recharts LineChart with threshold line |
| `PremiumVsDiscountChart` | `src/components/dashboard/charts/PremiumVsDiscountChart.tsx` | Recharts PieChart (donut) |
| `LTVByChannelChart` | `src/components/dashboard/charts/LTVByChannelChart.tsx` | Recharts BarChart horizontal |
| `StoreScorecardTable` | `src/components/dashboard/StoreScorecardTable.tsx` | Sortable table with inline sparklines |
| `StoreComparisonChart` | `src/components/dashboard/charts/StoreComparisonChart.tsx` | Recharts grouped BarChart |
| `VoucherPerformanceTable` | `src/components/dashboard/VoucherPerformanceTable.tsx` | Sortable table with ROI highlight |
| `ReferralFunnelChart` | `src/components/dashboard/charts/ReferralFunnelChart.tsx` | Custom horizontal funnel |
| `ReferralEffectivenessChart` | `src/components/dashboard/charts/ReferralEffectivenessChart.tsx` | Recharts grouped BarChart |
| `OrdersByHourChart` | `src/components/dashboard/charts/OrdersByHourChart.tsx` | Recharts grouped BarChart |
| `FulfillmentFunnelChart` | `src/components/dashboard/charts/FulfillmentFunnelChart.tsx` | Custom vertical funnel |
| `LoyaltyPointsChart` | `src/components/dashboard/charts/LoyaltyPointsChart.tsx` | Recharts grouped BarChart |
| `AIChatButton` | `src/components/dashboard/AIChatButton.tsx` | Floating button + slide-up panel |

---

## Open Questions / Decisions for Review

1. **AI Chat:** Should the floating AI Chat call an internal API route (wrapping Claude) or link out to an external tool? For MVP, a static FAQ-style response engine may be sufficient.
2. **Export:** COO may need to export charts as PNG or data as Excel. Scope for v1.1.
3. **Alert system:** Should the dashboard send a WhatsApp or email alert when Silver churn exceeds the 25% threshold? Out of scope for MVP, but the threshold line is already a placeholder for this.
4. **Real-time vs. cached:** 5-minute cache is proposed for MVP. If the COO wants to use this during live events (e.g., a weekend campaign launch), consider 30-second revalidation for the KPI strip only.
5. **Mobile optimization of heatmap:** The heatmap is dense. On mobile, consider replacing it with a simplified "Top 3 Peak Times" card for smaller screens, with the full heatmap available on tap.
