'use client'

import { useState } from 'react'
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

export default function ProductSheet({ item, onClose }: ProductSheetProps) {
  const [qty, setQty] = useState(1)
  const addItem = useCartStore(s => s.addItem)

  if (!item) return null

  function handleAdd() {
    if (!item) return
    for (let i = 0; i < qty; i++) {
      addItem(item)
    }
    setQty(1)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="relative bg-white rounded-t-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1 rounded-full bg-white/80 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Image placeholder */}
        <div className="h-48 bg-gradient-to-br from-hd-cream to-pink-100 flex items-center justify-center">
          <span className="text-6xl">{categoryEmoji[item.category]}</span>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Name & price */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900 flex-1">{item.name}</h2>
            <span className="text-lg font-bold text-hd-burgundy whitespace-nowrap">
              {formatRupiah(item.price)}
            </span>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-500">{item.description}</p>
          )}

          {/* Calories */}
          {item.calories != null && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Flame className="w-3 h-3" />
              <span>{item.calories} kal</span>
            </div>
          )}

          {/* Quantity selector */}
          <div className="flex items-center justify-center gap-6 py-2">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 active:bg-gray-200"
              aria-label="Kurangi"
            >
              <Minus className="w-4 h-4 text-gray-700" />
            </button>

            <span className="text-2xl font-bold w-8 text-center">{qty}</span>

            <button
              onClick={() => setQty(q => q + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 active:bg-gray-200"
              aria-label="Tambah"
            >
              <Plus className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAdd}
            className="w-full bg-hd-burgundy text-white font-semibold py-3 rounded-xl hover:bg-hd-burgundy/90 active:bg-hd-burgundy/80 transition-colors"
          >
            Tambah ke Keranjang — {formatRupiah(item.price * qty)}
          </button>
        </div>
      </div>
    </div>
  )
}
