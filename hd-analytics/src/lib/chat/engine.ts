// ============================================================
// Rules-Based Chat Engine — Häagen-Dazs Indonesia Dashboard
// Supports Bahasa Indonesia + English keywords.
// Uses dummy-data.ts for dynamic numbers.
// ============================================================

import {
  getKPIData,
  getRevenueByStore,
  getVoucherPerformance,
  getReferralFunnel,
  getOrdersByHour,
  getTopProducts,
  getBrandHealth,
  getChurnByTier,
  getCustomerSegments,
} from '@/lib/dashboard/dummy-data'

// ── Types ────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// ── Formatting Helpers ───────────────────────────────────────

function idr(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)}M`
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(0)}jt`
  }
  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(0)}K`
  }
  return `Rp ${value.toLocaleString('id-ID')}`
}

function pct(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

function trend(changePercent: number): string {
  return changePercent >= 0 ? '📈' : '📉'
}

function pill(label: string, value: string): string {
  return `【${label}: ${value}】`
}

// ── Keyword Matching ─────────────────────────────────────────

type Intent =
  | 'today_sales'
  | 'compare_weeks'
  | 'top_store'
  | 'busiest_hour'
  | 'gold_members'
  | 'churn_risk'
  | 'avg_ltv'
  | 'top_spending_tier'
  | 'new_members'
  | 'most_used_voucher'
  | 'freeongkir_roi'
  | 'voucher_percentage'
  | 'referral_rate'
  | 'specific_store_pik'
  | 'specific_store_gi'
  | 'specific_store_ps'
  | 'specific_store_pkw'
  | 'needs_attention'
  | 'compare_stores'
  | 'best_seller'
  | 'most_profitable'
  | 'least_ordered'
  | 'weekly_summary'

interface Rule {
  intent: Intent
  keywords: string[]
}

const rules: Rule[] = [
  // Revenue & Sales
  {
    intent: 'today_sales',
    keywords: [
      'today', 'hari ini', 'penjualan hari', 'sales today',
      'revenue today', 'pendapatan hari', 'omzet hari',
    ],
  },
  {
    intent: 'compare_weeks',
    keywords: [
      'compare week', 'bandingkan minggu', 'week over week', 'wow',
      'minggu lalu', 'last week', 'week comparison', 'perbandingan minggu',
    ],
  },
  {
    intent: 'top_store',
    keywords: [
      'top store', 'toko terbaik', 'best store', 'store terbaik',
      'best performing', 'performa terbaik', 'gerai terbaik',
    ],
  },
  {
    intent: 'busiest_hour',
    keywords: [
      'busiest hour', 'jam tersibuk', 'peak hour', 'jam puncak',
      'ramai', 'paling ramai', 'rush hour', 'peak time',
    ],
  },

  // Customer & Loyalty
  {
    intent: 'gold_members',
    keywords: [
      'gold member', 'member gold', 'gold pelanggan', 'pelanggan gold',
      'gold customer', 'tier gold', 'how many gold',
    ],
  },
  {
    intent: 'churn_risk',
    keywords: [
      'churn', 'pelanggan hilang', 'churn risk', 'at risk',
      'losing customers', 'retention', 'inactive', 'tidak aktif',
    ],
  },
  {
    intent: 'avg_ltv',
    keywords: [
      'ltv', 'lifetime value', 'nilai pelanggan', 'customer value',
      'average ltv', 'rata-rata ltv', 'clv', 'customer lifetime',
    ],
  },
  {
    intent: 'top_spending_tier',
    keywords: [
      'top spending', 'pengeluaran terbesar', 'paling banyak belanja',
      'highest spend', 'tier terbaik', 'which tier', 'tier mana',
    ],
  },
  {
    intent: 'new_members',
    keywords: [
      'new member', 'member baru', 'pelanggan baru', 'new customer',
      'acquisition', 'registrasi', 'daftar baru', 'sign up',
    ],
  },

  // Voucher & Marketing
  {
    intent: 'most_used_voucher',
    keywords: [
      'most used voucher', 'voucher terbanyak', 'voucher populer',
      'popular voucher', 'voucher paling', 'voucher usage',
    ],
  },
  {
    intent: 'freeongkir_roi',
    keywords: [
      'freeongkir', 'free ongkir', 'ongkos kirim', 'delivery voucher',
      'freeongkir roi', 'voucher ongkir',
    ],
  },
  {
    intent: 'voucher_percentage',
    keywords: [
      'voucher percent', 'persen voucher', 'berapa persen voucher',
      'voucher rate', 'redemption rate', 'tingkat penggunaan voucher',
      'how many voucher', 'berapa voucher',
    ],
  },
  {
    intent: 'referral_rate',
    keywords: [
      'referral', 'refer', 'ajak teman', 'invite friend',
      'referral rate', 'conversion referral', 'referral funnel',
    ],
  },

  // Store Performance
  {
    intent: 'specific_store_pik',
    keywords: [
      'pik', 'pik avenue', 'pantai indah kapuk',
    ],
  },
  {
    intent: 'specific_store_gi',
    keywords: [
      'grand indonesia', 'grand indo', 'gi store', 'grand indo store',
    ],
  },
  {
    intent: 'specific_store_ps',
    keywords: [
      'plaza senayan', 'senayan', 'ps store',
    ],
  },
  {
    intent: 'specific_store_pkw',
    keywords: [
      'pakuwon', 'surabaya', 'sby', 'pakuwon surabaya',
    ],
  },
  {
    intent: 'needs_attention',
    keywords: [
      'needs attention', 'perlu perhatian', 'warning', 'masalah',
      'problem store', 'struggling', 'underperform', 'rendah',
    ],
  },
  {
    intent: 'compare_stores',
    keywords: [
      'compare store', 'bandingkan toko', 'store comparison',
      'perbandingan gerai', 'all store', 'semua toko', 'store ranking',
    ],
  },

  // Product & Menu
  {
    intent: 'best_seller',
    keywords: [
      'best seller', 'terlaris', 'produk terlaris', 'top product',
      'most ordered', 'paling laku', 'paling banyak dipesan',
    ],
  },
  {
    intent: 'most_profitable',
    keywords: [
      'most profitable', 'paling menguntungkan', 'highest margin',
      'margin tertinggi', 'profit product', 'produk profit',
    ],
  },
  {
    intent: 'least_ordered',
    keywords: [
      'least ordered', 'paling sedikit', 'slow moving', 'slow mover',
      'tidak laku', 'kurang laku', 'underperforming product',
    ],
  },

  // Strategic
  {
    intent: 'weekly_summary',
    keywords: [
      'summary', 'ringkasan', 'weekly', 'mingguan', 'recap',
      'laporan', 'report', 'overview', 'what happened', 'apa yang terjadi',
    ],
  },
]

// ── Intent Detection ─────────────────────────────────────────

function detectIntent(input: string): Intent | null {
  const normalized = input.toLowerCase().trim()
  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (normalized.includes(kw)) {
        return rule.intent
      }
    }
  }
  return null
}

// ── Response Generators ──────────────────────────────────────

function respondTodaySales(): string {
  const kpi = getKPIData('today')
  const { revenue, orders, aov } = kpi
  return `💰 **Penjualan Hari Ini**

${pill('Revenue', idr(revenue.current))} ${trend(revenue.changePercent)} ${pct(revenue.changePercent)} vs kemarin
${pill('Orders', orders.current.toLocaleString('id-ID'))} ${trend(orders.changePercent)} ${pct(orders.changePercent)} vs kemarin
${pill('AOV', idr(aov.current))}

Penjualan hari ini sedang on-track. Revenue ${idr(revenue.current)} dari ${orders.current} transaksi dengan rata-rata per order ${idr(aov.current)}.

💡 Recommended action: Monitor peak hour 19:00–21:00 — siapkan stok dan staff di PIK Avenue yang sedang tumbuh 15%.`
}

function respondCompareWeeks(): string {
  const weekKpi = getKPIData('week')
  const { revenue, orders } = weekKpi
  return `📊 **Perbandingan Minggu Ini vs Minggu Lalu**

${pill('Revenue Minggu Ini', idr(revenue.current))} vs ${idr(revenue.previousValue)} minggu lalu → ${trend(revenue.changePercent)} ${pct(revenue.changePercent)}
${pill('Orders Minggu Ini', orders.current.toLocaleString())} vs ${orders.previousValue.toLocaleString()} minggu lalu → ${trend(orders.changePercent)} ${pct(orders.changePercent)}

Pertumbuhan didorong oleh PIK Avenue (+15.2%) dan Pakuwon Surabaya yang sedang ramp-up. Grand Indonesia menunjukkan penurunan traffic -12.1% meski AOV tetap tinggi di Rp 62K.

💡 Recommended action: Investigate penyebab penurunan traffic di Grand Indonesia — pertimbangkan kampanye lokal atau event in-store untuk minggu depan.`
}

function respondTopStore(): string {
  const stores = getRevenueByStore()
  const top = stores[0] // PIK Avenue
  return `🏆 **Top Performing Store**

**${top.store}** adalah store terbaik bulan ini.

${pill('Revenue', idr(top.revenue))}
${pill('Orders', top.orders.toLocaleString())}
${pill('AOV', idr(top.aov))}
${pill('Growth', pct(top.growth))} ${trend(top.growth)}

PIK Avenue mengungguli semua store dengan pertumbuhan ${pct(top.growth)} MoM — tertinggi di antara semua gerai. Traffic tinggi dan AOV yang sehat menjadikannya prime candidate untuk kapasitas ekspansi.

💡 Recommended action: Replikasi strategi marketing PIK Avenue (lokasi, display, promo) ke Plaza Senayan untuk mendorong pertumbuhan dari 3.4% ke 2 digit.`
}

function respondBusiestHour(): string {
  const hourData = getOrdersByHour()
  const peakHour = hourData.reduce((max, h) =>
    h.pickup + h.delivery + h.dinein > max.pickup + max.delivery + max.dinein ? h : max
  )
  const totalPeak = peakHour.pickup + peakHour.delivery + peakHour.dinein
  return `⏰ **Jam Tersibuk**

Peak hour adalah **${peakHour.hour}:00–${peakHour.hour + 1}:00** dengan total **${totalPeak} orders**.

${pill('Pickup', peakHour.pickup.toString())} ${pill('Delivery', peakHour.delivery.toString())} ${pill('Dine-in', peakHour.dinein.toString())}

Terdapat dua peak period:
- **Siang (12:00–13:00):** Lunch crowd — pickup dominan
- **Malam (19:00–21:00):** Evening leisure — seluruh channel aktif

Dead zone: Selasa & Rabu 14:00–16:00 — volume sangat rendah.

💡 Recommended action: Jalankan flash promo "Happy Hours" setiap Selasa-Rabu pukul 14:00–16:00 untuk mengisi dead zone dan meratakan beban operasional.`
}

function respondGoldMembers(): string {
  const segments = getCustomerSegments()
  const gold = segments.find((s) => s.tier === 'Gold')!
  return `🥇 **Gold Members**

${pill('Total Gold Members', gold.customers.toLocaleString())}
${pill('Revenue dari Gold', idr(gold.revenue))}
${pill('AOV Gold', idr(gold.aov))}

Gold members menyumbang **${idr(gold.revenue)}** per bulan — kontributor revenue terbesar. AOV mereka ${idr(gold.aov)} atau sekitar **4× lebih tinggi** dari Silver members.

💡 Recommended action: Prioritaskan retention program untuk Gold members. Satu Gold member yang churn = kerugian ${idr(gold.aov)} per bulan. Pertimbangkan "Gold Member Appreciation Day" bulanan.`
}

function respondChurnRisk(): string {
  const churn = getChurnByTier()
  const latest = churn[churn.length - 1]
  const prev = churn[churn.length - 2]
  return `⚠️ **Churn Risk by Tier**

Bulan ini (${latest.month}):
${pill('Silver Churn', `${latest.silver}%`)} ${latest.silver < prev.silver ? '📉 membaik' : '📈 memburuk'}
${pill('Gold Churn', `${latest.gold}%`)} ${latest.gold < prev.gold ? '📉 membaik' : '📈 memburuk'}
${pill('Platinum Churn', `${latest.platinum}%`)} ${latest.platinum < prev.platinum ? '📉 membaik' : '📈 memburuk'}

Kabar baik: churn Silver turun dari ${prev.silver}% → ${latest.silver}% (tren positif 3 bulan terakhir). Platinum churn sangat rendah di ${latest.platinum}% — tier ini sangat loyal.

💡 Recommended action: Fokus win-back campaign pada Silver members yang inactive > 45 hari. Kirim voucher personal "We miss you" dengan diskon 15% untuk re-aktivasi.`
}

function respondAvgLTV(): string {
  const segments = getCustomerSegments()
  const total = segments.reduce((s, c) => s + c.revenue, 0)
  const totalCustomers = segments.reduce((s, c) => s + c.customers, 0)
  const blendedAov = Math.round(total / totalCustomers)

  // Rough LTV estimate: AOV × avg orders per year (assume 2.4 orders/month × 12)
  const avgOrdersPerYear = 2.4 * 12
  const ltv = Math.round(blendedAov * avgOrdersPerYear)
  return `💎 **Average Customer LTV (Lifetime Value)**

${pill('Blended AOV', idr(blendedAov))}
${pill('Est. LTV (12 bulan)', idr(ltv))}

Perhitungan: AOV ${idr(blendedAov)} × ~2.4 orders/bulan × 12 bulan.

Breakdown per tier:
- 🥈 Silver: LTV est. ${idr(Math.round(34_265 * 2.4 * 12))}
- 🥇 Gold: LTV est. ${idr(Math.round(137_664 * 2.4 * 12))}
- 💎 Platinum: LTV est. ${idr(Math.round(290_731 * 2.4 * 12))}

💡 Recommended action: Investasi akuisisi pelanggan masuk akal hingga CAC ≤ ${idr(Math.round(ltv * 0.2))} (20% LTV). Tier upgrade program adalah lever terbaik untuk meningkatkan LTV.`
}

function respondTopSpendingTier(): string {
  const segments = getCustomerSegments()
  const top = segments[0] // Platinum
  return `💎 **Top Spending Tier**

**${top.tier}** adalah tier dengan revenue terbesar meski jumlah pelanggannya paling sedikit.

${pill('Revenue', idr(top.revenue))} dari hanya ${pill('Pelanggan', top.customers.toLocaleString())}
${pill('AOV Platinum', idr(top.aov))} — **5.3× lebih tinggi dari Silver**

Perbandingan revenue per pelanggan:
- Platinum: ${idr(Math.round(top.revenue / top.customers))}/bulan
- Gold: ${idr(Math.round(294_600_000 / 2_140))}/bulan
- Silver: ${idr(Math.round(147_000_000 / 4_290))}/bulan

💡 Recommended action: Buat "Platinum Concierge" service — dedicated WhatsApp line, priority pickup, dan early access produk baru. Retensi Platinum adalah prioritas utama.`
}

function respondNewMembers(): string {
  const kpi = getKPIData('month')
  const { activeMembers } = kpi
  // Estimate: ~15% of active members are new this month
  const newEstimate = Math.round(activeMembers.current * 0.15)
  const referralFunnel = getReferralFunnel()
  const converted = referralFunnel[referralFunnel.length - 1].value
  return `🆕 **New Members Bulan Ini**

${pill('New Members Est.', newEstimate.toLocaleString())}
${pill('Via Referral', converted.toString())} (${((converted / newEstimate) * 100).toFixed(0)}% dari total new members)
${pill('Via Organic', (newEstimate - converted).toLocaleString())}

Referral programme berkontribusi sekitar ${((converted / newEstimate) * 100).toFixed(0)}% dari akuisisi baru. Funnel: ${referralFunnel[0].value.toLocaleString()} link dibagikan → ${converted} first orders.

💡 Recommended action: Tingkatkan reward pengirim referral dari 10% → 15% untuk mendorong viral loop. ROI referral saat ini sudah positif di 2.6×.`
}

function respondMostUsedVoucher(): string {
  const vouchers = getVoucherPerformance()
  const sorted = [...vouchers].sort((a, b) => b.redeemed - a.redeemed)
  const top = sorted[0]
  const second = sorted[1]
  return `🎟️ **Voucher Paling Banyak Digunakan**

**#1 ${top.code}** — ${top.title}
${pill('Redeemed', top.redeemed.toLocaleString())} dari ${top.issued.toLocaleString()} issued
${pill('Redemption Rate', `${top.redemptionRate}%`)} ${pill('ROI', `${top.roi}×`)}

**#2 ${second.code}** — ${second.title}
${pill('Redeemed', second.redeemed.toLocaleString())} ${pill('Rate', `${second.redemptionRate}%`)}

Perhatian: FLASH20 memiliki redemption rate tertinggi (75%) namun ROI hanya 1.1× — mengindikasikan discount hunters yang tidak re-order tanpa promo.

💡 Recommended action: Cap FLASH20 ke maximum 1× per user. Alihkan budget promo ke FREEONGKIR yang ROI-nya 3.2× dan mendorong repeat order organik.`
}

function respondFreeOngkirROI(): string {
  const vouchers = getVoucherPerformance()
  const v = vouchers.find((x) => x.code === 'FREEONGKIR')!
  return `🚚 **FREEONGKIR Voucher Performance**

${pill('Issued', v.issued.toLocaleString())} ${pill('Redeemed', v.redeemed.toLocaleString())}
${pill('Redemption Rate', `${v.redemptionRate}%`)}
${pill('ROI', `${v.roi}×`)} 🏆 Best ROI di antara semua voucher!

FREEONGKIR adalah **voucher paling efisien**. Setiap Rp 1 yang diinvestasikan menghasilkan Rp ${v.roi} revenue inkremental. Ini karena menghilangkan delivery barrier mendorong trial dari pelanggan baru yang kemudian menjadi repeat buyer.

Biaya: ~${idr(v.redeemed * 15_000)} subsidi ongkir (asumsi Rp 15K/order)
Revenue dihasilkan: ~${idr(v.redeemed * 55_000 * v.roi)} est.

💡 Recommended action: Scale up FREEONGKIR — tambah budget 30% untuk campaign Q2. Prioritaskan targeting ke area delivery yang belum dilayani store baru Pakuwon.`
}

function respondVoucherPercentage(): string {
  const health = getBrandHealth()
  const total = health.fullPrice + health.withVoucher
  const pctVoucher = ((health.withVoucher / total) * 100).toFixed(1)
  const pctFull = ((health.fullPrice / total) * 100).toFixed(1)
  const kpi = getKPIData('month')
  return `📊 **Voucher Redemption Rate**

${pill('Full Price Orders', health.fullPrice.toLocaleString())} (${pctFull}%)
${pill('Voucher Orders', health.withVoucher.toLocaleString())} (${pctVoucher}%)
${pill('Rate Bulan Ini', `${kpi.voucherRedemptionRate.current}%`)} ${trend(kpi.voucherRedemptionRate.changePercent)}

${pctVoucher}% order menggunakan voucher — **masih di bawah threshold 25%** yang aman untuk brand premium. Ini menunjukkan pelanggan bersedia membayar full price.

💡 Recommended action: Pertahankan voucher mix di bawah 20%. Jika mendekati 25%, evaluasi campaign diskon berjalan — terutama FLASH20 yang menarik discount hunters.`
}

function respondReferralRate(): string {
  const funnel = getReferralFunnel()
  const shared = funnel[0].value
  const converted = funnel[funnel.length - 1].value
  const convRate = ((converted / shared) * 100).toFixed(1)
  return `🔗 **Referral Programme Performance**

Funnel bulan ini:
${funnel.map((f, i) => `${['①', '②', '③', '④', '⑤'][i]} ${f.stage}: **${f.value.toLocaleString()}**`).join('\n')}

${pill('Overall Conversion', `${convRate}%`)} (share → first order)
${pill('Link CTR', `${((funnel[1].value / funnel[0].value) * 100).toFixed(0)}%`)}
${pill('Install Rate', `${((funnel[2].value / funnel[1].value) * 100).toFixed(0)}%`)} (dari klik)

Biggest drop-off: Install → Account (${funnel[2].value} → ${funnel[3].value}, ${(((funnel[2].value - funnel[3].value) / funnel[2].value) * 100).toFixed(0)}% drop). Registrasi terlalu panjang.

💡 Recommended action: Sederhanakan alur registrasi — cukup nomor HP + OTP untuk first order. Simpan data lengkap setelah transaksi pertama. Target: naikkan install-to-register dari ${((funnel[3].value / funnel[2].value) * 100).toFixed(0)}% → 85%.`
}

function respondStorePIK(): string {
  const stores = getRevenueByStore()
  const store = stores.find((s) => s.store === 'PIK Avenue')!
  return `📍 **PIK Avenue — Store Report**

${pill('Revenue', idr(store.revenue))} ${pill('Orders', store.orders.toLocaleString())}
${pill('AOV', idr(store.aov))} ${pill('Growth', pct(store.growth))} 📈

PIK Avenue adalah **top performer** jaringan HD Indonesia. Pertumbuhan ${pct(store.growth)} MoM konsisten dengan traffic demografis affluent di kawasan PIK 2. Evening peak (19:00–21:00) sangat kuat.

Keunggulan:
- Traffic volume tertinggi
- Growth momentum terkuat di jaringan
- AOV di atas rata-rata jaringan

💡 Recommended action: Pertimbangkan extended operating hours hingga 23:30 di akhir pekan. Evaluasi penambahan freezer display untuk pint retail — high-margin, low-effort.`
}

function respondStoreGI(): string {
  const stores = getRevenueByStore()
  const store = stores.find((s) => s.store === 'Grand Indonesia')!
  return `📍 **Grand Indonesia — Store Report**

${pill('Revenue', idr(store.revenue))} ${pill('Orders', store.orders.toLocaleString())}
${pill('AOV', idr(store.aov))} 🏆 Tertinggi di jaringan
${pill('Traffic Growth', pct(store.growth))} 📉 **WARNING**

Grand Indonesia memiliki **AOV tertinggi** (${idr(store.aov)}) tapi traffic turun ${Math.abs(store.growth)}% MoM. Ini mengindikasikan pelanggan loyal yang tetap datang tapi acquisition baru melambat — kemungkinan kompetitor baru di mall atau visibility yang berkurang.

💡 Recommended action: Audit posisi store di Grand Indonesia — pastikan signage visible dari escalator utama. Jalankan "Buy 2 Get 1" campaign untuk mendorong group visits dan traffic recovery Q2.`
}

function respondStorePS(): string {
  const stores = getRevenueByStore()
  const store = stores.find((s) => s.store === 'Plaza Senayan')!
  return `📍 **Plaza Senayan — Store Report**

${pill('Revenue', idr(store.revenue))} ${pill('Orders', store.orders.toLocaleString())}
${pill('AOV', idr(store.aov))} ${pill('Growth', pct(store.growth))} 📈

Plaza Senayan adalah **steady performer** — growth moderat ${pct(store.growth)} MoM, konsisten, dan reliable. Order volume tertinggi kedua di jaringan. Karakteristik: banyak repeat customer dari kantor sekitar yang beli saat lunch.

Peluang:
- Lunch bundle untuk office crowd (12:00–14:00)
- Kemitraan dengan co-working space sekitar SCBD

💡 Recommended action: Launch "Office Delivery Bundle" — 4 pint dengan diskon 10% minimum order untuk delivery ke kantor area SCBD/Sudirman. Target kantor-kantor tower sekitar Senayan.`
}

function respondStorePakuwon(): string {
  const stores = getRevenueByStore()
  const store = stores.find((s) => s.store === 'Pakuwon Surabaya')!
  return `📍 **Pakuwon Surabaya — Store Report**

${pill('Revenue', idr(store.revenue))} ${pill('Orders', store.orders.toLocaleString())}
${pill('AOV', idr(store.aov))} ${pill('Growth', pct(store.growth))} 🚀 New store!

Pakuwon Surabaya adalah **store terbaru** yang sedang dalam fase ramp-up. Growth ${pct(store.growth)} MoM adalah yang tertinggi secara absolut — wajar untuk toko baru. Revenue ${idr(store.revenue)} masih di bawah potensi penuh (target ${idr(150_000_000)}/bulan).

Proyeksi: capai run-rate penuh dalam 3–4 bulan jika tren berlanjut.

💡 Recommended action: Aktifkan program "Grand Opening Extended" — FREEONGKIR tanpa minimum untuk semua delivery di area Surabaya Barat selama 60 hari ke depan. Ini akan mempercepat trial dan word-of-mouth.`
}

function respondNeedsAttention(): string {
  const stores = getRevenueByStore()
  const declining = stores.filter((s) => s.growth < 0)
  const store = declining[0] // Grand Indonesia
  return `🚨 **Store yang Perlu Perhatian**

**${store.store}** adalah store yang paling membutuhkan intervensi:

${pill('Traffic Decline', pct(store.growth))} 📉
${pill('Revenue', idr(store.revenue))} — masih tertinggi ke-2 namun tren negatif
${pill('AOV', idr(store.aov))} — anomali: AOV tinggi tapi traffic turun

Ini adalah pola "loyal shrinkage" — base pelanggan setia yang spending-nya tinggi, tapi tanpa akuisisi baru. Tanpa intervensi, revenue akan ikut turun dalam 2–3 bulan.

Action plan:
1. Audit mall foot traffic data
2. Cek kompetitor baru di sekitar Grand Indonesia
3. Jalankan campaign acquisition lokal

💡 Recommended action: Alokasikan Rp 15jt budget campaign untuk Grand Indonesia bulan ini. ROI break-even hanya butuh 243 order tambahan pada AOV saat ini.`
}

function respondCompareStores(): string {
  const stores = getRevenueByStore()
  const lines = stores.map(
    (s, i) =>
      `**${i + 1}. ${s.store}**\n   ${pill('Revenue', idr(s.revenue))} ${pill('AOV', idr(s.aov))} ${pill('Growth', pct(s.growth))} ${trend(s.growth)}`
  )
  return `🏪 **Perbandingan Semua Store**

${lines.join('\n\n')}

**Insight:**
- PIK Avenue: Best growth momentum (+15.2%)
- Grand Indonesia: Highest AOV (${idr(62_020)}) tapi traffic declining
- Plaza Senayan: Most stable, high order volume
- Pakuwon Surabaya: New store, ramp-up phase

💡 Recommended action: Gunakan PIK Avenue sebagai "lighthouse store" — dokumentasikan praktik terbaik (display, promo timing, staff training) dan replikasikan ke Plaza Senayan terlebih dahulu.`
}

function respondBestSeller(): string {
  const products = getTopProducts()
  const top3 = products.slice(0, 3)
  return `🍦 **Best Selling Products**

${top3.map((p, i) => `**${i + 1}. ${p.name}**\n   ${pill('Orders', p.orders.toLocaleString())} ${pill('Revenue', idr(p.revenue))}`).join('\n\n')}

Belgian Chocolate Pint dominan dengan ${top3[0].orders.toLocaleString()} orders — terjual rata-rata **${Math.round(top3[0].orders / 30)} unit/hari** across all stores. Pints (take-home format) jauh lebih populer dari single scoop.

💡 Recommended action: Pastikan Belgian Chocolate Pint selalu available di semua store — jangan sampai stockout. Pertimbangkan bundle "Buy 2 Pints, Save Rp 10K" untuk meningkatkan basket size.`
}

function respondMostProfitable(): string {
  const products = getTopProducts()
  const topByRevPerOrder = [...products]
    .map((p) => ({ ...p, revPerOrder: Math.round(p.revenue / p.orders) }))
    .sort((a, b) => b.revPerOrder - a.revPerOrder)
  const cake = products.find((p) => p.name.includes('Cake'))!
  return `💰 **Most Profitable Products**

Berdasarkan revenue per order:

${topByRevPerOrder.slice(0, 3).map((p, i) => `**${i + 1}. ${p.name}**\n   ${pill('Revenue/Order', idr(p.revPerOrder))} ${pill('Total Orders', p.orders.toLocaleString())}`).join('\n\n')}

**${cake.name}** memiliki revenue per order tertinggi di ${idr(Math.round(cake.revenue / cake.orders))} — ideal untuk event, ulang tahun, dan corporate gifting. Volume masih rendah tapi margin sangat attractive.

💡 Recommended action: Buat "Cake Pre-Order" feature di app dengan 2-hari lead time. Targeted campaign ke Gold & Platinum members untuk ulang tahun mereka via push notification.`
}

function respondLeastOrdered(): string {
  const products = getTopProducts()
  const least = products[products.length - 1]
  return `📉 **Least Ordered Products**

**${least.name}** adalah produk dengan order volume terendah di top 10 list:
${pill('Orders', least.orders.toLocaleString())} ${pill('Revenue', idr(least.revenue))}
${pill('Revenue/Order', idr(Math.round(least.revenue / least.orders)))}

Namun perlu diperhatikan — revenue per order-nya ${idr(Math.round(least.revenue / least.orders))} termasuk tinggi. Ini produk premium yang niche, bukan produk yang gagal.

Produk yang benar-benar slow-mover biasanya tidak masuk top 10 list. Rekomendasi: review quarterly terhadap seluruh menu (termasuk varian yang tidak di laporan ini).

💡 Recommended action: Adakan "Menu Audit" 3-bulanan. Produk dengan order < 200/bulan dan gross margin < 40% sebaiknya di-discontinue atau digantikan dengan seasonal item.`
}

function respondWeeklySummary(): string {
  const kpi = getKPIData('week')
  const stores = getRevenueByStore()
  const vouchers = getVoucherPerformance()
  const topVoucher = [...vouchers].sort((a, b) => b.redeemed - a.redeemed)[0]
  return `📋 **Weekly Business Summary — HD Indonesia**

**💰 Revenue & Sales**
${pill('Revenue Minggu Ini', idr(kpi.revenue.current))} ${trend(kpi.revenue.changePercent)} ${pct(kpi.revenue.changePercent)}
${pill('Total Orders', kpi.orders.current.toLocaleString())} ${pill('AOV', idr(kpi.aov.current))}

**🏪 Store Highlights**
- 🏆 Best: ${stores[0].store} — ${idr(Math.round(stores[0].revenue / 4))}/minggu, growth ${pct(stores[0].growth)}
- ⚠️  Watch: ${stores[1].store} — traffic ${pct(stores[1].growth)}, needs intervention
- 🆕 New: ${stores[3].store} — ramp-up on-track ${pct(stores[3].growth)}

**🎟️ Marketing**
- Top voucher: **${topVoucher.code}** — ${topVoucher.redeemed.toLocaleString()} redemptions, ROI ${topVoucher.roi}×
- Voucher mix: ${kpi.voucherRedemptionRate.current}% — dalam batas aman brand positioning

**👥 Membership**
${pill('Active Members', kpi.activeMembers.current.toLocaleString())} ${trend(kpi.activeMembers.changePercent)} ${pct(kpi.activeMembers.changePercent)}
${pill('Referral Conversions', kpi.referralConversions.current.toString())}

**Top Priority This Week:**
1. Intervensi marketing Grand Indonesia
2. Scale FREEONGKIR voucher budget
3. Monitor Pakuwon Surabaya ramp-up

💡 Recommended action: Schedule weekly review meeting Senin 09:00 dengan store managers Grand Indonesia dan PIK Avenue. Data sudah tersedia — gunakan dashboard ini sebagai agenda guide.`
}

// ── Fallback ─────────────────────────────────────────────────

function respondFallback(_input: string): string {
  return `🤖 Maaf, saya belum memahami pertanyaan tersebut.

Berikut topik yang bisa saya bantu:

**💰 Revenue & Sales**
- "Penjualan hari ini berapa?"
- "Bandingkan revenue minggu ini vs minggu lalu"
- "Store mana yang terbaik?"
- "Jam tersibuk kapan?"

**👥 Customer & Loyalty**
- "Berapa Gold members kita?"
- "Tier mana yang paling banyak belanja?"
- "Churn rate terbaru?"
- "Berapa rata-rata LTV pelanggan?"

**🎟️ Voucher & Marketing**
- "Voucher mana yang paling banyak digunakan?"
- "Bagaimana performa FREEONGKIR?"
- "Berapa persen order pakai voucher?"
- "Bagaimana referral rate kita?"

**🏪 Store Performance**
- "Performa PIK Avenue?"
- "Store mana yang perlu perhatian?"
- "Bandingkan semua store"

**🍦 Product**
- "Produk terlaris apa?"
- "Produk paling menguntungkan?"

**📋 Strategic**
- "Buat ringkasan mingguan"

💡 Coba ketik salah satu pertanyaan di atas!`
}

// ── Main Export ──────────────────────────────────────────────

/**
 * Processes a user input string and returns a formatted assistant response.
 * Supports Bahasa Indonesia and English keywords.
 * Synchronous — no artificial delay.
 */
export function processMessage(input: string): string {
  const intent = detectIntent(input)

  const handlers: Record<Intent, () => string> = {
    today_sales: respondTodaySales,
    compare_weeks: respondCompareWeeks,
    top_store: respondTopStore,
    busiest_hour: respondBusiestHour,
    gold_members: respondGoldMembers,
    churn_risk: respondChurnRisk,
    avg_ltv: respondAvgLTV,
    top_spending_tier: respondTopSpendingTier,
    new_members: respondNewMembers,
    most_used_voucher: respondMostUsedVoucher,
    freeongkir_roi: respondFreeOngkirROI,
    voucher_percentage: respondVoucherPercentage,
    referral_rate: respondReferralRate,
    specific_store_pik: respondStorePIK,
    specific_store_gi: respondStoreGI,
    specific_store_ps: respondStorePS,
    specific_store_pkw: respondStorePakuwon,
    needs_attention: respondNeedsAttention,
    compare_stores: respondCompareStores,
    best_seller: respondBestSeller,
    most_profitable: respondMostProfitable,
    least_ordered: respondLeastOrdered,
    weekly_summary: respondWeeklySummary,
  }

  if (!intent) {
    return respondFallback(input)
  }

  return handlers[intent]()
}
