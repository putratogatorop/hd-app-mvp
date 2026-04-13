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
  ArrowUpRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils/format'
import { Eyebrow } from '@/components/ui'

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

function getReadyLabel(mode: string) {
  if (mode === 'pickup') return 'Ready for collection'
  if (mode === 'delivery') return 'On its way'
  return 'At your table'
}

function getSteps(mode: string) {
  return [
    { status: 'pending', label: 'Order received', Icon: Receipt },
    { status: 'confirmed', label: 'Confirmed', Icon: CheckCircle2 },
    { status: 'preparing', label: 'In preparation', Icon: UtensilsCrossed },
    { status: 'ready', label: getReadyLabel(mode), Icon: Package },
    { status: 'delivered', label: 'Complete', Icon: PartyPopper },
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
          setOrder((prev) => ({ ...prev, ...(payload.new as Partial<Order>) }))
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, initialOrder.id])

  const currentIdx = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const steps = getSteps(order.order_mode)
  const subtotal = order.total_amount - order.delivery_fee + order.discount_amount
  const shortId = order.id.slice(-8).toUpperCase()
  const createdAt = new Date(order.created_at).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-hd-cream pb-32">
      {/* Masthead */}
      <header className="px-5 pt-10 pb-5 border-b border-hd-ink/15 sticky top-0 z-10 bg-hd-cream/95 backdrop-blur-md flex items-center gap-3">
        <Link
          href="/orders"
          className="w-9 h-9 flex items-center justify-center border border-hd-ink/30 hover:bg-hd-ink hover:text-hd-cream transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <Eyebrow>Order · {MODE_LABEL[order.order_mode]}</Eyebrow>
          <h1 className="mt-1 font-display text-[1.5rem] text-hd-ink tracking-editorial leading-tight truncate">
            N° <span className="numeral text-[1.35rem]">{shortId}</span>
          </h1>
        </div>
      </header>

      {/* ── Status tracker ── */}
      <section className="px-5 pt-8">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3">
          <Eyebrow number="01">Progress</Eyebrow>
          <span className="numeral text-[0.65rem] text-hd-ink/50 tracking-widest">{createdAt}</span>
        </div>

        {isCancelled ? (
          <div className="mt-5 flex items-center gap-3 p-4 border border-hd-burgundy/30">
            <XCircle size={22} className="text-hd-burgundy" />
            <div>
              <p className="font-display italic text-[1rem] text-hd-burgundy">Order cancelled</p>
              <p className="text-[0.75rem] text-hd-ink/60 mt-0.5">This order did not proceed.</p>
            </div>
          </div>
        ) : (
          <ol className="mt-6">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentIdx
              const isActive = idx === currentIdx
              const isLast = idx === steps.length - 1

              return (
                <li key={step.status} className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive
                          ? 'bg-hd-burgundy text-hd-cream border-hd-burgundy animate-pulse'
                          : isCompleted
                          ? 'bg-hd-ink text-hd-cream border-hd-ink'
                          : 'bg-hd-paper text-hd-ink/30 border-hd-ink/15'
                      }`}
                    >
                      <step.Icon size={15} />
                    </div>
                    {!isLast && (
                      <div
                        className={`w-px flex-1 min-h-[32px] my-1 transition-colors ${
                          isCompleted ? 'bg-hd-ink' : 'bg-hd-ink/15'
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-6 pt-2 flex-1">
                    <span className="numeral text-[0.65rem] text-hd-ink/40 tracking-widest block">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p
                      className={`font-display text-[1rem] tracking-editorial mt-0.5 ${
                        isActive
                          ? 'text-hd-burgundy italic'
                          : isCompleted
                          ? 'text-hd-ink'
                          : 'text-hd-ink/40'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* ── Order info ── */}
      <section className="px-5 pt-4">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3">
          <Eyebrow number="02">Details</Eyebrow>
        </div>

        <dl className="mt-4 space-y-4">
          <div className="flex justify-between items-baseline">
            <dt className="eyebrow text-hd-ink/50">Mode</dt>
            <dd className="font-display text-[0.95rem] text-hd-ink">
              {MODE_LABEL[order.order_mode]}
              {order.order_mode === 'dinein' && order.table_number != null && (
                <span className="italic text-hd-ink/60"> · Table {order.table_number}</span>
              )}
            </dd>
          </div>
          {order.store && (
            <div className="flex justify-between items-baseline gap-4">
              <dt className="eyebrow text-hd-ink/50">Store</dt>
              <dd className="font-display text-[0.95rem] text-hd-ink text-right truncate max-w-[60%]">
                {order.store.name}
              </dd>
            </div>
          )}
          {order.notes && (
            <div>
              <dt className="eyebrow text-hd-ink/50 mb-1 block">Note</dt>
              <dd className="font-display italic text-[0.9rem] text-hd-ink/70">
                &ldquo;{order.notes}&rdquo;
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* ── Items ── */}
      <section className="px-5 pt-10">
        <Eyebrow number="03">Items</Eyebrow>
        <ul className="mt-3 divide-y divide-hd-ink/10 border-y border-hd-ink/10">
          {order.order_items.map((item, i) => (
            <li key={i} className="py-4 flex items-baseline gap-4">
              <span className="numeral text-[0.75rem] text-hd-ink/50 w-8">
                × {item.quantity}
              </span>
              <span className="font-display text-[0.95rem] text-hd-ink flex-1 tracking-editorial">
                {item.menu_item?.name ?? 'Item'}
              </span>
              <span className="numeral text-[0.85rem] text-hd-ink">
                {formatRupiah(item.unit_price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Payment summary ── */}
      <section className="px-5 pt-10">
        <Eyebrow number="04">Payment</Eyebrow>
        <dl className="mt-4 space-y-3 border-b border-hd-ink/15 pb-4">
          <div className="flex justify-between text-[0.85rem]">
            <dt className="text-hd-ink/60">Subtotal</dt>
            <dd className="numeral text-hd-ink">{formatRupiah(subtotal)}</dd>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-[0.85rem] text-hd-burgundy">
              <dt>Discount</dt>
              <dd className="numeral">− {formatRupiah(order.discount_amount)}</dd>
            </div>
          )}
          {order.order_mode === 'delivery' && order.delivery_fee > 0 && (
            <div className="flex justify-between text-[0.85rem]">
              <dt className="text-hd-ink/60">Delivery</dt>
              <dd className="numeral text-hd-ink">{formatRupiah(order.delivery_fee)}</dd>
            </div>
          )}
          <div className="flex justify-between text-[0.85rem]">
            <dt className="text-hd-ink/60">Method</dt>
            <dd className="text-hd-ink capitalize font-display italic">{order.payment_method}</dd>
          </div>
        </dl>
        <div className="flex items-baseline justify-between pt-5">
          <span className="eyebrow text-hd-ink/60">Total</span>
          <span className="numeral text-[1.8rem] text-hd-ink">
            {formatRupiah(order.total_amount)}
          </span>
        </div>
        {order.points_earned > 0 && !isCancelled && (
          <p className="mt-4 pt-4 border-t border-hd-ink/10 flex justify-between items-baseline">
            <span className="eyebrow text-hd-gold">Points earned</span>
            <span className="numeral text-[0.95rem] text-hd-gold">
              + {order.points_earned}
            </span>
          </p>
        )}
      </section>

      {/* ── Bottom actions ── */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-gradient-to-t from-hd-cream via-hd-cream/95 to-transparent space-y-3 z-20">
        <Link
          href="/menu"
          className="w-full h-13 py-4 bg-hd-burgundy text-hd-cream border border-hd-burgundy eyebrow hover:bg-hd-burgundy-dark transition-colors flex items-center justify-center gap-2 group"
        >
          <span>Order again</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
        <div className="flex items-center justify-center gap-2 text-[0.75rem] text-hd-ink/55 italic font-display">
          <MessageCircle size={12} />
          <span>Need assistance?</span>
        </div>
      </div>
    </div>
  )
}
