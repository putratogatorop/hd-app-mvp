'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from '@/shims/next-navigation'
import {
  fetchCampaign,
  fetchCampaignOutcomes,
  fetchCampaignIncrementality,
  fetchCampaignTargets,
} from '@/lib/dashboard/semantic/queries'
import type { Campaign, CampaignOutcome, CampaignTarget, Incrementality } from '@/lib/dashboard/semantic/types'
import CampaignDetailClient from './CampaignDetailClient'

interface State {
  campaign: Campaign | null
  outcome: CampaignOutcome | null
  incrementality: Incrementality | null
  targets: CampaignTarget[]
}

export default function CampaignDetailPage() {
  const sp = useSearchParams()
  const id = sp.get('id') ?? ''
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([
      fetchCampaign(id),
      fetchCampaignOutcomes(),
      fetchCampaignIncrementality(id),
      fetchCampaignTargets(id),
    ]).then(([campaign, allOutcomes, incrementality, targets]) => {
      if (cancelled) return
      const outcome = allOutcomes.find((o) => o.campaign_id === id) ?? null
      setState({ campaign, outcome, incrementality: incrementality[0] ?? null, targets })
    })
    return () => { cancelled = true }
  }, [id])

  if (!id) {
    return (
      <div style={{ padding: '2rem', color: 'var(--dash-text)', backgroundColor: 'var(--dash-bg)', minHeight: '100vh' }}>
        Missing campaign id.
      </div>
    )
  }
  if (!state) return null
  if (!state.campaign) {
    return (
      <div style={{ padding: '2rem', color: 'var(--dash-text)', backgroundColor: 'var(--dash-bg)', minHeight: '100vh' }}>
        Campaign not found.
      </div>
    )
  }

  return (
    <CampaignDetailClient
      campaign={state.campaign}
      outcome={state.outcome}
      incrementality={state.incrementality}
      targets={state.targets}
    />
  )
}
