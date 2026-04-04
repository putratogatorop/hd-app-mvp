'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'

const STORAGE_KEY = 'hd-promo-seen'

export default function PromoPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
      sessionStorage.setItem(STORAGE_KEY, 'true')
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
      onClick={() => setVisible(false)}
    >
      <div
        className="relative w-full max-w-[330px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setVisible(false)}
          className="absolute -top-4 -right-2 z-10 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg"
        >
          <X size={18} className="text-gray-500" />
        </button>

        {/* Promo image */}
        <div className="rounded-[20px] overflow-hidden shadow-2xl">
          <Image
            src="/promo/popup-banner.jpg"
            alt="Häagen-Dazs Promo"
            width={660}
            height={1100}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* CTA */}
        <Link
          href="/menu"
          onClick={() => setVisible(false)}
          className="mt-4 block w-full py-4 bg-white text-hd-red font-bold text-[15px] text-center rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
        >
          Pesan Sekarang →
        </Link>
      </div>
    </div>
  )
}
