'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Login gagal. Coba lagi.')
      setLoading(false)
      return
    }

    // Fetch role to decide where to redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = (profile as { role?: string } | null)?.role ?? 'customer'

    router.refresh()
    if (role === 'staff' || role === 'admin') {
      router.push('/pos/orders')
    } else {
      router.push('/home')
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 bg-hd-cream">
      <div className="max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/logo/logo-transparent.png"
              alt="Häagen-Dazs"
              width={160}
              height={80}
            />
          </div>
          <h2 className="text-2xl font-bold text-hd-dark">Selamat Datang</h2>
          <p className="text-gray-500 text-sm mt-1">Login ke akun Häagen-Dazs kamu</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-hd-cream border border-hd-burgundy/20 text-hd-burgundy text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hd-burgundy bg-white"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hd-burgundy bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-hd-burgundy text-white font-semibold rounded-xl hover:bg-hd-burgundy-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </form>
      </div>
    </main>
  )
}
