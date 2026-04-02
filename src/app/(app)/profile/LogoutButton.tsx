'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full bg-red-50 rounded-xl px-4 py-3 flex items-center gap-3 text-left hover:bg-red-100 transition-colors"
    >
      <span className="text-xl">🚪</span>
      <span className="text-sm font-semibold text-hd-red">Keluar</span>
    </button>
  )
}
