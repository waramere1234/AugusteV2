import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Camera, Download, RefreshCw, X, Loader2, Check,
  AlertCircle, ChevronLeft, ChevronRight, Sparkles, ImageOff,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useMenus } from '@/hooks/useMenus'
import { useGeneration, type GenerationJob } from '@/hooks/useGeneration'
import type { MenuItem } from '@/types'

// ── Photo card with staggered reveal ────────────────────────────────────────

function PhotoCard({
  item,
  index,
  regenerating,
  onClick,
}: {
  item: MenuItem
  index: number
  regenerating: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="animate-photo-reveal relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 aspect-[4/5] bg-[#F0EDE8]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <img
        src={item.image_url!}
        alt={item.nom}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />

      {/* Gradient overlay — always visible on mobile, on hover on desktop */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-12 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-white text-sm font-medium truncate leading-tight">{item.nom}</p>
        {item.prix && (
          <p className="text-white/60 text-xs mt-0.5">{item.prix}</p>
        )}
      </div>

      {/* Category pill — top left */}
      <div className="absolute top-2.5 left-2.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
        <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          {item.categorie}
        </span>
      </div>

      {/* User photo badge — top right */}
      {item.image_source === 'user' && !regenerating && (
        <div className="absolute top-2.5 right-2.5">
          <span className="bg-[#C9A961] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={9} />
            ENHANCE
          </span>
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
    </button>
  )
}

// ── Generation shimmer card (placeholder while generating) ──────────────────

function ShimmerCard({ name, index }: { name: string; index: number }) {
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

// ── Pending item row ────────────────────────────────────────────────────────

function PendingItem({ item, job }: { item: MenuItem; job?: GenerationJob }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
      <div className="w-11 h-11 rounded-lg bg-[#F0EDE8] flex items-center justify-center shrink-0">
        {job?.status === 'error' ? (
          <AlertCircle size={18} className="text-[#D4895C]" />
        ) : (
          <ImageOff size={16} className="text-[#2C2622]/20" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2C2622] truncate">{item.nom}</p>
        <p className="text-xs text-[#2C2622]/40">{item.categorie}</p>
      </div>
      {job?.status === 'error' && (
        <span className="text-[10px] text-[#D4895C] font-medium shrink-0">{job.error}</span>
      )}
    </div>
  )
}

// ── Fullscreen viewer with prev/next ────────────────────────────────────────

function FullscreenViewer({
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
        {/* Prev arrow */}
        {hasPrev && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-2 lg:left-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
            aria-label={t('photos.prev')}
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
        )}

        {/* Image */}
        <img
          src={item.image_url!}
          alt={item.nom}
          className="max-w-full max-h-full object-contain rounded-xl select-none"
          draggable={false}
        />

        {/* Regenerating overlay */}
        {regenerating === item.id && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#C9A961]" />
              <p className="text-white/70 text-xs">{t('photos.generating')}</p>
            </div>
          </div>
        )}

        {/* Next arrow */}
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

// ── Main page ───────────────────────────────────────────────────────────────

export function PhotosPage() {
  const { t } = useI18n()
  const location = useLocation()
  const { restaurant } = useRestaurant()
  const { items, loading: menuLoading, reload } = useMenus(restaurant?.id ?? null)
  const { jobs, generating, progress, generateBatch, regenerateOne, enhanceOne } = useGeneration()

  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)

  // Reload items from DB when generation finishes (images are now persisted)
  const prevGenerating = useRef(false)
  useEffect(() => {
    if (prevGenerating.current && !generating) {
      reload()
    }
    prevGenerating.current = generating
  }, [generating, reload])

  // Auto-start generation if we arrived from MenuPage with selectedIds
  const selectedIds = (location.state as { selectedIds?: string[] } | null)?.selectedIds
  useEffect(() => {
    if (hasAutoStarted || !selectedIds?.length || !restaurant || menuLoading || items.length === 0) return
    setHasAutoStarted(true)

    const toGenerate = items.filter(
      (i) => selectedIds.includes(i.id) && !i.image_url,
    )
    if (toGenerate.length > 0) {
      generateBatch(toGenerate, restaurant)
    }
  }, [selectedIds, restaurant, menuLoading, items, hasAutoStarted, generateBatch])

  // Split items — user photos need enhance, generated photos are done
  const withPhotos = items.filter((i) => i.image_url)
  const withoutPhotos = items.filter((i) => !i.image_url)
  const userPhotosCount = items.filter((i) => i.image_source === 'user').length

  function getJob(itemId: string): GenerationJob | undefined {
    return jobs.find((j) => j.itemId === itemId)
  }

  const handleRegenerate = useCallback(async (item: MenuItem) => {
    if (!restaurant) return
    setRegenerating(item.id)
    try {
      let newUrl: string | null = null
      if (item.image_source === 'user' && item.image_url) {
        // User photo → enhance it (use the Storage URL as reference)
        newUrl = await enhanceOne(item, restaurant, item.image_url)
      } else {
        // AI photo → regenerate from scratch
        newUrl = await regenerateOne(item, restaurant)
      }
      if (newUrl) reload()
    } catch (err) {
      console.error('Regenerate/enhance error:', err)
    }
    setRegenerating(null)
  }, [restaurant, regenerateOne, enhanceOne, reload])

  function handleDownload(item: MenuItem) {
    if (!item.image_url) return
    const a = document.createElement('a')
    a.href = item.image_url
    a.download = `${item.nom.replace(/\s+/g, '_')}.png`
    a.target = '_blank'
    a.click()
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#C9A961]" size={32} />
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (items.length === 0 && !generating) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('photos.title')}</h1>
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-[#F0EDE8] flex items-center justify-center">
            <Camera size={32} className="text-[#2C2622]/20" />
          </div>
          <p className="text-sm font-medium text-[#2C2622]/60 mb-1">{t('photos.empty')}</p>
          <p className="text-xs text-[#2C2622]/30 max-w-[240px] mx-auto">{t('photos.empty.desc')}</p>
        </div>
      </div>
    )
  }

  // ── Main content ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('photos.title')}</h1>
        {withPhotos.length > 0 && (
          <span className="text-xs font-medium text-[#2C2622]/30 bg-[#F0EDE8] px-2.5 py-1 rounded-full">
            {withPhotos.length} / {items.length}
          </span>
        )}
      </div>

      {/* ── Generation in progress ────────────────────────────────────────────── */}
      {generating && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A961]/10 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-[#C9A961] animate-shimmer-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#2C2622]">{t('photos.generating')}</p>
              <p className="text-xs text-[#2C2622]/40 mt-0.5">{t('photos.generating.desc')}</p>
            </div>
            <span className="text-sm font-semibold text-[#C9A961] tabular-nums">
              {progress.done}/{progress.total}
            </span>
          </div>

          {/* Progress bar — indeterminate when 0 done, determinate otherwise */}
          <div className="w-full h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
            {progress.done === 0 ? (
              <div className="h-full w-1/3 bg-[#C9A961] rounded-full animate-progress-indeterminate" />
            ) : (
              <div
                className="h-full bg-[#C9A961] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            )}
          </div>

          {/* Job list */}
          <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-hide">
            {jobs.map((job) => (
              <div key={job.itemId} className="flex items-center gap-2.5 text-xs py-0.5">
                {job.status === 'pending' && (
                  <div className="w-4 h-4 rounded-full border-[1.5px] border-[#2C2622]/15 shrink-0" />
                )}
                {job.status === 'generating' && (
                  <Loader2 size={14} className="animate-spin text-[#C9A961] shrink-0" />
                )}
                {job.status === 'done' && (
                  <div className="w-4 h-4 rounded-full bg-[#7C9A6B] flex items-center justify-center shrink-0">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                )}
                {job.status === 'error' && (
                  <AlertCircle size={14} className="text-[#D4895C] shrink-0" />
                )}
                <span className={
                  job.status === 'generating' ? 'text-[#C9A961] font-medium' :
                  job.status === 'done' ? 'text-[#7C9A6B]' :
                  job.status === 'error' ? 'text-[#D4895C]' :
                  'text-[#2C2622]/40'
                }>
                  {job.itemName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Shimmer placeholders while generating ─────────────────────────────── */}
      {generating && progress.done === 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs.map((job, i) => (
            <ShimmerCard key={job.itemId} name={job.itemName} index={i} />
          ))}
        </div>
      )}

      {/* ── Photo grid ────────────────────────────────────────────────────────── */}
      {withPhotos.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {withPhotos.map((item, i) => (
            <PhotoCard
              key={item.id}
              item={item}
              index={i}
              regenerating={regenerating === item.id}
              onClick={() => setFullscreenIndex(i)}
            />
          ))}
        </div>
      )}

      {/* ── Enhance user photos button ───────────────────────────────────────── */}
      {userPhotosCount > 0 && !generating && restaurant && (
        <button
          onClick={async () => {
            const userItems = items.filter((i) => i.image_source === 'user' && i.image_url)
            for (const item of userItems) {
              setRegenerating(item.id)
              try {
                await enhanceOne(item, restaurant, item.image_url!)
              } catch (err) {
                console.error(`Enhance failed for ${item.nom}:`, err)
              }
              setRegenerating(null)
            }
            reload()
          }}
          disabled={!!regenerating}
          className="w-full py-4 bg-gradient-to-r from-[#C9A961] to-[#D4B96E] text-white rounded-2xl text-sm font-semibold
            shadow-[0_4px_16px_rgba(201,169,97,0.3)] active:scale-[0.98] transition-all
            disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          {t('photos.enhanceAll')} ({userPhotosCount})
        </button>
      )}

      {/* ── Pending items ─────────────────────────────────────────────────────── */}
      {withoutPhotos.length > 0 && !generating && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-[#2C2622]/30 uppercase tracking-wider">
            {t('photos.noPhoto')} ({withoutPhotos.length})
          </h2>
          <div className="space-y-2">
            {withoutPhotos.map((item) => (
              <PendingItem key={item.id} item={item} job={getJob(item.id)} />
            ))}
          </div>

          {/* Generate all */}
          {restaurant && (
            <button
              onClick={() => generateBatch(withoutPhotos, restaurant)}
              disabled={generating}
              className="w-full mt-2 py-4 bg-[#C9A961] text-white rounded-2xl text-sm font-semibold
                shadow-[0_4px_16px_rgba(201,169,97,0.3)] active:scale-[0.98] transition-all
                disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              {t('photos.generateAll')} ({withoutPhotos.length})
            </button>
          )}
        </div>
      )}

      {/* ── Fullscreen viewer ─────────────────────────────────────────────────── */}
      {fullscreenIndex !== null && (
        <FullscreenViewer
          items={withPhotos}
          currentIndex={fullscreenIndex}
          regenerating={regenerating}
          onClose={() => setFullscreenIndex(null)}
          onNavigate={setFullscreenIndex}
          onRegenerate={handleRegenerate}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}
