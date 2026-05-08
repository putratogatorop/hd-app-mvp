'use client'

/**
 * Onboarding — Screen 4: Tier Reveal / Welcome
 * Mockup reference: design-system/mockups/onboarding-4-tier-reveal.html
 *
 * State:
 *   - Reads `hd_onboarding_name` from localStorage (set in Screen 2)
 *   - On CTA: sets `hd_onboarding_completed = true` in localStorage
 *             then router.replace('/home')
 *
 * Phase 2 TODOs:
 *   - TODO: Wire to profiles table once `has_completed_onboarding` column is added.
 *           Migration: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;
 *           Then: supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', user.id)
 *   - Fetch real tier from Supabase once tiers table / profile tiers are wired up
 *   - Animate tier badge and headline with stagger on mount
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/context'

export default function OnboardingWelcomePage() {
  const router = useRouter()
  const { t, lang } = useTranslation()
  const [memberName, setMemberName] = useState<string>('')

  // Hydrate name from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hd_onboarding_name')
      if (saved) setMemberName(saved)
    } catch {
      // localStorage unavailable
    }
  }, [])

  const handleBegin = () => {
    // Persist completion flag
    try {
      localStorage.setItem('hd_onboarding_completed', 'true')
    } catch {
      // ignore
    }
    // TODO: Wire to profiles table once has_completed_onboarding column is added.
    router.replace('/home')
  }

  return (
    <main
      className="flex flex-col min-h-dvh"
      style={{ background: '#FEF2E3', position: 'relative' }}
    >
      {/* Subtle grain on the page */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '180px 180px',
          zIndex: 0,
        }}
      />

      {/* ── TOP NAV ── */}
      <nav
        className="relative z-10 flex justify-between items-center px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(43,43,43,0.12)' }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: '17px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#650A30',
          }}
        >
          Häagen-Dazs
        </span>
        {/* Bookmark / save icon — decorative */}
        <button
          aria-label="Save"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(43,43,43,0.4)',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
            borderRadius: 0,
            transition: 'color 200ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#B8922A' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(43,43,43,0.4)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </button>
      </nav>

      {/* ── SCROLLABLE CONTENT ── */}
      <div
        className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden"
        style={{ paddingBottom: '100px' }}
      >

        {/* Hero section */}
        <div className="px-6 pt-12 pb-10">
          {/* Centered eyebrow with flanking hairlines */}
          <div className="flex items-center gap-3 mb-8">
            <div style={{ width: 32, height: 1, background: 'rgba(43,43,43,0.12)', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'rgba(43,43,43,0.40)',
                whiteSpace: 'nowrap',
              }}
            >
              {lang === 'id' ? '03 — Sambutan' : '03 — Welcome'}
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(43,43,43,0.12)' }} />
          </div>

          {/* THE MOMENT — massive italic headline */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '64px',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 0.9,
              letterSpacing: '-0.025em',
              color: '#40061E',
              marginBottom: '40px',
            }}
          >
            {lang === 'id' ? (
              <>Anda seorang<br /><em style={{ fontStyle: 'italic', color: '#650A30' }}>Connoisseur.</em></>
            ) : (
              <>You&apos;re a<br /><em style={{ fontStyle: 'italic', color: '#650A30' }}>Connoisseur.</em></>
            )}
          </h1>

          {/* ── GOLD TIER BADGE (ONLY ALLOWED CIRCLE) ── */}
          <div className="flex justify-center mb-10">
            <div
              style={{
                position: 'relative',
                width: 128,
                height: 128,
              }}
            >
              {/* Outer spinning ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '1px solid #B8922A',
                  opacity: 0.3,
                  animation: 'slowSpin 20s linear infinite',
                }}
              />
              {/* Inner dashed ring (reverse) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 6,
                  borderRadius: '50%',
                  border: '1px dashed rgba(184,146,42,0.25)',
                  animation: 'slowSpin 30s linear infinite reverse',
                }}
              />
              {/* Badge inner */}
              <div
                style={{
                  position: 'absolute',
                  inset: 10,
                  borderRadius: '50%',
                  background: '#F5E6C8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {/* Gold sigil / flare glyph */}
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    color: '#B8922A',
                    lineHeight: 1,
                    fontStyle: 'normal',
                  }}
                >
                  ✦
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    color: '#650A30',
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  Connoisseur
                </span>
              </div>
            </div>
          </div>

          {/* Spin animation keyframe via style tag */}
          <style>{`
            @keyframes slowSpin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `}</style>
        </div>

        {/* ── ACCRUAL CARD ── */}
        <div className="px-6 mb-10">
          <div
            style={{
              border: '1px solid rgba(43,43,43,0.12)',
              padding: '20px',
              background: '#FEF2E3',
              position: 'relative',
            }}
          >
            {/* Left accent bar (burgundy) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 2,
                height: '100%',
                background: '#650A30',
              }}
            />

            {/* Top row */}
            <div className="flex justify-between items-start mb-3.5">
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: 'rgba(43,43,43,0.45)',
                    marginBottom: 4,
                  }}
                >
                  {lang === 'id' ? 'Akumulasi Saat Ini' : 'Current Accrual'}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: '15px',
                    color: '#2B2B2B',
                  }}
                >
                  {lang === 'id' ? 'Dapatkan 1 poin per Rp 1.000' : 'Earn 1 point per Rp 1,000'}
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#650A30',
                  letterSpacing: '-0.01em',
                }}
              >
                0 / 500 PTS
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 1,
                background: 'rgba(43,43,43,0.10)',
                position: 'relative',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  right: 'auto',
                  width: '0%',
                  background: '#B8922A',
                }}
              />
            </div>

            {/* Labels */}
            <div className="flex justify-between">
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.06em',
                  color: 'rgba(43,43,43,0.35)',
                }}
              >
                0 PTS
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: '11px',
                  color: 'rgba(43,43,43,0.45)',
                }}
              >
                {lang === 'id' ? '500 poin ke tier Maestro' : '500 points to Maestro tier'}
              </span>
            </div>
          </div>
        </div>

        {/* ── EDITORIAL PHOTOGRAPHY ── */}
        <div className="px-6 pb-8">
          <div
            style={{
              position: 'relative',
              height: 240,
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            <Image
              src="/hd-photos/DVxL5rJE5B8.jpg"
              alt="Häagen-Dazs artisanal craft"
              fill
              className="object-cover object-center"
              style={{ filter: 'grayscale(15%)', transition: 'filter 700ms' }}
              sizes="(max-width: 768px) 100vw, 600px"
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'none' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'grayscale(15%)' }}
            />
          </div>
          {/* Caption */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: '#650A30',
                marginBottom: 10,
              }}
            >
              Est. 1960
            </div>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                lineHeight: 1.7,
                color: 'rgba(43,43,43,0.60)',
              }}
            >
              {lang === 'id'
                ? 'Warisan kami dibangun atas pengejaran hal-hal luar biasa. Sebagai Connoisseur, Anda adalah bagian dari segelintir orang yang menghargai nuansa kerajinan artisanal dan kemurnian bahan-bahan terbaik.'
                : 'Our legacy is built on the pursuit of the extraordinary. As a Connoisseur, you are part of a select few who appreciate the nuance of artisanal craftsmanship and the purity of the finest ingredients.'}
            </p>
          </div>
        </div>

      </div>
      {/* end scroll */}

      {/* ── STICKY BOTTOM CTA ── */}
      <div
        className="sticky bottom-0 z-20 flex-shrink-0"
        style={{
          background: '#FEF2E3',
          borderTop: '1px solid rgba(43,43,43,0.12)',
        }}
      >
        <button
          onClick={handleBegin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            background: '#650A30',
            color: '#FEF2E3',
            border: 'none',
            padding: '20px 24px',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.28em',
            fontWeight: 600,
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 0,
            transition: 'background 250ms cubic-bezier(0.2,0.8,0.2,1)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#40061E' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#650A30' }}
        >
          {lang === 'id' ? 'Mulai Mencicipi →' : 'Begin Tasting →'}
        </button>
      </div>
    </main>
  )
}
