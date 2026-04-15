import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTransactionalMetrics, requireStaff } from '@/lib/dashboard/real-metrics'
import AnalyticsTabs from '@/components/AnalyticsTabs'
import FilterBar from '@/components/analytics/FilterBar'
import { fetchStoresForFilter } from '@/lib/dashboard/semantic'
import { parseFilterSearchParams } from '@/lib/dashboard/filter-url'
import { DASH_COLORS } from '@/lib/dashboard/theme'

export const dynamic = 'force-dynamic'

function rupiah(n: number): string {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${Math.round(n)}`
}

const MODE_LABEL: Record<string, string> = {
  pickup: 'Pickup',
  delivery: 'Delivery',
  dinein: 'Dine-in',
  unknown: '—',
}

export default async function TransactionalAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { filters } = parseFilterSearchParams(sp)

  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) redirect('/login')
  if (role !== 'staff' && role !== 'admin') redirect('/home')

  const [m, stores] = await Promise.all([
    getTransactionalMetrics(supabase, filters),
    fetchStoresForFilter(supabase),
  ])
  const maxOrders = Math.max(1, ...m.dailyLast30.map((d) => d.orders))
  const modeTotal = m.modeBreakdown.reduce((s, r) => s + r.count, 0) || 1
  const payTotal = m.paymentBreakdown.reduce((s, r) => s + r.count, 0) || 1

  return (
    <div className="min-h-screen" style={{ backgroundColor: DASH_COLORS.bg, color: DASH_COLORS.textPrimary }}>
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(28,8,16,0.88)',
          borderBottom: `1px solid ${DASH_COLORS.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-0">
          <div>
            <span className="eyebrow" style={{ color: DASH_COLORS.gold }}>HD Analytics</span>
            <h1 className="font-display text-[2rem] tracking-editorial mt-1" style={{ color: DASH_COLORS.textPrimary }}>
              Transactional <span className="italic">orders</span>
            </h1>
            <p className="text-[0.75rem] mt-1" style={{ color: DASH_COLORS.textMuted }}>
              Live data · self-orders only · last 30 days
            </p>
          </div>
          <div className="mt-6">
            <AnalyticsTabs />
          </div>
          <FilterBar stores={stores} lockedGift />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* KPIs */}
        <section className="mb-10">
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DASH_COLORS.textMuted }}>01</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">
              Key <span className="italic">measures</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Orders', value: m.ordersLast30.toLocaleString('id-ID') },
              { label: 'Revenue', value: rupiah(m.revenueLast30) },
              { label: 'AOV', value: rupiah(m.aov) },
              { label: 'Repeat rate', value: `${(m.repeatRate * 100).toFixed(1)}%` },
            ].map((c) => (
              <div
                key={c.label}
                className="p-5"
                style={{
                  backgroundColor: DASH_COLORS.card,
                  border: `1px solid ${DASH_COLORS.border}`,
                }}
              >
                <p className="eyebrow" style={{ color: DASH_COLORS.textMuted }}>{c.label}</p>
                <p className="numeral text-[1.8rem] mt-3">{c.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Daily */}
        <section className="mb-10">
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DASH_COLORS.textMuted }}>02</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">
              Daily <span className="italic">orders</span>
            </h2>
          </div>
          <div className="p-6" style={{ backgroundColor: DASH_COLORS.card, border: `1px solid ${DASH_COLORS.border}` }}>
            <div className="flex items-end gap-[2px] h-44">
              {m.dailyLast30.map((d) => {
                const h = (d.orders / maxOrders) * 100
                return (
                  <div
                    key={d.date}
                    title={`${d.date} — ${d.orders} orders · ${rupiah(d.revenue)}`}
                    className="flex-1 min-h-[2px] transition-all hover:opacity-70"
                    style={{
                      height: `${Math.max(2, h)}%`,
                      background: `linear-gradient(to top, ${DASH_COLORS.burgundy}, ${DASH_COLORS.burgundyLight})`,
                    }}
                  />
                )
              })}
            </div>
            <div className="flex justify-between numeral text-[0.65rem] mt-3" style={{ color: DASH_COLORS.textMuted }}>
              <span>{m.dailyLast30[0]?.date}</span>
              <span>{m.dailyLast30[m.dailyLast30.length - 1]?.date}</span>
            </div>
          </div>
        </section>

        {/* Mode + Payment */}
        <section className="grid lg:grid-cols-2 gap-6 mb-10">
          <div>
            <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
              <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DASH_COLORS.textMuted }}>03</span>
              <h2 className="font-display text-[1.3rem] tracking-editorial">
                Order <span className="italic">mode</span>
              </h2>
            </div>
            <div className="p-6 space-y-4" style={{ backgroundColor: DASH_COLORS.card, border: `1px solid ${DASH_COLORS.border}` }}>
              {m.modeBreakdown.map((r) => {
                const pct = (r.count / modeTotal) * 100
                return (
                  <div key={r.mode}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display text-[0.95rem]" style={{ color: DASH_COLORS.textPrimary }}>
                        {MODE_LABEL[r.mode] ?? r.mode}
                      </span>
                      <span className="numeral text-[0.8rem]">
                        <span style={{ color: DASH_COLORS.textPrimary }}>{r.count}</span>
                        <span className="ml-3" style={{ color: DASH_COLORS.textMuted }}>{pct.toFixed(0)}%</span>
                        <span className="ml-3" style={{ color: DASH_COLORS.gold }}>{rupiah(r.revenue)}</span>
                      </span>
                    </div>
                    <div className="h-[3px]" style={{ backgroundColor: DASH_COLORS.divider }}>
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(to right, ${DASH_COLORS.burgundy}, ${DASH_COLORS.gold})`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
              <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DASH_COLORS.textMuted }}>04</span>
              <h2 className="font-display text-[1.3rem] tracking-editorial">
                Payment
              </h2>
            </div>
            <div className="p-6 space-y-4" style={{ backgroundColor: DASH_COLORS.card, border: `1px solid ${DASH_COLORS.border}` }}>
              {m.paymentBreakdown.map((r) => {
                const pct = (r.count / payTotal) * 100
                return (
                  <div key={r.method}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="eyebrow" style={{ color: DASH_COLORS.textSecondary }}>{r.method}</span>
                      <span className="numeral text-[0.8rem]">
                        <span style={{ color: DASH_COLORS.textPrimary }}>{r.count}</span>
                        <span className="ml-3" style={{ color: DASH_COLORS.textMuted }}>{pct.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div className="h-[3px]" style={{ backgroundColor: DASH_COLORS.divider }}>
                      <div
                        className="h-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: DASH_COLORS.gold }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Top items */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DASH_COLORS.textMuted }}>05</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">
              Top <span className="italic">items</span>
            </h2>
          </div>
          <div className="p-5 overflow-x-auto" style={{ backgroundColor: DASH_COLORS.card, border: `1px solid ${DASH_COLORS.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
                  <th className="text-left py-3 px-3 eyebrow font-normal w-8" style={{ color: DASH_COLORS.textMuted }}>#</th>
                  <th className="text-left py-3 px-3 eyebrow font-normal" style={{ color: DASH_COLORS.textMuted }}>Item</th>
                  <th className="text-right py-3 px-3 eyebrow font-normal" style={{ color: DASH_COLORS.textMuted }}>Qty</th>
                  <th className="text-right py-3 px-3 eyebrow font-normal" style={{ color: DASH_COLORS.textMuted }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {m.topItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center font-display italic" style={{ color: DASH_COLORS.textMuted }}>
                      No orders in window.
                    </td>
                  </tr>
                ) : (
                  m.topItems.map((t, i) => (
                    <tr key={t.name} style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
                      <td className="py-3 px-3 text-center numeral text-[0.8rem]" style={{ color: DASH_COLORS.textMuted }}>
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3 font-display" style={{ color: DASH_COLORS.textPrimary }}>{t.name}</td>
                      <td className="py-3 px-3 text-right numeral" style={{ color: DASH_COLORS.textSecondary }}>{t.qty}</td>
                      <td className="py-3 px-3 text-right numeral" style={{ color: DASH_COLORS.gold }}>{rupiah(t.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
