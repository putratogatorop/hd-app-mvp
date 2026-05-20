'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  profiles: { full_name: string | null; email: string } | null
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; next?: string; nextLabel?: string }
> = {
  pending:   { label: 'Menunggu',     color: 'text-yellow-700', bg: 'bg-yellow-100', next: 'confirmed',  nextLabel: '✅ Konfirmasi' },
  confirmed: { label: 'Dikonfirmasi', color: 'text-blue-700',   bg: 'bg-blue-100',   next: 'preparing',  nextLabel: '👨‍🍳 Proses' },
  preparing: { label: 'Diproses',     color: 'text-orange-700', bg: 'bg-orange-100', next: 'ready',      nextLabel: '🎉 Siap' },
  ready:     { label: 'Siap Ambil',   color: 'text-green-700',  bg: 'bg-green-100',  next: 'delivered',  nextLabel: '📦 Selesai' },
  delivered: { label: 'Selesai',      color: 'text-gray-600',   bg: 'bg-gray-100' },
  cancelled: { label: 'Dibatalkan',   color: 'text-red-600',    bg: 'bg-hd-cream' },
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}d lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`
  return `${Math.floor(diff / 3600)}j lalu`
}

/** Plays a short "ding" alert using the Web Audio API — no file needed */
function playAlert() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // AudioContext blocked (e.g. tab not focused) — silent fail is fine
  }
}

export default function RealtimeOrderQueue({ initialOrders }: { initialOrders: OrderWithItems[] }) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('active')
  const [newAlert, setNewAlert] = useState(false)
  const knownIdsRef = useRef<Set<string>>(new Set(initialOrders.map(o => o.id)))
  const supabase = createClient()

  // Re-fetch and detect new pending orders
  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(quantity, unit_price, menu_items(name)), profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50) as unknown as { data: OrderWithItems[] | null }

    if (!data) return

    // Detect brand-new pending orders
    const incoming = data.filter(
      o => o.status === 'pending' && !knownIdsRef.current.has(o.id)
    )
    if (incoming.length > 0) {
      playAlert()
      setNewAlert(true)
      setTimeout(() => setNewAlert(false), 3000)
      // Request browser notification if permission granted
      if (typeof window !== 'undefined' && Notification.permission === 'granted') {
        new Notification('📋 Pesanan Baru!', {
          body: `${incoming.length} pesanan baru masuk`,
          icon: '/icons/icon-192x192.png',
        })
      }
    }

    data.forEach(o => knownIdsRef.current.add(o.id))
    setOrders(data)
  }, [supabase])

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('pos-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refetch()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, refetch])

  async function advanceStatus(orderId: string, nextStatus: string) {
    setUpdating(orderId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('orders').update({ status: nextStatus }).eq('id', orderId)
    setUpdating(null)
    refetch()
  }

  async function cancelOrder(orderId: string) {
    setUpdating(orderId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    setUpdating(null)
    refetch()
  }

  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready']
  const filtered = filter === 'active'
    ? orders.filter(o => activeStatuses.includes(o.status))
    : filter === 'done'
    ? orders.filter(o => ['delivered', 'cancelled'].includes(o.status))
    : orders

  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <div>
      {/* New order alert banner */}
      {newAlert && (
        <div className="mb-4 bg-yellow-400 text-yellow-900 font-bold text-sm px-4 py-3 rounded-xl flex items-center gap-3 animate-bounce">
          <span className="text-xl">🔔</span>
          Pesanan baru masuk!
        </div>
      )}

      {/* Filter tabs + live badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {[
            { key: 'active', label: 'Aktif' },
            { key: 'done', label: 'Selesai' },
            { key: 'all', label: 'Semua' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-hd-dark text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.key === 'active' && pendingCount > 0 && (
                <span className="ml-1.5 bg-hd-burgundy text-white text-xs rounded-full px-1.5 py-0.5">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      {/* Order cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">✅</span>
          <p className="text-gray-500 mt-4 font-medium">Tidak ada pesanan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
            const isUpdating = updating === order.id
            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl shadow-sm border-2 p-4 transition-all ${
                  order.status === 'pending'
                    ? 'border-yellow-300 shadow-yellow-100'
                    : 'border-gray-100'
                }`}
              >
                {/* Order header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-xs text-gray-400">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="font-semibold text-hd-dark text-sm mt-0.5">
                      {order.profiles?.full_name ?? 'Customer'}
                    </p>
                    <p className="text-xs text-gray-400">{timeAgo(order.created_at)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-3 border-t border-b border-gray-50 py-2">
                  {order.order_items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.menu_items?.name} ×{item.quantity}</span>
                      <span className="text-gray-500 font-medium">
                        {formatRupiah(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-400">Total</span>
                  <span className="font-bold text-hd-dark">{formatRupiah(order.total_amount)}</span>
                </div>

                {/* Action buttons */}
                {cfg.next && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => advanceStatus(order.id, cfg.next!)}
                      disabled={isUpdating}
                      className="flex-1 py-2.5 bg-hd-dark text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? '⏳' : cfg.nextLabel}
                    </button>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        disabled={isUpdating}
                        className="px-3 py-2 bg-hd-cream text-red-600 text-sm font-semibold rounded-xl hover:bg-hd-cream transition-colors disabled:opacity-50"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
