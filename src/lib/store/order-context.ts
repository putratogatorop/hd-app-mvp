import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/lib/supabase/database.types'

type Store = Database['public']['Tables']['stores']['Row']

type OrderMode = 'pickup' | 'delivery' | 'dinein'

interface OrderContextState {
  mode: OrderMode
  selectedStore: Store | null
  tableNumber: number | null
}

interface OrderContextActions {
  setMode: (mode: OrderMode) => void
  setStore: (store: Store | null) => void
  setTableNumber: (tableNumber: number | null) => void
  reset: () => void
}

type OrderContextStore = OrderContextState & OrderContextActions

const defaultState: OrderContextState = {
  mode: 'pickup',
  selectedStore: null,
  tableNumber: null,
}

export const useOrderContext = create<OrderContextStore>()(
  persist(
    (set) => ({
      ...defaultState,

      setMode: (mode) => set({ mode }),

      setStore: (store) => set({ selectedStore: store }),

      setTableNumber: (tableNumber) => set({ tableNumber }),

      reset: () => set(defaultState),
    }),
    { name: 'hd-order-context-v1' }
  )
)
