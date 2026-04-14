import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRFMData, requireStaff } from '@/lib/dashboard/real-metrics'
import RFMClient from './RFMClient'

export const dynamic = 'force-dynamic'

export default async function RFMPage() {
  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) redirect('/login')
  if (role !== 'staff' && role !== 'admin') redirect('/home')

  const data = await getRFMData(supabase)

  return <RFMClient data={data} />
}
