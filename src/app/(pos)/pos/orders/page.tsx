import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import RealtimeOrderQueue from './RealtimeOrderQueue'
import { Eyebrow } from '@/components/ui'

type OrderRow = Database['public']['Tables']['orders']['Row']

export const dynamic = 'force-dynamic'

export default async function PosOrdersPage() {
  const supabase = await createClient()

  const { data: orders } = (await supabase
    .from('orders')
    .select('*, order_items(quantity, unit_price, menu_items(name)), profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)) as unknown as {
    data:
      | (OrderRow & {
          order_items: { quantity: number; unit_price: number; menu_items: { name: string } | null }[]
          profiles: { full_name: string | null; email: string } | null
        })[]
      | null
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="border-b border-hd-ink/15 pb-5 mb-8 flex items-end justify-between">
        <div>
          <Eyebrow number="01">Live · Real time</Eyebrow>
          <h1 className="mt-3 font-display text-display-md text-hd-ink tracking-editorial">
            The <span className="italic">Queue</span>
          </h1>
        </div>
        <span className="numeral text-[0.7rem] text-hd-ink/50 tracking-widest pb-1">
          LAST 50 ORDERS
        </span>
      </header>
      <RealtimeOrderQueue initialOrders={orders ?? []} />
    </div>
  )
}
