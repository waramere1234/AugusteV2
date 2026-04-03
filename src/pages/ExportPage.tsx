import { useState } from 'react'
import { FileText, Image, FileSpreadsheet, Globe, Loader2, Check, Download, X, Copy, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useI18n } from '@/lib/i18n'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useMenus } from '@/hooks/useMenus'
import { PRESENTATION_STYLES, type PresentationStyle } from '@/constants/presentationStyles'
import { generateMenuPdf } from '@/lib/exportPdf'
import { downloadPhotosZip } from '@/lib/exportZip'
import { exportUberEatsCsv, exportDeliverooCsv } from '@/lib/exportCsv'

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
  const [showQr, setShowQr] = useState(false)
  const [copied, setCopied] = useState(false)

  const photosCount = items.filter((i) => i.image_url).length
  const hasPhotos = photosCount > 0
  const menuUrl = restaurant ? `${window.location.origin}/m/${restaurant.id}` : ''

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

        {/* CSV Uber Eats */}
        <button
          onClick={() => restaurant && exportUberEatsCsv(items, restaurant.name)}
          disabled={items.length === 0}
          className={`flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm text-left transition-all ${
            items.length > 0 ? 'active:bg-gray-50 active:scale-[0.99]' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`p-3 rounded-xl ${items.length > 0 ? 'bg-[#C9A961]/10 text-[#C9A961]' : 'bg-gray-100 text-gray-400'}`}>
            <FileSpreadsheet size={24} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.uber')}</p>
            <p className="text-sm text-[#2C2622]/40">{t('export.csv.desc')}</p>
          </div>
          {items.length > 0 && (
            <Download size={18} className="text-[#2C2622]/20" />
          )}
        </button>

        {/* CSV Deliveroo */}
        <button
          onClick={() => restaurant && exportDeliverooCsv(items, restaurant.name)}
          disabled={items.length === 0}
          className={`flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm text-left transition-all ${
            items.length > 0 ? 'active:bg-gray-50 active:scale-[0.99]' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`p-3 rounded-xl ${items.length > 0 ? 'bg-[#C9A961]/10 text-[#C9A961]' : 'bg-gray-100 text-gray-400'}`}>
            <FileSpreadsheet size={24} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.deliveroo')}</p>
            <p className="text-sm text-[#2C2622]/40">{t('export.csv.desc')}</p>
          </div>
          {items.length > 0 && (
            <Download size={18} className="text-[#2C2622]/20" />
          )}
        </button>

        {/* Web link + QR */}
        <button
          onClick={() => setShowQr(true)}
          disabled={!restaurant}
          className={`flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm text-left transition-all ${
            restaurant ? 'active:bg-gray-50 active:scale-[0.99]' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`p-3 rounded-xl ${restaurant ? 'bg-[#C9A961]/10 text-[#C9A961]' : 'bg-gray-100 text-gray-400'}`}>
            <QrCode size={24} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C2622]">{t('export.web')}</p>
            <p className="text-sm text-[#2C2622]/40">{t('export.web.desc')}</p>
          </div>
          {restaurant && (
            <Globe size={18} className="text-[#2C2622]/20" />
          )}
        </button>
      </div>

      {/* QR Code modal */}
      {showQr && menuUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowQr(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full animate-fade-in shadow-xl">
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-[#2C2622] mb-1">{t('export.qr.title')}</h3>
            <p className="text-xs text-[#2C2622]/40 mb-5">{t('export.qr.desc')}</p>

            {/* QR Code */}
            <div className="flex justify-center mb-5">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <QRCodeSVG
                  value={menuUrl}
                  size={180}
                  fgColor="#2C2622"
                  bgColor="#FFFFFF"
                  level="M"
                />
              </div>
            </div>

            {/* URL + copy */}
            <div className="flex items-center gap-2 bg-[#F0EDE8] rounded-xl px-3 py-2.5 mb-4">
              <p className="flex-1 text-xs text-[#2C2622]/60 truncate font-mono">{menuUrl}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(menuUrl)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="shrink-0 p-1.5 rounded-lg hover:bg-white/60 active:scale-90 transition-all"
              >
                {copied ? (
                  <Check size={14} className="text-[#7C9A6B]" />
                ) : (
                  <Copy size={14} className="text-[#2C2622]/40" />
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-[#F0EDE8] text-[#2C2622] text-sm font-medium rounded-xl text-center active:scale-[0.98] transition-all"
              >
                {t('export.qr.preview')}
              </a>
              <button
                onClick={() => {
                  const svg = document.querySelector('.qr-download-target svg')
                  if (!svg) return
                  const svgData = new XMLSerializer().serializeToString(svg)
                  const blob = new Blob([svgData], { type: 'image/svg+xml' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${restaurant?.name || 'menu'}_qrcode.svg`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="flex-1 py-3 bg-[#C9A961] text-white text-sm font-semibold rounded-xl text-center active:scale-[0.98] transition-all"
              >
                {t('export.qr.download')}
              </button>
            </div>

            {/* Hidden target for download */}
            <div className="qr-download-target hidden">
              <QRCodeSVG value={menuUrl} size={512} fgColor="#2C2622" bgColor="#FFFFFF" level="H" />
            </div>
          </div>
        </div>
      )}

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
