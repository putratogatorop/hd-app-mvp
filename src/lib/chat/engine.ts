// HD Insights Chat Engine — simple rule-based responses with dashboard context

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const RESPONSES: Record<string, string> = {
  default: `Maaf, saya belum memiliki data spesifik untuk pertanyaan itu.\n\nCoba tanyakan tentang:\n- Best seller produk\n- Performa toko\n- Ringkasan bisnis\n- Analisis voucher`,

  bestseller: `Best seller minggu ini adalah:\n\n1. **Belgian Chocolate Pint** — 2.840 pesanan (Rp 155,4 jt)\n2. **Strawberry Cheesecake Pint** — 2.210 pesanan (Rp 119,3 jt)\n3. **Vanilla Swiss Almond Pint** — 1.980 pesanan (Rp 108,9 jt)\n\nBelgian Chocolate memimpin dengan margin tipis. Matcha Green Tea perlu perhatian — tumbuh 24,8% tapi masih di posisi ke-6.`,

  toko: `Toko yang perlu perhatian segera:\n\n🔴 **Grand Indonesia** — revenue turun 12,1% MoM. AOV masih tinggi (Rp 62rb) tapi volume pesanan menyusut.\n\nRekomendasi:\n- Review strategi marketing lokal GI\n- Cek kompetitor di area sekitar\n- Pertimbangkan promo flash sale akhir pekan\n\n✅ **Pakuwon Surabaya** — tumbuh 42,8%, momentum bagus untuk scaling.`,

  ringkasan: `Ringkasan bisnis minggu ini:\n\n📊 **Revenue:** Rp 162 jt (+9,5% vs minggu lalu)\n🛒 **Pesanan:** 2.890 order (+6,6%)\n👥 **Member Aktif:** 1.940 pelanggan\n💰 **AOV:** Rp 56.090\n\n🟢 Highlight positif: Pakuwon Surabaya +42,8%, Referral conversion +19,5%\n🔴 Perhatian: Grand Indonesia -12,1%, Silver churn rate 6,9%`,

  voucher: `Performa voucher terkini:\n\n1. **HDLOYALTY** — redemption 80%, ROI 2,8× (terbaik)\n2. **FLASH20** — redemption 75%, tapi ROI hanya 1,1× (menarik pemburu diskon)\n3. **FREEONGKIR** — redemption 70%, ROI 3,2× (paling efisien!)\n\nRekomendasi: Kurangi FLASH20, perbesar anggaran FREEONGKIR dan HDLOYALTY.`,

  referral: `Funnel referral bulan ini:\n\n🔗 Link dibagikan: 2.840\n👆 Diklik: 1.920 (67,6%)\n📱 Install app: 1.240 (43,7%)\n✅ Buat akun: 890 (31,3%)\n🛒 Order pertama: 410 (14,4%)\n\nDrop terbesar terjadi di tahap "install ke akun". Pertimbangkan deep link langsung ke web app untuk mempersingkat funnel.`,

  aov: `Analisis AOV (Average Order Value):\n\n- Platinum members: Rp 290.731 (sering order untuk grup/event)\n- Gold members: Rp 137.664\n- Silver members: Rp 34.265\n\nGap Platinum-Silver sangat besar. Program upgrade Silver→Gold bisa meningkatkan revenue signifikan tanpa tambah pelanggan baru.`,
}

function matchIntent(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('best seller') || lower.includes('bestseller') || lower.includes('produk') || lower.includes('terlaris')) return 'bestseller'
  if (lower.includes('toko') || lower.includes('store') || lower.includes('perhatian') || lower.includes('cabang')) return 'toko'
  if (lower.includes('ringkasan') || lower.includes('summary') || lower.includes('bisnis') || lower.includes('overview')) return 'ringkasan'
  if (lower.includes('voucher') || lower.includes('promo') || lower.includes('diskon') || lower.includes('redemption')) return 'voucher'
  if (lower.includes('referral') || lower.includes('referensi') || lower.includes('ajak teman')) return 'referral'
  if (lower.includes('aov') || lower.includes('average order') || lower.includes('rata-rata')) return 'aov'
  return 'default'
}

export async function processMessage(userMessage: string): Promise<string> {
  // Simulate a small network/processing delay
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 200))
  const intent = matchIntent(userMessage)
  return RESPONSES[intent] ?? RESPONSES.default
}
