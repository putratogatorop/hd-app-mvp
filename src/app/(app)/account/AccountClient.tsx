'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LanguageCurrencySwitcher } from '@/components/LanguageCurrencySwitcher'
import type { Database } from '@/lib/supabase/database.types'
import { updateBirthday } from './actions'

// ─── Grain SVG data URI ─────────────────────────────────────────────────────
const GRAIN_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

type ProfileRow = Database['haagen_dazs']['Tables']['profiles']['Row']
type Profile =
  | (Pick<ProfileRow, 'full_name' | 'email' | 'phone' | 'loyalty_points' | 'tier' | 'referral_code'> & {
      birthday?: string | null
    })
  | null

type Order = {
  id: string
  created_at: string
  total_amount: number
  order_mode: string
  item_count?: number
}

interface AccountClientProps {
  profile: Profile
  recentOrders?: Order[]
}

const TIER_EDITORIAL: Record<string, string> = {
  silver: 'Reserve · Initiate',
  gold: 'Reserve · Connoisseur',
  platinum: 'Reserve · Maestro',
}

// Favourite flavour placeholder photos (no DB backing yet)
const FLAVOR_PHOTOS = [
  { name: 'Vanilla', img: '/hd-photos/DWizLL8k3Vq.jpg' },
  { name: 'Pistachio & Cream', img: '/hd-photos/DWffta7k4Ei.jpg' },
  { name: 'Chocolate', img: '/hd-photos/DVxL5rJE5B8.jpg' },
]

export default function AccountClient({ profile, recentOrders = [] }: AccountClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [birthday, setBirthday] = useState(profile?.birthday ?? '')
  const [saving, startSaving] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function handleBirthdayChange(value: string) {
    setBirthday(value)
    setErr(null)
    startSaving(async () => {
      try {
        await updateBirthday(value || null)
        setSavedAt(Date.now())
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const tier = profile?.tier ?? 'silver'
  const tierLabel = TIER_EDITORIAL[tier] ?? 'Reserve · Initiate'
  const points = profile?.loyalty_points ?? 0
  const displayName = (profile?.full_name ?? 'Guest').toUpperCase()

  return (
    <div style={{ background: '#FEF2E3', minHeight: '100vh', fontFamily: "var(--font-sans, 'Jost', sans-serif)", WebkitFontSmoothing: 'antialiased' }}>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header
        style={{
          background: '#40061E',
          position: 'relative',
          overflow: 'hidden',
          padding: '0 20px 28px',
        }}
      >
        {/* Grain */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05, backgroundImage: GRAIN_URI, backgroundSize: '180px 180px' }} />
        {/* Glow */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 90% 10%, rgba(184,146,42,0.18), transparent 60%), radial-gradient(ellipse 50% 60% at 5% 90%, rgba(128,18,55,0.4), transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Topline */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(254,242,227,0.12)', padding: '12px 0 10px', marginBottom: '24px' }}>
            <span style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontWeight: 500, fontSize: '17px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FEF2E3' }}>
              Häagen-Dazs
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(254,242,227,0.45)' }}>
                ·&nbsp;&nbsp;AKUN
              </span>
              <LanguageCurrencySwitcher tone="dark" />
            </div>
          </div>
          {/* Hero headline */}
          <h1 style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '72px', fontWeight: 300, fontStyle: 'italic', lineHeight: 0.88, letterSpacing: '-0.025em', color: '#FEF2E3', margin: 0 }}>
            A portrait<br />
            <em style={{ color: 'rgba(254,242,227,0.75)', fontStyle: 'italic' }}>of you.</em>
          </h1>
        </div>
      </header>

      {/* ── 01 — IDENTITY ────────────────────────────────────────────── */}
      <div style={{ padding: '32px 20px 0' }}>
        <SectionHeader num="01" title="Identity" italic />
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingBottom: '24px' }}>
          {/* Profile photo placeholder */}
          <div style={{ width: '64px', height: '64px', flexShrink: 0, border: '1px solid rgba(43,43,43,0.12)', background: '#F5E6C8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(43,43,43,0.25)" strokeWidth="1.5" strokeLinecap="square">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          {/* Fields */}
          <div style={{ flex: 1 }}>
            <FieldRow label={displayName} isName />
            <FieldRow label={profile?.email ?? '—'} />
            <FieldRow label={profile?.phone ?? '—'} mono />
            {/* Birthday field */}
            <div style={{ padding: '11px 0', borderBottom: '1px solid rgba(43,43,43,0.08)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <span style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '14px', color: '#2B2B2B', lineHeight: 1.3 }}>Birthday</span>
                <input
                  type="date"
                  value={birthday}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleBirthdayChange(e.target.value)}
                  style={{ display: 'block', fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '12px', background: 'transparent', border: 'none', outline: 'none', color: '#2B2B2B', padding: '2px 0', marginTop: '2px' }}
                />
                {(saving || savedAt || err) && (
                  <span style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: err ? '#650A30' : saving ? 'rgba(43,43,43,0.5)' : '#B8922A' }}>
                    {err ? err : saving ? 'Saving…' : 'Saved'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 02 — MEMBERSHIP ──────────────────────────────────────────── */}
      <div style={{ padding: '32px 20px 0' }}>
        <SectionHeader num="02" title="Membership" italic />
        {/* Mini card */}
        <div
          style={{
            background: '#40061E',
            position: 'relative',
            overflow: 'hidden',
            padding: '20px',
            marginBottom: '14px',
          }}
        >
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05, backgroundImage: GRAIN_URI, backgroundSize: '180px 180px' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, color: '#F5E6C8', marginBottom: '8px' }}>
                {tierLabel}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '32px', lineHeight: 1, fontWeight: 500, color: '#FEF2E3', letterSpacing: '-0.03em' }}>
                  {points.toLocaleString('en-US')}
                </span>
                <span style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontStyle: 'italic', fontSize: '13px', color: 'rgba(254,242,227,0.5)', marginLeft: '4px' }}>pts</span>
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(254,242,227,0.3)', textAlign: 'right' }}>
              Häagen-Dazs<br />Indonesia
            </div>
          </div>
        </div>
        <Link
          href="/lounge"
          style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', letterSpacing: '0.16em', fontWeight: 600, color: '#650A30', textDecoration: 'underline', textUnderlineOffset: '3px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          Enter The Lounge <span style={{ fontSize: '12px' }}>→</span>
        </Link>
      </div>

      {/* ── 03 — PREFERENCES ─────────────────────────────────────────── */}
      <div style={{ padding: '32px 20px 0' }}>
        <SectionHeader num="03" title="Preferences" italic />
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '14px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {FLAVOR_PHOTOS.map((f) => (
            <div key={f.name} style={{ flexShrink: 0, width: '80px' }}>
              <div style={{ width: '80px', height: '80px', overflow: 'hidden', border: '1px solid rgba(43,43,43,0.08)', marginBottom: '6px' }}>
                <Image src={f.img} alt={f.name} width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '11px', fontWeight: 500, color: '#2B2B2B', lineHeight: 1.2, textAlign: 'center' }}>{f.name}</div>
            </div>
          ))}
        </div>
        <a
          href="#"
          style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', letterSpacing: '0.16em', fontWeight: 600, color: '#650A30', textDecoration: 'underline', textUnderlineOffset: '3px', display: 'inline-block' }}
        >
          Edit Preferences →
        </a>
      </div>

      {/* ── 04 — RECENT ORDERS ───────────────────────────────────────── */}
      <div style={{ padding: '32px 20px 0' }}>
        <SectionHeader num="04" title="Recent Orders" italic />
        <div>
          {recentOrders.length > 0 ? (
            recentOrders.map((o, i) => {
              const dateStr = new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              const modeLabel = o.order_mode === 'pickup' ? 'Pick Up' : o.order_mode === 'dinein' ? 'Dine In' : 'Delivery'
              return (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(43,43,43,0.08)' : 'none', textDecoration: 'none' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '10px', letterSpacing: '0.10em', color: 'rgba(43,43,43,0.4)', marginBottom: '3px' }}>
                      #{o.id.slice(0, 12).toUpperCase()}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '13px', color: '#2B2B2B' }}>
                      {o.item_count ?? 1} {(o.item_count ?? 1) === 1 ? 'item' : 'items'} · {modeLabel}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', color: 'rgba(43,43,43,0.4)', marginTop: '2px' }}>{dateStr}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '12px', color: '#2B2B2B', letterSpacing: '-0.01em' }}>
                      Rp {Math.round(o.total_amount).toLocaleString('id-ID')}
                    </span>
                    <span style={{ fontSize: '14px', color: 'rgba(43,43,43,0.25)' }}>↗</span>
                  </div>
                </Link>
              )
            })
          ) : (
            <div style={{ padding: '14px 0', fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '15px', fontStyle: 'italic', color: 'rgba(43,43,43,0.4)' }}>No orders yet.</div>
          )}
        </div>
      </div>

      {/* ── 05 — SETTINGS ────────────────────────────────────────────── */}
      <div style={{ padding: '32px 20px 0' }}>
        <SectionHeader num="05" title="Settings" italic />
        <div>
          {[
            { label: 'Notifications', href: '#' },
            { label: 'Language', href: '#' },
            { label: 'Privacy', href: '#' },
            { label: 'Help', href: '#' },
          ].map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(43,43,43,0.08)', textDecoration: 'none' }}
            >
              <span style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '17px', fontStyle: 'italic', fontWeight: 300, color: '#2B2B2B', letterSpacing: '-0.01em' }}>
                {item.label}
              </span>
              <span style={{ fontSize: '14px', color: 'rgba(43,43,43,0.2)' }}>→</span>
            </a>
          ))}
          {/* Sign Out */}
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '17px', fontStyle: 'italic', fontWeight: 300, color: '#650A30', letterSpacing: '-0.01em' }}>
              Sign Out
            </span>
            <span style={{ fontSize: '14px', color: 'rgba(101,10,48,0.35)' }}>→</span>
          </button>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <div style={{ padding: '48px 20px 28px', textAlign: 'center', borderTop: '1px solid rgba(43,43,43,0.08)', marginTop: '32px' }}>
        <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(43,43,43,0.25)' }}>
          © Häagen-Dazs Indonesia · Sejak 1960
        </div>
      </div>

      {/* ── BOTTOM NAV (Account active) ──────────────────────────────── */}
      <AccountBottomNav />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ num, title, italic = false }: { num: string; title: string; italic?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', borderBottom: '1px solid rgba(43,43,43,0.12)', paddingBottom: '12px', marginBottom: '22px' }}>
      <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '10px', color: 'rgba(43,43,43,0.3)', letterSpacing: '0.04em' }}>{num}</span>
      <span style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '24px', fontWeight: 500, fontStyle: italic ? 'italic' : 'normal', letterSpacing: '-0.02em', color: '#2B2B2B', lineHeight: 1 }}>
        {title}
      </span>
    </div>
  )
}

function FieldRow({ label, isName = false, mono = false }: { label: string; isName?: boolean; mono?: boolean }) {
  return (
    <div style={{ padding: '11px 0', borderBottom: '1px solid rgba(43,43,43,0.08)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
      <span style={{
        fontFamily: isName
          ? "var(--font-sans, 'Jost', sans-serif)"
          : mono
            ? "var(--font-mono, 'JetBrains Mono', monospace)"
            : "var(--font-sans, 'Jost', sans-serif)",
        fontSize: isName ? '13px' : mono ? '12px' : '14px',
        fontWeight: isName ? 600 : 400,
        letterSpacing: isName ? '0.06em' : mono ? '-0.01em' : undefined,
        textTransform: isName ? 'uppercase' : 'none',
        color: '#2B2B2B',
        lineHeight: 1.3,
      }}>
        {label}
      </span>
      <button style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(43,43,43,0.35)', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, background: 'none', border: 'none' }}>
        edit
      </button>
    </div>
  )
}

function AccountBottomNav() {
  const items = [
    {
      id: 'home', href: '/home', label: 'Beranda',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>,
    },
    {
      id: 'menu', href: '/menu', label: 'Menu',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
    },
    {
      id: 'orders', href: '/orders', label: 'Pesanan',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>,
    },
    {
      id: 'rewards', href: '/lounge', label: 'Hadiah',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" /></svg>,
    },
    {
      id: 'account', href: '/account', label: 'Akun',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    },
  ]
  return (
    <nav
      style={{
        height: '68px',
        background: '#FEF2E3',
        borderTop: '1px solid rgba(43,43,43,0.12)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
      }}
    >
      {items.map((item) => {
        const isActive = item.id === 'account'
        return (
          <a
            key={item.id}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '8px 4px',
              position: 'relative',
              color: isActive ? '#650A30' : 'rgba(43,43,43,0.28)',
              textDecoration: 'none',
            }}
          >
            {isActive && (
              <span style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '1.5px', background: '#650A30' }} />
            )}
            {item.icon}
            <span style={{
              fontFamily: isActive ? "var(--font-display, 'Cormorant Garamond', serif)" : "var(--font-sans, 'Jost', sans-serif)",
              fontStyle: isActive ? 'italic' : 'normal',
              fontSize: isActive ? '10px' : '8px',
              letterSpacing: isActive ? '0.04em' : '0.18em',
              textTransform: isActive ? 'none' : 'uppercase',
              fontWeight: isActive ? 400 : 600,
            }}>
              {item.label}
            </span>
          </a>
        )
      })}
    </nav>
  )
}
