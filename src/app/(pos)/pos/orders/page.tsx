import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import RealtimeOrderQueue from './RealtimeOrderQueue'

type OrderRow = Database['public']['Tables']['orders']['Row']

export const dynamic = 'force-dynamic'

export default async function PosOrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(quantity, unit_price, menu_items(name)), profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50) as unknown as {
      data: (OrderRow & {
        order_items: { quantity: number; unit_price: number; menu_items: { name: string } | null }[]
        profiles: { full_name: string | null; email: string } | null
      })[] | null
    }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-hd-dark">Order Queue</h1>
          <p className="text-gray-500 text-sm">Real-time incoming orders</p>
        </div>
      </div>
      <RealtimeOrderQueue initialOrders={orders ?? []} />
    </div>
  )
}
