// ============================================================
// Dashboard Dummy Data — Häagen-Dazs Indonesia Analytics
// Deterministic (no Math.random). All monetary values in IDR.
// ============================================================

// ── Types ────────────────────────────────────────────────────

export interface KPIMetric {
  current: number
  previousValue: number
  changePercent: number
  sparklineData: number[]
}

export interface KPIData {
  revenue: KPIMetric
  orders: KPIMetric
  activeMembers: KPIMetric
  aov: KPIMetric
  voucherRedemptionRate: KPIMetric
  referralConversions: KPIMetric
}

export interface RevenueTimePoint {
  date: string
  pickup: number
  delivery: number
  dinein: number
}

export interface StoreRevenue {
  store: string
  revenue: number
  orders: number
  aov: number
  growth: number
}

export interface HeatmapPoint {
  day: string
  hour: number
  value: number
}

export interface CustomerSegment {
  tier: string
  revenue: number
  customers: number
  aov: number
}

export interface VoucherPerformance {
  code: string
  title: string
  issued: number
  redeemed: number
  redemptionRate: number
  roi: number
}

export interface FunnelStage {
  stage: string
  value: number
}

export interface OrdersByHourPoint {
  hour: number
  pickup: number
  delivery: number
  dinein: number
}

export interface TopProduct {
  name: string
  orders: number
  revenue: number
}

export interface BrandHealth {
  fullPrice: number
  withVoucher: number
}

export interface ChurnPoint {
  month: string
  silver: number
  gold: number
  platinum: number
}

// ── Helpers ──────────────────────────────────────────────────

/** Generate a deterministic sparkline of 7 points around a base value. */
function sparkline(base: number, deltas: number[]): number[] {
  return deltas.map((d) => Math.round(base + d))
}

/** Format a date string n days before a reference date (2026-04-04). */
function dateOffset(daysAgo: number): string {
  const ref = new Date('2026-04-04')
  ref.setDate(ref.getDate() - daysAgo)
  return ref.toISOString().slice(0, 10)
}

// ── KPI Data ─────────────────────────────────────────────────

/**
 * Returns top-level KPI metrics for the dashboard header cards.
 * @param period - 'today' | 'week' | 'month' (shapes narrative slightly)
 */
export function getKPIData(period: string): KPIData {
  const isToday = period === 'today'
  const isWeek = period === 'week'

  // Revenue: ~Rp 680jt/month across all stores
  const revenueCurrent = isToday ? 22_800_000 : isWeek ? 162_000_000 : 680_000_000
  const revenuePrev = isToday ? 21_200_000 : isWeek ? 148_000_000 : 615_000_000
  const revenueChange = parseFloat(
    (((revenueCurrent - revenuePrev) / revenuePrev) * 100).toFixed(1)
  )

  // Orders
  const ordersCurrent = isToday ? 412 : isWeek ? 2_890 : 12_340
  const ordersPrev = isToday ? 388 : isWeek ? 2_710 : 11_820
  const ordersChange = parseFloat(
    (((ordersCurrent - ordersPrev) / ordersPrev) * 100).toFixed(1)
  )

  // Active members (customers who ordered in the period)
  const membersCurrent = isToday ? 318 : isWeek ? 1_940 : 7_250
  const membersPrev = isToday ? 295 : isWeek ? 1_820 : 6_980
  const membersChange = parseFloat(
    (((membersCurrent - membersPrev) / membersPrev) * 100).toFixed(1)
  )

  // AOV ~Rp 55K blended
  const aovCurrent = isToday ? 55_340 : isWeek ? 56_090 : 55_110
  const aovPrev = isToday ? 54_640 : isWeek ? 54_570 : 52_030
  const aovChange = parseFloat((((aovCurrent - aovPrev) / aovPrev) * 100).toFixed(1))

  // Voucher redemption rate ~18%
  const voucherCurrent = isToday ? 17.4 : isWeek ? 18.2 : 18.6
  const voucherPrev = isToday ? 16.8 : isWeek ? 17.5 : 17.9
  const voucherChange = parseFloat(
    (((voucherCurrent - voucherPrev) / voucherPrev) * 100).toFixed(1)
  )

  // Referral conversions
  const referralCurrent = isToday ? 14 : isWeek ? 98 : 410
  const referralPrev = isToday ? 11 : isWeek ? 82 : 365
  const referralChange = parseFloat(
    (((referralCurrent - referralPrev) / referralPrev) * 100).toFixed(1)
  )

  return {
    revenue: {
      current: revenueCurrent,
      previousValue: revenuePrev,
      changePercent: revenueChange,
      sparklineData: sparkline(revenueCurrent * 0.9, [
        -1_800_000, -600_000, 800_000, 1_200_000, -400_000, 900_000, 1_500_000,
      ]),
    },
    orders: {
      current: ordersCurrent,
      previousValue: ordersPrev,
      changePercent: ordersChange,
      sparklineData: sparkline(ordersCurrent * 0.92, [
        -30, -10, 15, 22, -8, 18, 28,
      ]),
    },
    activeMembers: {
      current: membersCurrent,
      previousValue: membersPrev,
      changePercent: membersChange,
      sparklineData: sparkline(membersCurrent * 0.93, [
        -20, -5, 10, 18, 5, 14, 22,
      ]),
    },
    aov: {
      current: aovCurrent,
      previousValue: aovPrev,
      changePercent: aovChange,
      sparklineData: sparkline(aovCurrent * 0.96, [
        -800, -200, 300, 600, -100, 400, 700,
      ]),
    },
    voucherRedemptionRate: {
      current: voucherCurrent,
      previousValue: voucherPrev,
      changePercent: voucherChange,
      sparklineData: sparkline(voucherCurrent * 0.95, [
        -1.2, -0.4, 0.5, 0.8, -0.2, 0.6, 1.0,
      ]),
    },
    referralConversions: {
      current: referralCurrent,
      previousValue: referralPrev,
      changePercent: referralChange,
      sparklineData: sparkline(referralCurrent * 0.85, [
        -8, -2, 5, 9, -1, 7, 12,
      ]),
    },
  }
}

// ── Revenue Time Series (last 30 days) ───────────────────────

/**
 * Returns daily revenue split by channel for the last 30 days.
 * Pickup dominates (~55%), delivery ~30%, dine-in ~15%.
 * Weekend peaks are baked in deterministically.
 */
export function getRevenueTimeSeries(_period: string): RevenueTimePoint[] {
  // Base daily revenue per channel (weekday)
  const basePickup = 11_500_000
  const baseDelivery = 6_200_000
  const baseDineIn = 3_100_000

  // Deterministic per-day multipliers for 30 days (index 0 = 29 days ago)
  const multipliers = [
    0.82, 0.85, 0.91, 0.95, 1.12, 1.25, 1.18, // week 1
    0.84, 0.88, 0.93, 0.97, 1.14, 1.28, 1.20, // week 2
    0.86, 0.90, 0.94, 0.98, 1.16, 1.32, 1.22, // week 3
    0.88, 0.91, 0.96, 1.00, 1.18, 1.35, 1.24, // week 4
    0.90, 0.94,                                 // last 2 days
  ]

  return multipliers.map((m, i) => ({
    date: dateOffset(29 - i),
    pickup: Math.round(basePickup * m),
    delivery: Math.round(baseDelivery * m),
    dinein: Math.round(baseDineIn * m),
  }))
}

// ── Revenue by Store ─────────────────────────────────────────

/**
 * Returns monthly revenue breakdown per store.
 * Story: PIK = best + growing, Grand Indonesia = high AOV + declining,
 *        Plaza Senayan = steady, Pakuwon Surabaya = new + ramping.
 */
export function getRevenueByStore(): StoreRevenue[] {
  return [
    {
      store: 'PIK Avenue',
      revenue: 198_400_000,
      orders: 3_620,
      aov: 54_807,
      growth: 15.2,
    },
    {
      store: 'Grand Indonesia',
      revenue: 184_200_000,
      orders: 2_970,
      aov: 62_020,
      growth: -12.1,
    },
    {
      store: 'Plaza Senayan',
      revenue: 162_800_000,
      orders: 3_080,
      aov: 52_857,
      growth: 3.4,
    },
    {
      store: 'Pakuwon Surabaya',
      revenue: 88_600_000,
      orders: 1_640,
      aov: 54_024,
      growth: 42.8, // new store ramping
    },
  ]
}

// ── Revenue Heatmap ──────────────────────────────────────────

/**
 * Returns hour × day heatmap data.
 * Dead zones: Tue/Wed 14:00–16:00
 * Peaks: Fri/Sat 19:00–21:00
 */
export function getRevenueHeatmap(): HeatmapPoint[] {
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

  // Base pattern: lunch bump, afternoon dip, evening peak
  const hourWeights: Record<number, number> = {
    10: 0.3, 11: 0.5, 12: 0.8, 13: 0.7, 14: 0.4, 15: 0.3,
    16: 0.4, 17: 0.6, 18: 0.8, 19: 1.0, 20: 0.9, 21: 0.6,
  }
  // Day multipliers: weekends peak, Sel/Rab dip
  const dayWeights: Record<string, number> = {
    Sen: 0.7, Sel: 0.5, Rab: 0.5, Kam: 0.7, Jum: 0.9, Sab: 1.0, Min: 0.95,
  }

  const points: HeatmapPoint[] = []
  for (const day of days) {
    for (const hour of hours) {
      const base = 45 // base orders per hour
      const value = Math.round(base * (hourWeights[hour] ?? 0.5) * (dayWeights[day] ?? 0.7))
      points.push({ day, hour, value })
    }
  }
  return points
}

// ── Customer Segments ────────────────────────────────────────

/**
 * Returns revenue & customer counts by loyalty tier.
 * Gold generates ~3× the revenue of Silver per customer.
 */
export function getCustomerSegments(): CustomerSegment[] {
  return [
    {
      tier: 'Platinum',
      revenue: 238_400_000,
      customers: 820,
      aov: 290_731, // high — buys for groups/events
    },
    {
      tier: 'Gold',
      revenue: 294_600_000,
      customers: 2_140,
      aov: 137_664,
    },
    {
      tier: 'Silver',
      revenue: 147_000_000,
      customers: 4_290,
      aov: 34_265, // Gold AOV ~3× Silver
    },
  ]
}

// ── Voucher Performance ──────────────────────────────────────

/**
 * Returns voucher campaign performance.
 * FREEONGKIR has best ROI (3.2×).
 * FLASH20 has high redemption but attracts discount hunters (low ROI).
 */
export function getVoucherPerformance(): VoucherPerformance[] {
  return [
    {
      code: 'FREEONGKIR',
      title: 'Free Ongkos Kirim',
      issued: 4_200,
      redeemed: 2_940,
      redemptionRate: 70.0,
      roi: 3.2,
    },
    {
      code: 'HDWELCOME',
      title: 'Welcome Discount 15%',
      issued: 3_800,
      redeemed: 2_090,
      redemptionRate: 55.0,
      roi: 2.4,
    },
    {
      code: 'FLASH20',
      title: 'Flash Sale 20% Off',
      issued: 5_600,
      redeemed: 4_200,
      redemptionRate: 75.0,
      roi: 1.1, // discount hunters — low ROI
    },
    {
      code: 'HDLOYALTY',
      title: 'Loyalty Bonus Double Points',
      issued: 2_100,
      redeemed: 1_680,
      redemptionRate: 80.0,
      roi: 2.8,
    },
    {
      code: 'REFERRAL10',
      title: 'Referral Reward 10%',
      issued: 1_540,
      redeemed: 820,
      redemptionRate: 53.2,
      roi: 2.6,
    },
  ]
}

// ── Referral Funnel ──────────────────────────────────────────

/**
 * Returns the referral programme funnel from shares to converted orders.
 */
export function getReferralFunnel(): FunnelStage[] {
  return [
    { stage: 'Referral Links Shared', value: 2_840 },
    { stage: 'Link Clicked', value: 1_920 },
    { stage: 'App Installed', value: 1_240 },
    { stage: 'Account Created', value: 890 },
    { stage: 'First Order Placed', value: 410 },
  ]
}

// ── Orders by Hour ───────────────────────────────────────────

/**
 * Returns blended order count by hour of day across all stores.
 * Two peaks: 12:00–13:00 (lunch) and 19:00–21:00 (evening).
 */
export function getOrdersByHour(): OrdersByHourPoint[] {
  const data: OrdersByHourPoint[] = [
    { hour: 9,  pickup: 18,  delivery: 8,   dinein: 5   },
    { hour: 10, pickup: 28,  delivery: 14,  dinein: 9   },
    { hour: 11, pickup: 52,  delivery: 24,  dinein: 16  },
    { hour: 12, pickup: 98,  delivery: 48,  dinein: 32  },
    { hour: 13, pickup: 112, delivery: 52,  dinein: 38  },
    { hour: 14, pickup: 64,  delivery: 30,  dinein: 18  },
    { hour: 15, pickup: 48,  delivery: 22,  dinein: 14  },
    { hour: 16, pickup: 58,  delivery: 28,  dinein: 16  },
    { hour: 17, pickup: 78,  delivery: 38,  dinein: 24  },
    { hour: 18, pickup: 95,  delivery: 52,  dinein: 34  },
    { hour: 19, pickup: 128, delivery: 68,  dinein: 52  },
    { hour: 20, pickup: 142, delivery: 78,  dinein: 58  },
    { hour: 21, pickup: 118, delivery: 62,  dinein: 44  },
    { hour: 22, pickup: 72,  delivery: 38,  dinein: 22  },
    { hour: 23, pickup: 32,  delivery: 18,  dinein: 8   },
  ]
  return data
}

// ── Top Products ─────────────────────────────────────────────

/**
 * Returns best-selling products by order count and revenue.
 * Premium single scoops and pints dominate.
 */
export function getTopProducts(): TopProduct[] {
  return [
    { name: 'Belgian Chocolate Pint',     orders: 2_840, revenue: 155_400_000 },
    { name: 'Strawberry Cheesecake Pint', orders: 2_210, revenue: 119_340_000 },
    { name: 'Vanilla Swiss Almond Pint',  orders: 1_980, revenue: 108_900_000 },
    { name: 'Macadamia Nut Brittle Pint', orders: 1_760, revenue:  98_560_000 },
    { name: 'Cookies & Cream Pint',       orders: 1_640, revenue:  88_560_000 },
    { name: 'Matcha Green Tea Pint',      orders: 1_520, revenue:  83_600_000 },
    { name: 'Mango Sorbet (500ml)',        orders: 1_340, revenue:  60_300_000 },
    { name: 'Belgian Chocolate Single',   orders: 1_280, revenue:  44_800_000 },
    { name: 'Triple Chocolate Sundae',    orders:   980, revenue:  49_000_000 },
    { name: 'Ice Cream Cake 8"',          orders:   420, revenue:  63_000_000 },
  ]
}

// ── Brand Health ─────────────────────────────────────────────

/**
 * Returns the split between full-price and voucher-assisted orders.
 * Target: keep voucher orders below 25% to protect brand positioning.
 */
export function getBrandHealth(): BrandHealth {
  return {
    fullPrice: 10_068,   // ~81.6% of total orders
    withVoucher: 2_272,  // ~18.4% — healthy, below 25% threshold
  }
}

// ── Churn by Tier ────────────────────────────────────────────

/**
 * Returns monthly churn rate (%) by loyalty tier for the last 6 months.
 * Platinum churn is near zero; Silver churn is the main concern.
 */
export function getChurnByTier(): ChurnPoint[] {
  return [
    { month: 'Nov 2025', silver: 8.4, gold: 3.2, platinum: 0.8 },
    { month: 'Dec 2025', silver: 7.8, gold: 2.9, platinum: 0.6 },
    { month: 'Jan 2026', silver: 9.2, gold: 3.5, platinum: 0.9 },
    { month: 'Feb 2026', silver: 8.6, gold: 3.1, platinum: 0.7 },
    { month: 'Mar 2026', silver: 7.4, gold: 2.6, platinum: 0.5 },
    { month: 'Apr 2026', silver: 6.9, gold: 2.4, platinum: 0.4 },
  ]
}
