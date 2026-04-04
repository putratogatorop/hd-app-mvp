'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'

export default function FloatingCartButton() {
  const itemCount = useCartStore(s => s.itemCount())

  if (itemCount === 0) return null

  return (
    <Link
      href="/cart"
      className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-hd-red text-white rounded-full flex items-center justify-center shadow-lg shadow-red-300 hover:bg-red-700 transition-colors"
    >
      <ShoppingCart size={24} />
      <span className="absolute -top-1 -right-1 bg-hd-dark text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {itemCount > 9 ? '9+' : itemCount}
      </span>
    </Link>
  )
}
