'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, IceCreamCone, Package, Ticket, User } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'

const navItems = [
  { href: '/home', label: 'Home', Icon: Home },
  { href: '/menu', label: 'Menu', Icon: IceCreamCone },
  { href: '/orders', label: 'Pesanan', Icon: Package },
  { href: '/voucher', label: 'Voucher', Icon: Ticket },
  { href: '/account', label: 'Akun', Icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const itemCount = useCartStore(s => s.itemCount())

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== '/home' && pathname.startsWith(href))
          const isMenu = href === '/menu'

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative ${
                isActive ? 'text-hd-red' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {isMenu && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-hd-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-hd-red' : ''}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
