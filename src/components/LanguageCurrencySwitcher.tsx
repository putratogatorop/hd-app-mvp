'use client'

/**
 * LanguageCurrencySwitcher
 *
 * Renders the EN · ID · USD typographic pill.
 * Active mode = burgundy underline + italic Cormorant Garamond
 * Inactive = dimmed Jost uppercase (11px, 0.18em letter-spacing)
 *
 * Props:
 *   tone?: 'light' | 'dark'  — or use data-tone="dark" on a parent
 *
 * Usage:
 *   <LanguageCurrencySwitcher />
 *   <LanguageCurrencySwitcher tone="dark" />
 */

import type { Mode } from '@/lib/i18n/context'
import { useLanguageCurrency, LanguageCurrencyProvider } from '@/lib/i18n/context'

// Re-export the provider so layout.tsx can import from one place
export { LanguageCurrencyProvider }

type Tone = 'light' | 'dark'

interface SwitcherProps {
  tone?: Tone
  className?: string
}

const MODES: Array<{ mode: Mode; label: string; title: string }> = [
  { mode: 'en-idr', label: 'EN',  title: 'English · IDR' },
  { mode: 'id-idr', label: 'ID',  title: 'Bahasa Indonesia · IDR' },
  { mode: 'en-usd', label: 'USD', title: 'English · USD' },
]

export function LanguageCurrencySwitcher({ tone = 'light', className = '' }: SwitcherProps) {
  const { mode, setMode } = useLanguageCurrency()

  const isDark = tone === 'dark'
  const textColor = isDark ? 'rgba(254,242,227,0.9)' : 'rgba(43,43,43,0.9)'

  return (
    <div
      className={`flex items-center justify-end gap-0 ${className}`}
      style={{ color: textColor }}
      aria-label="Language and currency selector"
    >
      {MODES.map(({ mode: m, label, title }, idx) => {
        const isActive = mode === m
        return (
          <span key={m} className="flex items-center">
            {idx > 0 && (
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '9px',
                  opacity: 0.20,
                  padding: '0 2px',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                ·
              </span>
            )}
            <button
              onClick={() => setMode(m)}
              title={title}
              aria-pressed={isActive}
              className="relative transition-opacity duration-200"
              style={
                isActive
                  ? {
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: '12px',
                      letterSpacing: '0.06em',
                      textTransform: 'none',
                      opacity: 1,
                      background: 'none',
                      border: 'none',
                      padding: '0 3px',
                      cursor: 'pointer',
                      lineHeight: 1,
                      color: 'inherit',
                      // burgundy underline for active state
                      textDecoration: isDark ? 'underline' : 'none',
                      textDecorationColor: isDark ? 'rgba(254,242,227,0.7)' : '#650A30',
                      textUnderlineOffset: '3px',
                    }
                  : {
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      fontSize: '11px',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      opacity: 0.35,
                      background: 'none',
                      border: 'none',
                      padding: '0 3px',
                      cursor: 'pointer',
                      lineHeight: 1,
                      color: 'inherit',
                    }
              }
            >
              {label}
              {isActive && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: isDark ? 'rgba(254,242,227,0.7)' : '#650A30',
                    display: 'block',
                  }}
                />
              )}
            </button>
          </span>
        )
      })}
    </div>
  )
}
