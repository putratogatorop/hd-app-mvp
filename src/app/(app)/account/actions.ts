'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBirthday(birthday: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    throw new Error('Invalid date format')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { error } = await db
    .from('profiles')
    .update({ birthday: birthday || null })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/account')
  revalidatePath('/home')
}
