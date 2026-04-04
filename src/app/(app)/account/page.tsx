import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountClient from './AccountClient'
import type { Database } from '@/lib/supabase/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, loyalty_points, tier, referral_code')
    .eq('id', user.id)
    .single() as unknown as { data: Pick<ProfileRow, 'full_name' | 'email' | 'phone' | 'loyalty_points' | 'tier' | 'referral_code'> | null }

  return <AccountClient profile={profile} />
}
