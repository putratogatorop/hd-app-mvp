import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import OrderStatusTracker from './OrderStatusTracker'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']
type MenuItemRow = Database['public']['Tables']['menu_items']['Row']

type OrderWithItems = OrderRow & {
  order_items: (Pick<OrderItemRow, 'quantity' | 'unit_price' | 'menu_item_id'> & {
    menu_items: Pick<MenuItemRow, 'name'> | null
  })[]
}

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(quantity, unit_price, menu_item_id, menu_items(name))')
    .order('created_at', { ascending: false })
    .limit(20) as unknown as { data: OrderWithItems[] | null }

  const activeOrders = (orders ?? []).filter(
    o => !['delivered', 'cancelled'].includes(o.status)
  )
  const pastOrders = (orders ?? []).filter(
    o => ['delivered', 'cancelled'].includes(o.status)
  )

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-hd-dark">Pesanan Saya 📦</h1>
        <p className="text-gray-400 text-sm mt-0.5">Update status secara real-time</p>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Active orders */}
        {activeOrders.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              Sedang Diproses ({activeOrders.length})
            </h2>
            <div className="space-y-3">
              {activeOrders.map(order => (
                <OrderStatusTracker key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Past orders */}
        {pastOrders.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              Riwayat
            </h2>
            <div className="space-y-3">
              {pastOrders.map(order => (
                <OrderStatusTracker key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!orders || orders.length === 0) && (
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
