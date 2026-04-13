'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, Info, ArrowUpRight } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'
import type { Database } from '@/lib/supabase/database.types'
import { Eyebrow } from '@/components/ui'

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
type VoucherFilter = 'all' | 'discount' | 'cashback' | 'delivery'

const TIER_CONFIG: Record<string, { label: string; nextTier: string | null; nextPoints: number | null }> = {
  silver: { label: 'Silver', nextTier: 'Gold', nextPoints: 5000 },
  gold: { label: 'Gold', nextTier: 'Platinum', nextPoints: 15000 },
  platinum: { label: 'Platinum', nextTier: null, nextPoints: null },
}

const MODE_LABEL: Record<string, string> = {
  pickup: 'Pick Up',
  delivery: 'Delivery',
  dinein: 'Dine-in',
}

const REWARDS = [
  { name: 'Voucher — 10% off', cost: 500 },
  { name: 'A complimentary scoop', cost: 1000 },
  { name: 'HD Gift Box · Special', cost: 2500 },
  { name: 'Voucher — Free delivery', cost: 300 },
]

const PLANS = [
  { tier: 'silver', name: 'Silver Plan', roman: 'I', perks: ['10% off · all menu'], price: 'Rp 29K', featured: false },
  { tier: 'gold', name: 'Gold Plan', roman: 'II', perks: ['20% off', 'Free delivery'], price: 'Rp 49K', featured: true },
  { tier: 'platinum', name: 'Platinum Plan', roman: 'III', perks: ['25% off', 'Free delivery', 'Seasonal gift'], price: 'Rp 79K', featured: false },
]

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: 'voucher', label: 'Vouchers' },
  { key: 'plan', label: 'MyHD Plan' },
  { key: 'rewards', label: 'Rewards' },
]

const FILTERS: { key: VoucherFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'discount', label: 'Discount' },
  { key: 'cashback', label: 'Cashback' },
  { key: 'delivery', label: 'Delivery' },
]

export default function VoucherClient({ profile, vouchers, userVouchers }: Props) {
  const router = useRouter()
  const { applyVoucher } = useCartStore()

  const [mainTab, setMainTab] = useState<MainTab>('voucher')
  const [filter, setFilter] = useState<VoucherFilter>('all')
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  const tierKey = (profile?.tier ?? 'silver') as keyof typeof TIER_CONFIG
  const tier = TIER_CONFIG[tierKey]
  const points = profile?.loyalty_points ?? 0

  const userVoucherMap = new Map(userVouchers.map((uv) => [uv.voucher_id, uv.is_used]))

  function filterVouchers(list: Voucher[]): Voucher[] {
    switch (filter) {
      case 'discount':
        return list.filter((v) => v.discount_type === 'percentage')
      case 'cashback':
        return list.filter((v) => v.discount_type === 'fixed')
      case 'delivery':
        return list.filter((v) => v.applicable_modes.includes('delivery'))
      default:
        return list
    }
  }

  const allFiltered = filterVouchers(vouchers)
  const shopVouchers = allFiltered.filter((v) =>
    v.applicable_modes.some((m) => m === 'pickup' || m === 'dinein'),
  )
  const deliveryOnlyVouchers = allFiltered.filter(
    (v) => v.applicable_modes.length === 1 && v.applicable_modes[0] === 'delivery',
  )

  function handleUseVoucher(voucher: Voucher) {
    applyVoucher(voucher)
    router.push('/menu')
  }

  function handleCodeSubmit() {
    setCodeError(null)
    const trimmed = codeInput.trim().toUpperCase()
    if (!trimmed) {
      setCodeError('Please enter a code first.')
      return
    }
    const found = vouchers.find((v) => v.code.toUpperCase() === trimmed)
    if (!found) {
      setCodeError('Code not found or inactive.')
      return
    }
    applyVoucher(found)
    router.push('/menu')
  }

  return (
    <div className="min-h-screen bg-hd-cream pb-24">
      {/* ── Masthead ── */}
      <header className="px-5 pt-12 pb-5 border-b border-hd-ink/15">
        <Eyebrow number="04">Rewards</Eyebrow>
        <h1 className="mt-3 font-display text-display-lg text-hd-ink tracking-editorial">
          The <span className="italic">Dividend</span>
        </h1>
      </header>

      {/* ── Promo code input ── */}
      <section className="px-5 pt-6">
        <div className="flex items-stretch border border-hd-ink/20">
          <div className="px-4 flex items-center border-r border-hd-ink/20">
            <Ticket size={14} className="text-hd-burgundy" />
          </div>
          <input
            type="text"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value)
              setCodeError(null)
            }}
            placeholder="Have a code? Enter here"
            className="flex-1 h-12 bg-transparent text-[0.85rem] placeholder:text-hd-ink/40 focus:outline-none px-4 italic font-display"
          />
          <button
            onClick={handleCodeSubmit}
            className="bg-hd-burgundy text-hd-cream eyebrow px-5 hover:bg-hd-burgundy-dark transition-colors"
          >
            Apply
          </button>
        </div>
        {codeError && (
          <p className="mt-2 text-hd-burgundy text-[0.75rem] italic">{codeError}</p>
        )}
      </section>

      {/* ── Main tabs ── */}
      <nav className="flex gap-6 px-5 mt-6 border-b border-hd-ink/15">
        {MAIN_TABS.map((tab, i) => {
          const active = mainTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className="relative pb-3 flex items-baseline gap-2"
            >
              <span className={`numeral text-[0.65rem] ${active ? 'text-hd-burgundy' : 'text-hd-ink/40'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`font-display text-[1rem] tracking-editorial ${
                  active ? 'text-hd-burgundy italic' : 'text-hd-ink/60'
                }`}
              >
                {tab.label}
              </span>
              {active && <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-hd-burgundy" />}
            </button>
          )
        })}
      </nav>

      {/* ── TAB: Voucher ── */}
      {mainTab === 'voucher' && (
        <div>
          {/* Filters */}
          <div className="flex gap-5 px-5 pt-5 overflow-x-auto no-scrollbar">
            {FILTERS.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex-shrink-0 pb-2 text-[0.8rem] tracking-wide transition-colors relative ${
                    active ? 'text-hd-burgundy' : 'text-hd-ink/50 hover:text-hd-ink'
                  }`}
                >
                  {f.label}
                  {active && <span className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-hd-burgundy" />}
                </button>
              )
            })}
          </div>

          {/* Shop vouchers */}
          {shopVouchers.length > 0 && (
            <section className="px-5 pt-8">
              <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3">
                <Eyebrow>For the counter</Eyebrow>
                <span className="numeral text-[0.7rem] text-hd-ink/50">
                  {String(shopVouchers.length).padStart(2, '0')}
                </span>
              </div>
              <ul className="divide-y divide-hd-ink/10">
                {shopVouchers.map((v, i) => (
                  <VoucherRow
                    key={v.id}
                    index={i}
                    voucher={v}
                    isUsed={userVoucherMap.get(v.id) === true}
                    onUse={() => handleUseVoucher(v)}
                  />
                ))}
              </ul>
            </section>
          )}

          {/* Delivery vouchers */}
          {deliveryOnlyVouchers.length > 0 && (
            <section className="px-5 pt-8">
              <div className="flex items-start gap-2.5 bg-hd-paper border border-hd-ink/10 p-3 mb-5">
                <Info size={12} className="text-hd-ink/50 mt-0.5 flex-shrink-0" />
                <p className="text-[0.72rem] text-hd-ink/60 italic font-display leading-relaxed">
                  Delivery vouchers can only be applied at checkout.
                </p>
              </div>
              <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3">
                <Eyebrow>For delivery</Eyebrow>
                <span className="numeral text-[0.7rem] text-hd-ink/50">
                  {String(deliveryOnlyVouchers.length).padStart(2, '0')}
                </span>
              </div>
              <ul className="divide-y divide-hd-ink/10">
                {deliveryOnlyVouchers.map((v, i) => (
                  <VoucherRow
                    key={v.id}
                    index={i}
                    voucher={v}
                    isUsed={userVoucherMap.get(v.id) === true}
                    onUse={() => handleUseVoucher(v)}
                  />
                ))}
              </ul>
            </section>
          )}

          {allFiltered.length === 0 && (
            <div className="text-center py-16 border border-hd-ink/10 border-dashed mx-5 mt-6">
              <p className="font-display italic text-[1rem] text-hd-ink/55">
                No vouchers just yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MyHD Plan ── */}
      {mainTab === 'plan' && (
        <div className="px-5 pt-8">
          {/* Hero */}
          <div className="relative overflow-hidden border border-hd-ink bg-hd-burgundy-dark text-hd-cream">
            <div className="texture-grain absolute inset-0 opacity-25" aria-hidden />
            <div
              className="absolute inset-0 opacity-60"
              aria-hidden
              style={{
                background:
                  'radial-gradient(ellipse 70% 60% at 90% 0%, rgba(184,146,42,0.3), transparent 60%)',
              }}
            />
            <div className="relative p-6">
              <span className="eyebrow text-hd-gold-light">Häagen-Dazs · Exclusive</span>
              <h2 className="mt-4 font-display text-[2rem] leading-[0.95] tracking-editorial">
                A standing<br />
                <span className="italic">indulgence.</span>
              </h2>
              <p className="mt-4 text-[0.85rem] text-hd-cream/70 max-w-xs">
                Members receive daily discounts, without ceremony.
              </p>
            </div>
          </div>

          {/* Plans */}
          <div className="mt-6 space-y-4">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`relative border p-5 ${
                  plan.featured
                    ? 'border-hd-burgundy bg-hd-paper'
                    : 'border-hd-ink/15 bg-hd-paper hover:border-hd-ink/40 transition-colors'
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-2.5 left-5 eyebrow text-hd-burgundy bg-hd-cream px-2">
                    Most chosen
                  </span>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="numeral text-[0.65rem] text-hd-ink/45 tracking-widest">
                      {plan.roman}
                    </span>
                    <p className="font-display text-[1.3rem] text-hd-ink tracking-editorial mt-1">
                      {plan.name}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {plan.perks.map((perk) => (
                        <li key={perk} className="text-[0.8rem] text-hd-ink/65 italic font-display">
                          — {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="numeral text-[1.4rem] text-hd-ink">{plan.price}</p>
                    <p className="eyebrow text-hd-ink/40 mt-1">per month</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full h-14 bg-hd-burgundy text-hd-cream border border-hd-burgundy eyebrow hover:bg-hd-burgundy-dark transition-colors">
            Subscribe now →
          </button>
          <p className="mt-3 text-center text-[0.7rem] text-hd-ink/40 italic font-display">
            valid across pickup, delivery & dine-in
          </p>
        </div>
      )}

      {/* ── TAB: Rewards ── */}
      {mainTab === 'rewards' && (
        <div className="px-5 pt-8">
          {/* Tier card */}
          <div className="relative overflow-hidden border border-hd-ink bg-hd-burgundy-dark text-hd-cream">
            <div className="texture-grain absolute inset-0 opacity-25" aria-hidden />
            <div
              className="absolute inset-0 opacity-60"
              aria-hidden
              style={{
                background:
                  'radial-gradient(ellipse 60% 60% at 100% 0%, rgba(184,146,42,0.3), transparent 60%)',
              }}
            />
            <div className="relative p-6">
              <span className="eyebrow text-hd-gold-light">Current tier</span>
              <p className="mt-2 font-display text-[1.8rem] italic tracking-editorial">
                {tier.label} Member
              </p>
              <hr className="my-5 border-hd-cream/20" />
              <div>
                <span className="eyebrow text-hd-cream/60">Points</span>
                <p className="numeral text-[2.5rem] leading-none mt-1 text-hd-cream">
                  {points.toLocaleString('en-US')}
                </p>
              </div>
              {tier.nextPoints && (
                <div className="mt-5">
                  <div className="h-[2px] w-full bg-hd-cream/15 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-hd-gold-light transition-[width] duration-[900ms]"
                      style={{ width: `${Math.min((points / tier.nextPoints) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 numeral text-[0.7rem] text-hd-cream/60 tracking-widest">
                    {(tier.nextPoints - points).toLocaleString('en-US')} more → {tier.nextTier}
                  </p>
                </div>
              )}
              {!tier.nextPoints && (
                <p className="mt-4 font-display italic text-[0.9rem] text-hd-cream/75">
                  You are at the summit.
                </p>
              )}
            </div>
          </div>

          {/* Redeem */}
          <section className="pt-8">
            <Eyebrow number="A">Redeem</Eyebrow>
            <ul className="mt-4 divide-y divide-hd-ink/10 border-y border-hd-ink/10">
              {REWARDS.map((reward, i) => (
                <li
                  key={reward.name}
                  className="py-4 flex items-center gap-4 group hover:bg-hd-paper transition-colors"
                >
                  <span className="numeral text-[0.65rem] text-hd-ink/40 tracking-widest w-8">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[1rem] text-hd-ink tracking-editorial truncate">
                      {reward.name}
                    </p>
                    <p className="numeral text-[0.75rem] text-hd-ink/55 mt-0.5">
                      {reward.cost.toLocaleString('en-US')} pts
                    </p>
                  </div>
                  <button
                    onClick={() => alert('Coming soon')}
                    className="eyebrow text-hd-burgundy hover:text-hd-burgundy-dark transition-colors"
                  >
                    Redeem
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
function VoucherRow({
  index,
  voucher,
  isUsed,
  onUse,
}: {
  index: number
  voucher: Voucher
  isUsed: boolean
  onUse: () => void
}) {
  const isPercentage = voucher.discount_type === 'percentage'
  const discountLabel = isPercentage
    ? `${voucher.discount_value}%`
    : `${Math.round(voucher.discount_value / 1000)}K`

  const validUntil = new Date(voucher.valid_until).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <li className={`py-5 flex items-start gap-4 ${isUsed ? 'opacity-40' : ''}`}>
      <span className="numeral text-[0.65rem] text-hd-ink/40 tracking-widest w-8 mt-1">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Big discount numeral */}
      <div className="shrink-0 min-w-[4rem]">
        <p className="numeral text-[1.6rem] leading-none text-hd-burgundy font-medium">
          {discountLabel}
        </p>
        <p className="eyebrow text-hd-ink/45 mt-1">
          {isPercentage ? 'Off' : 'Cut'}
        </p>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-display text-[1rem] text-hd-ink tracking-editorial leading-snug">
          {voucher.title}
        </p>
        {voucher.description && (
          <p className="text-[0.75rem] text-hd-ink/60 mt-1 italic font-display line-clamp-2">
            {voucher.description}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          <span className="numeral text-[0.7rem] text-hd-ink/50">
            Valid until {validUntil}
          </span>
          {voucher.min_order != null && voucher.min_order > 0 && (
            <span className="numeral text-[0.7rem] text-hd-ink/50">
              Min. {formatRupiah(voucher.min_order)}
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          {voucher.applicable_modes.map((mode) => (
            <span
              key={mode}
              className="eyebrow text-hd-ink/45 text-[0.6rem] normal-case tracking-wider"
            >
              · {MODE_LABEL[mode] ?? mode}
            </span>
          ))}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={onUse}
        disabled={isUsed}
        className="shrink-0 eyebrow text-hd-burgundy border-b border-hd-burgundy pb-0.5 flex items-center gap-1.5 disabled:text-hd-ink/30 disabled:border-hd-ink/20 hover:text-hd-burgundy-dark transition-colors"
      >
        {isUsed ? 'Used' : 'Apply'}
        {!isUsed && <ArrowUpRight className="w-3 h-3" />}
      </button>
    </li>
  )
}
