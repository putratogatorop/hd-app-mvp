import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import ToggleAvailability from './ToggleAvailability'

type MenuItemRow = Database['public']['Tables']['menu_items']['Row']

export const dynamic = 'force-dynamic'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(n)
}

const CATEGORY_LABELS: Record<string, string> = {
  ice_cream: '🍨 Ice Cream',
  cake: '🎂 Cake',
  beverage: '🥤 Beverage',
  topping: '🍫 Topping',
}

export default async function PosMenuPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('name') as unknown as { data: MenuItemRow[] | null }

  // Group by category
  const grouped: Record<string, MenuItemRow[]> = {}
  for (const item of items ?? []) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  const availableCount = items?.filter(i => i.is_available).length ?? 0
  const totalCount = items?.length ?? 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-hd-dark">Menu Management</h1>
          <p className="text-gray-500 text-sm">
            {availableCount}/{totalCount} items available
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category}>
            <h2 className="text-base font-bold text-gray-500 uppercase tracking-wide mb-3">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              {categoryItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 ${
                    index < categoryItems.length - 1 ? 'border-b border-gray-50' : ''
                  } ${!item.is_available ? 'opacity-60' : ''}`}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 bg-gradient-to-br from-hd-cream to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🍨</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-hd-dark text-sm">{item.name}</p>
                    <p className="text-gray-400 text-xs line-clamp-1">{item.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right mr-4 hidden sm:block">
                    <p className="font-bold text-hd-burgundy text-sm">{formatRupiah(item.price)}</p>
                    <p className="text-gray-300 text-xs">
                      +{Math.floor(item.price / 1000)} pts
                    </p>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium hidden sm:block ${item.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                      {item.is_available ? 'Tersedia' : 'Habis'}
                    </span>
                    <ToggleAvailability
                      itemId={item.id}
                      initialAvailable={item.is_available}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
