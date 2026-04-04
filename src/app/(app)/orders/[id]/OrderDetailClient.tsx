'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Receipt,
  CheckCircle2,
  UtensilsCrossed,
  Package,
  PartyPopper,
  XCircle,
  MessageCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils/format'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

interface OrderItem {
  quantity: number
  unit_price: number
  menu_item: { name: string } | null
}

interface Order {
  id: string
  status: OrderStatus
  total_amount: number
  discount_amount: number
  delivery_fee: number
  points_earned: number
  order_mode: 'pickup' | 'delivery' | 'dinein'
  table_number: number | null
  payment_method: string
  notes: string | null
  created_at: string
  store: { name: string; address: string } | null
  order_items: OrderItem[]
}

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

const MODE_LABEL: Record<string, string> = {
  pickup: 'Pick Up',
  delivery: 'Delivery',
  dinein: 'Dine In',
}

const MODE_BADGE_COLOR: Record<string, string> = {
  pickup: 'bg-blue-100 text-blue-700',
  delivery: 'bg-orange-100 text-orange-700',
  dinein: 'bg-purple-100 text-purple-700',
}

function getReadyLabel(mode: string) {
  if (mode === 'pickup') return 'Siap Diambil'
  if (mode === 'delivery') return 'Sedang Diantar'
  return 'Siap di Meja Anda'
}

function getSteps(mode: string) {
  return [
    { status: 'pending', label: 'Pesanan Diterima', Icon: Receipt },
    { status: 'confirmed', label: 'Dikonfirmasi', Icon: CheckCircle2 },
    { status: 'preparing', label: 'Sedang Disiapkan', Icon: UtensilsCrossed },
    { status: 'ready', label: getReadyLabel(mode), Icon: Package },
    { status: 'delivered', label: 'Selesai', Icon: PartyPopper },
  ]
}

export default function OrderDetailClient({ order: initialOrder }: { order: Order }) {
  const [order, setOrder] = useState(initialOrder)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`order-detail-${initialOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${initialOrder.id}`,
        },
        (payload) => {
          setOrder(prev => ({ ...prev, ...(payload.new as Partial<Order>) }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, initialOrder.id])

  const currentIdx = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const steps = getSteps(order.order_mode)

  const subtotal = order.total_amount - order.delivery_fee + order.discount_amount

  return (
    <div className="min-h-screen bg-hd-cream pb-32">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/orders"
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={22} className="text-hd-dark" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-hd-dark">Detail Pesanan</h1>
          <p className="text-xs font-mono text-gray-400">#{order.id.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Status tracker */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 px-5 py-5">
          <h2 className="text-sm font-bold text-hd-dark mb-4">Status Pesanan</h2>

          {isCancelled ? (
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-red-600">Pesanan Dibatalkan</p>
                <p className="text-xs text-gray-400">Pesanan ini telah dibatalkan</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {steps.map((step, idx) => {
                const isCompleted = idx < currentIdx
                const isActive = idx === currentIdx
                const isFuture = idx > currentIdx
                const isLast = idx === steps.length - 1

                const iconBg = isActive
                  ? 'bg-hd-red text-white animate-pulse'
                  : isCompleted
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-300'

                const connectorColor = isCompleted ? 'bg-green-400' : 'bg-gray-200'

                return (
                  <div key={step.status} className="flex gap-4">
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${iconBg}`}>
                        <step.Icon size={18} />
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 min-h-[24px] my-1 ${connectorColor} transition-colors`} />
                      )}
                    </div>

                    {/* Label */}
                    <div className={`pb-4 pt-2 ${isLast ? '' : ''}`}>
                      <p className={`text-sm font-semibold leading-tight ${
                        isActive
                          ? 'text-hd-red'
                          : isCompleted
                          ? 'text-green-600'
                          : isFuture
                          ? 'text-gray-300'
                          : 'text-hd-dark'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Order details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 px-5 py-4 space-y-3">
          <h2 className="text-sm font-bold text-hd-dark">Info Pesanan</h2>

          {/* Mode badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${MODE_BADGE_COLOR[order.order_mode]}`}>
              {MODE_LABEL[order.order_mode]}
            </span>
            {order.order_mode === 'dinein' && order.table_number != null && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                Meja {order.table_number}
              </span>
            )}
          </div>

          {/* Store */}
          {order.store && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Outlet</p>
              <p className="text-sm font-semibold text-hd-dark">{order.store.name}</p>
              <p className="text-xs text-gray-500">{order.store.address}</p>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Catatan</p>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Item list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 px-5 py-4">
          <h2 className="text-sm font-bold text-hd-dark mb-3">Item Pesanan</h2>
          <div className="space-y-2">
            {order.order_items.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5 text-center">
                    {item.quantity}x
                  </span>
                  <span className="text-sm text-hd-dark">
                    {item.menu_item?.name ?? 'Item'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-hd-dark">
                  {formatRupiah(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 px-5 py-4 space-y-2">
          <h2 className="text-sm font-bold text-hd-dark mb-1">Ringkasan Pembayaran</h2>

          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>

          {order.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Diskon</span>
              <span>-{formatRupiah(order.discount_amount)}</span>
            </div>
          )}

          {order.order_mode === 'delivery' && order.delivery_fee > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Ongkos Kirim</span>
              <span>{formatRupiah(order.delivery_fee)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-500">
            <span>Metode Bayar</span>
            <span className="capitalize">{order.payment_method}</span>
          </div>

          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
            <span className="text-hd-dark">Total</span>
            <span className="text-hd-red">{formatRupiah(order.total_amount)}</span>
          </div>

          {order.points_earned > 0 && !isCancelled && (
            <div className="bg-amber-50 rounded-xl px-3 py-2 flex items-center justify-between mt-1">
              <span className="text-xs text-amber-700">Poin yang didapat</span>
              <span className="text-xs font-bold text-amber-600">+{order.points_earned} poin ⭐</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-hd-cream via-hd-cream to-transparent space-y-3">
        <Link
          href="/menu"
          className="w-full py-3.5 bg-hd-red text-white font-bold text-sm rounded-2xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100 flex items-center justify-center"
        >
          Pesan Lagi
        </Link>
        <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
          <MessageCircle size={15} className="text-gray-400" />
          <span>Butuh Bantuan?</span>
        </div>
      </div>
    </div>
  )
}
