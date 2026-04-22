import { createClient } from '@/lib/supabase/server'
import {
  fetchEnrichedOrders,
  fetchEnrichedOrderItems,
  fetchCustomersRFM,
  filtersFromPeriod,
  periodWindows,
  dayKeysForPeriod,
  startOfDaysAgo,
  type Period,
  type Filters,
  type EnrichedOrder,
} from './semantic'
import * as M from './semantic/measures'

type Supa = Awaited<ReturnType<typeof createClient>>

// Re-export so callers that imported Period/Filters from here still work.
export type { Period, Filters } from './semantic'

// ─────────────── Overview (basic) ───────────────

export interface OverviewMetrics {
  ordersTotal: number
  ordersLast30: number
  revenueTotal: number
  revenueLast30: number
  giftShareLast30: number
  avgOrderValue: number
  uniqueCustomersLast30: number
  splitLast30: { gift: number; self: number }
  dailyLast30: { date: string; orders: number; revenue: number; gifts: number }[]
}

export async function getOverviewMetrics(
  supabase: Supa,
  filters: Filters = filtersFromPeriod('30d'),
): Promise<OverviewMetrics> {
  // Pull a wider window for "total" comparisons (current filter window + all-time totals).
  const rows = await fetchEnrichedOrders(supabase, filters)
  const allRows = await fetchEnrichedOrders(supabase, { excludeCancelled: true })

  const ordersTotal = allRows.length
  const revenueTotal = M.revenue(allRows)
  const ordersLast30 = rows.length
  const revenueLast30 = M.revenue(rows)
  const giftOrdersLast30 = M.giftOrders(rows)

  const dayKeys = dayKeysForPeriod('30d')
  const byDay = M.groupByDay(rows)
  const dailyLast30 = dayKeys.map((date) => {
    const bucket = byDay.get(date) ?? []
    return {
      date,
      orders: bucket.length,
      revenue: M.revenue(bucket),
      gifts: M.giftOrders(bucket),
    }
  })

  return {
    ordersTotal,
    ordersLast30,
    revenueTotal,
    revenueLast30,
    giftShareLast30: M.giftShare(rows),
    avgOrderValue: M.aov(rows),
    uniqueCustomersLast30: M.activeUsers(rows),
    splitLast30: { gift: giftOrdersLast30, self: ordersLast30 - giftOrdersLast30 },
    dailyLast30,
  }
}

// ─────────────── Gift ───────────────

export interface GiftMetrics {
  giftsTotal: number
  giftsLast30: number
  uniqueGiftersLast30: number
  giftAOV: number
  upcomingScheduled: {
    id: string
    recipient_name: string | null
    scheduled_for: string | null
    total_amount: number
  }[]
  recentNotes: { message: string; created_at: string }[]
  giftsByDay: { date: string; gifts: number }[]
}

export async function getGiftMetrics(
  supabase: Supa,
  filters: Filters = filtersFromPeriod('30d'),
): Promise<GiftMetrics> {
  const giftFilters: Filters = { ...filters, isGift: true }
  const rows = await fetchEnrichedOrders(supabase, giftFilters)

  // "Total" gifts = all-time, independent of current filter.
  const allGifts = await fetchEnrichedOrders(supabase, { isGift: true, excludeCancelled: true })

  const nowIso = new Date().toISOString()
  const upcomingScheduled = allGifts
    .filter((g) => g.scheduled_for && g.scheduled_for >= nowIso)
    .sort((a, b) => (a.scheduled_for ?? '').localeCompare(b.scheduled_for ?? ''))
    .slice(0, 10)
    .map((g) => ({
      id: g.order_id,
      recipient_name: g.recipient_name,
      scheduled_for: g.scheduled_for,
      total_amount: Number(g.net_revenue ?? 0),
    }))

  const recentNotes = rows
    .filter((g) => g.gift_message && g.gift_message.trim().length > 0)
    .slice(0, 5)
    .map((g) => ({ message: g.gift_message as string, created_at: g.created_at }))

  const dayKeys = dayKeysForPeriod('30d')
  const byDay = M.groupByDay(rows)
  const giftsByDay = dayKeys.map((date) => ({ date, gifts: (byDay.get(date) ?? []).length }))

  return {
    giftsTotal: allGifts.length,
    giftsLast30: rows.length,
    uniqueGiftersLast30: M.activeUsers(rows),
    giftAOV: M.aov(rows),
    upcomingScheduled,
    recentNotes,
    giftsByDay,
  }
}

// ─────────────── Transactional ───────────────

export interface TransactionalMetrics {
  ordersLast30: number
  revenueLast30: number
  aov: number
  repeatRate: number
  modeBreakdown: { mode: string; count: number; revenue: number }[]
  paymentBreakdown: { method: string; count: number }[]
  topItems: { name: string; qty: number; revenue: number }[]
  dailyLast30: { date: string; orders: number; revenue: number }[]
}

export async function getTransactionalMetrics(
  supabase: Supa,
  filters: Filters = filtersFromPeriod('30d'),
): Promise<TransactionalMetrics> {
  const txFilters: Filters = { ...filters, isGift: false }
  const [rows, items] = await Promise.all([
    fetchEnrichedOrders(supabase, txFilters),
    fetchEnrichedOrderItems(supabase, txFilters),
  ])

  const modeMap = M.groupBy(rows, (o) => o.channel ?? 'unknown')
  const modeBreakdown = Array.from(modeMap, ([mode, bucket]) => ({
    mode: String(mode),
    count: bucket.length,
    revenue: M.revenue(bucket),
  }))

  const payMap = M.groupBy(rows, (o) => o.payment_method ?? 'unknown')
  const paymentBreakdown = Array.from(payMap, ([method, bucket]) => ({
    method: String(method),
    count: bucket.length,
  }))

  const itemMap = new Map<string, { qty: number; revenue: number }>()
  for (const line of items) {
    const name = line.product_name ?? 'Unknown'
    const row = itemMap.get(name) ?? { qty: 0, revenue: 0 }
    row.qty += Number(line.quantity ?? 0)
    row.revenue += Number(line.line_revenue ?? 0)
    itemMap.set(name, row)
  }
  const topItems = Array.from(itemMap, ([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  const dayKeys = dayKeysForPeriod('30d')
  const byDay = M.groupByDay(rows)
  const dailyLast30 = dayKeys.map((date) => {
    const bucket = byDay.get(date) ?? []
    return { date, orders: bucket.length, revenue: M.revenue(bucket) }
  })

  return {
    ordersLast30: rows.length,
    revenueLast30: M.revenue(rows),
    aov: M.aov(rows),
    repeatRate: M.repeatRate(rows),
    modeBreakdown,
    paymentBreakdown,
    topItems,
    dailyLast30,
  }
}

// ─────────────── Overview (real data — rich dashboard) ───────────────

import type {
  KPIMetric, KPIData, RevenueTimePoint, StoreRevenue, HeatmapPoint,
  CustomerSegment, VoucherPerformance, FunnelStage, OrdersByHourPoint,
  TopProduct, BrandHealth,
} from './dummy-data'

export interface RealOverviewData {
  kpi: KPIData
  revenueSeries: RevenueTimePoint[]
  stores: StoreRevenue[]
  segments: CustomerSegment[]
  brandHealth: BrandHealth
  vouchers: VoucherPerformance[]
  funnel: FunnelStage[]
  ordersByHour: OrdersByHourPoint[]
  topProducts: TopProduct[]
  heatmap: HeatmapPoint[]
}

export async function getOverviewRealData(
  supabase: Supa,
  period: Period,
  overrides: Partial<Filters> = {},
): Promise<RealOverviewData> {
  const { curr: currFilters, prev: prevFilters } = periodWindows(period, overrides)
  const [curr, prev, items] = await Promise.all([
    fetchEnrichedOrders(supabase, currFilters),
    fetchEnrichedOrders(supabase, prevFilters),
    fetchEnrichedOrderItems(supabase, currFilters),
  ])

  // ── KPIs ─────────────────────────────────────────────
  const dayKeys = dayKeysForPeriod(period)
  const byDayCurr = M.groupByDay(curr)

  const sparkRevenue: number[] = dayKeys.map((d) => M.revenue(byDayCurr.get(d) ?? []))
  const sparkOrders: number[] = dayKeys.map((d) => (byDayCurr.get(d) ?? []).length)
  const sparkActive: number[] = dayKeys.map((d) => M.activeUsers(byDayCurr.get(d) ?? []))
  const sparkAov: number[] = dayKeys.map((d) => M.aov(byDayCurr.get(d) ?? []))
  const sparkVoucherRate: number[] = dayKeys.map((d) => M.voucherRate(byDayCurr.get(d) ?? []))

  // Referrals — still on raw table (no view needed, simple count).
  const [{ count: refCurr }, { count: refPrev }] = await Promise.all([
    supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', currFilters.from ?? startOfDaysAgo(30)),
    supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', prevFilters.from ?? startOfDaysAgo(60))
      .lt('created_at', prevFilters.to ?? startOfDaysAgo(30)),
  ])

  const mk = (c: number, p: number, spark: number[]): KPIMetric => ({
    current: c,
    previousValue: p,
    changePercent: M.pctChange(c, p),
    sparklineData: spark.length > 0 ? spark : [0],
  })

  const kpi: KPIData = {
    revenue: mk(M.revenue(curr), M.revenue(prev), sparkRevenue),
    orders: mk(curr.length, prev.length, sparkOrders),
    activeMembers: mk(M.activeUsers(curr), M.activeUsers(prev), sparkActive),
    aov: mk(M.aov(curr), M.aov(prev), sparkAov),
    voucherRedemptionRate: mk(
      Math.round(M.voucherRate(curr) * 10) / 10,
      Math.round(M.voucherRate(prev) * 10) / 10,
      sparkVoucherRate,
    ),
    referralConversions: mk(refCurr ?? 0, refPrev ?? 0, dayKeys.map(() => 0)),
  }

  // ── Revenue by channel (daily stacked) ───────────────
  const revenueSeries: RevenueTimePoint[] = dayKeys.map((date) => {
    const bucket = byDayCurr.get(date) ?? []
    let pickup = 0, delivery = 0, dinein = 0
    for (const o of bucket) {
      const amt = Number(o.net_revenue ?? 0)
      if (o.channel === 'pickup') pickup += amt
      else if (o.channel === 'delivery') delivery += amt
      else if (o.channel === 'dinein') dinein += amt
    }
    return { date, pickup, delivery, dinein }
  })

  // ── Stores ──────────────────────────────────────────
  const storeCurr = M.groupBy(curr, (o) => o.store_name ?? 'Unassigned')
  const storePrev = M.groupBy(prev, (o) => o.store_name ?? 'Unassigned')
  const stores: StoreRevenue[] = Array.from(storeCurr, ([name, bucket]) => {
    const revCurr = M.revenue(bucket)
    const revPrev = M.revenue(storePrev.get(name) ?? [])
    return {
      store: String(name),
      revenue: revCurr,
      orders: bucket.length,
      aov: M.aov(bucket),
      growth: M.pctChange(revCurr, revPrev),
    }
  })

  // ── Customer tiers ──────────────────────────────────
  const TIER_ORDER = ['platinum', 'gold', 'silver'] as const
  const TIER_LABEL: Record<string, string> = { silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }
  const tierBuckets = M.groupBy(curr, (o) => o.tier ?? 'silver')
  const segments: CustomerSegment[] = TIER_ORDER
    .filter((t) => tierBuckets.has(t))
    .map((t) => {
      const bucket = tierBuckets.get(t)!
      return {
        tier: TIER_LABEL[t] ?? t,
        revenue: M.revenue(bucket),
        customers: M.activeUsers(bucket),
        aov: M.aov(bucket),
      }
    })
  if (segments.length === 0) segments.push({ tier: 'Silver', revenue: 0, customers: 0, aov: 0 })

  // ── Brand health ────────────────────────────────────
  const brandHealth: BrandHealth = {
    fullPrice: curr.filter((o) => !o.voucher_id).length,
    withVoucher: M.voucherOrders(curr),
  }

  // ── Voucher performance ─────────────────────────────
  const voucherAgg = new Map<
    string,
    { code: string; title: string; redeemed: number; discount: number; revenue: number }
  >()
  for (const o of curr) {
    if (!o.voucher_id || !o.voucher_code) continue
    const row = voucherAgg.get(o.voucher_id) ?? {
      code: o.voucher_code,
      title: o.voucher_title ?? o.voucher_code,
      redeemed: 0, discount: 0, revenue: 0,
    }
    row.redeemed += 1
    row.discount += Number(o.discount_amount ?? 0)
    row.revenue += Number(o.net_revenue ?? 0)
    voucherAgg.set(o.voucher_id, row)
  }
  let vouchers: VoucherPerformance[] = []
  if (voucherAgg.size > 0) {
    const ids = Array.from(voucherAgg.keys())
    const { data: issuedRaw } = await supabase
      .from('user_vouchers')
      .select('voucher_id')
      .in('voucher_id', ids)
    const issued = new Map<string, number>()
    for (const r of (issuedRaw ?? []) as Array<{ voucher_id: string }>) {
      issued.set(r.voucher_id, (issued.get(r.voucher_id) ?? 0) + 1)
    }
    vouchers = Array.from(voucherAgg, ([id, row]) => {
      const i = issued.get(id) ?? row.redeemed
      return {
        id,
        code: row.code,
        title: row.title,
        issued: i,
        redeemed: row.redeemed,
        redemptionRate: i > 0 ? Math.round((row.redeemed / i) * 1000) / 10 : 0,
        roi: row.discount > 0 ? Math.round((row.revenue / row.discount) * 10) / 10 : 0,
      }
    }).sort((a, b) => b.redeemed - a.redeemed)
  }

  // ── Referral funnel ─────────────────────────────────
  const { data: refRaw } = await supabase
    .from('referrals')
    .select('referred_id, created_at')
    .gte('created_at', currFilters.from ?? startOfDaysAgo(30))
  const refs = (refRaw ?? []) as Array<{ referred_id: string; created_at: string }>
  const refIds = new Set(refs.map((r) => r.referred_id))
  const refsOrdered = new Set(curr.filter((o) => refIds.has(o.user_id)).map((o) => o.user_id))
  const funnel: FunnelStage[] = [
    { stage: 'Invites sent', value: refs.length },
    { stage: 'Signed up', value: refIds.size },
    { stage: 'First order', value: refsOrdered.size },
  ]

  // ── Orders by hour ──────────────────────────────────
  const hours = Array.from({ length: 12 }, (_, i) => i + 10)
  const hourMap = M.groupByHour(curr)
  const ordersByHour: OrdersByHourPoint[] = hours.map((h) => {
    const bucket = hourMap.get(h) ?? []
    let pickup = 0, delivery = 0, dinein = 0
    for (const o of bucket) {
      if (o.channel === 'pickup') pickup += 1
      else if (o.channel === 'delivery') delivery += 1
      else if (o.channel === 'dinein') dinein += 1
    }
    return { hour: h, pickup, delivery, dinein }
  })

  // ── Top products ────────────────────────────────────
  const prodMap = new Map<string, { orders: number; revenue: number }>()
  for (const line of items) {
    const name = line.product_name ?? 'Unknown'
    const row = prodMap.get(name) ?? { orders: 0, revenue: 0 }
    row.orders += Number(line.quantity ?? 0)
    row.revenue += Number(line.line_revenue ?? 0)
    prodMap.set(name, row)
  }
  const topProducts: TopProduct[] = Array.from(prodMap, ([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)

  // ── Heatmap ─────────────────────────────────────────
  const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const heatmap: HeatmapPoint[] = []
  const counts = new Map<string, number>()
  for (const o of curr) {
    if (o.hour_of_day < 10 || o.hour_of_day > 21) continue
    // iso_dow: 1=Mon..7=Sun → index 0..6
    const dayIdx = Math.max(0, Math.min(6, (o.iso_dow ?? 1) - 1))
    const key = `${DAY_LABELS[dayIdx]}-${o.hour_of_day}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  for (const day of DAY_LABELS) {
    for (const hour of hours) {
      heatmap.push({ day, hour, value: counts.get(`${day}-${hour}`) ?? 0 })
    }
  }

  return { kpi, revenueSeries, stores, segments, brandHealth, vouchers, funnel, ordersByHour, topProducts, heatmap }
}

// ─────────────── Auth ───────────────

export async function requireStaff(supabase: Supa) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null as string | null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role?: string } | null }

  const role = profile?.role ?? 'customer'
  return { user, role }
}

// ─────────────── RFM ───────────────

export type RFMSegment =
  | 'Champions' | 'Loyal' | 'Potential Loyalists' | 'New Customers'
  | 'Promising' | 'Needs Attention' | 'At Risk' | 'Cannot Lose'
  | 'Hibernating' | 'Lost'

export interface CustomerRFM {
  userId: string
  name: string
  email: string
  tier: string
  lastOrderDate: string
  recencyDays: number
  frequency: number
  monetary: number
  rScore: number
  fScore: number
  mScore: number
  rfmScore: string
  segment: RFMSegment
}

export type ScoreBand = Partial<Record<number, { min: number; max: number }>>

export interface RFMData {
  customers: CustomerRFM[]
  segments: { name: RFMSegment; count: number; revenue: number; color: string }[]
  totals: {
    customers: number; champions: number; loyal: number; atRisk: number
    cannotLose: number; lost: number; totalRevenue: number
    championRevenue: number; atRiskRevenue: number
  }
  thresholds: { r: ScoreBand; f: ScoreBand; m: ScoreBand }
  avgRecencyDays: number
  avgFrequency: number
  avgMonetary: number
  sampleSize: number
  computedAt: string
}

export const SEGMENT_COLORS: Record<RFMSegment, string> = {
  'Champions': '#B8922A', 'Loyal': '#D4AC3A', 'Potential Loyalists': '#801237',
  'New Customers': '#4ECDC4', 'Promising': '#5BA3A0', 'Needs Attention': '#9B7653',
  'At Risk': '#C0392B', 'Cannot Lose': '#E74C3C', 'Hibernating': '#5C4A3A', 'Lost': '#3D2A20',
}

export function assignSegment(r: number, f: number, m: number): RFMSegment {
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions'
  if (r >= 2 && f >= 3 && m >= 3) return 'Loyal'
  if (r <= 1 && f >= 4)           return 'Cannot Lose'
  if (r <= 2 && f >= 2 && m >= 2) return 'At Risk'
  if (r >= 4 && f <= 1)           return 'New Customers'
  if (r >= 3 && f <= 3 && m >= 2) return 'Potential Loyalists'
  if (r >= 3 && f <= 2)           return 'Promising'
  if (r >= 2 && f >= 2)           return 'Needs Attention'
  if (r >= 2)                     return 'Hibernating'
  return 'Lost'
}

function getScoreRanges(values: number[], scores: number[]): ScoreBand {
  const bands: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] }
  values.forEach((v, i) => { bands[scores[i]]?.push(v) })
  const result: ScoreBand = {}
  for (let s = 1; s <= 5; s++) {
    const b = bands[s]
    if (b.length > 0) result[s] = { min: Math.min(...b), max: Math.max(...b) }
  }
  return result
}

export function quintileScores(values: number[], higherIsBetter: boolean): number[] {
  if (values.length === 0) return []
  const indexed = values.map((v, i) => ({ v, i }))
  const sorted = [...indexed].sort((a, b) => higherIsBetter ? a.v - b.v : b.v - a.v)
  const n = sorted.length
  const result = new Array(n).fill(1)
  sorted.forEach(({ i }, rank) => {
    result[i] = Math.min(5, Math.floor((rank / n) * 5) + 1)
  })
  return result
}

export async function getRFMData(_supabase: Supa): Promise<RFMData> {
  // Reads from v_customers_rfm (aggregation done in SQL). The Supa arg is
  // accepted for API symmetry but we use the admin client inside the helper
  // because v_customers_rfm joins profiles (RLS-protected).
  const rows = await fetchCustomersRFM()

  if (rows.length === 0) {
    return {
      customers: [], segments: [],
      totals: { customers: 0, champions: 0, loyal: 0, atRisk: 0, cannotLose: 0, lost: 0, totalRevenue: 0, championRevenue: 0, atRiskRevenue: 0 },
      thresholds: { r: {}, f: {}, m: {} },
      avgRecencyDays: 0, avgFrequency: 0, avgMonetary: 0,
      sampleSize: 0, computedAt: new Date().toISOString(),
    }
  }

  const recencies = rows.map((r) => r.recency_days)
  const frequencies = rows.map((r) => r.frequency)
  const monetaries = rows.map((r) => Number(r.monetary))

  const rScores = quintileScores(recencies, false)
  const fScores = quintileScores(frequencies, true)
  const mScores = quintileScores(monetaries, true)
  const rBands = getScoreRanges(recencies, rScores)
  const fBands = getScoreRanges(frequencies, fScores)
  const mBands = getScoreRanges(monetaries, mScores)

  const customers: CustomerRFM[] = rows.map((row, idx) => {
    const r = rScores[idx], f = fScores[idx], m = mScores[idx]
    return {
      userId: row.user_id,
      name: row.name || `User ${row.user_id.slice(-6).toUpperCase()}`,
      email: row.email ?? '',
      tier: row.tier ?? 'silver',
      lastOrderDate: row.last_order_at.slice(0, 10),
      recencyDays: row.recency_days,
      frequency: row.frequency,
      monetary: Number(row.monetary),
      rScore: r, fScore: f, mScore: m,
      rfmScore: `${r}${f}${m}`,
      segment: assignSegment(r, f, m),
    }
  })

  const segMap = new Map<RFMSegment, { count: number; revenue: number }>()
  for (const c of customers) {
    const s = segMap.get(c.segment) ?? { count: 0, revenue: 0 }
    s.count += 1
    s.revenue += c.monetary
    segMap.set(c.segment, s)
  }
  const segmentOrder: RFMSegment[] = [
    'Champions', 'Loyal', 'Potential Loyalists', 'New Customers',
    'Promising', 'Needs Attention', 'At Risk', 'Cannot Lose', 'Hibernating', 'Lost',
  ]
  const segments = segmentOrder
    .filter((n) => segMap.has(n))
    .map((name) => ({
      name, count: segMap.get(name)!.count,
      revenue: segMap.get(name)!.revenue, color: SEGMENT_COLORS[name],
    }))

  const champions  = customers.filter((c) => c.segment === 'Champions')
  const loyal      = customers.filter((c) => c.segment === 'Loyal')
  const atRisk     = customers.filter((c) => c.segment === 'At Risk')
  const cannotLose = customers.filter((c) => c.segment === 'Cannot Lose')
  const lost       = customers.filter((c) => c.segment === 'Lost')
  const totalRevenue = customers.reduce((s, c) => s + c.monetary, 0)

  return {
    customers: customers.sort((a, b) => b.monetary - a.monetary),
    segments,
    totals: {
      customers: customers.length,
      champions: champions.length, loyal: loyal.length, atRisk: atRisk.length,
      cannotLose: cannotLose.length, lost: lost.length,
      totalRevenue,
      championRevenue: champions.reduce((s, c) => s + c.monetary, 0),
      atRiskRevenue: atRisk.reduce((s, c) => s + c.monetary, 0),
    },
    thresholds: { r: rBands, f: fBands, m: mBands },
    avgRecencyDays: Math.round(recencies.reduce((a, b) => a + b, 0) / recencies.length),
    avgFrequency: Math.round((frequencies.reduce((a, b) => a + b, 0) / frequencies.length) * 10) / 10,
    avgMonetary: Math.round(monetaries.reduce((a, b) => a + b, 0) / monetaries.length),
    sampleSize: customers.length,
    computedAt: new Date().toISOString(),
  }
}

// Keep helper exported for callers that imported it from this module.
export { startOfDaysAgo }

// Expose Period type-level re-export + a small helper for backcompat
export type { EnrichedOrder }
