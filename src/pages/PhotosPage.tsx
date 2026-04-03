import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Camera, Download, RefreshCw, X, Loader2, Check,
  AlertCircle, ChevronLeft, ChevronRight, Sparkles, ImageOff, CreditCard,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useMenus } from '@/hooks/useMenus'
import { useCredits } from '@/hooks/useCredits'
import { useGeneration } from '@/hooks/useGeneration'
import type { MenuItem } from '@/types'

// ── Photo card with staggered reveal ────────────────────────────────────────

function PhotoCard({
  item,
  index,
  regenerating,
  onClick,
  onDownload,
}: {
  item: MenuItem
  index: number
  regenerating: boolean
  onClick: () => void
  onDownload: () => void
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
          <button
            onClick={(e) => { e.stopPropagation(); onDownload() }}
            className="shrink-0 p-1.5 rounded-full bg-white/15 hover:bg-white/30 active:scale-90 transition-all"
            aria-label="Download"
          >
            <Download size={14} className="text-white" />
          </button>
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
  const navigate = useNavigate()
  const { restaurant } = useRestaurant()
  const { items, loading: menuLoading, reload } = useMenus(restaurant?.id ?? null)
  const { credits, reload: reloadCredits } = useCredits()
  const { jobs, generating, progress, generateBatch, regenerateOne, enhanceOne } = useGeneration()

  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const hasCredits = (credits?.remaining ?? 0) > 0

  // Reload items + credits from DB when generation finishes
  const prevGenerating = useRef(false)
  useEffect(() => {
    if (prevGenerating.current && !generating) {
      reload()
      reloadCredits()
    }
    prevGenerating.current = generating
  }, [generating, reload, reloadCredits])

  // Auto-start generation if we arrived from MenuPage with selectedIds
  // Includes user-uploaded photos (image_source='user') for automatic enhance
  const selectedIds = (location.state as { selectedIds?: string[] } | null)?.selectedIds
  useEffect(() => {
    if (hasAutoStarted || !selectedIds?.length || !restaurant || menuLoading || items.length === 0 || !hasCredits) return
    setHasAutoStarted(true)

    const toProcess = items.filter(
      (i) => selectedIds.includes(i.id) && (!i.image_url || i.image_source === 'user'),
    )
    if (toProcess.length > 0) {
      generateBatch(toProcess, restaurant)
    }
  }, [selectedIds, restaurant, menuLoading, items, hasAutoStarted, hasCredits, generateBatch])

  // Split items — user photos need enhance, generated photos are done
  const withPhotos = items.filter((i) => i.image_url)
  const withoutPhotos = items.filter((i) => !i.image_url)
  const userPhotosCount = items.filter((i) => i.image_source === 'user').length

  // Group photos by generation date (most recent first)
  const photoGroups = useMemo(() => {
    const groups = new Map<string, { label: string; sortKey: string; items: MenuItem[]; globalIndices: number[] }>()

    withPhotos.forEach((item, globalIndex) => {
      let dateKey: string
      let label: string
      let sortKey: string

      if (item.generated_at) {
        const d = new Date(item.generated_at)
        dateKey = d.toISOString().slice(0, 10)
        sortKey = dateKey
        const today = new Date().toISOString().slice(0, 10)
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        if (dateKey === today) label = t('photos.today')
        else if (dateKey === yesterday) label = t('photos.yesterday')
        else label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      } else {
        dateKey = '__uploaded__'
        sortKey = '9999-99-99'
        label = t('photos.uploaded')
      }

      if (!groups.has(dateKey)) groups.set(dateKey, { label, sortKey, items: [], globalIndices: [] })
      const group = groups.get(dateKey)!
      group.items.push(item)
      group.globalIndices.push(globalIndex)
    })

    return [...groups.values()].sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  }, [withPhotos, t])

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

  async function handleDownload(item: MenuItem) {
    if (!item.image_url) return
    try {
      const res = await fetch(item.image_url)
      const blob = await res.blob()
      const ext = blob.type.includes('webp') ? 'webp' : blob.type.includes('png') ? 'png' : 'jpg'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.nom.replace(/\s+/g, '_')}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(item.image_url, '_blank')
    }
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
                {job.type === 'enhance' && (
                  <span className="text-[10px] text-[#C9A961]/70 font-medium">
                    {t('photos.enhance.label')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── No credits banner ─────────────────────────────────────────────────── */}
      {!hasCredits && !generating && (withoutPhotos.length > 0 || userPhotosCount > 0) && (
        <div className="bg-[#D4895C]/10 border border-[#D4895C]/20 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-[#D4895C]/10 flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-[#D4895C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2C2622]">{t('photos.noCredits')}</p>
            <p className="text-xs text-[#2C2622]/50 mt-0.5">{t('photos.noCredits.desc')}</p>
          </div>
          <button
            onClick={() => navigate('/profil')}
            className="shrink-0 px-4 py-2.5 bg-[#C9A961] text-white text-xs font-semibold rounded-xl active:scale-95 transition-all"
          >
            {t('photos.buyCredits')}
          </button>
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

      {/* ── Photo grid grouped by date ─────────────────────────────────────────── */}
      {photoGroups.map((group) => (
        <div key={group.label} className="space-y-2">
          {photoGroups.length > 1 && (
            <h2 className="text-xs font-semibold text-[#2C2622]/30 uppercase tracking-wider">
              {group.label} ({group.items.length})
            </h2>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {group.items.map((item, i) => (
              <PhotoCard
                key={item.id}
                item={item}
                index={i}
                regenerating={regenerating === item.id}
                onClick={() => setFullscreenIndex(group.globalIndices[i])}
                onDownload={() => handleDownload(item)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* ── Enhance user photos button — launches batch enhance ─────────────── */}
      {userPhotosCount > 0 && !generating && restaurant && (
        <button
          onClick={() => {
            const userItems = items.filter((i) => i.image_source === 'user' && i.image_url)
            if (userItems.length > 0) generateBatch(userItems, restaurant)
          }}
          disabled={!!regenerating || !hasCredits}
          className="w-full py-4 bg-gradient-to-r from-[#C9A961] to-[#D4B96E] text-white rounded-2xl text-sm font-semibold
            shadow-[0_4px_16px_rgba(201,169,97,0.3)] active:scale-[0.98] transition-all
            disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          {t('photos.enhanceAll')} ({userPhotosCount})
        </button>
      )}

      {/* ── Pending items counter ──────────────────────────────────────────────── */}
      {withoutPhotos.length > 0 && !generating && (
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-[#F0EDE8] flex items-center justify-center shrink-0">
            <ImageOff size={18} className="text-[#2C2622]/20" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#2C2622]">
              {withoutPhotos.length} {t('photos.pendingCount')}
            </p>
            <p className="text-xs text-[#2C2622]/40 mt-0.5">{t('photos.pendingCount.desc')}</p>
          </div>
          {restaurant && hasCredits && (
            <button
              onClick={() => generateBatch(withoutPhotos, restaurant)}
              disabled={generating}
              className="shrink-0 px-4 py-2.5 bg-[#C9A961] text-white text-xs font-semibold rounded-xl active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles size={14} className="inline mr-1" />
              {t('photos.generateAll')}
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
