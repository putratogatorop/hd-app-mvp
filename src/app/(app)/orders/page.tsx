import { createClient } from '@/lib/supabase/server'

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusConfig: Record<string, { label: string; color: string; emoji: string }> = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700', emoji: '⏳' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-700', emoji: '✅' },
  preparing: { label: 'Diproses', color: 'bg-orange-100 text-orange-700', emoji: '👨‍🍳' },
  ready: { label: 'Siap Diambil', color: 'bg-green-100 text-green-700', emoji: '🎉' },
  delivered: { label: 'Selesai', color: 'bg-gray-100 text-gray-600', emoji: '📦' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-600', emoji: '❌' },
}

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(quantity, unit_price, menu_item_id, menu_items(name))')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-hd-dark">Riwayat Pesanan 📦</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {orders && orders.length > 0 ? (
          orders.map(order => {
            const status = statusConfig[order.status] ?? statusConfig.pending
            return (
              <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-mono">
                    #{order.id.slice(-8).toUpperCase()}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                    {status.emoji} {status.label}
                  </span>
                </div>

                {/* Order items */}
                <div className="space-y-1 mb-3">
                  {(order.order_items as any[])?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.menu_items?.name} ×{item.quantity}</span>
                      <span className="text-gray-500">{formatRupiah(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-hd-dark">{formatRupiah(order.total_amount)}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                  {order.points_earned > 0 && (
                    <span className="text-xs text-hd-gold font-semibold">
                      +{order.points_earned} poin ⭐
                    </span>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl">🍨</span>
            <p className="text-gray-500 mt-4 font-medium">Belum ada pesanan</p>
            <p className="text-gray-400 text-sm mt-1">Yuk order ice cream pertamamu!</p>
          </div>
        )}
      </div>
    </div>
  )
}
