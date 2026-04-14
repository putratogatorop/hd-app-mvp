'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowUpRight,
  MapPin,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
  Gift,
  Cake,
} from 'lucide-react'
import { getActiveOccasion } from '@/lib/events/occasions'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContext } from '@/lib/store/order-context'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'
import StoreSelector from '@/components/StoreSelector'
import FloatingCartButton from '@/components/FloatingCartButton'
import QRScanner from '@/components/QRScanner'
import PromoPopup from '@/components/PromoPopup'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type MenuItem = Database['public']['Tables']['menu_items']['Row']
type Store = Database['public']['Tables']['stores']['Row']
type Profile = Pick<ProfileRow, 'full_name' | 'loyalty_points' | 'tier' | 'referral_code'> & {
  birthday?: string | null
}

interface HomeClientProps {
  profile: Profile | null
  featuredItems: MenuItem[]
  stores: Store[]
  voucherCount: number
}

const tierConfig: Record<string, { label: string; target: number; next: string }> = {
  silver: { label: 'Silver', target: 500, next: 'Gold' },
  gold: { label: 'Gold', target: 2000, next: 'Platinum' },
  platinum: { label: 'Platinum', target: 5000, next: 'Platinum' },
}

const orderModes: {
  key: 'pickup' | 'delivery' | 'dinein'
  numeral: string
  title: string
  tagline: string
  Icon: typeof ShoppingBag
}[] = [
  { key: 'pickup', numeral: 'I', title: 'Pick Up', tagline: 'Collected at the counter', Icon: ShoppingBag },
  { key: 'delivery', numeral: 'II', title: 'Delivery', tagline: 'Brought to the door', Icon: Truck },
  { key: 'dinein', numeral: 'III', title: 'Dine In', tagline: 'At table, unhurried', Icon: UtensilsCrossed },
]

const sections = [
  { num: '01', title: 'Send a Gift', tagline: 'Sealed, with a note', href: '/menu?gift=1', mark: 'Nouveau' },
  { num: '02', title: 'Catering', tagline: 'For the occasion', href: '/menu' },
  { num: '03', title: 'MyHD Plan', tagline: 'A standing subscription', href: '/voucher' },
  { num: '04', title: 'Share the Sip', tagline: 'Invitation, with reward', href: '/voucher' },
]

export default function HomeClient({
  profile,
  featuredItems,
  stores,
  voucherCount,
}: HomeClientProps) {
  const [storeOpen, setStoreOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  const { mode, setMode, selectedStore } = useOrderContext()
  const addItem = useCartStore((s) => s.addItem)

  const tier = tierConfig[profile?.tier ?? 'silver'] ?? tierConfig.silver
  const points = profile?.loyalty_points ?? 0
  const toNext = Math.max(0, tier.target - points)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Guest'
  const occasion = getActiveOccasion({ birthday: profile?.birthday ?? null })

  const today = new Date()
  const dateline = today
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()

  return (
    <div className="min-h-screen bg-hd-cream pb-28">
      <PromoPopup />

      {/* ─────────── OCCASION STRIP ─────────── */}
      {occasion && (
        <Link
          href={occasion.href}
          className="block bg-hd-gold text-hd-burgundy-dark border-b border-hd-burgundy/30 group"
        >
          <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-4">
            {occasion.isPersonal ? (
              <Cake className="w-4 h-4 shrink-0" />
            ) : (
              <Gift className="w-4 h-4 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="eyebrow text-hd-burgundy-dark/80 text-[0.6rem]">
                {occasion.eyebrow}
              </p>
              <p className="font-display text-[0.95rem] tracking-editorial leading-tight truncate">
                {occasion.title}
                <span className="italic font-normal text-hd-burgundy-dark/75 text-[0.8rem]">
                  {' '}— {occasion.tagline}
                </span>
              </p>
            </div>
            <span className="eyebrow text-[0.65rem] inline-flex items-center gap-1 shrink-0">
              {occasion.cta}
              <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </Link>
      )}

      {/* ─────────── MASTHEAD / HERO ─────────── */}
      <section className="relative overflow-hidden bg-hd-burgundy-dark text-hd-cream">
        <div className="texture-grain absolute inset-0 opacity-30" aria-hidden />
        {/* Subtle radial light */}
        <div
          className="absolute inset-0 opacity-60"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 80% 0%, rgba(184,146,42,0.25), transparent 60%), radial-gradient(ellipse 60% 40% at 10% 100%, rgba(128,18,55,0.5), transparent 70%)',
          }}
        />

        <div className="relative px-5 pt-12 pb-10">
          {/* Top masthead line */}
          <div className="flex items-center justify-between border-b border-hd-cream/25 pb-3">
            <Image
              src="/logo/logo-transparent.png"
              alt="Häagen-Dazs"
              width={120}
              height={32}
              priority
              className="h-8 w-auto object-contain"
            />
            <span className="numeral text-[0.6rem] text-hd-cream/70 tracking-widest">
              {dateline}
            </span>
          </div>

          {/* Oversized headline */}
          <div className="mt-10 stagger">
            <p className="eyebrow text-hd-gold-light">Good evening, {firstName}</p>
            <h1 className="mt-5 font-display text-display-xl leading-[0.9] tracking-editorial">
              Ice Cream,
              <br />
              <span className="italic">perfected.</span>
            </h1>
            <p className="mt-6 max-w-sm text-[0.9rem] leading-relaxed text-hd-cream/75">
              A small luxury, measured in spoonfuls. Choose a store below and
              we&apos;ll see to the rest.
            </p>
          </div>

          {/* Scroll cue */}
          <div className="mt-10 flex items-center gap-2 text-hd-cream/60">
            <span className="eyebrow text-hd-cream/60">Scroll to begin</span>
            <span className="h-px flex-1 max-w-[60px] bg-hd-cream/40" />
          </div>
        </div>
      </section>

      {/* ─────────── MEMBER STRIP ─────────── */}
      <section className="px-5 py-8 border-b border-hd-ink/15 bg-hd-paper relative">
        <div className="flex items-start justify-between gap-6">
          <div>
            <span className="eyebrow text-hd-ink/60">Member · {tier.label}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="numeral text-[2.25rem] leading-none text-hd-ink font-medium">
                {points.toLocaleString('en-US')}
              </span>
              <span className="font-display italic text-[0.9rem] text-hd-ink/60">points</span>
            </div>
          </div>
          <Link
            href="/voucher"
            className="flex flex-col items-end gap-1 pt-1 group"
          >
            <ArrowUpRight className="w-4 h-4 text-hd-burgundy transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            <span className="eyebrow text-hd-burgundy">Rewards</span>
          </Link>
        </div>

        {/* Progress rule */}
        <div className="mt-5">
          <div className="h-[2px] w-full bg-hd-ink/10 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-hd-burgundy transition-[width] duration-[900ms]"
              style={{ width: `${Math.min(100, (points / tier.target) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="numeral text-[0.65rem] text-hd-ink/50 tracking-widest">
              {points.toLocaleString('en-US')} / {tier.target.toLocaleString('en-US')}
            </span>
            <span className="eyebrow text-hd-ink/50">
              <span className="numeral text-hd-ink">{toNext}</span> to {tier.next}
            </span>
          </div>
        </div>
      </section>

      {/* ─────────── ORDER MODES — SECTION 01 ─────────── */}
      <section className="px-5 pt-10">
        <header className="flex items-end justify-between border-b border-hd-ink/15 pb-4">
          <div className="flex items-baseline gap-4">
            <span className="numeral text-[0.7rem] text-hd-ink/50 tracking-widest">01</span>
            <h2 className="font-display text-[1.5rem] text-hd-ink tracking-editorial">
              How will you have it?
            </h2>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 divide-y divide-hd-ink/10 border border-hd-ink/10 bg-hd-paper">
          {orderModes.map(({ key, numeral, title, tagline, Icon }) => {
            const active = mode === key
            return (
              <button
                key={key}
                onClick={() => {
                  setMode(key)
                  if (key === 'dinein') setQrOpen(true)
                  else setStoreOpen(true)
                }}
                className={`group flex items-center gap-5 px-5 py-5 text-left transition-colors duration-300 ${
                  active ? 'bg-hd-burgundy text-hd-cream' : 'hover:bg-hd-cream-deep'
                }`}
              >
                <span
                  className={`numeral text-sm min-w-[24px] ${
                    active ? 'text-hd-gold-light' : 'text-hd-ink/40'
                  }`}
                >
                  {numeral}
                </span>
                <div className="flex-1">
                  <p
                    className={`font-display text-xl tracking-editorial ${
                      active ? 'italic' : ''
                    }`}
                  >
                    {title}
                  </p>
                  <p
                    className={`text-xs mt-1 italic ${
                      active ? 'text-hd-cream/70' : 'text-hd-ink/55'
                    }`}
                  >
                    {tagline}
                  </p>
                </div>
                <Icon
                  className={`w-5 h-5 transition-transform duration-500 ${
                    active ? 'text-hd-cream' : 'text-hd-ink/50 group-hover:translate-x-0.5'
                  }`}
                />
              </button>
            )
          })}
        </div>

        {selectedStore && (
          <button
            onClick={() => setStoreOpen(true)}
            className="mt-5 w-full flex items-center gap-3 border-b border-hd-ink/25 pb-3 text-left hover:border-hd-ink transition-colors"
          >
            <MapPin className="w-4 h-4 text-hd-burgundy shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="eyebrow text-hd-ink/50 block">Current store</span>
              <span className="font-display text-[1rem] text-hd-ink truncate block mt-0.5">
                {selectedStore.name}
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-hd-ink/60" />
          </button>
        )}
      </section>

      {/* ─────────── SHORTLIST — SECTION 02 ─────────── */}
      <section className="pt-12">
        <header className="px-5 flex items-end justify-between border-b border-hd-ink/15 pb-4">
          <div className="flex items-baseline gap-4">
            <span className="numeral text-[0.7rem] text-hd-ink/50 tracking-widest">02</span>
            <h2 className="font-display text-[1.5rem] text-hd-ink tracking-editorial">
              The <span className="italic">shortlist</span>
            </h2>
          </div>
          <Link
            href="/menu"
            className="eyebrow text-hd-burgundy flex items-center gap-1.5 pb-1"
          >
            All <ArrowUpRight className="w-3 h-3" />
          </Link>
        </header>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-5 pt-6 pb-2">
          {featuredItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => addItem(item)}
              className="shrink-0 w-44 text-left group"
            >
              <div className="relative aspect-[4/5] bg-hd-cream-deep border border-hd-ink/10 overflow-hidden">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-60">
                    🍨
                  </div>
                )}
                <span className="absolute top-2.5 left-2.5 numeral text-[0.6rem] text-hd-burgundy bg-hd-cream/90 px-1.5 py-0.5">
                  {String(i + 1).padStart(3, '0')}
                </span>
              </div>
              <div className="mt-3">
                <p className="font-display text-[1rem] leading-tight text-hd-ink tracking-editorial line-clamp-2">
                  {item.name}
                </p>
                <div className="mt-2 pt-2 border-t border-hd-ink/10 flex items-center justify-between">
                  <span className="numeral text-[0.85rem] text-hd-ink">
                    {formatRupiah(item.price)}
                  </span>
                  <span className="eyebrow text-hd-burgundy">Add</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ─────────── SECTIONS — 03 ─────────── */}
      <section className="px-5 pt-12">
        <header className="flex items-end justify-between border-b border-hd-ink/15 pb-4">
          <div className="flex items-baseline gap-4">
            <span className="numeral text-[0.7rem] text-hd-ink/50 tracking-widest">03</span>
            <h2 className="font-display text-[1.5rem] text-hd-ink tracking-editorial">
              Of note
            </h2>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-px bg-hd-ink/10 border border-hd-ink/10">
          {sections.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="relative flex flex-col justify-between min-h-[150px] bg-hd-paper p-4 hover:bg-hd-cream-deep transition-colors duration-400 group"
            >
              {s.mark && (
                <span className="absolute top-3 right-3 eyebrow text-hd-burgundy italic normal-case tracking-normal text-[0.65rem]">
                  {s.mark}
                </span>
              )}
              <span className="numeral text-[0.65rem] text-hd-ink/40 tracking-widest">
                {s.num}
              </span>
              <div>
                <p className="font-display text-[1.1rem] leading-tight text-hd-ink tracking-editorial">
                  {s.title}
                </p>
                <p className="mt-1 text-[0.75rem] italic text-hd-ink/55">{s.tagline}</p>
                <ArrowUpRight className="w-3.5 h-3.5 mt-3 text-hd-ink/40 transition-all duration-300 group-hover:text-hd-burgundy group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────── REWARDS — 04 ─────────── */}
      <section className="px-5 pt-12">
        <Link href="/voucher" className="block group">
          <div className="flex items-end justify-between border-b border-hd-ink/15 pb-4">
            <div className="flex items-baseline gap-4">
              <span className="numeral text-[0.7rem] text-hd-ink/50 tracking-widest">04</span>
              <h2 className="font-display text-[1.5rem] text-hd-ink tracking-editorial">
                Rewards, unclaimed
              </h2>
            </div>
            <ArrowUpRight className="w-4 h-4 text-hd-ink/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="mt-6 flex items-baseline gap-4">
            <span className="numeral text-[3.5rem] leading-none text-hd-burgundy font-medium">
              {String(voucherCount).padStart(2, '0')}
            </span>
            <p className="font-display italic text-hd-ink/70 text-[1rem]">
              vouchers await collection.
            </p>
          </div>
        </Link>
      </section>

      {/* ─────────── ENQUIRIES — FOOTER ─────────── */}
      <section className="px-5 pt-14 pb-4">
        <div className="border-t border-hd-ink pt-6">
          <span className="eyebrow text-hd-ink/60">Enquiries</span>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="numeral text-[1.25rem] text-hd-ink">0812&nbsp;1111&nbsp;8456</p>
            <p className="font-display italic text-[0.85rem] text-hd-ink/55">
              by chat, always
            </p>
          </div>
        </div>
        <p className="mt-10 text-[0.65rem] tracking-widest uppercase text-hd-ink/30 text-center">
          © Häagen-Dazs Indonesia · Savour the moment
        </p>
      </section>

      {/* Overlays */}
      <StoreSelector stores={stores} open={storeOpen} onClose={() => setStoreOpen(false)} />
      <QRScanner stores={stores} open={qrOpen} onClose={() => setQrOpen(false)} />
      <FloatingCartButton />
    </div>
  )
}
