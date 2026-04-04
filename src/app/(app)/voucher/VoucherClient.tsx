'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, Award, Users, Copy, Share2, Check } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'
import type { Database } from '@/lib/supabase/database.types'

type Voucher = Database['public']['Tables']['vouchers']['Row']
type ProfileData = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'tier' | 'referral_code' | 'loyalty_points'
>

interface Props {
  profile: ProfileData | null
  vouchers: Voucher[]
  userVouchers: { voucher_id: string; is_used: boolean }[]
}

const TIER_CONFIG = {
  silver: { label: 'Silver', color: 'from-gray-400 to-gray-500', emoji: '🥈', nextTier: 'Gold', nextPoints: 5000 },
  gold: { label: 'Gold', color: 'from-yellow-400 to-yellow-600', emoji: '🥇', nextTier: 'Platinum', nextPoints: 15000 },
  platinum: { label: 'Platinum', color: 'from-blue-400 to-indigo-600', emoji: '💎', nextTier: null, nextPoints: null },
}

const MODE_LABEL: Record<string, string> = {
  pickup: 'Pick Up',
  delivery: 'Delivery',
  dinein: 'Dine In',
}

type Tab = 'voucher' | 'rewards' | 'referral'

export default function VoucherClient({ profile, vouchers, userVouchers }: Props) {
  const router = useRouter()
  const { applyVoucher } = useCartStore()

  const [activeTab, setActiveTab] = useState<Tab>('voucher')
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const tierKey = (profile?.tier ?? 'silver') as keyof typeof TIER_CONFIG
  const tier = TIER_CONFIG[tierKey]
  const points = profile?.loyalty_points ?? 0
  const referralCode = profile?.referral_code ?? '—'

  const userVoucherMap = new Map(userVouchers.map(uv => [uv.voucher_id, uv.is_used]))

  const manualReferralVouchers = vouchers.filter(
    v => v.voucher_source === 'manual' || v.voucher_source === 'referral'
  )
  const tierVouchers = vouchers.filter(v => v.voucher_source === 'tier')

  function handleUseVoucher(voucher: Voucher) {
    applyVoucher(voucher)
    router.push('/menu')
  }

  function handleCodeSubmit() {
    setCodeError(null)
    const trimmed = codeInput.trim().toUpperCase()
    if (!trimmed) {
      setCodeError('Masukkan kode voucher terlebih dahulu.')
      return
    }
    const found = vouchers.find(v => v.code.toUpperCase() === trimmed)
    if (!found) {
      setCodeError('Kode voucher tidak ditemukan atau tidak aktif.')
      return
    }
    applyVoucher(found)
    router.push('/menu')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: ignore
    }
  }

  async function handleShare() {
    try {
      await navigator.share({
        title: 'Häagen-Dazs Referral',
        text: `Gunakan kode referral saya ${referralCode} di Häagen-Dazs dan dapatkan voucher spesial!`,
        url: window.location.origin,
      })
    } catch {
      // user cancelled or not supported
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'voucher', label: 'Voucher', icon: <Ticket size={15} /> },
    { key: 'rewards', label: 'My Rewards', icon: <Award size={15} /> },
    { key: 'referral', label: 'Referral', icon: <Users size={15} /> },
  ]

  return (
    <div className="page-enter min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-hd-red px-6 pt-12 pb-6">
        <h1 className="text-white text-2xl font-bold">Voucher & Hadiah</h1>
        <p className="text-red-200 text-sm mt-1">Hemat lebih banyak dengan voucher spesial</p>
      </div>

      {/* Pill tabs */}
      <div className="px-4 -mt-4">
        <div className="bg-gray-100 rounded-2xl p-1 flex gap-1 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-hd-red shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* ── TAB: Voucher ── */}
        {activeTab === 'voucher' && (
          <div className="space-y-4">
            {/* Code input */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-hd-dark mb-2">Punya kode voucher?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value); setCodeError(null) }}
                  placeholder="Masukkan kode di sini"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-hd-red transition-colors"
                />
                <button
                  onClick={handleCodeSubmit}
                  className="bg-hd-red text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors"
                >
                  Gunakan
                </button>
              </div>
              {codeError && (
                <p className="text-red-500 text-xs mt-2">{codeError}</p>
              )}
            </div>

            {/* Voucher list */}
            <div>
              <h3 className="text-sm font-bold text-hd-dark mb-3">Voucher Tersedia</h3>
              {manualReferralVouchers.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Ticket size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Belum ada voucher tersedia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {manualReferralVouchers.map(v => {
                    const isUsed = userVoucherMap.get(v.id) === true
                    return (
                      <VoucherCard
                        key={v.id}
                        voucher={v}
                        isUsed={isUsed}
                        onUse={() => handleUseVoucher(v)}
                        goldStyle={false}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: My Rewards ── */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            {/* Tier card */}
            <div className={`bg-gradient-to-br ${tier.color} rounded-2xl p-5 text-white shadow-md`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">{tier.emoji}</span>
                <div>
                  <p className="text-xs text-white/70 uppercase tracking-wide">Tier Saat Ini</p>
                  <p className="text-xl font-bold">{tier.label} Member</p>
                </div>
              </div>
              <div className="bg-white/20 rounded-xl p-3 mb-3">
                <p className="text-white/70 text-xs">Total Poin</p>
                <p className="text-2xl font-bold">{points.toLocaleString('id-ID')}</p>
              </div>
              {tier.nextPoints && (
                <div>
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>{points.toLocaleString('id-ID')} poin</span>
                    <span>{tier.nextTier}: {tier.nextPoints.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((points / tier.nextPoints) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-white/70 text-xs mt-1.5 text-center">
                    {(tier.nextPoints - points).toLocaleString('id-ID')} poin lagi ke {tier.nextTier}
                  </p>
                </div>
              )}
              {!tier.nextPoints && (
                <p className="text-white/80 text-xs text-center">Kamu sudah di tier tertinggi! 🎉</p>
              )}
            </div>

            {/* Tier vouchers */}
            <div>
              <h3 className="text-sm font-bold text-hd-dark mb-3">Voucher Eksklusif Tier</h3>
              {tierVouchers.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Award size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Belum ada reward tier tersedia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tierVouchers.map(v => {
                    const isUsed = userVoucherMap.get(v.id) === true
                    return (
                      <VoucherCard
                        key={v.id}
                        voucher={v}
                        isUsed={isUsed}
                        onUse={() => handleUseVoucher(v)}
                        goldStyle
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Referral ── */}
        {activeTab === 'referral' && (
          <div className="space-y-4">
            {/* Hero */}
            <div className="bg-gradient-to-br from-hd-red to-red-700 rounded-2xl p-5 text-white shadow-md text-center">
              <Users size={36} className="mx-auto mb-2 opacity-90" />
              <h2 className="text-xl font-bold">Ajak Teman, Dapat Voucher!</h2>
              <p className="text-red-200 text-sm mt-1">
                Bagikan kode referralmu dan dapatkan voucher eksklusif untuk setiap teman yang bergabung.
              </p>
            </div>

            {/* Referral code */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Kode Referral Kamu</p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border-2 border-dashed border-gray-200">
                <span className="flex-1 text-xl font-bold text-hd-dark tracking-widest text-center">
                  {referralCode}
                </span>
              </div>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Tersalin!' : 'Salin Kode'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-hd-red text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
                >
                  <Share2 size={16} />
                  Bagikan
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-hd-dark mb-4">Cara Kerja Referral</h3>
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: 'Bagikan Kode',
                    desc: 'Kirim kode referral unikmu ke teman atau keluarga.',
                  },
                  {
                    step: 2,
                    title: 'Teman Daftar',
                    desc: 'Teman mendaftar dan memasukkan kode referralmu saat registrasi.',
                  },
                  {
                    step: 3,
                    title: 'Dapat Voucher',
                    desc: 'Kamu dan temanmu mendapatkan voucher diskon eksklusif!',
                  },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-hd-red text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-hd-dark text-sm">{item.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-component: VoucherCard ──
function VoucherCard({
  voucher,
  isUsed,
  onUse,
  goldStyle,
}: {
  voucher: Voucher
  isUsed: boolean
  onUse: () => void
  goldStyle: boolean
}) {
  const isPercentage = voucher.discount_type === 'percentage'
  const discountLabel = isPercentage
    ? `${voucher.discount_value}%`
    : formatRupiah(voucher.discount_value)

  const validUntil = new Date(voucher.valid_until).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      className={`rounded-2xl shadow-sm overflow-hidden border ${
        goldStyle
          ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50'
          : 'border-gray-100 bg-white'
      } ${isUsed ? 'opacity-50' : ''}`}
    >
      <div className="flex">
        {/* Discount badge */}
        <div
          className={`flex flex-col items-center justify-center px-4 py-4 min-w-[72px] ${
            goldStyle
              ? 'bg-gradient-to-b from-yellow-400 to-amber-500'
              : 'bg-hd-red'
          }`}
        >
          <span className="text-white font-black text-lg leading-none">{discountLabel}</span>
          <span className="text-white/80 text-[10px] mt-0.5">{isPercentage ? 'Diskon' : 'Potongan'}</span>
        </div>

        {/* Info */}
        <div className="flex-1 px-3 py-3">
          <p className={`font-bold text-sm ${goldStyle ? 'text-amber-800' : 'text-hd-dark'}`}>
            {voucher.title}
          </p>
          {voucher.min_order && (
            <p className="text-xs text-gray-400 mt-0.5">
              Min. order {formatRupiah(voucher.min_order)}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">Berlaku s/d {validUntil}</p>

          {/* Applicable modes pills */}
          {voucher.applicable_modes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {voucher.applicable_modes.map(mode => (
                <span
                  key={mode}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    goldStyle
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-50 text-hd-red'
                  }`}
                >
                  {MODE_LABEL[mode] ?? mode}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action */}
        <div className="flex items-center pr-3">
          <button
            onClick={onUse}
            disabled={isUsed}
            className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
              isUsed
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : goldStyle
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-hd-red text-white hover:bg-red-700'
            }`}
          >
            {isUsed ? 'Terpakai' : 'Gunakan'}
          </button>
        </div>
      </div>
    </div>
  )
}
