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
  const giftOrdersLast30 = last30.filter((o) => o.is_gift).length
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
    .eq('is_gift', false)
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
