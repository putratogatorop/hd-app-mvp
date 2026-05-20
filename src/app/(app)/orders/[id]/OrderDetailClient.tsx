'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useTranslation, useCurrency } from '@/lib/i18n/context'
import { LanguageCurrencySwitcher } from '@/components/LanguageCurrencySwitcher'
import BottomNav from '@/components/BottomNav'

// ── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled'

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

// ── Grain SVG (URL-encoded for inline use) ───────────────────────────────────

const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

// ── Timeline step helpers ─────────────────────────────────────────────────────

type StepState = 'done' | 'current' | 'pending'

interface TimelineStep {
  label: string
  subCopy: string
  state: StepState
  time?: string
}

/**
 * Maps order status to a 0-based timeline index.
 * Delivery  : 0=Confirmed 1=Prepared 2=En Route 3=Delivered
 * Pickup    : 0=Confirmed 1=Prepared 2=Ready for Pickup 3=Collected
 */
function resolveTimelineIdx(status: OrderStatus): number {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return 0
    case 'preparing':
      return 1
    case 'ready':
    case 'out_for_delivery':
      return 2
    case 'delivered':
    case 'completed':
      return 3
    default:
      return 0
  }
}

function stepState(stepIdx: number, activeIdx: number): StepState {
  if (stepIdx < activeIdx) return 'done'
  if (stepIdx === activeIdx) return 'current'
  return 'pending'
}

// ── Tiny shared presentational helpers ───────────────────────────────────────

function SectionDivider({ num, label }: { num: string; label?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 mb-5">
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: '#650A30',
          opacity: 0.4,
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        {num}
      </span>
      <div className="flex-1 h-px bg-hd-ink/10" />
      {label && (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase' as const,
            fontWeight: 600,
            color: '#650A30',
            opacity: 0.55,
            flexShrink: 0,
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}

interface TlDotProps { state: StepState }
function TlDot({ state }: TlDotProps) {
  const base: React.CSSProperties = { width: 16, height: 16, flexShrink: 0 }
  if (state === 'done') return <div style={{ ...base, background: '#650A30' }} />
  if (state === 'current')
    return (
      <div
        style={{
          ...base,
          background: '#650A30',
          boxShadow: '0 0 0 3px #FEF2E3, 0 0 0 5px rgba(101,10,48,0.25)',
        }}
      />
    )
  return (
    <div
      style={{
        ...base,
        border: '1px solid rgba(43,43,43,0.20)',
        background: '#FEF2E3',
      }}
    />
  )
}

// ── Order-again + Enquiries CTA stack ────────────────────────────────────────

function CtaStack({ t }: { t: (k: string) => string }) {
  return (
    <div className="flex flex-col">
      <Link
        href="/menu"
        className="relative overflow-hidden w-full text-center py-[18px] px-5 text-[11px] tracking-[0.24em] uppercase font-semibold"
        style={{
          fontFamily: 'var(--font-sans)',
          background: '#650A30',
          color: 'rgba(254,242,227,0.92)',
          display: 'block',
        }}
      >
        {/* grain overlay */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.04,
            backgroundImage: GRAIN_URI,
            backgroundSize: '180px 180px',
          }}
        />
        <span style={{ position: 'relative', zIndex: 1 }}>{t('cta.order_again')}</span>
      </Link>
      <button
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontWeight: 600,
          padding: '16px 20px',
          border: '1px solid rgba(43,43,43,0.12)',
          borderTop: 'none',
          background: 'transparent',
          color: '#650A30',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'center',
        }}
      >
        Enquiries &rarr;
      </button>
    </div>
  )
}

// ── QR Code (CSS 8×8 grid approximation) ─────────────────────────────────────

const QR_PATTERN = [
  [1,1,1,1,1,1,1,1],
  [1,0,0,1,0,0,1,1],
  [1,0,1,0,1,0,0,1],
  [1,1,0,1,0,1,1,1],
  [1,0,1,1,1,0,0,1],
  [1,1,0,0,1,1,0,1],
  [1,0,1,0,0,1,1,1],
  [1,1,1,1,1,1,1,1],
]

function QrGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        width: '100%',
        height: '100%',
        gap: '1.5px',
      }}
      aria-label="QR Code for order pickup"
    >
      {QR_PATTERN.flat().map((cell, i) => (
        <div key={i} style={{ background: cell ? '#1a1310' : 'transparent' }} />
      ))}
    </div>
  )
}

// ── Map SVG placeholder ───────────────────────────────────────────────────────

function MapPlaceholder() {
  return (
    <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 350 350"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <rect width="350" height="350" fill="#F5E6C8" />
        {/* grid lines */}
        {[50,100,150,200,250,300].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="350" y2={y} stroke="rgba(43,43,43,0.07)" strokeWidth="1" />
        ))}
        {[50,100,150,200,250,300].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="350" stroke="rgba(43,43,43,0.07)" strokeWidth="1" />
        ))}
        {/* diagonal streets */}
        <line x1="0" y1="250" x2="150" y2="0" stroke="rgba(43,43,43,0.09)" strokeWidth="1" />
        <line x1="80" y1="350" x2="300" y2="0" stroke="rgba(43,43,43,0.09)" strokeWidth="1" />
        <line x1="200" y1="350" x2="350" y2="100" stroke="rgba(43,43,43,0.07)" strokeWidth="1" />
        {/* dashed gold route */}
        <polyline
          points="80,280 130,220 185,185 230,155 265,135 290,120 310,108"
          fill="none"
          stroke="rgba(184,146,42,0.55)"
          strokeWidth="2"
          strokeDasharray="5,4"
        />
        {/* Courier dot (burgundy) */}
        <circle cx="80" cy="280" r="8" fill="#650A30" />
        <circle cx="80" cy="280" r="14" fill="none" stroke="rgba(101,10,48,0.22)" strokeWidth="1.5" />
        {/* Destination (gold square) */}
        <rect x="303" y="101" width="14" height="14" fill="#B8922A" />
        <rect x="298" y="96" width="24" height="24" fill="none" stroke="rgba(184,146,42,0.35)" strokeWidth="1" />
        <line x1="310" y1="120" x2="310" y2="132" stroke="rgba(184,146,42,0.50)" strokeWidth="1.5" />
        {/* Labels */}
        <text x="44" y="302" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="rgba(101,10,48,0.65)" letterSpacing="0.04em">COURIER</text>
        <text x="288" y="93" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="rgba(184,146,42,0.80)" letterSpacing="0.04em">YOU</text>
        {/* Frame border */}
        <rect x="0.5" y="0.5" width="349" height="349" fill="none" stroke="rgba(43,43,43,0.10)" strokeWidth="1" />
      </svg>
    </div>
  )
}

// ── Delivery layout ───────────────────────────────────────────────────────────

interface DeliveryLayoutProps {
  order: Order
  t: (k: string) => string
  formatPrice: (idr: number) => string
}

function DeliveryLayout({ order, t, formatPrice }: DeliveryLayoutProps) {
  const activeIdx = resolveTimelineIdx(order.status)
  const shortId = order.id.slice(-8).toUpperCase()

  const deliverySteps: Array<{ label: string; subCopy: string }> = [
    {
      label: t('tracking.order_confirmed') || 'Confirmed',
      subCopy: 'Your artisanal selection has been received and curated for preparation.',
    },
    {
      label: t('tracking.order_prepared') || 'Prepared',
      subCopy: 'Hand-packed at our atelier. Maintaining perfect tempering for delivery.',
    },
    {
      label: t('tracking.order_en_route') || 'Out for Delivery',
      subCopy: 'Our courier is traversing the city. Expect your moment of indulgence shortly.',
    },
    {
      label: t('tracking.order_delivered') || 'Delivered',
      subCopy: 'Awaiting delivery to your doorstep.',
    },
  ]

  const subtotal = order.total_amount - order.delivery_fee + order.discount_amount

  return (
    <div style={{ background: '#FEF2E3' }}>

      {/* ── Section 01: Map + Courier ── */}
      <section style={{ paddingTop: 24 }}>
        <SectionDivider num="01" />

        <MapPlaceholder />

        {/* Courier block */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid rgba(43,43,43,0.12)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 9,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: 'rgba(43,43,43,0.35)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Curated Delivery By
          </span>
          {/* TODO: courier name/plate not in schema — using placeholder */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              color: '#650A30',
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            Awaiting Assignment
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.08em',
              color: 'rgba(43,43,43,0.45)',
            }}
          >
            {/* TODO: vehicle plate not in schema */}
            — &nbsp;·&nbsp; —
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              aria-label="Message courier"
              style={{
                width: 44, height: 44,
                border: '1px solid rgba(43,43,43,0.12)',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#650A30',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </button>
            <button
              aria-label="Call courier"
              style={{
                width: 44, height: 44,
                background: '#650A30',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(254,242,227,0.90)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11 19.79 19.79 0 01.22 2.36a2 2 0 012-2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.13 6.13l1.61-1.61a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Points card */}
        {order.points_earned > 0 && (
          <div
            style={{
              background: 'rgba(245,230,200,0.35)',
              border: '1px solid rgba(184,146,42,0.25)',
              borderTop: 'none',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36, height: 36,
                  background: 'rgba(184,146,42,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 16, color: '#B8922A' }}>&#9733;</span>
              </div>
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 9,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: 'rgba(184,146,42,0.70)',
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  Points Earned
                </span>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 19,
                    fontWeight: 400,
                    color: 'rgba(43,43,43,0.75)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 500, color: '#650A30' }}>
                    +{order.points_earned}
                  </span>
                  {' '}Membership Credits
                </div>
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(43,43,43,0.25)' }}>›</span>
          </div>
        )}
      </section>

      {/* ── Section 02: Status Journal ── */}
      <section style={{ padding: '32px 0 0' }}>
        <SectionDivider num="02" label="Status Journal" />

        <div style={{ padding: '0 20px', position: 'relative' }}>
          {deliverySteps.map((step, idx) => {
            const state = stepState(idx, activeIdx)
            const isPending = state === 'pending'
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  paddingBottom: idx < deliverySteps.length - 1 ? 36 : 0,
                  position: 'relative',
                  opacity: isPending ? 0.35 : 1,
                }}
              >
                {/* Hairline connector */}
                {idx < deliverySteps.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 7,
                      top: 18,
                      bottom: 0,
                      width: 1,
                      background: 'rgba(43,43,43,0.12)',
                    }}
                  />
                )}
                {/* Dot */}
                <div
                  style={{
                    width: 16, flexShrink: 0,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    marginTop: 2, position: 'relative', zIndex: 1,
                  }}
                >
                  <TlDot state={state} />
                </div>
                {/* Body */}
                <div style={{ flex: 1, paddingLeft: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 10,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        fontWeight: state === 'current' ? 700 : 600,
                        color: state === 'pending' ? 'rgba(43,43,43,0.35)' : '#650A30',
                        textDecoration: state === 'done' ? 'line-through' : 'none',
                        textDecorationColor: 'rgba(101,10,48,0.25)',
                      }}
                    >
                      {step.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '-0.01em',
                        color: state === 'current' ? '#650A30' : state === 'done' ? 'rgba(43,43,43,0.40)' : 'rgba(43,43,43,0.30)',
                        flexShrink: 0,
                      }}
                    >
                      {state === 'pending' ? '--:--' : new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                      fontStyle: 'italic',
                      fontWeight: 300,
                      color: 'rgba(43,43,43,0.55)',
                      lineHeight: 1.45,
                      marginTop: 2,
                      opacity: isPending ? 0.40 : 1,
                    }}
                  >
                    {step.subCopy}
                  </p>

                  {/* Currently Carrying strip (active en-route step) */}
                  {state === 'current' && idx === 2 && order.order_items.length > 0 && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        border: '1px solid rgba(43,43,43,0.12)',
                        background: '#FEF2E3',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 44, height: 44, flexShrink: 0,
                          background: '#F5E6C8',
                          border: '1px solid rgba(43,43,43,0.08)',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <Image
                          src="/hd-photos/DW5RVLkkwA6.jpg"
                          alt={order.order_items[0]?.menu_item?.name ?? 'Item'}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 8,
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            color: 'rgba(43,43,43,0.35)',
                            display: 'block',
                            marginBottom: 3,
                          }}
                        >
                          Currently Carrying
                        </span>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 14,
                            fontWeight: 400,
                            color: '#2B2B2B',
                            lineHeight: 1.3,
                          }}
                        >
                          {order.order_items
                            .slice(0, 2)
                            .map(i => i.menu_item?.name ?? 'Item')
                            .join(' & ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 03: Your Order ── */}
      <section style={{ padding: '32px 0 0' }}>
        <SectionDivider num="03" label={t('section.your_order') || 'Item List'} />

        <div style={{ padding: '0 20px' }}>
          {order.order_items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: '1px solid rgba(43,43,43,0.08)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.06em',
                  color: 'rgba(43,43,43,0.28)',
                  flexShrink: 0,
                  width: 14,
                  textAlign: 'right',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: 400,
                    color: '#2B2B2B',
                    marginBottom: 2,
                  }}
                >
                  {item.menu_item?.name ?? 'Item'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(43,43,43,0.35)', letterSpacing: '0.04em' }}>
                  Qty: {item.quantity}
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(43,43,43,0.55)', letterSpacing: '-0.02em' }}>
                {formatPrice(item.unit_price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ padding: '0 20px', marginTop: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid rgba(43,43,43,0.08)' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(43,43,43,0.45)' }}>Subtotal</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(43,43,43,0.55)', letterSpacing: '-0.02em' }}>{formatPrice(subtotal)}</span>
          </div>
          {order.delivery_fee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid rgba(43,43,43,0.08)' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(43,43,43,0.45)' }}>Delivery</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(43,43,43,0.55)', letterSpacing: '-0.02em' }}>{formatPrice(order.delivery_fee)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '14px 0 10px',
              borderTop: '1px solid rgba(43,43,43,0.12)',
              marginTop: 4,
            }}
          >
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, color: '#2B2B2B' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: '#650A30', fontWeight: 500, letterSpacing: '-0.03em' }}>{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </section>

      {/* ── CTAs ── */}
      <div style={{ margin: '32px 0 0' }}>
        <CtaStack t={t} />
      </div>

      <div style={{ padding: '40px 20px 28px' }} />
    </div>
  )
}

// ── Pickup layout ─────────────────────────────────────────────────────────────

interface PickupLayoutProps {
  order: Order
  t: (k: string) => string
  formatPrice: (idr: number) => string
}

function PickupLayout({ order, t, formatPrice }: PickupLayoutProps) {
  const activeIdx = resolveTimelineIdx(order.status)
  const shortId = order.id.slice(-8).toUpperCase()
  const storeName = order.store?.name ?? 'Häagen-Dazs Boutique'
  const storeAddress = order.store?.address ?? 'Jakarta, Indonesia'

  const pickupSteps: Array<{ label: string; subCopy: string }> = [
    {
      label: t('tracking.order_confirmed') || 'Confirmed',
      subCopy: 'Your artisanal selection has been received and curated for preparation.',
    },
    {
      label: t('tracking.order_prepared') || 'Preparing',
      subCopy: 'Hand-packed at our boutique atelier with care.',
    },
    {
      label: t('tracking.order_ready') || 'Ready for Pickup',
      subCopy: 'Your indulgence awaits. Present your QR code to our boutique consultant.',
    },
    {
      label: t('tracking.order_collected') || 'Collected',
      subCopy: 'Awaiting collection at the boutique.',
    },
  ]

  const subtotal = order.total_amount - order.delivery_fee + order.discount_amount

  return (
    <div style={{ background: '#FEF2E3' }}>

      {/* ── Hero ── */}
      <div
        style={{
          padding: '28px 20px 24px',
          borderBottom: '1px solid rgba(43,43,43,0.12)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'rgba(43,43,43,0.38)',
            display: 'block',
            marginBottom: 10,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Order · #{shortId} · {storeName}
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 64,
            fontWeight: 300,
            fontStyle: 'italic',
            lineHeight: 0.92,
            letterSpacing: '-0.03em',
            color: '#2B2B2B',
          }}
        >
          {t('tracking.ready_collection') || 'Ready for\npickup'}
        </h1>
      </div>

      {/* ── Section 01: Status Journal ── */}
      <section style={{ padding: '32px 0 0' }}>
        <SectionDivider num="01" label="Status Journal" />

        <div style={{ padding: '0 20px', position: 'relative' }}>
          {pickupSteps.map((step, idx) => {
            const state = stepState(idx, activeIdx)
            const isPending = state === 'pending'
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  paddingBottom: idx < pickupSteps.length - 1 ? 32 : 0,
                  position: 'relative',
                  opacity: isPending ? 0.35 : 1,
                }}
              >
                {idx < pickupSteps.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 7, top: 18, bottom: 0,
                      width: 1,
                      background: 'rgba(43,43,43,0.12)',
                    }}
                  />
                )}
                <div
                  style={{
                    width: 16, flexShrink: 0,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    marginTop: 2, position: 'relative', zIndex: 1,
                  }}
                >
                  <TlDot state={state} />
                </div>
                <div style={{ flex: 1, paddingLeft: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 10,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        fontWeight: state === 'current' ? 700 : 600,
                        color: state === 'pending' ? 'rgba(43,43,43,0.35)' : '#650A30',
                        textDecoration: state === 'done' ? 'line-through' : 'none',
                        textDecorationColor: 'rgba(101,10,48,0.25)',
                      }}
                    >
                      {step.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '-0.01em',
                        color: state === 'current' ? '#650A30' : state === 'done' ? 'rgba(43,43,43,0.40)' : 'rgba(43,43,43,0.30)',
                        flexShrink: 0,
                      }}
                    >
                      {state === 'pending' ? '--:--' : new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                      fontStyle: 'italic',
                      fontWeight: 300,
                      color: 'rgba(43,43,43,0.55)',
                      lineHeight: 1.45,
                      opacity: isPending ? 0.40 : 1,
                    }}
                  >
                    {step.subCopy}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 02: Your Indulgence (items) ── */}
      <section style={{ padding: '32px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0 20px', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(43,43,43,0.30)', letterSpacing: '0.04em' }}>02</span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, fontWeight: 400, letterSpacing: '-0.01em', color: '#2B2B2B' }}>
            Your Indulgence
          </span>
        </div>

        <div style={{ padding: '0 20px' }}>
          {order.order_items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: '1px solid rgba(43,43,43,0.08)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#2B2B2B',
                    marginBottom: 2,
                  }}
                >
                  {item.menu_item?.name ?? 'Item'}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontStyle: 'italic', fontWeight: 300, color: 'rgba(43,43,43,0.50)' }}>
                  Qty: {item.quantity}
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'rgba(43,43,43,0.55)', letterSpacing: '-0.02em', textAlign: 'right' }}>
                {formatPrice(item.unit_price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 03: Loyalty card ── */}
      <section style={{ padding: '32px 0 0' }}>
        <SectionDivider num="03" label="Loyalty Rewards" />

        <div style={{ padding: '0 20px' }}>
          <div
            style={{
              background: '#40061E',
              padding: '22px 20px',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(184,146,42,0.18)',
            }}
          >
            {/* grain */}
            <div
              aria-hidden
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                opacity: 0.05, backgroundImage: GRAIN_URI, backgroundSize: '180px 180px',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
                    fontWeight: 600, color: 'rgba(254,242,227,0.45)',
                    display: 'block', marginBottom: 8,
                  }}
                >
                  Points Earned
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 500, color: '#B8922A', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6 }}>
                  +{order.points_earned}{' '}
                  <span style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 400, opacity: 0.80 }}>Points Earned</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontStyle: 'italic', fontWeight: 300, color: 'rgba(254,242,227,0.55)', lineHeight: 1.40, maxWidth: 210 }}>
                  Every indulgence brings you closer to an exclusive reward.
                </p>
              </div>
              <span style={{ fontSize: 22, color: '#B8922A', opacity: 0.55, marginLeft: 12, marginTop: 4 }}>&#9733;</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Order Again CTA (below loyalty, thumb zone) ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <Link
          href="/menu"
          className="relative overflow-hidden w-full text-center block py-[18px] px-5"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            fontWeight: 600,
            background: '#650A30',
            color: 'rgba(254,242,227,0.92)',
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              opacity: 0.04, backgroundImage: GRAIN_URI, backgroundSize: '180px 180px',
            }}
          />
          <span style={{ position: 'relative', zIndex: 1 }}>{t('cta.order_again')}</span>
        </Link>
      </div>

      {/* ── Section 04: QR Scan ── */}
      <section style={{ padding: '32px 0 0' }}>
        <SectionDivider num="04" label="Pickup Scan" />

        <div style={{ padding: '0 20px' }}>
          <div
            style={{
              border: '1px solid rgba(43,43,43,0.08)',
              background: 'rgba(245,230,200,0.18)',
              padding: '28px 20px',
            }}
          >
            <div
              style={{
                width: 164, height: 164,
                background: '#fff',
                border: '1px solid rgba(43,43,43,0.12)',
                padding: 12,
                margin: '0 auto 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <QrGrid />
            </div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14, fontStyle: 'italic', fontWeight: 300,
                color: 'rgba(43,43,43,0.55)', lineHeight: 1.45,
                textAlign: 'center', maxWidth: 220, margin: '0 auto',
              }}
            >
              Show this code to our boutique consultant to collect your indulgence.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 05: Store Location ── */}
      <section style={{ padding: '32px 0 0' }}>
        <SectionDivider num="05" label="Store Location" />

        <div style={{ padding: '0 20px' }}>
          <div
            style={{
              width: '100%', aspectRatio: '16/7', overflow: 'hidden',
              background: '#F5E6C8', border: '1px solid rgba(43,43,43,0.08)',
              marginBottom: 16, position: 'relative',
            }}
          >
            <Image
              src="/hd-photos/DVxL5rJE5B8.jpg"
              alt={`${storeName} Boutique`}
              fill
              style={{ objectFit: 'cover', filter: 'grayscale(20%)' }}
            />
          </div>

          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#650A30', marginBottom: 5,
            }}
          >
            {storeName}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12, fontWeight: 300, color: 'rgba(43,43,43,0.55)',
              lineHeight: 1.55, marginBottom: 14,
            }}
          >
            {storeAddress}
          </div>
          <button
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
              fontWeight: 600, color: '#650A30',
              textDecoration: 'underline', textUnderlineOffset: 3,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>&#9675;</span> Get Directions &rarr;
          </button>
        </div>
      </section>

      {/* Enquiries bordered CTA */}
      <div style={{ padding: '24px 20px 0' }}>
        <button
          style={{
            width: '100%', background: 'transparent', color: '#650A30',
            fontFamily: 'var(--font-sans)', fontSize: 11,
            letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600,
            padding: '16px 20px', border: '1px solid rgba(43,43,43,0.12)', cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Enquiries &rarr;
        </button>
      </div>

      <div style={{ padding: '40px 20px 28px' }} />
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

export default function OrderDetailClient({ order: initialOrder }: { order: Order }) {
  const [order, setOrder] = useState(initialOrder)
  const supabase = createClient()
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()

  // Real-time order status subscription
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

  const shortId = order.id.slice(-8).toUpperCase()
  const isDelivery = order.order_mode === 'delivery'

  return (
    <div className="min-h-screen" style={{ background: '#FEF2E3', paddingBottom: 88 }}>

      {/* ── Fixed Top App Bar ── */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(254,242,227,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(43,43,43,0.12)',
          height: 56,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
        }}
      >
        <Link
          href="/orders"
          aria-label="Back"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 18, color: '#650A30',
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 4, lineHeight: 1, display: 'flex',
          }}
        >
          &#8592;
        </Link>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500, fontSize: 15,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#650A30', lineHeight: 1,
            }}
          >
            Häagen-Dazs
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9, letterSpacing: '0.10em',
              textTransform: 'uppercase', color: 'rgba(43,43,43,0.38)', lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            ORDER · #{shortId}
          </span>
        </div>

        <Link
          href="/menu"
          aria-label="Cart"
          style={{ color: '#650A30', display: 'flex', alignItems: 'center' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </Link>
      </header>

      {/* ── Language/Currency Switcher row ── */}
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid rgba(43,43,43,0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#FEF2E3',
        }}
      >
        <LanguageCurrencySwitcher />
      </div>

      {/* ── Hero (both modes share this) ── */}
      {isDelivery && (
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(43,43,43,0.12)' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9, letterSpacing: '0.10em',
              textTransform: 'uppercase', color: 'rgba(43,43,43,0.38)',
              display: 'block', marginBottom: 10,
            }}
          >
            Order · #{shortId}
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 64, fontWeight: 300, fontStyle: 'italic',
              lineHeight: 0.92, letterSpacing: '-0.03em', color: '#2B2B2B',
            }}
          >
            {t('tracking.on_its_way') || 'On its\nway to you.'}
          </h1>
        </div>
      )}

      {/* ── Mode-branched body ── */}
      {isDelivery
        ? <DeliveryLayout order={order} t={t} formatPrice={formatPrice} />
        : <PickupLayout order={order} t={t} formatPrice={formatPrice} />
      }

      {/* ── Bottom Nav ── */}
      <BottomNav />
    </div>
  )
}
