'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, Clock, ShoppingBag } from 'lucide-react'

type OrderItem = {
  quantity: number
  menu_item: { name: string } | null
}

type Order = {
  id: string
  status: string
  total_amount: number
  order_mode: string | null
  created_at: string
  store: { name: string } | null
  order_items: OrderItem[]
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready']
const HISTORY_STATUSES = ['delivered', 'cancelled']

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  preparing: 'Diproses',
  ready: 'Siap Ambil',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function ItemSummary({ items }: { items: OrderItem[] }) {
  if (!items || items.length === 0) return <span className="text-gray-400 text-xs">—</span>
  const first = items[0]
  const name = first.menu_item?.name ?? 'Item'
  const rest = items.length - 1
  return (
    <span className="text-gray-500 text-xs">
      {name} x{first.quantity}{rest > 0 ? `, +${rest} lainnya` : ''}
    </span>
  )
}

function OrderCard({ order }: { order: Order }) {
  const isDelivered = order.status === 'delivered'
  const badgeClass = STATUS_BADGE_CLASSES[order.status] ?? 'bg-gray-100 text-gray-600'

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        {/* Top row: ID + badge */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-gray-500 tracking-wider">
            #{order.id.slice(-8).toUpperCase()}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        {/* Time + store */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {timeAgo(order.created_at)}
          </span>
          {order.store?.name && (
            <span className="flex items-center gap-1">
              <ShoppingBag size={12} />
              {order.store.name}
            </span>
          )}
        </div>

        {/* Item summary */}
        <ItemSummary items={order.order_items} />

        {/* Bottom row: total + reorder button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-hd-red font-bold text-sm">
            {formatRupiah(order.total_amount)}
          </span>
          {isDelivered && (
            <Link
              href="/menu"
              onClick={(e) => e.stopPropagation()}
              className="text-xs bg-hd-red text-white px-3 py-1.5 rounded-full font-semibold"
            >
              Pesan Lagi
            </Link>
          )}
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ tab }: { tab: 'active' | 'history' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Package size={48} className="text-gray-200 mb-4" />
      <p className="text-gray-500 font-semibold">
        {tab === 'active' ? 'Tidak ada pesanan aktif' : 'Belum ada riwayat'}
      </p>
      <Link
        href="/menu"
        className="mt-4 text-sm bg-hd-red text-white px-5 py-2 rounded-full font-semibold"
      >
        Pesan Sekarang
      </Link>
    </div>
  )
}

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const [tab, setTab] = useState<'active' | 'history'>('active')

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status))
  const historyOrders = orders.filter(o => HISTORY_STATUSES.includes(o.status))

  const displayed = tab === 'active' ? activeOrders : historyOrders

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-hd-dark">Pesanan</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 pb-3 border-b border-gray-100">
        <div className="flex gap-2 pt-3">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'active'
                ? 'bg-hd-red text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            Aktif ({activeOrders.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'history'
                ? 'bg-hd-red text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            Riwayat ({historyOrders.length})
          </button>
        </div>
      </div>

      {/* Order list */}
      <div className="px-4 py-4 space-y-3">
        {displayed.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          displayed.map(order => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  )
}
