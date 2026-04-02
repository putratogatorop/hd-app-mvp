import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/menu')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-hd-cream px-6">
      {/* Logo area */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-hd-red rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-3xl font-bold">HD</span>
        </div>
        <h1 className="text-3xl font-bold text-hd-dark tracking-tight">Häagen-Dazs</h1>
        <p className="text-gray-500 mt-2 text-sm">Premium Ice Cream Experience</p>
      </div>

      {/* Tagline */}
      <div className="text-center mb-10">
        <p className="text-lg text-gray-700 font-medium">Order. Earn. Reward.</p>
        <p className="text-sm text-gray-400 mt-1">Your loyalty, our pleasure.</p>
      </div>

      {/* CTA Buttons */}
      <div className="w-full max-w-xs space-y-3">
        <Link
          href="/login"
          className="block w-full text-center py-3 bg-hd-red text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="block w-full text-center py-3 border-2 border-hd-red text-hd-red font-semibold rounded-xl hover:bg-red-50 transition-colors"
        >
          Daftar Sekarang
        </Link>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-gray-400 text-center">
        Earn 1 point for every Rp 1.000 spent
      </p>
    </main>
  )
}
