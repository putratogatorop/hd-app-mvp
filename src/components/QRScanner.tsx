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
    <div className="fixed inset-0 z-50 bg-hd-burgundy-dark text-hd-cream">
      <div className="texture-grain absolute inset-0 opacity-25" aria-hidden />

      {viewMode === 'camera' ? (
        <div className="relative flex flex-col h-full">
          <div className="px-6 pt-12 pb-4 flex items-center justify-between border-b border-hd-cream/20">
            <div>
              <span className="eyebrow text-hd-cream/70">Dine-in · Scan</span>
              <h2 className="mt-2 font-display text-[1.4rem] tracking-editorial">
                Find your <span className="italic">table</span>
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center border border-hd-cream/30 text-hd-cream hover:bg-hd-cream hover:text-hd-ink transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
            <div className="relative w-64 h-64">
              <div className="w-full h-full border border-hd-cream/30 flex items-center justify-center bg-hd-ink/40">
                <QrCode size={72} className="text-hd-cream/40" strokeWidth={1} />
              </div>
              {/* Gold corner brackets */}
              {[
                'top-0 left-0',
                'top-0 right-0',
                'bottom-0 left-0',
                'bottom-0 right-0',
              ].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-8 h-8`}>
                  <div className={`absolute ${pos.includes('top') ? 'top-0' : 'bottom-0'} ${pos.includes('left') ? 'left-0' : 'right-0'} w-full h-[2px] bg-hd-gold`} />
                  <div className={`absolute ${pos.includes('top') ? 'top-0' : 'bottom-0'} ${pos.includes('left') ? 'left-0' : 'right-0'} h-full w-[2px] bg-hd-gold`} />
                </div>
              ))}
            </div>

            <p className="font-display italic text-[0.95rem] text-hd-cream/70 text-center max-w-xs">
              Aim the camera at the QR code printed on your table.
            </p>
            <p className="numeral text-[0.65rem] text-hd-cream/40 tracking-widest">
              CAMERA PERMISSION REQUIRED
            </p>
          </div>

          <div className="pb-10 flex justify-center">
            <button
              onClick={() => setViewMode('manual')}
              className="eyebrow text-hd-cream/70 border-b border-hd-cream/40 pb-0.5 hover:text-hd-cream hover:border-hd-cream transition-colors"
            >
              Enter table manually
            </button>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col h-full">
          <div className="flex-1" onClick={() => setViewMode('camera')} />
          <div className="bg-hd-paper text-hd-ink px-6 pt-6 pb-10 border-t border-hd-ink/15">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="eyebrow text-hd-ink/60">Manual entry</span>
                <h2 className="mt-1 font-display text-[1.5rem] tracking-editorial">
                  Your table
                </h2>
              </div>
              <button
                onClick={() => setViewMode('camera')}
                className="w-9 h-9 flex items-center justify-center border border-hd-ink/30 text-hd-ink hover:bg-hd-ink hover:text-hd-cream transition-colors"
                aria-label="Back"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="eyebrow text-hd-ink/60 block mb-2">Store</label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full h-12 bg-transparent border-b border-hd-ink/30 focus:border-hd-ink transition-colors text-[0.9rem] focus:outline-none appearance-none"
                >
                  <option value="">— Select store —</option>
                  {openStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="eyebrow text-hd-ink/60 block mb-2">Table number</label>
                <input
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. 12"
                  min={1}
                  className="w-full h-12 bg-transparent border-b border-hd-ink/30 focus:border-hd-ink transition-colors text-[0.9rem] placeholder:text-hd-ink/30 focus:outline-none numeral"
                />
              </div>

              <button
                onClick={handleConfirm}
                disabled={!selectedStoreId || !tableNumber}
                className="w-full h-12 bg-hd-burgundy text-hd-cream border border-hd-burgundy eyebrow hover:bg-hd-burgundy-dark transition-colors disabled:opacity-40 mt-4"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
