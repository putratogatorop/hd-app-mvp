'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'

const navItems = [
  { href: '/home', label: 'Beranda' },
  { href: '/menu', label: 'Menu' },
  { href: '/orders', label: 'Pesanan' },
  { href: '/voucher', label: 'Hadiah' },
  { href: '/account', label: 'Akun' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 bg-hd-cream/95 backdrop-blur-md border-t border-hd-ink/10 safe-bottom">
      <div className="grid grid-cols-5">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href || (href !== '/home' && pathname.startsWith(href))
          const isMenu = href === '/menu'
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className="relative flex flex-col items-center justify-center min-h-[56px] px-2 py-2 group"
            >
              <span
                className={`font-display text-[0.95rem] leading-none transition-colors ${
                  isActive
                    ? 'text-hd-burgundy italic font-medium'
                    : 'text-hd-ink group-hover:text-hd-burgundy'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 bg-hd-burgundy" />
              )}
              {isMenu && itemCount > 0 && (
                <span className="absolute top-1 right-2 min-w-[20px] h-[20px] px-1.5 rounded-full bg-hd-burgundy text-hd-cream numeral text-[0.65rem] flex items-center justify-center">
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
