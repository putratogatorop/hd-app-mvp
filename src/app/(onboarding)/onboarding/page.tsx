'use client'

/**
 * Onboarding — Screen 1: Splash / Entry Point
 * Mockup reference: design-system/mockups/onboarding-1-splash.html
 *
 * Phase 2 TODOs:
 *  - Wire MASUK / Sign-in link to Google OAuth via Supabase
 *  - On mount: check `hd_onboarding_completed` in localStorage
 *    and if `has_completed_onboarding` on the user profile → redirect to /home
 */

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageCurrencySwitcher } from '@/components/LanguageCurrencySwitcher'

export default function OnboardingSplashPage() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <main
      className="relative flex flex-col min-h-dvh overflow-hidden"
      style={{ background: '#40061E' }}
    >
      {/* ── HERO BACKGROUND IMAGE ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hd-photos/DXEOeW3E_Ed.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          style={{ mixBlendMode: 'multiply', opacity: 0.55 }}
        />
        {/* Gradient scrim */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(64,6,30,0.25) 0%, rgba(64,6,30,0.72) 55%, rgba(64,6,30,0.97) 100%)',
          }}
        />
      </div>

      {/* ── GRAIN ── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          opacity: 0.04,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '180px 180px',
        }}
      />

      {/* ── AMBIENT GLOW ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 80% 15%, rgba(184,146,42,0.10), transparent 60%), radial-gradient(ellipse 50% 60% at 10% 85%, rgba(128,18,55,0.30), transparent 70%)',
        }}
      />

      {/* ── TOP NAV — stacked wordmark left + MASUK link right ── */}
      <nav className="relative z-10 flex justify-between items-start px-6 pt-4">
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: '28px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#FEF2E3',
            lineHeight: 0.92,
          }}
        >
          Häagen-<br />Dazs
        </div>
        <div className="flex flex-col items-end gap-2 mt-1">
          <LanguageCurrencySwitcher tone="dark" />
          <a
            href="/login"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: 'rgba(254,242,227,0.55)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(254,242,227,0.25)',
              paddingBottom: '1px',
            }}
          >
            {t('cta.sign_in')}
          </a>
        </div>
      </nav>

      {/* ── HERO COPY — fills available vertical space, anchored bottom ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-7">
        {/* "01 / INTRODUCTION" eyebrow */}
        <div className="flex items-center gap-3 mb-4">
          <div
            style={{
              width: 32,
              height: 1,
              background: 'rgba(254,242,227,0.20)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: 'rgba(254,242,227,0.50)',
            }}
          >
            01 / {t('section.introduction')}
          </span>
        </div>

        {/* HERO HEADLINE */}
        <h1
          className="animate-reveal-up"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '96px',
            fontWeight: 300,
            fontStyle: 'italic',
            lineHeight: 0.90,
            letterSpacing: '-0.03em',
            color: '#FEF2E3',
            marginBottom: '24px',
            animationDelay: '0.1s',
          }}
        >
          {t('splash.headline')}
        </h1>

        {/* SUB-COPY */}
        <p
          className="animate-reveal-up"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            lineHeight: 1.65,
            color: 'rgba(254,242,227,0.65)',
            maxWidth: '280px',
            animationDelay: '0.25s',
          }}
        >
          Enter a world of curated excellence where every scoop is a masterpiece of artisanal heritage.
        </p>
      </div>

      {/* ── CTA BLOCK ── */}
      <div className="relative z-10 px-6 pb-10">
        {/* EST. 1960 + hairline */}
        <div className="flex items-center gap-3 mb-[18px]">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: 'rgba(254,242,227,0.40)',
              flexShrink: 0,
            }}
          >
            Est. 1960
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(254,242,227,0.10)' }} />
        </div>

        {/* CONTINUE BUTTON */}
        <button
          onClick={() => router.push('/onboarding/identity')}
          className="animate-reveal-up w-full transition-colors duration-[250ms]"
          style={{
            display: 'block',
            background: '#FEF2E3',
            color: '#40061E',
            padding: '22px 28px',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.30em',
            fontWeight: 600,
            textTransform: 'uppercase',
            textAlign: 'center',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 0,
            animationDelay: '0.4s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F5E6C8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FEF2E3'
          }}
        >
          {t('onboarding.continue')} →
        </button>

        {/* TAGLINE + DOT */}
        <div className="flex flex-col items-center gap-[10px] mt-5">
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: 'rgba(254,242,227,0.45)',
            }}
          >
            The Art of Indulgence
          </span>
          <div style={{ width: 4, height: 4, background: 'rgba(254,242,227,0.30)' }} />
        </div>
      </div>
    </main>
  )
}
