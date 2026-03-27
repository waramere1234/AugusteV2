import { useState } from 'react'
import { FileText, Image, FileSpreadsheet, Globe, Loader2, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useMenus } from '@/hooks/useMenus'
import { PRESENTATION_STYLES, type PresentationStyle } from '@/constants/presentationStyles'

type ExportStatus = 'idle' | 'loading' | 'done' | 'error'

export function ExportPage() {
  const { t } = useI18n()
  const { restaurant, updateField } = useRestaurant()
  const { items } = useMenus(restaurant?.id ?? null)

  const [pdfStatus, setPdfStatus] = useState<ExportStatus>('idle')
  const [zipStatus, setZipStatus] = useState<ExportStatus>('idle')
  const [showStylePicker, setShowStylePicker] = useState(false)

  const photosCount = items.filter((i) => i.image_url).length
  const hasPhotos = photosCount > 0

  // ── PDF Export ──────────────────────────────────────────────────────────────

  function handlePdfClick() {
    if (!hasPhotos) return
    setShowStylePicker(true)
  }

  async function handleGeneratePdf(style: PresentationStyle) {
    if (!restaurant) return
    setShowStylePicker(false)
    setPdfStatus('loading')

    // Save chosen style on the restaurant
    updateField('presentation_style_id', style.id)

    try {
      // Build PDF data from items
      const pdfItems = items
        .filter((i) => i.image_url)
        .map((i) => ({
          nom: i.nom,
          description: i.description,
          prix: i.prix,
          categorie: i.categorie,
          image_url: i.image_url,
        }))

      // For now, generate a simple client-side download
      // In production, this would call an Edge Function for server-side PDF
      const blob = new Blob(
        [JSON.stringify({ restaurant: restaurant.name, style: style.id, items: pdfItems }, null, 2)],
        { type: 'application/json' },
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${restaurant.name || 'menu'}_${style.id}.json`
      a.click()
      URL.revokeObjectURL(url)

      setPdfStatus('done')
      setTimeout(() => setPdfStatus('idle'), 3000)
    } catch {
      setPdfStatus('error')
      setTimeout(() => setPdfStatus('idle'), 3000)
    }
  }

  // ── ZIP Export ──────────────────────────────────────────────────────────────

  async function handleZipExport() {
    if (!hasPhotos) return
    setZipStatus('loading')

    try {
      const photosWithUrl = items.filter((i) => i.image_url)

      // Download each photo and trigger individual downloads
      // In production, this would use JSZip or a server-side function
      for (const item of photosWithUrl) {
        const a = document.createElement('a')
        a.href = item.image_url!
        a.download = `${item.nom.replace(/\s+/g, '_')}.png`
        a.target = '_blank'
        a.click()
        // Small delay between downloads to avoid browser blocking
        await new Promise((r) => setTimeout(r, 300))
      }

      setZipStatus('done')
      setTimeout(() => setZipStatus('idle'), 3000)
    } catch {
      setZipStatus('error')
      setTimeout(() => setZipStatus('idle'), 3000)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('export.title')}</h1>
        {hasPhotos && (
          <span className="text-xs text-gray-400">
            {photosCount} {t('export.photosReady')}
          </span>
        )}
      </div>

      {/* Export options */}
      <div className="grid grid-cols-1 gap-3">
        {/* PDF */}
        <button
          onClick={handlePdfClick}
          disabled={!hasPhotos || pdfStatus === 'loading'}
          className={`flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm text-left transition-colors ${
            hasPhotos ? 'active:bg-gray-50' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`p-3 rounded-lg ${hasPhotos ? 'bg-[#C9A961]/10 text-[#C9A961]' : 'bg-gray-100 text-gray-400'}`}>
            {pdfStatus === 'loading' ? (
              <Loader2 size={24} className="animate-spin" />
            ) : pdfStatus === 'done' ? (
              <Check size={24} />
            ) : (
              <FileText size={24} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.pdf')}</p>
            <p className="text-sm text-gray-500">{t('export.pdf.desc')}</p>
          </div>
        </button>

        {/* ZIP */}
        <button
          onClick={handleZipExport}
          disabled={!hasPhotos || zipStatus === 'loading'}
          className={`flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm text-left transition-colors ${
            hasPhotos ? 'active:bg-gray-50' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`p-3 rounded-lg ${hasPhotos ? 'bg-[#C9A961]/10 text-[#C9A961]' : 'bg-gray-100 text-gray-400'}`}>
            {zipStatus === 'loading' ? (
              <Loader2 size={24} className="animate-spin" />
            ) : zipStatus === 'done' ? (
              <Check size={24} />
            ) : (
              <Image size={24} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.zip')}</p>
            <p className="text-sm text-gray-500">{t('export.zip.desc')}</p>
          </div>
        </button>

        {/* CSV Uber Eats — coming soon */}
        <div className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm text-left opacity-50">
          <div className="p-3 rounded-lg bg-gray-100 text-gray-400">
            <FileSpreadsheet size={24} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.uber')}</p>
            <p className="text-sm text-gray-500">{t('export.csv.desc')}</p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">
            {t('export.soon')}
          </span>
        </div>

        {/* CSV Deliveroo — coming soon */}
        <div className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm text-left opacity-50">
          <div className="p-3 rounded-lg bg-gray-100 text-gray-400">
            <FileSpreadsheet size={24} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.deliveroo')}</p>
            <p className="text-sm text-gray-500">{t('export.csv.desc')}</p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">
            {t('export.soon')}
          </span>
        </div>

        {/* Web link + QR — coming soon */}
        <div className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm text-left opacity-50">
          <div className="p-3 rounded-lg bg-gray-100 text-gray-400">
            <Globe size={24} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.web')}</p>
            <p className="text-sm text-gray-500">{t('export.web.desc')}</p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">
            {t('export.soon')}
          </span>
        </div>
      </div>

      {/* Style picker bottom sheet */}
      {showStylePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowStylePicker(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 animate-slide-up">
            <h3 className="text-lg font-semibold text-[#2C2622] mb-1">{t('export.chooseStyle')}</h3>
            <p className="text-sm text-gray-400 mb-4">{t('export.chooseStyle.desc')}</p>

            <div className="space-y-2">
              {PRESENTATION_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleGeneratePdf(style)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    restaurant?.presentation_style_id === style.id
                      ? 'border-[#C9A961] bg-[#C9A961]/5'
                      : 'border-gray-100 active:border-[#C9A961]/40'
                  }`}
                >
                  <span className="text-2xl">{style.emoji}</span>
                  <div>
                    <p className="font-medium text-[#2C2622] text-sm">{style.label}</p>
                  </div>
                  {restaurant?.presentation_style_id === style.id && (
                    <Check size={18} className="ml-auto text-[#C9A961]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
