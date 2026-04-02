export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          loyalty_points: number
          tier: 'silver' | 'gold' | 'platinum'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          loyalty_points?: number
          tier?: 'silver' | 'gold' | 'platinum'
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          loyalty_points?: number
          tier?: 'silver' | 'gold' | 'platinum'
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category: 'ice_cream' | 'cake' | 'beverage' | 'topping'
          image_url: string | null
          is_available: boolean
          calories: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category: 'ice_cream' | 'cake' | 'beverage' | 'topping'
          image_url?: string | null
          is_available?: boolean
          calories?: number | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          price?: number
          category?: 'ice_cream' | 'cake' | 'beverage' | 'topping'
          image_url?: string | null
          is_available?: boolean
          calories?: number | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          total_amount: number
          delivery_address: string | null
          notes: string | null
          points_earned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          total_amount: number
          delivery_address?: string | null
          notes?: string | null
          points_earned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          delivery_address?: string | null
          notes?: string | null
          points_earned?: number
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          unit_price: number
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          quantity?: number
          unit_price?: number
        }
      }
      loyalty_transactions: {
        Row: {
          id: string
          user_id: string
          order_id: string | null
          type: 'earned' | 'redeemed' | 'bonus' | 'expired'
          points: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id?: string | null
          type: 'earned' | 'redeemed' | 'bonus' | 'expired'
          points: number
          description?: string | null
          created_at?: string
        }
        Update: {
          description?: string | null
        }
      }
    }
  }
}
