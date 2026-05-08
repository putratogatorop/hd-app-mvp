'use client'

/**
 * Onboarding — Screen 2: Identity
 * Mockup reference: design-system/mockups/onboarding-2-identity.html
 *
 * State: name → localStorage key `hd_onboarding_name`
 *
 * Phase 2 TODOs:
 *  - Persist name to profiles table after auth
 *  - Wire `?  WHY?` tooltip to an info sheet (non-blocking)
 *  - Progress indicator: step 1 of 3
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageCurrencySwitcher } from '@/components/LanguageCurrencySwitcher'

export default function OnboardingIdentityPage() {
  const router = useRouter()
  const { t, lang } = useTranslation()
  const [name, setName] = useState<string>('')

  const canContinue = name.trim().length >= 2

  const handleContinue = useCallback(() => {
    if (!canContinue) return
    try {
      localStorage.setItem('hd_onboarding_name', name.trim())
    } catch {
      // localStorage unavailable — continue anyway
    }
    router.push('/onboarding/preferences')
  }, [canContinue, name, router])

  return (
    <main
      className="flex flex-col min-h-dvh"
      style={{ background: '#FEF2E3' }}
    >
      {/* ── TOP NAV ── */}
      <nav
        className="flex justify-between items-center px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(43,43,43,0.12)' }}
      >
        {/* × Close → back to splash */}
        <button
          onClick={() => router.push('/onboarding')}
          aria-label="Close"
          className="flex items-center justify-center transition-opacity duration-200 hover:opacity-100"
          style={{
            width: 28,
            height: 28,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#2B2B2B',
            opacity: 0.50,
            fontFamily: 'var(--font-sans)',
            fontSize: '20px',
            lineHeight: 1,
            borderRadius: 0,
          }}
        >
          &#215;
        </button>

        {/* Wordmark */}
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

        {/* Right spacer + switcher */}
        <div className="flex items-center gap-2">
          <LanguageCurrencySwitcher tone="light" />
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div className="flex-1 flex flex-col px-6 pt-14 pb-36 relative overflow-hidden">

        {/* Stacked eyebrow: 01 / — / IDENTITY */}
        <div className="flex items-center gap-3 mb-10">
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.04em',
                color: 'rgba(43,43,43,0.35)',
              }}
            >
              01
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(43,43,43,0.22)',
              }}
            >
              —
            </span>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'rgba(43,43,43,0.45)',
              }}
            >
              {t('section.identity')}
            </span>
          </div>
          <div style={{ flex: 1, height: 1, background: 'rgba(43,43,43,0.12)' }} />
        </div>

        {/* HEADLINE */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '76px',
            fontWeight: 300,
            fontStyle: 'italic',
            lineHeight: 0.9,
            letterSpacing: '-0.025em',
            color: '#40061E',
            marginBottom: '56px',
          }}
        >
          {lang === 'id' ? (
            <>Ceritakan<br /><em style={{ fontStyle: 'italic', color: '#650A30' }}>nama Anda.</em></>
          ) : (
            <>Tell us your<br /><em style={{ fontStyle: 'italic', color: '#650A30' }}>name.</em></>
          )}
        </h1>

        {/* INPUT */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleContinue() }}
            placeholder={lang === 'id' ? 'Nama depan dan belakang' : 'First and last name'}
            autoComplete="name"
            autoFocus
            style={{
              display: 'block',
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(43,43,43,0.20)',
              padding: '0 0 14px',
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 400,
              color: '#2B2B2B',
              outline: 'none',
              borderRadius: 0,
              transition: 'border-color 300ms cubic-bezier(0.2,0.8,0.2,1)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#650A30' }}
            onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(43,43,43,0.20)' }}
          />
          {/* WHY? link */}
          <div className="mt-3">
            <button
              type="button"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'rgba(43,43,43,0.35)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: 0,
                borderRadius: 0,
                transition: 'color 200ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#650A30' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(43,43,43,0.35)' }}
            >
              <span
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: 0 }}
              >
                ?
              </span>
              {lang === 'id' ? 'Mengapa?' : 'Why?'}
            </button>
          </div>
        </div>

        {/* Decorative BG image — faint, bottom-right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hd-photos/DWizLL8k3Vq.jpg"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 40,
            right: -30,
            width: '160px',
            opacity: 0.06,
            pointerEvents: 'none',
            filter: 'grayscale(100%)',
          }}
        />

        {/* ── BOTTOM CTA — gradient fade + NEXT button flush bottom-right ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 0,
            background: 'linear-gradient(to top, #FEF2E3 60%, transparent)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}
        >
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: canContinue ? '#650A30' : 'rgba(101,10,48,0.35)',
              color: '#FEF2E3',
              border: 'none',
              padding: '20px 32px',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.28em',
              fontWeight: 600,
              textTransform: 'uppercase',
              cursor: canContinue ? 'pointer' : 'not-allowed',
              width: '280px',
              borderRadius: 0,
              transition: 'background 250ms cubic-bezier(0.2,0.8,0.2,1)',
            }}
            onMouseEnter={(e) => {
              if (canContinue) e.currentTarget.style.background = '#40061E'
            }}
            onMouseLeave={(e) => {
              if (canContinue) e.currentTarget.style.background = '#650A30'
            }}
          >
            <span>{t('cta.next')}</span>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>→</span>
          </button>
        </div>
      </div>
    </main>
  )
}
