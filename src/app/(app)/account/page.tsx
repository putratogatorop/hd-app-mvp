import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountClient from './AccountClient'
import type { Database } from '@/lib/supabase/database.types'

type ProfileRow = Database['haagen_dazs']['Tables']['profiles']['Row']
type OrderRow = Database['haagen_dazs']['Tables']['orders']['Row']

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, loyalty_points, tier, referral_code, birthday')
    .eq('id', user.id)
    .single() as unknown as {
      data:
        | (Pick<ProfileRow, 'full_name' | 'email' | 'phone' | 'loyalty_points' | 'tier' | 'referral_code'> & {
            birthday: string | null
          })
        | null
    }

  // Fetch last 3 orders with item counts
  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('id, created_at, total_amount, order_mode')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3) as unknown as { data: Pick<OrderRow, 'id' | 'created_at' | 'total_amount' | 'order_mode'>[] | null }

  // Fetch item counts for those orders
  const orderIds = (ordersRaw ?? []).map((o) => o.id)
  const { data: itemCountsRaw } = orderIds.length > 0
    ? await supabase
        .from('order_items')
        .select('order_id, quantity')
        .in('order_id', orderIds)
    : { data: [] }

  // Aggregate item counts per order
  const itemCountMap: Record<string, number> = {}
  for (const item of itemCountsRaw ?? []) {
    const r = item as { order_id: string; quantity: number }
    itemCountMap[r.order_id] = (itemCountMap[r.order_id] ?? 0) + r.quantity
  }

  const recentOrders = (ordersRaw ?? []).map((o) => ({
    id: o.id,
    created_at: o.created_at,
    total_amount: o.total_amount,
    order_mode: o.order_mode,
    item_count: itemCountMap[o.id] ?? 1,
  }))

  return <AccountClient profile={profile} recentOrders={recentOrders} />
}
