'use client'

import { useCallback, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { encodeFilterPatch } from './filter-url'

/** Hook for charts that want to push a filter patch when clicked. */
export function useFilterPatch() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [pending, startTransition] = useTransition()

  const push = useCallback(
    (patch: Parameters<typeof encodeFilterPatch>[1]) => {
      const next = encodeFilterPatch(new URLSearchParams(sp.toString()), patch)
      const qs = next.toString()
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname)
      })
    },
    [sp, pathname, router],
  )

  /** Toggle a single value in a comma-list filter key. */
  const toggle = useCallback(
    (key: 'stores' | 'channels' | 'tiers', value: string) => {
      const current = (sp.get(key) ?? '').split(',').filter(Boolean)
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      // Cast is safe — encodeFilterPatch handles each key by name.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      push({ [key]: next } as any)
    },
    [sp, push],
  )

  return { push, toggle, pending }
}
