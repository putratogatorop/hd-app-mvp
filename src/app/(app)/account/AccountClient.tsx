'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  User,
  MapPin,
  CreditCard,
  HelpCircle,
  Settings,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Star,
  Users,
} from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type Profile = Pick<ProfileRow, 'full_name' | 'email' | 'phone' | 'loyalty_points' | 'tier' | 'referral_code'> | null

interface AccountClientProps {
  profile: Profile
}

function getTierGradient(tier: string | undefined | null) {
  switch (tier) {
    case 'gold':
      return 'from-yellow-400 to-yellow-600'
    case 'platinum':
      return 'from-blue-500 to-blue-700'
    default:
      return 'from-gray-400 to-gray-600'
  }
}

const menuItems = [
  { icon: MapPin, label: 'Alamat Tersimpan' },
  { icon: CreditCard, label: 'Metode Pembayaran' },
  { icon: HelpCircle, label: 'Pusat Bantuan' },
  { icon: Settings, label: 'Pengaturan' },
  { icon: FileText, label: 'Syarat dan Ketentuan' },
  { icon: Shield, label: 'Kebijakan Privasi' },
]

export default function AccountClient({ profile }: AccountClientProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const tier = profile?.tier ?? 'silver'
  const gradient = getTierGradient(tier)

  return (
    <div className="page-enter min-h-screen bg-hd-cream">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-hd-dark">Akun</h1>
      </div>

      {/* Profile card */}
      <div className="px-4 mb-4">
        <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 shadow-md`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base truncate">
                {profile?.full_name ?? 'Pelanggan'}
              </p>
              <p className="text-white/80 text-xs truncate">
                {profile?.phone ?? profile?.email ?? '-'}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-white fill-white" />
                <span className="text-white text-xs font-semibold">
                  {profile?.loyalty_points ?? 0} poin
                </span>
                <span className="ml-2 text-white/70 text-xs capitalize">
                  {tier} Member
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70 shrink-0" />
          </div>
        </div>
      </div>

      {/* Referral teaser */}
      <div className="px-4 mb-4">
        <Link href="/voucher">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-hd-red/10 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-hd-red" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-hd-dark">Ajak Teman, Dapat Voucher!</p>
              <p className="text-xs text-gray-500">Bagikan kode referralmu sekarang</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
          </div>
        </Link>
      </div>

      {/* Menu list */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
          {menuItems.map(({ icon: Icon, label }) => (
            <Link key={label} href="#">
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 flex flex-col items-center gap-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors py-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">Keluar</span>
        </button>
        <p className="text-xs text-gray-300">Version 1.0.0</p>
      </div>
    </div>
  )
}
