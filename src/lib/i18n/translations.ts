/**
 * HD App i18n — Translation strings
 * Ported from design-system/mockups/i18n.js
 * Modes: en-idr (default) | en-usd | id-idr
 */

export type Lang = 'en' | 'id'

export type TranslationEntry = {
  en: string
  id: string
}

export const translations: Record<string, TranslationEntry> = {
  /* NAV */
  'nav.home':         { en: 'Home',       id: 'Beranda' },
  'nav.menu':         { en: 'Menu',       id: 'Menu' },
  'nav.orders':       { en: 'Orders',     id: 'Pesanan' },
  'nav.rewards':      { en: 'Rewards',    id: 'Hadiah' },
  'nav.account':      { en: 'Account',    id: 'Akun' },
  'nav.lounge':       { en: 'Lounge',     id: 'Lounge' },
  'nav.boutique':     { en: 'Boutique',   id: 'Boutique' },
  'nav.flavors':      { en: 'Flavors',    id: 'Cita Rasa' },
  'nav.order':        { en: 'Order',      id: 'Pesan' },

  /* SECTION HEADERS / EYEBROWS */
  'section.introduction':       { en: 'Introduction',       id: 'Pengantar' },
  'section.the_collection':     { en: 'The Collection',     id: 'Koleksi' },
  'section.philosophy':         { en: 'Our Philosophy',     id: 'Filosofi Kami' },
  'section.the_shortlist':      { en: 'The Shortlist',      id: 'Pilihan Utama' },
  'section.your_basket':        { en: 'Your Basket',        id: 'Keranjang Anda' },
  'section.your_selection':     { en: 'Your Selection',     id: 'Pilihan Anda' },
  'section.recipient':          { en: 'Recipient',          id: 'Penerima' },
  'section.presentation':       { en: 'Presentation',       id: 'Presentasi' },
  'section.delivery_mode':      { en: 'Delivery',           id: 'Pengantaran' },
  'section.small_extras':       { en: 'Small Extras',       id: 'Tambahan Kecil' },
  'section.notes':              { en: 'Notes',              id: 'Catatan' },
  'section.voucher':            { en: 'Voucher',            id: 'Voucher' },
  'section.payment':            { en: 'Payment',            id: 'Pembayaran' },
  'section.summary':            { en: 'Summary',            id: 'Ringkasan' },
  'section.curated_indulgence': { en: 'Curated Indulgence', id: 'Indulgensi Terkurasi' },
  'section.in_season':          { en: 'In season',          id: 'Sedang musim' },
  'section.the_journal':        { en: 'The Journal',        id: 'Jurnal' },
  'section.status':             { en: 'Status',             id: 'Status' },
  'section.courier':            { en: 'Courier',            id: 'Kurir' },
  'section.location':           { en: 'Location',           id: 'Lokasi' },
  'section.your_order':         { en: 'Your Order',         id: 'Pesanan Anda' },
  'section.current_tier':       { en: 'Current Tier',       id: 'Tier Saat Ini' },
  'section.earned_this_season': { en: 'Earned This Season', id: 'Diperoleh Musim Ini' },
  'section.curated_privileges': { en: 'Curated Privileges', id: 'Hak Istimewa' },
  'section.redeem':             { en: 'Redeem',             id: 'Tukar' },
  'section.identity':           { en: 'Identity',           id: 'Identitas' },
  'section.membership':         { en: 'Membership',         id: 'Keanggotaan' },
  'section.preferences':        { en: 'Preferences',        id: 'Preferensi' },
  'section.recent_orders':      { en: 'Recent Orders',      id: 'Pesanan Terakhir' },
  'section.settings':           { en: 'Settings',           id: 'Pengaturan' },

  /* HERO HEADLINES */
  'hero.pure_indulgence': { en: 'Pure\nIndulgence,\nCrafted.',   id: 'Indulgensi\nMurni,\nDirajut.' },
  'hero.artisan_sub':     { en: 'Artisanal textures and flavours, engineered for the discerning modern palate.', id: 'Tekstur artisanal dan cita rasa, dirancang untuk selera modern yang cermat.' },
  'hero.the_shortlist':   { en: 'The Shortlist',   id: 'Pilihan Utama' },
  'hero.discover':        { en: 'Discover',        id: 'Temukan' },
  'hero.your_selection':  { en: 'Your\nSelection.', id: 'Pilihan\nAnda.' },
  'hero.as_a_gift':       { en: 'A Gift,\nSent.',   id: 'Hadiah,\nTerkirim.' },

  /* CART */
  'cart.for_me':            { en: 'For me',          id: 'Untuk saya' },
  'cart.as_a_gift':         { en: 'As a gift',       id: 'Sebagai hadiah' },
  'cart.3_choices':         { en: '3 selections',    id: '3 pilihan' },
  'cart.subtotal':          { en: 'Subtotal',        id: 'Subtotal' },
  'cart.delivery':          { en: 'Delivery',        id: 'Ongkir' },
  'cart.complimentary':     { en: 'Complimentary',   id: 'Gratis' },
  'cart.loyalty_points':    { en: 'Loyalty Points',  id: 'Poin Loyalitas' },
  'cart.total':             { en: 'Total',           id: 'Total' },
  'cart.voucher_add':       { en: 'Add a code',      id: 'Tambah kode' },
  'cart.notes_placeholder': { en: 'A note for our kitchen...', id: 'Catatan untuk dapur kami...' },
  'cart.payment_connected': { en: 'Connected',       id: 'Terhubung' },
  'cart.payment_select':    { en: 'Select',          id: 'Pilih' },
  'cart.your_basket':       { en: 'Your Basket',     id: 'Keranjang Anda' },
  'cart.a_gift_to_send':    { en: 'A Gift to Send',  id: 'Kirim Hadiah' },
  'cart.total_estimate':    { en: 'Total Estimate',  id: 'Estimasi Total' },
  'cart.total_amount':      { en: 'Total Amount',    id: 'Total Harga' },
  'cart.delivery_fee':      { en: 'Delivery Fee',    id: 'Ongkos Kirim' },
  'cart.points_earned':     { en: 'Points Earned',   id: 'Poin Diperoleh' },
  'cart.place_order':       { en: 'Place Order',     id: 'Buat Pesanan' },
  'cart.send_a_gift':       { en: 'Send a Gift',     id: 'Kirim Hadiah' },
  'cart.editorial_wrap':    { en: 'Editorial Wrap',  id: 'Bungkusan Eksklusif' },
  'cart.wrap_desc':         { en: 'Sustainable matte paper, hand-tied silk ribbon', id: 'Kertas matte daur ulang, pita sutera terikat tangan' },
  'section.order_mode':     { en: 'Order Mode',      id: 'Mode Pesanan' },
  'section.items':          { en: 'Items',           id: 'Item' },
  'section.gift_wrap':      { en: 'Gift Wrap',       id: 'Bungkusan' },
  'form.recipient_name':    { en: "Recipient's Name", id: 'Nama Penerima' },
  'form.phone_number':      { en: 'Phone Number',    id: 'Nomor Telepon' },
  'form.delivery_date':     { en: 'Delivery Date',   id: 'Tanggal Pengiriman' },
  'form.personal_note':     { en: 'Personal Note',   id: 'Pesan Pribadi' },

  /* DELIVERY MODES */
  'delivery.pickup':       { en: 'Pick Up',               id: 'Ambil Sendiri' },
  'delivery.pickup_sub':   { en: 'Collected at counter',  id: 'Diambil di kasir' },
  'delivery.delivery':     { en: 'Delivery',              id: 'Pengantaran' },
  'delivery.delivery_sub': { en: 'Delivered to your door', id: 'Diantar ke pintu' },
  'delivery.dinein':       { en: 'Dine In',               id: 'Makan di Tempat' },
  'delivery.dinein_sub':   { en: 'At the table, unhurried', id: 'Di meja, tanpa tergesa' },

  /* CTAs */
  'cta.continue':          { en: 'Continue',             id: 'Lanjutkan' },
  'cta.next':              { en: 'Next',                 id: 'Berikutnya' },
  'cta.confirm_selection': { en: 'Confirm Selection',    id: 'Konfirmasi Pilihan' },
  'cta.place_order':       { en: 'Place\nOrder',         id: 'Buat\nPesanan' },
  'cta.send_a_gift':       { en: 'Send\nGift',           id: 'Kirim\nHadiah' },
  'cta.order_again':       { en: 'Order Again',          id: 'Pesan Lagi' },
  'cta.get_directions':    { en: 'Get Directions',       id: 'Petunjuk Arah' },
  'cta.sign_in':           { en: 'Sign In',              id: 'Masuk' },
  'cta.begin_tasting':     { en: 'Begin Tasting',        id: 'Mulai Mencicipi' },
  'cta.explore_story':     { en: 'Explore Our Story',    id: 'Jelajahi Kisah Kami' },
  'cta.proceed_checkout':  { en: 'Proceed to Checkout',  id: 'Lanjutkan ke Pembayaran' },
  'cta.join_now':          { en: 'Join now',             id: 'Bergabung' },
  'cta.add_to_bar':        { en: 'Add to bar',           id: 'Tambah' },
  'cta.semua':             { en: 'View all',             id: 'Semua' },
  'cta.open_lounge':       { en: 'Enter The Lounge',     id: 'Masuk The Lounge' },
  'cta.redeem':            { en: 'Redeem',               id: 'Tukar' },

  /* ONBOARDING */
  'onboarding.scroll_to_begin': { en: 'Scroll to begin',     id: 'Gulir untuk mulai' },
  'onboarding.begin':           { en: 'Begin.',              id: 'Mulai.' },
  'onboarding.welcome':         { en: 'Welcome.',            id: 'Selamat Datang.' },
  'onboarding.your_name':       { en: 'Your name',           id: 'Nama Anda' },
  'onboarding.your_email':      { en: 'Email',               id: 'Email' },
  'onboarding.your_phone':      { en: 'Phone',               id: 'Telepon' },
  'onboarding.taste_question':  { en: 'What do you taste for?', id: 'Apa cita rasa Anda?' },
  'onboarding.choose_three':    { en: 'Choose three.',       id: 'Pilih tiga.' },
  'onboarding.tier_reveal':     { en: 'You are a Connoisseur.', id: 'Anda seorang Connoisseur.' },
  'onboarding.member_since':    { en: 'Member since',        id: 'Anggota sejak' },
  'onboarding.sign_in_google':  { en: 'Continue with Google', id: 'Lanjutkan dengan Google' },
  'onboarding.sign_in_email':   { en: 'Sign in with Email',  id: 'Masuk dengan Email' },
  'onboarding.continue':        { en: 'Continue',            id: 'Lanjutkan' },

  /* SPLASH (onboarding-1) */
  'splash.headline': { en: 'Begin.',  id: 'Mulai.' },
  'splash.sub':      { en: 'An ice cream membership, refined for you. Discover curated flavors and artisanal experiences tailored to the discerning palate.', id: 'Keanggotaan es krim, dirancang untuk Anda. Temukan cita rasa terkurasi dan pengalaman artisanal yang disesuaikan untuk selera yang cermat.' },
  'splash.signin':   { en: 'Sign In', id: 'Masuk' },

  /* IDENTITY (onboarding-2) */
  'identity.headline':         { en: 'Tell us your\nname.',   id: 'Ceritakan\nnama Anda.' },
  'identity.name_placeholder': { en: 'First and last name',   id: 'Nama depan dan belakang' },

  /* PREFERENCES (onboarding-3) */
  'pref.headline': { en: 'Pick three flavours\nyou love.', id: 'Pilih tiga cita rasa\nyang Anda sukai.' },
  'pref.sub':      { en: 'Indulgence is personal. Select your favorites to tailor your experience.', id: 'Indulgensi itu personal. Pilih favorit Anda untuk menyesuaikan pengalaman.' },
  'pref.confirm':  { en: 'Confirm Selection', id: 'Konfirmasi Pilihan' },

  /* TIER REVEAL (onboarding-4) */
  'tier.eyebrow':       { en: '03 — Welcome',           id: '03 — Sambutan' },
  'tier.headline':      { en: "You're a\nConnoisseur.",  id: 'Anda seorang\nConnoisseur.' },
  'tier.accrual_label': { en: 'Current Accrual',         id: 'Akumulasi Saat Ini' },
  'tier.begin_btn':     { en: 'Begin Tasting →',         id: 'Mulai Mencicipi →' },

  /* TRACKING */
  'tracking.order_confirmed':  { en: 'Confirmed',        id: 'Dikonfirmasi' },
  'tracking.order_prepared':   { en: 'Being prepared',   id: 'Sedang disiapkan' },
  'tracking.order_ready':      { en: 'Ready for pickup', id: 'Siap diambil' },
  'tracking.order_en_route':   { en: 'En route',         id: 'Dalam perjalanan' },
  'tracking.order_delivered':  { en: 'Delivered',        id: 'Terkirim' },
  'tracking.order_collected':  { en: 'Collected',        id: 'Diambil' },
  'tracking.show_qr':          { en: 'Show QR',          id: 'Tampilkan QR' },
  'tracking.scan_to_collect':  { en: 'Scan to collect',  id: 'Scan untuk ambil' },
  'tracking.on_its_way':       { en: 'On its way.',      id: 'Dalam perjalanan.' },
  'tracking.ready_collection': { en: 'Ready for\ncollection.', id: 'Siap untuk\ndiambil.' },
  'tracking.est_arrival':      { en: 'Est. Arrival',     id: 'Estimasi Tiba' },
  'tracking.boutique':         { en: 'Boutique',         id: 'Butik' },
  'tracking.order_again':      { en: 'Order Again',      id: 'Pesan Lagi' },
  'tracking.loyalty_earned':   { en: 'pts earned this order', id: 'poin dari pesanan ini' },

  /* LOUNGE */
  'lounge.the_lounge':           { en: 'The Lounge',     id: 'The Lounge' },
  'lounge.reserve_only':         { en: 'Reserve members only', id: 'Khusus anggota Reserve' },
  'lounge.your_tier':            { en: 'Your Tier',      id: 'Tier Anda' },
  'lounge.points':               { en: 'points',         id: 'poin' },
  'lounge.to_next':              { en: 'to next tier',   id: 'ke tier berikutnya' },
  'lounge.early_access':         { en: 'Early Access',   id: 'Akses Awal' },
  'lounge.early_access_desc':    { en: 'First access to limited editions before public release.', id: 'Akses pertama ke edisi terbatas sebelum rilis publik.' },
  'lounge.artisan_workshop':     { en: 'Artisan Workshop', id: 'Workshop Artisan' },
  'lounge.artisan_workshop_desc':{ en: 'Exclusive invitation to private tasting workshops.', id: 'Undangan eksklusif ke workshop pencicipan privat.' },
  'lounge.birthday_scoop':       { en: 'Birthday Scoop', id: 'Scoop Ulang Tahun' },
  'lounge.birthday_scoop_desc':  { en: 'A complimentary selection on your anniversary month.', id: 'Pilihan gratis di bulan ulang tahun Anda.' },
  'lounge.points_to':            { en: 'pts to',         id: 'poin ke' },
  'lounge.connoisseur':          { en: 'Connoisseur',    id: 'Connoisseur' },
  'lounge.reserve':              { en: 'Reserve',        id: 'Reserve' },
  'lounge.aficionado':           { en: 'Aficionado',     id: 'Aficionado' },
  'lounge.classique':            { en: 'Classique',      id: 'Classique' },

  /* ACCOUNT */
  'account.my_account':       { en: 'My Account',      id: 'Akun Saya' },
  'account.member':           { en: 'Member',          id: 'Anggota' },
  'account.notifications':    { en: 'Notifications',   id: 'Notifikasi' },
  'account.language':         { en: 'Language',        id: 'Bahasa' },
  'account.privacy':          { en: 'Privacy',         id: 'Privasi' },
  'account.help':             { en: 'Help',            id: 'Bantuan' },
  'account.sign_out':         { en: 'Sign Out',        id: 'Keluar' },
  'account.edit':             { en: 'Edit',            id: 'Ubah' },
  'account.open_lounge':      { en: 'Open The Lounge', id: 'Buka The Lounge' },
  'account.edit_preferences': { en: 'Edit preferences', id: 'Ubah preferensi' },

  /* PHILOSOPHY */
  'philosophy.art_slow_craft': { en: 'The Art\nof Slow\nCraft.',   id: 'Seni\nKerajinan\nPerlahan.' },
  'philosophy.body':           { en: 'We believe excellence cannot be rushed. Every pint is processed with perfect patience, yielding a density and creaminess that is entirely unrivalled.', id: 'Kami percaya keunggulan tidak bisa terburu-buru. Setiap pint diproses dengan kesabaran sempurna, menghasilkan kekentalan dan kelembutan yang tak tertandingi.' },

  /* FOOTER */
  'footer.explore':      { en: 'Explore',     id: 'Jelajahi' },
  'footer.support':      { en: 'Support',     id: 'Dukungan' },
  'footer.the_shop':     { en: 'The Shop',    id: 'Toko' },
  'footer.our_story':    { en: 'Our Story',   id: 'Kisah Kami' },
  'footer.reservations': { en: 'Reservations', id: 'Reservasi' },
  'footer.contact':      { en: 'Contact Us',  id: 'Hubungi Kami' },
  'footer.gift_cards':   { en: 'Gift Cards',  id: 'Kartu Hadiah' },
  'footer.hampers':      { en: 'Hampers',     id: 'Hampers' },
  'footer.tagline':      { en: "Crafting the world's finest ice cream since 1960. Every spoonful is a celebration of quality and artisanship.", id: 'Menghadirkan es krim terbaik di dunia sejak 1960. Setiap sendok adalah perayaan kualitas dan keahlian.' },
  'footer.copyright':    { en: '© Häagen-Dazs Indonesia · Savour the moment', id: '© Häagen-Dazs Indonesia · Nikmati setiap momen' },

  /* MISC */
  'misc.pint_collection':    { en: 'Pint Collection',  id: 'Koleksi Pint' },
  'misc.fruit_series':       { en: 'Fruit Series',     id: 'Seri Buah' },
  'misc.indulgence_range':   { en: 'Indulgence Range', id: 'Rangkaian Indulgensi' },
  'misc.core_collection':    { en: 'Core Collection',  id: 'Koleksi Inti' },
  'misc.order_summary':      { en: 'Order Summary',    id: 'Ringkasan Pesanan' },
  'misc.items':              { en: 'Items',            id: 'Item' },
  'misc.member_since':       { en: 'Member since',     id: 'Anggota sejak' },
  'misc.why_question':       { en: 'Why Häagen-Dazs?', id: 'Mengapa Häagen-Dazs?' },
  'misc.filter_pints':       { en: 'Pints',            id: 'Pints' },
  'misc.filter_mini':        { en: 'Mini cups',        id: 'Gelas mini' },
  'misc.filter_sticks':      { en: 'Sticks',           id: 'Stik' },
  'misc.filter_cakes':       { en: 'Cakes',            id: 'Kue' },
  'misc.limited_edition':    { en: 'Limited Edition',  id: 'Edisi Terbatas' },
  'misc.bestseller':         { en: 'Bestseller',       id: 'Terlaris' },
  'misc.member_exclusive':   { en: 'Member exclusive · Offer', id: 'Eksklusif member · Penawaran' },
  'misc.more_indulgence':    { en: 'More visits,\nmore indulgence.', id: 'Lebih banyak kunjungan,\nlebih banyak nikmat.' },
  'misc.every_purchase':     { en: 'Every purchase brings you closer to your next reward.', id: 'Setiap pembelian membawa Anda lebih dekat ke hadiah berikutnya.' },
  'misc.gift_wrap_selected': { en: 'Signature wrap selected', id: 'Bungkusan signature dipilih' },
  'misc.notify_wa':          { en: 'Notify recipient via WhatsApp', id: 'Beri tahu penerima via WhatsApp' },
  'misc.on':                 { en: 'On',               id: 'Aktif' },
  'misc.confirmed':          { en: 'Confirmed',        id: 'Dikonfirmasi' },
  'misc.discover_eyebrow':   { en: 'Discover',         id: 'Temukan' },
  'misc.a_reason_return':    { en: 'A reason to return', id: 'Alasan kembali' },
}

/**
 * Translate a key to the given language, falling back to English.
 */
export function translate(key: string, lang: Lang): string {
  const entry = translations[key]
  if (!entry) return key
  return entry[lang] ?? entry['en'] ?? key
}

/** All translation keys — useful for type-safe lookups */
export type TranslationKey = keyof typeof translations
