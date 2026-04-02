'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type OrderRow = Database['public']['Tables']['orders']['Row']

interface OrderItemRow {
  quantity: number
  unit_price: number
  menu_items: { name: string } | null
}

interface OrderWithItems extends OrderRow {
  order_items: OrderItemRow[]
}

const STEPS = [
  { status: 'pending',   label: 'Diterima',    icon: '📋' },
  { status: 'confirmed', label: 'Dikonfirmasi', icon: '✅' },
  { status: 'preparing', label: 'Diproses',     icon: '👨‍🍳' },
  { status: 'ready',     label: 'Siap Ambil',   icon: '🎉' },
  { status: 'delivered', label: 'Selesai',       icon: '📦' },
]

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(n)
}

export default function OrderStatusTracker({ order: initialOrder }: { order: OrderWithItems }) {
  const [order, setOrder] = useState(initialOrder)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`order-${initialOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${initialOrder.id}`,
        },
        (payload) => {
          setOrder(prev => ({ ...prev, ...(payload.new as Partial<OrderRow>) }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, initialOrder.id])

  const currentIdx = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${
      isCancelled ? 'border-red-100' : 'border-gray-50'
    }`}>
      {/* Order header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isCancelled ? 'bg-red-50' : 'bg-gray-50'
      }`}>
        <div>
          <span className="font-mono text-xs text-gray-400">
            #{order.id.slice(-8).toUpperCase()}
          </span>
          <p className="font-bold text-hd-dark text-sm">
            {formatRupiah(order.total_amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">
            {new Date(order.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          {order.points_earned > 0 && !isCancelled && (
            <p className="text-xs text-yellow-600 font-semibold">
              +{order.points_earned} poin ⭐
            </p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-2 border-b border-gray-50 space-y-1">
        {order.order_items.map((item, i) => (
          <div key={i} className="flex justify-between text-xs text-gray-500">
            <span>{item.menu_items?.name} ×{item.quantity}</span>
            <span>{formatRupiah(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Status tracker */}
      <div className="px-4 py-4">
        {isCancelled ? (
          <div className="flex items-center gap-2 text-red-500">
            <span className="text-xl">❌</span>
            <span className="font-semibold text-sm">Pesanan Dibatalkan</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const done = idx <= currentIdx
              const active = idx === currentIdx
              return (
                <div key={step.status} className="flex flex-col items-center flex-1">
                  {/* Connector line left */}
                  <div className="flex items-center w-full">
                    {idx > 0 && (
                      <div className={`flex-1 h-0.5 ${idx <= currentIdx ? 'bg-hd-red' : 'bg-gray-200'}`} />
                    )}
                    {/* Circle */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all ${
                      active
                        ? 'bg-hd-red text-white shadow-lg shadow-red-200 scale-110'
                        : done
                        ? 'bg-hd-red text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.icon}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 ${idx < currentIdx ? 'bg-hd-red' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  {/* Label */}
                  <p className={`text-[10px] mt-1 font-medium text-center leading-tight ${
                    active ? 'text-hd-red' : done ? 'text-gray-600' : 'text-gray-300'
                  }`}>
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
