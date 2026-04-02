import { createClient } from '@/lib/supabase/server'

const TIER_CONFIG = {
  silver: {
    label: 'Silver',
    color: 'from-gray-400 to-gray-500',
    emoji: '🥈',
    minPoints: 0,
    nextTier: 'Gold',
    nextPoints: 5000,
  },
  gold: {
    label: 'Gold',
    color: 'from-yellow-400 to-yellow-600',
    emoji: '🥇',
    minPoints: 5000,
    nextTier: 'Platinum',
    nextPoints: 15000,
  },
  platinum: {
    label: 'Platinum',
    color: 'from-blue-400 to-indigo-600',
    emoji: '💎',
    minPoints: 15000,
    nextTier: null,
    nextPoints: null,
  },
}

export default async function LoyaltyPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, loyalty_points, tier')
    .single()

  const { data: transactions } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15)

  const tier = TIER_CONFIG[profile?.tier ?? 'silver']
  const points = profile?.loyalty_points ?? 0
  const progress = tier.nextPoints
    ? Math.min((points / tier.nextPoints) * 100, 100)
    : 100

  return (
    <div className="page-enter">
      {/* Loyalty Card */}
      <div className={`bg-gradient-to-br ${tier.color} px-6 pt-12 pb-8`}>
        <p className="text-white/80 text-sm">Member Loyalty</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-3xl">{tier.emoji}</span>
          <h1 className="text-white text-2xl font-bold">{tier.label} Member</h1>
        </div>
        <p className="text-white/90 mt-1 text-sm">{profile?.full_name}</p>

        {/* Points display */}
        <div className="mt-4 bg-white/20 rounded-2xl p-4">
          <p className="text-white/70 text-xs uppercase tracking-wide">Total Poin</p>
          <p className="text-white text-4xl font-bold mt-1">{points.toLocaleString('id-ID')}</p>
          <p className="text-white/70 text-xs mt-1">poin tersedia</p>
        </div>

        {/* Progress to next tier */}
        {tier.nextPoints && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{points.toLocaleString('id-ID')} poin</span>
              <span>{tier.nextTier}: {tier.nextPoints.toLocaleString('id-ID')} poin</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/70 text-xs mt-1 text-center">
              {(tier.nextPoints - points).toLocaleString('id-ID')} poin lagi ke {tier.nextTier}
            </p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="font-bold text-hd-dark mb-3">Cara Mendapatkan Poin</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛒</span>
              <p className="text-sm text-gray-600">Setiap Rp 1.000 = <strong>1 poin</strong></p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🎂</span>
              <p className="text-sm text-gray-600">Bonus <strong>500 poin</strong> di hari ulang tahun</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">👥</span>
              <p className="text-sm text-gray-600">Referral teman: <strong>200 poin</strong></p>
            </div>
          </div>
        </div>

        {/* Tier benefits */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="font-bold text-hd-dark mb-3">Keuntungan Tier</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span>🥈</span>
              <span className="text-gray-600"><strong>Silver</strong> — 0–4.999 poin: Akses basic</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🥇</span>
              <span className="text-gray-600"><strong>Gold</strong> — 5.000–14.999: Diskon 5% + priority</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💎</span>
              <span className="text-gray-600"><strong>Platinum</strong> — 15.000+: Diskon 10% + free delivery</span>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <h3 className="font-bold text-hd-dark mb-3">Riwayat Poin</h3>
        <div className="space-y-2">
          {transactions && transactions.length > 0 ? (
            transactions.map(tx => (
              <div key={tx.id} className="bg-white rounded-xl p-3 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-700">{tx.description ?? tx.type}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <span className={`font-bold text-sm ${tx.type === 'redeemed' || tx.type === 'expired' ? 'text-red-500' : 'text-green-600'}`}>
                  {tx.type === 'redeemed' || tx.type === 'expired' ? '-' : '+'}{tx.points}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <span className="text-3xl">⭐</span>
              <p className="text-sm mt-2">Belum ada transaksi poin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
