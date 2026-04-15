'use client'

import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Channel, Tier } from '@/lib/dashboard/semantic'
import {
  encodeFilterPatch,
  type PeriodOrCustom,
} from '@/lib/dashboard/filter-url'

export interface FilterBarStore {
  id: string
  name: string
}

interface Props {
  stores: FilterBarStore[]
  /** Which filter controls to show. Defaults to all. */
  show?: {
    period?: boolean
    stores?: boolean
    channels?: boolean
    tiers?: boolean
    gift?: boolean
  }
  /** Hide the "Gift toggle" on pages that are inherently gift/non-gift (gift, transactional). */
  lockedGift?: boolean
}

const CHANNELS: Channel[] = ['pickup', 'delivery', 'dinein']
const CHANNEL_LABEL: Record<Channel, string> = { pickup: 'Pickup', delivery: 'Delivery', dinein: 'Dine-in' }
const TIERS: Tier[] = ['silver', 'gold', 'platinum']
const TIER_LABEL: Record<Tier, string> = { silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }
const PERIODS: PeriodOrCustom[] = ['7d', '30d', '90d', 'custom']

export default function FilterBar({ stores, show, lockedGift }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [pending, startTransition] = useTransition()

  // ── Derive current state from URL ────────────────────────────────
  const period: PeriodOrCustom = useMemo(() => {
    const p = sp.get('period')
    if (sp.get('from') && sp.get('to')) return 'custom'
    if (p === '7d' || p === '30d' || p === '90d') return p
    return '30d'
  }, [sp])

  const fromDate = sp.get('from') ?? ''
  const toDate = sp.get('to') ?? ''
  const storeIds = useMemo(
    () => (sp.get('stores') ?? '').split(',').filter(Boolean),
    [sp],
  )
  const channels = useMemo(
    () => ((sp.get('channels') ?? '').split(',').filter(Boolean) as Channel[])
      .filter((c) => CHANNELS.includes(c)),
    [sp],
  )
  const tiers = useMemo(
    () => ((sp.get('tiers') ?? '').split(',').filter(Boolean) as Tier[])
      .filter((t) => TIERS.includes(t)),
    [sp],
  )
  const giftVal = sp.get('gift')
  const gift: boolean | undefined =
    giftVal === 'true' ? true : giftVal === 'false' ? false : undefined

  // ── Push patch to URL ────────────────────────────────────────────
  const push = useCallback(
    (patch: Parameters<typeof encodeFilterPatch>[1]) => {
      const next = encodeFilterPatch(new URLSearchParams(sp.toString()), patch)
      const qs = next.toString()
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname)
      })
    },
    [sp, pathname, router],
  )

  const setPeriod = (p: PeriodOrCustom) => {
    if (p === 'custom') {
      // seed with current derived dates so the date inputs have a value
      const today = new Date().toISOString().slice(0, 10)
      const d30 = new Date()
      d30.setDate(d30.getDate() - 30)
      push({
        period: 'custom',
        from: fromDate || d30.toISOString().slice(0, 10),
        to: toDate || today,
      })
    } else {
      push({ period: p, from: '', to: '' })
    }
  }

  const toggleIn = <T extends string>(list: T[], val: T): T[] =>
    list.includes(val) ? list.filter((x) => x !== val) : [...list, val]

  const sv = show ?? {}
  const showPeriod = sv.period !== false
  const showStores = sv.stores !== false && stores.length > 0
  const showChannels = sv.channels !== false
  const showTiers = sv.tiers !== false
  const showGift = sv.gift !== false && !lockedGift

  const anyCustom =
    storeIds.length > 0 || channels.length > 0 || tiers.length > 0 || gift !== undefined
  const canReset = period !== '30d' || anyCustom

  return (
    <div
      className={`flex flex-wrap items-center gap-2 py-2 ${pending ? 'opacity-70' : ''}`}
      aria-busy={pending}
    >
      {/* ── Period pills ── */}
      {showPeriod && (
        <div className="inline-flex items-center gap-1 rounded-full bg-[#2A0F1C] border border-[#3d1825] p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                period === p
                  ? 'bg-[#650A30] text-[#FEF2E3] shadow'
                  : 'text-[#b8a89a] hover:text-[#FEF2E3]'
              }`}
            >
              {p === 'custom' ? 'Custom' : p}
            </button>
          ))}
        </div>
      )}

      {/* ── Custom date range ── */}
      {showPeriod && period === 'custom' && (
        <div className="inline-flex items-center gap-1 text-[11px] text-[#b8a89a]">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => push({ from: e.target.value })}
            className="bg-[#2A0F1C] border border-[#3d1825] rounded px-2 py-1 text-[#FEF2E3] text-[11px]"
          />
          <span>→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => push({ to: e.target.value })}
            className="bg-[#2A0F1C] border border-[#3d1825] rounded px-2 py-1 text-[#FEF2E3] text-[11px]"
          />
        </div>
      )}

      {showStores && (
        <MultiSelect
          label="Stores"
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
          selected={storeIds}
          onChange={(next) => push({ stores: next })}
        />
      )}
      {showChannels && (
        <MultiSelect
          label="Channel"
          options={CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))}
          selected={channels}
          onChange={(next) => push({ channels: next as Channel[] })}
        />
      )}
      {showTiers && (
        <MultiSelect
          label="Tier"
          options={TIERS.map((t) => ({ value: t, label: TIER_LABEL[t] }))}
          selected={tiers}
          onChange={(next) => push({ tiers: next as Tier[] })}
        />
      )}

      {showGift && (
        <div className="inline-flex items-center gap-1 rounded-full bg-[#2A0F1C] border border-[#3d1825] p-0.5">
          {([
            { v: undefined, label: 'All' },
            { v: false, label: 'Self' },
            { v: true, label: 'Gift' },
          ] as const).map((opt) => (
            <button
              key={String(opt.v)}
              onClick={() => push({ gift: opt.v as boolean | undefined })}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                gift === opt.v
                  ? 'bg-[#650A30] text-[#FEF2E3]'
                  : 'text-[#b8a89a] hover:text-[#FEF2E3]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {canReset && (
        <button
          onClick={() => router.push(pathname)}
          className="text-[11px] text-[#b8a89a] hover:text-[#FEF2E3] underline underline-offset-2 ml-auto"
        >
          Reset
        </button>
      )}
    </div>
  )
}

// ── Multi-select dropdown ────────────────────────────────────────────
interface Option { value: string; label: string }
function MultiSelect({
  label, options, selected, onChange,
}: {
  label: string
  options: Option[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const summary =
    selected.length === 0
      ? `All ${label.toLowerCase()}`
      : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
      : `${selected.length} ${label.toLowerCase()}`

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
          selected.length > 0
            ? 'bg-[#650A30] text-[#FEF2E3] border-[#B8922A]/40'
            : 'bg-[#2A0F1C] text-[#b8a89a] border-[#3d1825] hover:text-[#FEF2E3]'
        }`}
      >
        {label}: {summary} <span className="ml-1 opacity-60">▾</span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute z-40 mt-1 min-w-[200px] max-h-[280px] overflow-y-auto bg-[#2A0F1C] border border-[#3d1825] rounded-lg shadow-xl p-1">
            {options.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-[#b8a89a]">No options</div>
            )}
            {options.map((o) => {
              const active = selected.includes(o.value)
              return (
                <button
                  key={o.value}
                  onClick={() => toggle(o.value)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded text-[11px] transition-colors ${
                    active ? 'bg-[#650A30] text-[#FEF2E3]' : 'text-[#b8a89a] hover:bg-[#3d1825] hover:text-[#FEF2E3]'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                      active ? 'bg-[#B8922A] border-[#B8922A] text-[#1C0810]' : 'border-[#3d1825]'
                    }`}
                  >
                    {active ? '✓' : ''}
                  </span>
                  <span className="truncate">{o.label}</span>
                </button>
              )
            })}
            {selected.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="w-full text-left px-3 py-1.5 text-[10px] text-[#b8a89a] hover:text-[#FEF2E3] border-t border-[#3d1825] mt-1 pt-2"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
