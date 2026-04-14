'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/analytics', label: 'Overview' },
  { href: '/analytics/gift', label: 'Gifting' },
  { href: '/analytics/transactional', label: 'Transactional' },
]

export default function AnalyticsTabs() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-1 border-b border-[#2A2A35] overflow-x-auto">
      {tabs.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              active ? 'text-white' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            {t.label}
            {active && (
              <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-[#B8922A]" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
