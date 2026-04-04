'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'

export default function FloatingCartButton() {
  const [mounted, setMounted] = useState(false)
  const itemCount = useCartStore(s => s.itemCount())

  useEffect(() => setMounted(true), [])

  if (!mounted || itemCount === 0) return null

  return (
    <Link
      href="/cart"
      className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-hd-burgundy text-white rounded-full flex items-center justify-center shadow-lg shadow-hd-burgundy/20 hover:bg-hd-burgundy-dark transition-colors"
    >
      <ShoppingCart size={24} />
      <span className="absolute -top-1 -right-1 bg-hd-dark text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {itemCount > 9 ? '9+' : itemCount}
      </span>
    </Link>
  )
}
