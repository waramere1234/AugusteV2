import { useState, useMemo, useCallback } from 'react'
import { ChevronDown, SearchX } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { CUISINE_PROFILES } from '@/constants/cuisineProfiles'

// ── Cuisine groups ────────────────────────────────────────────────────────────
const CUISINE_GROUPS = [
  { key: 'street', labelFr: 'Street Food', labelEn: 'Street Food', ids: ['kebab', 'burger', 'pizza', 'tacos_fr', 'riz_crousty', 'sandwich_boulangerie', 'poulet_frit', 'fish_and_chips', 'hot_dog'] },
  { key: 'asian', labelFr: 'Asie', labelEn: 'Asia', ids: ['japonais', 'chinois', 'thai', 'vietnamien', 'coreen', 'indien', 'asiatique_fusion', 'bubble_tea'] },
  { key: 'med', labelFr: 'Méditerranée & Orient', labelEn: 'Mediterranean & Middle East', ids: ['libanais', 'turc', 'grec', 'marocain', 'italien', 'espagnol'] },
  { key: 'french', labelFr: 'Français', labelEn: 'French', ids: ['bistro', 'gastronomique', 'creperie', 'brasserie'] },
  { key: 'americas', labelFr: 'Amériques', labelEn: 'Americas', ids: ['mexicain', 'bresilien', 'peruvien'] },
  { key: 'africa', labelFr: 'Afrique & Caraïbes', labelEn: 'Africa & Caribbean', ids: ['africain', 'antillais'] },
  { key: 'concepts', labelFr: 'Concepts', labelEn: 'Concepts', ids: ['poke_bowl', 'brunch', 'cafe', 'fruits_de_mer', 'bbq', 'healthy'] },
]

function findGroupForId(id: string | null): string | null {
  if (!id) return null
  return CUISINE_GROUPS.find(g => g.ids.includes(id))?.key ?? null
}

interface CuisineSelectorProps {
  selected: string | null
  onSelect: (id: string) => void
}

export function CuisineSelector({ selected, onSelect }: CuisineSelectorProps) {
  const { t, lang } = useI18n()
  const [filter, setFilter] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(() => findGroupForId(selected))

  const profileMap = useMemo(
    () => Object.fromEntries(CUISINE_PROFILES.map(p => [p.id, p])),
    [],
  )

  const filteredGroups = useMemo(() => {
    if (!filter.trim()) return CUISINE_GROUPS
    const q = filter.toLowerCase()
    return CUISINE_GROUPS
      .map(g => ({
        ...g,
        ids: g.ids.filter(id => {
          const p = profileMap[id]
          return p?.label.toLowerCase().includes(q) || id.includes(q)
        }),
      }))
      .filter(g => g.ids.length > 0)
  }, [filter, profileMap])

  const isFiltering = !!filter.trim()

  const handleFilterChange = useCallback((value: string) => {
    setFilter(value)
    // When clearing filter, restore the selected cuisine's group
    if (!value.trim()) {
      setExpandedGroup(findGroupForId(selected))
    }
  }, [selected])

  const handleSelect = useCallback((id: string) => {
    onSelect(id)
    // Auto-expand the group of the newly selected cuisine
    setExpandedGroup(findGroupForId(id))
    setFilter('')
  }, [onSelect])

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 pb-3">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          {t('profile.cuisine')}
        </label>

        {/* Currently selected badge */}
        {selected && profileMap[selected] && (
          <div className="flex items-center gap-2.5 mb-3 px-3.5 py-2.5 bg-[#C9A961]/[0.06] rounded-xl border border-[#C9A961]/20">
            <span className="text-xl">{profileMap[selected].emoji}</span>
            <span className="text-sm font-semibold text-[#C9A961]">{profileMap[selected].label}</span>
          </div>
        )}

        {/* Filter input */}
        <input
          type="text"
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
          placeholder={t('profile.cuisine.search')}
          aria-label={t('profile.cuisine.search')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/10 outline-none transition-all placeholder:text-gray-300"
        />
      </div>

      {/* Collapsible groups */}
      <div className="max-h-80 overflow-y-auto overscroll-contain">
        {filteredGroups.length === 0 ? (
          /* Empty state when filter matches nothing */
          <div className="px-5 py-8 flex flex-col items-center gap-2 text-gray-300">
            <SearchX size={28} />
            <p className="text-sm">{t('profile.cuisine.noResults')}</p>
          </div>
        ) : (
          filteredGroups.map(group => {
            const isExpanded = isFiltering || expandedGroup === group.key
            const hasSelected = group.ids.includes(selected ?? '')
            const label = lang === 'fr' ? group.labelFr : group.labelEn

            return (
              <div key={group.key} className="border-t border-gray-50">
                <button
                  onClick={() => setExpandedGroup(prev => prev === group.key ? null : group.key)}
                  aria-expanded={isExpanded}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
                    hasSelected ? 'bg-[#C9A961]/[0.04] hover:bg-[#C9A961]/[0.07]' : 'hover:bg-gray-50 active:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${hasSelected ? 'text-[#C9A961]' : 'text-[#2C2622]'}`}>
                      {label}
                    </span>
                    {hasSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-4 pb-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5">
                    {group.ids.map(id => {
                      const profile = profileMap[id]
                      if (!profile) return null
                      const isCurrent = selected === id
                      return (
                        <button
                          key={id}
                          onClick={() => handleSelect(id)}
                          aria-pressed={isCurrent}
                          className={`flex flex-col items-center justify-center gap-1 min-h-[56px] p-2 rounded-xl border-2 transition-all active:scale-95 ${
                            isCurrent
                              ? 'border-[#C9A961] bg-[#C9A961]/10 shadow-sm shadow-[#C9A961]/10'
                              : 'border-transparent hover:bg-gray-50 hover:border-gray-200 active:border-[#C9A961]/30'
                          }`}
                        >
                          <span className="text-xl leading-none">{profile.emoji}</span>
                          <span className={`text-[11px] text-center leading-tight line-clamp-2 ${
                            isCurrent ? 'text-[#C9A961] font-semibold' : 'text-gray-500'
                          }`}>
                            {profile.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
