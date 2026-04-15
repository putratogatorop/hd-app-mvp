'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { parseFilterSearchParams } from '@/lib/dashboard/filter-url'

interface DrillRow {
  order_id: string
  created_at: string
  status: string
  channel: string | null
  store_name: string | null
  customer_name: string | null
  customer_email: string | null
  tier: string | null
  net_revenue: number
  voucher_code: string | null
  is_gift: boolean
}

export interface DrillSpec {
  title: string
  isoDow?: number
  hour?: number
  product?: string
}

interface Props {
  open: boolean
  onClose: () => void
  spec: DrillSpec | null
}

function rupiah(n: number): string {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${Math.round(n)}`
}

export default function DrillModal({ open, onClose, spec }: Props) {
  const sp = useSearchParams()
  const [rows, setRows] = useState<DrillRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !spec) return
    const { filters } = parseFilterSearchParams(Object.fromEntries(sp.entries()))
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/analytics/drill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters,
        isoDow: spec.isoDow,
        hour: spec.hour,
        product: spec.product,
        limit: 200,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.error) setError(String(data.error))
        else {
          setRows(data.rows ?? [])
          setTotal(Number(data.total ?? 0))
        }
      })
      .catch((e) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, spec, sp])

  if (!open || !spec) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#2A0F1C] border border-[#B8922A]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3d1825]">
          <div>
            <p className="eyebrow text-[#B8922A]">Drill-down</p>
            <h3 className="font-display text-[1.25rem] text-[#FEF2E3]">{spec.title}</h3>
            <p className="text-[11px] text-[#b8a89a] mt-0.5">
              {loading ? 'Loading…' : `${rows.length} of ${total} orders`}
              {rows.length > 0 && total > rows.length && ' (showing first 200)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#b8a89a] hover:bg-[#3d1825] hover:text-[#FEF2E3]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-6 text-sm text-red-400">Error: {error}</div>
          )}
          {!error && rows.length === 0 && !loading && (
            <div className="p-8 text-center">
              <p className="font-display italic text-[#b8a89a]">No orders match this slice.</p>
            </div>
          )}
          {rows.length > 0 && (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#2A0F1C]">
                <tr className="border-b border-[#3d1825]">
                  <th className="text-left py-2 px-4 text-[#b8a89a] font-medium">When</th>
                  <th className="text-left py-2 px-3 text-[#b8a89a] font-medium">Customer</th>
                  <th className="text-left py-2 px-3 text-[#b8a89a] font-medium">Store</th>
                  <th className="text-left py-2 px-3 text-[#b8a89a] font-medium">Channel</th>
                  <th className="text-left py-2 px-3 text-[#b8a89a] font-medium">Tier</th>
                  <th className="text-right py-2 px-4 text-[#b8a89a] font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.order_id} className="border-b border-[#3d1825]/50 hover:bg-[#3d1825]/30">
                    <td className="py-2 px-4 text-[#b8a89a] font-mono text-[10px] whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 text-[#FEF2E3]">
                      {r.customer_name ?? '—'}
                      {r.is_gift && <span className="ml-1 text-[9px] px-1 rounded bg-[#B8922A]/20 text-[#B8922A]">GIFT</span>}
                    </td>
                    <td className="py-2 px-3 text-[#b8a89a]">{r.store_name ?? '—'}</td>
                    <td className="py-2 px-3 text-[#b8a89a]">{r.channel ?? '—'}</td>
                    <td className="py-2 px-3 text-[#b8a89a] capitalize">{r.tier ?? '—'}</td>
                    <td className="py-2 px-4 text-right text-[#FEF2E3] font-medium tabular-nums whitespace-nowrap">
                      {rupiah(Number(r.net_revenue))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
