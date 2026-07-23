'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from '@/shims/next-navigation'
import { getRFMData } from '@/lib/dashboard/real-metrics'
import {
  fetchCampaignOutcomes,
  fetchSegmentBaselines,
  fetchTradeSpendPacing,
} from '@/lib/dashboard/semantic/queries'
import type { CampaignOutcome, SegmentBaseline, TradeSpendPacing } from '@/lib/dashboard/semantic/types'
import CampaignsClient from './CampaignsClient'

type WindowPreset = '7d' | '30d' | '90d' | '180d' | 'all'

function parseWindow(w: string | null): WindowPreset {
  if (w === '7d' || w === '30d' || w === '90d' || w === '180d' || w === 'all') return w
  return '90d'
}

interface State {
  outcomes: CampaignOutcome[]
  baselines: SegmentBaseline[]
  pacing: TradeSpendPacing[]
  rfmBySegment: Record<string, number>
}

export default function CampaignsPage() {
  const sp = useSearchParams()
  const windowPreset = parseWindow(sp.get('w'))
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchCampaignOutcomes(),
      fetchSegmentBaselines(),
      fetchTradeSpendPacing(),
      getRFMData(),
    ]).then(([outcomes, baselines, pacing, rfm]) => {
      if (cancelled) return
      const rfmBySegment: Record<string, number> = {}
      for (const s of rfm.segments) rfmBySegment[s.name] = s.count
      setState({ outcomes, baselines, pacing, rfmBySegment })
    })
    return () => { cancelled = true }
  }, [])

  if (!state) return null
  return (
    <CampaignsClient
      outcomes={state.outcomes}
      baselines={state.baselines}
      pacing={state.pacing}
      rfmBySegment={state.rfmBySegment}
      windowPreset={windowPreset}
    />
  )
}
