'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex flex-col justify-center px-6 bg-hd-cream">
        <div className="max-w-sm mx-auto w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-hd-dark">Akun Berhasil Dibuat!</h2>
          <p className="text-gray-500 text-sm mt-2">
            Cek email kamu untuk konfirmasi pendaftaran, lalu login.
          </p>
          <Link
            href="/login"
            className="mt-6 block w-full py-3 bg-hd-red text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            Ke Halaman Login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 bg-hd-cream">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-hd-red rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">HD</span>
          </div>
          <h2 className="text-2xl font-bold text-hd-dark">Buat Akun</h2>
          <p className="text-gray-500 text-sm mt-1">Mulai kumpulkan poin loyalty kamu</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hd-red bg-white"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hd-red bg-white"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hd-red bg-white"
              placeholder="Min. 8 karakter"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-hd-red text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Membuat akun...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-hd-red font-semibold">
            Login
          </Link>
        </p>
      </div>
    </main>
  )
}
