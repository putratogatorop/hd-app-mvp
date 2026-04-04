'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContext } from '@/lib/store/order-context'
import MenuItemCard from './MenuItemCard'
import ProductSheet from '@/components/ProductSheet'
import FloatingCartButton from '@/components/FloatingCartButton'

type MenuItem = Database['public']['Tables']['menu_items']['Row']
type Category = MenuItem['category'] | 'all'

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'All', value: 'all' },
  { label: 'Ice Cream', value: 'ice_cream' },
  { label: 'Cake', value: 'cake' },
  { label: 'Beverage', value: 'beverage' },
  { label: 'Topping', value: 'topping' },
]

const MODE_LABEL: Record<string, string> = {
  pickup: 'Pick Up',
  delivery: 'Delivery',
  dinein: 'Dine In',
}

interface MenuClientProps {
  items: MenuItem[]
}

export default function MenuClient({ items }: MenuClientProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  const { mode, selectedStore } = useOrderContext()

  const modeLabel = MODE_LABEL[mode] ?? 'Pick Up'
  const storeName = selectedStore?.name ?? 'HD PIK Avenue'

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter(item => {
      const matchesSearch = q === '' || item.name.toLowerCase().includes(q)
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [items, search, activeCategory])

  const available = filtered.filter(i => i.is_available)
  const unavailable = filtered.filter(i => !i.is_available)
  const sorted = [...available, ...unavailable]

  return (
    <div className="page-enter pb-32">
      {/* Search bar */}
      <div className="px-4 pt-10 pb-3 bg-white sticky top-0 z-10 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari menu..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-hd-burgundy/30 focus:border-hd-burgundy"
          />
        </div>

        {/* Store + order mode pill */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 bg-hd-cream border border-red-100 rounded-full px-3 py-1">
          <span className="text-xs font-medium text-hd-burgundy">{modeLabel}</span>
          <span className="text-gray-300 text-xs">—</span>
          <span className="text-xs text-gray-600 truncate max-w-[180px]">{storeName}</span>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-0.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                activeCategory === cat.value
                  ? 'bg-hd-burgundy text-white border-hd-burgundy'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-hd-burgundy hover:text-hd-burgundy'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="px-4 pt-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <Search className="w-10 h-10" />
            <p className="text-sm">Tidak ada menu ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                disabled={!item.is_available}
                onTap={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product detail bottom sheet */}
      {selectedItem && (
        <ProductSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Floating cart button */}
      <FloatingCartButton />
    </div>
  )
}
