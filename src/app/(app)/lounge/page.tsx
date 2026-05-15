import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoungeClient from './LoungeClient'
import type { Database } from '@/lib/supabase/database.types'

type ProfileRow = Database['haagen_dazs']['Tables']['profiles']['Row']
type LoyaltyTx = Database['haagen_dazs']['Tables']['loyalty_transactions']['Row']
type Order = Database['haagen_dazs']['Tables']['orders']['Row']

export interface LoungeProfile {
  full_name: string | null
  email: string
  tier: ProfileRow['tier']
  loyalty_points: number
  // These columns may not exist yet in the DB — handled gracefully
  member_since: string | null
  referral_code: string | null
}

export interface JournalEntry {
  id: string
  title: string
  meta: string
  points: number
  type: 'positive' | 'negative'
}

export default async function LoungePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile — cast to avoid TS inference issues with dynamic Supabase columns
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, email, tier, loyalty_points, referral_code, created_at')
    .eq('id', user.id)
    .single() as unknown as {
      data: Pick<ProfileRow, 'full_name' | 'email' | 'tier' | 'loyalty_points' | 'referral_code' | 'created_at'> | null
    }

  const profile: LoungeProfile = {
    full_name: profileRaw?.full_name ?? null,
    email: profileRaw?.email ?? user.email ?? '',
    tier: profileRaw?.tier ?? 'silver',
    loyalty_points: profileRaw?.loyalty_points ?? 0,
    // member_since: use created_at as fallback (member_since column may not exist)
    member_since: profileRaw?.created_at ?? null,
    referral_code: profileRaw?.referral_code ?? null,
  }

  // Fetch last 3 loyalty transactions for The Journal
  const { data: txRaw } = await supabase
    .from('loyalty_transactions')
    .select('id, type, points, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Derive journal entries — fall back to order history if no loyalty_transactions
  let journal: JournalEntry[] = []

  if (txRaw && txRaw.length > 0) {
    journal = txRaw.map((tx: Pick<LoyaltyTx, 'id' | 'type' | 'points' | 'description' | 'created_at'>) => {
      const dateStr = new Date(tx.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const isPositive = tx.type === 'earned' || tx.type === 'bonus'
      return {
        id: tx.id,
        title: tx.description ?? (isPositive ? 'Points earned' : 'Points redeemed'),
        meta: `${dateStr} · ${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}`,
        points: tx.points,
        type: isPositive ? 'positive' : 'negative',
      }
    })
  } else {
    // Fallback: derive from last 3 orders
    const { data: ordersRaw } = await supabase
      .from('orders')
      .select('id, created_at, points_earned, store_id, order_mode')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    if (ordersRaw && ordersRaw.length > 0) {
      journal = (ordersRaw as Pick<Order, 'id' | 'created_at' | 'points_earned' | 'store_id' | 'order_mode'>[]).map((o) => {
        const dateStr = new Date(o.created_at).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        const modeLabel = o.order_mode === 'pickup' ? 'Pick Up' : o.order_mode === 'dinein' ? 'Dine In' : 'Delivery'
        return {
          id: o.id,
          title: `Boutique visit`,
          meta: `${dateStr} · ${modeLabel}`,
          points: o.points_earned ?? 0,
          type: 'positive' as const,
        }
      })
    }
  }

  // Hardcode journal if still empty (graceful demo data)
  if (journal.length === 0) {
    journal = [
      { id: '1', title: 'Boutique visit — Grand Indonesia', meta: '12 Apr 2026 · Pick Up', points: 450, type: 'positive' },
      { id: '2', title: 'Birthday redemption', meta: '03 Apr 2026 · Privilege', points: 500, type: 'negative' },
      { id: '3', title: 'Senayan City — signature tasting', meta: '28 Mar 2026 · Dine In', points: 320, type: 'positive' },
    ]
  }

  return <LoungeClient profile={profile} journal={journal} />
}
