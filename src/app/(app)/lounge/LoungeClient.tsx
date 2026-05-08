'use client'

import Link from 'next/link'
import Image from 'next/image'
import { LanguageCurrencySwitcher } from '@/components/LanguageCurrencySwitcher'
import type { LoungeProfile, JournalEntry } from './page'

// ─── Grain SVG data URI ─────────────────────────────────────────────────────
const GRAIN_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
const GRAIN_CARD_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ng'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ng)'/%3E%3C/svg%3E")`

// ─── Tier resolution ────────────────────────────────────────────────────────
export type TierVariant = 'initiate' | 'connoisseur' | 'maestro' | 'grand_maestro'

function resolveTier(raw: string): TierVariant {
  if (raw === 'gold' || raw === 'connoisseur') return 'connoisseur'
  if (raw === 'platinum' || raw === 'maestro') return 'maestro'
  // Future-proof: grand_maestro
  if (raw === 'grand_maestro') return 'grand_maestro'
  // Default: silver / initiate / anything else
  return 'initiate'
}

// ─── Tier config ─────────────────────────────────────────────────────────────
interface TierConfig {
  variant: TierVariant
  displayName: string
  eyebrow: string
  headline: string[]  // array of lines; last element indented
  headerBg: string
  grainOpacity: number
  glowBg: string
  cardBg: string
  cardBorder: string
  progressTarget: number
  progressNext: string
  activePrivileges: string[]
  activeTierLine: string  // color for active tier underline
}

function getTierConfig(variant: TierVariant, points: number): TierConfig {
  switch (variant) {
    case 'initiate':
      return {
        variant,
        displayName: 'Initiate',
        eyebrow: '01 — INITIATE TIER · LOYALTY',
        headline: ['Your journey', 'begins here.'],
        headerBg: '#650A30',
        grainOpacity: 0.04,
        glowBg:
          'radial-gradient(ellipse 60% 40% at 100% 0%, rgba(184,146,42,0.12), transparent 55%), radial-gradient(ellipse 50% 50% at 0% 100%, rgba(64,6,30,0.40), transparent 60%)',
        cardBg: 'linear-gradient(135deg, #650A30 0%, #40061E 100%)',
        cardBorder: 'rgba(184,146,42,0.18)',
        progressTarget: 500,
        progressNext: 'Connoisseur',
        activePrivileges: ['birthday_scoop'],
        activeTierLine: '#650A30',
      }
    case 'connoisseur':
      return {
        variant,
        displayName: 'Connoisseur',
        eyebrow: '02 — CONNOISSEUR TIER · LOYALTY',
        headline: ['The pursuit', 'of more.'],
        headerBg: 'linear-gradient(160deg, #801237 0%, #40061E 100%)',
        grainOpacity: 0.05,
        glowBg:
          'radial-gradient(ellipse 70% 50% at 95% 5%, rgba(184,146,42,0.20), transparent 55%), radial-gradient(ellipse 50% 60% at 5% 95%, rgba(64,6,30,0.45), transparent 60%)',
        cardBg: '#40061E',
        cardBorder: 'rgba(184,146,42,0.28)',
        progressTarget: 2000,
        progressNext: 'Maestro',
        activePrivileges: ['birthday_scoop', 'early_access'],
        activeTierLine: '#B8922A',
      }
    case 'maestro':
      return {
        variant,
        displayName: 'Maestro',
        eyebrow: '03 — MAESTRO TIER · LOYALTY',
        headline: ['A small', 'luxury.'],
        headerBg: '#40061E',
        grainOpacity: 0.05,
        glowBg:
          'radial-gradient(ellipse 80% 60% at 90% 10%, rgba(184,146,42,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(128,18,55,0.35), transparent 60%)',
        cardBg: '#40061E',
        cardBorder: 'rgba(184,146,42,0.25)',
        progressTarget: 5000,
        progressNext: 'Grand Maestro',
        activePrivileges: ['birthday_scoop', 'early_access', 'artisan_workshop'],
        activeTierLine: '#B8922A',
      }
    case 'grand_maestro':
      return {
        variant,
        displayName: 'Grand Maestro',
        eyebrow: '04 — GRAND MAESTRO · SUPREME',
        headline: ['Your ultimate', 'journey.'],
        headerBg: '#1E0A0F',
        grainOpacity: 0.10,
        glowBg:
          'radial-gradient(ellipse 80% 60% at 95% 5%, rgba(201,164,60,0.28), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(101,10,48,0.60), transparent 60%)',
        cardBg: '#1E0A0F',
        cardBorder: 'rgba(201,164,60,0.25)',
        progressTarget: 5000,
        progressNext: '',
        activePrivileges: ['birthday_scoop', 'early_access', 'artisan_workshop', 'heritage_kit', 'boutique_concierge'],
        activeTierLine: '#C9A43C',
      }
  }
}

// ─── Privilege definitions ───────────────────────────────────────────────────
interface Privilege {
  id: string
  title: string
  desc: string
  img: string
  lockLabel?: string  // if falsy = active for this tier
}

const ALL_PRIVILEGES: Privilege[] = [
  {
    id: 'birthday_scoop',
    title: 'Birthday Scoop',
    desc: 'A complimentary selection on your anniversary month.',
    img: '/hd-photos/DWDNYgPk8Nd.jpg',
  },
  {
    id: 'early_access',
    title: 'Early Access',
    desc: 'First access to limited editions before public release.',
    img: '/hd-photos/DVxL5rJE5B8.jpg',
    lockLabel: 'Locked · Connoisseur',
  },
  {
    id: 'artisan_workshop',
    title: 'Artisan Workshop',
    desc: 'Exclusive invitation to private tasting workshops.',
    img: '/hd-photos/DW03wihk-je.jpg',
    lockLabel: 'Locked · 2,500 pts',
  },
  {
    id: 'heritage_kit',
    title: 'Heritage Kit',
    desc: 'A curated gift of signature artefacts, available to supreme members.',
    img: '/hd-photos/DVHzikJk669.jpg',
    lockLabel: 'Locked · Grand Maestro',
  },
  {
    id: 'boutique_concierge',
    title: 'Boutique Concierge',
    desc: 'Dedicated service for private reservations and bespoke orders.',
    img: '/hd-photos/DVaSW5-Ey6f.jpg',
    lockLabel: 'Locked · Grand Maestro',
  },
]

// ─── Reward definitions ──────────────────────────────────────────────────────
interface Reward {
  id: string
  name: string
  sub: string
  pts: number
  img: string
  minTier: TierVariant
}

const REWARDS: Reward[] = [
  { id: 'r1', name: 'Single Scoop Selection', sub: 'Any classic flavour', pts: 150, img: '/hd-photos/DVhvEZck3Z9.jpg', minTier: 'initiate' },
  { id: 'r2', name: 'The Signature Flight', sub: 'A micro-tasters journey', pts: 500, img: '/hd-photos/DWizLL8k3Vq.jpg', minTier: 'initiate' },
  { id: 'r3', name: "Chef's Platter", sub: 'Boutique exclusive', pts: 1000, img: '/hd-photos/DVxL5rJE5B8.jpg', minTier: 'connoisseur' },
  { id: 'r4', name: 'The Heritage Kit', sub: 'Gold membership gift', pts: 3000, img: '/hd-photos/DWDNYgPk8Nd.jpg', minTier: 'maestro' },
]

const TIER_ORDER: TierVariant[] = ['initiate', 'connoisseur', 'maestro', 'grand_maestro']
function tierIndex(v: TierVariant): number { return TIER_ORDER.indexOf(v) }

// ─── Shared sub-components ───────────────────────────────────────────────────

function GrainOverlay({ opacity, isCard = false }: { opacity: number; isCard?: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity,
        backgroundImage: isCard ? GRAIN_CARD_URI : GRAIN_URI,
        backgroundSize: isCard ? '160px 160px' : '180px 180px',
      }}
    />
  )
}

function DiamondSigil({ size = 20, opacity = 0.55, color = 'rgba(184,146,42,0.5)', stroke = 'rgba(184,146,42,0.3)' }: {
  size?: number; opacity?: number; color?: string; stroke?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ opacity }}>
      <path d="M10 1L11.8 7.2L18 10L11.8 12.8L10 19L8.2 12.8L2 10L8.2 7.2Z" fill={color} stroke={stroke} strokeWidth="0.5" />
    </svg>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface LoungeClientProps {
  profile: LoungeProfile
  journal: JournalEntry[]
}

export default function LoungeClient({ profile, journal }: LoungeClientProps) {
  const variant = resolveTier(profile.tier)
  const cfg = getTierConfig(variant, profile.loyalty_points)
  const pts = profile.loyalty_points
  const pct = Math.min(100, Math.round((pts / cfg.progressTarget) * 100))

  // Member since: parse created_at or member_since
  const memberSinceDisplay = profile.member_since
    ? new Date(profile.member_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Jan 2026'

  const displayName = (profile.full_name ?? '').toUpperCase() || 'MEMBER'

  // Which privileges to show (max 3 for initiate/connoisseur/maestro, all 5 for grand_maestro)
  const privilegesToShow = variant === 'grand_maestro' ? ALL_PRIVILEGES : ALL_PRIVILEGES.slice(0, 3)

  // Season stats (hardcoded — no DB backing yet)
  const seasonStats = {
    points: pts,
    visits: Math.max(1, Math.floor(pts / 60)),
    privileges: cfg.activePrivileges.length - 1,
  }

  const isGrandMaestro = variant === 'grand_maestro'
  const goldColor = isGrandMaestro ? '#C9A43C' : '#B8922A'

  return (
    <div style={{ background: '#FEF2E3', minHeight: '100vh', fontFamily: "var(--font-sans, 'Jost', sans-serif)", WebkitFontSmoothing: 'antialiased' }}>

      {/* ── LOUNGE HEADER ───────────────────────────────────────────── */}
      <div
        style={{
          background: cfg.headerBg,
          position: 'relative',
          overflow: 'hidden',
          padding: '0 20px 36px',
        }}
      >
        <GrainOverlay opacity={cfg.grainOpacity} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: cfg.glowBg }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Topline: wordmark + eyebrow + switcher */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(254,242,227,0.15)',
            padding: '12px 0 10px',
          }}>
            <span style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontWeight: 500, fontSize: '18px', letterSpacing: '0.10em', textTransform: 'uppercase', color: '#FEF2E3' }}>
              Häagen-Dazs
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(254,242,227,0.45)' }}>
                ·&nbsp;&nbsp;THE LOUNGE
              </span>
              <LanguageCurrencySwitcher tone="dark" />
            </div>
          </div>

          {/* Hero headline */}
          <div style={{ paddingTop: '28px' }}>
            <div style={{
              fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
              fontSize: variant === 'initiate' ? '52px' : variant === 'connoisseur' ? '64px' : isGrandMaestro ? '80px' : '76px',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 0.92,
              color: '#FEF2E3',
              letterSpacing: '-0.02em',
              marginBottom: '14px',
            }}>
              {cfg.headline[0]}
              <span style={{ paddingLeft: '0.4em', display: 'block' }}>
                {isGrandMaestro
                  ? <>Your ultimate <em style={{ color: goldColor }}>journey.</em></>
                  : cfg.headline[1]
                }
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 400, color: 'rgba(254,242,227,0.45)' }}>
              {cfg.eyebrow}
            </div>
          </div>
        </div>
      </div>

      {/* ── EDITORIAL LABEL ─────────────────────────────────────────── */}
      <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: isGrandMaestro ? 'rgba(201,164,60,0.40)' : 'rgba(254,242,227,0.40)', padding: '18px 20px 0', background: isGrandMaestro ? '#1E0A0F' : '#40061E' }}>
        LOYALTY · 2026
      </div>

      {/* ── MEMBERSHIP CARD ─────────────────────────────────────────── */}
      <div style={{ padding: '0 20px 28px', background: isGrandMaestro ? '#1E0A0F' : '#40061E' }}>
        <div
          style={{
            aspectRatio: '1.6 / 1',
            background: cfg.cardBg,
            border: `1px solid ${cfg.cardBorder}`,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '18px 20px',
          }}
        >
          <GrainOverlay opacity={variant === 'initiate' ? 0.04 : 0.06} isCard />
          <div aria-hidden style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(ellipse 70% 50% at 95% 5%, rgba(184,146,42,0.25), transparent 55%), radial-gradient(ellipse 60% 60% at 0% 100%, rgba(101,10,48,0.5), transparent 70%)`,
          }} />
          {/* Decorative ring */}
          <div aria-hidden style={{ position: 'absolute', right: '-40px', top: '-40px', width: '160px', height: '160px', border: `1px solid ${isGrandMaestro ? 'rgba(201,164,60,0.15)' : 'rgba(184,146,42,0.15)'}`, borderRadius: '9999px', pointerEvents: 'none' }} />
          {/* Corner sigil */}
          <div style={{ position: 'absolute', top: '14px', right: '16px' }}>
            <DiamondSigil size={20} />
          </div>

          {/* Card top */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,223,151,0.6)', marginBottom: '3px' }}>CURRENT TIER</div>
            <div style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: variant === 'initiate' ? '28px' : '32px', fontWeight: 300, fontStyle: 'italic', letterSpacing: '-0.01em', color: goldColor, lineHeight: 1 }}>
              {cfg.displayName}
            </div>
          </div>

          {/* Card mid */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(254,242,227,0.35)', marginBottom: '5px' }}>MEMBER SINCE · {memberSinceDisplay}</div>
            <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '14px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#FEF2E3', lineHeight: 1, marginBottom: '4px' }}>{displayName}</div>
          </div>

          {/* Card bottom */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(254,242,227,0.35)' }}>
              Member ID · HD-{String(pts).padStart(4, '0')}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: `${goldColor}88`, marginBottom: '4px' }}>Available</div>
              <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: variant === 'initiate' ? '30px' : '38px', fontWeight: 500, color: goldColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {pts.toLocaleString('en-US')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INITIATE FOMO BANNER ─────────────────────────────────────── */}
      {variant === 'initiate' && (
        <div style={{ padding: '16px 20px', background: '#F5E6C8', borderBottom: '1px solid rgba(43,43,43,0.12)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', fontStyle: 'italic', color: 'rgba(43,43,43,0.6)', flex: 1, lineHeight: 1.5 }}>
            Unlock Connoisseur to access Early Access releases &amp; exclusive invitations.
          </span>
          <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '13px', fontWeight: 500, color: '#650A30', whiteSpace: 'nowrap' }}>
            {Math.max(0, 500 - pts)} pts away
          </span>
        </div>
      )}

      {/* ── TIER PROGRESS ────────────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 0', background: '#FEF2E3', borderTop: '1px solid rgba(43,43,43,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
          <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '11px', letterSpacing: '-0.01em', color: '#2B2B2B' }}>
            {pts.toLocaleString('en-US')} / {cfg.progressTarget.toLocaleString('en-US')}
          </span>
          {cfg.progressNext && (
            <span style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(43,43,43,0.45)' }}>
              {cfg.progressNext}
            </span>
          )}
        </div>
        <div style={{ height: '2px', background: 'rgba(43,43,43,0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: '0 auto 0 0', background: goldColor, width: `${pct}%`, borderRadius: '9999px' }} />
        </div>
        {variant === 'maestro' && (
          <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', fontStyle: 'italic', color: 'rgba(43,43,43,0.45)', lineHeight: 1.5, marginTop: '10px', paddingBottom: '4px' }}>
            Indulge in more signature pints to unlock Private Event invitations.
          </div>
        )}
      </div>

      {/* ── TIER LADDER ──────────────────────────────────────────────── */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(43,43,43,0.12)' }}>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {(['initiate', 'connoisseur', 'maestro', 'grand_maestro'] as TierVariant[]).map((t) => {
            const isActive = t === variant
            return (
              <div key={t} style={{ flexShrink: 0, paddingRight: '16px', paddingBottom: '8px' }}>
                <div style={{
                  fontFamily: isActive ? "var(--font-display, 'Cormorant Garamond', serif)" : "var(--font-sans, 'Jost', sans-serif)",
                  fontStyle: isActive ? 'italic' : 'normal',
                  fontSize: isActive ? '12px' : '10px',
                  letterSpacing: isActive ? '0.06em' : '0.16em',
                  fontWeight: 500,
                  color: isActive ? '#2B2B2B' : 'rgba(43,43,43,0.35)',
                  textTransform: isActive ? 'none' : 'uppercase',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  textDecoration: 'none',
                }}>
                  {t === 'grand_maestro' ? 'Grand Maestro' : t.charAt(0).toUpperCase() + t.slice(1)}
                </div>
                <div style={{ height: '1px', background: isActive ? cfg.activeTierLine : 'transparent', marginTop: '5px' }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 01 — EARNED THIS SEASON ──────────────────────────────────── */}
      <div style={{ paddingTop: '64px' }}>
        <SectionHeader num="01" title="Earned this season" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(43,43,43,0.08)', border: '1px solid rgba(43,43,43,0.08)', margin: '20px 20px 0' }}>
          {[
            { num: String(pts.toLocaleString('en-US')), label: 'Points\naccrued' },
            { num: String(seasonStats.visits).padStart(2, '0'), label: 'Visits' },
            { num: String(seasonStats.privileges).padStart(2, '0'), label: 'Privileges\nenjoyed' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#FEF2E3', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '28px', fontWeight: 500, letterSpacing: '-0.04em', color: '#2B2B2B', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(43,43,43,0.45)', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 02 — CURATED PRIVILEGES ──────────────────────────────────── */}
      <div style={{ paddingTop: '64px' }}>
        <SectionHeader num="02" title="Curated Privileges" />
        <div style={{ margin: '16px 20px 0' }}>
          {privilegesToShow.map((p, i) => {
            const isActive = cfg.activePrivileges.includes(p.id)
            return (
              <div
                key={p.id}
                style={{
                  borderTop: '1px solid rgba(43,43,43,0.08)',
                  padding: '20px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: !isActive ? (variant === 'initiate' ? 0.45 : 0.55) : 1,
                  ...(i === privilegesToShow.length - 1 ? { borderBottom: '1px solid rgba(43,43,43,0.08)' } : {}),
                }}
              >
                <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '9px', letterSpacing: '0.04em', color: 'rgba(43,43,43,0.28)', marginBottom: '10px' }}>
                  02.{i + 1}
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '80px', height: '80px', flexShrink: 0, overflow: 'hidden' }}>
                    <Image
                      src={p.img}
                      alt={p.title}
                      width={80}
                      height={80}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isActive ? 'grayscale(20%)' : 'grayscale(80%)' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '80px' }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '22px', fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.02em', color: '#2B2B2B', lineHeight: 1.05, marginBottom: '5px' }}>
                        {p.title}
                      </div>
                      <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', lineHeight: 1.5, color: 'rgba(43,43,43,0.55)' }}>
                        {p.desc}
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {isActive ? (
                        <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: goldColor }}>Active</span>
                      ) : (
                        <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '9px', letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(43,43,43,0.4)', border: '1px solid rgba(43,43,43,0.15)', padding: '4px 8px', background: 'none' }}>
                          {p.lockLabel ?? 'Locked'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── INITIATE NEXT TIER TEASER ─────────────────────────────────── */}
      {variant === 'initiate' && (
        <div style={{ paddingTop: '64px' }}>
          <SectionHeader num="—" title="Next tier" small />
          <div style={{ margin: '20px 20px 0', padding: '24px', border: '1px solid rgba(43,43,43,0.12)', background: '#fff', position: 'relative' }}>
            <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(43,43,43,0.4)', marginBottom: '10px' }}>UNLOCKS AT 500 POINTS</div>
            <div style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '32px', fontWeight: 300, fontStyle: 'italic', color: '#2B2B2B', lineHeight: 1.1, marginBottom: '12px' }}>Connoisseur.</div>
            <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '12px', lineHeight: 1.6, color: 'rgba(43,43,43,0.6)', marginBottom: '20px' }}>
              Earn {Math.max(0, 500 - pts)} more points to unlock an elevated membership — exclusive seasonal releases, priority boutique access, and curated tasting invitations.
            </div>
            <div style={{ marginBottom: '20px' }}>
              {['Early Access to limited releases', 'Priority boutique pickup window', 'Seasonal tasting invitations'].map((perk) => (
                <div key={perk} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '8px 0', borderTop: '1px solid rgba(43,43,43,0.08)', fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', color: 'rgba(43,43,43,0.65)' }}>
                  <div style={{ width: '4px', height: '4px', background: '#650A30', borderRadius: '9999px', flexShrink: 0, marginTop: '3px' }} />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 03 — REDEEM ─────────────────────────────────────────────── */}
      <div style={{ paddingTop: '64px' }}>
        <SectionHeader num="03" title="Redeem" italic />
        <div style={{ marginTop: '16px' }}>
          {REWARDS.map((r) => {
            const isLocked = tierIndex(variant) < tierIndex(r.minTier) || pts < r.pts
            return (
              <div
                key={r.id}
                style={{ borderBottom: '1px solid rgba(43,43,43,0.08)', cursor: 'pointer', position: 'relative', opacity: isLocked ? 0.55 : 1 }}
              >
                <span style={{ position: 'absolute', top: '12px', left: '20px', fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FEF2E3', background: '#650A30', padding: '3px 7px', zIndex: 2 }}>
                  {r.pts.toLocaleString('en-US')} pts
                </span>
                <div style={{ width: '100%', height: '200px', overflow: 'hidden', background: '#F5E6C8' }}>
                  <Image
                    src={r.img}
                    alt={r.name}
                    width={390}
                    height={200}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(20%)' }}
                  />
                </div>
                <div style={{ padding: '14px 20px 18px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '20px', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em', color: '#2B2B2B', lineHeight: 1.1 }}>{r.name}</div>
                    <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(43,43,43,0.40)', marginTop: '3px' }}>{r.sub}</div>
                  </div>
                  {isLocked ? (
                    <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(43,43,43,0.40)', border: '1px solid rgba(43,43,43,0.18)', padding: '5px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {tierIndex(variant) < tierIndex(r.minTier) ? `Locked · ${r.minTier.charAt(0).toUpperCase() + r.minTier.slice(1)}` : `Locked · ${r.pts.toLocaleString('en-US')} pts`}
                    </span>
                  ) : (
                    <span style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', letterSpacing: '0.16em', fontWeight: 600, color: '#650A30', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Redeem →
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 04 — THE JOURNAL ─────────────────────────────────────────── */}
      <div style={{ paddingTop: '64px' }}>
        <SectionHeader num="04" title="The Journal" />
        <div style={{ margin: '16px 20px 0', border: '1px solid rgba(43,43,43,0.08)' }}>
          {journal.map((entry, i) => (
            <div
              key={entry.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', ...(i < journal.length - 1 ? { borderBottom: '1px solid rgba(43,43,43,0.08)' } : {}) }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em', color: '#2B2B2B', lineHeight: 1.2 }}>{entry.title}</div>
                <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(43,43,43,0.4)', marginTop: '3px' }}>{entry.meta}</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '13px', letterSpacing: '-0.02em', paddingTop: '2px', whiteSpace: 'nowrap', color: entry.type === 'positive' ? goldColor : 'rgba(43,43,43,0.45)' }}>
                {entry.type === 'positive' ? '+' : '−'}{entry.points.toLocaleString('en-US')} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── GRAND MAESTRO SUPREME BAND ────────────────────────────────── */}
      {isGrandMaestro && (
        <div style={{ margin: '48px 0 0', padding: '16px 20px', border: '1px solid rgba(201,164,60,0.25)', background: '#1E0A0F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '9px', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(201,164,60,0.55)' }}>MEMBERSHIP STATUS</span>
          <span style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C9A43C' }}>SUPREME</span>
        </div>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <div style={{ padding: '64px 20px 32px' }}>
        <div style={{ borderTop: '1px solid rgba(43,43,43,0.12)', paddingTop: '20px' }}>
          <div style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(43,43,43,0.45)', marginBottom: '8px' }}>Concierge</div>
          <div style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontStyle: 'italic', fontSize: '18px', color: '#650A30', textDecoration: 'underline', textDecorationColor: 'rgba(101,10,48,0.3)', textUnderlineOffset: '4px', cursor: 'pointer' }}>Join the inner circle</div>
        </div>
        <div style={{ marginTop: '32px', fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(43,43,43,0.25)', textAlign: 'center' }}>
          © Häagen-Dazs Indonesia · The Lounge
        </div>
      </div>

      {/* ── BOTTOM NAV (inline — Hadiah/Lounge active) ────────────────── */}
      <BottomNav active="rewards" />
    </div>
  )
}

// ─── Section header sub-component ──────────────────────────────────────────

function SectionHeader({ num, title, italic = false, small = false }: { num: string; title: string; italic?: boolean; small?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid rgba(43,43,43,0.12)', padding: '0 20px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
        <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: '11px', color: 'rgba(43,43,43,0.35)', letterSpacing: '0.04em' }}>{num}</span>
        <span style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)", fontSize: small ? '20px' : '26px', fontWeight: 500, fontStyle: italic || small ? 'italic' : 'normal', letterSpacing: '-0.02em', color: '#2B2B2B', lineHeight: 1 }}>
          {title}
        </span>
      </div>
    </div>
  )
}

// ─── Bottom nav sub-component ───────────────────────────────────────────────

function BottomNav({ active }: { active: string }) {
  const items = [
    {
      id: 'home', href: '/home', label: 'Beranda',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>,
    },
    {
      id: 'menu', href: '/menu', label: 'Menu',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
    },
    {
      id: 'orders', href: '/orders', label: 'Pesanan',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    },
    {
      id: 'rewards', href: '/lounge', label: 'Hadiah',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" /></svg>,
    },
    {
      id: 'account', href: '/account', label: 'Akun',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    },
  ]
  return (
    <nav
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        height: '68px',
        background: '#FEF2E3',
        borderTop: '1px solid rgba(43,43,43,0.12)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        zIndex: 50,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === active
        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              position: 'relative',
              color: isActive ? '#650A30' : 'rgba(43,43,43,0.35)',
              textDecoration: 'none',
            }}
          >
            {isActive && (
              <span style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '1.5px', background: '#650A30' }} />
            )}
            {item.icon}
            <span style={{ fontFamily: "var(--font-sans, 'Jost', sans-serif)", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
