import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SplashPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/home')

  return (
    <>
      <meta httpEquiv="refresh" content="1.5;url=/login" />
      <main className="min-h-screen flex flex-col items-center justify-center bg-hd-cream">
        <Image
          src="/logo/logo-haagen-daz.png"
          alt="Häagen-Dazs Logo"
          width={200}
          height={100}
          priority
        />
        <p className="mt-4 text-hd-burgundy font-semibold text-lg">Made Like No Other</p>
      </main>
    </>
  )
}
