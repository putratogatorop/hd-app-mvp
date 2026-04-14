export default function OrderDetailLoading() {
  return (
    <div className="min-h-screen bg-hd-cream pb-24 animate-pulse">
      <header className="px-5 pt-10 pb-5 border-b border-hd-ink/15 flex items-center gap-3">
        <div className="w-11 h-11 border border-hd-ink/20" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-hd-ink/5" />
          <div className="h-6 w-40 bg-hd-ink/10" />
        </div>
      </header>

      <div className="px-5 pt-8 space-y-8">
        <div className="space-y-3">
          <div className="h-3 w-20 bg-hd-ink/5" />
          <div className="h-8 w-48 bg-hd-ink/10" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-baseline justify-between py-3 border-b border-hd-ink/10">
              <div className="h-4 w-1/2 bg-hd-ink/10" />
              <div className="h-4 w-20 bg-hd-ink/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
