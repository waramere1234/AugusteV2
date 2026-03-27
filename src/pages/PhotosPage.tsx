import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Camera, Download, RefreshCw, X, Loader2, Check, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useMenus } from '@/hooks/useMenus'
import { useGeneration, type GenerationJob } from '@/hooks/useGeneration'
import type { MenuItem } from '@/types'

export function PhotosPage() {
  const { t } = useI18n()
  const location = useLocation()
  const { restaurant } = useRestaurant()
  const { items, loading: menuLoading } = useMenus(restaurant?.id ?? null)
  const { jobs, generating, progress, generateBatch, regenerateOne } = useGeneration()

  const [fullscreenItem, setFullscreenItem] = useState<MenuItem | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)

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

  // Split items into those with photos and those without
  const withPhotos = items.filter((i) => i.image_url)
  const withoutPhotos = items.filter((i) => !i.image_url)

  // Find job status for an item
  function getJob(itemId: string): GenerationJob | undefined {
    return jobs.find((j) => j.itemId === itemId)
  }

  // Regenerate a single photo
  async function handleRegenerate(item: MenuItem) {
    if (!restaurant) return
    setRegenerating(item.id)
    const newUrl = await regenerateOne(item, restaurant)
    if (newUrl) {
      // Update local state would happen via reload, but for immediate feedback:
      item.image_url = newUrl
    }
    setRegenerating(null)
  }

  // Download photo
  function handleDownload(item: MenuItem) {
    if (!item.image_url) return
    const a = document.createElement('a')
    a.href = item.image_url
    a.download = `${item.nom.replace(/\s+/g, '_')}.png`
    a.target = '_blank'
    a.click()
  }

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
        <div className="text-center py-16 text-gray-400">
          <Camera size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm mb-1">{t('photos.empty')}</p>
          <p className="text-xs text-gray-300">{t('photos.empty.desc')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('photos.title')}</h1>
        {withPhotos.length > 0 && (
          <span className="text-xs text-gray-400">
            {withPhotos.length} / {items.length}
          </span>
        )}
      </div>

      {/* Generation progress bar */}
      {generating && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#2C2622] font-medium">{t('photos.generating')}</span>
            <span className="text-gray-400">
              {progress.done}/{progress.total}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C9A961] rounded-full transition-all duration-500"
              style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
          {/* Current jobs list */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {jobs.map((job) => (
              <div key={job.itemId} className="flex items-center gap-2 text-xs">
                {job.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />}
                {job.status === 'generating' && <Loader2 size={14} className="animate-spin text-[#C9A961]" />}
                {job.status === 'done' && <Check size={14} className="text-[#7C9A6B]" />}
                {job.status === 'error' && <AlertCircle size={14} className="text-red-500" />}
                <span className={job.status === 'generating' ? 'text-[#C9A961] font-medium' : 'text-gray-500'}>
                  {job.itemName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo grid */}
      {withPhotos.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {withPhotos.map((item) => (
            <button
              key={item.id}
              onClick={() => setFullscreenItem(item)}
              className="relative group rounded-xl overflow-hidden shadow-sm aspect-square bg-gray-100"
            >
              <img
                src={item.image_url!}
                alt={item.nom}
                className="w-full h-full object-cover"
              />
              {/* Overlay with name */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                <p className="text-white text-xs font-medium truncate">{item.nom}</p>
                {item.prix && (
                  <p className="text-white/70 text-[10px]">{item.prix}</p>
                )}
              </div>
              {/* Regenerating overlay */}
              {regenerating === item.id && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Pending items (no photo yet) */}
      {withoutPhotos.length > 0 && !generating && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3">{t('photos.pending')} ({withoutPhotos.length})</h2>
          <div className="space-y-2">
            {withoutPhotos.map((item) => {
              const job = getJob(item.id)
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-white rounded-xl p-3.5 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    {job?.status === 'error' ? (
                      <AlertCircle size={18} className="text-red-400" />
                    ) : (
                      <Camera size={18} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2622] truncate">{item.nom}</p>
                    <p className="text-xs text-gray-400">{item.categorie}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Generate all pending */}
          {restaurant && (
            <button
              onClick={() => generateBatch(withoutPhotos, restaurant)}
              disabled={generating}
              className="w-full mt-4 py-4 bg-[#C9A961] text-white rounded-xl text-sm font-semibold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {t('menu.generate')} ({withoutPhotos.length})
            </button>
          )}
        </div>
      )}

      {/* Fullscreen photo viewer */}
      {fullscreenItem && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between p-4 text-white">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{fullscreenItem.nom}</p>
              <p className="text-xs text-white/60">{fullscreenItem.categorie} {fullscreenItem.prix ? `· ${fullscreenItem.prix}` : ''}</p>
            </div>
            <button
              onClick={() => setFullscreenItem(null)}
              className="p-2 active:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={fullscreenItem.image_url!}
              alt={fullscreenItem.nom}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-center gap-6 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <button
              onClick={() => handleRegenerate(fullscreenItem)}
              disabled={regenerating === fullscreenItem.id}
              className="flex flex-col items-center gap-1.5 text-white/80 active:text-white transition-colors"
            >
              {regenerating === fullscreenItem.id ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <RefreshCw size={24} />
              )}
              <span className="text-xs">{t('photos.regenerate')}</span>
            </button>
            <button
              onClick={() => handleDownload(fullscreenItem)}
              className="flex flex-col items-center gap-1.5 text-white/80 active:text-white transition-colors"
            >
              <Download size={24} />
              <span className="text-xs">{t('photos.download')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
