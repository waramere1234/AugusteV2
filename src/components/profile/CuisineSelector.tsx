import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { CUISINE_PROFILES } from '@/constants/cuisineProfiles'

// ── Cuisine groups ────────────────────────────────────────────────────────────
const CUISINE_GROUPS = [
  { key: 'street', labelFr: 'Street Food', labelEn: 'Street Food', ids: ['kebab', 'burger', 'pizza', 'tacos_fr', 'riz_crousty', 'sandwich_boulangerie', 'poulet_frit', 'fish_and_chips', 'hot_dog'] },
  { key: 'asian', labelFr: 'Asie', labelEn: 'Asia', ids: ['japonais', 'chinois', 'thai', 'vietnamien', 'coreen', 'indien', 'asiatique_fusion', 'bubble_tea'] },
  { key: 'med', labelFr: 'Méditerranée', labelEn: 'Mediterranean', ids: ['libanais', 'turc', 'grec', 'marocain', 'italien', 'espagnol'] },
  { key: 'french', labelFr: 'Français', labelEn: 'French', ids: ['bistro', 'gastronomique', 'creperie', 'brasserie'] },
  { key: 'americas', labelFr: 'Amériques', labelEn: 'Americas', ids: ['mexicain', 'bresilien', 'peruvien'] },
  { key: 'africa', labelFr: 'Afrique', labelEn: 'Africa', ids: ['africain', 'antillais'] },
  { key: 'concepts', labelFr: 'Concepts', labelEn: 'Concepts', ids: ['poke_bowl', 'brunch', 'cafe', 'fruits_de_mer', 'bbq', 'healthy'] },
]

interface CuisineSelectorProps {
  selected: string | null
  onSelect: (id: string) => void
}

export function CuisineSelector({ selected, onSelect }: CuisineSelectorProps) {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const profileMap = useMemo(
    () => Object.fromEntries(CUISINE_PROFILES.map(p => [p.id, p])),
    [],
  )

  const selectedProfile = selected ? profileMap[selected] : null

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Focus search when opening
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [open])

  // Scroll selected item into view on open
  useEffect(() => {
    if (open && selected && listRef.current) {
      requestAnimationFrame(() => {
        const el = listRef.current?.querySelector(`[data-cuisine="${selected}"]`) as HTMLElement | null
        el?.scrollIntoView({ block: 'center', behavior: 'instant' })
      })
    }
  }, [open, selected])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const handleSelect = useCallback((id: string) => {
    onSelect(id)
    setOpen(false)
    setSearch('')
  }, [onSelect])

  // Filter groups and items by search
  const normalizedSearch = search.toLowerCase().trim()
  const filteredGroups = useMemo(() => {
    if (!normalizedSearch) return CUISINE_GROUPS
    return CUISINE_GROUPS
      .map(group => ({
        ...group,
        ids: group.ids.filter(id => {
          const p = profileMap[id]
          return p && p.label.toLowerCase().includes(normalizedSearch)
        }),
      }))
      .filter(group => group.ids.length > 0)
  }, [normalizedSearch, profileMap])

  const hasResults = filteredGroups.length > 0

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
      <div className="px-5 pt-4 pb-4">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          {t('profile.cuisine')}
        </label>

        {/* ── Dropdown container ──────────────────────────────── */}
        <div ref={containerRef} className="relative">

          {/* ── Trigger button ──────────────────────────────── */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`
              w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200
              text-left cursor-pointer active:scale-[0.99]
              ${open
                ? 'border-[#C9A961] bg-[#C9A961]/[0.03] shadow-[0_0_0_3px_rgba(201,169,97,0.1)]'
                : selectedProfile
                  ? 'border-gray-200 bg-white hover:border-gray-300'
                  : 'border-dashed border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white'
              }
            `}
          >
            {selectedProfile ? (
              <>
                <span className="text-xl leading-none">{selectedProfile.emoji}</span>
                <span className="flex-1 text-[15px] font-medium text-[#2C2622] truncate">
                  {selectedProfile.label}
                </span>
              </>
            ) : (
              <span className="flex-1 text-[15px] text-gray-400">
                {t('profile.cuisine.search')}
              </span>
            )}
            <ChevronDown
              size={18}
              className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {/* ── Dropdown panel ──────────────────────────────── */}
          {open && (
            <div
              className="
                absolute z-50 left-0 right-0 mt-2
                bg-white rounded-xl border border-gray-200
                shadow-lg shadow-black/8
                animate-fade-in
                overflow-hidden
              "
            >
              {/* ── Search ──────────────────────────────────── */}
              <div className="relative px-3 pt-3 pb-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('profile.cuisine.search')}
                    className="
                      w-full pl-9 pr-8 py-2.5 text-sm text-[#2C2622]
                      bg-gray-50 rounded-lg border border-gray-100
                      outline-none transition-colors
                      focus:bg-white focus:border-[#C9A961]/40
                      placeholder:text-gray-400
                    "
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* ── List ────────────────────────────────────── */}
              <div
                ref={listRef}
                className="max-h-[min(360px,50dvh)] overflow-y-auto overscroll-contain px-1.5 pb-1.5"
              >
                {hasResults ? (
                  filteredGroups.map((group, gi) => {
                    const groupLabel = lang === 'fr' ? group.labelFr : group.labelEn
                    return (
                      <div key={group.key}>
                        {/* Group divider */}
                        {gi > 0 && <div className="h-px bg-gray-100 mx-2 my-1" />}

                        {/* Group header */}
                        <div className="px-3 pt-2.5 pb-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                            {groupLabel}
                          </span>
                        </div>

                        {/* Items */}
                        {group.ids.map(id => {
                          const profile = profileMap[id]
                          if (!profile) return null
                          const isCurrent = selected === id

                          return (
                            <button
                              key={id}
                              data-cuisine={id}
                              onClick={() => handleSelect(id)}
                              className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                text-left transition-colors duration-100
                                ${isCurrent
                                  ? 'bg-[#C9A961]/[0.08]'
                                  : 'hover:bg-gray-50 active:bg-gray-100'
                                }
                              `}
                            >
                              <span className="text-lg leading-none w-7 text-center shrink-0">{profile.emoji}</span>
                              <span className={`flex-1 text-sm truncate ${
                                isCurrent ? 'font-semibold text-[#C9A961]' : 'font-medium text-[#2C2622]'
                              }`}>
                                {profile.label}
                              </span>
                              {isCurrent && (
                                <Check size={16} className="shrink-0 text-[#C9A961]" strokeWidth={2.5} />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-400">{t('profile.cuisine.noResults')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
