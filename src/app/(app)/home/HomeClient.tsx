'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronRight,
  Star,
  MapPin,
  Ticket,
  Users,
  Phone,
  Gift,
  Crown,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContext } from '@/lib/store/order-context'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'
import StoreSelector from '@/components/StoreSelector'
import FloatingCartButton from '@/components/FloatingCartButton'
import QRScanner from '@/components/QRScanner'
import PromoPopup from '@/components/PromoPopup'

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

const tierConfig: Record<string, { color: string; label: string; target: number }> = {
  silver: { color: 'text-gray-500', label: 'Silver', target: 500 },
  gold: { color: 'text-hd-gold', label: 'Gold', target: 2000 },
  platinum: { color: 'text-blue-600', label: 'Platinum', target: 5000 },
}

const promoBanners = [
  { id: 1, src: '/promo/buy1get1.jpg', alt: 'Buy 1 Get 1 Free — A Treat for Two', href: '/menu' },
  { id: 2, src: '/promo/prosperity.jpg', alt: 'Crafted for Your Prosperity — Delivery Packages', href: '/menu' },
  { id: 3, src: '/promo/giveaway.png', alt: 'Giveaway Alert — Creamy Indulgence', href: '/voucher' },
]

const featureCards = [
  {
    icon: Crown,
    title: 'MyHD Plan',
    desc: 'Berlangganan, lebih hemat!',
    color: 'bg-amber-50 text-amber-600',
    href: '/voucher',
  },
  {
    icon: UtensilsCrossed,
    title: 'Catering',
    desc: 'Rayakan momen spesial',
    color: 'bg-hd-cream text-hd-burgundy',
    href: '/menu',
    badge: 'Baru',
  },
  {
    icon: Users,
    title: 'Share the Sip',
    desc: 'Bagikan kode referral, dapatkan hadiah',
    color: 'bg-green-50 text-green-600',
    href: '/voucher',
  },
  {
    icon: Gift,
    title: 'HD Gift',
    desc: 'Kirim ice cream ke orang terdekat',
    color: 'bg-purple-50 text-purple-600',
    href: '/menu',
  },
]

export default function HomeClient({
  profile,
  featuredItems,
  stores,
  voucherCount,
}: HomeClientProps) {
  const [storeOpen, setStoreOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [currentBanner, setCurrentBanner] = useState(0)

  const { mode, setMode, selectedStore } = useOrderContext()
  const addItem = useCartStore((s) => s.addItem)

  const tierKey = profile?.tier ?? 'silver'
  const tier = tierConfig[tierKey] ?? tierConfig.silver
  const points = profile?.loyalty_points ?? 0
  const progress = Math.min(points / tier.target, 1)

  // Auto-scroll banners
  const nextBanner = useCallback(() => {
    setCurrentBanner((prev) => (prev + 1) % promoBanners.length)
  }, [])

  useEffect(() => {
    const interval = setInterval(nextBanner, 4000)
    return () => clearInterval(interval)
  }, [nextBanner])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Pelanggan'

  return (
    <div className="min-h-screen bg-hd-cream pb-28">
      <PromoPopup />

      {/* ── Promo Banner Carousel ── */}
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
          >
            {promoBanners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.href}
                className="w-full shrink-0 relative block"
              >
                <Image
                  src={banner.src}
                  alt={banner.alt}
                  width={750}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority={banner.id === 1}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {promoBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentBanner(i)}
              className={`rounded-full transition-all ${
                i === currentBanner
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Notification bell */}
        <button className="absolute top-12 right-5 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <span className="text-white text-lg">🔔</span>
        </button>
      </div>

      {/* ── Loyalty Points Card (overlapping banner) ── */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-hd-cream rounded-full flex items-center justify-center">
                <Star size={18} className="text-hd-gold fill-hd-gold" />
              </div>
              <div>
                <p className="text-hd-dark font-bold text-lg">{points.toLocaleString('id-ID')} Poin</p>
              </div>
            </div>
            {/* Reward progress dots */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                    i < Math.ceil(progress * 5)
                      ? 'bg-hd-gold border-hd-gold'
                      : 'bg-transparent border-gray-200'
                  }`}
                />
              ))}
              <div className="w-5 h-5 rounded-full bg-hd-gold flex items-center justify-center ml-0.5">
                <Star size={10} className="text-white fill-white" />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <Link href="/voucher" className="flex items-center justify-between">
              <p className="text-gray-500 text-sm">Tukarkan poinmu dengan hadiah menarik</p>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Greeting + Order Mode ── */}
      <div className="px-4 mt-6">
        <h2 className="text-hd-dark text-xl font-bold">
          Hi {firstName}, Pesan Sekarang?
        </h2>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Pick Up Card */}
          <button
            onClick={() => {
              setMode('pickup')
              setStoreOpen(true)
            }}
            className={`rounded-2xl p-4 text-left border-2 transition-all ${
              mode === 'pickup'
                ? 'border-hd-burgundy bg-hd-cream'
                : 'border-gray-200 bg-white'
            }`}
          >
            <p className={`font-bold text-lg ${mode === 'pickup' ? 'text-hd-burgundy' : 'text-hd-dark'}`}>
              Pick Up
            </p>
            <p className="text-gray-500 text-xs mt-1 leading-snug">
              Ambil di store tanpa antri
            </p>
            <div className="flex justify-end mt-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                mode === 'pickup' ? 'bg-hd-burgundy/10' : 'bg-gray-100'
              }`}>
                <ShoppingBag size={20} className={mode === 'pickup' ? 'text-hd-burgundy' : 'text-gray-400'} />
              </div>
            </div>
          </button>

          {/* Delivery Card */}
          <button
            onClick={() => {
              setMode('delivery')
              setStoreOpen(true)
            }}
            className={`rounded-2xl p-4 text-left border-2 transition-all ${
              mode === 'delivery'
                ? 'border-hd-burgundy bg-hd-cream'
                : 'border-gray-200 bg-white'
            }`}
          >
            <p className={`font-bold text-lg ${mode === 'delivery' ? 'text-hd-burgundy' : 'text-hd-dark'}`}>
              Delivery
            </p>
            <p className="text-gray-500 text-xs mt-1 leading-snug">
              Garansi tepat waktu, dijamin!
            </p>
            <div className="flex justify-end mt-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                mode === 'delivery' ? 'bg-hd-burgundy/10' : 'bg-gray-100'
              }`}>
                <Truck size={20} className={mode === 'delivery' ? 'text-hd-burgundy' : 'text-gray-400'} />
              </div>
            </div>
          </button>
        </div>

        {/* Dine-in option (smaller) */}
        <button
          onClick={() => {
            setMode('dinein')
            setQrOpen(true)
          }}
          className={`w-full mt-3 rounded-2xl p-3 flex items-center gap-3 border-2 transition-all ${
            mode === 'dinein'
              ? 'border-hd-burgundy bg-hd-cream'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
            mode === 'dinein' ? 'bg-hd-burgundy/10' : 'bg-gray-100'
          }`}>
            <UtensilsCrossed size={18} className={mode === 'dinein' ? 'text-hd-burgundy' : 'text-gray-400'} />
          </div>
          <div className="text-left">
            <p className={`font-semibold text-sm ${mode === 'dinein' ? 'text-hd-burgundy' : 'text-hd-dark'}`}>
              Dine-in
            </p>
            <p className="text-gray-500 text-xs">Scan QR meja untuk pesan langsung</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 ml-auto" />
        </button>

        {/* Store selector */}
        {selectedStore && (
          <button
            onClick={() => setStoreOpen(true)}
            className="mt-3 w-full flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-left"
          >
            <MapPin size={16} className="text-hd-burgundy shrink-0" />
            <span className="flex-1 text-hd-dark text-sm truncate font-medium">
              {selectedStore.name}
            </span>
            <ChevronRight size={16} className="text-gray-400 shrink-0" />
          </button>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="h-2 bg-gray-100 mt-6" />

      {/* ── Yang Menarik di Häagen-Dazs ── */}
      <div className="px-4 mt-5">
        <h2 className="text-hd-dark font-bold text-base mb-4">Yang Menarik di Häagen-Dazs</h2>

        <div className="grid grid-cols-2 gap-3">
          {featureCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white rounded-2xl p-4 border border-gray-100 relative"
            >
              {card.badge && (
                <span className="absolute top-3 right-3 bg-hd-burgundy text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {card.badge}
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color.split(' ')[0]}`}>
                <card.icon size={20} className={card.color.split(' ')[1]} />
              </div>
              <p className="text-hd-dark font-bold text-sm mt-3">{card.title}</p>
              <p className="text-gray-500 text-xs mt-1 leading-snug">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-2 bg-gray-100 mt-6" />

      {/* ── Featured Items ── */}
      <div className="mt-5">
        <div className="px-4 flex items-center justify-between mb-3">
          <h2 className="text-hd-dark font-bold text-base">Best Sellers</h2>
          <Link href="/menu" className="text-hd-burgundy text-sm font-medium">
            Lihat Semua
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto px-4 scrollbar-none pb-1">
          {featuredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addItem(item)}
              className="snap-start shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform text-left border border-gray-100"
            >
              <div className="w-full h-28 bg-gray-50 flex items-center justify-center relative">
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
                <p className="text-hd-burgundy text-xs font-bold mt-1">
                  {formatRupiah(item.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Voucher Teaser ── */}
      <div className="px-4 mt-5">
        <Link href="/voucher">
          <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
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

      {/* ── Divider ── */}
      <div className="h-2 bg-gray-100 mt-6" />

      {/* ── Customer Service ── */}
      <div className="px-4 mt-5 mb-6">
        <h2 className="text-hd-dark font-bold text-base mb-1">Perlu Bantuan?</h2>
        <p className="text-gray-500 text-xs mb-3">Häagen-Dazs Customer Service (chat only)</p>
        <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <Phone size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-hd-dark font-bold text-lg tracking-wide">0812-1111-8456</p>
          </div>
        </div>
      </div>

      {/* ── Store selector modal ── */}
      <StoreSelector
        stores={stores}
        open={storeOpen}
        onClose={() => setStoreOpen(false)}
      />

      {/* ── QR Scanner ── */}
      <QRScanner
        stores={stores}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
      />

      {/* ── Floating cart button ── */}
      <FloatingCartButton />
    </div>
  )
}
