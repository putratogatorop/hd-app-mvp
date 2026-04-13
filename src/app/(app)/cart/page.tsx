'use client'

import { useEffect, useMemo, useState } from 'react'
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
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { useOrderContext } from '@/lib/store/order-context'
import { formatRupiah } from '@/lib/utils/format'
import { placeOrder } from './actions'
import { Eyebrow } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

const PAYMENT_OPTIONS = [
  { id: 'gopay', label: 'GoPay' },
  { id: 'ovo', label: 'OVO' },
  { id: 'dana', label: 'Dana' },
  { id: 'card', label: 'Credit / Debit' },
]

const MODE_LABEL: Record<string, string> = {
  pickup: 'Pick Up',
  delivery: 'Delivery',
  dinein: 'Dine In',
}

export default function CartPage() {
  const router = useRouter()
  const {
    items,
    addItem,
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

  const [toppings, setToppings] = useState<MenuItem[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('menu_items')
      .select('*')
      .eq('category', 'topping')
      .eq('is_available', true)
      .order('price', { ascending: true })
      .then(({ data }) => {
        if (data) setToppings(data)
      })
  }, [])

  const upsellItems = useMemo(() => {
    const inCart = new Set(items.map((i) => i.item.id))
    return toppings.filter((t) => !inCart.has(t.id)).slice(0, 6)
  }, [toppings, items])

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
        items: items.map((i) => ({
          id: i.item.id,
          name: i.item.name,
          price: i.item.price,
          quantity: i.quantity,
        })),
        totalAmount: grandTotal,
        earnedPoints: points,
        storeId: selectedStore?.id ?? null,
        orderMode: mode,
        tableNumber,
        voucherId: appliedVoucher?.id ?? null,
        discountAmount: discount,
        deliveryFee: fee,
        paymentMethod,
        notes,
      })
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  // ── Empty state ──
  if (!items.length) {
    return (
      <div className="min-h-screen bg-hd-cream flex flex-col">
        <div className="px-5 pt-10 pb-5 border-b border-hd-ink/15 flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 flex items-center justify-center border border-hd-ink/30 hover:bg-hd-ink hover:text-hd-cream transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <Eyebrow>Basket</Eyebrow>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <p className="font-display italic text-[1.4rem] text-hd-ink/60">
            Your basket awaits<br />its first flavour.
          </p>
          <Link
            href="/menu"
            className="eyebrow text-hd-burgundy inline-flex items-center gap-2 border-b border-hd-burgundy pb-1 hover:border-hd-burgundy-dark"
          >
            Browse the selection <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hd-cream pb-36">
      {/* ── Masthead ── */}
      <header className="px-5 pt-10 pb-5 border-b border-hd-ink/15 sticky top-0 bg-hd-cream/95 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 flex items-center justify-center border border-hd-ink/30 hover:bg-hd-ink hover:text-hd-cream transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <Eyebrow number={String(itemCount).padStart(2, '0')}>Basket</Eyebrow>
            <h1 className="font-display text-[2rem] leading-tight text-hd-ink tracking-editorial mt-1">
              Your <span className="italic">order</span>
            </h1>
          </div>
        </div>
      </header>

      {/* ── Order mode strip ── */}
      <section className="px-5 py-5 border-b border-hd-ink/10">
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-hd-burgundy" />
          <div className="flex-1 min-w-0">
            <span className="eyebrow text-hd-ink/50">{MODE_LABEL[mode]}{mode === 'dinein' && tableNumber ? ` · Table ${tableNumber}` : ''}</span>
            <p className="font-display text-[1rem] text-hd-ink mt-0.5 truncate">
              {selectedStore?.name ?? 'Select a store'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Items ── */}
      <section className="px-5 pt-6">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3">
          <Eyebrow number="01">Items</Eyebrow>
          <span className="numeral text-[0.7rem] text-hd-ink/50">{String(itemCount).padStart(2, '0')} units</span>
        </div>
        <ul className="divide-y divide-hd-ink/10">
          {items.map(({ item, quantity }) => (
            <li key={item.id} className="py-5 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-display text-[1.05rem] text-hd-ink tracking-editorial leading-tight">
                  {item.name}
                </p>
                <p className="numeral text-[0.8rem] text-hd-ink/55 mt-1">
                  {formatRupiah(item.price)} × {quantity}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="w-11 h-11 flex items-center justify-center border border-hd-ink/30 hover:bg-hd-ink hover:text-hd-cream transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="numeral w-7 text-center text-hd-ink">{String(quantity).padStart(2, '0')}</span>
                <button
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                  className="w-11 h-11 flex items-center justify-center border border-hd-ink/30 hover:bg-hd-ink hover:text-hd-cream transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-11 h-11 flex items-center justify-center text-hd-ink/40 hover:text-hd-burgundy transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Upsell: Complete your treat ── */}
      {upsellItems.length > 0 && (
        <section className="px-5 pt-8">
          <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3">
            <Eyebrow number="02">Complete your treat</Eyebrow>
            <Sparkles size={14} className="text-hd-gold" />
          </div>
          <p className="mt-3 font-display italic text-[0.85rem] text-hd-ink/55">
            A small addition, perfectly paired.
          </p>
          <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {upsellItems.map((topping) => (
              <button
                key={topping.id}
                onClick={() => addItem(topping)}
                className="group shrink-0 w-40 text-left bg-hd-paper border border-hd-ink/15 hover:border-hd-burgundy transition-colors p-4 flex flex-col gap-3"
              >
                <div className="flex-1 min-h-[48px]">
                  <p className="font-display text-[0.95rem] leading-tight text-hd-ink tracking-editorial line-clamp-2">
                    {topping.name}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-hd-ink/10">
                  <span className="numeral text-[0.8rem] text-hd-ink">
                    + {formatRupiah(topping.price)}
                  </span>
                  <span className="eyebrow text-hd-burgundy group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    Add <Plus size={12} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Notes ── */}
      <section className="px-5 pt-8">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3">
          <Eyebrow number="03">A note</Eyebrow>
          <StickyNote size={14} className="text-hd-ink/40" />
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything we should know…"
          className="w-full h-12 bg-transparent border-b border-hd-ink/20 focus:border-hd-ink transition-colors text-[0.9rem] placeholder:text-hd-ink/35 focus:outline-none italic font-display"
        />
      </section>

      {/* ── Voucher ── */}
      <section className="px-5 pt-8">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3">
          <Eyebrow number="04">Voucher</Eyebrow>
          <Ticket size={14} className="text-hd-ink/40" />
        </div>
        {appliedVoucher ? (
          <div className="py-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1rem] text-hd-ink truncate">{appliedVoucher.title}</p>
              <p className="numeral text-[0.75rem] text-hd-burgundy mt-1">
                − {formatRupiah(discount)}
              </p>
            </div>
            <button
              onClick={removeVoucher}
              className="eyebrow text-hd-burgundy hover:text-hd-burgundy-dark transition-colors ml-4"
            >
              Remove
            </button>
          </div>
        ) : (
          <Link
            href="/voucher"
            className="flex items-center justify-between py-4 group hover:text-hd-burgundy transition-colors"
          >
            <span className="font-display italic text-[0.95rem] text-hd-ink/60 group-hover:text-hd-burgundy transition-colors">
              Apply a voucher
            </span>
            <ArrowUpRight className="w-4 h-4 text-hd-ink/40 group-hover:text-hd-burgundy transition-colors" />
          </Link>
        )}
      </section>

      {/* ── Payment ── */}
      <section className="px-5 pt-8">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3">
          <Eyebrow number="05">Payment</Eyebrow>
          <CreditCard size={14} className="text-hd-ink/40" />
        </div>
        <div className="grid grid-cols-2 gap-px bg-hd-ink/10 border border-hd-ink/10 mt-4">
          {PAYMENT_OPTIONS.map((opt) => {
            const active = paymentMethod === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setPaymentMethod(opt.id)}
                className={`py-4 px-4 text-left transition-colors ${
                  active ? 'bg-hd-burgundy text-hd-cream' : 'bg-hd-paper hover:bg-hd-cream-deep'
                }`}
              >
                <span
                  className={`font-display text-[0.95rem] tracking-editorial ${
                    active ? 'italic' : ''
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Summary ── */}
      <section className="px-5 pt-10">
        <Eyebrow number="06">Summary</Eyebrow>
        <dl className="mt-4 space-y-3 border-b border-hd-ink/15 pb-4">
          <div className="flex justify-between text-[0.85rem]">
            <dt className="text-hd-ink/60">Subtotal</dt>
            <dd className="numeral text-hd-ink">{formatRupiah(sub)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[0.85rem] text-hd-burgundy">
              <dt>Voucher discount</dt>
              <dd className="numeral">− {formatRupiah(discount)}</dd>
            </div>
          )}
          {mode === 'delivery' && (
            <div className="flex justify-between text-[0.85rem]">
              <dt className="text-hd-ink/60">Delivery</dt>
              <dd className="numeral text-hd-ink">{formatRupiah(fee)}</dd>
            </div>
          )}
          <div className="flex justify-between text-[0.8rem] pt-2">
            <dt className="eyebrow text-hd-gold">Points earned</dt>
            <dd className="numeral text-hd-gold">+ {points}</dd>
          </div>
        </dl>
        <div className="flex items-baseline justify-between pt-5">
          <span className="eyebrow text-hd-ink/60">Total</span>
          <span className="numeral text-[1.8rem] text-hd-ink">{formatRupiah(grandTotal)}</span>
        </div>
      </section>

      {error && (
        <div className="mx-5 mt-4 border border-hd-burgundy/30 bg-hd-burgundy/5 text-hd-burgundy text-[0.8rem] px-4 py-3">
          {error}
        </div>
      )}

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pt-4 pb-safe bg-gradient-to-t from-hd-cream via-hd-cream/95 to-transparent z-30" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full h-14 flex items-center justify-between px-6 bg-hd-burgundy text-hd-cream border border-hd-burgundy hover:bg-hd-burgundy-dark transition-colors disabled:opacity-60 group"
        >
          <span className="eyebrow">{loading ? 'Processing…' : 'Place order'}</span>
          <span className="numeral text-[1rem] transition-transform group-hover:translate-x-0.5">
            {formatRupiah(grandTotal)}
          </span>
        </button>
      </div>
    </div>
  )
}
