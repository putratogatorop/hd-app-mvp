import { createClient } from '@/lib/supabase/server'

type Supa = Awaited<ReturnType<typeof createClient>>

// ─────────────── Shared helpers ───────────────

function startOfDaysAgo(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// ─────────────── Overview ───────────────

export interface OverviewMetrics {
  ordersTotal: number
  ordersLast30: number
  revenueTotal: number
  revenueLast30: number
  giftShareLast30: number // 0-1
  avgOrderValue: number
  uniqueCustomersLast30: number
  splitLast30: { gift: number; self: number }
  dailyLast30: { date: string; orders: number; revenue: number; gifts: number }[]
}

export async function getOverviewMetrics(supabase: Supa): Promise<OverviewMetrics> {
  const since30 = startOfDaysAgo(30)

  const { data: allOrdersRaw } = await supabase
    .from('orders')
    .select('total_amount, is_gift, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(2000)

  const allOrders = (allOrdersRaw ?? []) as Array<{
    total_amount: number
    is_gift: boolean | null
    created_at: string
    user_id: string
  }>

  const ordersTotal = allOrders.length
  const revenueTotal = allOrders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)

  const last30 = allOrders.filter((o) => o.created_at >= since30)
  const ordersLast30 = last30.length
  const revenueLast30 = last30.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)
  const giftOrdersLast30 = last30.filter((o) => o.is_gift === true).length
  const giftShareLast30 = ordersLast30 > 0 ? giftOrdersLast30 / ordersLast30 : 0

  const avgOrderValue = ordersLast30 > 0 ? revenueLast30 / ordersLast30 : 0
  const uniqueCustomersLast30 = new Set(last30.map((o) => o.user_id)).size

  // Daily rollup
  const dailyMap = new Map<string, { orders: number; revenue: number; gifts: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    dailyMap.set(d.toISOString().slice(0, 10), { orders: 0, revenue: 0, gifts: 0 })
  }
  for (const o of last30) {
    const key = o.created_at.slice(0, 10)
    const row = dailyMap.get(key)
    if (!row) continue
    row.orders += 1
    row.revenue += Number(o.total_amount ?? 0)
    if (o.is_gift) row.gifts += 1
  }
  const dailyLast30 = Array.from(dailyMap, ([date, v]) => ({ date, ...v }))

  return {
    ordersTotal,
    ordersLast30,
    revenueTotal,
    revenueLast30,
    giftShareLast30,
    avgOrderValue,
    uniqueCustomersLast30,
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

export async function getGiftMetrics(supabase: Supa): Promise<GiftMetrics> {
  const since30 = startOfDaysAgo(30)

  const { data: giftsRaw } = await supabase
    .from('orders')
    .select('id, total_amount, created_at, user_id, scheduled_for, recipient_name, gift_message')
    .eq('is_gift', true)
    .order('created_at', { ascending: false })
    .limit(500)

  const gifts = (giftsRaw ?? []) as Array<{
    id: string
    total_amount: number
    created_at: string
    user_id: string
    scheduled_for: string | null
    recipient_name: string | null
    gift_message: string | null
  }>

  const giftsTotal = gifts.length
  const last30 = gifts.filter((g) => g.created_at >= since30)
  const giftsLast30 = last30.length
  const uniqueGiftersLast30 = new Set(last30.map((g) => g.user_id)).size
  const giftAOV =
    giftsLast30 > 0
      ? last30.reduce((s, g) => s + Number(g.total_amount ?? 0), 0) / giftsLast30
      : 0

  const nowIso = new Date().toISOString()
  const upcomingScheduled = gifts
    .filter((g) => g.scheduled_for && g.scheduled_for >= nowIso)
    .sort((a, b) => (a.scheduled_for ?? '').localeCompare(b.scheduled_for ?? ''))
    .slice(0, 10)
    .map((g) => ({
      id: g.id,
      recipient_name: g.recipient_name,
      scheduled_for: g.scheduled_for,
      total_amount: Number(g.total_amount ?? 0),
    }))

  const recentNotes = gifts
    .filter((g) => g.gift_message && g.gift_message.trim().length > 0)
    .slice(0, 5)
    .map((g) => ({ message: g.gift_message as string, created_at: g.created_at }))

  const byDay = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    byDay.set(d.toISOString().slice(0, 10), 0)
  }
  for (const g of last30) {
    const key = g.created_at.slice(0, 10)
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1)
  }
  const giftsByDay = Array.from(byDay, ([date, gifts]) => ({ date, gifts }))

  return {
    giftsTotal,
    giftsLast30,
    uniqueGiftersLast30,
    giftAOV,
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
  supabase: Supa
): Promise<TransactionalMetrics> {
  const since30 = startOfDaysAgo(30)

  const { data: selfOrdersRaw } = await supabase
    .from('orders')
    .select(
      'id, total_amount, created_at, user_id, order_mode, payment_method, order_items(quantity, unit_price, menu_item:menu_items(name))'
    )
    .or('is_gift.is.false,is_gift.is.null')
    .gte('created_at', since30)
    .order('created_at', { ascending: false })
    .limit(2000)

  const orders = (selfOrdersRaw ?? []) as Array<{
    id: string
    total_amount: number
    created_at: string
    user_id: string
    order_mode: string | null
    payment_method: string | null
    order_items: Array<{
      quantity: number
      unit_price: number
      menu_item: { name: string } | null
    }>
  }>

  const ordersLast30 = orders.length
  const revenueLast30 = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)
  const aov = ordersLast30 > 0 ? revenueLast30 / ordersLast30 : 0

  // Repeat rate: users with 2+ orders in window / total unique users in window
  const userCounts = new Map<string, number>()
  for (const o of orders) userCounts.set(o.user_id, (userCounts.get(o.user_id) ?? 0) + 1)
  const repeaters = Array.from(userCounts.values()).filter((n) => n >= 2).length
  const uniqueUsers = userCounts.size
  const repeatRate = uniqueUsers > 0 ? repeaters / uniqueUsers : 0

  const modeMap = new Map<string, { count: number; revenue: number }>()
  for (const o of orders) {
    const k = o.order_mode ?? 'unknown'
    const row = modeMap.get(k) ?? { count: 0, revenue: 0 }
    row.count += 1
    row.revenue += Number(o.total_amount ?? 0)
    modeMap.set(k, row)
  }
  const modeBreakdown = Array.from(modeMap, ([mode, v]) => ({ mode, ...v }))

  const payMap = new Map<string, number>()
  for (const o of orders) {
    const k = o.payment_method ?? 'unknown'
    payMap.set(k, (payMap.get(k) ?? 0) + 1)
  }
  const paymentBreakdown = Array.from(payMap, ([method, count]) => ({ method, count }))

  const itemMap = new Map<string, { qty: number; revenue: number }>()
  for (const o of orders) {
    for (const line of o.order_items ?? []) {
      const name = line.menu_item?.name ?? 'Unknown'
      const row = itemMap.get(name) ?? { qty: 0, revenue: 0 }
      row.qty += line.quantity
      row.revenue += line.quantity * Number(line.unit_price ?? 0)
      itemMap.set(name, row)
    }
  }
  const topItems = Array.from(itemMap, ([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  const byDay = new Map<string, { orders: number; revenue: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    byDay.set(d.toISOString().slice(0, 10), { orders: 0, revenue: 0 })
  }
  for (const o of orders) {
    const key = o.created_at.slice(0, 10)
    const row = byDay.get(key)
    if (!row) continue
    row.orders += 1
    row.revenue += Number(o.total_amount ?? 0)
  }
  const dailyLast30 = Array.from(byDay, ([date, v]) => ({ date, ...v }))

  return {
    ordersLast30,
    revenueLast30,
    aov,
    repeatRate,
    modeBreakdown,
    paymentBreakdown,
    topItems,
    dailyLast30,
  }
}

// ─────────────── Overview (real data replacement for dummy) ───────────────

import type {
  KPIMetric,
  KPIData,
  RevenueTimePoint,
  StoreRevenue,
  HeatmapPoint,
  CustomerSegment,
  VoucherPerformance,
  FunnelStage,
  OrdersByHourPoint,
  TopProduct,
  BrandHealth,
} from './dummy-data'

export type Period = '7d' | '30d' | '90d'

function periodDays(p: Period): number {
  return p === '7d' ? 7 : p === '90d' ? 90 : 30
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 1000) / 10
}

function buildSparkline(byDay: Map<string, number>): number[] {
  return Array.from(byDay.values())
}

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
  period: Period
): Promise<RealOverviewData> {
  const days = periodDays(period)
  const sinceCurr = startOfDaysAgo(days)
  const sincePrev = startOfDaysAgo(days * 2)

  // Pull enough orders for current + previous window
  const { data: ordersRaw } = await supabase
    .from('orders')
    .select(
      'id, total_amount, discount_amount, created_at, user_id, order_mode, store_id, voucher_id, payment_method, is_gift, order_items(quantity, unit_price, menu_item:menu_items(name)), store:stores(name), voucher:vouchers(code, title, discount_type, discount_value), profile:profiles!user_id(tier)'
    )
    .gte('created_at', sincePrev)
    .order('created_at', { ascending: false })
    .limit(5000)

  type OrderRow = {
    id: string
    total_amount: number
    discount_amount: number | null
    created_at: string
    user_id: string
    order_mode: string | null
    store_id: string | null
    voucher_id: string | null
    payment_method: string | null
    is_gift: boolean | null
    order_items: Array<{
      quantity: number
      unit_price: number
      menu_item: { name: string } | null
    }>
    store: { name: string } | null
    voucher: {
      code: string
      title: string
      discount_type: string
      discount_value: number
    } | null
    profile: { tier: string } | null
  }

  const orders = (ordersRaw ?? []) as OrderRow[]
  const curr = orders.filter((o) => o.created_at >= sinceCurr)
  const prev = orders.filter((o) => o.created_at >= sincePrev && o.created_at < sinceCurr)

  // ─── KPIs with prev-period deltas ───
  const revCurr = curr.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)
  const revPrev = prev.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)
  const aovCurr = curr.length > 0 ? revCurr / curr.length : 0
  const aovPrev = prev.length > 0 ? revPrev / prev.length : 0
  const activeCurr = new Set(curr.map((o) => o.user_id)).size
  const activePrev = new Set(prev.map((o) => o.user_id)).size
  const voucherOrdersCurr = curr.filter((o) => o.voucher_id).length
  const voucherRateCurr = curr.length > 0 ? (voucherOrdersCurr / curr.length) * 100 : 0
  const voucherOrdersPrev = prev.filter((o) => o.voucher_id).length
  const voucherRatePrev = prev.length > 0 ? (voucherOrdersPrev / prev.length) * 100 : 0

  // Referrals in period
  const { count: referralsCurr } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sinceCurr)
  const { count: referralsPrev } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sincePrev)
    .lt('created_at', sinceCurr)

  // Daily rollups for sparklines
  const daysArr: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    daysArr.push(d.toISOString().slice(0, 10))
  }
  const revByDay = new Map(daysArr.map((d) => [d, 0]))
  const ordByDay = new Map(daysArr.map((d) => [d, 0]))
  const usersByDay = new Map(daysArr.map((d) => [d, new Set<string>()]))
  const aovByDay = new Map(daysArr.map((d) => [d, 0]))
  const voucherByDay = new Map(daysArr.map((d) => [d, 0]))
  for (const o of curr) {
    const k = o.created_at.slice(0, 10)
    if (!revByDay.has(k)) continue
    revByDay.set(k, (revByDay.get(k) ?? 0) + Number(o.total_amount ?? 0))
    ordByDay.set(k, (ordByDay.get(k) ?? 0) + 1)
    usersByDay.get(k)?.add(o.user_id)
    if (o.voucher_id) voucherByDay.set(k, (voucherByDay.get(k) ?? 0) + 1)
  }
  revByDay.forEach((rev, k) => {
    const ords = ordByDay.get(k) ?? 0
    aovByDay.set(k, ords > 0 ? rev / ords : 0)
  })
  const activeByDay = new Map<string, number>()
  usersByDay.forEach((set, k) => activeByDay.set(k, set.size))
  const voucherRateByDay = new Map<string, number>()
  voucherByDay.forEach((count, k) => {
    const ords = ordByDay.get(k) ?? 0
    voucherRateByDay.set(k, ords > 0 ? (count / ords) * 100 : 0)
  })

  const mk = (current: number, previous: number, spark: number[]): KPIMetric => ({
    current,
    previousValue: previous,
    changePercent: pctChange(current, previous),
    sparklineData: spark.length > 0 ? spark : [0],
  })

  const kpi: KPIData = {
    revenue: mk(revCurr, revPrev, buildSparkline(revByDay)),
    orders: mk(curr.length, prev.length, buildSparkline(ordByDay)),
    activeMembers: mk(activeCurr, activePrev, buildSparkline(activeByDay)),
    aov: mk(aovCurr, aovPrev, buildSparkline(aovByDay)),
    voucherRedemptionRate: mk(
      Math.round(voucherRateCurr * 10) / 10,
      Math.round(voucherRatePrev * 10) / 10,
      buildSparkline(voucherRateByDay)
    ),
    referralConversions: mk(
      referralsCurr ?? 0,
      referralsPrev ?? 0,
      daysArr.map(() => 0)
    ),
  }

  // ─── Revenue by channel (stacked daily) ───
  const modeByDay = new Map<string, { pickup: number; delivery: number; dinein: number }>()
  for (const d of daysArr) modeByDay.set(d, { pickup: 0, delivery: 0, dinein: 0 })
  for (const o of curr) {
    const k = o.created_at.slice(0, 10)
    const row = modeByDay.get(k)
    if (!row) continue
    const amt = Number(o.total_amount ?? 0)
    if (o.order_mode === 'pickup') row.pickup += amt
    else if (o.order_mode === 'delivery') row.delivery += amt
    else if (o.order_mode === 'dinein') row.dinein += amt
  }
  const revenueSeries: RevenueTimePoint[] = Array.from(modeByDay, ([date, v]) => ({
    date,
    ...v,
  }))

  // ─── Stores ───
  const storeMap = new Map<string, { store: string; revenue: number; orders: number }>()
  for (const o of curr) {
    const name = o.store?.name ?? 'Unassigned'
    const row = storeMap.get(name) ?? { store: name, revenue: 0, orders: 0 }
    row.revenue += Number(o.total_amount ?? 0)
    row.orders += 1
    storeMap.set(name, row)
  }
  const storePrevMap = new Map<string, number>()
  for (const o of prev) {
    const name = o.store?.name ?? 'Unassigned'
    storePrevMap.set(name, (storePrevMap.get(name) ?? 0) + Number(o.total_amount ?? 0))
  }
  const stores: StoreRevenue[] = Array.from(storeMap.values()).map((s) => ({
    ...s,
    aov: s.orders > 0 ? s.revenue / s.orders : 0,
    growth: pctChange(s.revenue, storePrevMap.get(s.store) ?? 0),
  }))

  // ─── Customer tiers — read from embedded profile join (avoids RLS on a separate profiles query) ───
  const tierMap = new Map<string, { revenue: number; customers: Set<string>; orders: number }>()
  for (const o of curr) {
    const tier = o.profile?.tier ?? 'silver'
    const row = tierMap.get(tier) ?? { revenue: 0, customers: new Set(), orders: 0 }
    row.revenue += Number(o.total_amount ?? 0)
    row.customers.add(o.user_id)
    row.orders += 1
    tierMap.set(tier, row)
  }
  const TIER_ORDER = ['platinum', 'gold', 'silver']
  const TIER_LABEL: Record<string, string> = { silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }
  const segments: CustomerSegment[] = TIER_ORDER.filter((t) => tierMap.has(t)).map((t) => {
    const row = tierMap.get(t)!
    return {
      tier: TIER_LABEL[t] ?? t,
      revenue: row.revenue,
      customers: row.customers.size,
      aov: row.orders > 0 ? row.revenue / row.orders : 0,
    }
  })
  if (segments.length === 0) segments.push({ tier: 'Silver', revenue: 0, customers: 0, aov: 0 })

  // ─── Brand health ───
  const brandHealth: BrandHealth = {
    fullPrice: curr.filter((o) => !o.voucher_id).length,
    withVoucher: voucherOrdersCurr,
  }

  // ─── Voucher performance ───
  const voucherAgg = new Map<
    string,
    { code: string; title: string; redeemed: number; discount: number; revenue: number }
  >()
  for (const o of curr) {
    if (!o.voucher || !o.voucher_id) continue
    const row = voucherAgg.get(o.voucher_id) ?? {
      code: o.voucher.code,
      title: o.voucher.title,
      redeemed: 0,
      discount: 0,
      revenue: 0,
    }
    row.redeemed += 1
    row.discount += Number(o.discount_amount ?? 0)
    row.revenue += Number(o.total_amount ?? 0)
    voucherAgg.set(o.voucher_id, row)
  }
  // Pull issued counts from user_vouchers
  let vouchers: VoucherPerformance[] = []
  if (voucherAgg.size > 0) {
    const voucherIds = Array.from(voucherAgg.keys())
    const { data: issuedRaw } = await supabase
      .from('user_vouchers')
      .select('voucher_id')
      .in('voucher_id', voucherIds)
    const issuedCounts = new Map<string, number>()
    for (const r of (issuedRaw ?? []) as Array<{ voucher_id: string }>) {
      issuedCounts.set(r.voucher_id, (issuedCounts.get(r.voucher_id) ?? 0) + 1)
    }
    vouchers = Array.from(voucherAgg, ([id, row]) => {
      const issued = issuedCounts.get(id) ?? row.redeemed
      const redemptionRate = issued > 0 ? Math.round((row.redeemed / issued) * 1000) / 10 : 0
      const roi = row.discount > 0 ? Math.round((row.revenue / row.discount) * 10) / 10 : 0
      return {
        code: row.code,
        title: row.title,
        issued,
        redeemed: row.redeemed,
        redemptionRate,
        roi,
      }
    }).sort((a, b) => b.redeemed - a.redeemed)
  }

  // ─── Referral funnel (approximation from referrals + orders) ───
  const { data: refRaw } = await supabase
    .from('referrals')
    .select('referred_id, created_at')
    .gte('created_at', sinceCurr)
  const refs = (refRaw ?? []) as Array<{ referred_id: string; created_at: string }>
  const refIds = new Set(refs.map((r) => r.referred_id))
  const refsWhoOrdered = new Set(curr.filter((o) => refIds.has(o.user_id)).map((o) => o.user_id))
  const funnel: FunnelStage[] = [
    { stage: 'Invites sent', value: refs.length },
    { stage: 'Signed up', value: refIds.size },
    { stage: 'First order', value: refsWhoOrdered.size },
  ]

  // ─── Orders by hour (stacked by mode) ───
  const hours = Array.from({ length: 12 }, (_, i) => i + 10) // 10:00–21:00
  const hourMap = new Map<number, { pickup: number; delivery: number; dinein: number }>()
  for (const h of hours) hourMap.set(h, { pickup: 0, delivery: 0, dinein: 0 })
  for (const o of curr) {
    const h = new Date(o.created_at).getHours()
    const row = hourMap.get(h)
    if (!row) continue
    if (o.order_mode === 'pickup') row.pickup += 1
    else if (o.order_mode === 'delivery') row.delivery += 1
    else if (o.order_mode === 'dinein') row.dinein += 1
  }
  const ordersByHour: OrdersByHourPoint[] = Array.from(hourMap, ([hour, v]) => ({ hour, ...v }))

  // ─── Top products ───
  const prodMap = new Map<string, { orders: number; revenue: number }>()
  for (const o of curr) {
    for (const line of o.order_items ?? []) {
      const name = line.menu_item?.name ?? 'Unknown'
      const row = prodMap.get(name) ?? { orders: 0, revenue: 0 }
      row.orders += line.quantity
      row.revenue += line.quantity * Number(line.unit_price ?? 0)
      prodMap.set(name, row)
    }
  }
  const topProducts: TopProduct[] = Array.from(prodMap, ([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)

  // ─── Heatmap (Mon-Sun × 10:00-21:00) ───
  const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const heatmap: HeatmapPoint[] = []
  const heatMap = new Map<string, number>()
  for (const o of curr) {
    const d = new Date(o.created_at)
    const dow = (d.getDay() + 6) % 7 // Mon=0
    const hour = d.getHours()
    if (hour < 10 || hour > 21) continue
    const key = `${DAY_LABELS[dow]}-${hour}`
    heatMap.set(key, (heatMap.get(key) ?? 0) + 1)
  }
  for (const day of DAY_LABELS) {
    for (const hour of hours) {
      heatmap.push({ day, hour, value: heatMap.get(`${day}-${hour}`) ?? 0 })
    }
  }

  return {
    kpi,
    revenueSeries,
    stores,
    segments,
    brandHealth,
    vouchers,
    funnel,
    ordersByHour,
    topProducts,
    heatmap,
  }
}

// ─────────────── Auth check ───────────────

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
