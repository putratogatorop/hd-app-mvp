'use client'

import { useState, useMemo } from 'react'
import { X, Search, MapPin, Clock, ChevronRight } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContextStore } from '@/lib/store/order-context'

type Store = Database['public']['Tables']['stores']['Row']

interface StoreSelectorProps {
  stores: Store[]
  open: boolean
  onClose: () => void
}

export default function StoreSelector({ stores, open, onClose }: StoreSelectorProps) {
  const [search, setSearch] = useState('')
  const setStore = useOrderContextStore((s) => s.setStore)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const matched = q
      ? stores.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.address.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q)
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-hd-dark">Pilih Toko</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari lokasi toko..."
              className="flex-1 bg-transparent text-sm text-hd-dark placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Store list */}
        <ul className="overflow-y-auto flex-1 px-4 py-2 divide-y divide-gray-50">
          {filtered.length === 0 && (
            <li className="py-8 text-center text-sm text-gray-400">
              Toko tidak ditemukan
            </li>
          )}
          {filtered.map((store) => (
            <li key={store.id}>
              <button
                onClick={() => handleSelectStore(store)}
                disabled={!store.is_open}
                className={`w-full text-left py-3.5 flex items-center gap-3 transition-colors ${
                  store.is_open
                    ? 'hover:bg-gray-50 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Store info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-hd-dark text-sm truncate">
                      {store.name}
                    </span>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        store.is_open
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {store.is_open ? 'Buka' : 'Tutup'}
                    </span>
                  </div>

                  <div className="flex items-start gap-1 text-gray-500 text-xs mb-0.5">
                    <MapPin size={11} className="mt-0.5 shrink-0 text-gray-400" />
                    <span className="truncate">
                      {store.address}, {store.city}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-500 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="shrink-0 text-gray-400" />
                      {store.opening_hours}
                    </span>
                    <span className="text-gray-400">
                      {store.distance_dummy} km
                    </span>
                  </div>
                </div>

                {store.is_open && (
                  <ChevronRight size={16} className="shrink-0 text-gray-300" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
