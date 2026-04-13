'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Gift } from 'lucide-react'
import { Eyebrow } from '@/components/ui'

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
  is_gift?: boolean | null
  recipient_name?: string | null
  gift_token?: string | null
  store: { name: string } | null
  order_items: OrderItem[]
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready']
const HISTORY_STATUSES = ['delivered', 'cancelled']

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'In preparation',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_ACCENT: Record<string, string> = {
  pending: 'text-hd-gold',
  confirmed: 'text-hd-burgundy-light',
  preparing: 'text-hd-burgundy',
  ready: 'text-hd-dark',
  delivered: 'text-hd-ink/50',
  cancelled: 'text-hd-ink/40 line-through',
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'moments ago'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} d ago`
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function OrderRow({ order, index }: { order: Order; index: number }) {
  const accent = STATUS_ACCENT[order.status] ?? 'text-hd-ink/60'
  const first = order.order_items?.[0]
  const firstName = first?.menu_item?.name ?? '—'
  const rest = Math.max(0, (order.order_items?.length ?? 0) - 1)

  return (
    <Link href={`/orders/${order.id}`} className="block group">
      <div className="py-5 border-b border-hd-ink/10 hover:bg-hd-paper transition-colors duration-300">
        <div className="flex items-baseline justify-between gap-3">
          <span className="numeral text-[0.65rem] text-hd-ink/40 tracking-widest">
            N° {String(index + 1).padStart(3, '0')} · #{order.id.slice(-6).toUpperCase()}
          </span>
          <span className={`eyebrow ${accent}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        {order.is_gift && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-hd-burgundy text-hd-cream eyebrow text-[0.65rem]">
            <Gift size={11} />
            Gift {order.recipient_name ? `to ${order.recipient_name}` : ''}
          </div>
        )}

        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[1.15rem] text-hd-ink tracking-editorial truncate">
              {firstName}
              {rest > 0 && (
                <span className="font-display italic text-hd-ink/50 text-[0.95rem]">
                  &nbsp;+ {rest} more
                </span>
              )}
            </p>
            <p className="eyebrow text-hd-ink/50 mt-2">
              {timeAgo(order.created_at)}
              {order.store?.name && <> · {order.store.name}</>}
            </p>
          </div>
          <div className="flex items-end gap-3 shrink-0">
            <span className="numeral text-[0.95rem] text-hd-ink">
              {formatRupiah(order.total_amount)}
            </span>
            <ArrowUpRight className="w-4 h-4 text-hd-ink/40 mb-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ tab }: { tab: 'active' | 'history' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-hd-ink/10 border-dashed mt-6">
      <p className="font-display italic text-[1.1rem] text-hd-ink/60">
        {tab === 'active' ? 'No orders in progress.' : 'No past orders yet.'}
      </p>
      <Link href="/menu" className="eyebrow text-hd-burgundy inline-flex items-center gap-1.5">
        Browse the menu <ArrowUpRight className="w-3 h-3" />
      </Link>
    </div>
  )
}

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const [tab, setTab] = useState<'active' | 'history'>('active')

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
  const historyOrders = orders.filter((o) => HISTORY_STATUSES.includes(o.status))
  const displayed = tab === 'active' ? activeOrders : historyOrders

  return (
    <div className="page-enter min-h-screen bg-hd-cream pb-24">
      {/* Masthead */}
      <header className="px-5 pt-12 pb-5 border-b border-hd-ink/15 bg-hd-cream/95 backdrop-blur-md sticky top-0 z-20">
        <Eyebrow number="03">Your dossier</Eyebrow>
        <h1 className="mt-3 font-display text-display-lg text-hd-ink tracking-editorial">
          Orders
        </h1>

        <div className="flex gap-6 mt-6">
          {[
            { key: 'active' as const, label: 'In progress', count: activeOrders.length },
            { key: 'history' as const, label: 'Archive', count: historyOrders.length },
          ].map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative pb-2 flex items-baseline gap-2"
              >
                <span
                  className={`font-display text-[1rem] transition-colors ${
                    active ? 'text-hd-burgundy italic' : 'text-hd-ink/60'
                  }`}
                >
                  {t.label}
                </span>
                <span
                  className={`numeral text-[0.7rem] ${active ? 'text-hd-burgundy' : 'text-hd-ink/40'}`}
                >
                  {String(t.count).padStart(2, '0')}
                </span>
                {active && <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-hd-burgundy" />}
              </button>
            )
          })}
        </div>
      </header>

      <div className="px-5">
        {displayed.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div>
            {displayed.map((order, i) => (
              <OrderRow key={order.id} order={order} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
