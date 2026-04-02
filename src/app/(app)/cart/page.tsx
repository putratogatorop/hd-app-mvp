'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { placeOrder } from './actions'

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, clearCart, total, earnedPoints } =
    useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    if (!items.length) return
    setLoading(true)
    setError(null)
    try {
      await placeOrder(
        items.map(i => ({
          id: i.item.id,
          name: i.item.name,
          price: i.item.price,
          quantity: i.quantity,
        })),
        total(),
        earnedPoints()
      )
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setLoading(false)
    }
  }

  if (!items.length) {
    return (
      <div className="page-enter min-h-screen flex flex-col">
        <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-hd-dark">Keranjang 🛒</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
          <span className="text-6xl mb-4">🛒</span>
          <p className="text-gray-500 font-medium">Keranjangmu kosong</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Tambahkan ice cream favoritmu!</p>
          <Link
            href="/menu"
            className="bg-hd-red text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors"
          >
            Lihat Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-hd-dark">Keranjang 🛒</h1>
        <p className="text-gray-400 text-sm">{items.length} jenis item</p>
      </div>

      {/* Items */}
      <div className="px-4 py-4 space-y-3">
        {items.map(({ item, quantity }) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🍨</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-hd-dark text-sm truncate">{item.name}</p>
              <p className="text-hd-red font-bold text-sm">
                {formatRupiah(item.price * quantity)}
              </p>
            </div>

            {/* Qty controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-semibold"
              >
                −
              </button>
              <span className="w-5 text-center font-semibold text-sm">{quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="w-7 h-7 rounded-full bg-hd-red text-white flex items-center justify-center hover:bg-red-700 font-semibold"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Subtotal</span>
          <span>{formatRupiah(total())}</span>
        </div>
        <div className="flex justify-between text-sm text-green-600 mb-3">
          <span>⭐ Poin yang akan didapat</span>
          <span>+{earnedPoints()} poin</span>
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-hd-dark">
          <span>Total</span>
          <span className="text-hd-red">{formatRupiah(total())}</span>
        </div>
      </div>

      {error && (
        <div className="mx-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Checkout button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 bg-hd-red text-white font-bold text-base rounded-2xl hover:bg-red-700 transition-colors disabled:opacity-60 shadow-lg shadow-red-200"
        >
          {loading ? 'Memproses...' : `Pesan Sekarang · ${formatRupiah(total())}`}
        </button>
        <button
          onClick={() => router.push('/menu')}
          className="w-full py-3 text-gray-500 text-sm font-medium mt-2"
        >
          + Tambah Item Lagi
        </button>
      </div>
    </div>
  )
}
