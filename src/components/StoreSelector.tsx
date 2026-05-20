'use client'

import { useState, useMemo } from 'react'
import { X, Search, MapPin, ArrowUpRight } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContext } from '@/lib/store/order-context'
import { Eyebrow } from '@/components/ui'

type Store = Database['public']['Tables']['stores']['Row']

interface StoreSelectorProps {
  stores: Store[]
  open: boolean
  onClose: () => void
}

export default function StoreSelector({ stores, open, onClose }: StoreSelectorProps) {
  const [search, setSearch] = useState('')
  const setStore = useOrderContext((s) => s.setStore)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const matched = q
      ? stores.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.address.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q),
        )
      : stores
    const open = matched.filter((s) => s.is_open)
    const closed = matched.filter((s) => !s.is_open)
    return [...open, ...closed]
  }, [stores, search])

  function handleSelectStore(store: Store) {
    if (!store.is_open) return
    setStore(store)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-hd-ink/60 animate-[revealFade_0.3s_ease-out]"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative bg-hd-paper max-h-[85vh] flex flex-col animate-[revealUp_0.5s_cubic-bezier(0.2,0.8,0.2,1)_both]">
        <div className="px-6 pt-6 pb-5 flex items-center justify-between border-b border-hd-ink/15">
          <div>
            <Eyebrow>Location</Eyebrow>
            <h2 className="mt-1.5 font-display text-[1.6rem] text-hd-ink tracking-editorial">
              Choose a <span className="italic">store</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center border border-hd-ink/30 text-hd-ink hover:bg-hd-ink hover:text-hd-cream transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-hd-ink/10">
          <div className="relative border-b border-hd-ink/20 focus-within:border-hd-ink transition-colors">
            <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-hd-ink/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, area, or city…"
              className="w-full pl-6 pr-2 py-3 bg-transparent text-[0.9rem] placeholder:text-hd-ink/40 focus:outline-none"
            />
          </div>
        </div>

        <ul className="overflow-y-auto flex-1 divide-y divide-hd-ink/10">
          {filtered.length === 0 && (
            <li className="py-12 text-center">
              <p className="font-display italic text-[1rem] text-hd-ink/55">
                No stores match that search.
              </p>
            </li>
          )}
          {filtered.map((store, i) => (
            <li key={store.id}>
              <button
                onClick={() => handleSelectStore(store)}
                disabled={!store.is_open}
                className={`w-full text-left px-6 py-5 flex items-start gap-4 group transition-colors ${
                  store.is_open ? 'hover:bg-hd-cream-deep cursor-pointer' : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <span className="numeral text-[0.65rem] text-hd-ink/40 tracking-widest w-6 mt-1">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 justify-between">
                    <p className="font-display text-[1.05rem] text-hd-ink tracking-editorial truncate">
                      {store.name}
                    </p>
                    <span
                      className={`eyebrow shrink-0 ${
                        store.is_open ? 'text-emerald-700' : 'text-hd-ink/40'
                      }`}
                    >
                      {store.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  <p className="flex items-start gap-1.5 text-[0.78rem] text-hd-ink/60 mt-1.5 italic font-display">
                    <MapPin size={10} className="mt-1 shrink-0" />
                    <span className="truncate">
                      {store.address}, {store.city}
                    </span>
                  </p>

                  <div className="flex items-center gap-4 mt-2 numeral text-[0.7rem] text-hd-ink/50">
                    <span>{store.opening_hours}</span>
                    <span>{store.distance_dummy} km</span>
                  </div>
                </div>

                {store.is_open && (
                  <ArrowUpRight className="w-4 h-4 text-hd-ink/40 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
