import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOverviewRealData, requireStaff, type Period } from '@/lib/dashboard/real-metrics'
import OverviewClient from './OverviewClient'

export const dynamic = 'force-dynamic'

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const sp = await searchParams
  const raw = sp.period
  const period: Period = raw === '7d' || raw === '90d' ? raw : '30d'

  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) redirect('/login')
  if (role !== 'staff' && role !== 'admin') redirect('/home')

  const data = await getOverviewRealData(supabase, period)

  return <OverviewClient period={period} data={data} />
}
