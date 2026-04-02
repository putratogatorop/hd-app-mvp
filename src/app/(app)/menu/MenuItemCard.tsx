'use client'

import { useState } from 'react'
import type { Database } from '@/lib/supabase/database.types'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
    // TODO: Connect to cart store (Zustand)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-50 hover:shadow-md transition-shadow">
      {/* Image placeholder */}
      <div className="h-28 bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <span className="text-4xl">🍨</span>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-hd-dark text-sm leading-tight">{item.name}</h3>
        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-hd-red font-bold text-sm">{formatRupiah(item.price)}</span>
          <button
            onClick={handleAdd}
            className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
              added
                ? 'bg-green-100 text-green-600'
                : 'bg-hd-red text-white hover:bg-red-700'
            }`}
          >
            {added ? '✓ Added' : '+ Tambah'}
          </button>
        </div>

        <p className="text-gray-300 text-xs mt-1">
          +{Math.floor(item.price / 1000)} poin
        </p>
      </div>
    </div>
  )
}
