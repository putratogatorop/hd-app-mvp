import { createClient } from '@/lib/supabase/server'
import MenuItemCard from './MenuItemCard'

export default async function MenuPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, loyalty_points, tier')
    .single()

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('category')

  const tierColor = {
    silver: 'text-gray-500',
    gold: 'text-yellow-600',
    platinum: 'text-blue-600',
  }[profile?.tier ?? 'silver']

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-hd-red px-6 pt-12 pb-6">
        <p className="text-red-200 text-sm">Selamat datang,</p>
        <h1 className="text-white text-2xl font-bold">{profile?.full_name ?? 'Pelanggan'} 👋</h1>
        <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
          <span className="text-white text-sm">⭐ {profile?.loyalty_points ?? 0} poin</span>
          <span className={`text-xs font-semibold capitalize ${tierColor} bg-white rounded-full px-2 py-0.5`}>
            {profile?.tier ?? 'Silver'}
          </span>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pt-6">
        <h2 className="text-lg font-bold text-hd-dark mb-4">Menu Ice Cream 🍨</h2>
        <div className="grid grid-cols-2 gap-3">
          {menuItems?.map(item => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
