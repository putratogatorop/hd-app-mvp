'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Minus, Plus, Flame } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

interface ProductSheetProps {
  item: MenuItem | null
  onClose: () => void
}

const categoryEmoji: Record<MenuItem['category'], string> = {
  ice_cream: '🍨',
  cake: '🍰',
  beverage: '🥤',
  topping: '🧁',
}

const categoryLabel: Record<MenuItem['category'], string> = {
  ice_cream: 'Ice Cream',
  cake: 'Patisserie',
  beverage: 'Beverage',
  topping: 'Topping',
}

export default function ProductSheet({ item, onClose }: ProductSheetProps) {
  const [qty, setQty] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  if (!item) return null

  function handleAdd() {
    if (!item) return
    for (let i = 0; i < qty; i++) addItem(item)
    setQty(1)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-hd-ink/60 animate-[revealFade_0.3s_ease-out]" onClick={onClose} />

      <div className="relative bg-hd-paper overflow-hidden animate-[revealUp_0.5s_cubic-bezier(0.2,0.8,0.2,1)_both]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center border border-hd-ink/30 bg-hd-paper text-hd-ink hover:bg-hd-ink hover:text-hd-cream transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image */}
        <div className="relative h-56 bg-hd-cream-deep overflow-hidden">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-70 grayscale">
              {categoryEmoji[item.category]}
            </div>
          )}
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-hd-ink/60">{categoryLabel[item.category]}</span>
            {item.calories != null && (
              <span className="flex items-center gap-1.5 text-[0.7rem] text-hd-ink/50">
                <Flame className="w-3 h-3" />
                <span className="numeral">{item.calories}</span> kcal
              </span>
            )}
          </div>

          <h2 className="mt-3 font-display text-[2rem] leading-[1.05] text-hd-ink tracking-editorial">
            {item.name}
          </h2>

          {item.description && (
            <p className="mt-3 text-[0.88rem] leading-relaxed text-hd-ink/65 italic font-display">
              {item.description}
            </p>
          )}

          <hr className="rule-editorial mt-6" />

          {/* Qty + price row */}
          <div className="mt-5 flex items-center justify-between">
            <div>
              <span className="eyebrow text-hd-ink/50 block">Unit price</span>
              <span className="numeral text-[1.1rem] text-hd-ink mt-1 block">
                {formatRupiah(item.price)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center border border-hd-ink/30 text-hd-ink hover:bg-hd-ink hover:text-hd-cream transition-colors"
                aria-label="Decrease"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="numeral text-[1.4rem] text-hd-ink min-w-[2ch] text-center">
                {String(qty).padStart(2, '0')}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 flex items-center justify-center border border-hd-ink/30 text-hd-ink hover:bg-hd-ink hover:text-hd-cream transition-colors"
                aria-label="Increase"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleAdd}
            className="mt-6 w-full h-14 bg-hd-burgundy text-hd-cream flex items-center justify-between px-6 border border-hd-burgundy hover:bg-hd-burgundy-dark transition-colors group"
          >
            <span className="eyebrow text-hd-cream">Add to bag</span>
            <span className="numeral text-[1rem] transition-transform group-hover:translate-x-0.5">
              {formatRupiah(item.price * qty)}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
