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

type WindowPreset = '7d' | '30d' | '90d' | '180d' | 'all'

function parseWindow(sp: Record<string, string | string[] | undefined>): WindowPreset {
  const w = Array.isArray(sp.w) ? sp.w[0] : sp.w
  if (w === '7d' || w === '30d' || w === '90d' || w === '180d' || w === 'all') return w
  return '90d'
}

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const windowPreset = parseWindow(sp)

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
      windowPreset={windowPreset}
    />
  )
}
