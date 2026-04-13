'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
      setError('Login failed. Please try again.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = (profile as { role?: string } | null)?.role ?? 'customer'
    router.refresh()
    router.push(role === 'staff' || role === 'admin' ? '/pos/orders' : '/home')
  }

  return (
    <main className="min-h-screen grid grid-rows-[1fr_auto] bg-hd-cream">
      {/* ── Upper pane: burgundy masthead ── */}
      <section className="relative overflow-hidden bg-hd-burgundy-dark text-hd-cream">
        <div className="texture-grain absolute inset-0 opacity-30" aria-hidden />
        <div
          className="absolute inset-0 opacity-70"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 80% 0%, rgba(184,146,42,0.3), transparent 60%), radial-gradient(ellipse 60% 60% at 0% 100%, rgba(128,18,55,0.55), transparent 70%)',
          }}
        />
        <div className="relative px-6 pt-16 pb-12 flex flex-col gap-10 min-h-[55vh]">
          <div className="flex items-center justify-between border-b border-hd-cream/25 pb-3">
            <span className="eyebrow text-hd-cream/80">Häagen-Dazs · Est. 1961</span>
            <span className="numeral text-[0.6rem] text-hd-cream/70 tracking-widest">ACCESS</span>
          </div>

          <div className="stagger mt-auto">
            <p className="eyebrow text-hd-gold-light">A small luxury</p>
            <h1 className="mt-5 font-display text-display-lg leading-[0.9] tracking-editorial">
              Welcome<br />
              <span className="italic">back.</span>
            </h1>
            <p className="mt-5 max-w-sm text-[0.9rem] leading-relaxed text-hd-cream/75">
              Sign in to continue where you left off — points, orders, and all the flavours you love.
            </p>
          </div>
        </div>
      </section>

      {/* ── Lower pane: form ── */}
      <section className="relative bg-hd-paper px-6 pt-10 pb-12 border-t border-hd-ink/15">
        <div className="max-w-sm mx-auto w-full">
          <span className="eyebrow text-hd-ink/60">Sign in</span>

          <form onSubmit={handleLogin} className="mt-6 space-y-6">
            {error && (
              <div className="border border-hd-burgundy/30 bg-hd-burgundy/5 text-hd-burgundy text-[0.8rem] px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="eyebrow text-hd-ink/60 block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full h-12 bg-transparent border-b border-hd-ink/30 px-0 text-[0.95rem] placeholder:text-hd-ink/30 focus:outline-none focus:border-hd-ink transition-colors"
              />
            </div>

            <div>
              <label className="eyebrow text-hd-ink/60 block mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 bg-transparent border-b border-hd-ink/30 px-0 text-[0.95rem] placeholder:text-hd-ink/30 focus:outline-none focus:border-hd-ink transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 py-4 bg-hd-burgundy text-hd-cream border border-hd-burgundy eyebrow tracking-wider hover:bg-hd-burgundy-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
            >
              <span>{loading ? 'Signing in…' : 'Enter'}</span>
              <span className="numeral text-[0.6rem] opacity-70">→</span>
            </button>
          </form>

          <p className="mt-8 text-center text-[0.7rem] text-hd-ink/40 tracking-widest uppercase">
            © Häagen-Dazs Indonesia
          </p>
        </div>
      </section>
    </main>
  )
}
