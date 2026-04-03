import { Sparkles } from 'lucide-react'

export function ShimmerCard({ name, index }: { name: string; index: number }) {
  return (
    <div
      className="animate-photo-reveal relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#F0EDE8]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-progress-indeterminate" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
        <div className="w-12 h-12 rounded-full bg-[#C9A961]/10 flex items-center justify-center">
          <Sparkles size={20} className="text-[#C9A961] animate-shimmer-pulse" />
        </div>
        <p className="text-xs text-[#2C2622]/50 font-medium text-center truncate max-w-full">{name}</p>
      </div>
    </div>
  )
}
