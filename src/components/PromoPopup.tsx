'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowUpRight } from 'lucide-react'

const STORAGE_KEY = 'hd-promo-seen'

export default function PromoPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
      sessionStorage.setItem(STORAGE_KEY, 'true')
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6 bg-hd-ink/70 backdrop-blur-sm animate-[revealFade_0.4s_ease-out]"
      onClick={() => setVisible(false)}
    >
      <div
        className="relative w-full max-w-[360px] bg-hd-burgundy-dark text-hd-cream border border-hd-cream/20 overflow-hidden animate-[revealUp_0.6s_cubic-bezier(0.2,0.8,0.2,1)_both]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="texture-grain absolute inset-0 opacity-30" aria-hidden />
        <div
          className="absolute inset-0 opacity-60"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(184,146,42,0.3), transparent 60%)',
          }}
        />

        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 z-10 w-8 h-8 border border-hd-cream/30 text-hd-cream flex items-center justify-center hover:bg-hd-cream hover:text-hd-ink transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        <div className="relative px-7 pt-12 pb-8">
          <div className="flex items-center justify-between border-b border-hd-cream/25 pb-3">
            <span className="eyebrow text-hd-cream/80">New · Season</span>
            <span className="numeral text-[0.6rem] text-hd-cream/70 tracking-widest">
              N° 01
            </span>
          </div>

          <h2 className="mt-8 font-display text-[2.25rem] leading-[0.95] tracking-editorial">
            A small<br />
            <span className="italic">occasion.</span>
          </h2>

          <p className="mt-4 text-[0.88rem] leading-relaxed text-hd-cream/75 max-w-xs">
            This season&apos;s shortlist is ready — new flavours, limited runs, and the classics you return to.
          </p>

          <Link
            href="/menu"
            onClick={() => setVisible(false)}
            className="mt-8 flex items-center justify-between h-12 px-5 bg-hd-cream text-hd-ink border border-hd-cream hover:bg-hd-gold-light transition-colors group"
          >
            <span className="eyebrow">Browse the menu</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
