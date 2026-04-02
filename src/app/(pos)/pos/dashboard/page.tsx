import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type OrderRow = Database['public']['Tables']['orders']['Row']

export const dynamic = 'force-dynamic'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(n)
}

function StatCard({
  label,
  value,
  sub,
  emoji,
  color,
}: {
  label: string
  value: string
  sub?: string
  emoji: string
  color: string
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{emoji}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
      </div>
      <p className="text-2xl font-bold text-hd-dark">{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default async function PosDashboardPage() {
  const supabase = await createClient()

  // Today's date range
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: todayOrders } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString()) as unknown as { data: OrderRow[] | null }

  const { data: allOrders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100) as unknown as { data: OrderRow[] | null }

  // Today stats
  const todayDelivered = (todayOrders ?? []).filter(o => o.status === 'delivered')
  const todayRevenue = todayDelivered.reduce((sum, o) => sum + o.total_amount, 0)
  const todayCount = (todayOrders ?? []).length
  const todayAvg = todayDelivered.length ? todayRevenue / todayDelivered.length : 0

  // Status breakdown (all time, last 100)
  const statusBreakdown: Record<string, number> = {}
  for (const order of allOrders ?? []) {
    statusBreakdown[order.status] = (statusBreakdown[order.status] ?? 0) + 1
  }

  // Pending & active alerts
  const pendingCount = statusBreakdown['pending'] ?? 0
  const preparingCount = (statusBreakdown['confirmed'] ?? 0) + (statusBreakdown['preparing'] ?? 0)

  const STATUS_COLORS: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700',
    ready:     'bg-green-100 text-green-700',
    delivered: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  }
  const STATUS_LABELS: Record<string, string> = {
    pending: 'Menunggu', confirmed: 'Dikonfirmasi', preparing: 'Diproses',
    ready: 'Siap', delivered: 'Selesai', cancelled: 'Dibatalkan',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-hd-dark">Dashboard</h1>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Alert banners */}
      {pendingCount > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">⏳</span>
          <p className="text-yellow-800 font-medium text-sm">
            <strong>{pendingCount} pesanan</strong> menunggu konfirmasi
          </p>
          <a href="/pos/orders" className="ml-auto text-yellow-700 font-semibold text-sm underline">
            Lihat →
          </a>
        </div>
      )}

      {/* Today's KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Hari ini"
          value={formatRupiah(todayRevenue)}
          sub="Total revenue"
          emoji="💰"
          color="bg-green-100 text-green-700"
        />
        <StatCard
          label="Hari ini"
          value={String(todayCount)}
          sub="Total pesanan masuk"
          emoji="📋"
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Hari ini"
          value={String(todayDelivered.length)}
          sub="Pesanan selesai"
          emoji="✅"
          color="bg-gray-100 text-gray-600"
        />
        <StatCard
          label="Hari ini"
          value={formatRupiah(todayAvg)}
          sub="Rata-rata per order"
          emoji="📊"
          color="bg-purple-100 text-purple-700"
        />
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-hd-dark mb-4">Status Pesanan (100 Terakhir)</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(status => (
            <div key={status} className="text-center">
              <div className={`rounded-xl py-3 px-2 ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
                <p className="text-2xl font-bold">{statusBreakdown[status] ?? 0}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {STATUS_LABELS[status] ?? status}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-hd-dark mb-4">Pesanan Terbaru</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-medium">Order ID</th>
                <th className="pb-2 font-medium">Total</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(allOrders ?? []).slice(0, 10).map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 font-mono text-xs text-gray-500">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="py-2.5 font-semibold text-hd-dark">
                    {formatRupiah(order.total_amount)}
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-400 text-xs">
                    {new Date(order.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
