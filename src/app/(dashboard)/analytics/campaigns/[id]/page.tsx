import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { requireStaff } from '@/lib/dashboard/real-metrics'
import {
  fetchCampaign,
  fetchCampaignOutcomes,
  fetchCampaignIncrementality,
  fetchCampaignTargets,
} from '@/lib/dashboard/semantic/queries'
import CampaignDetailClient from './CampaignDetailClient'

export const dynamic = 'force-dynamic'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) redirect('/login')
  if (role !== 'staff' && role !== 'admin') redirect('/home')

  const [campaign, allOutcomes, incrementality, targets] = await Promise.all([
    fetchCampaign(id),
    fetchCampaignOutcomes(),
    fetchCampaignIncrementality(id),
    fetchCampaignTargets(id),
  ])

  if (!campaign) notFound()
  const outcome = allOutcomes.find((o) => o.campaign_id === id) ?? null
  const inc = incrementality[0] ?? null

  return (
    <CampaignDetailClient
      campaign={campaign}
      outcome={outcome}
      incrementality={inc}
      targets={targets}
    />
  )
}
