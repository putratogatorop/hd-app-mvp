// Synthetic "raw orders" dataset — the one thing every analytics page is built
// on top of (mirrors what v_orders_enriched / v_order_items_enriched would
// return from Supabase in production). Deterministic: same seed every load,
// so the dashboard looks identical across builds/browsers.
//
// Generated at module-load time relative to the real "now", so period
// filters (7d/30d/90d) line up naturally with whatever day it is.

import type { EnrichedOrder, EnrichedOrderItem, Channel, Tier } from '@/lib/dashboard/semantic/types'
import { STORES } from './stores.fixture'

// ── Deterministic PRNG (mulberry32) — no Math.random anywhere below ──────
function mulberry32(seed: number) {
  let s = seed
  return function rand(): number {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260722)

function weightedPick<T>(items: T[], weightFn: (t: T) => number): T {
  const total = items.reduce((s, i) => s + weightFn(i), 0)
  let r = rand() * total
  for (const item of items) {
    r -= weightFn(item)
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

// ── Customers ──────────────────────────────────────────────────────────
export interface CustomerFixture {
  id: string
  name: string
  email: string
  tier: Tier
}

const FIRST_NAMES = [
  'Andi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hendra', 'Indah', 'Joko',
  'Kartika', 'Lestari', 'Made', 'Nadia', 'Oki', 'Putri', 'Rahmat', 'Siti', 'Taufik', 'Umar',
  'Vina', 'Wahyu', 'Yudi', 'Zahra', 'Agus', 'Bella', 'Cahyo', 'Dian', 'Erna', 'Fitri',
  'Gunawan', 'Hana', 'Ivan', 'Jihan', 'Krisna', 'Lina', 'Mira', 'Nita', 'Omar', 'Pandu',
]
const LAST_NAMES = [
  'Saputra', 'Wijaya', 'Kusuma', 'Pratama', 'Santoso', 'Wibowo', 'Hidayat', 'Setiawan',
  'Permadi', 'Kurniawan', 'Halim', 'Susanto', 'Gunawan', 'Rahmawati', 'Anggraini',
  'Pertiwi', 'Yulianto', 'Suryadi', 'Nugroho', 'Firmansyah',
]

const NUM_CUSTOMERS = 420

const rawCustomers = Array.from({ length: NUM_CUSTOMERS }, (_, i) => {
  const first = FIRST_NAMES[i % FIRST_NAMES.length]
  const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]
  const name = `${first} ${last}`
  const email = `${first}.${last}${i}@example.com`.toLowerCase()
  const r = rand()
  // Power-law-ish propensity so RFM segments come out varied instead of flat.
  const propensity =
    r < 0.05 ? 6 + rand() * 6 :
    r < 0.20 ? 2.5 + rand() * 3 :
    r < 0.70 ? 0.8 + rand() * 1.5 :
    0.15 + rand() * 0.6
  return { id: `usr-${String(i + 1).padStart(3, '0')}`, name, email, propensity }
})

const platinumCount = Math.round(NUM_CUSTOMERS * 0.10)
const goldCount = Math.round(NUM_CUSTOMERS * 0.30)
const byPropensity = [...rawCustomers].sort((a, b) => b.propensity - a.propensity)
const tierByUserId = new Map<string, Tier>()
byPropensity.forEach((c, idx) => {
  tierByUserId.set(c.id, idx < platinumCount ? 'platinum' : idx < platinumCount + goldCount ? 'gold' : 'silver')
})

export const CUSTOMERS: CustomerFixture[] = rawCustomers.map((c) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  tier: tierByUserId.get(c.id)!,
}))
const customerById = new Map(CUSTOMERS.map((c) => [c.id, c]))
const propensityByUserId = new Map(rawCustomers.map((c) => [c.id, c.propensity]))

// ── Products ───────────────────────────────────────────────────────────
interface ProductFixture { name: string; category: string; price: number }
export const PRODUCTS: ProductFixture[] = [
  { name: 'Belgian Chocolate Pint', category: 'Pint', price: 54_000 },
  { name: 'Strawberry Cheesecake Pint', category: 'Pint', price: 54_000 },
  { name: 'Vanilla Swiss Almond Pint', category: 'Pint', price: 55_000 },
  { name: 'Macadamia Nut Brittle Pint', category: 'Pint', price: 56_000 },
  { name: 'Cookies & Cream Pint', category: 'Pint', price: 54_000 },
  { name: 'Matcha Green Tea Pint', category: 'Pint', price: 55_000 },
  { name: 'Mango Sorbet (500ml)', category: 'Sorbet', price: 45_000 },
  { name: 'Belgian Chocolate Single', category: 'Single Scoop', price: 35_000 },
  { name: 'Triple Chocolate Sundae', category: 'Sundae', price: 50_000 },
  { name: 'Ice Cream Cake 8"', category: 'Cake', price: 150_000 },
]

// ── Vouchers ───────────────────────────────────────────────────────────
export interface VoucherFixture {
  id: string; code: string; title: string
  discount_type: 'percentage' | 'fixed'; discount_value: number; weight: number
  /** Approximates the "issued" count when there's no user_vouchers table to query: issued ≈ redeemed / hint. */
  redemptionRateHint: number
}
export const VOUCHERS: VoucherFixture[] = [
  { id: 'v-freeongkir', code: 'FREEONGKIR', title: 'Free Ongkos Kirim', discount_type: 'fixed', discount_value: 15_000, weight: 0.30, redemptionRateHint: 0.70 },
  { id: 'v-hdwelcome', code: 'HDWELCOME', title: 'Welcome Discount 15%', discount_type: 'percentage', discount_value: 15, weight: 0.22, redemptionRateHint: 0.55 },
  { id: 'v-flash20', code: 'FLASH20', title: 'Flash Sale 20% Off', discount_type: 'percentage', discount_value: 20, weight: 0.28, redemptionRateHint: 0.75 },
  { id: 'v-hdloyalty', code: 'HDLOYALTY', title: 'Loyalty Bonus Double Points', discount_type: 'percentage', discount_value: 10, weight: 0.12, redemptionRateHint: 0.80 },
  { id: 'v-referral10', code: 'REFERRAL10', title: 'Referral Reward 10%', discount_type: 'percentage', discount_value: 10, weight: 0.08, redemptionRateHint: 0.532 },
]

const GIFT_MESSAGES = [
  'Happy birthday! Semoga hari-harimu semanis ini 🎂',
  'Congrats on the promotion — you earned it!',
  'Just because. Miss you lots.',
  'Selamat ulang tahun pernikahan, sayang ❤️',
  'Get well soon, semoga cepat pulih!',
  'Thank you for always being there for me.',
]

const CHANNEL_WEIGHTS: Record<Channel, number> = { pickup: 0.55, delivery: 0.30, dinein: 0.15 }
const PAYMENT_METHODS = ['cash', 'card', 'ewallet', 'qris']
const PAYMENT_WEIGHTS = [0.25, 0.30, 0.30, 0.15]
const HOUR_WEIGHTS: Record<number, number> = {
  9: 0.25, 10: 0.35, 11: 0.55, 12: 1.0, 13: 1.05, 14: 0.55, 15: 0.45,
  16: 0.55, 17: 0.75, 18: 0.95, 19: 1.15, 20: 1.25, 21: 1.05, 22: 0.5,
}
const DOW_WEIGHTS: Record<number, number> = { 1: 0.7, 2: 0.5, 3: 0.5, 4: 0.7, 5: 0.9, 6: 1.0, 7: 0.95 }

const WINDOW_DAYS = 120
const TOTAL_BASE_ORDERS_PER_DAY = 17

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function isoDow(d: Date): number {
  const jsDay = d.getDay() // 0=Sun..6=Sat
  return jsDay === 0 ? 7 : jsDay
}

const ORDERS_: EnrichedOrder[] = []
const ORDER_ITEMS_: EnrichedOrderItem[] = []
let orderSeq = 0
let itemSeq = 0

const now = new Date()

for (let t = 0; t < WINDOW_DAYS; t++) {
  const daysAgo = WINDOW_DAYS - 1 - t
  const day = new Date(now)
  day.setHours(0, 0, 0, 0)
  day.setDate(day.getDate() - daysAgo)
  const dow = isoDow(day)
  const dowWeight = DOW_WEIGHTS[dow] ?? 0.7

  for (const store of STORES) {
    // t goes 0 (120 days ago) -> WINDOW_DAYS-1 (today); store.trend describes
    // where the store ends up relative to where it started.
    const progress = t / (WINDOW_DAYS - 1)
    const trendFactor = lerp(2 - store.trend, store.trend, progress)
    const expected = TOTAL_BASE_ORDERS_PER_DAY * store.weight * trendFactor * dowWeight
    const jitter = 0.8 + rand() * 0.4
    const count = Math.max(0, Math.round(expected * jitter))

    for (let i = 0; i < count; i++) {
      const hour = Number(weightedPick(Object.keys(HOUR_WEIGHTS), (h) => HOUR_WEIGHTS[Number(h)]))
      const minute = Math.floor(rand() * 60)
      const createdAt = new Date(day)
      createdAt.setHours(hour, minute, Math.floor(rand() * 60))

      const customer = weightedPick(CUSTOMERS, (c) => propensityByUserId.get(c.id) ?? 1)
      const channel = weightedPick(Object.keys(CHANNEL_WEIGHTS) as Channel[], (c) => CHANNEL_WEIGHTS[c])
      const isGift = rand() < 0.16
      const isCancelled = rand() < 0.04
      const paymentMethod = weightedPick(PAYMENT_METHODS, (m) => PAYMENT_WEIGHTS[PAYMENT_METHODS.indexOf(m)])

      // ── Line items (generated first — gross_revenue is derived from these) ──
      const itemCount = rand() < 0.6 ? 1 : rand() < 0.75 ? 2 : 3
      const orderId = `ord-${String(++orderSeq).padStart(6, '0')}`
      let grossRevenue = 0
      for (let li = 0; li < itemCount; li++) {
        const productIdx = weightedPick(PRODUCTS.map((_, idx) => idx), (idx) => 10 - idx)
        const product = PRODUCTS[productIdx]
        const quantity = rand() < 0.8 ? 1 : 2
        const lineRevenue = product.price * quantity
        grossRevenue += lineRevenue
        ORDER_ITEMS_.push({
          order_item_id: `item-${String(++itemSeq).padStart(7, '0')}`,
          order_id: orderId,
          menu_item_id: product.name,
          product_name: product.name,
          product_category: product.category,
          quantity,
          unit_price: product.price,
          line_revenue: lineRevenue,
          created_at: createdAt.toISOString(),
          user_id: customer.id,
          store_id: store.id,
          channel,
          is_gift: isGift,
          status: isCancelled ? 'cancelled' : 'completed',
          voucher_id: null,
          tier: customer.tier,
        })
      }

      const hasVoucher = rand() < 0.18
      const voucher = hasVoucher ? weightedPick(VOUCHERS, (v) => v.weight) : null
      const discountAmount = voucher
        ? Math.min(
            grossRevenue,
            voucher.discount_type === 'percentage'
              ? Math.round(grossRevenue * (voucher.discount_value / 100))
              : voucher.discount_value,
          )
        : 0
      const deliveryFee = channel === 'delivery' ? 10_000 + Math.floor(rand() * 8_000) : 0
      const netRevenue = grossRevenue - discountAmount + deliveryFee

      ORDERS_.push({
        order_id: orderId,
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString(),
        scheduled_for: isGift && rand() < 0.3
          ? new Date(createdAt.getTime() + (1 + Math.floor(rand() * 10)) * 24 * 3600 * 1000).toISOString()
          : null,
        status: isCancelled ? 'cancelled' : 'completed',
        user_id: customer.id,
        store_id: store.id,
        store_name: store.name,
        channel,
        is_gift: isGift,
        payment_method: paymentMethod,
        voucher_id: voucher?.id ?? null,
        voucher_code: voucher?.code ?? null,
        voucher_title: voucher?.title ?? null,
        voucher_discount_type: voucher?.discount_type ?? null,
        voucher_discount_value: voucher?.discount_value ?? null,
        gross_revenue: grossRevenue,
        discount_amount: discountAmount,
        delivery_fee: deliveryFee,
        net_revenue: netRevenue,
        points_earned: Math.floor(grossRevenue / 10_000),
        table_number: channel === 'dinein' ? String(1 + Math.floor(rand() * 20)) : null,
        tier: customer.tier,
        customer_name: customer.name,
        customer_email: customer.email,
        recipient_name: isGift ? weightedPick(CUSTOMERS, () => 1).name : null,
        gift_message: isGift ? GIFT_MESSAGES[Math.floor(rand() * GIFT_MESSAGES.length)] : null,
        hour_of_day: hour,
        iso_dow: dow,
      })
    }
  }
}

export const ORDERS: EnrichedOrder[] = ORDERS_
export const ORDER_ITEMS: EnrichedOrderItem[] = ORDER_ITEMS_

// ── Referrals — separate, smaller table; feeds the Overview funnel/KPI ───
export interface ReferralFixture { referred_id: string; created_at: string }
export const REFERRALS: ReferralFixture[] = Array.from({ length: 560 }, () => {
  const daysAgo = Math.floor(rand() * WINDOW_DAYS)
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(Math.floor(rand() * 24), Math.floor(rand() * 60))
  const referred = CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)]
  return { referred_id: referred.id, created_at: d.toISOString() }
})

export function findCustomer(userId: string): CustomerFixture | undefined {
  return customerById.get(userId)
}
