'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'

const navItems = [
  { href: '/menu', label: 'Menu', icon: '🍨' },
  { href: '/cart', label: 'Keranjang', icon: '🛒' },
  { href: '/orders', label: 'Pesanan', icon: '📦' },
  { href: '/loyalty', label: 'Poin', icon: '⭐' },
  { href: '/profile', label: 'Profil', icon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const itemCount = useCartStore(s => s.itemCount())

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          const isCart = item.href === '/cart'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative ${
                isActive ? 'text-hd-red' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl relative">
                {item.icon}
                {isCart && itemCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-hd-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-hd-red' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 bg-hd-red rounded-full mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
