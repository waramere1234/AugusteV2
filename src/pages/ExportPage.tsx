import { useState } from 'react'
import { FileText, Image, FileSpreadsheet, Globe, Loader2, Check, Download } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useMenus } from '@/hooks/useMenus'
import { PRESENTATION_STYLES, type PresentationStyle } from '@/constants/presentationStyles'
import { generateMenuPdf } from '@/lib/exportPdf'
import { downloadPhotosZip } from '@/lib/exportZip'

type ExportStatus = 'idle' | 'loading' | 'done' | 'error'

export function ExportPage() {
  const { t } = useI18n()
  const { restaurant, updateField } = useRestaurant()
  const { items } = useMenus(restaurant?.id ?? null)

  const [pdfStatus, setPdfStatus] = useState<ExportStatus>('idle')
  const [pdfProgress, setPdfProgress] = useState(0)
  const [zipStatus, setZipStatus] = useState<ExportStatus>('idle')
  const [zipProgress, setZipProgress] = useState(0)
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
    setPdfProgress(0)

    updateField('presentation_style_id', style.id)

    try {
      const blob = await generateMenuPdf(restaurant, items, style, setPdfProgress)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${restaurant.name || 'menu'}_${style.id}.pdf`
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
    if (!hasPhotos || !restaurant) return
    setZipStatus('loading')
    setZipProgress(0)

    try {
      await downloadPhotosZip(items, restaurant.name, setZipProgress)
      setZipStatus('done')
      setTimeout(() => setZipStatus('idle'), 3000)
    } catch {
      setZipStatus('error')
      setTimeout(() => setZipStatus('idle'), 3000)
    }
  }

  // ── Status icon helper ────────────────────────────────────────────────────

  function StatusIcon({ status, progress, defaultIcon }: { status: ExportStatus; progress: number; defaultIcon: React.ReactNode }) {
    if (status === 'loading') {
      return (
        <div className="relative">
          <Loader2 size={24} className="animate-spin" />
          {progress > 0 && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#C9A961]">
              {progress}%
            </span>
          )}
        </div>
      )
    }
    if (status === 'done') return <Check size={24} />
    return defaultIcon
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('export.title')}</h1>
        {hasPhotos && (
          <span className="text-xs text-[#2C2622]/30 bg-[#F0EDE8] px-2.5 py-1 rounded-full">
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
          className={`flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm text-left transition-all ${
            hasPhotos ? 'active:bg-gray-50 active:scale-[0.99]' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`p-3 rounded-xl ${hasPhotos ? 'bg-[#C9A961]/10 text-[#C9A961]' : 'bg-gray-100 text-gray-400'}`}>
            <StatusIcon status={pdfStatus} progress={pdfProgress} defaultIcon={<FileText size={24} />} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.pdf')}</p>
            <p className="text-sm text-[#2C2622]/40">{t('export.pdf.desc')}</p>
          </div>
          {hasPhotos && pdfStatus === 'idle' && (
            <Download size={18} className="text-[#2C2622]/20" />
          )}
        </button>

        {/* ZIP */}
        <button
          onClick={handleZipExport}
          disabled={!hasPhotos || zipStatus === 'loading'}
          className={`flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm text-left transition-all ${
            hasPhotos ? 'active:bg-gray-50 active:scale-[0.99]' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`p-3 rounded-xl ${hasPhotos ? 'bg-[#C9A961]/10 text-[#C9A961]' : 'bg-gray-100 text-gray-400'}`}>
            <StatusIcon status={zipStatus} progress={zipProgress} defaultIcon={<Image size={24} />} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.zip')}</p>
            <p className="text-sm text-[#2C2622]/40">{t('export.zip.desc')}</p>
          </div>
          {hasPhotos && zipStatus === 'idle' && (
            <Download size={18} className="text-[#2C2622]/20" />
          )}
        </button>

        {/* CSV Uber Eats — coming soon */}
        <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm text-left opacity-50">
          <div className="p-3 rounded-xl bg-gray-100 text-gray-400">
            <FileSpreadsheet size={24} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.uber')}</p>
            <p className="text-sm text-[#2C2622]/40">{t('export.csv.desc')}</p>
          </div>
          <span className="text-xs bg-[#F0EDE8] text-[#2C2622]/30 px-2.5 py-1 rounded-full font-medium">
            {t('export.soon')}
          </span>
        </div>

        {/* CSV Deliveroo — coming soon */}
        <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm text-left opacity-50">
          <div className="p-3 rounded-xl bg-gray-100 text-gray-400">
            <FileSpreadsheet size={24} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.deliveroo')}</p>
            <p className="text-sm text-[#2C2622]/40">{t('export.csv.desc')}</p>
          </div>
          <span className="text-xs bg-[#F0EDE8] text-[#2C2622]/30 px-2.5 py-1 rounded-full font-medium">
            {t('export.soon')}
          </span>
        </div>

        {/* Web link + QR — coming soon */}
        <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm text-left opacity-50">
          <div className="p-3 rounded-xl bg-gray-100 text-gray-400">
            <Globe size={24} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.web')}</p>
            <p className="text-sm text-[#2C2622]/40">{t('export.web.desc')}</p>
          </div>
          <span className="text-xs bg-[#F0EDE8] text-[#2C2622]/30 px-2.5 py-1 rounded-full font-medium">
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
            <p className="text-sm text-[#2C2622]/40 mb-4">{t('export.chooseStyle.desc')}</p>

            <div className="space-y-2">
              {PRESENTATION_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleGeneratePdf(style)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
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
