import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Check, X, RefreshCw, UtensilsCrossed, Sparkles, FileText } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useMenus } from '@/hooks/useMenus'
import { supabase } from '@/lib/supabase'
import { ImportOptions } from '@/components/menu/ImportOptions'
import { EditBottomSheet } from '@/components/menu/EditBottomSheet'
import { MenuItemCard } from '@/components/menu/MenuItemCard'
import type { MenuItem } from '@/types'

export function MenuPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { restaurant } = useRestaurant()
  const {
    items, categories, loading, extracting, enriching, extractedItems, error,
    importFromFiles, importFromUrl, enrichDescriptions, updateItem, deleteItem, reload,
  } = useMenus(restaurant?.id ?? null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [enhancingId, setEnhancingId] = useState<string | null>(null)
  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    const filtered = (activeCategory ? items.filter((i) => i.categorie === activeCategory) : items).map((i) => i.id)
    setSelectedIds((prev) => {
      const allSelected = filtered.every((id) => prev.has(id))
      return allSelected ? new Set() : new Set([...prev, ...filtered])
    })
  }, [items, activeCategory])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const filteredItems = activeCategory
    ? items.filter((i) => i.categorie === activeCategory)
    : items

  const visibleError = error && error !== dismissedError ? error : null
  const I18N_ERRORS = ['error.menu.fileTooLarge', 'error.menu.invalidFormat', 'error.menu.extractionFailed', 'error.menu.noItems', 'error.menu.extractionError'] as const
  type EK = typeof I18N_ERRORS[number]
  const displayError = visibleError && (I18N_ERRORS.includes(visibleError as EK) ? t(visibleError as EK) : visibleError)

  const handleImportFiles = useCallback(async (files: File[]) => {
    if (!restaurant) return
    setShowImport(false)
    await importFromFiles(files, restaurant.id)
  }, [restaurant, importFromFiles])

  const handlePhotoUpload = useCallback(async (item: MenuItem, photoBase64: string) => {
    if (!restaurant) return
    setEnhancingId(item.id)

    try {
      // Save user photo immediately — enhance happens automatically during batch generation
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const blob = await fetch(`data:image/jpeg;base64,${photoBase64}`).then(r => r.blob())
      const filePath = `${user.id}/${item.id}_user_${Date.now()}.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('menu-images')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true })
      if (uploadErr) throw new Error(uploadErr.message)

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      await supabase.from('menu_items')
        .update({ image_url: publicUrl, image_source: 'user' as const })
        .eq('id', item.id)

      reload()
    } catch (err) {
      if (import.meta.env.DEV) console.error('Photo upload error:', err)
    }

    setEnhancingId(null)
  }, [restaurant, reload])

  const handleImportUrl = useCallback(async (url: string) => {
    if (!restaurant) return
    setShowImport(false)
    await importFromUrl(url, restaurant.id)
  }, [restaurant, importFromUrl])

  // Count items per category for pills
  const categoryItemCounts = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = items.filter((i) => i.categorie === cat).length
    return acc
  }, {})

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-[#C9A961]" size={32} />
        <p className="text-sm text-gray-400">{t('common.loading')}</p>
      </div>
    )
  }

  // ── Extraction in progress ─────────────────────────────────────────────────
  if (extracting) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('menu.extracting')}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('menu.extracting.desc')}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#C9A961] to-[#D4B96E] rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <Loader2 className="animate-spin text-[#C9A961] shrink-0" size={16} />
          </div>

          {/* Items appearing */}
          {extractedItems.length > 0 && (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {extractedItems.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[#FAF8F5] animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-5 h-5 rounded-full bg-[#7C9A6B]/10 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-[#7C9A6B]" />
                  </div>
                  <span className="text-sm text-[#2C2622] font-medium">{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Import view ────────────────────────────────────────────────────────────
  if (items.length === 0 || showImport) {
    return (
      <ImportOptions
        onImportFiles={handleImportFiles}
        onImportUrl={handleImportUrl}
        error={displayError || null}
        onDismissError={() => setDismissedError(error)}
        onBack={items.length > 0 ? () => setShowImport(false) : undefined}
      />
    )
  }

  // ── Menu loaded ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#2C2622]">{t('menu.title')}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {items.length} {t('menu.items')} &middot; {categories.length} {t('menu.categories')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#C9A961] bg-[#C9A961]/10 hover:bg-[#C9A961]/20 active:scale-[0.97] rounded-xl transition-all"
          >
            <RefreshCw size={16} />
            {t('menu.reimport')}
          </button>
        </div>
      </div>

      {/* Error */}
      {displayError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="flex-1">{displayError}</span>
          <button onClick={() => setDismissedError(error)} className="shrink-0 p-2 -mr-1 rounded-md text-red-400 active:bg-red-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Enrich descriptions button — always visible when items exist */}
      {items.length > 0 && restaurant?.cuisine_profile_id && (
        <button
          onClick={() => enrichDescriptions(restaurant.cuisine_profile_id!)}
          disabled={enriching}
          className="w-full flex items-center gap-3 bg-[#C9A961]/5 hover:bg-[#C9A961]/10 border border-[#C9A961]/20 rounded-xl px-4 py-3 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {enriching ? (
            <Loader2 size={18} className="animate-spin text-[#C9A961] shrink-0" />
          ) : (
            <FileText size={18} className="text-[#C9A961] shrink-0" />
          )}
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-[#2C2622]">
              {enriching ? t('menu.enriching') : t('menu.enrichDescriptions')}
            </p>
          </div>
        </button>
      )}

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              !activeCategory
                ? 'bg-[#2C2622] text-white shadow-sm'
                : 'bg-white text-gray-500 hover:bg-gray-50 active:bg-gray-100 border border-gray-100'
            }`}
          >
            {t('menu.all')} <span className="ml-1 text-xs opacity-60">{items.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-[#2C2622] text-white shadow-sm'
                  : 'bg-white text-gray-500 hover:bg-gray-50 active:bg-gray-100 border border-gray-100'
              }`}
            >
              {cat} <span className="ml-1 text-xs opacity-60">{categoryItemCounts[cat]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selection bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
        <button onClick={selectAll} className="text-sm text-[#C9A961] font-semibold py-1">
          {selectedIds.size === filteredItems.length && selectedIds.size > 0
            ? t('menu.deselectAll') : t('menu.selectAll')}
        </button>
        <div className="flex items-center gap-2">
          {/* Generate category button */}
          {activeCategory && selectedIds.size === 0 && (
            <button
              onClick={() => navigate('/photos', { state: { selectedIds: filteredItems.map(i => i.id) } })}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#C9A961]/10 text-[#C9A961] rounded-lg text-xs font-semibold hover:bg-[#C9A961]/20 active:scale-[0.97] transition-all"
            >
              <Sparkles size={13} />
              {t('menu.generateCategory')} ({filteredItems.length})
            </button>
          )}
          {selectedIds.size > 0 && (
            <button
              onClick={() => navigate('/photos', { state: { selectedIds: [...selectedIds] } })}
              className="px-4 py-2.5 bg-[#C9A961] hover:bg-[#C9A961]/90 text-white rounded-xl text-sm font-semibold active:scale-[0.97] transition-all shadow-sm"
            >
              {t('menu.generateSelected')} ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2.5">
        {filteredItems.map((item, i) => (
          <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
            <MenuItemCard
              item={item}
              selected={selectedIds.has(item.id)}
              enhancing={enhancingId === item.id}
              onToggleSelect={() => toggleSelect(item.id)}
              onEdit={() => setEditingItem(item)}
              onDelete={() => deleteItem(item.id)}
              onDropPhoto={(base64) => handlePhotoUpload(item, base64)}
            />
          </div>
        ))}
      </div>

      {/* Empty category state */}
      {filteredItems.length === 0 && activeCategory && (
        <div className="text-center py-12 text-gray-300">
          <UtensilsCrossed size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('menu.category.empty')}</p>
        </div>
      )}

      {/* Sticky generate button */}
      <div className="sticky bottom-20 lg:bottom-4 pt-2">
        <button
          onClick={() => navigate('/photos', { state: { selectedIds: selectedIds.size > 0 ? [...selectedIds] : items.map(i => i.id) } })}
          className="w-full py-4 bg-gradient-to-r from-[#C9A961] to-[#B8944E] hover:from-[#B8944E] hover:to-[#A88540] text-white rounded-2xl font-semibold shadow-lg shadow-[#C9A961]/20 active:scale-[0.98] transition-all"
        >
          {selectedIds.size > 0 ? `${t('menu.generateSelected')} (${selectedIds.size})` : t('menu.generateAll')}
        </button>
      </div>

      {editingItem && (
        <EditBottomSheet
          item={editingItem}
          onSave={async (updates) => { await updateItem(editingItem.id, updates); setEditingItem(null) }}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}
