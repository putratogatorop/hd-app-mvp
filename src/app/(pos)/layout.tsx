import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'
import PosTopNav from './PosTopNav'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = (await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()) as unknown as { data: Pick<ProfileRow, 'full_name' | 'role'> | null }

  if (!profile || !['staff', 'admin'].includes(profile.role)) {
    redirect('/menu')
  }

  return (
    <div className="min-h-screen bg-hd-cream">
      <PosTopNav staffName={profile.full_name ?? user.email ?? 'Staff'} />
      <main className="pt-16">{children}</main>
    </div>
  )
}
