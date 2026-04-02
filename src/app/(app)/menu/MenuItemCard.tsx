'use client'

import { useState } from 'react'
import type { Database } from '@/lib/supabase/database.types'
import { useCartStore } from '@/lib/store/cart'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const [flash, setFlash] = useState(false)
  const { addItem, items } = useCartStore()

  const cartQty = items.find(i => i.item.id === item.id)?.quantity ?? 0

  function handleAdd() {
    addItem(item)
    setFlash(true)
    setTimeout(() => setFlash(false), 800)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-50 hover:shadow-md transition-shadow">
      {/* Image placeholder */}
      <div className="h-28 bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center relative">
        <span className="text-4xl">🍨</span>
        {cartQty > 0 && (
          <span className="absolute top-2 right-2 bg-hd-red text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {cartQty}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-hd-dark text-sm leading-tight">{item.name}</h3>
        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-hd-red font-bold text-sm">{formatRupiah(item.price)}</span>
          <button
            onClick={handleAdd}
            className={`text-xs font-semibold px-2 py-1 rounded-lg transition-all ${
              flash
                ? 'bg-green-100 text-green-600 scale-95'
                : 'bg-hd-red text-white hover:bg-red-700'
            }`}
          >
            {flash ? '✓ Added' : cartQty > 0 ? `+1 (${cartQty})` : '+ Tambah'}
          </button>
        </div>

        <p className="text-gray-300 text-xs mt-1">
          +{Math.floor(item.price / 1000)} poin
        </p>
      </div>
    </div>
  )
}
