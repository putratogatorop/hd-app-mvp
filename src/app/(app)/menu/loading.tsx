import { Eyebrow } from '@/components/ui'

export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-hd-cream pb-28 animate-pulse">
      <header className="px-5 pt-12 pb-5 border-b border-hd-ink/15">
        <Eyebrow number="02">Menu</Eyebrow>
        <div className="mt-3 h-10 w-40 bg-hd-ink/10" />
        <div className="mt-4 h-4 w-56 bg-hd-ink/5" />
      </header>

      <div className="px-5 pt-6 flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-20 bg-hd-ink/10 shrink-0" />
        ))}
      </div>

      <div className="px-5 pt-6 grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/5] bg-hd-ink/10 border border-hd-ink/10" />
            <div className="h-4 w-3/4 bg-hd-ink/10" />
            <div className="h-3 w-1/2 bg-hd-ink/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
