import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Camera, Loader2, Check,
  AlertCircle, Sparkles, ImageOff, CreditCard, AlertTriangle,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useMenus } from '@/hooks/useMenus'
import { useCredits } from '@/hooks/useCredits'
import { useGeneration } from '@/hooks/useGeneration'
import { PhotoCard } from '@/components/photos/PhotoCard'
import { ShimmerCard } from '@/components/photos/ShimmerCard'
import { FullscreenViewer } from '@/components/photos/FullscreenViewer'
import type { MenuItem } from '@/types'

export function PhotosPage() {
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const { restaurant } = useRestaurant()
  const { items, loading: menuLoading, reload } = useMenus(restaurant?.id ?? null)
  const { credits, reload: reloadCredits } = useCredits()
  const { jobs, generating, progress, insufficientCredits, clearInsufficientCredits, generateBatch, regenerateOne, enhanceOne } = useGeneration()

  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const hasCredits = (credits?.remaining ?? 0) > 0

  // Profile completeness check for optimal generation
  const missingProfile: string[] = []
  if (!restaurant?.cuisine_profile_id) missingProfile.push(t('photos.missing.cuisine'))
  if (!restaurant?.style_photo_url) missingProfile.push(t('photos.missing.stylephoto'))
  const profileReady = missingProfile.length === 0

  // When Edge Function returns 402 (insufficient credits), open credits sheet
  useEffect(() => {
    if (insufficientCredits) {
      reloadCredits()
      window.dispatchEvent(new CustomEvent('open-credits-sheet'))
      clearInsufficientCredits()
    }
  }, [insufficientCredits, reloadCredits, clearInsufficientCredits])

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
  const selectedIds = (location.state as { selectedIds?: string[] } | null)?.selectedIds
  useEffect(() => {
    if (hasAutoStarted || !selectedIds?.length || !restaurant || menuLoading || items.length === 0 || !hasCredits || !profileReady) return
    setHasAutoStarted(true)

    const toProcess = items.filter(
      (i) => selectedIds.includes(i.id) && (!i.image_url || i.image_source === 'user'),
    )
    if (toProcess.length > 0) {
      generateBatch(toProcess, restaurant)
    }
  }, [selectedIds, restaurant, menuLoading, items, hasAutoStarted, hasCredits, generateBatch])

  // Split items
  const withPhotos = items.filter((i) => i.image_url)
  const withoutPhotos = items.filter((i) => !i.image_url)
  const userPhotosCount = items.filter((i) => i.image_source === 'user').length

  // Group photos by generation date
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
      if (item.image_source === 'user' && item.image_url) {
        await enhanceOne(item, restaurant, item.image_url)
      } else {
        await regenerateOne(item, restaurant)
      }
      reload()
    } catch {
      // Error is handled in the hook
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

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#C9A961]" size={32} />
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────────

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

  // ── Main content ─────────────────────────────────────────────────────────────

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

      {/* Generation in progress */}
      {generating && (
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
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

          {/* Progress bar */}
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

      {/* No credits banner */}
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
            onClick={() => window.dispatchEvent(new CustomEvent('open-credits-sheet'))}
            className="shrink-0 px-4 py-2.5 bg-[#C9A961] text-white text-xs font-semibold rounded-xl active:scale-95 transition-all"
          >
            {t('photos.buyCredits')}
          </button>
        </div>
      )}

      {/* Incomplete profile banner */}
      {!profileReady && !generating && items.length > 0 && (
        <div className="bg-[#D4895C]/10 border border-[#D4895C]/20 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-[#D4895C]/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-[#D4895C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2C2622]">{t('photos.profileIncomplete')}</p>
            <p className="text-xs text-[#2C2622]/50 mt-0.5">
              {missingProfile.join(' · ')}
            </p>
          </div>
          <button
            onClick={() => navigate('/profil')}
            className="shrink-0 px-4 py-2.5 bg-[#C9A961] text-white text-xs font-semibold rounded-xl active:scale-95 transition-all"
          >
            {t('photos.completeProfile')}
          </button>
        </div>
      )}

      {/* Shimmer placeholders while generating */}
      {generating && progress.done === 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs.map((job, i) => (
            <ShimmerCard key={job.itemId} name={job.itemName} index={i} />
          ))}
        </div>
      )}

      {/* Photo grid grouped by date */}
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

      {/* Enhance user photos button */}
      {userPhotosCount > 0 && !generating && restaurant && (
        <button
          onClick={() => {
            const userItems = items.filter((i) => i.image_source === 'user' && i.image_url)
            if (userItems.length > 0) generateBatch(userItems, restaurant)
          }}
          disabled={!!regenerating || !hasCredits || !profileReady}
          className="w-full py-4 bg-gradient-to-r from-[#C9A961] to-[#D4B96E] text-white rounded-2xl text-sm font-semibold
            shadow-[0_4px_16px_rgba(201,169,97,0.3)] active:scale-[0.98] transition-all
            disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          {t('photos.enhanceAll')} ({userPhotosCount})
        </button>
      )}

      {/* Pending items counter */}
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
          {restaurant && hasCredits && profileReady && (
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

      {/* Fullscreen viewer */}
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
