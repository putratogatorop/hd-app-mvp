import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireStaff, getRFMData } from '@/lib/dashboard/real-metrics'
import {
  fetchCampaignOutcomes,
  fetchSegmentBaselines,
  fetchTradeSpendPacing,
} from '@/lib/dashboard/semantic/queries'
import CampaignsClient from './CampaignsClient'

export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) redirect('/login')
  if (role !== 'staff' && role !== 'admin') redirect('/home')

  const [outcomes, baselines, pacing, rfm] = await Promise.all([
    fetchCampaignOutcomes(),
    fetchSegmentBaselines(),
    fetchTradeSpendPacing(),
    getRFMData(supabase),
  ])

  const rfmBySegment = new Map<string, number>()
  for (const s of rfm.segments) rfmBySegment.set(s.name, s.count)

  return (
    <CampaignsClient
      outcomes={outcomes}
      baselines={baselines}
      pacing={pacing}
      rfmBySegment={Object.fromEntries(rfmBySegment)}
    />
  )
}
