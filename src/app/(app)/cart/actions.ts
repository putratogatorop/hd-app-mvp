'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'

type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
type LoyaltyTxInsert = Database['public']['Tables']['loyalty_transactions']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export interface PlaceOrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface PlaceOrderInput {
  items: PlaceOrderItem[]
  totalAmount: number
  earnedPoints: number
  storeId: string | null
  orderMode: 'pickup' | 'delivery' | 'dinein'
  tableNumber: number | null
  voucherId: string | null
  discountAmount: number
  deliveryFee: number
  paymentMethod: string
  notes: string
}

export async function placeOrder(input: PlaceOrderInput) {
  const {
    items,
    totalAmount,
    earnedPoints,
    storeId,
    orderMode,
    tableNumber,
    voucherId,
    discountAmount,
    deliveryFee,
    paymentMethod,
    notes,
  } = input

  if (!items.length) throw new Error('Cart is empty')

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Insert order
  const orderInsert: OrderInsert = {
    user_id: user.id,
    status: 'pending',
    total_amount: totalAmount,
    points_earned: earnedPoints,
    store_id: storeId,
    order_mode: orderMode,
    table_number: tableNumber,
    voucher_id: voucherId,
    discount_amount: discountAmount,
    delivery_fee: deliveryFee,
    payment_method: paymentMethod,
    notes: notes || null,
  }
  const { data: order, error: orderErr } = await db
    .from('orders')
    .insert(orderInsert)
    .select('id')
    .single()

  if (orderErr || !order) throw new Error('Gagal membuat pesanan')

  // 2. Insert order items
  const orderItems: OrderItemInsert[] = items.map(item => ({
    order_id: order.id,
    menu_item_id: item.id,
    quantity: item.quantity,
    unit_price: item.price,
    subtotal: item.price * item.quantity,
  }))
  const { error: itemsErr } = await db.from('order_items').insert(orderItems)
  if (itemsErr) throw new Error('Gagal menyimpan item pesanan')

  // 3. Credit loyalty points to profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('loyalty_points, tier')
    .eq('id', user.id)
    .single() as unknown as { data: { loyalty_points: number; tier: string } | null }

  if (profile) {
    const newPoints = (profile.loyalty_points ?? 0) + earnedPoints
    const newTier =
      newPoints >= 15000 ? 'platinum' : newPoints >= 5000 ? 'gold' : 'silver'

    const profileUpdate: ProfileUpdate = {
      loyalty_points: newPoints,
      tier: newTier as 'silver' | 'gold' | 'platinum',
    }
    await db.from('profiles').update(profileUpdate).eq('id', user.id)

    // 4. Record loyalty transaction
    const txInsert: LoyaltyTxInsert = {
      user_id: user.id,
      order_id: order.id,
      type: 'earned',
      points: earnedPoints,
      description: `Earned from order #${order.id.slice(-8).toUpperCase()}`,
    }
    await db.from('loyalty_transactions').insert(txInsert)
  }

  // 5. Mark voucher as used if one was applied
  if (voucherId) {
    await db
      .from('user_vouchers')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('voucher_id', voucherId)
      .eq('is_used', false)
  }

  redirect('/orders')
}
