'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/pos/orders', label: 'Queue', num: '01' },
  { href: '/pos/menu', label: 'Menu', num: '02' },
  { href: '/pos/dashboard', label: 'Dashboard', num: '03' },
]

export default function PosTopNav({ staffName }: { staffName: string }) {
  const pathname = usePathname()
  const initials = staffName
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 bg-hd-burgundy-dark text-hd-cream z-50 border-b border-hd-cream/15">
      <div className="texture-grain absolute inset-0 opacity-20" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="eyebrow text-hd-gold-light">Häagen-Dazs</span>
          <span className="font-display italic text-[1rem] text-hd-cream/80">
            Staff
          </span>
        </div>

        <nav className="flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative flex items-baseline gap-2 py-1"
              >
                <span
                  className={`numeral text-[0.6rem] ${
                    isActive ? 'text-hd-gold-light' : 'text-hd-cream/40'
                  }`}
                >
                  {link.num}
                </span>
                <span
                  className={`font-display text-[0.95rem] tracking-editorial transition-colors ${
                    isActive ? 'text-hd-cream italic' : 'text-hd-cream/60 hover:text-hd-cream'
                  }`}
                >
                  {link.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-hd-gold" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-hd-cream/30 flex items-center justify-center">
            <span className="font-display italic text-[0.75rem] text-hd-cream">
              {initials}
            </span>
          </div>
          <span className="text-[0.8rem] text-hd-cream/70 hidden sm:block truncate max-w-[140px]">
            {staffName}
          </span>
        </div>
      </div>
    </header>
  )
}
