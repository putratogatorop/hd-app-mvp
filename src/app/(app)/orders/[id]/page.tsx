import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrderDetailClient from './OrderDetailClient'

export const dynamic = 'force-dynamic'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, store:stores(*), order_items(*, menu_item:menu_items(name))')
    .eq('id', params.id)
    .single() as unknown as {
      data: {
        id: string
        status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
        total_amount: number
        discount_amount: number
        delivery_fee: number
        points_earned: number
        order_mode: 'pickup' | 'delivery' | 'dinein'
        table_number: number | null
        payment_method: string
        notes: string | null
        created_at: string
        store: { name: string; address: string } | null
        order_items: {
          quantity: number
          unit_price: number
          menu_item: { name: string } | null
        }[]
      } | null
    }

  if (!order) redirect('/orders')

  return <OrderDetailClient order={order} />
}
