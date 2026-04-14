/**
 * Occasion engine — returns the most relevant upcoming event for this user today.
 *
 * Priority (highest first):
 *   1. User's own birthday within 14 days
 *   2. Major Indonesian gifting occasion within 10 days
 *
 * Pure function; client-side. No server scheduler needed yet — when the
 * user opens the app during a window, the relevant banner surfaces.
 */

export interface Occasion {
  key: string
  eyebrow: string
  title: string
  tagline: string
  cta: string
  href: string
  isPersonal: boolean
  daysAway: number
}

// Fixed-date occasions (MM-DD). CNY / Idul Fitri are lunar — add yearly.
const FIXED_OCCASIONS: {
  mmdd: string
  key: string
  title: string
  tagline: string
  cta: string
  href: string
  windowDays: number
}[] = [
  {
    mmdd: '02-14',
    key: 'valentines',
    title: 'Valentine\u2019s, near',
    tagline: 'Send something sweet, sealed and signed.',
    cta: 'Choose a gift',
    href: '/menu?gift=1',
    windowDays: 10,
  },
  {
    mmdd: '12-22',
    key: 'mothers_day_id',
    title: 'Mother\u2019s Day',
    tagline: 'For the woman who taught you patience.',
    cta: 'Send to her',
    href: '/menu?gift=1',
    windowDays: 10,
  },
  {
    mmdd: '12-25',
    key: 'christmas',
    title: 'Christmas, soon',
    tagline: 'A small luxury, beautifully wrapped.',
    cta: 'Gift selection',
    href: '/menu?gift=1',
    windowDays: 10,
  },
]

function daysUntilMMDD(mmdd: string, today: Date): number {
  const [m, d] = mmdd.split('-').map(Number)
  const year = today.getFullYear()
  let target = new Date(year, m - 1, d)
  if (target.getTime() < startOfDay(today).getTime()) {
    target = new Date(year + 1, m - 1, d)
  }
  const diffMs = target.getTime() - startOfDay(today).getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function getActiveOccasion(opts: {
  today?: Date
  birthday?: string | null // 'YYYY-MM-DD'
}): Occasion | null {
  const today = opts.today ?? new Date()

  // 1. User's birthday window (14 days)
  if (opts.birthday) {
    const mmdd = opts.birthday.slice(5) // 'MM-DD'
    const days = daysUntilMMDD(mmdd, today)
    if (days <= 14) {
      return {
        key: 'birthday',
        eyebrow: days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`,
        title: days === 0 ? 'Happy birthday.' : 'Your birthday, near',
        tagline:
          days === 0
            ? 'A treat on the house — enjoy, with our compliments.'
            : 'A small something awaits. Choose your flavour.',
        cta: 'Claim the treat',
        href: '/voucher',
        isPersonal: true,
        daysAway: days,
      }
    }
  }

  // 2. Fixed-date occasions
  let best: (Occasion & { raw: (typeof FIXED_OCCASIONS)[number] }) | null = null
  for (const occ of FIXED_OCCASIONS) {
    const days = daysUntilMMDD(occ.mmdd, today)
    if (days > occ.windowDays) continue
    const candidate: Occasion & { raw: typeof occ } = {
      key: occ.key,
      eyebrow: days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`,
      title: occ.title,
      tagline: occ.tagline,
      cta: occ.cta,
      href: occ.href,
      isPersonal: false,
      daysAway: days,
      raw: occ,
    }
    if (!best || days < best.daysAway) best = candidate
  }
  if (best) {
    const { raw: _raw, ...rest } = best
    void _raw
    return rest
  }

  return null
}
