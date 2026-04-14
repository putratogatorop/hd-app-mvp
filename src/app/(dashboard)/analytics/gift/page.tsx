import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGiftMetrics, requireStaff } from '@/lib/dashboard/real-metrics'
import AnalyticsTabs from '@/components/AnalyticsTabs'
import { DASH_COLORS } from '@/lib/dashboard/theme'

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
    <div className="min-h-screen" style={{ backgroundColor: DASH_COLORS.bg, color: DASH_COLORS.textPrimary }}>
      {/* Editorial masthead */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(28,8,16,0.88)',
          borderBottom: `1px solid ${DASH_COLORS.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-0">
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <span className="eyebrow" style={{ color: DASH_COLORS.gold }}>
                HD Analytics
              </span>
              <h1
                className="font-display text-[2rem] tracking-editorial mt-1"
                style={{ color: DASH_COLORS.textPrimary }}
              >
                Gifting <span className="italic">performance</span>
              </h1>
              <p className="text-[0.75rem] mt-1" style={{ color: DASH_COLORS.textMuted }}>
                Live data · last 30 days
              </p>
            </div>
          </div>
          <div className="mt-6">
            <AnalyticsTabs />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* KPI grid */}
        <section className="mb-10">
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DASH_COLORS.textMuted }}>01</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial" style={{ color: DASH_COLORS.textPrimary }}>
              Key measures
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Gifts last 30d', value: m.giftsLast30.toLocaleString('id-ID') },
              { label: 'Unique gifters', value: m.uniqueGiftersLast30.toLocaleString('id-ID') },
              { label: 'Gift AOV', value: rupiah(m.giftAOV) },
              { label: 'All-time gifts', value: m.giftsTotal.toLocaleString('id-ID') },
            ].map((c) => (
              <div
                key={c.label}
                className="p-5 transition-colors"
                style={{
                  backgroundColor: DASH_COLORS.card,
                  border: `1px solid ${DASH_COLORS.border}`,
                }}
              >
                <p className="eyebrow" style={{ color: DASH_COLORS.textMuted }}>
                  {c.label}
                </p>
                <p className="numeral text-[1.8rem] mt-3" style={{ color: DASH_COLORS.textPrimary }}>
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Gifts by day */}
        <section className="mb-10">
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DASH_COLORS.textMuted }}>02</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial" style={{ color: DASH_COLORS.textPrimary }}>
              Daily <span className="italic">volume</span>
            </h2>
          </div>
          <div
            className="p-6"
            style={{
              backgroundColor: DASH_COLORS.card,
              border: `1px solid ${DASH_COLORS.border}`,
            }}
          >
            <div className="flex items-end gap-[2px] h-44">
              {m.giftsByDay.map((d) => {
                const h = (d.gifts / maxGift) * 100
                return (
                  <div
                    key={d.date}
                    title={`${d.date} — ${d.gifts} gifts`}
                    className="flex-1 min-h-[2px] transition-all hover:opacity-70"
                    style={{
                      height: `${Math.max(2, h)}%`,
                      background: `linear-gradient(to top, ${DASH_COLORS.burgundy}, ${DASH_COLORS.gold})`,
                    }}
                  />
                )
              })}
            </div>
            <div className="flex justify-between numeral text-[0.65rem] mt-3" style={{ color: DASH_COLORS.textMuted }}>
              <span>{m.giftsByDay[0]?.date}</span>
              <span>{m.giftsByDay[m.giftsByDay.length - 1]?.date}</span>
            </div>
          </div>
        </section>

        {/* Upcoming scheduled */}
        <section className="mb-10">
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DASH_COLORS.textMuted }}>03</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial" style={{ color: DASH_COLORS.textPrimary }}>
              Upcoming <span className="italic">scheduled</span>
            </h2>
          </div>
          <div
            className="p-5 overflow-x-auto"
            style={{
              backgroundColor: DASH_COLORS.card,
              border: `1px solid ${DASH_COLORS.border}`,
            }}
          >
            {m.upcomingScheduled.length === 0 ? (
              <p className="font-display italic text-[0.95rem]" style={{ color: DASH_COLORS.textMuted }}>
                No scheduled gifts yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
                    <th className="text-left py-3 px-3 eyebrow font-normal" style={{ color: DASH_COLORS.textMuted }}>Scheduled for</th>
                    <th className="text-left py-3 px-3 eyebrow font-normal" style={{ color: DASH_COLORS.textMuted }}>Recipient</th>
                    <th className="text-right py-3 px-3 eyebrow font-normal" style={{ color: DASH_COLORS.textMuted }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {m.upcomingScheduled.map((g) => (
                    <tr key={g.id} style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
                      <td className="py-3 px-3 numeral" style={{ color: DASH_COLORS.gold }}>
                        {g.scheduled_for ? new Date(g.scheduled_for).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="py-3 px-3 font-display" style={{ color: DASH_COLORS.textPrimary }}>
                        {g.recipient_name ?? '—'}
                      </td>
                      <td className="py-3 px-3 text-right numeral" style={{ color: DASH_COLORS.textPrimary }}>
                        {rupiah(g.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Recent gift messages */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DASH_COLORS.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DASH_COLORS.textMuted }}>04</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial" style={{ color: DASH_COLORS.textPrimary }}>
              Recent <span className="italic">messages</span>
            </h2>
          </div>
          <div
            className="p-6 space-y-6"
            style={{
              backgroundColor: DASH_COLORS.card,
              border: `1px solid ${DASH_COLORS.border}`,
            }}
          >
            {m.recentNotes.length === 0 ? (
              <p className="font-display italic text-[0.95rem]" style={{ color: DASH_COLORS.textMuted }}>
                No messages yet.
              </p>
            ) : (
              m.recentNotes.map((n, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${DASH_COLORS.gold}`, paddingLeft: '1rem' }}>
                  <p className="font-display italic text-[1.1rem] leading-snug" style={{ color: DASH_COLORS.textPrimary }}>
                    &ldquo;{n.message}&rdquo;
                  </p>
                  <p className="eyebrow mt-2 numeral text-[0.65rem]" style={{ color: DASH_COLORS.textMuted }}>
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
