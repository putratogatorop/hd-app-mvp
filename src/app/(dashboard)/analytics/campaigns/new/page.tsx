import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireStaff, getRFMData } from '@/lib/dashboard/real-metrics'
import {
  fetchSegmentBaselines,
  fetchMenuItemMargins,
  fetchTradeSpendPacing,
} from '@/lib/dashboard/semantic/queries'
import SimulatorClient from './SimulatorClient'

export const dynamic = 'force-dynamic'

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) redirect('/login')
  if (role !== 'staff' && role !== 'admin') redirect('/home')

  const [rfm, baselines, margins, pacing] = await Promise.all([
    getRFMData(supabase),
    fetchSegmentBaselines(),
    fetchMenuItemMargins(),
    fetchTradeSpendPacing(),
  ])

  const segmentCounts: Record<string, number> = {}
  for (const s of rfm.segments) segmentCounts[s.name] = s.count

  return (
    <SimulatorClient
      segmentCounts={segmentCounts}
      baselines={baselines}
      margins={margins}
      pacing={pacing}
    />
  )
}
