'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContext } from '@/lib/store/order-context'
import MenuItemCard from './MenuItemCard'
import ProductSheet from '@/components/ProductSheet'
import FloatingCartButton from '@/components/FloatingCartButton'
import { Eyebrow } from '@/components/ui'

type MenuItem = Database['public']['Tables']['menu_items']['Row']
type Category = MenuItem['category'] | 'all'

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'All', value: 'all' },
  { label: 'Ice Cream', value: 'ice_cream' },
  { label: 'Patisserie', value: 'cake' },
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
  const storeName = selectedStore?.name ?? 'Select a store'

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter((item) => {
      const matchesSearch = q === '' || item.name.toLowerCase().includes(q)
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [items, search, activeCategory])

  const available = filtered.filter((i) => i.is_available)
  const unavailable = filtered.filter((i) => !i.is_available)
  const sorted = [...available, ...unavailable]

  return (
    <div className="page-enter pb-32 bg-hd-cream min-h-screen">
      {/* ── Editorial masthead ── */}
      <header className="sticky top-0 z-20 bg-hd-cream/95 backdrop-blur-md border-b border-hd-ink/10">
        <div className="px-5 pt-10 pb-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow number="02">The Selection</Eyebrow>
              <h1 className="font-display text-display-lg text-hd-ink mt-3 tracking-editorial">
                The <span className="italic">Menu</span>
              </h1>
            </div>
            <div className="text-right pb-1">
              <p className="numeral text-[0.65rem] text-hd-ink/50 uppercase tracking-widest">
                {modeLabel}
              </p>
              <p className="font-display text-[0.95rem] text-hd-ink/90 leading-tight mt-0.5 max-w-[140px] truncate">
                {storeName}
              </p>
            </div>
          </div>

          {/* Search — underline only */}
          <div className="relative mt-6 border-b border-hd-ink/25 focus-within:border-hd-ink transition-colors">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-hd-ink/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the selection…"
              className="w-full pl-6 pr-8 py-3 bg-transparent text-[0.95rem] placeholder:text-hd-ink/40 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-hd-ink/40 hover:text-hd-ink"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category — numbered editorial nav */}
          <div className="flex gap-5 mt-5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat, i) => {
              const active = activeCategory === cat.value
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className="relative flex-shrink-0 flex items-baseline gap-1.5 pb-1.5 group"
                >
                  <span
                    className={`numeral text-[0.6rem] transition-colors ${
                      active ? 'text-hd-burgundy' : 'text-hd-ink/40'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-[0.8rem] font-medium tracking-wide transition-colors ${
                      active ? 'text-hd-burgundy' : 'text-hd-ink/60 group-hover:text-hd-ink'
                    }`}
                  >
                    {cat.label}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-hd-burgundy" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* ── Results count bar ── */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-hd-ink/5">
        <span className="eyebrow text-hd-ink/50">
          <span className="numeral text-hd-ink">{String(sorted.length).padStart(2, '0')}</span>
          &nbsp;&nbsp;items in view
        </span>
        <span className="eyebrow text-hd-ink/40">Est. 1961</span>
      </div>

      {/* ── Product grid ── */}
      <div className="px-5 pt-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-hd-ink/40 gap-3">
            <Search className="w-8 h-8" />
            <p className="font-display italic text-lg">Nothing matches that search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {sorted.map((item, i) => (
              <MenuItemCard
                key={item.id}
                item={item}
                index={i}
                disabled={!item.is_available}
                onTap={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <ProductSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      <FloatingCartButton />
    </div>
  )
}
