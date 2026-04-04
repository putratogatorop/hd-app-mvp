import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/lib/supabase/database.types'

type MenuItem = Database['public']['Tables']['menu_items']['Row']
type Voucher = Database['public']['Tables']['vouchers']['Row']

export interface CartItem {
  item: MenuItem
  quantity: number
}

type OrderMode = 'pickup' | 'delivery' | 'dinein'

interface CartStore {
  items: CartItem[]
  appliedVoucher: Voucher | null
  paymentMethod: string
  notes: string

  addItem: (item: MenuItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, qty: number) => void
  clearCart: () => void
  applyVoucher: (voucher: Voucher) => void
  removeVoucher: () => void
  setPaymentMethod: (method: string) => void
  setNotes: (notes: string) => void

  subtotal: () => number
  discountAmount: () => number
  deliveryFee: (mode: OrderMode) => number
  total: (mode: OrderMode) => number
  earnedPoints: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedVoucher: null,
      paymentMethod: 'gopay',
      notes: '',

      addItem: (item) => {
        const existing = get().items.find(i => i.item.id === item.id)
        if (existing) {
          set(state => ({
            items: state.items.map(i =>
              i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }))
        } else {
          set(state => ({ items: [...state.items, { item, quantity: 1 }] }))
        }
      },

      removeItem: (itemId) =>
        set(state => ({ items: state.items.filter(i => i.item.id !== itemId) })),

      updateQuantity: (itemId, qty) => {
        if (qty <= 0) {
          get().removeItem(itemId)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.item.id === itemId ? { ...i, quantity: qty } : i
          ),
        }))
      },

      clearCart: () => set({ items: [], appliedVoucher: null, notes: '' }),

      applyVoucher: (voucher) => set({ appliedVoucher: voucher }),

      removeVoucher: () => set({ appliedVoucher: null }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setNotes: (notes) => set({ notes }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.item.price * i.quantity, 0),

      discountAmount: () => {
        const voucher = get().appliedVoucher
        if (!voucher) return 0

        const sub = get().subtotal()

        if (voucher.min_order !== null && sub < voucher.min_order) return 0

        let discount: number
        if (voucher.discount_type === 'percentage') {
          discount = Math.floor(sub * (voucher.discount_value / 100))
          if (voucher.max_discount !== null) {
            discount = Math.min(discount, voucher.max_discount)
          }
        } else {
          discount = voucher.discount_value
        }

        return Math.min(discount, sub)
      },

      deliveryFee: (mode) => (mode === 'delivery' ? 15000 : 0),

      total: (mode) => {
        const sub = get().subtotal()
        const discount = get().discountAmount()
        const fee = get().deliveryFee(mode)
        return Math.max(0, sub - discount + fee)
      },

      earnedPoints: () =>
        get().items.reduce(
          (sum, i) => sum + Math.floor(i.item.price / 1000) * i.quantity,
          0
        ),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'hd-cart-v2' }
  )
)
