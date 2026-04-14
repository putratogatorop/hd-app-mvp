import Image from 'next/image'
import Link from 'next/link'
import { Gift, MessageCircle, Calendar, ArrowUpRight, Check } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kirim Hadiah · Häagen-Dazs Indonesia',
  description:
    'Send a Häagen-Dazs gift with a personal note, scheduled delivery, and a private receipt for your recipient. For birthdays, anniversaries, and every occasion in between.',
  openGraph: {
    title: 'Send a Häagen-Dazs Gift',
    description: 'A small luxury, sealed with a note. Scheduled delivery across Jakarta.',
    type: 'website',
  },
}

const steps = [
  {
    num: '01',
    Icon: Gift,
    title: 'Choose their treat',
    tagline: 'Pick from ice cream, patisserie, or a curated duo.',
  },
  {
    num: '02',
    Icon: MessageCircle,
    title: 'Write a note',
    tagline: 'Your words, not ours — up to 240 characters.',
  },
  {
    num: '03',
    Icon: Calendar,
    title: 'We deliver, sealed',
    tagline: 'ASAP or scheduled — with a private tracking link.',
  },
]

const occasions = [
  'Ulang tahun',
  'Hari jadi',
  'Valentine\u2019s',
  'Hari Ibu',
  'Imlek',
  'Lebaran',
  'Natal',
  'Pindah rumah',
  'Corporate',
]

export default function GiftLandingPage() {
  return (
    <main className="min-h-screen bg-hd-cream">
      {/* Masthead */}
      <section className="relative overflow-hidden bg-hd-burgundy-dark text-hd-cream">
        <div className="texture-grain absolute inset-0 opacity-30" aria-hidden />
        <div
          className="absolute inset-0 opacity-70"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 80% 0%, rgba(184,146,42,0.35), transparent 60%), radial-gradient(ellipse 60% 60% at 0% 100%, rgba(128,18,55,0.55), transparent 70%)',
          }}
        />
        <div className="relative px-6 pt-12 pb-14 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-hd-cream/25 pb-3">
            <Image
              src="/logo/logo-transparent.png"
              alt="Häagen-Dazs"
              width={120}
              height={32}
              priority
              className="h-8 w-auto object-contain"
            />
            <span className="numeral text-[0.6rem] text-hd-cream/70 tracking-widest">THE GIFT</span>
          </div>

          <div className="mt-12">
            <p className="eyebrow text-hd-gold-light">Nouveau</p>
            <h1 className="mt-5 font-display text-display-xl leading-[0.92] tracking-editorial">
              A small luxury,
              <br />
              <span className="italic">sealed and signed.</span>
            </h1>
            <p className="mt-7 max-w-lg text-[0.95rem] leading-relaxed text-hd-cream/80">
              Send Häagen-Dazs anywhere in Jakarta with a personal note, your chosen delivery
              date, and a private tracking link — just for them.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/menu?gift=1"
                className="inline-flex items-center justify-center min-h-[52px] px-7 bg-hd-gold text-hd-burgundy-dark eyebrow tracking-wider hover:bg-hd-gold/90 transition-colors gap-3"
              >
                Send a gift
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/menu"
                className="inline-flex items-center justify-center min-h-[52px] px-6 border border-hd-cream/35 hover:border-hd-cream text-hd-cream transition-colors eyebrow tracking-wider"
              >
                Browse menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-14 max-w-2xl mx-auto">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-4">
          <div className="flex items-baseline gap-4">
            <span className="numeral text-[0.7rem] text-hd-ink/50 tracking-widest">01</span>
            <h2 className="font-display text-[1.5rem] text-hd-ink tracking-editorial">
              How it <span className="italic">works</span>
            </h2>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-px bg-hd-ink/10 border border-hd-ink/10">
          {steps.map(({ num, Icon, title, tagline }) => (
            <div key={num} className="bg-hd-paper p-6 min-h-[180px] flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <span className="numeral text-[0.7rem] text-hd-ink/45 tracking-widest">{num}</span>
                <Icon className="w-5 h-5 text-hd-burgundy" />
              </div>
              <div className="mt-auto">
                <p className="font-display text-[1.15rem] text-hd-ink tracking-editorial leading-tight">
                  {title}
                </p>
                <p className="mt-2 text-[0.82rem] italic text-hd-ink/60">{tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-14 max-w-2xl mx-auto bg-hd-paper border-y border-hd-ink/10">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-4">
          <div className="flex items-baseline gap-4">
            <span className="numeral text-[0.7rem] text-hd-ink/50 tracking-widest">02</span>
            <h2 className="font-display text-[1.5rem] text-hd-ink tracking-editorial">
              What&rsquo;s included
            </h2>
          </div>
        </div>

        <ul className="mt-8 grid md:grid-cols-2 gap-x-8 gap-y-4">
          {[
            'A sealed, branded gift presentation',
            'A 240-character handwritten-style note',
            'Scheduled delivery — ASAP or a chosen date',
            'Private receipt page, no prices shown',
            'WhatsApp arrival notification to the recipient',
            'Points earned for every gift sent',
          ].map((line) => (
            <li key={line} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-hd-burgundy mt-1 shrink-0" />
              <span className="text-[0.92rem] text-hd-ink/85 leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Occasions */}
      <section className="px-6 py-14 max-w-2xl mx-auto">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-4">
          <div className="flex items-baseline gap-4">
            <span className="numeral text-[0.7rem] text-hd-ink/50 tracking-widest">03</span>
            <h2 className="font-display text-[1.5rem] text-hd-ink tracking-editorial">
              For every <span className="italic">occasion</span>
            </h2>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {occasions.map((o) => (
            <span
              key={o}
              className="inline-flex items-center px-3 py-1.5 border border-hd-ink/20 bg-hd-paper eyebrow text-hd-ink/70 text-[0.65rem]"
            >
              {o}
            </span>
          ))}
        </div>
      </section>

      {/* Pull quote */}
      <section className="px-6 py-14 bg-hd-burgundy-dark text-hd-cream">
        <div className="max-w-xl mx-auto text-center">
          <p className="eyebrow text-hd-gold-light">Said by a sender</p>
          <blockquote className="mt-6 font-display italic text-[1.6rem] leading-snug tracking-editorial">
            &ldquo;I forgot her birthday until 9pm. By 10:30 she was
            messaging me a photo of the note. Saved, and then some.&rdquo;
          </blockquote>
          <p className="mt-5 eyebrow text-hd-cream/60">— Adi, Jakarta</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 max-w-2xl mx-auto text-center">
        <p className="eyebrow text-hd-ink/55">Ready?</p>
        <h3 className="mt-4 font-display text-[2.25rem] text-hd-ink tracking-editorial leading-tight">
          Send something <span className="italic">unforgettable.</span>
        </h3>
        <Link
          href="/menu?gift=1"
          className="mt-8 inline-flex items-center justify-center min-h-[56px] px-8 bg-hd-burgundy text-hd-cream eyebrow tracking-wider hover:bg-hd-burgundy-dark transition-colors gap-3"
        >
          Start your gift
          <ArrowUpRight className="w-4 h-4" />
        </Link>
        <p className="mt-12 text-[0.65rem] tracking-widest uppercase text-hd-ink/30">
          © Häagen-Dazs Indonesia · Est. 1960
        </p>
      </section>
    </main>
  )
}
