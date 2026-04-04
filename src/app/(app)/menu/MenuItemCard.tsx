'use client'

import type { Database } from '@/lib/supabase/database.types'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'
import { Plus } from 'lucide-react'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

const categoryEmoji: Record<MenuItem['category'], string> = {
  ice_cream: '🍨',
  cake: '🍰',
  beverage: '🥤',
  topping: '🧁',
}

const categoryGradient: Record<MenuItem['category'], string> = {
  ice_cream: 'from-red-50 to-pink-100',
  cake: 'from-amber-50 to-orange-100',
  beverage: 'from-blue-50 to-cyan-100',
  topping: 'from-purple-50 to-fuchsia-100',
}

interface MenuItemCardProps {
  item: MenuItem
  onTap: () => void
  disabled?: boolean
}

export default function MenuItemCard({ item, onTap, disabled = false }: MenuItemCardProps) {
  const addItem = useCartStore(s => s.addItem)

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (disabled) return
    addItem(item)
  }

  return (
    <div
      onClick={disabled ? undefined : onTap}
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden transition-shadow ${
        disabled ? 'opacity-50 cursor-default' : 'cursor-pointer hover:shadow-md active:shadow-sm'
      }`}
    >
      {/* Image placeholder */}
      <div className={`h-28 bg-gradient-to-br ${categoryGradient[item.category]} flex items-center justify-center relative`}>
        <span className="text-4xl">{categoryEmoji[item.category]}</span>

        {/* "Habis" badge */}
        {disabled && (
          <span className="absolute top-2 left-2 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Habis
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-hd-dark truncate">{item.name}</h3>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold text-hd-red">{formatRupiah(item.price)}</span>
          <button
            onClick={handleAdd}
            disabled={disabled}
            aria-label={`Tambah ${item.name}`}
            className={`w-7 h-7 flex items-center justify-center rounded-full border-2 transition-colors ${
              disabled
                ? 'border-gray-300 text-gray-300 cursor-default'
                : 'border-hd-red text-hd-red hover:bg-hd-red hover:text-white active:scale-95'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
