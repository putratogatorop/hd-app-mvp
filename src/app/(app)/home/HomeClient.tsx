'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'
import { useCartStore } from '@/lib/store/cart'
import { useTranslation, useCurrency } from '@/lib/i18n/context'
import { LanguageCurrencySwitcher } from '@/components/LanguageCurrencySwitcher'
import StoreSelector from '@/components/StoreSelector'
import QRScanner from '@/components/QRScanner'
import PromoPopup from '@/components/PromoPopup'
import { getActiveOccasion } from '@/lib/events/occasions'

type ProfileRow = Database['haagen_dazs']['Tables']['profiles']['Row']
type MenuItem = Database['haagen_dazs']['Tables']['menu_items']['Row']
type Store = Database['haagen_dazs']['Tables']['stores']['Row']
type Profile = Pick<ProfileRow, 'full_name' | 'loyalty_points' | 'tier' | 'referral_code'> & {
  birthday?: string | null
}

interface HomeClientProps {
  profile: Profile | null
  featuredItems: MenuItem[]
  stores: Store[]
  voucherCount: number
}

// HD photos fallback pool
const FALLBACK_PHOTOS = [
  '/hd-photos/DXEOeW3E_Ed.jpg',
  '/hd-photos/DW5RVLkkwA6.jpg',
  '/hd-photos/DWffta7k4Ei.jpg',
  '/hd-photos/DWI-Kpok62S.jpg',
  '/hd-photos/DW03wihk-je.jpg',
]

export default function HomeClient({
  profile,
  featuredItems,
  stores,
  voucherCount,
}: HomeClientProps) {
  const [storeOpen, setStoreOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  const { t, lang } = useTranslation()
  const { formatPrice } = useCurrency()
  const addItem = useCartStore((s) => s.addItem)
  const itemCount = useCartStore((s) => s.itemCount())
  const router = useRouter()

  const occasion = getActiveOccasion({ birthday: profile?.birthday ?? null })
  const heroItem = featuredItems[0] ?? null
  const heroImage = heroItem?.image_url ?? FALLBACK_PHOTOS[0]

  // First 3 items for the editorial list
  const collectionItems = featuredItems.slice(0, 3)

  return (
    <div className="min-h-screen bg-hd-cream pb-28">
      <PromoPopup />

      {/* ══ TOP BAR ══ */}
      <header
        className="sticky top-0 z-50 bg-hd-cream flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(43,43,43,0.07)' }}
      >
        {/* Hamburger */}
        <button
          aria-label="Menu"
          className="text-hd-burgundy flex items-center"
          onClick={() => setStoreOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Wordmark */}
        <span
          className="font-display text-hd-burgundy tracking-[0.18em] uppercase"
          style={{ fontSize: '14px', fontWeight: 500 }}
        >
          Häagen-Dazs
        </span>

        {/* Bag with badge */}
        <button
          aria-label="Cart"
          className="text-hd-burgundy flex items-center relative"
          onClick={() => router.push('/cart')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {itemCount > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-hd-burgundy text-hd-cream font-mono flex items-center justify-center"
              style={{ width: 14, height: 14, fontSize: 8, fontWeight: 600, lineHeight: 1 }}
            >
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>
      </header>

      {/* ══ LANGUAGE / CURRENCY SWITCHER ROW ══ */}
      <div
        className="flex items-center justify-end px-5 py-2"
        style={{ borderBottom: '1px solid rgba(43,43,43,0.07)' }}
      >
        <LanguageCurrencySwitcher tone="light" />
      </div>

      {/* ══ OCCASION STRIP (editorial restyle) ══ */}
      {occasion && (
        <Link
          href={occasion.href}
          className="block"
          style={{ borderBottom: '1px solid rgba(43,43,43,0.07)' }}
        >
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p
                className="font-sans text-hd-burgundy uppercase tracking-[0.22em]"
                style={{ fontSize: 9, fontWeight: 600 }}
              >
                {occasion.eyebrow}
              </p>
              <p className="font-display text-hd-burgundy mt-1 leading-tight" style={{ fontSize: 16, fontStyle: 'italic' }}>
                {occasion.title}
                <span className="font-display text-hd-ink/60 not-italic text-sm"> — {occasion.tagline}</span>
              </p>
            </div>
            <span
              className="font-sans text-hd-burgundy uppercase tracking-[0.22em] flex items-center gap-1 shrink-0"
              style={{ fontSize: 9, fontWeight: 600 }}
            >
              {occasion.cta}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
              </svg>
            </span>
          </div>
        </Link>
      )}

      {/* ══ 00 — HERO MASTHEAD ══ */}
      <section className="relative w-full overflow-hidden" style={{ height: 480, background: '#F8ECDD' }}>
        {/* Full-bleed photo */}
        <Image
          src={heroImage}
          alt={heroItem?.name ?? 'Häagen-Dazs'}
          fill
          priority
          className="object-cover object-center"
          style={{ filter: 'grayscale(15%)' }}
        />

        {/* Gradient overlay — bottom-up */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(64,6,30,0.72) 0%, rgba(64,6,30,0.12) 55%, transparent 100%)' }}
        />

        {/* Content anchored to bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-7">
          {/* Eyebrow row */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div style={{ width: 36, height: 1, background: 'rgba(254,242,227,0.55)' }} />
            <span
              className="font-sans uppercase tracking-[0.28em]"
              style={{ fontSize: 9, fontWeight: 600, color: 'rgba(254,242,227,0.75)' }}
            >
              {lang === 'id' ? '00 — Temukan' : '00 — Discover'}
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="font-display text-hd-cream"
            style={{ fontSize: 52, fontWeight: 300, fontStyle: 'italic', lineHeight: 0.92, letterSpacing: '-0.02em', marginBottom: 14 }}
          >
            {lang === 'id' ? (
              <>Indulgensi<br />Murni,<br />Dirajut.</>
            ) : (
              <>Pure<br />Indulgence,<br />Crafted.</>
            )}
          </h1>

          {/* Sub-copy */}
          <p
            className="font-sans"
            style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(254,242,227,0.75)', maxWidth: 260, marginBottom: 22 }}
          >
            {t('hero.artisan_sub')}
          </p>

          {/* CTA */}
          <Link
            href="/menu"
            className="inline-block bg-hd-burgundy text-hd-cream font-sans uppercase tracking-[0.28em] transition-colors hover:bg-hd-burgundy-light"
            style={{ fontSize: 10, fontWeight: 600, padding: '14px 24px' }}
          >
            {lang === 'id' ? 'Jelajahi Cita Rasa' : 'Explore Flavors'}
          </Link>
        </div>
      </section>

      {/* ══ 01 — KOLEKSI (editorial product list) ══ */}
      <section className="pt-16">
        {/* Section header */}
        <div className="px-5 flex items-baseline gap-4 pb-4" style={{ borderBottom: '1px solid rgba(43,43,43,0.10)' }}>
          <span className="font-mono text-hd-ink/35 tracking-[0.04em]" style={{ fontSize: 11 }}>01</span>
          <h2 className="font-display text-hd-ink tracking-editorial" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>
            {lang === 'id' ? 'Koleksi' : 'The Collection'}
          </h2>
        </div>

        {/* 3 editorial rows */}
        <div className="divide-y" style={{ borderTop: 'none' }}>
          {collectionItems.length === 0 ? (
            /* Skeleton fallback rows */
            [0, 1, 2].map((i) => (
              <div key={i} className="flex items-stretch" style={{ borderBottom: '1px solid rgba(43,43,43,0.07)', minHeight: 140 }}>
                <div className="bg-hd-cream-deep shrink-0" style={{ width: 120, aspectRatio: '1/1' }} />
                <div className="flex-1 px-4 py-4 flex flex-col justify-between">
                  <div>
                    <div className="h-2 w-16 bg-hd-ink/10 mb-3" />
                    <div className="h-5 w-36 bg-hd-ink/10 mb-2" />
                  </div>
                  <div className="h-4 w-24 bg-hd-ink/10" />
                </div>
              </div>
            ))
          ) : (
            collectionItems.map((item, i) => {
              const photo = item.image_url ?? FALLBACK_PHOTOS[i % FALLBACK_PHOTOS.length]
              const numeral = String(i + 1).padStart(3, '0')
              return (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="w-full text-left flex items-stretch group transition-colors hover:bg-hd-paper"
                  style={{ borderBottom: '1px solid rgba(43,43,43,0.07)' }}
                >
                  {/* Square photo */}
                  <div className="shrink-0 relative overflow-hidden bg-hd-cream-deep" style={{ width: 128, height: 128 }}>
                    <Image
                      src={photo}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-[700ms] group-hover:scale-105"
                      style={{ filter: 'grayscale(15%)' }}
                    />
                  </div>

                  {/* Copy */}
                  <div className="flex-1 px-5 py-4 flex flex-col justify-between">
                    <div>
                      {/* Eyebrow numeral */}
                      <p
                        className="font-mono text-hd-ink/40 tracking-[0.14em] uppercase mb-1"
                        style={{ fontSize: 9 }}
                      >
                        {numeral}
                      </p>
                      {/* Product name */}
                      <h3
                        className="font-display text-hd-burgundy leading-tight"
                        style={{ fontSize: 18, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.02em' }}
                      >
                        {item.name}
                      </h3>
                    </div>

                    {/* Footer: price + arrow */}
                    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(43,43,43,0.07)' }}>
                      <span className="font-mono text-hd-burgundy" style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em' }}>
                        {formatPrice(item.price)}
                      </span>
                      <span
                        className="font-sans text-hd-ink/40 group-hover:text-hd-burgundy transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        style={{ fontSize: 16 }}
                        aria-hidden="true"
                      >
                        ↗
                      </span>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* View all link */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(43,43,43,0.07)' }}>
          <Link
            href="/menu"
            className="font-sans text-hd-burgundy uppercase tracking-[0.22em] inline-block"
            style={{ fontSize: 10, fontWeight: 600, borderBottom: '1px solid rgba(101,10,48,0.20)', paddingBottom: 2 }}
          >
            {lang === 'id' ? 'Lihat Semua →' : 'View All →'}
          </Link>
        </div>
      </section>

      {/* ══ 02 — FILOSOFI KAMI (dark editorial block) ══ */}
      <section className="relative overflow-hidden" style={{ background: '#40061E', marginTop: 64, padding: '56px 24px 48px' }}>
        {/* Grain texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.05,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            backgroundSize: '180px 180px',
          }}
          aria-hidden
        />

        <div className="relative">
          {/* Eyebrow */}
          <p
            className="font-sans uppercase tracking-[0.22em]"
            style={{ fontSize: 10, fontWeight: 600, color: 'rgba(254,242,227,0.55)', marginBottom: 20 }}
          >
            {lang === 'id' ? '02 — Filosofi Kami' : '02 — Our Philosophy'}
          </p>

          {/* Headline */}
          <h2
            className="font-display text-hd-cream"
            style={{ fontSize: 40, fontWeight: 300, fontStyle: 'italic', lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 20 }}
          >
            {lang === 'id' ? (
              <>Seni<br />Mencairkan<br />Perlahan.</>
            ) : (
              <>The Art of<br />Slow<br />Craft.</>
            )}
          </h2>

          {/* Body */}
          <p
            className="font-sans"
            style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(254,242,227,0.70)', maxWidth: 300, marginBottom: 36 }}
          >
            {t('philosophy.body')}
          </p>

          {/* CTA link */}
          <Link
            href="/menu"
            className="font-sans uppercase tracking-[0.22em] inline-block transition-colors"
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(254,242,227,0.85)',
              borderBottom: '1px solid rgba(254,242,227,0.20)',
              paddingBottom: 2,
            }}
          >
            {lang === 'id' ? 'Jelajahi Cerita Kami →' : 'Explore Our Story →'}
          </Link>
        </div>
      </section>

      {/* ══ EDITORIAL FOOTER ══ */}
      <footer className="px-5 pt-16 pb-6" style={{ borderTop: '1px solid rgba(43,43,43,0.10)', marginTop: 64 }}>
        {/* Large wordmark */}
        <p
          className="font-display text-hd-ink/20 uppercase tracking-[0.18em] mb-4 leading-none"
          style={{ fontSize: 'clamp(1.8rem, 8vw, 3rem)', fontWeight: 300 }}
          aria-label="Häagen-Dazs"
        >
          Häagen-Dazs
        </p>

        {/* Italic tagline */}
        <p
          className="font-display text-hd-ink/55 mb-10"
          style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.5 }}
        >
          {t('footer.tagline')}
        </p>

        {/* 2-column link grid */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          {/* Discover */}
          <div>
            <p
              className="font-sans text-hd-ink/40 uppercase tracking-[0.22em] mb-4"
              style={{ fontSize: 9, fontWeight: 600 }}
            >
              {t('footer.explore')}
            </p>
            <ul className="space-y-3">
              {[
                { label: t('footer.the_shop'), href: '/menu' },
                { label: t('footer.our_story'), href: '/menu' },
                { label: t('footer.reservations'), href: '/voucher' },
                { label: t('footer.gift_cards'), href: '/menu?gift=1' },
              ].map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="font-sans text-hd-ink/55 hover:text-hd-burgundy transition-colors"
                    style={{ fontSize: 12 }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p
              className="font-sans text-hd-ink/40 uppercase tracking-[0.22em] mb-4"
              style={{ fontSize: 9, fontWeight: 600 }}
            >
              {t('footer.support')}
            </p>
            <ul className="space-y-3">
              {[
                { label: t('footer.contact'), href: '/account' },
                { label: t('footer.hampers'), href: '/menu' },
                { label: lang === 'id' ? 'Karir' : 'Careers', href: '/account' },
                { label: lang === 'id' ? 'Tentang Kami' : 'About', href: '/account' },
              ].map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="font-sans text-hd-ink/55 hover:text-hd-burgundy transition-colors"
                    style={{ fontSize: 12 }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <p
          className="font-sans text-hd-ink/25 uppercase tracking-widest text-center"
          style={{ fontSize: '0.65rem' }}
        >
          {t('footer.copyright')}
        </p>
      </footer>

      {/* Overlays */}
      <StoreSelector stores={stores} open={storeOpen} onClose={() => setStoreOpen(false)} />
      <QRScanner stores={stores} open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  )
}
