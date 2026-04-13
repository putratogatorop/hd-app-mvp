import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { Gift } from 'lucide-react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Being prepared',
  confirmed: 'Confirmed',
  preparing: 'In our kitchen',
  ready: 'Ready for you',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default async function GiftReceiptPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = await createClient()

  const { data: order } = (await supabase
    .from('orders')
    .select(
      'id, status, is_gift, recipient_name, recipient_address, gift_message, scheduled_for, created_at, store:stores(name, address), order_items(quantity, menu_item:menu_items(name))'
    )
    .eq('gift_token', params.token)
    .eq('is_gift', true)
    .single()) as unknown as {
    data: {
      id: string
      status: string
      is_gift: boolean
      recipient_name: string | null
      recipient_address: string | null
      gift_message: string | null
      scheduled_for: string | null
      created_at: string
      store: { name: string; address: string } | null
      order_items: { quantity: number; menu_item: { name: string } | null }[]
    } | null
  }

  if (!order) notFound()

  const itemCount = order.order_items.reduce((s, i) => s + i.quantity, 0)

  return (
    <main className="min-h-screen bg-hd-cream">
      {/* Burgundy masthead */}
      <section className="relative overflow-hidden bg-hd-burgundy-dark text-hd-cream">
        <div className="texture-grain absolute inset-0 opacity-30" aria-hidden />
        <div
          className="absolute inset-0 opacity-70"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 80% 0%, rgba(184,146,42,0.3), transparent 60%), radial-gradient(ellipse 60% 60% at 0% 100%, rgba(128,18,55,0.55), transparent 70%)',
          }}
        />
        <div className="relative px-6 pt-12 pb-12 max-w-md mx-auto">
          <div className="flex items-center justify-between border-b border-hd-cream/25 pb-3">
            <Image
              src="/logo/logo-transparent.png"
              alt="Häagen-Dazs"
              width={120}
              height={32}
              priority
              className="h-8 w-auto object-contain"
            />
            <span className="numeral text-[0.6rem] text-hd-cream/70 tracking-widest">A GIFT</span>
          </div>

          <div className="mt-10">
            <Gift className="w-8 h-8 text-hd-gold-light" />
            <p className="eyebrow text-hd-gold-light mt-5">
              For {order.recipient_name ?? 'you'}
            </p>
            <h1 className="mt-4 font-display text-display-lg leading-[0.95] tracking-editorial">
              A small <span className="italic">luxury,</span>
              <br />
              with love.
            </h1>
            <p className="mt-6 text-[0.92rem] leading-relaxed text-hd-cream/80">
              Someone has sent you a Häagen-Dazs gift. Track its journey below.
            </p>
          </div>
        </div>
      </section>

      {/* Personal note */}
      {order.gift_message && (
        <section className="px-6 py-10 max-w-md mx-auto border-b border-hd-ink/10">
          <span className="eyebrow text-hd-ink/60">A note</span>
          <blockquote className="mt-4 font-display italic text-[1.3rem] leading-snug text-hd-ink tracking-editorial">
            &ldquo;{order.gift_message}&rdquo;
          </blockquote>
        </section>
      )}

      {/* What's coming */}
      <section className="px-6 py-8 max-w-md mx-auto border-b border-hd-ink/10">
        <div className="flex items-end justify-between border-b border-hd-ink/15 pb-3">
          <span className="eyebrow text-hd-ink/60">
            <span className="numeral text-hd-ink mr-2">{String(itemCount).padStart(2, '0')}</span>
            What&apos;s coming
          </span>
        </div>
        <ul className="divide-y divide-hd-ink/10">
          {order.order_items.map((line, i) => (
            <li key={i} className="py-4 flex items-baseline justify-between gap-4">
              <p className="font-display text-[1rem] text-hd-ink tracking-editorial">
                {line.menu_item?.name ?? '—'}
              </p>
              <span className="numeral text-[0.85rem] text-hd-ink/60">
                × {line.quantity}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Status */}
      <section className="px-6 py-8 max-w-md mx-auto border-b border-hd-ink/10">
        <span className="eyebrow text-hd-ink/60">Status</span>
        <p className="mt-3 font-display italic text-[1.5rem] text-hd-burgundy tracking-editorial">
          {STATUS_LABELS[order.status] ?? order.status}
        </p>
        {order.scheduled_for && (
          <p className="mt-2 numeral text-[0.8rem] text-hd-ink/60">
            Scheduled · {new Date(order.scheduled_for).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        )}
        {order.store && (
          <p className="mt-4 text-[0.85rem] text-hd-ink/70">
            From <span className="font-display italic">{order.store.name}</span>
            <br />
            <span className="text-hd-ink/50 text-[0.78rem]">{order.store.address}</span>
          </p>
        )}
      </section>

      {/* CTA */}
      <section className="px-6 py-10 max-w-md mx-auto text-center">
        <p className="font-display italic text-[1rem] text-hd-ink/65">
          Want to send one yourself?
        </p>
        <a
          href="/login"
          className="mt-4 inline-flex items-center justify-center min-h-[52px] px-8 bg-hd-burgundy text-hd-cream eyebrow tracking-wider hover:bg-hd-burgundy-dark transition-colors"
        >
          Open Häagen-Dazs
        </a>
        <p className="mt-10 text-[0.65rem] tracking-widest uppercase text-hd-ink/30">
          © Häagen-Dazs Indonesia · Est. 1960
        </p>
      </section>
    </main>
  )
}
