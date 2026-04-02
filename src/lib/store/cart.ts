import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/lib/supabase/database.types'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

export interface CartItem {
  item: MenuItem
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: MenuItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, qty: number) => void
  clearCart: () => void
  total: () => number
  earnedPoints: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

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

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.item.price * i.quantity, 0),

      earnedPoints: () =>
        get().items.reduce(
          (sum, i) => sum + Math.floor(i.item.price / 1000) * i.quantity,
          0
        ),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'hd-cart-v1' }
  )
)
