# HD Insights Chat — Design Specification

**Date:** 2026-04-05
**Author:** Product Team
**Status:** Draft

---

## Overview

**Component:** Floating chat panel embedded in the Häagen-Dazs Indonesia analytics dashboard.

**What it is NOT:** This is not a real AI or LLM-powered system. It is a rules-based chatbot that uses keyword matching against pre-defined query templates to retrieve data from Supabase and return formatted responses.

**Why it must feel intelligent:**
- Target user is the COO (background: Brand Building, Key Account Management, Customer Marketing) — they expect premium tooling.
- A fast, well-formatted response with real business data creates genuine value regardless of the underlying mechanism.
- Typing indicators, smart number formatting, and contextual recommended actions create the perception of intelligence.

**Bilingual support:** The keyword engine recognizes both Bahasa Indonesia and English trigger words. The primary response language is Bahasa Indonesia with English data labels.

---

## UX Specification

### Trigger Button

- **Position:** Fixed, bottom-right corner of the analytics dashboard (not visible on customer-facing pages).
- **Appearance:** Burgundy (`hd-red: #C8102E`) circular FAB, 56px diameter.
- **Icon:** `Sparkles` from Lucide React (or `MessageSquare` as fallback).
- **Badge:** Small pulsing dot when new insights are available (e.g., after daily data refresh).
- **Hover state:** Slight scale-up (`scale-110`) with gold shadow (`hd-gold`).

### Panel Layout

| Breakpoint | Layout | Dimensions |
|---|---|---|
| Mobile (`< 768px`) | Slide-up drawer from bottom | 70vh height, full width |
| Desktop (`>= 768px`) | Right-side slide-in panel | 380px wide, full viewport height |

- **Animation:** `transform: translateY(100%)` → `translateY(0)` on mobile; `translateX(100%)` → `translateX(0)` on desktop. Duration: 300ms ease-out.
- **Overlay:** Semi-transparent backdrop (`black/40`) on mobile only. Desktop panel sits alongside the dashboard without obscuring it.
- **Z-index:** 50 (above dashboard content, below any modals).

### Panel Header

```
┌──────────────────────────────────────┐
│ ✦ HD Insights              [×]       │
│   Powered by AI                      │
└──────────────────────────────────────┘
```

- **Title:** "HD Insights" in `font-semibold`, `hd-dark`.
- **Icon:** `Sparkles` (16px) in `hd-gold` next to the title.
- **Subtitle:** "Powered by AI" in `text-xs text-gray-400`. Yes, this is marketing copy. The system is rules-based but the label sets user expectations for intelligent responses.
- **Close button:** `X` icon, top-right.
- **Background:** White with a 1px bottom border in `hd-gold-light`.

### Message Area

- Scrollable list of messages, newest at bottom (chat convention).
- Auto-scrolls to bottom on each new message.
- **User messages:** Right-aligned, burgundy bubble (`hd-red` background, white text).
- **Bot messages:** Left-aligned, cream bubble (`hd-cream` background, `hd-dark` text).
- **Timestamps:** `text-xs text-gray-400` below each message, e.g., "09:41".
- **Empty state:** When first opened, show the welcome message and 3 suggested question chips (see below).

### Typing Indicator

- Shown while the engine processes a query.
- Visual: Three animated dots (`●●●`) with staggered fade animation.
- **Fake delay:** Randomized between 400ms and 800ms before every response, even if the query resolves instantly. This is intentional — it prevents the jarring effect of instant responses and reinforces the "thinking" perception.

```typescript
const delay = Math.floor(Math.random() * 400) + 400; // 400–800ms
await new Promise(resolve => setTimeout(resolve, delay));
```

### Suggested Questions (Chips)

Shown below the welcome message when the panel is first opened, and after each bot response.

**Default set (3 chips):**
1. "Apa best seller minggu ini?"
2. "Toko mana yang perlu perhatian?"
3. "Bandingkan revenue minggu ini vs minggu lalu"

**Rotation behavior:** After a chip is tapped, replace it with the next question in a predefined rotation pool. The pool covers all 20 Q&A catalog entries. This surfaces the full capability of the system progressively.

**Chip style:** Outlined pill (`border border-hd-gold text-hd-dark text-sm px-3 py-1 rounded-full`), tapping populates the input and sends immediately.

### Answer Formatting Rules

All bot responses follow a consistent structure:

1. **Opening line:** Direct answer to the question, plain prose.
2. **Data block:** Stat pills, a mini table, or a ranked list depending on the question type.
3. **Closing line:** Always ends with a "Recommended action:" block.

**Stat pills (inline):**
- Positive delta: `↑12%` rendered in green (`text-green-600`) inside a light green badge.
- Negative delta: `↓5%` rendered in burgundy (`hd-red`) inside a light red badge.
- Neutral/absolute value: plain text.

Example rendered output:
> Revenue naik **`↑8%`** dari minggu lalu — total **Rp 45.2jt** dari 892 orders.

**Mini tables:** Used for comparisons (e.g., store vs. store). Rendered as a simple HTML/JSX table with alternating row shading. Max 5 rows displayed; "Lihat semua" link for full data.

**Color coding:**
- Green: positive trend, target met, growth.
- Burgundy (`hd-red`): negative trend, attention needed, decline.
- Gold (`hd-gold`): neutral highlight, rank #1, featured metric.

### Input Bar

```
┌──────────────────────────────────┬───┐
│ Tanya tentang bisnis...          │ → │
└──────────────────────────────────┴───┘
```

- **Placeholder:** "Tanya tentang bisnis..."
- **Send button:** `Send` icon from Lucide, burgundy color.
- **Submit on:** Click send button OR press `Enter`.
- **Disabled state:** When typing indicator is showing, input is disabled and send button shows a spinner.

---

## Keyword Matching Engine

### Architecture

The engine is purely deterministic: no ML, no embeddings, no external API calls.

```
User Input
    │
    ▼
Normalize (lowercase, strip punctuation, trim whitespace)
    │
    ▼
Tokenize (split on spaces)
    │
    ▼
Score each QueryTemplate (count keyword matches)
    │
    ▼
Pick highest-scoring template (min score threshold: 1)
    │
    ▼
Run associated SQL query via /api/chat
    │
    ▼
Inject query results into response template
    │
    ▼
Return formatted response string
```

### Scoring Logic

Each `QueryTemplate` has a `keywords` array (strings in both ID and EN). The engine counts how many tokens from the user input appear in the keywords array. The template with the highest count wins.

**Tie-breaking:** If two templates score equally, prefer the one with longer matching keyword strings (more specific wins).

**Fallback:** If no template scores above 0, return the generic fallback response:
> "Maaf, saya belum mengerti pertanyaan itu. Coba tanya tentang penjualan, member, voucher, atau performa toko. Atau klik salah satu pertanyaan di bawah."

### Example Flow

```
User: "best seller bulan ini"

Normalize: "best seller bulan ini"
Tokens: ["best", "seller", "bulan", "ini"]

Scoring:
  TOP_SELLING_ITEMS_WEEKLY  → matches: ["best", "seller"] = score 2
  TOP_SELLING_ITEMS_MONTHLY → matches: ["best", "seller", "bulan"] = score 3  ← winner

Matched template: TOP_SELLING_ITEMS_MONTHLY
Query: SELECT name, COUNT(*) as orders
       FROM order_items
       JOIN menu_items ON order_items.menu_item_id = menu_items.id
       WHERE created_at >= date_trunc('month', now())
       GROUP BY name
       ORDER BY orders DESC
       LIMIT 5

Result: [
  { name: "Vanilla", orders: 342 },
  { name: "Belgian Chocolate", orders: 298 },
  { name: "Cookies & Cream", orders: 211 },
  { name: "Strawberry", orders: 178 },
  { name: "Matcha", orders: 134 }
]

Response:
"🏆 Best seller bulan ini:
1. Vanilla — 342 orders
2. Belgian Chocolate — 298 orders
3. Cookies & Cream — 211 orders
4. Strawberry — 178 orders
5. Matcha — 134 orders

Recommended action: Pastikan stok Vanilla dan Belgian Chocolate selalu terjaga. Pertimbangkan bundle promo keduanya untuk mendorong AOV."
```

---

## Full Q&A Catalog

### Category 1: Revenue & Sales

---

#### Q1 — Total Penjualan Hari Ini

**Trigger keywords (ID):** `hari ini`, `penjualan`, `total`, `pendapatan`, `sales`, `revenue`, `today`
**Trigger keywords (EN):** `today`, `sales`, `today's sales`, `revenue today`

**Query description:**
- Tables: `orders`
- Aggregation: `SUM(total_amount)` and `COUNT(*)` where `created_at >= today 00:00:00`
- Also fetch yesterday's equivalent for delta calculation.

**Response template:**
```
💰 Penjualan hari ini:

Total Revenue: Rp {today_revenue} ({delta_icon}{delta_pct}% vs kemarin)
Total Orders: {today_orders} orders
AOV: Rp {today_aov}

Jam tersibuk sejauh ini: {busiest_hour}:00 ({peak_orders} orders)

Recommended action: {
  if delta > 0: "Performa hari ini di atas rata-rata. Maintain momentum dengan push notifikasi sore hari."
  if delta < 0: "Revenue di bawah kemarin. Cek apakah ada gangguan operasional atau kurangi friction di checkout."
}
```

---

#### Q2 — Bandingkan Revenue Minggu Ini vs Minggu Lalu

**Trigger keywords (ID):** `bandingkan`, `minggu ini`, `minggu lalu`, `compare`, `week`, `perbandingan`
**Trigger keywords (EN):** `compare`, `this week`, `last week`, `week over week`, `wow`

**Query description:**
- Tables: `orders`
- Aggregation: Two separate `SUM(total_amount)` and `COUNT(*)` — one for current ISO week, one for previous ISO week.
- Group by day of week to produce a 7-day comparison table.

**Response template:**
```
📊 Revenue: Minggu Ini vs Minggu Lalu

| Hari       | Minggu Ini | Minggu Lalu |
|------------|-----------|-------------|
| Senin      | Rp {mon_curr} | Rp {mon_prev} |
| Selasa     | Rp {tue_curr} | Rp {tue_prev} |
| Rabu       | Rp {wed_curr} | Rp {wed_prev} |
| Kamis      | Rp {thu_curr} | Rp {thu_prev} |
| Jumat      | Rp {fri_curr} | Rp {fri_prev} |
| Sabtu      | Rp {sat_curr} | Rp {sat_prev} |
| Minggu     | Rp {sun_curr} | Rp {sun_prev} |
| **Total**  | **Rp {total_curr}** | **Rp {total_prev}** |

Perubahan total: {delta_icon}{delta_pct}% ({delta_icon}{delta_abs})

Recommended action: {
  if delta > 10%: "Pertumbuhan kuat. Identifikasi hari terbaik dan replikasi promonya."
  if delta > 0%: "Tumbuh moderat. Fokus pada hari dengan gap negatif untuk optimasi."
  if delta < 0%: "Revenue turun. Review kampanye minggu lalu vs minggu ini — ada yang berubah?"
}
```

---

#### Q3 — Toko Mana Revenue Tertinggi?

**Trigger keywords (ID):** `toko`, `revenue`, `tertinggi`, `terbaik`, `ranking toko`, `top store`
**Trigger keywords (EN):** `highest revenue`, `top store`, `best store`, `store ranking`

**Query description:**
- Tables: `orders` JOIN `stores`
- Aggregation: `SUM(total_amount)` grouped by `store_id`, current month, ORDER BY revenue DESC LIMIT 5.

**Response template:**
```
🏪 Top 5 Toko — Bulan Ini

1. {store_1} — Rp {rev_1} ({orders_1} orders)
2. {store_2} — Rp {rev_2} ({orders_2} orders)
3. {store_3} — Rp {rev_3} ({orders_3} orders)
4. {store_4} — Rp {rev_4} ({orders_4} orders)
5. {store_5} — Rp {rev_5} ({orders_5} orders)

{store_1} memimpin dengan {share_pct}% dari total revenue jaringan.

Recommended action: Dokumentasikan SOP {store_1} dan jadikan benchmark untuk toko dengan performa bawah rata-rata.
```

---

#### Q4 — Jam Paling Ramai

**Trigger keywords (ID):** `jam`, `ramai`, `peak`, `sibuk`, `traffic`, `hour`, `waktu`
**Trigger keywords (EN):** `busiest hour`, `peak hour`, `rush hour`, `when is it busy`

**Query description:**
- Tables: `orders`
- Aggregation: `COUNT(*)` grouped by `EXTRACT(HOUR FROM created_at)`, last 7 days, ORDER BY count DESC.

**Response template:**
```
⏰ Jam Tersibuk (7 hari terakhir)

Puncak utama: {peak_hour}:00–{peak_hour+1}:00 ({peak_orders} orders avg/hari)
Puncak kedua: {peak2_hour}:00–{peak2_hour+1}:00 ({peak2_orders} orders avg/hari)
Paling sepi: {quiet_hour}:00–{quiet_hour+1}:00 ({quiet_orders} orders avg/hari)

Distribusi per jam:
{hour_bar_chart}

Recommended action: Jadwalkan push notifikasi 30 menit sebelum {peak_hour}:00 untuk riding the wave. Pertimbangkan promo Happy Hour di slot {quiet_hour}:00.
```

---

### Category 2: Customer & Loyalty

---

#### Q5 — Berapa Member Gold?

**Trigger keywords (ID):** `member gold`, `gold`, `pelanggan gold`, `tier gold`, `anggota gold`
**Trigger keywords (EN):** `gold members`, `how many gold`, `gold tier`

**Query description:**
- Tables: `loyalty_members` (or `profiles` with loyalty tier field)
- Aggregation: `COUNT(*)` where `tier = 'Gold'`, plus delta vs last month.

**Response template:**
```
⭐ Member Gold

Total aktif: {gold_count} member
Bulan ini: {gold_new} member baru masuk tier Gold
Naik dari Silver: {gold_upgraded} member
Turun dari Platinum: {gold_downgraded} member
vs bulan lalu: {delta_icon}{delta_pct}%

Recommended action: {
  if gold_new > gold_downgraded: "Ekosistem tier Gold sehat. Fokuskan benefit eksklusif untuk mendorong upgrade ke Platinum."
  else: "Lebih banyak yang downgrade vs upgrade. Review apakah spending threshold Platinum terlalu tinggi."
}
```

---

#### Q6 — Siapa yang Hampir Churn?

**Trigger keywords (ID):** `churn`, `hampir churn`, `tidak aktif`, `idle`, `hilang`, `lama tidak order`
**Trigger keywords (EN):** `churn`, `about to churn`, `inactive`, `at risk`, `lapsed`

**Query description:**
- Tables: `orders` JOIN `profiles`
- Logic: Members who ordered in the last 60–90 days but NOT in the last 30 days, sorted by historical LTV descending (highest value churners first).
- Limit: Top 10.

**Response template:**
```
⚠️ Member Berisiko Churn (tidak order 30+ hari, aktif sebelumnya)

Ditemukan {at_risk_count} member berisiko — {high_value_count} di antaranya bernilai tinggi (LTV > Rp 500rb).

Top 5 perlu win-back segera:
1. {member_1} — last order {days_1} hari lalu, LTV Rp {ltv_1}
2. {member_2} — last order {days_2} hari lalu, LTV Rp {ltv_2}
3. {member_3} — last order {days_3} hari lalu, LTV Rp {ltv_3}
4. {member_4} — last order {days_4} hari lalu, LTV Rp {ltv_4}
5. {member_5} — last order {days_5} hari lalu, LTV Rp {ltv_5}

Recommended action: Kirim win-back campaign ke {at_risk_count} member ini dengan voucher 20% off valid 7 hari. Prioritaskan {high_value_count} member LTV tinggi dengan personal outreach via WhatsApp.
```

---

#### Q7 — LTV Rata-rata Pelanggan

**Trigger keywords (ID):** `ltv`, `lifetime value`, `nilai pelanggan`, `rata-rata`, `average`
**Trigger keywords (EN):** `ltv`, `lifetime value`, `average ltv`, `customer value`

**Query description:**
- Tables: `orders` JOIN `profiles`
- Aggregation: `SUM(total_amount)` per user, then `AVG()` of that, broken down by tier.

**Response template:**
```
💎 Lifetime Value (LTV) Pelanggan

LTV rata-rata keseluruhan: Rp {avg_ltv}

Per tier:
• Platinum: Rp {ltv_platinum} avg ({platinum_count} member)
• Gold:     Rp {ltv_gold} avg ({gold_count} member)
• Silver:   Rp {ltv_silver} avg ({silver_count} member)
• Bronze:   Rp {ltv_bronze} avg ({bronze_count} member)

Member terlama aktif: {oldest_member} — {member_months} bulan, LTV Rp {highest_ltv}

Recommended action: Gap LTV antara Gold dan Platinum adalah {gap_pct}x. Program upgrade Platinum (mis. bonus 500 poin) dengan ROI positif jika {break_even_orders} order tambahan per member tercapai.
```

---

#### Q8 — Tier Mana yang Paling Banyak Belanja?

**Trigger keywords (ID):** `tier`, `belanja`, `spending`, `paling banyak`, `tertinggi`, `which tier`
**Trigger keywords (EN):** `tier spends`, `highest spending tier`, `which tier`, `tier revenue`

**Query description:**
- Tables: `orders` JOIN `profiles`
- Aggregation: `SUM(total_amount)` and `AVG(total_amount)` grouped by `loyalty_tier`, current month.

**Response template:**
```
📊 Kontribusi Revenue per Tier — Bulan Ini

| Tier     | Total Revenue | % Share | Avg Order |
|----------|--------------|---------|-----------|
| Platinum | Rp {rev_plat} | {pct_plat}% | Rp {aov_plat} |
| Gold     | Rp {rev_gold} | {pct_gold}% | Rp {aov_gold} |
| Silver   | Rp {rev_silv} | {pct_silv}% | Rp {aov_silv} |
| Bronze   | Rp {rev_bron} | {pct_bron}% | Rp {aov_bron} |

Tier {top_tier} mendominasi dengan {top_pct}% total revenue.

Recommended action: {
  if silver_share > gold_share: "Silver mendominasi volume — percepat upgrade ke Gold dengan spending challenge (mis. 5 order dalam 30 hari = otomatis Gold)."
  else: "Distribusi tier sehat. Fokus pada mempertahankan Platinum dengan benefit eksklusif."
}
```

---

#### Q9 — Member Baru Bulan Ini

**Trigger keywords (ID):** `member baru`, `registrasi`, `daftar`, `bergabung`, `new member`, `bulan ini`
**Trigger keywords (EN):** `new members`, `registrations`, `sign ups`, `joined this month`

**Query description:**
- Tables: `profiles`
- Aggregation: `COUNT(*)` where `created_at >= start of current month`, plus daily trend and referral source breakdown.

**Response template:**
```
👥 Member Baru — {current_month}

Total registrasi: {new_members} member (+{delta_pct}% vs bulan lalu)

Sumber:
• Referral: {ref_count} ({ref_pct}%)
• Organik: {organic_count} ({organic_pct}%)
• Voucher Welcome: {voucher_count} ({voucher_pct}%)

Paling aktif setelah daftar: {first_order_pct}% melakukan order pertama dalam 7 hari

Recommended action: {
  if first_order_pct < 50%: "Konversi first order rendah. Tambahkan trigger email/WA 24 jam setelah registrasi dengan welcome voucher 10%."
  else: "Onboarding flow bekerja baik. Uji apakah memperpendek window welcome offer (48 jam → 24 jam) meningkatkan urgency."
}
```

---

### Category 3: Voucher & Marketing

---

#### Q10 — Voucher Paling Sering Dipakai

**Trigger keywords (ID):** `voucher`, `paling sering`, `populer`, `dipakai`, `terbanyak`, `most used`
**Trigger keywords (EN):** `most used voucher`, `popular voucher`, `top voucher`

**Query description:**
- Tables: `order_vouchers` JOIN `vouchers`
- Aggregation: `COUNT(*)` grouped by `voucher_code`, current month, ORDER BY count DESC LIMIT 5.

**Response template:**
```
🎟️ Top 5 Voucher Bulan Ini

1. {voucher_1} — dipakai {usage_1}x (diskon total Rp {discount_1})
2. {voucher_2} — dipakai {usage_2}x (diskon total Rp {discount_2})
3. {voucher_3} — dipakai {usage_3}x (diskon total Rp {discount_3})
4. {voucher_4} — dipakai {usage_4}x (diskon total Rp {discount_4})
5. {voucher_5} — dipakai {usage_5}x (diskon total Rp {discount_5})

Total biaya diskon dari voucher: Rp {total_discount}

Recommended action: {voucher_1} adalah driver utama — pertimbangkan untuk memperpanjang validity-nya. Evaluasi voucher dengan usage rendah untuk dihentikan atau diganti.
```

---

#### Q11 — ROI Voucher FREEONGKIR

**Trigger keywords (ID):** `freeongkir`, `ongkir`, `gratis ongkir`, `roi freeongkir`, `voucher ongkir`
**Trigger keywords (EN):** `freeongkir`, `free shipping`, `freeongkir roi`, `shipping voucher`

**Query description:**
- Tables: `orders` JOIN `order_vouchers` JOIN `vouchers`
- Logic: Filter orders where `voucher_code = 'FREEONGKIR'`. Compare `AVG(basket_size)` for FREEONGKIR orders vs non-voucher orders. ROI = (incremental revenue) / (total discount cost).

**Response template:**
```
📦 ROI Analisis: Voucher FREEONGKIR

Total penggunaan bulan ini: {freeongkir_usage}x
Total biaya diskon (ongkir): Rp {freeongkir_cost}
Total revenue dari order FREEONGKIR: Rp {freeongkir_revenue}

Basket size:
• Pakai FREEONGKIR: Rp {aov_with} avg
• Tanpa voucher: Rp {aov_without} avg
• Uplift: +{uplift_pct}%

ROI: {roi}x ({roi_description})

Recommended action: {
  if roi > 2: "ROI positif — scale FREEONGKIR. Pertimbangkan threshold minimum order (mis. min. Rp 100rb) untuk menjaga margin."
  if roi > 1: "Break-even positif tapi tipis. Test A/B dengan minimum order threshold untuk meningkatkan ROI."
  if roi < 1: "ROI negatif. Hentikan atau batasi usage FREEONGKIR sampai threshold minimum order ditambahkan."
}
```

---

#### Q12 — Persentase Order Pakai Voucher

**Trigger keywords (ID):** `persen`, `pakai voucher`, `berapa persen`, `voucher rate`, `voucher usage`
**Trigger keywords (EN):** `percentage voucher`, `voucher rate`, `how many orders use voucher`

**Query description:**
- Tables: `orders` LEFT JOIN `order_vouchers`
- Aggregation: `COUNT(orders with voucher) / COUNT(all orders) * 100`, current month vs last month.

**Response template:**
```
🎟️ Voucher Adoption Rate

Bulan ini: {voucher_rate}% order menggunakan voucher
vs bulan lalu: {prev_rate}% ({delta_icon}{delta_ppt} ppt)

Breakdown:
• Order tanpa voucher: {no_voucher_count} ({no_voucher_pct}%)
• Order dengan 1 voucher: {one_voucher_count} ({one_voucher_pct}%)

Avg diskon per order: Rp {avg_discount}
Total impact ke margin: Rp {total_discount} ({margin_impact_pct}% dari gross revenue)

Recommended action: {
  if voucher_rate > 60%: "Adoption rate tinggi — risiko voucher dependency. Uji apakah mengurangi distribusi voucher memengaruhi order volume."
  if voucher_rate < 20%: "Adoption rendah. Voucher tidak menjangkau basis member dengan baik — review distribusi channel."
  else: "Rate sehat. Monitor margin impact secara berkala."
}
```

---

#### Q13 — Conversion Rate Referral

**Trigger keywords (ID):** `referral`, `referral rate`, `konversi referral`, `conversion referral`
**Trigger keywords (EN):** `referral`, `referral conversion`, `referral rate`, `refer a friend`

**Query description:**
- Tables: `referrals` JOIN `profiles`
- Aggregation: `COUNT(successful_referrals) / COUNT(total_referrals_sent) * 100`, current month.

**Response template:**
```
🔗 Referral Program — Bulan Ini

Total referral link dikirim: {referrals_sent}
Berhasil registrasi: {referrals_registered} ({reg_rate}%)
Berhasil order pertama: {referrals_ordered} ({order_rate}%)

Conversion funnel:
Sent → Registered: {reg_rate}%
Registered → First Order: {order_rate}%
Overall (Sent → First Order): {overall_rate}%

Top referrer bulan ini: {top_referrer} — {top_referrer_count} successful referrals

Recommended action: {
  if overall_rate < 10%: "Conversion rendah. Perbesar insentif referral atau sederhanakan onboarding flow untuk referred users."
  if reg_rate > 50% but order_rate < 30%: "Drop terjadi di Registered → First Order. Perkuat welcome email sequence dengan urgency voucher."
  else: "Program berjalan baik. Scale dengan fitur in-app share yang lebih prominent."
}
```

---

### Category 4: Store Performance (Key Account)

---

#### Q14 — Performa Toko Spesifik (contoh: PIK Avenue)

**Trigger keywords (ID):** `performa toko`, `{store_name}`, `toko pik`, `pik avenue`, `grand indonesia`, `senayan city`, `kinerja toko`
**Trigger keywords (EN):** `store performance`, `{store_name} performance`, `how is {store_name}`

**Note:** This template is parameterized. The engine extracts the store name from the query and passes it as a filter.

**Query description:**
- Tables: `orders` JOIN `stores`
- Aggregation: Revenue, order count, AOV for the matched store — current month vs last month.

**Response template:**
```
🏪 Performa Toko: {store_name}

Bulan ini:
• Revenue: Rp {store_revenue} ({delta_icon}{delta_pct}% vs bulan lalu)
• Orders: {store_orders} ({delta_icon}{order_delta}%)
• AOV: Rp {store_aov}
• Peak hours: {peak_hours}

Ranking di jaringan: #{store_rank} dari {total_stores} toko

Best seller di toko ini: {top_product_1}, {top_product_2}

Recommended action: {
  if delta_pct > 10: "Performa {store_name} di atas rata-rata — jadikan benchmark."
  if delta_pct < -10: "{store_name} butuh perhatian. Cek traffic fisik, staf, dan kondisi kompetisi lokal."
  else: "Performa stabil. Fokus pada seasonal upsell untuk mendorong AOV."
}
```

---

#### Q15 — Toko yang Butuh Perhatian

**Trigger keywords (ID):** `butuh perhatian`, `perlu perhatian`, `toko bermasalah`, `underperform`, `toko lemah`
**Trigger keywords (EN):** `needs attention`, `underperforming store`, `weak store`, `store problems`

**Query description:**
- Tables: `orders` JOIN `stores`
- Logic: Stores with revenue OR order count MORE THAN 15% below their own 4-week moving average. ORDER BY gap% DESC.

**Response template:**
```
⚠️ Toko yang Membutuhkan Perhatian

Ditemukan {flagged_count} toko dengan performa di bawah rata-rata historisnya:

{for each flagged store:}
🔴 {store_name}
   Revenue drop: {drop_pct}% vs rata-rata 4 minggu
   Orders: {store_orders} (avg: {avg_orders})
   Kemungkinan penyebab: {inferred_cause}

Recommended action: Jadwalkan store visit ke {top_flag_store} minggu ini. Cek apakah ada isu stok, staf, atau perubahan traffic mall.
```

---

#### Q16 — Bandingkan Semua Toko

**Trigger keywords (ID):** `bandingkan semua toko`, `perbandingan toko`, `semua toko`, `compare stores`
**Trigger keywords (EN):** `compare all stores`, `all stores`, `store comparison`, `store leaderboard`

**Query description:**
- Tables: `orders` JOIN `stores`
- Aggregation: Revenue, order count, AOV for ALL stores, current month. ORDER BY revenue DESC.

**Response template:**
```
🏪 Leaderboard Semua Toko — {current_month}

| Rank | Toko | Revenue | Orders | AOV |
|------|------|---------|--------|-----|
| 1 | {store_1} | Rp {rev_1} | {ord_1} | Rp {aov_1} |
| 2 | {store_2} | Rp {rev_2} | {ord_2} | Rp {aov_2} |
| 3 | {store_3} | Rp {rev_3} | {ord_3} | Rp {aov_3} |
| 4 | {store_4} | Rp {rev_4} | {ord_4} | Rp {aov_4} |
| 5 | {store_5} | Rp {rev_5} | {ord_5} | Rp {aov_5} |

Rata-rata jaringan: Rp {avg_revenue} revenue, {avg_orders} orders/toko

Recommended action: Gap antara toko #1 dan #5 adalah {gap_multiple}x. Prioritaskan knowledge transfer dari {store_1} ke {store_5}.
```

---

### Category 5: Product & Menu

---

#### Q17 — Best Seller Minggu Ini

**Trigger keywords (ID):** `best seller`, `terlaris`, `paling laku`, `paling banyak`, `minggu ini`
**Trigger keywords (EN):** `best seller`, `best selling`, `top product`, `most ordered`, `this week`

**Query description:**
- Tables: `order_items` JOIN `menu_items`
- Aggregation: `COUNT(*)` grouped by `menu_item_id`, current ISO week, ORDER BY count DESC LIMIT 5.

**Response template:**
```
🏆 Best Seller Minggu Ini

1. {product_1} — {orders_1} orders ({share_1}% dari total)
2. {product_2} — {orders_2} orders ({share_2}%)
3. {product_3} — {orders_3} orders ({share_3}%)
4. {product_4} — {orders_4} orders ({share_4}%)
5. {product_5} — {orders_5} orders ({share_5}%)

{product_1} sudah best seller {consecutive_weeks} minggu berturut-turut.

Recommended action: Jadikan {product_1} anchor di homepage banner. Buat bundle dengan {product_2} untuk mendorong cross-sell.
```

---

#### Q18 — Produk Paling Menguntungkan

**Trigger keywords (ID):** `menguntungkan`, `profit`, `margin`, `paling profitable`, `margin tinggi`
**Trigger keywords (EN):** `most profitable`, `highest margin`, `profit product`, `margin`

**Query description:**
- Tables: `order_items` JOIN `menu_items` (requires `cost_price` and `selling_price` columns)
- Aggregation: `SUM((selling_price - cost_price) * quantity)` grouped by `menu_item_id`, ORDER BY gross_profit DESC.

**Response template:**
```
💰 Produk Paling Menguntungkan — Bulan Ini

| Produk | Orders | Gross Profit | Margin % |
|--------|--------|-------------|----------|
| {p1} | {ord_1} | Rp {gp_1} | {m1}% |
| {p2} | {ord_2} | Rp {gp_2} | {m2}% |
| {p3} | {ord_3} | Rp {gp_3} | {m3}% |

Catatan: Produk dengan volume tinggi tapi margin rendah: {low_margin_product} ({lm_pct}% margin)

Recommended action: Prioritaskan {p1} dalam promosi berbayar — setiap Rp 1 investasi marketing menghasilkan Rp {p1_roi} gross profit. Pertimbangkan menaikkan harga {low_margin_product} sebesar 5–10%.
```

---

#### Q19 — Menu yang Jarang Dipesan

**Trigger keywords (ID):** `jarang`, `tidak laku`, `slow moving`, `paling sedikit`, `least`, `rendah`
**Trigger keywords (EN):** `least ordered`, `slow moving`, `least popular`, `rarely ordered`

**Query description:**
- Tables: `order_items` JOIN `menu_items`
- Aggregation: `COUNT(*)` grouped by `menu_item_id`, current month, ORDER BY count ASC LIMIT 5. Exclude items added < 30 days ago.

**Response template:**
```
📉 Menu Paling Jarang Dipesan — Bulan Ini

1. {product_1} — hanya {orders_1} orders ({days_on_menu_1} hari di menu)
2. {product_2} — hanya {orders_2} orders ({days_on_menu_2} hari di menu)
3. {product_3} — hanya {orders_3} orders ({days_on_menu_3} hari di menu)

Total SKU aktif: {total_sku}. SKU di bawah {threshold} orders/bulan: {slow_count} item.

Recommended action: Evaluasi {product_1} dan {product_2} untuk:
(a) Promosi khusus untuk clear stock, atau
(b) Discontinue jika tidak ada seasonal relevance.
Menyederhanakan menu meningkatkan kitchen efficiency dan mengurangi decision fatigue pembeli.
```

---

### Category 6: Strategic

---

#### Q20 — Ringkasan Bisnis Minggu Ini (The Crown Jewel)

**Trigger keywords (ID):** `ringkasan`, `summary`, `rekap`, `minggu ini`, `weekly`, `overview`, `bisnis`
**Trigger keywords (EN):** `weekly summary`, `business summary`, `weekly recap`, `overview`, `this week summary`

**Why this is the crown jewel:** This question runs 6–8 sub-queries in parallel (revenue, orders, members, best seller, top store, worst store) and assembles a single coherent narrative. It is the most impressive response in the catalog and likely to be the COO's most-used prompt.

**Query description:**
- Sub-query 1: `SUM(total_amount)` current week vs last week → revenue + delta
- Sub-query 2: `COUNT(orders)` current week vs last week → order count + delta
- Sub-query 3: `AVG(total_amount)` current week → AOV + delta
- Sub-query 4: `COUNT(profiles)` where `created_at` in current week → new members
- Sub-query 5: Best selling `menu_item` current week
- Sub-query 6: Top store by revenue current week
- Sub-query 7: Store with biggest revenue decline vs their own avg → attention flag

**Response template:**
```
📊 Ringkasan Bisnis Minggu Ini ({week_start} - {week_end})

💰 Revenue: Rp {week_revenue} ({delta_icon}{delta_pct}% vs minggu lalu)
📦 Orders: {week_orders} ({delta_icon}{order_delta}%)
👥 Member Baru: {new_members}
⭐ AOV: Rp {aov} ({aov_delta_icon}{aov_delta}%)

🏆 Best Seller: {best_product} ({best_product_orders} orders)
🏪 Top Store: {top_store} (Rp {top_store_revenue})
⚠️  Perlu Perhatian: {flag_store} (traffic {flag_delta_icon}{flag_delta}%)

📋 Recommended Actions:
1. {action_1}
2. {action_2}
3. {action_3}
```

**Dynamic recommended actions logic:**

| Condition | Action |
|---|---|
| Churn-at-risk Platinum members exist | "Aktivasi win-back untuk {n} Platinum members yang idle >{days} hari" |
| Any store traffic drop > 10% | "Push campaign untuk {store} (traffic drop {pct}%)" |
| FREEONGKIR ROI > 2x | "Scale voucher FREEONGKIR (ROI {roi}x)" |
| New member growth > 20% | "Onboarding rate naik — pertahankan referral program" |
| AOV declining | "AOV turun {pct}% — uji bundle promo untuk dorong basket size" |
| Best seller consistent 3+ weeks | "Bundle {product} dengan complementary item untuk cross-sell" |

---

## Technical Implementation

### File Structure

```
src/
  lib/
    chat/
      engine.ts       # Keyword matcher + template scoring + query dispatch
      templates.ts    # Response template strings with placeholder tokens
      queries.ts      # Supabase query functions (one per template)
  components/
    ChatPanel.tsx     # Full UI component
  app/
    api/
      chat/
        route.ts      # POST handler — receives message, returns formatted response
```

### `engine.ts` — Core Logic

```typescript
interface QueryTemplate {
  id: string;
  keywords: string[];       // Both ID and EN keywords
  queryFn: () => Promise<QueryResult>;
  formatFn: (data: QueryResult) => string;
}

function matchTemplate(input: string, templates: QueryTemplate[]): QueryTemplate | null {
  const tokens = input.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  let best: { template: QueryTemplate; score: number } | null = null;

  for (const template of templates) {
    const score = tokens.filter(token => template.keywords.includes(token)).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { template, score };
    }
  }

  return best?.template ?? null;
}
```

### `ChatPanel.tsx` — Component State

```typescript
interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;            // Markdown string
  timestamp: Date;
}

const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
const [isTyping, setIsTyping] = useState(false);
const [inputValue, setInputValue] = useState('');
const [isOpen, setIsOpen] = useState(false);
```

No Zustand needed — all state is local to the component.

### `/api/chat` Route

```typescript
// POST /api/chat
// Body: { message: string }
// Response: { response: string, timestamp: string }

export async function POST(req: Request) {
  const { message } = await req.json();
  const template = matchTemplate(message, ALL_TEMPLATES);

  if (!template) {
    return Response.json({ response: FALLBACK_RESPONSE });
  }

  const data = await template.queryFn();
  const response = template.formatFn(data);

  return Response.json({ response });
}
```

### Fake Delay Implementation

The delay is applied client-side in `ChatPanel.tsx`, not on the server. The API responds as fast as possible; the UI holds the response and shows typing indicator for a randomized duration before rendering.

```typescript
async function sendMessage(text: string) {
  setIsTyping(true);
  const [response] = await Promise.all([
    fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message: text }) }).then(r => r.json()),
    new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 400) + 400))
  ]);
  setIsTyping(false);
  appendMessage({ role: 'bot', content: response.response });
}
```

Using `Promise.all` ensures the delay and the API call run in parallel — the response is never shown before the minimum delay, but also never held longer than necessary if the query takes >800ms.

### Markdown Rendering

Bot responses use a lightweight Markdown renderer (e.g., `react-markdown` with `remark-gfm`) to handle:
- Bold text (`**text**`)
- Bullet lists
- Tables
- Inline code spans for stat pills

Stat pills with color coding are implemented via a custom remark plugin or post-processing that wraps `↑` tokens in green `<span>` tags and `↓` tokens in burgundy `<span>` tags.

---

## Branding & Visual Design

| Element | Value |
|---|---|
| Chat bubble (user) | `bg-hd-red text-white` |
| Chat bubble (bot) | `bg-hd-cream text-hd-dark` |
| Trigger FAB | `bg-hd-red hover:scale-110` |
| Header | White background, `border-b border-hd-gold-light` |
| Positive delta | `text-green-600 bg-green-50` |
| Negative delta | `text-hd-red bg-red-50` |
| Chip buttons | `border border-hd-gold text-hd-dark` |
| Send button | `text-hd-red` |

---

## Edge Cases & Error Handling

| Scenario | Handling |
|---|---|
| Database query fails | Return: "Maaf, terjadi gangguan saat mengambil data. Coba lagi dalam beberapa detik." |
| No data for the period | Return: "Tidak ada data untuk periode ini. Cek apakah filter tanggal sudah benar." |
| User input is empty | Disable send button — don't send. |
| User spams messages | Debounce input by 500ms; disable input while `isTyping = true`. |
| Store name not recognized | Return: "Nama toko tidak ditemukan. Toko yang tersedia: {store_list}." |
| Very long query result | Truncate to top 5 items and show "Lihat selengkapnya di dashboard." |

---

## Future Enhancements (Out of Scope for MVP)

- **Date range picker:** Allow users to specify custom date ranges inline ("revenue bulan Februari").
- **Export:** "Export ringkasan ini ke PDF" button on the weekly summary response.
- **Proactive nudges:** System-initiated messages when anomalies are detected (e.g., revenue drop >20% triggers a push to the COO's device).
- **Real AI upgrade path:** The `engine.ts` interface is intentionally designed to be swappable — a future version can replace `matchTemplate()` with an LLM call without changing the response templates or UI.
