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
          role: 'customer' | 'staff' | 'admin'
          referral_code: string | null
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
          role?: 'customer' | 'staff' | 'admin'
          referral_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          loyalty_points?: number
          tier?: 'silver' | 'gold' | 'platinum'
          role?: 'customer' | 'staff' | 'admin'
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
          store_id: string | null
          order_mode: 'pickup' | 'delivery' | 'dinein'
          table_number: number | null
          voucher_id: string | null
          discount_amount: number
          delivery_fee: number
          payment_method: string
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
          store_id?: string | null
          order_mode?: 'pickup' | 'delivery' | 'dinein'
          table_number?: number | null
          voucher_id?: string | null
          discount_amount?: number
          delivery_fee?: number
          payment_method?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          delivery_address?: string | null
          notes?: string | null
          points_earned?: number
          store_id?: string | null
          order_mode?: 'pickup' | 'delivery' | 'dinein'
          table_number?: number | null
          voucher_id?: string | null
          discount_amount?: number
          delivery_fee?: number
          payment_method?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_store_id_fkey'
            columns: ['store_id']
            isOneToOne: false
            referencedRelation: 'stores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_voucher_id_fkey'
            columns: ['voucher_id']
            isOneToOne: false
            referencedRelation: 'vouchers'
            referencedColumns: ['id']
          }
        ]
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
          subtotal?: number
        }
        Update: {
          quantity?: number
          unit_price?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_menu_item_id_fkey'
            columns: ['menu_item_id']
            isOneToOne: false
            referencedRelation: 'menu_items'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'loyalty_transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      stores: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          opening_hours: string
          is_open: boolean
          distance_dummy: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          opening_hours: string
          is_open?: boolean
          distance_dummy?: number
          created_at?: string
        }
        Update: {
          name?: string
          address?: string
          city?: string
          opening_hours?: string
          is_open?: boolean
          distance_dummy?: number
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          id: string
          code: string
          title: string
          description: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_order: number | null
          max_discount: number | null
          applicable_modes: string[]
          voucher_source: 'manual' | 'tier' | 'referral'
          tier_required: 'silver' | 'gold' | 'platinum' | null
          valid_from: string
          valid_until: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          title: string
          description?: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_order?: number | null
          max_discount?: number | null
          applicable_modes?: string[]
          voucher_source?: 'manual' | 'tier' | 'referral'
          tier_required?: 'silver' | 'gold' | 'platinum' | null
          valid_from: string
          valid_until: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          title?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          min_order?: number | null
          max_discount?: number | null
          applicable_modes?: string[]
          voucher_source?: 'manual' | 'tier' | 'referral'
          tier_required?: 'silver' | 'gold' | 'platinum' | null
          valid_from?: string
          valid_until?: string
          is_active?: boolean
        }
        Relationships: []
      }
      user_vouchers: {
        Row: {
          id: string
          user_id: string
          voucher_id: string
          is_used: boolean
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          voucher_id: string
          is_used?: boolean
          used_at?: string | null
          created_at?: string
        }
        Update: {
          is_used?: boolean
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_vouchers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_vouchers_voucher_id_fkey'
            columns: ['voucher_id']
            isOneToOne: false
            referencedRelation: 'vouchers'
            referencedColumns: ['id']
          }
        ]
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          referral_code: string
          voucher_given: boolean
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          referral_code: string
          voucher_given?: boolean
          created_at?: string
        }
        Update: {
          voucher_given?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'referrals_referrer_id_fkey'
            columns: ['referrer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'referrals_referred_id_fkey'
            columns: ['referred_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
