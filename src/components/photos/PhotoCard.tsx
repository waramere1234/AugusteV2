import { Camera, Download, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import type { MenuItem } from '@/types'

export function PhotoCard({
  item,
  index,
  regenerating,
  onClick,
  onDownload,
  onRegenerate,
}: {
  item: MenuItem
  index: number
  regenerating: boolean
  onClick: () => void
  onDownload: () => void
  onRegenerate?: () => void
}) {
  return (
    <div
      className="animate-photo-reveal relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 aspect-[4/5] bg-[#F0EDE8] cursor-pointer"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={onClick}
    >
      <img
        src={item.image_url!}
        alt={item.nom}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />

      {/* Gradient overlay — always visible on mobile, on hover on desktop */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-12 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">{item.nom}</p>
            {item.prix && (
              <p className="text-white/60 text-xs mt-0.5">{item.prix}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onRegenerate && (
              <button
                onClick={(e) => { e.stopPropagation(); onRegenerate() }}
                disabled={regenerating}
                className="p-1.5 rounded-full bg-white/15 hover:bg-[#C9A961]/80 active:scale-90 transition-all disabled:opacity-50"
                aria-label="Regenerate"
              >
                <RefreshCw size={14} className="text-white" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDownload() }}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/30 active:scale-90 transition-all"
              aria-label="Download"
            >
              <Download size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Category pill — top left */}
      <div className="absolute top-2.5 left-2.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
        <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          {item.categorie}
        </span>
      </div>

      {/* Source badge — top right */}
      {!regenerating && (
        <div className="absolute top-2.5 right-2.5">
          {item.image_source === 'user' && (
            <span className="bg-[#C9A961] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Camera size={9} />
              PHOTO
            </span>
          )}
          {item.image_source === 'enhanced' && (
            <span className="bg-[#C9A961]/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={9} />
              ENHANCED
            </span>
          )}
          {item.image_source === 'generated' && (
            <span className="bg-[#2C2622]/50 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={9} />
              IA
            </span>
          )}
        </div>
      )}

      {/* Regenerating overlay */}
      {regenerating && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={28} className="animate-spin text-[#C9A961]" />
          </div>
        </div>
      )}
    </div>
  )
}
