'use client'

/**
 * Onboarding — Screen 3: Preferences (Flavour Selection)
 * Mockup reference: design-system/mockups/onboarding-3-preferences.html
 *
 * State:
 *   - Selected flavour IDs → localStorage `hd_onboarding_flavors` (JSON array, max 3)
 *
 * Phase 2 TODOs:
 *  - Replace hardcoded flavour list with live data from Supabase menu table
 *  - Persist selections to user_preferences table after auth
 *  - Progress indicator: step 2 of 3
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/context'
import { useCurrency } from '@/lib/i18n/context'

// ── HARDCODED FLAVOUR DATA (replace with DB query in Phase 2) ──
interface Flavour {
  id: string
  nameEn: string
  nameId: string
  photo: string
  priceIdr: number
}

const FLAVOURS: Flavour[] = [
  { id: 'vanilla-bean',       nameEn: 'Vanilla Bean',       nameId: 'Vanilla Bean',       photo: '/hd-photos/DWizLL8k3Vq.jpg', priceIdr: 65000 },
  { id: 'belgian-chocolate',  nameEn: 'Belgian Chocolate',  nameId: 'Cokelat Belgia',      photo: '/hd-photos/DW5RVLkkwA6.jpg', priceIdr: 68000 },
  { id: 'pistachio-cream',    nameEn: 'Pistachio & Cream',  nameId: 'Pistachio & Krim',    photo: '/hd-photos/DWffta7k4Ei.jpg', priceIdr: 72000 },
  { id: 'raspberry-sorbet',   nameEn: 'Raspberry Sorbet',   nameId: 'Sorbet Raspberry',    photo: '/hd-photos/DWI-Kpok62S.jpg', priceIdr: 65000 },
  { id: 'salted-caramel',     nameEn: 'Salted Caramel',     nameId: 'Karamel Garam',       photo: '/hd-photos/DV7gQA2k4-5.jpg', priceIdr: 68000 },
  { id: 'matcha-green-tea',   nameEn: 'Matcha Green Tea',   nameId: 'Teh Hijau Matcha',    photo: '/hd-photos/DWp1UAiE4nR.jpg', priceIdr: 70000 },
]

export default function OnboardingPreferencesPage() {
  const router = useRouter()
  const { t, lang } = useTranslation()
  const { formatPrice } = useCurrency()

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const canConfirm = selectedIds.length === 3

  const handleCardClick = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return
    try {
      localStorage.setItem('hd_onboarding_flavors', JSON.stringify(selectedIds))
    } catch {
      // localStorage unavailable
    }
    router.push('/onboarding/welcome')
  }, [canConfirm, selectedIds, router])

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
        <button
          onClick={() => router.push('/onboarding/identity')}
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
        <div style={{ width: 28 }} />
      </nav>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: '140px' }}>

        {/* Header section */}
        <div className="px-6 pt-10 pb-7">
          {/* Stacked eyebrow: 02 / — / PREFERENCES */}
          <div className="flex items-center gap-3 mb-7">
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                  color: 'rgba(43,43,43,0.35)',
                }}
              >
                02
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
                {t('section.preferences')}
              </span>
            </div>
            <div style={{ flex: 1, height: 1, background: 'rgba(43,43,43,0.12)' }} />
          </div>

          {/* HEADLINE */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '52px',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 0.92,
              letterSpacing: '-0.02em',
              color: '#40061E',
              marginBottom: '16px',
            }}
          >
            {lang === 'id' ? (
              <>Pilih tiga cita rasa<br /><em style={{ color: '#650A30' }}>yang Anda sukai.</em></>
            ) : (
              <>Pick three flavours<br /><em style={{ color: '#650A30' }}>you love.</em></>
            )}
          </h1>

          {/* Subhead */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'rgba(43,43,43,0.55)',
              maxWidth: '300px',
            }}
          >
            {lang === 'id'
              ? 'Indulgensi itu personal. Pilih favorit Anda untuk menyesuaikan pengalaman.'
              : 'Indulgence is personal. Select your favorites to tailor your experience.'}
          </p>
        </div>

        {/* ── FLAVOUR GRID ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1px',
            background: 'rgba(43,43,43,0.08)',
            borderTop: '1px solid rgba(43,43,43,0.08)',
            borderBottom: '1px solid rgba(43,43,43,0.08)',
          }}
        >
          {FLAVOURS.map((flavour) => {
            const selIdx = selectedIds.indexOf(flavour.id)
            const isSelected = selIdx !== -1
            const badge = isSelected ? String(selIdx + 1).padStart(2, '0') : null

            return (
              <button
                key={flavour.id}
                onClick={() => handleCardClick(flavour.id)}
                style={{
                  background: '#FEF2E3',
                  cursor: 'pointer',
                  position: 'relative',
                  border: 'none',
                  outline: isSelected ? '1px solid #B8922A' : 'none',
                  outlineOffset: '-1px',
                  padding: 0,
                  textAlign: 'left',
                  borderRadius: 0,
                  transition: 'background 250ms cubic-bezier(0.2,0.8,0.2,1)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#FAE8D2'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FEF2E3'
                }}
              >
                {/* Selection badge */}
                {badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 5,
                      width: 22,
                      height: 22,
                      background: '#B8922A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      letterSpacing: '0.04em',
                      color: 'white',
                      fontWeight: 500,
                      borderRadius: 0,
                    }}
                  >
                    {badge}
                  </div>
                )}

                {/* Card image */}
                <div
                  style={{
                    aspectRatio: '1 / 1',
                    overflow: 'hidden',
                    background: '#EDE0CE',
                    position: 'relative',
                  }}
                >
                  <Image
                    src={flavour.photo}
                    alt={flavour.nameEn}
                    fill
                    className="object-cover object-center"
                    style={{
                      filter: isSelected ? 'grayscale(0%)' : 'grayscale(20%)',
                      transition: 'transform 700ms cubic-bezier(0.2,0.8,0.2,1), filter 700ms',
                    }}
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                </div>

                {/* Card body */}
                <div
                  style={{
                    padding: '10px 12px 12px',
                    borderTop: '1px solid rgba(43,43,43,0.08)',
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '14px',
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                      color: '#2B2B2B',
                      lineHeight: 1.2,
                    }}
                  >
                    {lang === 'id' ? flavour.nameId : flavour.nameEn}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'rgba(43,43,43,0.45)',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {formatPrice(flavour.priceIdr)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        {/* end grid */}
      </div>
      {/* end scroll */}

      {/* ── STICKY BOTTOM CTA ── */}
      <div
        className="sticky bottom-0 z-20 flex-shrink-0"
        style={{ background: '#FEF2E3', borderTop: '1px solid rgba(43,43,43,0.12)' }}
      >
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            background: canConfirm ? '#650A30' : 'rgba(101,10,48,0.35)',
            color: '#FEF2E3',
            border: 'none',
            padding: '18px 24px',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.28em',
            fontWeight: 600,
            textTransform: 'uppercase',
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            borderRadius: 0,
            transition: 'background 250ms cubic-bezier(0.2,0.8,0.2,1)',
          }}
          onMouseEnter={(e) => {
            if (canConfirm) e.currentTarget.style.background = '#40061E'
          }}
          onMouseLeave={(e) => {
            if (canConfirm) e.currentTarget.style.background = '#650A30'
          }}
        >
          {lang === 'id' ? 'Konfirmasi Pilihan' : 'Confirm Selection'} →
        </button>
      </div>
    </main>
  )
}
