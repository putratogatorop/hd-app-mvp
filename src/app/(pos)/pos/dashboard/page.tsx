import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { Eyebrow } from '@/components/ui'

type OrderRow = Database['public']['Tables']['orders']['Row']

export const dynamic = 'force-dynamic'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'In prep',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_ACCENT: Record<string, string> = {
  pending: 'text-amber-700',
  confirmed: 'text-blue-700',
  preparing: 'text-hd-burgundy',
  ready: 'text-emerald-700',
  delivered: 'text-hd-ink/50',
  cancelled: 'text-hd-ink/40',
}

function KpiBlock({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption?: string
}) {
  return (
    <div className="py-6">
      <Eyebrow>{label}</Eyebrow>
      <p className="numeral text-[2.25rem] leading-none text-hd-ink mt-3">{value}</p>
      {caption && (
        <p className="eyebrow text-hd-ink/45 mt-2">{caption}</p>
      )}
    </div>
  )
}

export default async function PosDashboardPage() {
  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: todayOrders } = (await supabase
    .from('orders')
    .select('*')
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())) as unknown as { data: OrderRow[] | null }

  const { data: allOrders } = (await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)) as unknown as { data: OrderRow[] | null }

  const todayDelivered = (todayOrders ?? []).filter((o) => o.status === 'delivered')
  const todayRevenue = todayDelivered.reduce((sum, o) => sum + o.total_amount, 0)
  const todayCount = (todayOrders ?? []).length
  const todayAvg = todayDelivered.length ? todayRevenue / todayDelivered.length : 0

  const statusBreakdown: Record<string, number> = {}
  for (const order of allOrders ?? []) {
    statusBreakdown[order.status] = (statusBreakdown[order.status] ?? 0) + 1
  }

  const pendingCount = statusBreakdown['pending'] ?? 0

  const dateline = new Date()
    .toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Masthead */}
      <header className="border-b border-hd-ink/15 pb-5 mb-6 flex items-end justify-between">
        <div>
          <Eyebrow number="03">At a glance</Eyebrow>
          <h1 className="mt-3 font-display text-display-md text-hd-ink tracking-editorial">
            Today&apos;s <span className="italic">log</span>
          </h1>
        </div>
        <span className="numeral text-[0.65rem] text-hd-ink/50 tracking-widest pb-1">
          {dateline}
        </span>
      </header>

      {/* Alert */}
      {pendingCount > 0 && (
        <Link
          href="/pos/orders"
          className="flex items-center justify-between border border-hd-burgundy/40 bg-hd-burgundy/5 px-5 py-4 mb-8 hover:border-hd-burgundy transition-colors group"
        >
          <div className="flex items-baseline gap-4">
            <span className="numeral text-[1.4rem] text-hd-burgundy">
              {String(pendingCount).padStart(2, '0')}
            </span>
            <span className="font-display italic text-[0.95rem] text-hd-burgundy">
              awaiting confirmation
            </span>
          </div>
          <span className="eyebrow text-hd-burgundy transition-transform group-hover:translate-x-0.5">
            Review →
          </span>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-hd-ink/10 border-y border-hd-ink/15 mb-10">
        <div className="px-5"><KpiBlock label="Revenue" value={formatRupiah(todayRevenue)} caption="Today" /></div>
        <div className="px-5"><KpiBlock label="Orders in" value={String(todayCount).padStart(2, '0')} caption="Today" /></div>
        <div className="px-5"><KpiBlock label="Delivered" value={String(todayDelivered.length).padStart(2, '0')} caption="Today" /></div>
        <div className="px-5"><KpiBlock label="Avg · order" value={formatRupiah(todayAvg)} caption="Today" /></div>
      </div>

      {/* Status breakdown */}
      <section className="mb-10">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3 mb-5">
          <Eyebrow number="A">Status · Last 100</Eyebrow>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-hd-ink/10 border border-hd-ink/10">
          {['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
            <div key={status} className="bg-hd-paper px-4 py-5 text-center">
              <p className={`numeral text-[1.75rem] leading-none ${STATUS_ACCENT[status] ?? 'text-hd-ink'}`}>
                {String(statusBreakdown[status] ?? 0).padStart(2, '0')}
              </p>
              <p className="eyebrow text-hd-ink/50 mt-2">
                {STATUS_LABELS[status] ?? status}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent table */}
      <section>
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3 mb-5">
          <Eyebrow number="B">Recent orders</Eyebrow>
        </div>
        <table className="w-full text-[0.85rem]">
          <thead>
            <tr className="border-b border-hd-ink/15 text-left">
              <th className="py-2 eyebrow text-hd-ink/50 font-normal">Order</th>
              <th className="py-2 eyebrow text-hd-ink/50 font-normal text-right">Total</th>
              <th className="py-2 eyebrow text-hd-ink/50 font-normal hidden sm:table-cell">Status</th>
              <th className="py-2 eyebrow text-hd-ink/50 font-normal text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hd-ink/10">
            {(allOrders ?? []).slice(0, 10).map((order) => (
              <tr key={order.id} className="hover:bg-hd-paper transition-colors">
                <td className="py-3 numeral text-hd-ink/70 text-[0.8rem]">
                  #{order.id.slice(-8).toUpperCase()}
                </td>
                <td className="py-3 numeral text-hd-ink text-right">
                  {formatRupiah(order.total_amount)}
                </td>
                <td className="py-3 hidden sm:table-cell">
                  <span className={`eyebrow ${STATUS_ACCENT[order.status] ?? 'text-hd-ink/60'}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td className="py-3 numeral text-[0.75rem] text-hd-ink/50 text-right">
                  {new Date(order.created_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
