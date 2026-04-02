'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/pos/orders', label: '📋 Orders', short: 'Orders' },
  { href: '/pos/menu', label: '🍨 Menu', short: 'Menu' },
  { href: '/pos/dashboard', label: '📊 Dashboard', short: 'Dashboard' },
]

export default function PosTopNav({ staffName }: { staffName: string }) {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 bg-hd-dark text-white z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-hd-red rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">HD</span>
          </div>
          <span className="font-bold text-white hidden sm:block">POS System</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navLinks.map(link => {
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-hd-red text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">{link.label}</span>
                <span className="sm:hidden">{link.short}</span>
              </Link>
            )
          })}
        </nav>

        {/* Staff info */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xs">👤</span>
          </div>
          <span className="text-sm text-gray-300 hidden sm:block truncate max-w-[120px]">
            {staffName}
          </span>
        </div>
      </div>
    </header>
  )
}
