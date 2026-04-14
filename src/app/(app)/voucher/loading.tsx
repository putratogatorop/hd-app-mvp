import { Eyebrow } from '@/components/ui'

export default function VoucherLoading() {
  return (
    <div className="min-h-screen bg-hd-cream pb-24 animate-pulse">
      <header className="px-5 pt-12 pb-5 border-b border-hd-ink/15">
        <Eyebrow number="04">Rewards</Eyebrow>
        <div className="mt-3 h-10 w-56 bg-hd-ink/10" />
      </header>

      <div className="px-5 pt-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-hd-ink/10 bg-hd-paper p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="h-3 w-24 bg-hd-ink/5" />
              <div className="h-3 w-16 bg-hd-ink/10" />
            </div>
            <div className="h-6 w-3/4 bg-hd-ink/10" />
            <div className="h-3 w-1/2 bg-hd-ink/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
