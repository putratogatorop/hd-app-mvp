'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/analytics', label: 'Overview', num: '01' },
  { href: '/analytics/gift', label: 'Gifting', num: '02' },
  { href: '/analytics/transactional', label: 'Transactional', num: '03' },
  { href: '/analytics/rfm', label: 'RFM', num: '04' },
  { href: '/analytics/campaigns', label: 'Campaigns', num: '05' },
]

export default function AnalyticsTabs() {
  const pathname = usePathname()
  return (
    <nav className="flex items-end gap-8 overflow-x-auto">
      {tabs.map((t) => {
        const active = t.href === '/analytics'
          ? pathname === '/analytics'
          : pathname === t.href || pathname.startsWith(t.href + '/')
        return (
          <Link
            key={t.href}
            href={t.href}
            className="group relative flex items-baseline gap-2 pb-3 whitespace-nowrap"
          >
            <span
              className="numeral text-[0.65rem] tracking-widest transition-colors"
              style={{
                color: active ? '#B8922A' : 'rgba(254,242,227,0.3)',
              }}
            >
              {t.num}
            </span>
            <span
              className={`font-display text-[1rem] tracking-editorial transition-colors ${
                active ? 'italic' : ''
              }`}
              style={{
                color: active ? '#FEF2E3' : 'rgba(254,242,227,0.55)',
              }}
            >
              {t.label}
            </span>
            {active && (
              <span
                className="absolute left-0 right-0 bottom-0 h-[2px]"
                style={{ backgroundColor: '#B8922A' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
