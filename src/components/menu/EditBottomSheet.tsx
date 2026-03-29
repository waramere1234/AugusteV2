import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { MenuItem } from '@/types'

interface EditBottomSheetProps {
  item: MenuItem
  onSave: (updates: Partial<MenuItem>) => Promise<void>
  onClose: () => void
}

export function EditBottomSheet({ item, onSave, onClose }: EditBottomSheetProps) {
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
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="edit-nom" className="block text-xs text-gray-500 mb-1">{t('menu.item.name')}</label>
            <input
              id="edit-nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#C9A961] focus-visible:ring-2 focus-visible:ring-[#C9A961]/20 outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="edit-desc" className="block text-xs text-gray-500 mb-1">{t('menu.item.desc')}</label>
            <textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#C9A961] focus-visible:ring-2 focus-visible:ring-[#C9A961]/20 outline-none transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="edit-prix" className="block text-xs text-gray-500 mb-1">{t('menu.item.price')}</label>
              <input
                id="edit-prix"
                type="text"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                placeholder="12.90"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#C9A961] focus-visible:ring-2 focus-visible:ring-[#C9A961]/20 outline-none transition-colors"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="edit-cat" className="block text-xs text-gray-500 mb-1">{t('menu.item.category')}</label>
              <input
                id="edit-cat"
                type="text"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#C9A961] focus-visible:ring-2 focus-visible:ring-[#C9A961]/20 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !nom.trim()}
          className="w-full py-3.5 bg-[#C9A961] hover:bg-[#C9A961]/90 text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('common.save')}
        </button>
      </div>
    </div>
  )
}
