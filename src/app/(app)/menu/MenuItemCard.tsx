'use client'

import Image from 'next/image'
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

const categoryLabel: Record<MenuItem['category'], string> = {
  ice_cream: 'Ice Cream',
  cake: 'Patisserie',
  beverage: 'Beverage',
  topping: 'Topping',
}

interface MenuItemCardProps {
  item: MenuItem
  onTap: () => void
  disabled?: boolean
  index?: number
}

export default function MenuItemCard({ item, onTap, disabled = false, index = 0 }: MenuItemCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (disabled) return
    addItem(item)
  }

  return (
    <div
      onClick={disabled ? undefined : onTap}
      className={`group relative flex flex-col bg-hd-paper border border-hd-ink/10 transition-all duration-500 ${
        disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer hover:border-hd-ink/40'
      }`}
    >
      {/* Image panel */}
      <div className="relative aspect-[4/5] bg-hd-cream-deep overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl grayscale opacity-70">
            {categoryEmoji[item.category]}
          </div>
        )}
        <span className="absolute top-3 left-3 eyebrow text-[0.6rem] text-hd-burgundy">
          {String(index + 1).padStart(3, '0')}
        </span>
        {disabled && (
          <span className="absolute top-3 right-3 bg-hd-ink text-hd-cream numeral text-[0.6rem] px-2 py-1 uppercase tracking-wider">
            Sold out
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2">
        <span className="eyebrow text-[0.6rem] text-hd-ink/50">{categoryLabel[item.category]}</span>
        <h3 className="font-display text-[1.15rem] leading-[1.1] text-hd-ink tracking-editorial">
          {item.name}
        </h3>
        <div className="mt-2 pt-3 border-t border-hd-ink/10 flex items-center justify-between">
          <span className="numeral text-[0.95rem] text-hd-ink">{formatRupiah(item.price)}</span>
          <button
            onClick={handleAdd}
            disabled={disabled}
            aria-label={`Add ${item.name}`}
            className="w-8 h-8 flex items-center justify-center border border-hd-ink/30 text-hd-ink transition-colors duration-300 hover:bg-hd-ink hover:text-hd-cream hover:border-hd-ink active:translate-y-[1px]"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
