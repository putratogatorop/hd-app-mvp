'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'

export default function FloatingCartButton() {
  const [mounted, setMounted] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount())

  useEffect(() => setMounted(true), [])
  if (!mounted || itemCount === 0) return null

  return (
    <Link
      href="/cart"
      className="fixed bottom-28 right-5 z-40 h-12 bg-hd-burgundy text-hd-cream flex items-center gap-3 px-4 border border-hd-burgundy hover:bg-hd-burgundy-dark transition-colors shadow-editorial group"
    >
      <span className="eyebrow">Basket</span>
      <span className="h-4 w-px bg-hd-cream/40" aria-hidden />
      <span className="numeral text-[0.85rem]">
        {String(itemCount).padStart(2, '0')}
      </span>
      <span className="text-hd-cream/70 transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  )
}
