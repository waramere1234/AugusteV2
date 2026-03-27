import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, FileUp, Link2, Loader2, Check, X, Pencil, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useMenus } from '@/hooks/useMenus'
import type { MenuItem } from '@/types'

export function MenuPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { restaurant } = useRestaurant()
  const {
    items, categories, loading, extracting, extractedItems, error,
    importFromFile, importFromUrl, updateItem, deleteItem,
  } = useMenus(restaurant?.id ?? null)

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Import handlers ────────────────────────────────────────────────────────

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>, source: 'photo' | 'file') {
    const file = e.target.files?.[0]
    if (!file || !restaurant) return
    void source // both use the same edge function
    await importFromFile(file, restaurant.id)
  }

  async function handleUrlImport() {
    if (!urlInput.trim() || !restaurant) return
    await importFromUrl(urlInput.trim(), restaurant.id)
    setUrlInput('')
    setShowUrlInput(false)
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  function toggleSelect(itemId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function selectAll() {
    const filtered = filteredItems.map((i) => i.id)
    setSelectedIds((prev) => {
      const allSelected = filtered.every((id) => prev.has(id))
      if (allSelected) return new Set()
      return new Set([...prev, ...filtered])
    })
  }

  // ── Filter by category ─────────────────────────────────────────────────────

  const filteredItems = activeCategory
    ? items.filter((i) => i.categorie === activeCategory)
    : items

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#C9A961]" size={32} />
      </div>
    )
  }

  // ── Extraction in progress ─────────────────────────────────────────────────

  if (extracting) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('menu.extracting')}</h1>
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-[#C9A961]" size={20} />
            <p className="text-sm text-gray-500">{t('menu.extracting.desc')}</p>
          </div>
          {extractedItems.length > 0 && (
            <div className="space-y-2 pt-2">
              {extractedItems.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm animate-fade-in"
                >
                  <Check size={14} className="text-[#7C9A6B]" />
                  <span className="text-[#2C2622]">{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── No menu yet — show import options ──────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('menu.title')}</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {/* Photo */}
          <button
            onClick={() => photoInputRef.current?.click()}
            className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm active:bg-gray-50 transition-colors text-left"
          >
            <div className="p-3 bg-[#C9A961]/10 rounded-lg">
              <Camera size={24} className="text-[#C9A961]" />
            </div>
            <div>
              <p className="font-semibold text-[#2C2622]">{t('menu.import.photo')}</p>
              <p className="text-sm text-gray-500">{t('menu.import.photo.desc')}</p>
            </div>
          </button>

          {/* File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm active:bg-gray-50 transition-colors text-left"
          >
            <div className="p-3 bg-[#C9A961]/10 rounded-lg">
              <FileUp size={24} className="text-[#C9A961]" />
            </div>
            <div>
              <p className="font-semibold text-[#2C2622]">{t('menu.import.file')}</p>
              <p className="text-sm text-gray-500">{t('menu.import.file.desc')}</p>
            </div>
          </button>

          {/* URL */}
          <button
            onClick={() => setShowUrlInput(true)}
            className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm active:bg-gray-50 transition-colors text-left"
          >
            <div className="p-3 bg-[#C9A961]/10 rounded-lg">
              <Link2 size={24} className="text-[#C9A961]" />
            </div>
            <div>
              <p className="font-semibold text-[#2C2622]">{t('menu.import.link')}</p>
              <p className="text-sm text-gray-500">{t('menu.import.link.desc')}</p>
            </div>
          </button>
        </div>

        {/* URL input field */}
        {showUrlInput && (
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
              placeholder="https://www.ubereats.com/store/..."
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#C9A961] outline-none transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUrlImport}
                disabled={!urlInput.trim()}
                className="flex-1 py-3 bg-[#C9A961] text-white rounded-lg text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {t('menu.import.go')}
              </button>
              <button
                onClick={() => { setShowUrlInput(false); setUrlInput('') }}
                className="px-4 py-3 text-gray-400 active:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!showUrlInput && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-sm">{t('menu.empty')}</p>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileImport(e, 'photo')}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileImport(e, 'file')}
          className="hidden"
        />
      </div>
    )
  }

  // ── Menu loaded — show items ───────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header + action buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('menu.title')}</h1>
        <span className="text-xs text-gray-400">
          {items.length} {t('menu.items')}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeCategory
                ? 'bg-[#C9A961] text-white'
                : 'bg-white text-gray-600 active:bg-gray-100'
            }`}
          >
            {t('menu.all')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#C9A961] text-white'
                  : 'bg-white text-gray-600 active:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Selection bar */}
      {items.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
          <button
            onClick={selectAll}
            className="text-sm text-[#C9A961] font-medium"
          >
            {selectedIds.size === filteredItems.length && selectedIds.size > 0
              ? t('menu.deselectAll')
              : t('menu.selectAll')}
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={() => navigate('/photos', { state: { selectedIds: [...selectedIds] } })}
              className="px-4 py-2 bg-[#C9A961] text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
            >
              {t('menu.generateSelected')} ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-white rounded-xl p-3.5 shadow-sm"
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleSelect(item.id)}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                selectedIds.has(item.id)
                  ? 'bg-[#C9A961] border-[#C9A961]'
                  : 'border-gray-300'
              }`}
            >
              {selectedIds.has(item.id) && <Check size={14} className="text-white" />}
            </button>

            {/* Thumbnail */}
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.nom}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Camera size={18} className="text-gray-300" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#2C2622] text-sm truncate">{item.nom}</p>
              {item.description && (
                <p className="text-xs text-gray-400 truncate">{item.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                {item.categorie && (
                  <span className="text-[#C9A961]">{item.categorie}</span>
                )}
                {item.categorie && item.prix ? ' · ' : ''}
                {item.prix && <span>{item.prix}</span>}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditingItem(item)}
                className="p-2 text-gray-400 active:text-[#C9A961] transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-2 text-gray-400 active:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Generate all button (sticky bottom) */}
      <div className="sticky bottom-20 lg:bottom-4 pt-2">
        <button
          onClick={() => navigate('/photos', { state: { selectedIds: selectedIds.size > 0 ? [...selectedIds] : items.map(i => i.id) } })}
          className="w-full py-4 bg-[#C9A961] text-white rounded-xl text-sm font-semibold shadow-lg active:scale-[0.98] transition-transform"
        >
          {selectedIds.size > 0
            ? `${t('menu.generateSelected')} (${selectedIds.size})`
            : t('menu.generateAll')}
        </button>
      </div>

      {/* Bottom sheet — Edit item */}
      {editingItem && (
        <EditBottomSheet
          item={editingItem}
          onSave={async (updates) => {
            await updateItem(editingItem.id, updates)
            setEditingItem(null)
          }}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}

// ── Edit Bottom Sheet Component ──────────────────────────────────────────────

function EditBottomSheet({
  item,
  onSave,
  onClose,
}: {
  item: MenuItem
  onSave: (updates: Partial<MenuItem>) => Promise<void>
  onClose: () => void
}) {
  const { t } = useI18n()
  const [nom, setNom] = useState(item.nom)
  const [description, setDescription] = useState(item.description ?? '')
  const [prix, setPrix] = useState(item.prix ?? '')
  const [categorie, setCategorie] = useState(item.categorie ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({ nom, description, prix, categorie })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#2C2622]">{t('menu.edit')}</h3>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('menu.item.name')}</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#C9A961] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('menu.item.desc')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#C9A961] outline-none transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">{t('menu.item.price')}</label>
              <input
                type="text"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                placeholder="12.90€"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#C9A961] outline-none transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">{t('menu.item.category')}</label>
              <input
                type="text"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#C9A961] outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !nom.trim()}
          className="w-full py-3.5 bg-[#C9A961] text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('common.save')}
        </button>
      </div>
    </div>
  )
}
