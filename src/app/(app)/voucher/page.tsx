import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'
import VoucherClient from './VoucherClient'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type VoucherRow = Database['public']['Tables']['vouchers']['Row']

export const dynamic = 'force-dynamic'

export default async function VoucherPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, loyalty_points')
    .eq('id', user.id)
    .single() as unknown as { data: Pick<ProfileRow, 'tier' | 'loyalty_points'> | null }

  const { data: vouchers } = await supabase
    .from('vouchers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false }) as unknown as { data: VoucherRow[] | null }

  const { data: userVouchers } = await supabase
    .from('user_vouchers')
    .select('voucher_id, is_used')
    .eq('user_id', user.id) as unknown as { data: { voucher_id: string; is_used: boolean }[] | null }

  return (
    <VoucherClient
      profile={profile}
      vouchers={vouchers ?? []}
      userVouchers={userVouchers ?? []}
    />
  )
}
