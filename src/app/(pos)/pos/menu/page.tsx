import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import ToggleAvailability from './ToggleAvailability'
import { Eyebrow } from '@/components/ui'

type MenuItemRow = Database['public']['Tables']['menu_items']['Row']

export const dynamic = 'force-dynamic'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

const CATEGORY_LABELS: Record<string, string> = {
  ice_cream: 'Ice Cream',
  cake: 'Patisserie',
  beverage: 'Beverage',
  topping: 'Topping',
}

export default async function PosMenuPage() {
  const supabase = await createClient()

  const { data: items } = (await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('name')) as unknown as { data: MenuItemRow[] | null }

  const grouped: Record<string, MenuItemRow[]> = {}
  for (const item of items ?? []) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  const availableCount = items?.filter((i) => i.is_available).length ?? 0
  const totalCount = items?.length ?? 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="border-b border-hd-ink/15 pb-5 mb-8 flex items-end justify-between">
        <div>
          <Eyebrow number="02">Inventory</Eyebrow>
          <h1 className="mt-3 font-display text-display-md text-hd-ink tracking-editorial">
            Menu <span className="italic">management</span>
          </h1>
        </div>
        <div className="text-right pb-1">
          <span className="numeral text-[1.3rem] text-hd-ink">
            {String(availableCount).padStart(2, '0')}
          </span>
          <span className="numeral text-[0.9rem] text-hd-ink/50"> / {totalCount}</span>
          <p className="eyebrow text-hd-ink/50 mt-1">Available</p>
        </div>
      </header>

      <div className="space-y-12">
        {Object.entries(grouped).map(([category, categoryItems], catIdx) => (
          <section key={category}>
            <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3 mb-1">
              <Eyebrow number={String(catIdx + 1).padStart(2, '0')}>
                {CATEGORY_LABELS[category] ?? category}
              </Eyebrow>
              <span className="numeral text-[0.7rem] text-hd-ink/50">
                {String(categoryItems.length).padStart(2, '0')} items
              </span>
            </div>
            <ul className="divide-y divide-hd-ink/10">
              {categoryItems.map((item, index) => (
                <li
                  key={item.id}
                  className={`py-4 flex items-center gap-5 ${
                    !item.is_available ? 'opacity-50' : ''
                  }`}
                >
                  <span className="numeral text-[0.65rem] text-hd-ink/40 tracking-widest w-8">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[1.05rem] text-hd-ink tracking-editorial leading-tight">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-[0.75rem] text-hd-ink/55 italic font-display line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="numeral text-[0.95rem] text-hd-ink">
                      {formatRupiah(item.price)}
                    </p>
                    <p className="numeral text-[0.7rem] text-hd-ink/45 mt-0.5">
                      +{Math.floor(item.price / 1000)} pts
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`eyebrow hidden sm:block ${
                        item.is_available ? 'text-emerald-700' : 'text-hd-ink/40'
                      }`}
                    >
                      {item.is_available ? 'On' : 'Off'}
                    </span>
                    <ToggleAvailability
                      itemId={item.id}
                      initialAvailable={item.is_available}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
