'use client'

import { useState, useEffect, useRef } from 'react'
import { GLOSSARY } from './glossary'

export function InfoTip({ term, className }: { term: keyof typeof GLOSSARY; className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const text = GLOSSARY[term]

  return (
    <span ref={ref} className={`relative inline-flex ${className ?? ''}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        aria-label={`What is ${term}?`}
        className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-semibold rounded-full transition-colors"
        style={{
          border: '1px solid rgba(184,146,42,0.35)',
          color: open ? '#1C0810' : 'rgba(254,242,227,0.55)',
          backgroundColor: open ? '#B8922A' : 'transparent',
        }}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full mt-1.5 z-50 w-64 p-2.5 text-[11px] leading-snug rounded shadow-lg"
          style={{
            backgroundColor: '#1C0810',
            border: '1px solid rgba(184,146,42,0.4)',
            color: '#FEF2E3',
          }}
        >
          {text}
        </span>
      )}
    </span>
  )
}

export function HowToRead({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        backgroundColor: 'rgba(184,146,42,0.06)',
        border: '1px solid rgba(184,146,42,0.25)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="text-xs tracking-wider uppercase font-semibold" style={{ color: '#B8922A' }}>
          {open ? '▾' : '▸'} {title}
        </span>
        <span className="text-[10px]" style={{ color: 'rgba(254,242,227,0.45)' }}>
          {open ? 'hide' : 'click to expand'}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm leading-relaxed" style={{ color: '#FEF2E3' }}>
          {children}
        </div>
      )}
    </div>
  )
}
