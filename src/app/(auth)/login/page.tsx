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

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

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
            <Image
              src="/logo/logo-transparent.png"
              alt="Häagen-Dazs"
              width={120}
              height={32}
              priority
              className="h-8 w-auto object-contain"
            />
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

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-6 w-full min-h-[52px] flex items-center justify-center gap-3 bg-hd-paper border border-hd-ink/25 text-hd-ink hover:border-hd-ink hover:bg-hd-cream-deep transition-colors disabled:opacity-60 px-5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"/>
            </svg>
            <span className="font-display text-[0.95rem] tracking-editorial">
              Continue with Google
            </span>
          </button>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-hd-ink/15" />
            <span className="eyebrow text-hd-ink/40 text-[0.65rem]">or with email</span>
            <span className="h-px flex-1 bg-hd-ink/15" />
          </div>

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
              className="w-full min-h-[52px] py-4 bg-hd-burgundy text-hd-cream border border-hd-burgundy eyebrow tracking-wider hover:bg-hd-burgundy-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
            >
              <span>{loading ? 'Signing in…' : 'Enter'}</span>
              <span className="numeral text-[0.6rem] opacity-70">→</span>
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-[0.78rem]">
            <button
              type="button"
              onClick={() => setError('Password reset is coming soon. Please contact support.')}
              className="text-hd-ink/60 hover:text-hd-burgundy transition-colors underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
            <span className="text-hd-ink/50">
              New here?{' '}
              <a href="mailto:support@haagendazs.co.id" className="text-hd-burgundy hover:text-hd-burgundy-dark underline-offset-4 hover:underline">
                Request access
              </a>
            </span>
          </div>

          <p className="mt-10 text-center text-[0.7rem] text-hd-ink/40 tracking-widest uppercase">
            © Häagen-Dazs Indonesia · Est. 1960
          </p>
        </div>
      </section>
    </main>
  )
}
