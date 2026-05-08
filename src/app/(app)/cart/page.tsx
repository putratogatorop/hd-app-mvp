'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cart'
import { useOrderContext } from '@/lib/store/order-context'
import { useTranslation } from '@/lib/i18n/context'
import { useCurrency } from '@/lib/i18n/context'
import { LanguageCurrencySwitcher } from '@/components/LanguageCurrencySwitcher'
import BottomNav from '@/components/BottomNav'
import { placeOrder } from './actions'

// ── SVG icons (inline, no Lucide in transactional flows per design rules) ──────

function HamburgerIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
      <line x1="0" y1="1" x2="18" y2="1" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
      <path d="M1 6h16l-1.5 13H2.5L1 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.5 6V4.5a3.5 3.5 0 0 1 7 0V6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

// ── Section header: "01 ─────── LABEL" pattern ──────────────────────────────

function SectionNum({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 mb-5">
      <span
        className="font-mono text-[11px] tracking-[0.04em]"
        style={{ color: 'rgba(43,43,43,0.30)' }}
      >
        {num}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(43,43,43,0.12)' }} />
      <span
        className="font-sans text-[11px] tracking-[0.22em] uppercase font-semibold"
        style={{ color: 'rgba(43,43,43,0.50)' }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Delivery mode icons (v3 native: mono glyphs, not Lucide) ─────────────────

const ORDER_MODES = [
  { id: 'delivery' as const, glyph: '↑', labelKey: 'delivery.delivery' },
  { id: 'pickup'   as const, glyph: '◫', labelKey: 'delivery.pickup' },
  { id: 'dinein'   as const, glyph: '⌖', labelKey: 'delivery.dinein' },
]

// ── Cart page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()

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
    notes,
    setNotes,
    isGift,
    setIsGift,
    gift,
    setGift,
    paymentMethod,
  } = useCartStore()

  const { mode, setMode, selectedStore, tableNumber } = useOrderContext()

  // Local gift-only state
  const [includeWrap, setIncludeWrap] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sub = subtotal()
  const discount = discountAmount()
  const fee = deliveryFee(mode)
  const baseTotal = total(mode)
  const points = earnedPoints()
  const WRAP_PRICE = 25000
  const grandTotal = baseTotal + (isGift && includeWrap ? WRAP_PRICE : 0)

  // ── Empty basket ───────────────────────────────────────────────────────────
  if (!items.length) {
    return (
      <div className="min-h-screen bg-hd-cream flex flex-col">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 h-14 flex-shrink-0 border-b"
          style={{ borderColor: 'rgba(43,43,43,0.12)' }}
        >
          <button
            onClick={() => router.back()}
            className="w-7 h-7 flex items-center justify-center"
            style={{ color: '#650A30' }}
            aria-label="Back"
          >
            <HamburgerIcon />
          </button>
          <span
            className="font-display font-medium text-[17px] tracking-[0.12em] uppercase"
            style={{ color: '#650A30' }}
          >
            {t('cart.your_basket')}
          </span>
          <button
            className="w-7 h-7 flex items-center justify-center"
            style={{ color: '#650A30' }}
            aria-label="Bag"
          >
            <BagIcon />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <p className="font-display italic text-[1.4rem] text-hd-ink/60">
            Your basket awaits<br />its first flavour.
          </p>
          <Link
            href="/menu"
            className="font-sans text-[11px] tracking-[0.22em] uppercase font-semibold text-hd-burgundy border-b border-hd-burgundy pb-0.5"
          >
            Browse the selection ↗
          </Link>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ── Checkout handler ───────────────────────────────────────────────────────
  async function handleCheckout() {
    if (!items.length) return
    if (isGift) {
      if (!gift.recipientName.trim() || !gift.recipientPhone.trim()) {
        setError("Please enter the recipient's name and phone number.")
        return
      }
    }
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
        gift: isGift
          ? {
              recipientName: gift.recipientName,
              recipientPhone: gift.recipientPhone,
              recipientAddress: gift.recipientAddress,
              message: gift.message,
              scheduledFor: gift.scheduledFor,
            }
          : null,
      })
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  // ── PERSONAL VIEW (isGift = false) ─────────────────────────────────────────

  if (!isGift) {
    return (
      <div className="min-h-screen bg-hd-cream flex flex-col pb-[172px]">

        {/* ── Fixed top bar ── */}
        <div
          className="sticky top-0 z-20 bg-hd-cream flex items-center justify-between px-5 h-14 flex-shrink-0 border-b"
          style={{ borderColor: 'rgba(43,43,43,0.12)' }}
        >
          <button
            onClick={() => router.back()}
            className="w-7 h-7 flex items-center justify-center transition-colors"
            style={{ color: '#650A30' }}
            aria-label="Menu"
          >
            <HamburgerIcon />
          </button>
          <span
            className="font-display font-medium text-[17px] tracking-[0.12em] uppercase"
            style={{ color: '#650A30' }}
          >
            {t('cart.your_basket')}
          </span>
          <button
            className="w-7 h-7 flex items-center justify-center"
            style={{ color: '#650A30' }}
            aria-label="Bag"
          >
            <BagIcon />
          </button>
        </div>

        {/* ── Language / Currency switcher ── */}
        <div
          className="px-5 py-3 flex justify-end border-b"
          style={{ borderColor: 'rgba(43,43,43,0.08)' }}
        >
          <LanguageCurrencySwitcher />
        </div>

        {/* ── Mode toggle: For Me / As a Gift ── */}
        <div className="px-5 pt-5 pb-0">
          <div
            className="flex border p-1 gap-0"
            style={{ borderColor: 'rgba(43,43,43,0.20)' }}
          >
            <button
              onClick={() => setIsGift(false)}
              className="flex-1 py-3 font-sans text-[11px] tracking-[0.22em] uppercase font-semibold transition-colors"
              style={{
                background: '#650A30',
                color: '#FEF2E3',
              }}
            >
              {t('cart.for_me')}
            </button>
            <button
              onClick={() => setIsGift(true)}
              className="flex-1 py-3 font-sans text-[11px] tracking-[0.22em] uppercase font-semibold transition-colors"
              style={{
                background: 'none',
                color: 'rgba(43,43,43,0.45)',
              }}
            >
              {t('cart.as_a_gift')}
            </button>
          </div>
        </div>

        {/* ── 01 / ORDER MODE ── */}
        <section className="pt-8 pb-8">
          <SectionNum num="01" label={t('section.order_mode')} />
          <div
            className="mx-5 grid grid-cols-3 border"
            style={{ borderColor: 'rgba(43,43,43,0.12)' }}
          >
            {ORDER_MODES.map((m, idx) => {
              const isActive = mode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className="flex flex-col items-center justify-center py-[18px] pb-4 gap-1.5 transition-colors"
                  style={{
                    background: isActive ? '#650A30' : '#FEF2E3',
                    borderRight: idx < 2 ? '1px solid rgba(43,43,43,0.12)' : 'none',
                  }}
                  aria-pressed={isActive}
                >
                  <span
                    className="font-mono text-base leading-none"
                    style={{ color: isActive ? 'rgba(254,242,227,0.50)' : 'rgba(43,43,43,0.30)' }}
                  >
                    {m.glyph}
                  </span>
                  <span
                    className="font-sans text-[9px] tracking-[0.22em] uppercase font-semibold leading-none"
                    style={{ color: isActive ? 'rgba(254,242,227,0.80)' : 'rgba(43,43,43,0.50)' }}
                  >
                    {t(m.labelKey)}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── 02 / ITEMS ── */}
        <section className="pb-8">
          <SectionNum num="02" label={t('section.items')} />
          <div className="px-5 flex flex-col gap-0">
            {items.map(({ item, quantity }, idx) => (
              <div
                key={item.id}
                className="flex gap-4 items-start py-5"
                style={{
                  borderBottom: idx < items.length - 1 ? '1px solid rgba(43,43,43,0.08)' : 'none',
                }}
              >
                {/* Product image 96×96 */}
                <div
                  className="w-24 h-24 flex-shrink-0 overflow-hidden"
                  style={{ background: '#F8ECDD' }}
                >
                  <Image
                    src={`/hd-photos/${
                      idx % 2 === 0 ? 'DWizLL8k3Vq.jpg' : 'DWffta7k4Ei.jpg'
                    }`}
                    alt={item.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    style={{ filter: 'grayscale(20%)' }}
                  />
                </div>
                {/* Body */}
                <div className="flex-1 flex flex-col justify-between h-24 py-1 min-w-0">
                  {/* Top: name + remove */}
                  <div className="flex justify-between items-start">
                    <span
                      className="font-display text-[18px] font-medium leading-[1.15]"
                      style={{ color: '#2B2B2B', letterSpacing: '-0.01em' }}
                    >
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="font-mono text-[13px] pl-2 leading-none flex-shrink-0 transition-colors"
                      style={{ color: 'rgba(43,43,43,0.35)', background: 'none', border: 'none' }}
                      aria-label={`Remove ${item.name}`}
                    >
                      ×
                    </button>
                  </div>
                  {/* Bottom: qty stepper + price */}
                  <div className="flex justify-between items-end">
                    {/* Qty stepper */}
                    <div
                      className="flex items-center h-7"
                      style={{ border: '1px solid rgba(43,43,43,0.20)' }}
                    >
                      <button
                        onClick={() => updateQuantity(item.id, quantity - 1)}
                        className="w-7 h-full font-mono text-sm flex items-center justify-center transition-colors"
                        style={{ color: 'rgba(43,43,43,0.50)' }}
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span
                        className="font-mono text-[12px] h-full flex items-center justify-center px-2.5 min-w-[32px]"
                        style={{
                          color: '#2B2B2B',
                          borderLeft: '1px solid rgba(43,43,43,0.10)',
                          borderRight: '1px solid rgba(43,43,43,0.10)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {String(quantity).padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, quantity + 1)}
                        className="w-7 h-full font-mono text-sm flex items-center justify-center transition-colors"
                        style={{ color: 'rgba(43,43,43,0.50)' }}
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                    {/* Price */}
                    <span
                      className="font-mono text-[13px]"
                      style={{ color: '#650A30', letterSpacing: '-0.02em' }}
                    >
                      {formatPrice(item.price * quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 03 / VOUCHER ── */}
        <section className="pb-6 px-5">
          <SectionNum num="03" label={t('section.voucher')} />
          <Link
            href="/voucher"
            className="flex items-center justify-between pb-3 group"
            style={{ borderBottom: '1px solid rgba(43,43,43,0.10)' }}
          >
            <span
              className="font-sans text-[13px] font-medium underline underline-offset-[3px]"
              style={{
                color: '#650A30',
                textDecorationColor: 'rgba(101,10,48,0.35)',
                letterSpacing: '0.06em',
              }}
            >
              {t('cart.voucher_add')}
            </span>
            <span style={{ color: 'rgba(43,43,43,0.35)', fontSize: '14px' }}>↗</span>
          </Link>
        </section>

        {/* ── 04 / NOTES ── */}
        <section className="pb-8 px-5">
          <SectionNum num="04" label={t('section.notes')} />
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('cart.notes_placeholder')}
            aria-label="Order notes"
            className="block w-full bg-transparent py-0 pb-3 font-sans text-sm italic leading-[1.55] resize-none outline-none transition-colors placeholder:italic"
            style={{
              border: 'none',
              borderBottom: '1px solid rgba(43,43,43,0.20)',
              color: '#2B2B2B',
              minHeight: '48px',
            }}
            onFocus={(e) => (e.target.style.borderBottomColor = '#650A30')}
            onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(43,43,43,0.20)')}
          />
        </section>

        {/* ── ORDER SUMMARY ── */}
        <section className="px-5 pb-8">
          <div className="flex flex-col gap-0">
            <div
              className="flex justify-between items-center py-3.5"
              style={{ borderBottom: '1px solid rgba(43,43,43,0.08)' }}
            >
              <span
                className="font-sans text-[11px] tracking-[0.18em] uppercase font-semibold"
                style={{ color: 'rgba(43,43,43,0.45)' }}
              >
                {t('cart.subtotal')}
              </span>
              <span className="font-mono text-[13px]" style={{ color: '#2B2B2B', letterSpacing: '-0.02em' }}>
                {formatPrice(sub)}
              </span>
            </div>
            {mode === 'delivery' && (
              <div
                className="flex justify-between items-center py-3.5"
                style={{ borderBottom: '1px solid rgba(43,43,43,0.08)' }}
              >
                <span
                  className="font-sans text-[11px] tracking-[0.18em] uppercase font-semibold"
                  style={{ color: 'rgba(43,43,43,0.45)' }}
                >
                  {t('cart.delivery_fee')}
                </span>
                <span className="font-mono text-[13px]" style={{ color: '#2B2B2B', letterSpacing: '-0.02em' }}>
                  {formatPrice(fee)}
                </span>
              </div>
            )}
            <div
              className="flex justify-between items-center py-3.5"
              style={{ borderBottom: '1px solid rgba(43,43,43,0.08)' }}
            >
              <span
                className="font-sans text-[11px] tracking-[0.18em] uppercase font-semibold"
                style={{ color: 'rgba(43,43,43,0.45)' }}
              >
                {t('cart.points_earned')}
              </span>
              <span className="font-mono text-[13px]" style={{ color: '#B8922A', letterSpacing: '-0.02em' }}>
                +{points} pts
              </span>
            </div>
            {/* Total row */}
            <div
              className="flex justify-between items-center pt-4"
              style={{ borderTop: '1px solid rgba(43,43,43,0.12)' }}
            >
              <span
                className="font-sans text-[11px] tracking-[0.22em] uppercase font-bold"
                style={{ color: '#650A30' }}
              >
                {t('cart.total_estimate')}
              </span>
              <span
                className="font-mono text-[22px] font-medium"
                style={{ color: '#650A30', letterSpacing: '-0.03em' }}
              >
                {formatPrice(baseTotal)}
              </span>
            </div>
          </div>
        </section>

        {/* ── Error ── */}
        {error && (
          <div
            className="mx-5 mb-4 px-4 py-3 text-[0.8rem]"
            style={{
              border: '1px solid rgba(101,10,48,0.30)',
              background: 'rgba(101,10,48,0.05)',
              color: '#650A30',
            }}
          >
            {error}
          </div>
        )}

        {/* ── Sticky CTA ── */}
        <div
          className="fixed bottom-[60px] left-0 right-0 z-30 px-0"
          style={{
            background: 'rgba(254,242,227,0.95)',
            borderTop: '1px solid rgba(43,43,43,0.08)',
            padding: '12px 20px 0',
          }}
        >
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-14 flex items-center justify-between px-6 transition-colors disabled:opacity-60"
            style={{ background: '#650A30' }}
          >
            <span
              className="font-sans text-[11px] tracking-[0.28em] uppercase font-bold"
              style={{ color: '#FEF2E3' }}
            >
              {loading ? 'Processing…' : t('cart.place_order')}
            </span>
            <div className="flex items-center gap-3">
              <div className="w-px h-4" style={{ background: 'rgba(254,242,227,0.30)' }} />
              <span
                className="font-mono text-[14px] font-medium"
                style={{ color: '#FEF2E3', letterSpacing: '-0.02em' }}
              >
                {formatPrice(baseTotal)}
              </span>
              <span style={{ color: 'rgba(254,242,227,0.60)', fontSize: '16px', lineHeight: 1 }}>→</span>
            </div>
          </button>
        </div>

        <BottomNav />
      </div>
    )
  }

  // ── GIFT VIEW (isGift = true) ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-hd-cream flex flex-col pb-[136px]">

      {/* ── Fixed top bar (gift: italic Cormorant, taller) ── */}
      <div
        className="sticky top-0 z-20 bg-hd-cream flex items-center justify-between px-5 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(43,43,43,0.12)', height: '64px' }}
      >
        <button
          onClick={() => router.back()}
          className="w-7 h-7 flex items-center justify-center flex-shrink-0"
          style={{ color: '#650A30' }}
          aria-label="Menu"
        >
          <HamburgerIcon />
        </button>
        <span
          className="font-display text-[28px] font-light italic text-center flex-1 px-2 leading-none"
          style={{ color: '#650A30', letterSpacing: '-0.02em' }}
        >
          {t('cart.a_gift_to_send')}
        </span>
        <button
          className="w-7 h-7 flex items-center justify-center flex-shrink-0"
          style={{ color: '#650A30' }}
          aria-label="Bag"
        >
          <BagIcon />
        </button>
      </div>

      {/* ── Language / Currency switcher ── */}
      <div
        className="px-5 py-3 flex justify-end border-b"
        style={{ borderColor: 'rgba(43,43,43,0.08)' }}
      >
        <LanguageCurrencySwitcher />
      </div>

      {/* ── Mode toggle: stays at top ── */}
      <div className="px-5 pt-5 pb-0">
        <div
          className="flex border p-1 gap-0"
          style={{ borderColor: 'rgba(43,43,43,0.20)' }}
        >
          <button
            onClick={() => setIsGift(false)}
            className="flex-1 py-3 font-sans text-[11px] tracking-[0.22em] uppercase font-semibold transition-colors"
            style={{
              background: 'none',
              color: 'rgba(43,43,43,0.45)',
            }}
          >
            {t('cart.for_me')}
          </button>
          <button
            onClick={() => setIsGift(true)}
            className="flex-1 py-3 font-sans text-[11px] tracking-[0.22em] uppercase font-semibold transition-colors"
            style={{
              background: '#650A30',
              color: '#FEF2E3',
            }}
          >
            {t('cart.as_a_gift')}
          </button>
        </div>
      </div>

      {/* ── 01 / THE COLLECTION ── */}
      <section className="pt-8 pb-8">
        <SectionNum num="01" label={t('section.the_collection')} />
        <div className="px-5 flex flex-col gap-0">
          {items.map(({ item, quantity }, idx) => (
            <div
              key={item.id}
              className="flex gap-5 items-center py-5"
              style={{
                borderBottom: idx < items.length - 1 ? '1px solid rgba(43,43,43,0.08)' : 'none',
              }}
            >
              {/* 96×96 image */}
              <div
                className="w-24 h-24 flex-shrink-0 overflow-hidden"
                style={{ background: '#F8ECDD' }}
              >
                <Image
                  src={`/hd-photos/${idx % 2 === 0 ? 'DWvQ4aVEyOq.jpg' : 'DWffta7k4Ei.jpg'}`}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  style={{ filter: 'grayscale(20%)' }}
                />
              </div>
              {/* Name + sub */}
              <div className="flex-1 min-w-0">
                <div
                  className="font-display text-[26px] font-medium leading-[1.05]"
                  style={{ color: '#2B2B2B', letterSpacing: '-0.02em', marginBottom: '6px' }}
                >
                  {item.name}
                </div>
                <div
                  className="font-sans text-[10px] tracking-[0.16em] uppercase font-semibold"
                  style={{ color: 'rgba(43,43,43,0.40)' }}
                >
                  qty {String(quantity).padStart(2, '0')}
                </div>
              </div>
              {/* Price */}
              <div
                className="font-mono text-[13px] flex-shrink-0 self-start pt-1"
                style={{ color: '#650A30', letterSpacing: '-0.02em' }}
              >
                {formatPrice(item.price * quantity)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 02 / RECIPIENT DETAILS ── */}
      <section className="pb-8">
        <SectionNum num="02" label={t('section.recipient')} />
        <div className="px-5 flex flex-col gap-8">

          {/* Recipient Name */}
          <div className="relative">
            <label
              htmlFor="gift-name"
              className="absolute top-[-18px] left-0 font-sans text-[10px] tracking-[0.22em] uppercase font-semibold pointer-events-none"
              style={{ color: 'rgba(43,43,43,0.40)', lineHeight: 1 }}
            >
              {t('form.recipient_name')}
            </label>
            <input
              id="gift-name"
              type="text"
              value={gift.recipientName}
              onChange={(e) => setGift({ recipientName: e.target.value })}
              placeholder=" "
              aria-label="Recipient's name"
              className="block w-full bg-transparent font-sans text-[15px] font-light pb-2 outline-none transition-colors"
              style={{
                border: 'none',
                borderBottom: '1px solid rgba(136,113,118,0.25)',
                color: '#2B2B2B',
                padding: '6px 0 8px',
              }}
              onFocus={(e) => (e.target.style.borderBottomColor = '#650A30')}
              onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(136,113,118,0.25)')}
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <label
              htmlFor="gift-phone"
              className="absolute top-[-18px] left-0 font-sans text-[10px] tracking-[0.22em] uppercase font-semibold pointer-events-none"
              style={{ color: 'rgba(43,43,43,0.40)', lineHeight: 1 }}
            >
              {t('form.phone_number')}
            </label>
            <input
              id="gift-phone"
              type="tel"
              value={gift.recipientPhone}
              onChange={(e) => setGift({ recipientPhone: e.target.value })}
              placeholder="+62"
              aria-label="Phone number"
              className="block w-full bg-transparent font-sans text-[15px] font-light pb-2 outline-none transition-colors"
              style={{
                border: 'none',
                borderBottom: '1px solid rgba(136,113,118,0.25)',
                color: '#2B2B2B',
                padding: '6px 0 8px',
              }}
              onFocus={(e) => (e.target.style.borderBottomColor = '#650A30')}
              onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(136,113,118,0.25)')}
            />
          </div>

          {/* Delivery Date */}
          <div className="relative">
            <label
              htmlFor="gift-date"
              className="absolute top-[-18px] left-0 font-sans text-[10px] tracking-[0.22em] uppercase font-semibold pointer-events-none"
              style={{ color: 'rgba(43,43,43,0.40)', lineHeight: 1 }}
            >
              {t('form.delivery_date')}
            </label>
            <input
              id="gift-date"
              type="date"
              value={gift.scheduledFor}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setGift({ scheduledFor: e.target.value })}
              aria-label="Delivery date"
              className="block w-full bg-transparent font-sans text-[15px] font-light outline-none transition-colors"
              style={{
                border: 'none',
                borderBottom: '1px solid rgba(136,113,118,0.25)',
                color: '#2B2B2B',
                padding: '6px 0 8px',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
              onFocus={(e) => (e.target.style.borderBottomColor = '#650A30')}
              onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(136,113,118,0.25)')}
            />
          </div>

          {/* Personal Note (with char counter) */}
          <div className="relative">
            <label
              htmlFor="gift-note"
              className="absolute top-[-18px] left-0 font-sans text-[10px] tracking-[0.22em] uppercase font-semibold pointer-events-none"
              style={{ color: 'rgba(43,43,43,0.40)', lineHeight: 1 }}
            >
              {t('form.personal_note')}
            </label>
            <textarea
              id="gift-note"
              rows={3}
              maxLength={150}
              value={gift.message}
              onChange={(e) => setGift({ message: e.target.value })}
              placeholder=" "
              aria-label="Personal note"
              className="block w-full bg-transparent font-sans text-[15px] font-light resize-none outline-none transition-colors leading-[1.5]"
              style={{
                border: 'none',
                borderBottom: '1px solid rgba(136,113,118,0.25)',
                color: '#2B2B2B',
                padding: '6px 0 8px',
              }}
              onFocus={(e) => (e.target.style.borderBottomColor = '#650A30')}
              onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(136,113,118,0.25)')}
            />
            {/* Character counter */}
            <div
              className="flex justify-end mt-1 font-mono text-[11px]"
              style={{ color: 'rgba(43,43,43,0.35)', letterSpacing: '-0.01em' }}
            >
              {gift.message.length}/150
            </div>
          </div>

        </div>
      </section>

      {/* ── 03 / GIFT WRAP ── */}
      <section className="pb-8">
        <SectionNum num="03" label={t('section.gift_wrap')} />
        <div className="px-5">
          <div
            className="flex items-center gap-5 p-5"
            style={{
              background: '#FEF2E3',
              border: '1px solid rgba(43,43,43,0.08)',
            }}
          >
            {/* Wrap photo */}
            <div
              className="w-20 h-20 flex-shrink-0 overflow-hidden"
              style={{ background: '#650A30' }}
            >
              <Image
                src="/hd-photos/DWvQ4aVEyOq.jpg"
                alt="Editorial Wrap"
                width={80}
                height={80}
                className="w-full h-full object-cover mix-blend-overlay opacity-60"
              />
            </div>
            {/* Body */}
            <div className="flex-1 min-w-0">
              <div
                className="font-sans text-[11px] tracking-[0.22em] uppercase font-bold leading-[1.3] mb-1"
                style={{ color: '#650A30' }}
              >
                {t('cart.editorial_wrap')}
              </div>
              <div
                className="font-sans text-[12px] italic leading-[1.4]"
                style={{ color: 'rgba(43,43,43,0.55)' }}
              >
                {t('cart.wrap_desc')}
              </div>
            </div>
            {/* Price + toggle */}
            <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
              <span
                className="font-mono text-[13px]"
                style={{ color: '#650A30', letterSpacing: '-0.02em' }}
              >
                +{formatPrice(WRAP_PRICE)}
              </span>
              {/* Square add/remove toggle button (hairline) */}
              <button
                onClick={() => setIncludeWrap(!includeWrap)}
                className="w-7 h-7 flex items-center justify-center font-mono text-base leading-none transition-colors"
                style={{
                  border: '1px solid #650A30',
                  background: includeWrap ? '#650A30' : 'none',
                  color: includeWrap ? '#FEF2E3' : '#650A30',
                }}
                aria-label={includeWrap ? 'Remove gift wrap' : 'Add gift wrap'}
                aria-pressed={includeWrap}
              >
                {includeWrap ? '−' : '+'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── ORDER SUMMARY (gift style) ── */}
      <section
        className="px-5 pb-8"
        style={{ borderTop: '1px solid rgba(43,43,43,0.12)' }}
      >
        <div className="pt-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span
              className="font-sans text-[11px] tracking-[0.18em] uppercase font-semibold"
              style={{ color: 'rgba(43,43,43,0.45)' }}
            >
              {t('cart.subtotal')}
            </span>
            <span
              className="font-mono text-[13px]"
              style={{ color: 'rgba(43,43,43,0.60)', letterSpacing: '-0.02em' }}
            >
              {formatPrice(sub)}
            </span>
          </div>
          {mode === 'delivery' && (
            <div className="flex justify-between items-center">
              <span
                className="font-sans text-[11px] tracking-[0.18em] uppercase font-semibold"
                style={{ color: 'rgba(43,43,43,0.45)' }}
              >
                {t('cart.delivery')}
              </span>
              <span
                className="font-mono text-[13px]"
                style={{ color: 'rgba(43,43,43,0.60)', letterSpacing: '-0.02em' }}
              >
                {formatPrice(fee)}
              </span>
            </div>
          )}
          {includeWrap && (
            <div className="flex justify-between items-center">
              <span
                className="font-sans text-[11px] tracking-[0.18em] uppercase font-semibold"
                style={{ color: 'rgba(43,43,43,0.45)' }}
              >
                {t('cart.editorial_wrap')}
              </span>
              <span
                className="font-mono text-[13px]"
                style={{ color: 'rgba(43,43,43,0.60)', letterSpacing: '-0.02em' }}
              >
                +{formatPrice(WRAP_PRICE)}
              </span>
            </div>
          )}
          {/* Total: Cormorant label left, large mono right */}
          <div
            className="flex justify-between items-baseline pt-4 mt-2"
            style={{ borderTop: '1px solid rgba(43,43,43,0.12)' }}
          >
            <span
              className="font-display text-[24px] font-normal"
              style={{ color: '#650A30', letterSpacing: '-0.01em' }}
            >
              {t('cart.total_amount')}
            </span>
            <span
              className="font-mono text-[20px] font-medium"
              style={{ color: '#650A30', letterSpacing: '-0.03em' }}
            >
              {formatPrice(grandTotal)}
            </span>
          </div>
        </div>
      </section>

      {/* ── Error ── */}
      {error && (
        <div
          className="mx-5 mb-4 px-4 py-3 text-[0.8rem]"
          style={{
            border: '1px solid rgba(101,10,48,0.30)',
            background: 'rgba(101,10,48,0.05)',
            color: '#650A30',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Sticky CTA (gift: centered, italic Cormorant inside) ── */}
      <div className="fixed bottom-[60px] left-0 right-0 z-30">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full h-14 flex items-center justify-center transition-colors disabled:opacity-60"
          style={{ background: '#650A30' }}
        >
          <span
            className="font-sans text-[11px] tracking-[0.30em] uppercase font-bold"
            style={{ color: '#FEF2E3' }}
          >
            {loading ? 'Processing…' : t('cart.send_a_gift')}
          </span>
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
