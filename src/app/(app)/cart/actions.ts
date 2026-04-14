'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Database } from '@/lib/supabase/database.types'
import { sendGiftNotification } from '@/lib/notifications/whatsapp'

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
  gift?: {
    recipientName: string
    recipientPhone: string
    recipientAddress: string
    message: string
    scheduledFor: string // ISO or ''
  } | null
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
    gift,
  } = input

  if (!items.length) throw new Error('Cart is empty')

  if (gift) {
    if (!gift.recipientName.trim() || !gift.recipientPhone.trim()) {
      throw new Error('Recipient name and phone are required for gift orders')
    }
  }

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
  const orderInsertWithGift = gift
    ? {
        ...orderInsert,
        is_gift: true,
        recipient_name: gift.recipientName.trim(),
        recipient_phone: gift.recipientPhone.trim(),
        recipient_address: gift.recipientAddress.trim() || null,
        gift_message: gift.message.trim() || null,
        scheduled_for: gift.scheduledFor || null,
      }
    : orderInsert
  const { data: order, error: orderErr } = await db
    .from('orders')
    .insert(orderInsertWithGift)
    .select('id, gift_token')
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
    .select('loyalty_points, tier, full_name')
    .eq('id', user.id)
    .single() as unknown as { data: { loyalty_points: number; tier: string; full_name: string | null } | null }

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

  // 6. Notify recipient via WhatsApp (no-op until provider env vars configured)
  if (gift && order.gift_token) {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
    const proto = h.get('x-forwarded-proto') ?? 'https'
    const senderName = (profile as { full_name?: string } | null)?.full_name ?? undefined
    // Fire-and-forget; don't block checkout if provider is down or unconfigured
    void sendGiftNotification({
      recipientPhone: gift.recipientPhone.trim(),
      recipientName: gift.recipientName.trim(),
      senderName,
      giftMessage: gift.message?.trim() || undefined,
      giftToken: order.gift_token as string,
      appBaseUrl: `${proto}://${host}`,
    })
  }

  redirect('/orders')
}
