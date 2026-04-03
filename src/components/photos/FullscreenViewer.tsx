import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, RefreshCw, Download, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { MenuItem } from '@/types'

export function FullscreenViewer({
  items,
  currentIndex,
  regenerating,
  onClose,
  onNavigate,
  onRegenerate,
  onDownload,
}: {
  items: MenuItem[]
  currentIndex: number
  regenerating: string | null
  onClose: () => void
  onNavigate: (index: number) => void
  onRegenerate: (item: MenuItem) => void
  onDownload: (item: MenuItem) => void
}) {
  const { t } = useI18n()
  const item = items[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < items.length - 1

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentIndex, hasPrev, hasNext, onClose, onNavigate])

  if (!item) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fullscreen-enter">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          <p className="font-serif font-semibold text-lg truncate">{item.nom}</p>
          <p className="text-xs text-white/40 mt-0.5">
            {item.categorie}
            {item.prix ? ` · ${item.prix}` : ''}
            <span className="ml-2">{currentIndex + 1} {t('photos.counter')} {items.length}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 active:bg-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={22} />
        </button>
      </div>

      {/* Image + navigation arrows */}
      <div className="flex-1 flex items-center justify-center relative px-4">
        {hasPrev && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-2 lg:left-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
            aria-label={t('photos.prev')}
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
        )}

        <img
          src={item.image_url!}
          alt={item.nom}
          className="max-w-full max-h-full object-contain rounded-xl select-none"
          draggable={false}
        />

        {regenerating === item.id && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#C9A961]" />
              <p className="text-white/70 text-xs">{t('photos.generating')}</p>
            </div>
          </div>
        )}

        {hasNext && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-2 lg:right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
            aria-label={t('photos.next')}
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-center gap-8 px-6 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <button
          onClick={() => onRegenerate(item)}
          disabled={regenerating === item.id}
          className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white active:text-[#C9A961] transition-colors disabled:opacity-40"
        >
          {regenerating === item.id ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <RefreshCw size={22} />
          )}
          <span className="text-[10px] font-medium">{t('photos.regenerate')}</span>
        </button>
        <button
          onClick={() => onDownload(item)}
          className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white active:text-[#C9A961] transition-colors"
        >
          <Download size={22} />
          <span className="text-[10px] font-medium">{t('photos.download')}</span>
        </button>
      </div>
    </div>
  )
}
