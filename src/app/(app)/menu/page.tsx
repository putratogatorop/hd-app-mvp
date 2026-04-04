import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import MenuClient from './MenuClient'

type MenuItemRow = Database['public']['Tables']['menu_items']['Row']

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('name') as unknown as { data: MenuItemRow[] | null }

  return <MenuClient items={menuItems ?? []} />
}
