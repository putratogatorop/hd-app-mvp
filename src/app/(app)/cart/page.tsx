'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Ticket,
  CreditCard,
  MapPin,
  StickyNote,
  ChevronRight,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { useOrderContext } from '@/lib/store/order-context'
import { formatRupiah } from '@/lib/utils/format'
import { placeOrder } from './actions'

const PAYMENT_OPTIONS = [
  { id: 'gopay', label: 'GoPay', emoji: '💚' },
  { id: 'ovo', label: 'OVO', emoji: '💜' },
  { id: 'dana', label: 'Dana', emoji: '💙' },
  { id: 'card', label: 'Kartu Kredit/Debit', emoji: '💳' },
]

const MODE_EMOJI: Record<string, string> = {
  pickup: '🏃',
  delivery: '🛵',
  dinein: '🪑',
}

const MODE_LABEL: Record<string, string> = {
  pickup: 'Pick Up',
  delivery: 'Delivery',
  dinein: 'Dine In',
}

export default function CartPage() {
  const router = useRouter()
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    discountAmount,
    deliveryFee,
    total,
    earnedPoints,
    appliedVoucher,
    removeVoucher,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
  } = useCartStore()

  const { mode, selectedStore, tableNumber } = useOrderContext()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sub = subtotal()
  const discount = discountAmount()
  const fee = deliveryFee(mode)
  const grandTotal = total(mode)
  const points = earnedPoints()
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  async function handleCheckout() {
    if (!items.length) return
    setLoading(true)
    setError(null)
    try {
      await placeOrder({
        items: items.map(i => ({
          id: i.item.id,
          name: i.item.name,
          price: i.item.price,
          quantity: i.quantity,
        })),
        totalAmount: grandTotal,
        earnedPoints: points,
        storeId: selectedStore?.id ?? null,
        orderMode: mode,
        tableNumber: tableNumber,
        voucherId: appliedVoucher?.id ?? null,
        discountAmount: discount,
        deliveryFee: fee,
        paymentMethod,
        notes,
      })
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setLoading(false)
    }
  }

  // Empty state
  if (!items.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} className="text-hd-dark" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-hd-dark">Keranjang</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
          <span className="text-6xl mb-4">🛒</span>
          <p className="text-gray-600 font-semibold text-lg">Keranjang kosong</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Tambahkan ice cream favoritmu!</p>
          <Link
            href="/menu"
            className="bg-hd-burgundy text-white font-semibold px-6 py-3 rounded-xl hover:bg-hd-burgundy-dark transition-colors"
          >
            Lihat Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} className="text-hd-dark" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-hd-dark">Keranjang</h1>
          <p className="text-gray-400 text-xs">{itemCount} item</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Order mode reminder */}
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm border border-gray-50">
          <MapPin size={18} className="text-hd-burgundy flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-hd-dark">
              {MODE_EMOJI[mode]} {MODE_LABEL[mode]}
              {mode === 'dinein' && tableNumber ? ` — Meja ${tableNumber}` : ''}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {selectedStore?.name ?? 'Häagen-Dazs PIK Avenue'}
            </p>
          </div>
        </div>

        {/* Cart items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 divide-y divide-gray-50">
          {items.map(({ item, quantity }) => (
            <div key={item.id} className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-hd-cream to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🍨</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-hd-dark text-sm truncate">{item.name}</p>
                <p className="text-hd-burgundy font-bold text-sm">{formatRupiah(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center font-semibold text-sm text-hd-dark">{quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                  className="w-7 h-7 rounded-full bg-hd-burgundy text-white flex items-center justify-center hover:bg-hd-burgundy-dark transition-colors"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-hd-cream transition-colors ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-hd-dark">Catatan</span>
          </div>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Catatan untuk pesanan..."
            className="w-full text-sm text-gray-600 placeholder-gray-300 bg-transparent outline-none"
          />
        </div>

        {/* Voucher */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 px-4 py-3">
          {appliedVoucher ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Ticket size={16} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-700 truncate">{appliedVoucher.title}</p>
                <p className="text-xs text-green-500">Hemat {formatRupiah(discount)}</p>
              </div>
              <button
                onClick={removeVoucher}
                className="text-xs text-red-400 font-semibold hover:text-red-600 transition-colors"
              >
                Hapus
              </button>
            </div>
          ) : (
            <Link href="/voucher" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Ticket size={16} className="text-gray-400" />
              </div>
              <span className="flex-1 text-sm font-semibold text-hd-dark">Pakai Voucher</span>
              <ChevronRight size={16} className="text-gray-300" />
            </Link>
          )}
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-hd-dark">Metode Pembayaran</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setPaymentMethod(opt.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                  paymentMethod === opt.id
                    ? 'border-hd-burgundy bg-hd-cream'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-lg leading-none">{opt.emoji}</span>
                <span className={`text-xs font-semibold truncate ${paymentMethod === opt.id ? 'text-hd-burgundy' : 'text-gray-600'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 px-4 py-4">
          <p className="text-sm font-bold text-hd-dark mb-3">Ringkasan Pesanan</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatRupiah(sub)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon Voucher</span>
                <span>-{formatRupiah(discount)}</span>
              </div>
            )}
            {mode === 'delivery' && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Ongkos Kirim</span>
                <span>{formatRupiah(fee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-amber-500 pt-1">
              <span>⭐ Poin yang didapat</span>
              <span>+{points} poin</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
              <span className="text-hd-dark">Total</span>
              <span className="text-hd-burgundy">{formatRupiah(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-hd-cream border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}
      </div>

      {/* CTA fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 bg-hd-burgundy text-white font-bold text-base rounded-2xl hover:bg-hd-burgundy-dark transition-colors disabled:opacity-60 shadow-lg shadow-hd-burgundy/20 flex items-center justify-center gap-2"
        >
          {loading ? 'Memproses...' : `Pesan Sekarang — ${formatRupiah(grandTotal)}`}
        </button>
      </div>
    </div>
  )
}
