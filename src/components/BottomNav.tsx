'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'

const navItems = [
  { href: '/home', label: 'Index', num: '01' },
  { href: '/menu', label: 'Menu', num: '02' },
  { href: '/orders', label: 'Orders', num: '03' },
  { href: '/voucher', label: 'Rewards', num: '04' },
  { href: '/account', label: 'Account', num: '05' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-hd-cream/95 backdrop-blur-md border-t border-hd-ink/10 safe-bottom">
      <div className="max-w-lg mx-auto grid grid-cols-5">
        {navItems.map(({ href, label, num }) => {
          const isActive = pathname === href || (href !== '/home' && pathname.startsWith(href))
          const isMenu = href === '/menu'
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-1 py-3 group"
            >
              <span
                className={`numeral text-[0.65rem] leading-none transition-colors ${
                  isActive ? 'text-hd-burgundy' : 'text-hd-ink/40'
                }`}
              >
                {num}
              </span>
              <span
                className={`font-display text-[0.95rem] leading-none transition-colors ${
                  isActive ? 'text-hd-burgundy italic' : 'text-hd-ink/70 group-hover:text-hd-ink'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 bg-hd-burgundy" />
              )}
              {isMenu && itemCount > 0 && (
                <span className="absolute top-2 right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-hd-burgundy text-hd-cream numeral text-[0.6rem] flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
