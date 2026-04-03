import { useState, useRef } from 'react'
import { Camera, Check, ChevronDown, Pencil, Trash2, ImagePlus, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { resizeImageToBase64 } from '@/lib/menuHelpers'
import type { MenuItem } from '@/types'

interface MenuItemCardProps {
  item: MenuItem
  selected: boolean
  enhancing?: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onDropPhoto?: (base64: string) => void
}

const TYPE_LABELS: Record<string, { bg: string; text: string }> = {
  formule: { bg: 'bg-blue-50', text: 'text-blue-600' },
  boisson: { bg: 'bg-purple-50', text: 'text-purple-600' },
  dessert: { bg: 'bg-pink-50', text: 'text-pink-600' },
}

export function MenuItemCard({ item, selected, enhancing, onToggleSelect, onEdit, onDelete, onDropPhoto }: MenuItemCardProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!onDropPhoto) return
    if (!file.type.startsWith('image/')) return
    try {
      // Resize to max 1024px to stay under Supabase body limits (~200KB base64)
      const base64 = await resizeImageToBase64(file, 1024)
      onDropPhoto(base64)
    } catch (err) {
      if (import.meta.env.DEV) console.error('Image resize failed:', err)
    }
  }

  const hasTailles = item.tailles && item.tailles.length > 0
  const hasSupplements = item.supplements && item.supplements.length > 0
  const hasAccompagnements = item.accompagnements && item.accompagnements.length > 0
  const hasAllergenes = item.allergenes && item.allergenes.length > 0
  const hasLabels = item.labels && item.labels.length > 0
  const hasDetails = hasTailles || hasSupplements || hasAccompagnements || hasAllergenes || hasLabels

  // Count total extras for the compact indicator
  const extrasCount =
    (item.tailles?.length ?? 0) +
    (item.supplements?.length ?? 0) +
    (item.accompagnements?.length ?? 0)

  const typeStyle = item.item_type && item.item_type !== 'plat' ? TYPE_LABELS[item.item_type] : null

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-200 lg:hover:shadow-md ${
      selected ? 'border-[#C9A961] ring-1 ring-[#C9A961]/20' : 'border-gray-100'
    }`}>
      {/* Compact row */}
      <div className="flex items-stretch gap-0">
        {/* Checkbox + image group — supports drag & drop + tap to upload */}
        <div
          className={`relative shrink-0 p-3 pr-0 ${dragOver ? 'scale-105' : ''} transition-transform`}
          onDragOver={(e) => { if (onDropPhoto) { e.preventDefault(); setDragOver(true) } }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
        >
          <button onClick={onToggleSelect} className="block">
            {item.image_url ? (
              <img src={item.image_url} alt={item.nom} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-colors ${
                dragOver
                  ? 'bg-[#C9A961]/20 border-2 border-dashed border-[#C9A961]'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100'
              }`}>
                {enhancing ? (
                  <Loader2 size={20} className="text-[#C9A961] animate-spin" />
                ) : (
                  <Camera size={20} className="text-gray-300" />
                )}
              </div>
            )}
          </button>
          {/* Checkbox overlay */}
          <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            selected
              ? 'bg-[#C9A961] border-[#C9A961] shadow-sm'
              : 'bg-white/80 backdrop-blur-sm border-gray-300'
          }`}>
            {selected && <Check size={12} className="text-white" />}
          </div>
          {/* Upload photo button — bottom right of thumbnail */}
          {onDropPhoto && !enhancing && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="absolute bottom-1.5 right-0 w-6 h-6 rounded-full bg-[#C9A961] flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                aria-label="Upload photo"
              >
                <ImagePlus size={12} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                  e.target.value = ''
                }}
              />
            </>
          )}
        </div>

        {/* Content — tappable to expand */}
        <button
          className="flex-1 min-w-0 text-left py-3 pl-3"
          onClick={() => hasDetails && setExpanded(!expanded)}
        >
          {/* Name + type badge */}
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#2C2622] text-sm truncate">{item.nom}</p>
            {typeStyle && (
              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeStyle.bg} ${typeStyle.text}`}>
                {t(`menu.item.type.${item.item_type}` as Parameters<typeof t>[0])}
              </span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5 leading-relaxed">{item.description}</p>
          )}

          {/* Meta row: category + indicators */}
          <div className="flex items-center gap-2 mt-1.5">
            {item.categorie && (
              <span className="text-[11px] font-medium text-[#C9A961] bg-[#C9A961]/8 px-2 py-0.5 rounded-md">
                {item.categorie}
              </span>
            )}
            {extrasCount > 0 && (
              <span className="text-[10px] text-gray-400">
                +{extrasCount} {t('menu.item.options')}
              </span>
            )}
            {hasAllergenes && (
              <div className="flex items-center gap-0.5">
                {item.allergenes!.slice(0, 3).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-300" />
                ))}
                {item.allergenes!.length > 3 && (
                  <span className="text-[9px] text-red-400 ml-0.5">+{item.allergenes!.length - 3}</span>
                )}
              </div>
            )}
            {hasLabels && (
              <div className="flex items-center gap-0.5">
                {item.labels!.slice(0, 2).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#7C9A6B]" />
                ))}
              </div>
            )}
          </div>
        </button>

        {/* Right side: price + actions */}
        <div className="shrink-0 flex flex-col items-end justify-between py-3 pr-3 pl-2">
          {/* Price — prominent */}
          {item.prix && (
            <span className="text-sm font-bold text-[#2C2622] tabular-nums">
              {item.prix}{item.prix.includes('€') ? '' : '€'}
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center -mr-1">
            {hasDetails && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
                className={`p-1.5 text-gray-300 hover:text-[#C9A961] transition-all rounded-md ${expanded ? 'rotate-180 text-[#C9A961]' : ''}`}
              >
                <ChevronDown size={14} />
              </button>
            )}
            <button onClick={onEdit} className="p-1.5 text-gray-300 hover:text-[#C9A961] active:text-[#C9A961] transition-colors rounded-md">
              <Pencil size={14} />
            </button>
            <button onClick={onDelete} className="p-1.5 text-gray-300 hover:text-red-400 active:text-red-500 transition-colors rounded-md">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded details ────────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-3 bg-[#FAF8F5]/50 border-t border-gray-50 animate-fade-in">
          {hasTailles && (
            <DetailSection label={t('menu.item.sizes')}>
              <div className="flex flex-wrap gap-1.5">
                {item.tailles!.map((s, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-[#2C2622] font-medium shadow-sm">
                    {s.label} <span className="text-gray-400 font-normal">—</span> <span className="text-[#C9A961]">{s.prix}€</span>
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {hasSupplements && (
            <DetailSection label={t('menu.item.supplements')}>
              <div className="flex flex-wrap gap-1.5">
                {item.supplements!.map((s, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-[#2C2622] shadow-sm">
                    {s.nom}
                    {s.prix > 0 && <span className="text-[#C9A961] ml-1 font-medium">+{s.prix}€</span>}
                    {s.obligatoire && <span className="text-[#D4895C] ml-1 font-bold">*</span>}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {hasAccompagnements && (
            <DetailSection label={t('menu.item.sides')}>
              <div className="flex flex-wrap gap-1.5">
                {item.accompagnements!.map((a, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-[#2C2622] shadow-sm">
                    {a.nom}
                    {a.inclus
                      ? <span className="text-[#7C9A6B] ml-1 text-[10px] font-medium">{t('menu.item.included')}</span>
                      : a.prix > 0 ? <span className="text-[#C9A961] ml-1 font-medium">+{a.prix}€</span> : null
                    }
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {hasAllergenes && (
            <DetailSection label={t('menu.item.allergens')}>
              <div className="flex flex-wrap gap-1.5">
                {item.allergenes!.map((a, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium border border-red-100">
                    {a}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {hasLabels && (
            <DetailSection label={t('menu.item.labels')}>
              <div className="flex flex-wrap gap-1.5">
                {item.labels!.map((l, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-[#7C9A6B]/10 text-[#7C9A6B] font-medium border border-[#7C9A6B]/20">
                    {l}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}
        </div>
      )}
    </div>
  )
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">{label}</p>
      {children}
    </div>
  )
}
