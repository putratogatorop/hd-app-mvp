import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGiftMetrics, requireStaff } from '@/lib/dashboard/real-metrics'
import AnalyticsTabs from '@/components/AnalyticsTabs'

export const dynamic = 'force-dynamic'

function rupiah(n: number): string {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${Math.round(n)}`
}

export default async function GiftAnalyticsPage() {
  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) redirect('/login')
  if (role !== 'staff' && role !== 'admin') redirect('/home')

  const m = await getGiftMetrics(supabase)
  const maxGift = Math.max(1, ...m.giftsByDay.map((d) => d.gifts))

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-[#2A2A35] bg-[#0F0F12]/85">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <h1 className="text-xl font-bold tracking-tight">
            HD Analytics <span className="text-[#B8922A]">&#10022;</span>
          </h1>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Gifting · live data · last 30 days</p>
          <div className="mt-3">
            <AnalyticsTabs />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Gifts last 30d', value: m.giftsLast30.toLocaleString('id-ID') },
            { label: 'Unique gifters', value: m.uniqueGiftersLast30.toLocaleString('id-ID') },
            { label: 'Gift AOV', value: rupiah(m.giftAOV) },
            { label: 'All-time gifts', value: m.giftsTotal.toLocaleString('id-ID') },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5 hover:border-[#B8922A]/40 transition-all"
            >
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider">{c.label}</p>
              <p className="text-2xl font-bold mt-2 tabular-nums">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Gifts by day */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4">Gifts sent — daily</h2>
          <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
            <div className="flex items-end gap-[2px] h-40">
              {m.giftsByDay.map((d) => {
                const h = (d.gifts / maxGift) * 100
                return (
                  <div
                    key={d.date}
                    title={`${d.date} — ${d.gifts} gifts`}
                    className="flex-1 bg-gradient-to-t from-[#650A30] to-[#B8922A] rounded-t-sm min-h-[2px] transition-all hover:opacity-80"
                    style={{ height: `${Math.max(2, h)}%` }}
                  />
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-2">
              <span>{m.giftsByDay[0]?.date}</span>
              <span>{m.giftsByDay[m.giftsByDay.length - 1]?.date}</span>
            </div>
          </div>
        </section>

        {/* Upcoming scheduled */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4">Upcoming scheduled gifts</h2>
          <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5 overflow-x-auto">
            {m.upcomingScheduled.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] italic">No scheduled gifts yet.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#2A2A35] text-[#9CA3AF]">
                    <th className="text-left py-2 px-2 font-medium">Scheduled for</th>
                    <th className="text-left py-2 px-2 font-medium">Recipient</th>
                    <th className="text-right py-2 px-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {m.upcomingScheduled.map((g) => (
                    <tr key={g.id} className="border-b border-[#2A2A35]/50 hover:bg-[#2A2A35]/30 transition-colors">
                      <td className="py-2.5 px-2 font-mono text-[#D4AC3A]">
                        {g.scheduled_for ? new Date(g.scheduled_for).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="py-2.5 px-2">{g.recipient_name ?? '—'}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{rupiah(g.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Recent gift notes */}
        <section>
          <h2 className="text-lg font-bold mb-4">Recent gift messages</h2>
          <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5 space-y-4">
            {m.recentNotes.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] italic">No messages yet.</p>
            ) : (
              m.recentNotes.map((n, i) => (
                <div key={i} className="border-l-2 border-[#B8922A] pl-4">
                  <p className="italic text-[0.95rem] text-white/90">&ldquo;{n.message}&rdquo;</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-1 tracking-wider uppercase">
                    {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
