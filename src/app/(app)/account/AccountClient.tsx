'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MapPin,
  CreditCard,
  HelpCircle,
  Settings,
  FileText,
  Shield,
  LogOut,
  ArrowUpRight,
  Users,
  Cake,
} from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { Eyebrow } from '@/components/ui'
import { updateBirthday } from './actions'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type Profile =
  | (Pick<ProfileRow, 'full_name' | 'email' | 'phone' | 'loyalty_points' | 'tier' | 'referral_code'> & {
      birthday?: string | null
    })
  | null

interface AccountClientProps {
  profile: Profile
}

const TIER_LABEL: Record<string, string> = {
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}

const menuItems = [
  { icon: MapPin, label: 'Saved addresses' },
  { icon: CreditCard, label: 'Payment methods' },
  { icon: HelpCircle, label: 'Help centre' },
  { icon: Settings, label: 'Preferences' },
  { icon: FileText, label: 'Terms & conditions' },
  { icon: Shield, label: 'Privacy policy' },
]

export default function AccountClient({ profile }: AccountClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [birthday, setBirthday] = useState(profile?.birthday ?? '')
  const [saving, startSaving] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function handleBirthdayChange(value: string) {
    setBirthday(value)
    setErr(null)
    startSaving(async () => {
      try {
        await updateBirthday(value || null)
        setSavedAt(Date.now())
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const tier = profile?.tier ?? 'silver'
  const tierLabel = TIER_LABEL[tier] ?? 'Silver'
  const points = profile?.loyalty_points ?? 0
  const initials = (profile?.full_name ?? 'Guest')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="page-enter min-h-screen bg-hd-cream pb-24">
      {/* Masthead */}
      <header className="px-5 pt-12 pb-6 border-b border-hd-ink/15">
        <Eyebrow number="05">Account</Eyebrow>
        <h1 className="mt-3 font-display text-display-lg text-hd-ink tracking-editorial">
          Your profile
        </h1>
      </header>

      {/* ── Profile card: burgundy with gold accent ── */}
      <section className="px-5 pt-6">
        <div className="relative overflow-hidden border border-hd-ink bg-hd-burgundy-dark text-hd-cream">
          <div className="texture-grain absolute inset-0 opacity-25" aria-hidden />
          <div
            className="absolute inset-0 opacity-60"
            aria-hidden
            style={{
              background:
                'radial-gradient(ellipse 60% 60% at 100% 0%, rgba(184,146,42,0.25), transparent 60%)',
            }}
          />
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 border border-hd-cream/40 flex items-center justify-center">
                  <span className="font-display italic text-[1.3rem] text-hd-cream">
                    {initials}
                  </span>
                </div>
                <div>
                  <span className="eyebrow text-hd-gold-light">Member · {tierLabel}</span>
                  <p className="mt-1 font-display text-[1.4rem] leading-tight tracking-editorial">
                    {profile?.full_name ?? 'Guest'}
                  </p>
                  <p className="text-[0.75rem] text-hd-cream/60 mt-1">
                    {profile?.phone ?? profile?.email ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            <hr className="my-5 border-hd-cream/20" />

            <div className="flex items-baseline justify-between">
              <div>
                <span className="eyebrow text-hd-cream/60">Points</span>
                <p className="numeral text-[2rem] leading-none mt-1 text-hd-cream">
                  {points.toLocaleString('en-US')}
                </p>
              </div>
              {profile?.referral_code && (
                <div className="text-right">
                  <span className="eyebrow text-hd-cream/60">Referral</span>
                  <p className="numeral text-[0.9rem] mt-1 text-hd-gold-light">
                    {profile.referral_code}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Personal details ── */}
      <section className="px-5 pt-8">
        <span className="eyebrow text-hd-ink/50 block mb-3">Personal</span>
        <div className="border-y border-hd-ink/10 divide-y divide-hd-ink/10">
          <div className="flex items-center gap-4 py-4">
            <Cake className="w-4 h-4 text-hd-burgundy" />
            <label htmlFor="acc-birthday" className="text-[0.9rem] text-hd-ink flex-1">
              Birthday
              <span className="block eyebrow text-hd-ink/45 mt-0.5 normal-case tracking-normal text-[0.7rem] italic">
                A treat awaits, every year.
              </span>
            </label>
            <input
              id="acc-birthday"
              type="date"
              value={birthday}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleBirthdayChange(e.target.value)}
              className="bg-transparent text-[0.9rem] text-hd-ink px-0 py-1 border-b border-hd-ink/30 focus:border-hd-ink focus:outline-none transition-colors"
            />
          </div>
          {(saving || savedAt || err) && (
            <div className="py-2 eyebrow text-[0.65rem]">
              {err ? (
                <span className="text-hd-burgundy">{err}</span>
              ) : saving ? (
                <span className="text-hd-ink/50">Saving…</span>
              ) : (
                <span className="text-hd-gold">Saved</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Referral teaser ── */}
      <section className="px-5 pt-8">
        <Link
          href="/voucher"
          className="group flex items-center justify-between py-4 border-b border-hd-ink/15 hover:border-hd-ink transition-colors"
        >
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-hd-burgundy" />
            <div>
              <p className="font-display italic text-[1rem] text-hd-ink">
                Share the Sip
              </p>
              <p className="eyebrow text-hd-ink/50 mt-1">
                Invitation, with reward
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-hd-ink/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </section>

      {/* ── Menu list ── */}
      <section className="px-5 pt-8">
        <span className="eyebrow text-hd-ink/50 block mb-3">Settings</span>
        <ul className="divide-y divide-hd-ink/10 border-y border-hd-ink/10">
          {menuItems.map(({ icon: Icon, label }, i) => (
            <li key={label}>
              <Link
                href="#"
                className="flex items-center gap-4 py-4 hover:bg-hd-paper transition-colors group"
              >
                <span className="numeral text-[0.65rem] text-hd-ink/40 tracking-widest w-8">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon className="w-4 h-4 text-hd-ink/50" />
                <span className="text-[0.9rem] text-hd-ink flex-1">{label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-hd-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Footer ── */}
      <section className="px-5 pt-10 flex flex-col items-center gap-3 text-center">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-hd-burgundy hover:text-hd-burgundy-dark transition-colors py-3 eyebrow"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
        <p className="numeral text-[0.65rem] text-hd-ink/30 tracking-widest">V. 1.0.0</p>
      </section>
    </div>
  )
}
