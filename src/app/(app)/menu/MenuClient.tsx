'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Database } from '@/lib/supabase/database.types'
import { useCartStore } from '@/lib/store/cart'
import { useTranslation, useCurrency } from '@/lib/i18n/context'
import ProductSheet from '@/components/ProductSheet'

type MenuItem = Database['haagen_dazs']['Tables']['menu_items']['Row']
type Category = MenuItem['category'] | 'all'

// Category tiles — image pool (hd-photos)
const CATEGORY_IMAGES: Record<string, string> = {
  pints: '/hd-photos/DW5RVLkkwA6.jpg',
  mini_cups: '/hd-photos/DVxL5rJE5B8.jpg',
  ice_cream: '/hd-photos/DW5RVLkkwA6.jpg',
  cake: '/hd-photos/DXEOeW3E_Ed.jpg',
  beverage: '/hd-photos/DVaSW5-Ey6f.jpg',
  topping: '/hd-photos/DVHzikJk669.jpg',
}

const FALLBACK_PHOTOS = [
  '/hd-photos/DXEOeW3E_Ed.jpg',
  '/hd-photos/DW5RVLkkwA6.jpg',
  '/hd-photos/DWffta7k4Ei.jpg',
  '/hd-photos/DWI-Kpok62S.jpg',
  '/hd-photos/DW03wihk-je.jpg',
  '/hd-photos/DWffta7k4Ei.jpg',
  '/hd-photos/DV7gQA2k4-5.jpg',
]

interface MenuClientProps {
  items: MenuItem[]
}

export default function MenuClient({ items }: MenuClientProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('ice_cream')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  const { t, lang } = useTranslation()
  const { formatPrice } = useCurrency()
  const addItem = useCartStore((s) => s.addItem)
  const itemCount = useCartStore((s) => s.itemCount())
  const router = useRouter()

  // Auto-enable cart gift mode when arriving from /menu?gift=1
  const searchParams = useSearchParams()
  const setIsGift = useCartStore((s) => s.setIsGift)
  const isGift = useCartStore((s) => s.isGift)
  useEffect(() => {
    if (searchParams.get('gift') === '1' && !isGift) {
      setIsGift(true)
    }
  }, [searchParams, isGift, setIsGift])

  // Categories derived from items
  const categories = useMemo((): { label: string; value: Category; image: string }[] => {
    const cats = Array.from(new Set(items.map((i) => i.category)))
    return cats.map((c) => ({
      value: c as Category,
      label: c === 'ice_cream'
        ? (lang === 'id' ? 'Pints' : 'Pints')
        : c === 'cake'
        ? (lang === 'id' ? 'Patisserie' : 'Patisserie')
        : c === 'beverage'
        ? (lang === 'id' ? 'Minuman' : 'Beverages')
        : lang === 'id' ? 'Topping' : 'Toppings',
      image: CATEGORY_IMAGES[c] ?? FALLBACK_PHOTOS[0],
    }))
  }, [items, lang])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter((item) => {
      const matchesSearch = q === '' || item.name.toLowerCase().includes(q)
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [items, search, activeCategory])

  // Section label
  const sectionTitle = lang === 'id' ? 'Koleksi' : 'The Classics'

  return (
    <div className="bg-hd-cream min-h-screen pb-32">

      {/* ══ TOP BAR ══ */}
      <header
        className="sticky top-0 z-50 bg-hd-cream flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(43,43,43,0.07)' }}
      >
        {/* Back arrow */}
        <button
          aria-label="Back"
          className="text-hd-burgundy flex items-center"
          onClick={() => router.back()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 5 5 12 12 19" />
          </svg>
        </button>

        {/* Stacked wordmark */}
        <div className="text-center" style={{ lineHeight: 1.15 }}>
          <span
            className="font-display text-hd-burgundy tracking-[0.18em] uppercase block"
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            Häagen-<br />Dazs
          </span>
        </div>

        {/* Bag icon */}
        <button
          aria-label="Cart"
          className="text-hd-burgundy flex items-center relative"
          onClick={() => router.push('/cart')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {itemCount > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-hd-burgundy text-hd-cream font-mono flex items-center justify-center"
              style={{ width: 14, height: 14, fontSize: 8, fontWeight: 600, lineHeight: 1 }}
            >
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>
      </header>

      {/* ══ SEARCH BAR ══ */}
      <div
        className="flex items-center gap-2.5 px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(43,43,43,0.10)' }}
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"
          style={{ color: 'rgba(43,43,43,0.25)', flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'id' ? 'TEMUKAN CITA RASA…' : 'DISCOVER A FLAVOR…'}
          className="flex-1 bg-transparent border-none outline-none font-sans uppercase tracking-[0.22em] text-hd-ink"
          style={{ fontSize: 10, fontWeight: 600 }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-hd-ink/40 hover:text-hd-ink transition-colors"
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* ══ VOLUME / MENU SELECTION HEADER ══ */}
      <div
        className="flex items-baseline justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(43,43,43,0.07)' }}
      >
        <span
          className="font-sans text-hd-burgundy uppercase tracking-[0.22em]"
          style={{ fontSize: 10, fontWeight: 600 }}
        >
          {lang === 'id' ? 'Volume 04' : 'Volume 04'}
        </span>
        <span
          className="font-sans uppercase tracking-[0.22em]"
          style={{ fontSize: 10, fontWeight: 600, color: 'rgba(43,43,43,0.25)' }}
        >
          {lang === 'id' ? 'Pilihan Menu' : 'Menu Selection'}
        </span>
      </div>

      {/* ══ CATEGORY TILES — 2-col grid ══ */}
      {categories.length > 0 && (
        <div
          className="px-5 py-6"
          style={{ borderBottom: '1px solid rgba(43,43,43,0.07)' }}
        >
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.value
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className="text-left group"
                >
                  {/* Category image — 4/5 aspect */}
                  <div
                    className="w-full overflow-hidden mb-2.5"
                    style={{ aspectRatio: '4/5', background: '#F8ECDD' }}
                  >
                    <Image
                      src={cat.image}
                      alt={cat.label}
                      width={200}
                      height={250}
                      className="w-full h-full object-cover transition-transform duration-[700ms] group-hover:scale-[1.04]"
                      style={{ filter: 'grayscale(10%)' }}
                    />
                  </div>

                  {/* Label with active underline */}
                  <span
                    className="font-sans uppercase tracking-[0.22em] inline-block transition-colors"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isActive ? '#650A30' : 'rgba(43,43,43,0.55)',
                      borderBottom: isActive
                        ? '1px solid rgba(101,10,48,0.40)'
                        : '1px solid transparent',
                      paddingBottom: 2,
                    }}
                  >
                    {cat.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ PRODUCT SECTION ══ */}
      <section className="px-5">

        {/* Section header: 01 — hairline — title */}
        <div className="flex items-center gap-4 py-7">
          <span
            className="font-mono tracking-[0.04em] shrink-0"
            style={{ fontSize: 11, color: 'rgba(43,43,43,0.25)' }}
          >
            01
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(43,43,43,0.10)' }} />
          <h2
            className="font-display text-hd-ink uppercase tracking-[0.04em] shrink-0"
            style={{ fontSize: 26, fontWeight: 500, lineHeight: 1 }}
          >
            {sectionTitle}
          </h2>
        </div>

        {/* Product grid — 2 columns */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: 'rgba(43,43,43,0.35)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <p className="font-display italic text-lg">
              {lang === 'id' ? 'Tidak ditemukan.' : 'Nothing matches that search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 pb-8">
            {filtered.map((item, i) => {
              const photo = item.image_url ?? FALLBACK_PHOTOS[i % FALLBACK_PHOTOS.length]
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="text-left flex flex-col group"
                >
                  {/* Product image — 3/4 aspect */}
                  <div
                    className="w-full overflow-hidden mb-3 flex items-center justify-center"
                    style={{ aspectRatio: '3/4', background: '#F8ECDD', padding: 8 }}
                  >
                    <Image
                      src={photo}
                      alt={item.name}
                      width={200}
                      height={267}
                      className="w-full h-full object-contain transition-transform duration-[700ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04]"
                      style={{ filter: 'grayscale(10%)' }}
                    />
                  </div>

                  {/* Name */}
                  <p
                    className="font-sans text-hd-burgundy uppercase tracking-[0.08em] mb-1"
                    style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}
                  >
                    {item.name}
                  </p>

                  {/* Volume label */}
                  {item.description && (
                    <p
                      className="font-sans uppercase tracking-[0.22em] mb-2.5"
                      style={{ fontSize: 9, color: 'rgba(43,43,43,0.25)' }}
                    >
                      473 ML
                    </p>
                  )}

                  {/* Footer: price + add */}
                  <div
                    className="flex items-center justify-between pt-2.5 mt-auto"
                    style={{ borderTop: '1px solid rgba(43,43,43,0.07)' }}
                  >
                    <span
                      className="font-mono text-hd-burgundy"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: '-0.01em' }}
                    >
                      {formatPrice(item.price)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); addItem(item) }}
                      aria-label={`Add ${item.name}`}
                      className="text-hd-burgundy flex items-center justify-center transition-transform hover:scale-110"
                      style={{ padding: 2 }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* ══ END OF JOURNAL ══ */}
      <div className="flex flex-col items-center gap-3.5 px-5 py-8">
        <div style={{ width: 1, height: 48, background: 'rgba(43,43,43,0.10)' }} />
        <span
          className="font-mono uppercase tracking-[0.22em]"
          style={{ fontSize: 9, color: 'rgba(43,43,43,0.25)' }}
        >
          {lang === 'id' ? 'Akhir Jurnal' : 'End of Journal'}
        </span>
      </div>

      {selectedItem && (
        <ProductSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  )
}
