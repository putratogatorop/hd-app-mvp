'use client'

import { useEffect, useState } from 'react'
import { getRFMData } from '@/lib/dashboard/real-metrics'
import {
  fetchSegmentBaselines,
  fetchMenuItemMargins,
  fetchTradeSpendPacing,
} from '@/lib/dashboard/semantic/queries'
import type { SegmentBaseline, MenuItemMargin, TradeSpendPacing } from '@/lib/dashboard/semantic/types'
import SimulatorClient from './SimulatorClient'

interface State {
  segmentCounts: Record<string, number>
  baselines: SegmentBaseline[]
  margins: MenuItemMargin[]
  pacing: TradeSpendPacing[]
}

export default function CampaignsNewPage() {
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getRFMData(),
      fetchSegmentBaselines(),
      fetchMenuItemMargins(),
      fetchTradeSpendPacing(),
    ]).then(([rfm, baselines, margins, pacing]) => {
      if (cancelled) return
      const segmentCounts: Record<string, number> = {}
      for (const s of rfm.segments) segmentCounts[s.name] = s.count
      setState({ segmentCounts, baselines, margins, pacing })
    })
    return () => { cancelled = true }
  }, [])

  if (!state) return null
  return (
    <SimulatorClient
      segmentCounts={state.segmentCounts}
      baselines={state.baselines}
      margins={state.margins}
      pacing={state.pacing}
    />
  )
}
