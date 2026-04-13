import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        const role = (profile as { role?: string } | null)?.role ?? 'customer'
        const dest = role === 'staff' || role === 'admin' ? '/pos/orders' : next
        return NextResponse.redirect(`${origin}${dest}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
