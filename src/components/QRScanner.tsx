'use client'

import { useState } from 'react'
import { X, QrCode } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContext } from '@/lib/store/order-context'

type Store = Database['public']['Tables']['stores']['Row']

interface QRScannerProps {
  open: boolean
  onClose: () => void
  stores: Store[]
}

type ViewMode = 'camera' | 'manual'

export default function QRScanner({ open, onClose, stores }: QRScannerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('camera')
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [tableNumber, setTableNumber] = useState<string>('')

  const { setStore, setTableNumber: setCtxTableNumber, setMode } = useOrderContext()

  if (!open) return null

  const openStores = stores.filter((s) => s.is_open)

  function handleConfirm() {
    const store = stores.find((s) => s.id === selectedStoreId)
    if (!store || !tableNumber) return

    setStore(store)
    setCtxTableNumber(Number(tableNumber))
    setMode('dinein')
    onClose()
  }

  function handleClose() {
    setViewMode('camera')
    setSelectedStoreId('')
    setTableNumber('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90">
      {viewMode === 'camera' ? (
        /* ── Camera view ── */
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-12 pb-4">
            <h2 className="text-white text-lg font-semibold">Scan QR di Meja Anda</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
              aria-label="Tutup"
            >
              <X size={22} />
            </button>
          </div>

          {/* Camera placeholder */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            {/* Viewfinder */}
            <div className="relative w-64 h-64">
              {/* Dark area with border */}
              <div className="w-full h-full border-2 border-white/30 rounded-sm flex items-center justify-center bg-black/40">
                <QrCode size={64} className="text-white/50" />
              </div>

              {/* Burgundy corner brackets */}
              {/* Top-left */}
              <div className="absolute top-0 left-0 w-8 h-8">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-hd-red rounded-tl-sm" />
                <div className="absolute top-0 left-0 h-full w-[3px] bg-hd-red rounded-tl-sm" />
              </div>
              {/* Top-right */}
              <div className="absolute top-0 right-0 w-8 h-8">
                <div className="absolute top-0 right-0 w-full h-[3px] bg-hd-red rounded-tr-sm" />
                <div className="absolute top-0 right-0 h-full w-[3px] bg-hd-red rounded-tr-sm" />
              </div>
              {/* Bottom-left */}
              <div className="absolute bottom-0 left-0 w-8 h-8">
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-hd-red rounded-bl-sm" />
                <div className="absolute bottom-0 left-0 h-full w-[3px] bg-hd-red rounded-bl-sm" />
              </div>
              {/* Bottom-right */}
              <div className="absolute bottom-0 right-0 w-8 h-8">
                <div className="absolute bottom-0 right-0 w-full h-[3px] bg-hd-red rounded-br-sm" />
                <div className="absolute bottom-0 right-0 h-full w-[3px] bg-hd-red rounded-br-sm" />
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-white/60 text-sm text-center">
              Arahkan kamera ke QR code yang ada di meja
            </p>

            {/* Note */}
            <p className="text-white/40 text-xs text-center">
              (QR scanner requires camera permission)
            </p>
          </div>

          {/* Bottom link */}
          <div className="pb-12 flex justify-center">
            <button
              onClick={() => setViewMode('manual')}
              className="text-white/70 text-sm underline underline-offset-2 hover:text-white transition-colors"
            >
              Tidak bisa scan? Input manual
            </button>
          </div>
        </div>
      ) : (
        /* ── Manual mode ── */
        <div className="flex flex-col h-full">
          {/* Backdrop tap-to-close area */}
          <div className="flex-1" onClick={() => setViewMode('camera')} />

          {/* Bottom sheet */}
          <div className="bg-white rounded-t-2xl px-5 pt-5 pb-10">
            <h2 className="text-hd-dark text-lg font-semibold mb-5">Input Manual</h2>

            {/* Store selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Pilih Toko
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-hd-dark bg-white outline-none focus:border-hd-red transition-colors"
              >
                <option value="">-- Pilih toko --</option>
                {openStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Table number input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Nomor Meja
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Masukkan nomor meja"
                min={1}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-hd-dark outline-none focus:border-hd-red transition-colors"
              />
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={!selectedStoreId || !tableNumber}
              className="w-full py-3 rounded-xl bg-hd-red text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              Konfirmasi
            </button>

            {/* Back link */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setViewMode('camera')}
                className="text-hd-red text-sm underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                Kembali ke scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
