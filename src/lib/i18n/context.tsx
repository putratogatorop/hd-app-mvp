'use client'

/**
 * HD App Language & Currency Context
 * Modes: 'en-idr' | 'en-usd' | 'id-idr'
 * Persisted in localStorage as 'hd_lang' and 'hd_currency'
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { type Lang, translate, type TranslationKey } from './translations'
import { type Currency, formatPrice as formatPriceRaw } from './currency'

export type Mode = 'en-idr' | 'en-usd' | 'id-idr'

interface LanguageCurrencyState {
  lang: Lang
  currency: Currency
  mode: Mode
  setMode: (mode: Mode) => void
}

const LanguageCurrencyContext = createContext<LanguageCurrencyState | null>(null)

function deriveMode(lang: Lang, currency: Currency): Mode {
  if (lang === 'id') return 'id-idr'
  if (currency === 'USD') return 'en-usd'
  return 'en-idr'
}

function modeToState(mode: Mode): { lang: Lang; currency: Currency } {
  if (mode === 'en-usd') return { lang: 'en', currency: 'USD' }
  if (mode === 'id-idr') return { lang: 'id', currency: 'IDR' }
  return { lang: 'en', currency: 'IDR' }
}

export function LanguageCurrencyProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const [currency, setCurrency] = useState<Currency>('IDR')

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('hd_lang') as Lang | null
      const savedCurr = localStorage.getItem('hd_currency') as Currency | null
      if (savedLang === 'en' || savedLang === 'id') setLang(savedLang)
      if (savedCurr === 'IDR' || savedCurr === 'USD') setCurrency(savedCurr)
    } catch {
      // localStorage not available (SSR guard)
    }
  }, [])

  const setMode = useCallback((mode: Mode) => {
    const { lang: l, currency: c } = modeToState(mode)
    setLang(l)
    setCurrency(c)
    try {
      localStorage.setItem('hd_lang', l)
      localStorage.setItem('hd_currency', c)
    } catch {
      // ignore
    }
  }, [])

  const mode = deriveMode(lang, currency)

  return (
    <LanguageCurrencyContext.Provider value={{ lang, currency, mode, setMode }}>
      {children}
    </LanguageCurrencyContext.Provider>
  )
}

function useLanguageCurrency(): LanguageCurrencyState {
  const ctx = useContext(LanguageCurrencyContext)
  if (!ctx) {
    throw new Error('useLanguageCurrency must be used within LanguageCurrencyProvider')
  }
  return ctx
}

export { useLanguageCurrency }

/**
 * useTranslation — returns a `t(key)` function bound to the current language.
 *
 * Usage:
 *   const { t } = useTranslation()
 *   <span>{t('nav.home')}</span>
 */
export function useTranslation() {
  const { lang } = useLanguageCurrency()
  const t = useCallback(
    (key: string) => translate(key, lang),
    [lang]
  )
  return { t, lang }
}

/**
 * useCurrency — returns a `formatPrice(idr)` function bound to the current currency.
 *
 * Usage:
 *   const { formatPrice } = useCurrency()
 *   <span>{formatPrice(75000)}</span>
 */
export function useCurrency() {
  const { currency } = useLanguageCurrency()
  const formatPrice = useCallback(
    (idr: number) => formatPriceRaw(idr, currency),
    [currency]
  )
  return { formatPrice, currency }
}
