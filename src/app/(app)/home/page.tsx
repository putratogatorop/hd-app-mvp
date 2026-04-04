import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import HomeClient from './HomeClient'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type MenuItemRow = Database['public']['Tables']['menu_items']['Row']
type StoreRow = Database['public']['Tables']['stores']['Row']

export default async function HomePage() {
  const supabase = await createClient()

  const { data: profile } = (await supabase
    .from('profiles')
    .select('full_name, loyalty_points, tier, referral_code')
    .single()) as unknown as {
    data: Pick<ProfileRow, 'full_name' | 'loyalty_points' | 'tier' | 'referral_code'> | null
  }

  const { data: menuItems } = (await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('category')
    .limit(8)) as unknown as { data: MenuItemRow[] | null }

  const { data: stores } = (await supabase
    .from('stores')
    .select('*')
    .order('is_open', { ascending: false })) as unknown as { data: StoreRow[] | null }

  const { count: voucherCount } = await supabase
    .from('vouchers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return (
    <HomeClient
      profile={profile}
      featuredItems={menuItems ?? []}
      stores={stores ?? []}
      voucherCount={voucherCount ?? 0}
    />
  )
}
