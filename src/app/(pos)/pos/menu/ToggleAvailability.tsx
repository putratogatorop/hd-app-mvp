'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ToggleAvailability({
  itemId,
  initialAvailable,
}: {
  itemId: string
  initialAvailable: boolean
}) {
  const [available, setAvailable] = useState(initialAvailable)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    const next = !available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('menu_items')
      .update({ is_available: next })
      .eq('id', itemId)
    if (!error) setAvailable(next)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-60 ${
        available ? 'bg-green-500' : 'bg-gray-300'
      }`}
      aria-label={available ? 'Tersedia' : 'Tidak Tersedia'}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          available ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
