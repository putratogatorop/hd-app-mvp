'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Star, MapPin, Ticket, Users, MessageCircle } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContext } from '@/lib/store/order-context'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'
import StoreSelector from '@/components/StoreSelector'
import FloatingCartButton from '@/components/FloatingCartButton'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type MenuItem = Database['public']['Tables']['menu_items']['Row']
type Store = Database['public']['Tables']['stores']['Row']

type Profile = Pick<ProfileRow, 'full_name' | 'loyalty_points' | 'tier' | 'referral_code'>

interface HomeClientProps {
  profile: Profile | null
  featuredItems: MenuItem[]
  stores: Store[]
  voucherCount: number
}

const tierColors: Record<string, string> = {
  silver: 'bg-gray-100 text-gray-600',
  gold: 'bg-hd-gold-light text-hd-gold',
  platinum: 'bg-blue-100 text-blue-700',
}

const orderModes = [
  { key: 'pickup', label: 'Pick Up' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'dinein', label: 'Dine-in' },
] as const

const promoBanners = [
  {
    id: 1,
    title: 'Double Points Weekend!',
    subtitle: 'Kumpulkan poin 2x lebih cepat',
    gradient: 'from-hd-red to-red-700',
  },
  {
    id: 2,
    title: 'New Flavor Alert',
    subtitle: 'Coba varian terbaru kami sekarang',
    gradient: 'from-purple-600 to-purple-800',
  },
  {
    id: 3,
    title: 'Free Delivery',
    subtitle: 'Gratis ongkir min. order Rp150.000',
    gradient: 'from-emerald-500 to-emerald-700',
  },
]

export default function HomeClient({
  profile,
  featuredItems,
  stores,
  voucherCount,
}: HomeClientProps) {
  const [storeOpen, setStoreOpen] = useState(false)

  const { mode, setMode, selectedStore } = useOrderContext()
  const addItem = useCartStore((s) => s.addItem)

  const tierKey = profile?.tier ?? 'silver'
  const tierClass = tierColors[tierKey] ?? tierColors.silver

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ── Top section ── */}
      <div className="bg-hd-red px-5 pt-12 pb-10">
        {/* Greeting */}
        <p className="text-red-200 text-sm mb-0.5">Selamat datang,</p>
        <h1 className="text-white text-2xl font-bold">
          Hi, {profile?.full_name ?? 'Pelanggan'}
        </h1>

        {/* Points + tier */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white text-sm font-medium">
              {profile?.loyalty_points ?? 0} poin
            </span>
          </div>
          <span
            className={`text-xs font-semibold capitalize rounded-full px-3 py-1.5 ${tierClass}`}
          >
            {tierKey.charAt(0).toUpperCase() + tierKey.slice(1)}
          </span>
        </div>

        {/* Store selector button */}
        <button
          onClick={() => setStoreOpen(true)}
          className="mt-4 w-full flex items-center gap-2 bg-white/15 rounded-xl px-4 py-3 text-left"
        >
          <MapPin size={16} className="text-red-200 shrink-0" />
          <span className="flex-1 text-white text-sm truncate">
            {selectedStore?.name ?? 'Pilih toko...'}
          </span>
          <ChevronRight size={16} className="text-red-200 shrink-0" />
        </button>
      </div>

      {/* ── Order mode toggle ── */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm p-1.5 flex gap-1">
          {orderModes.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mode === key
                  ? 'bg-hd-red text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Promo banners ── */}
      <div className="mt-5 px-4">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1">
          {promoBanners.map((banner) => (
            <div
              key={banner.id}
              className={`snap-start shrink-0 w-72 h-36 rounded-2xl bg-gradient-to-br ${banner.gradient} flex flex-col justify-end p-4`}
            >
              <p className="text-white font-bold text-base leading-snug">{banner.title}</p>
              <p className="text-white/80 text-xs mt-0.5">{banner.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured items ── */}
      <div className="mt-6">
        <div className="px-4 flex items-center justify-between mb-3">
          <h2 className="text-hd-dark font-bold text-base">Yang Menarik di Häagen-Dazs</h2>
          <Link href="/menu" className="text-hd-red text-sm font-medium">
            Lihat Semua
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto px-4 scrollbar-none pb-1">
          {featuredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addItem(item)}
              className="snap-start shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform text-left"
            >
              {/* Image placeholder */}
              <div className="w-full h-28 bg-gray-100 flex items-center justify-center relative">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-4xl">🍨</span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-hd-dark text-xs font-semibold leading-snug line-clamp-2">
                  {item.name}
                </p>
                <p className="text-hd-red text-xs font-bold mt-1">
                  {formatRupiah(item.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Voucher teaser ── */}
      <div className="px-4 mt-5">
        <Link href="/voucher">
          <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <Ticket size={20} className="text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="text-hd-dark font-semibold text-sm">
                {voucherCount} voucher tersedia
              </p>
              <p className="text-gray-400 text-xs mt-0.5">Klaim sebelum kedaluwarsa</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </Link>
      </div>

      {/* ── Referral card ── */}
      <div className="px-4 mt-3">
        <Link href="/voucher">
          <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
              <Users size={20} className="text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-hd-dark font-semibold text-sm">
                Ajak Teman, Dapat Voucher!
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Bagikan kode referral kamu sekarang
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </Link>
      </div>

      {/* ── Customer service ── */}
      <div className="px-4 mt-6 mb-4">
        <div className="flex flex-col items-center gap-2 text-center py-4">
          <MessageCircle size={22} className="text-gray-400" />
          <p className="text-gray-500 text-sm">
            Butuh bantuan?{' '}
            <span className="text-hd-red font-medium">Hubungi Customer Service</span>
          </p>
        </div>
      </div>

      {/* ── Store selector modal ── */}
      <StoreSelector
        stores={stores}
        open={storeOpen}
        onClose={() => setStoreOpen(false)}
      />

      {/* ── Floating cart button ── */}
      <FloatingCartButton />
    </div>
  )
}
