import { Eyebrow } from '@/components/ui'

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-hd-cream pb-24 animate-pulse">
      <header className="px-5 pt-12 pb-5 border-b border-hd-ink/15">
        <Eyebrow number="03">Your dossier</Eyebrow>
        <div className="mt-3 h-10 w-44 bg-hd-ink/10" />
        <div className="flex gap-6 mt-6">
          <div className="h-5 w-24 bg-hd-ink/10" />
          <div className="h-5 w-20 bg-hd-ink/5" />
        </div>
      </header>

      <div className="px-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="py-5 border-b border-hd-ink/10 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="h-3 w-40 bg-hd-ink/5" />
              <div className="h-3 w-16 bg-hd-ink/10" />
            </div>
            <div className="h-5 w-2/3 bg-hd-ink/10" />
            <div className="h-3 w-1/3 bg-hd-ink/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
