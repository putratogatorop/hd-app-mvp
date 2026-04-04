'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Ticket,
  Info,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'
import type { Database } from '@/lib/supabase/database.types'

type Voucher = Database['public']['Tables']['vouchers']['Row']
type ProfileData = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'tier' | 'loyalty_points'
>

interface Props {
  profile: ProfileData | null
  vouchers: Voucher[]
  userVouchers: { voucher_id: string; is_used: boolean }[]
}

type MainTab = 'voucher' | 'plan' | 'rewards'
type VoucherFilter = 'semua' | 'diskon' | 'cashback' | 'delivery'

const TIER_CONFIG: Record<string, { label: string; emoji: string; nextTier: string | null; nextPoints: number | null }> = {
  silver: { label: 'Silver', emoji: '🥈', nextTier: 'Gold', nextPoints: 5000 },
  gold: { label: 'Gold', emoji: '🥇', nextTier: 'Platinum', nextPoints: 15000 },
  platinum: { label: 'Platinum', emoji: '💎', nextTier: null, nextPoints: null },
}

const MODE_LABEL: Record<string, string> = {
  pickup: 'Pick Up',
  delivery: 'Delivery',
  dinein: 'Dine-in',
}

const REWARDS = [
  { icon: '🎟️', name: 'Voucher Diskon 10%', cost: 500, color: 'bg-hd-cream' },
  { icon: '🍨', name: 'Free 1 Scoop Ice Cream', cost: 1000, color: 'bg-amber-50' },
  { icon: '🎁', name: 'HD Gift Box Special', cost: 2500, color: 'bg-purple-50' },
  { icon: '🎟️', name: 'Voucher Free Delivery', cost: 300, color: 'bg-hd-cream' },
]

const PLANS = [
  { tier: 'silver', icon: '🥈', name: 'Silver Plan', perks: ['10% off', 'All menu'], price: 'Rp29K', iconBg: 'bg-gray-100', featured: false },
  { tier: 'gold', icon: '🥇', name: 'Gold Plan', perks: ['20% off', 'Free ongkir'], price: 'Rp49K', iconBg: 'bg-amber-100', featured: true },
  { tier: 'platinum', icon: '💎', name: 'Platinum Plan', perks: ['25% off', 'Free ongkir', 'Gift'], price: 'Rp79K', iconBg: 'bg-violet-100', featured: false },
]

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: 'voucher', label: 'Voucher' },
  { key: 'plan', label: 'MyHD Plan' },
  { key: 'rewards', label: 'HD Rewards' },
]

const FILTERS: { key: VoucherFilter; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'diskon', label: 'Diskon' },
  { key: 'cashback', label: 'Cashback' },
  { key: 'delivery', label: 'Delivery' },
]

export default function VoucherClient({ profile, vouchers, userVouchers }: Props) {
  const router = useRouter()
  const { applyVoucher } = useCartStore()

  const [mainTab, setMainTab] = useState<MainTab>('voucher')
  const [filter, setFilter] = useState<VoucherFilter>('semua')
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  const tierKey = (profile?.tier ?? 'silver') as keyof typeof TIER_CONFIG
  const tier = TIER_CONFIG[tierKey]
  const points = profile?.loyalty_points ?? 0

  const userVoucherMap = new Map(userVouchers.map(uv => [uv.voucher_id, uv.is_used]))

  function filterVouchers(list: Voucher[]): Voucher[] {
    switch (filter) {
      case 'diskon':
        return list.filter(v => v.discount_type === 'percentage')
      case 'cashback':
        return list.filter(v => v.discount_type === 'fixed')
      case 'delivery':
        return list.filter(v => v.applicable_modes.includes('delivery'))
      default:
        return list
    }
  }

  const allFiltered = filterVouchers(vouchers)
  const belanjaVouchers = allFiltered.filter(
    v => v.applicable_modes.some(m => m === 'pickup' || m === 'dinein')
  )
  const deliveryOnlyVouchers = allFiltered.filter(
    v => v.applicable_modes.length === 1 && v.applicable_modes[0] === 'delivery'
  )

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

  return (
    <div className="min-h-screen bg-hd-cream pb-24">
      {/* Header */}
      <div className="bg-white pt-12 pb-4 text-center border-b border-gray-100">
        <h1 className="text-[17px] font-bold text-hd-dark">Voucher</h1>
      </div>

      {/* Promo code input */}
      <div className="mx-5 mt-4 flex items-center gap-2.5 bg-gray-100 rounded-[14px] p-1 pl-4">
        <div className="w-7 h-7 rounded-lg bg-hd-burgundy flex items-center justify-center flex-shrink-0">
          <Ticket size={14} className="text-white" />
        </div>
        <input
          type="text"
          value={codeInput}
          onChange={e => { setCodeInput(e.target.value); setCodeError(null) }}
          placeholder="Punya kode promo? Masukkan disini"
          className="flex-1 bg-transparent text-sm text-hd-dark placeholder:text-gray-400 outline-none"
        />
        <button
          onClick={handleCodeSubmit}
          className="bg-hd-burgundy text-white text-xs font-bold px-4 py-2.5 rounded-[10px] flex-shrink-0"
        >
          Gunakan
        </button>
      </div>
      {codeError && (
        <p className="mx-5 mt-2 text-red-500 text-xs">{codeError}</p>
      )}

      {/* Main tabs */}
      <div className="flex border-b-2 border-gray-100 mt-4 px-5">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className={`flex-1 text-center pb-3 text-[13px] font-semibold relative transition-colors ${
              mainTab === tab.key ? 'text-hd-burgundy' : 'text-gray-400'
            }`}
          >
            {tab.label}
            {mainTab === tab.key && (
              <span className="absolute bottom-[-2px] left-[20%] right-[20%] h-[2.5px] bg-hd-burgundy rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* TAB: Voucher */}
      {mainTab === 'voucher' && (
        <div>
          {/* Pill filters */}
          <div className="flex gap-2 px-5 pt-4 overflow-x-auto scrollbar-none">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 px-4 py-[7px] rounded-full text-xs font-semibold border-[1.5px] transition-all ${
                  filter === f.key
                    ? 'bg-hd-burgundy text-white border-hd-burgundy'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Voucher Belanja section */}
          {belanjaVouchers.length > 0 && (
            <>
              <div className="flex justify-between items-center px-5 pt-5 pb-3">
                <h2 className="text-base font-extrabold text-hd-dark">Voucher Belanja</h2>
                <span className="text-[13px] text-gray-400">{belanjaVouchers.length} voucher</span>
              </div>
              <div className="space-y-3 px-5">
                {belanjaVouchers.map(v => (
                  <VoucherCard
                    key={v.id}
                    voucher={v}
                    isUsed={userVoucherMap.get(v.id) === true}
                    onUse={() => handleUseVoucher(v)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Info banner + Voucher Delivery section */}
          {deliveryOnlyVouchers.length > 0 && (
            <>
              <div className="mx-5 mt-4 mb-1 bg-blue-50 rounded-xl p-3 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Info size={14} className="text-blue-500" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Voucher delivery hanya bisa kamu gunakan pada halaman checkout
                </p>
              </div>
              <div className="flex justify-between items-center px-5 pt-4 pb-3">
                <h2 className="text-base font-extrabold text-hd-dark">Voucher Delivery</h2>
                <span className="text-[13px] text-gray-400">{deliveryOnlyVouchers.length} voucher</span>
              </div>
              <div className="space-y-3 px-5">
                {deliveryOnlyVouchers.map(v => (
                  <VoucherCard
                    key={v.id}
                    voucher={v}
                    isUsed={userVoucherMap.get(v.id) === true}
                    onUse={() => handleUseVoucher(v)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {allFiltered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Ticket size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada voucher tersedia</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: MyHD Plan */}
      {mainTab === 'plan' && (
        <div>
          {/* Hero */}
          <div className="mx-5 mt-4 rounded-[20px] overflow-hidden bg-gradient-to-br from-hd-burgundy-dark via-hd-burgundy to-hd-burgundy-light p-7 relative">
            <div className="absolute top-[-40px] right-[-20px] w-[140px] h-[140px] rounded-full border border-[rgba(184,146,42,0.2)]" />
            <p className="text-[9px] font-bold tracking-[2px] uppercase text-[#D4AF5A] mb-2">
              ✨ Häagen-Dazs Exclusive
            </p>
            <h2 className="text-[22px] font-extrabold text-white leading-tight">
              Hematnya<br /><em className="italic text-[#F5E6C8]">Bikin Untung!</em>
            </h2>
            <p className="text-xs text-white/60 mt-1.5">Diskon spesial setiap hari tanpa batas</p>
          </div>

          {/* Plan cards */}
          <div className="px-5 mt-4 space-y-2.5">
            {PLANS.map(plan => (
              <div
                key={plan.tier}
                className={`rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden border-[1.5px] ${
                  plan.featured
                    ? 'border-hd-burgundy bg-hd-cream/50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.featured && (
                  <span className="absolute top-0 right-4 bg-hd-burgundy text-white text-[8px] font-extrabold tracking-[0.5px] px-2.5 py-[3px] rounded-b-lg">
                    POPULER
                  </span>
                )}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${plan.iconBg}`}>
                  {plan.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-hd-dark">{plan.name}</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {plan.perks.map(perk => (
                      <span
                        key={perk}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          plan.featured ? 'bg-hd-cream text-hd-burgundy' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-lg font-extrabold ${plan.featured ? 'text-hd-burgundy' : 'text-hd-dark'}`}>
                    {plan.price}
                  </p>
                  <p className="text-[10px] text-gray-400">/bulan</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-5 mt-5">
            <button className="w-full py-4 rounded-[14px] bg-gradient-to-r from-hd-burgundy to-hd-burgundy-dark text-white text-sm font-bold shadow-lg shadow-hd-burgundy/20">
              Langganan Sekarang!
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-2.5">
              Berlaku untuk pickup, delivery & dine-in
            </p>
          </div>
        </div>
      )}

      {/* TAB: HD Rewards */}
      {mainTab === 'rewards' && (
        <div>
          {/* Tier card */}
          <div className="mx-5 mt-4 rounded-[20px] overflow-hidden bg-gradient-to-br from-[#B8922A] to-[#8B6914] p-6 text-white relative">
            <div className="absolute top-[-30px] right-[-20px] w-[120px] h-[120px] rounded-full border border-white/15" />
            <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/60">Tier Saat Ini</p>
            <p className="text-2xl font-extrabold mt-0.5">{tier.emoji} {tier.label} Member</p>
            <div className="bg-white/15 rounded-xl p-3 mt-3.5">
              <p className="text-[10px] text-white/60">Total Poin</p>
              <p className="text-[28px] font-extrabold">{points.toLocaleString('id-ID')}</p>
            </div>
            {tier.nextPoints && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-white/50 mb-1.5">
                  <span>{points.toLocaleString('id-ID')} poin</span>
                  <span>{tier.nextTier}: {tier.nextPoints.toLocaleString('id-ID')}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((points / tier.nextPoints) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-center text-[10px] text-white/50 mt-1.5">
                  {(tier.nextPoints - points).toLocaleString('id-ID')} poin lagi ke {tier.nextTier}
                </p>
              </div>
            )}
            {!tier.nextPoints && (
              <p className="text-white/80 text-xs text-center mt-3">Kamu sudah di tier tertinggi! 🎉</p>
            )}
          </div>

          {/* Tukar Poin */}
          <h3 className="px-5 pt-5 pb-3 text-sm font-extrabold text-hd-dark">Tukar Poin</h3>
          <div className="px-5 space-y-2.5">
            {REWARDS.map(reward => (
              <div
                key={reward.name}
                className="bg-white rounded-[14px] p-3.5 flex items-center gap-3 border border-gray-100"
              >
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-lg flex-shrink-0 ${reward.color}`}>
                  {reward.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-hd-dark">{reward.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{reward.cost.toLocaleString('id-ID')} poin</p>
                </div>
                <button
                  onClick={() => alert('Segera hadir!')}
                  className="bg-gray-100 text-gray-500 text-[11px] font-bold px-3 py-[7px] rounded-lg"
                >
                  Tukar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function VoucherCard({
  voucher,
  isUsed,
  onUse,
}: {
  voucher: Voucher
  isUsed: boolean
  onUse: () => void
}) {
  const isPercentage = voucher.discount_type === 'percentage'
  const isDeliveryOnly = voucher.applicable_modes.length === 1 && voucher.applicable_modes[0] === 'delivery'

  const discountLabel = isPercentage
    ? `${voucher.discount_value}%`
    : `${Math.round(voucher.discount_value / 1000)}K`

  const validUntil = new Date(voucher.valid_until).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const badgeColor = isDeliveryOnly
    ? 'bg-gradient-to-b from-green-50 to-emerald-50'
    : 'bg-gradient-to-b from-hd-cream to-hd-cream'

  const discountColor = isDeliveryOnly ? 'text-emerald-600' : 'text-hd-burgundy'
  const labelColor = isDeliveryOnly ? 'text-emerald-300' : 'text-hd-burgundy/40'
  const contextColor = isDeliveryOnly ? 'text-emerald-600' : 'text-hd-burgundy'
  const btnColor = isDeliveryOnly ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-hd-burgundy hover:bg-hd-burgundy-dark'

  const contextLabel = isDeliveryOnly ? 'Delivery GoSend' : 'Pakai di App'

  return (
    <div className={`bg-white rounded-2xl overflow-hidden border border-gray-100 flex ${isUsed ? 'opacity-50' : ''}`}>
      {/* Left badge */}
      <div className={`w-[72px] flex flex-col items-center justify-center p-3 relative flex-shrink-0 ${badgeColor}`}>
        <div className="absolute right-0 top-3 bottom-3 border-r-[1.5px] border-dashed border-gray-200" />
        <span className={`text-[22px] font-extrabold leading-none ${discountColor}`}>{discountLabel}</span>
        <span className={`text-[9px] font-bold uppercase tracking-[0.5px] mt-0.5 ${labelColor}`}>
          {isPercentage ? 'Diskon' : 'Potongan'}
        </span>
      </div>

      {/* Center info */}
      <div className="flex-1 py-3 px-4 min-w-0">
        <p className={`text-[10px] font-bold ${contextColor}`}>{contextLabel}</p>
        <p className="text-[13px] font-bold text-hd-dark leading-snug mt-0.5">{voucher.title}</p>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-1">{voucher.description}</p>
        <div className="flex gap-4 mt-2">
          <div>
            <p className="text-[9px] text-gray-300 font-semibold uppercase tracking-[0.3px]">Berlaku Hingga</p>
            <p className="text-[11px] text-gray-500 font-semibold">{validUntil}</p>
          </div>
          {voucher.min_order != null && voucher.min_order > 0 && (
            <div>
              <p className="text-[9px] text-gray-300 font-semibold uppercase tracking-[0.3px]">Min Transaksi</p>
              <p className="text-[11px] text-gray-500 font-semibold">{formatRupiah(voucher.min_order)}</p>
            </div>
          )}
        </div>
        {voucher.applicable_modes.length > 1 && (
          <div className="flex gap-1 mt-2">
            {voucher.applicable_modes.map(mode => (
              <span
                key={mode}
                className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                  isDeliveryOnly ? 'bg-emerald-50 text-emerald-600' : 'bg-hd-cream text-hd-burgundy'
                }`}
              >
                {MODE_LABEL[mode] ?? mode}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right action */}
      <div className="flex items-center pr-3.5 flex-shrink-0">
        <button
          onClick={onUse}
          disabled={isUsed}
          className={`text-[11px] font-bold px-3.5 py-2 rounded-[10px] text-white transition-colors ${
            isUsed ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : btnColor
          }`}
        >
          {isUsed ? 'Terpakai' : 'Pakai'}
        </button>
      </div>
    </div>
  )
}
