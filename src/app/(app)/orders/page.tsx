import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrdersClient from './OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_amount, order_mode, created_at, is_gift, recipient_name, gift_token, store:stores(name), order_items(quantity, menu_item:menu_items(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return <OrdersClient orders={orders ?? []} />
}
