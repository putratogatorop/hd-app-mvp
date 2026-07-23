'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from '@/shims/next-navigation'
import { parseFilterSearchParams } from '@/lib/dashboard/filter-url'
import { getTransactionalMetrics, type TransactionalMetrics } from '@/lib/dashboard/real-metrics'
import { fetchStoresForFilter } from '@/lib/dashboard/semantic'
import type { FilterBarStore } from '@/components/analytics/FilterBar'
import TransactionalPageClient from './TransactionalPageClient'

export default function TransactionalPage() {
  const sp = useSearchParams()
  const [state, setState] = useState<{ metrics: TransactionalMetrics; stores: FilterBarStore[] } | null>(null)
  const spString = sp.toString()

  useEffect(() => {
    const { filters } = parseFilterSearchParams(Object.fromEntries(sp.entries()))
    let cancelled = false
    Promise.all([
      getTransactionalMetrics(filters),
      fetchStoresForFilter(),
    ]).then(([metrics, stores]) => {
      if (!cancelled) setState({ metrics, stores })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spString])

  if (!state) return null
  return <TransactionalPageClient metrics={state.metrics} stores={state.stores} />
}
