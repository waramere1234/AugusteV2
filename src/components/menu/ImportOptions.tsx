import { useState, useRef, useCallback } from 'react'
import { Camera, Link2, X, ArrowLeft, Upload, FileText, Sparkles, ImagePlus, ScanText, ChefHat } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface ImportOptionsProps {
  onImportFiles: (files: File[]) => Promise<void>
  onImportUrl: (url: string) => Promise<void>
  error: string | null
  onDismissError: () => void
  onBack?: () => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

function isAccepted(file: File): boolean {
  if (ACCEPTED.includes(file.type)) return true
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf'].includes(ext)
}

export function ImportOptions({ onImportFiles, onImportUrl, error, onDismissError, onBack }: ImportOptionsProps) {
  const { t } = useI18n()
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current++
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current = 0
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(isAccepted)
    if (dropped.length) setStagedFiles((prev) => [...prev, ...dropped])
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(isAccepted)
    if (files.length) setStagedFiles((prev) => [...prev, ...files])
    if (e.target) e.target.value = ''
  }, [])

  const removeFile = useCallback((index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleExtract = useCallback(async () => {
    if (stagedFiles.length === 0) return
    await onImportFiles(stagedFiles)
    setStagedFiles([])
  }, [stagedFiles, onImportFiles])

  const handleUrl = useCallback(async () => {
    if (!urlInput.trim()) return
    await onImportUrl(urlInput.trim())
    setUrlInput('')
    setShowUrlInput(false)
  }, [urlInput, onImportUrl])

  const hasFiles = stagedFiles.length > 0

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-[#2C2622] transition-colors rounded-lg">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('menu.title')}</h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">{t('menu.import.subtitle')}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={onDismissError} className="shrink-0 p-2 -mr-1 rounded-md text-red-400 active:bg-red-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Import card ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Drop zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          className={`relative cursor-pointer transition-all duration-300 ${
            dragging ? 'bg-[#C9A961]/8' : 'bg-gradient-to-b from-[#FAF8F5] to-white'
          }`}
        >
          {/* Dashed border inset */}
          <div className={`m-3 rounded-xl border-2 border-dashed transition-colors duration-300 ${
            dragging ? 'border-[#C9A961]' : 'border-gray-200'
          }`}>
            <div className="flex flex-col items-center gap-4 py-10 px-6">
              <div className={`relative p-5 rounded-2xl transition-all duration-300 ${
                dragging
                  ? 'bg-[#C9A961]/20 scale-110'
                  : 'bg-[#C9A961]/8 group-hover:bg-[#C9A961]/12'
              }`}>
                <Upload size={32} className="text-[#C9A961]" />
                {/* Decorative ring */}
                <div className={`absolute inset-0 rounded-2xl border-2 border-[#C9A961]/20 transition-all duration-500 ${
                  dragging ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
                }`} />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-[#2C2622]">{t('menu.import.drop')}</p>
                <p className="text-xs text-gray-400">{t('menu.import.drop.formats')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider with "ou" */}
        <div className="flex items-center gap-3 px-5 -mt-1 mb-1">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] font-medium text-gray-300 uppercase tracking-widest">{t('menu.import.or')}</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Bottom row: camera + link */}
        <div className="grid grid-cols-2 gap-px bg-gray-100 mx-3 mb-3 rounded-xl overflow-hidden">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2.5 py-4 bg-white text-sm font-medium text-gray-600 hover:text-[#C9A961] hover:bg-[#C9A961]/5 active:bg-[#C9A961]/10 transition-all rounded-l-xl"
          >
            <Camera size={18} />
            <span>{t('menu.import.camera')}</span>
          </button>
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`flex items-center justify-center gap-2.5 py-4 bg-white text-sm font-medium transition-all rounded-r-xl ${
              showUrlInput
                ? 'text-[#C9A961] bg-[#C9A961]/5'
                : 'text-gray-600 hover:text-[#C9A961] hover:bg-[#C9A961]/5 active:bg-[#C9A961]/10'
            }`}
          >
            <Link2 size={18} />
            <span>{t('menu.import.platform')}</span>
          </button>
        </div>
      </div>

      {/* ── URL input ───────────────────────────────────────────────────────── */}
      {showUrlInput && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3 animate-fade-in">
          <p className="text-xs font-medium text-gray-500">{t('menu.import.link.label')}</p>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrl()}
            placeholder={t('menu.import.link.placeholder')}
            autoFocus
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-sm focus:border-[#C9A961] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#C9A961]/20 outline-none transition-all"
          />
          <div className="flex gap-2">
            <button
              onClick={handleUrl}
              disabled={!urlInput.trim()}
              className="flex-1 py-3.5 bg-[#C9A961] hover:bg-[#C9A961]/90 text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {t('menu.import.go')}
            </button>
            <button
              onClick={() => { setShowUrlInput(false); setUrlInput('') }}
              className="px-4 py-3 text-gray-400 hover:text-gray-600 transition-colors rounded-xl"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ── Staged files ────────────────────────────────────────────────────── */}
      {hasFiles && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#2C2622] uppercase tracking-wider">
              {stagedFiles.length} {stagedFiles.length > 1 ? t('menu.import.filesReady') : t('menu.import.fileReady')}
            </p>
            <button
              onClick={() => setStagedFiles([])}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              {t('menu.import.clearAll')}
            </button>
          </div>

          <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
            {stagedFiles.map((file, i) => (
              <StagedFileThumb key={`${file.name}-${i}`} file={file} onRemove={() => removeFile(i)} />
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#C9A961] flex flex-col items-center justify-center gap-1 text-gray-300 hover:text-[#C9A961] transition-all"
            >
              <ImagePlus size={20} />
            </button>
          </div>

          {/* Extract CTA */}
          <button
            onClick={handleExtract}
            className="w-full py-4 bg-gradient-to-r from-[#C9A961] to-[#B8944E] hover:from-[#B8944E] hover:to-[#A88540] text-white rounded-2xl font-semibold shadow-lg shadow-[#C9A961]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
          >
            <Sparkles size={18} />
            <span>{t('menu.import.extract')}</span>
          </button>
        </div>
      )}

      {/* ── Onboarding content (first visit only) ──────────────────────────── */}
      {!hasFiles && !showUrlInput && !onBack && (
        <div className="space-y-5 pt-1">
          {/* How it works — 3 steps */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-4">{t('menu.import.howItWorks')}</p>
            <div className="space-y-4">
              {[
                { icon: Upload, color: 'bg-[#C9A961]/10 text-[#C9A961]', step: '1', text: t('menu.import.step1') },
                { icon: ScanText, color: 'bg-blue-50 text-blue-500', step: '2', text: t('menu.import.step2') },
                { icon: ChefHat, color: 'bg-[#7C9A6B]/10 text-[#7C9A6B]', step: '3', text: t('menu.import.step3') },
              ].map(({ icon: Icon, color, step, text }) => (
                <div key={step} className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#2C2622] leading-snug">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported formats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'PDF', desc: t('menu.import.format.pdf') },
              { label: 'JPG / PNG', desc: t('menu.import.format.image') },
              { label: 'URL', desc: t('menu.import.format.url') },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-xs font-bold text-[#2C2622]">{label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Re-import hint (compact) */}
      {!hasFiles && !showUrlInput && onBack && (
        <p className="text-center text-sm text-gray-300 py-4">{t('menu.import.reimportHint')}</p>
      )}

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple onChange={handleFileInput} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileInput} className="hidden" />
    </div>
  )
}

function StagedFileThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const previewUrl = !isPdf ? URL.createObjectURL(file) : null

  return (
    <div className="relative group">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="aspect-square w-full rounded-xl object-cover border border-gray-100"
          onLoad={() => URL.revokeObjectURL(previewUrl)}
        />
      ) : (
        <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 flex flex-col items-center justify-center gap-1.5">
          <FileText size={22} className="text-[#C9A961]" />
          <span className="text-[10px] text-gray-400 font-semibold tracking-wide">PDF</span>
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#2C2622] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity shadow-sm"
      >
        <X size={10} />
      </button>
    </div>
  )
}
