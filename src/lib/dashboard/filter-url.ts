// Canonical URL contract for all analytics dashboards.
// Every page's filter state lives in the URL — shareable, bookmarkable,
// back/forward friendly (the Looker/PBI "permalink" property).

import {
  filtersFromPeriod,
  startOfDaysAgo,
  type Filters,
  type Period,
  type Channel,
  type Tier,
} from './semantic'

const CHANNELS: Channel[] = ['pickup', 'delivery', 'dinein']
const TIERS: Tier[] = ['silver', 'gold', 'platinum']

export type PeriodOrCustom = Period | 'custom'

export interface ParsedFilterState {
  filters: Filters
  period: PeriodOrCustom
  /** Raw from/to as YYYY-MM-DD — useful for the date-range picker display. */
  fromDate: string
  toDate: string
}

function isPeriod(v: string | undefined): v is Period {
  return v === '7d' || v === '30d' || v === '90d'
}

function splitList(v: string | undefined): string[] {
  if (!v) return []
  return v.split(',').map((s) => s.trim()).filter(Boolean)
}

function toIsoDateStart(d: string): string {
  // Treat bare YYYY-MM-DD as start of that local day.
  const dt = new Date(d + 'T00:00:00')
  return isNaN(dt.getTime()) ? '' : dt.toISOString()
}

function toIsoDateEnd(d: string): string {
  // Treat bare YYYY-MM-DD as *end* of that day (exclusive upper bound = next day 00:00).
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt.getTime())) return ''
  dt.setDate(dt.getDate() + 1)
  return dt.toISOString()
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoDate(n: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Parse Next.js searchParams (plain record) into a canonical filter state. */
export function parseFilterSearchParams(
  sp: Record<string, string | string[] | undefined>,
): ParsedFilterState {
  const get = (k: string): string | undefined => {
    const v = sp[k]
    return Array.isArray(v) ? v[0] : v
  }

  const rawPeriod = get('period')
  const rawFrom = get('from')
  const rawTo = get('to')

  let period: PeriodOrCustom
  let fromDate: string
  let toDate: string

  if (rawFrom && rawTo) {
    period = 'custom'
    fromDate = rawFrom
    toDate = rawTo
  } else if (isPeriod(rawPeriod)) {
    period = rawPeriod
    const days = rawPeriod === '7d' ? 7 : rawPeriod === '90d' ? 90 : 30
    fromDate = daysAgoDate(days)
    toDate = today()
  } else {
    period = '30d'
    fromDate = daysAgoDate(30)
    toDate = today()
  }

  const stores = splitList(get('stores'))
  const channels = splitList(get('channels')).filter((c): c is Channel =>
    CHANNELS.includes(c as Channel),
  )
  const tiers = splitList(get('tiers')).filter((t): t is Tier =>
    TIERS.includes(t as Tier),
  )
  const rawGift = get('gift')
  const isGift =
    rawGift === 'true' ? true : rawGift === 'false' ? false : undefined

  const filters: Filters = {
    from: toIsoDateStart(fromDate),
    to: toIsoDateEnd(toDate),
    storeIds: stores.length > 0 ? stores : undefined,
    channels: channels.length > 0 ? channels : undefined,
    tiers: tiers.length > 0 ? tiers : undefined,
    isGift,
    excludeCancelled: true,
  }

  return { filters, period, fromDate, toDate }
}

/** Build the window pair (curr/prev) from a parsed state, for KPI deltas. */
export function windowsFromState(state: ParsedFilterState): { curr: Filters; prev: Filters } {
  const { filters, period } = state
  if (period !== 'custom') {
    // period-over-period: prev window = same length, immediately before curr
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const prevFrom = startOfDaysAgo(days * 2)
    const prevTo = startOfDaysAgo(days)
    return {
      curr: filters,
      prev: { ...filters, from: prevFrom, to: prevTo },
    }
  }
  // For custom ranges, shift backward by the same duration
  if (!filters.from || !filters.to) return { curr: filters, prev: filters }
  const fromMs = Date.parse(filters.from)
  const toMs = Date.parse(filters.to)
  const span = toMs - fromMs
  return {
    curr: filters,
    prev: {
      ...filters,
      from: new Date(fromMs - span).toISOString(),
      to: filters.from,
    },
  }
}

/** Convenience for pages that currently only use Period. */
export function periodOnlyFilters(p: Period): Filters {
  return filtersFromPeriod(p)
}

/** Serialize a partial patch onto an existing URLSearchParams. Removes keys
 *  whose value is empty/undefined so URLs stay short. */
export function encodeFilterPatch(
  current: URLSearchParams,
  patch: Partial<{
    period: PeriodOrCustom
    from: string
    to: string
    stores: string[]
    channels: Channel[]
    tiers: Tier[]
    gift: boolean | undefined | null
  }>,
): URLSearchParams {
  const next = new URLSearchParams(current.toString())
  const setOrDel = (key: string, val: string | undefined | null) => {
    if (val === undefined || val === null || val === '') next.delete(key)
    else next.set(key, val)
  }
  if ('period' in patch) {
    if (patch.period === 'custom') next.delete('period')
    else setOrDel('period', patch.period)
  }
  if ('from' in patch) setOrDel('from', patch.from)
  if ('to' in patch) setOrDel('to', patch.to)
  if ('stores' in patch) setOrDel('stores', (patch.stores ?? []).join(',') || null)
  if ('channels' in patch) setOrDel('channels', (patch.channels ?? []).join(',') || null)
  if ('tiers' in patch) setOrDel('tiers', (patch.tiers ?? []).join(',') || null)
  if ('gift' in patch) {
    const g = patch.gift
    setOrDel('gift', g === true ? 'true' : g === false ? 'false' : null)
  }
  return next
}
