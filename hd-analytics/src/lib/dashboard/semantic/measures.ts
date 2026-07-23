// Measure registry — every metric the dashboards render is defined here, once.
// Pure functions over an array of EnrichedOrder rows (already filtered by
// fetchEnrichedOrders). Dashboards call these instead of rolling their own
// sum/count/avg loops.

import type { EnrichedOrder, EnrichedOrderItem } from './types'

const n = (v: unknown) => Number(v ?? 0)

// ── Scalar measures ──────────────────────────────────────────────────
export const revenue = (rows: EnrichedOrder[]): number =>
  rows.reduce((s, o) => s + n(o.net_revenue), 0)

export const grossRevenue = (rows: EnrichedOrder[]): number =>
  rows.reduce((s, o) => s + n(o.gross_revenue), 0)

export const discountTotal = (rows: EnrichedOrder[]): number =>
  rows.reduce((s, o) => s + n(o.discount_amount), 0)

export const orderCount = (rows: EnrichedOrder[]): number => rows.length

export const aov = (rows: EnrichedOrder[]): number =>
  rows.length > 0 ? revenue(rows) / rows.length : 0

export const activeUsers = (rows: EnrichedOrder[]): number =>
  new Set(rows.map((o) => o.user_id)).size

export const voucherOrders = (rows: EnrichedOrder[]): number =>
  rows.filter((o) => !!o.voucher_id).length

export const voucherRate = (rows: EnrichedOrder[]): number =>
  rows.length > 0 ? (voucherOrders(rows) / rows.length) * 100 : 0

export const giftOrders = (rows: EnrichedOrder[]): number =>
  rows.filter((o) => o.is_gift).length

export const giftShare = (rows: EnrichedOrder[]): number =>
  rows.length > 0 ? giftOrders(rows) / rows.length : 0

/** Repeat rate: users with ≥2 orders in window ÷ unique users in window. */
export function repeatRate(rows: EnrichedOrder[]): number {
  const counts = new Map<string, number>()
  for (const o of rows) counts.set(o.user_id, (counts.get(o.user_id) ?? 0) + 1)
  const uniq = counts.size
  if (uniq === 0) return 0
  let repeaters = 0
  counts.forEach((c) => { if (c >= 2) repeaters++ })
  return repeaters / uniq
}

// ── Helpers for period-over-period deltas ────────────────────────────
export function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 1000) / 10
}

// ── Grouping utilities ───────────────────────────────────────────────
/** Bucket rows by YYYY-MM-DD using created_at. */
export function groupByDay<T extends { created_at: string }>(
  rows: T[],
): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const r of rows) {
    const k = r.created_at.slice(0, 10)
    const arr = m.get(k)
    if (arr) arr.push(r)
    else m.set(k, [r])
  }
  return m
}

/** Bucket rows by hour-of-day (0–23). */
export function groupByHour(rows: EnrichedOrder[]): Map<number, EnrichedOrder[]> {
  const m = new Map<number, EnrichedOrder[]>()
  for (const r of rows) {
    const h = r.hour_of_day
    const arr = m.get(h)
    if (arr) arr.push(r)
    else m.set(h, [r])
  }
  return m
}

/** Bucket rows by a custom key function. */
export function groupBy<T, K>(rows: T[], keyFn: (r: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>()
  for (const r of rows) {
    const k = keyFn(r)
    const arr = m.get(k)
    if (arr) arr.push(r)
    else m.set(k, [r])
  }
  return m
}

// ── Line-item measures (over EnrichedOrderItem) ──────────────────────
export const lineRevenue = (rows: EnrichedOrderItem[]): number =>
  rows.reduce((s, r) => s + n(r.line_revenue), 0)

export const lineQuantity = (rows: EnrichedOrderItem[]): number =>
  rows.reduce((s, r) => s + n(r.quantity), 0)
