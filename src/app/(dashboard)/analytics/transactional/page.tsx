import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTransactionalMetrics, requireStaff } from '@/lib/dashboard/real-metrics'
import AnalyticsTabs from '@/components/AnalyticsTabs'

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

export default async function TransactionalAnalyticsPage() {
  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) redirect('/login')
  if (role !== 'staff' && role !== 'admin') redirect('/home')

  const m = await getTransactionalMetrics(supabase)
  const maxOrders = Math.max(1, ...m.dailyLast30.map((d) => d.orders))
  const modeTotal = m.modeBreakdown.reduce((s, r) => s + r.count, 0) || 1
  const payTotal = m.paymentBreakdown.reduce((s, r) => s + r.count, 0) || 1

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-[#2A2A35] bg-[#0F0F12]/85">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <h1 className="text-xl font-bold tracking-tight">
            HD Analytics <span className="text-[#B8922A]">&#10022;</span>
          </h1>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            Transactional · self-orders only · last 30 days
          </p>
          <div className="mt-3">
            <AnalyticsTabs />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Orders', value: m.ordersLast30.toLocaleString('id-ID') },
            { label: 'Revenue', value: rupiah(m.revenueLast30) },
            { label: 'AOV', value: rupiah(m.aov) },
            { label: 'Repeat rate', value: `${(m.repeatRate * 100).toFixed(1)}%` },
          ].map((c) => (
            <div key={c.label} className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider">{c.label}</p>
              <p className="text-2xl font-bold mt-2 tabular-nums">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Daily orders */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4">Orders — daily</h2>
          <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
            <div className="flex items-end gap-[2px] h-40">
              {m.dailyLast30.map((d) => {
                const h = (d.orders / maxOrders) * 100
                return (
                  <div
                    key={d.date}
                    title={`${d.date} — ${d.orders} orders · ${rupiah(d.revenue)}`}
                    className="flex-1 bg-gradient-to-t from-[#650A30] to-[#8B1A45] rounded-t-sm min-h-[2px] hover:opacity-80 transition-all"
                    style={{ height: `${Math.max(2, h)}%` }}
                  />
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-2">
              <span>{m.dailyLast30[0]?.date}</span>
              <span>{m.dailyLast30[m.dailyLast30.length - 1]?.date}</span>
            </div>
          </div>
        </section>

        {/* Mode + Payment */}
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <section className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
            <h2 className="text-sm font-bold mb-4">Order mode</h2>
            <div className="space-y-3">
              {m.modeBreakdown.map((r) => {
                const pct = (r.count / modeTotal) * 100
                return (
                  <div key={r.mode}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#9CA3AF]">{MODE_LABEL[r.mode] ?? r.mode}</span>
                      <span className="tabular-nums">
                        <span className="font-semibold">{r.count}</span>
                        <span className="text-[#9CA3AF] ml-2">{pct.toFixed(0)}%</span>
                        <span className="text-[#D4AC3A] ml-2">{rupiah(r.revenue)}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-[#2A2A35] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#650A30] to-[#B8922A] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
            <h2 className="text-sm font-bold mb-4">Payment method</h2>
            <div className="space-y-3">
              {m.paymentBreakdown.map((r) => {
                const pct = (r.count / payTotal) * 100
                return (
                  <div key={r.method}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#9CA3AF] uppercase tracking-wide">{r.method}</span>
                      <span className="tabular-nums">
                        <span className="font-semibold">{r.count}</span>
                        <span className="text-[#9CA3AF] ml-2">{pct.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div className="h-2 bg-[#2A2A35] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B8922A] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Top items */}
        <section>
          <h2 className="text-lg font-bold mb-4">Top items by revenue</h2>
          <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2A2A35] text-[#9CA3AF]">
                  <th className="text-left py-2 px-2 font-medium w-8">#</th>
                  <th className="text-left py-2 px-2 font-medium">Item</th>
                  <th className="text-right py-2 px-2 font-medium">Qty</th>
                  <th className="text-right py-2 px-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {m.topItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#9CA3AF] italic">
                      No orders in window.
                    </td>
                  </tr>
                ) : (
                  m.topItems.map((t, i) => (
                    <tr key={t.name} className="border-b border-[#2A2A35]/50 hover:bg-[#2A2A35]/30">
                      <td className="py-2.5 px-2 text-center text-[#9CA3AF]">{i + 1}</td>
                      <td className="py-2.5 px-2 font-medium">{t.name}</td>
                      <td className="py-2.5 px-2 text-right text-[#9CA3AF] tabular-nums">{t.qty}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{rupiah(t.revenue)}</td>
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
