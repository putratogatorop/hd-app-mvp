import type { Filters } from './types'

export type Period = '7d' | '30d' | '90d'

export function periodDays(p: Period): number {
  return p === '7d' ? 7 : p === '90d' ? 90 : 30
}

export function startOfDaysAgo(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

/** Build a Filters object whose date range matches the given period ending now. */
export function filtersFromPeriod(p: Period, overrides: Partial<Filters> = {}): Filters {
  return {
    from: startOfDaysAgo(periodDays(p)),
    to: new Date().toISOString(),
    excludeCancelled: true,
    ...overrides,
  }
}

/** Return {curr, prev} filter pairs for period-over-period comparisons. */
export function periodWindows(p: Period, base: Partial<Filters> = {}): { curr: Filters; prev: Filters } {
  const days = periodDays(p)
  const now = new Date().toISOString()
  const sinceCurr = startOfDaysAgo(days)
  const sincePrev = startOfDaysAgo(days * 2)
  return {
    curr: { ...base, from: sinceCurr, to: now, excludeCancelled: true },
    prev: { ...base, from: sincePrev, to: sinceCurr, excludeCancelled: true },
  }
}

/** List of ISO day-keys (YYYY-MM-DD) covering the current period, oldest first. */
export function dayKeysForPeriod(p: Period): string[] {
  const days = periodDays(p)
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}
