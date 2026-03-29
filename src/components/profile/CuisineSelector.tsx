import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { CUISINE_PROFILES } from '@/constants/cuisineProfiles'

// ── Cuisine groups ────────────────────────────────────────────────────────────
const CUISINE_GROUPS = [
  { key: 'street', labelFr: 'Street Food', labelEn: 'Street Food', emoji: '🍔', ids: ['kebab', 'burger', 'pizza', 'tacos_fr', 'riz_crousty', 'sandwich_boulangerie', 'poulet_frit', 'fish_and_chips', 'hot_dog'] },
  { key: 'asian', labelFr: 'Asie', labelEn: 'Asia', emoji: '🥢', ids: ['japonais', 'chinois', 'thai', 'vietnamien', 'coreen', 'indien', 'asiatique_fusion', 'bubble_tea'] },
  { key: 'med', labelFr: 'Méditerranée', labelEn: 'Mediterranean', emoji: '🫒', ids: ['libanais', 'turc', 'grec', 'marocain', 'italien', 'espagnol'] },
  { key: 'french', labelFr: 'Français', labelEn: 'French', emoji: '🥐', ids: ['bistro', 'gastronomique', 'creperie', 'brasserie'] },
  { key: 'americas', labelFr: 'Amériques', labelEn: 'Americas', emoji: '🌮', ids: ['mexicain', 'bresilien', 'peruvien'] },
  { key: 'africa', labelFr: 'Afrique', labelEn: 'Africa', emoji: '🍛', ids: ['africain', 'antillais'] },
  { key: 'concepts', labelFr: 'Concepts', labelEn: 'Concepts', emoji: '🥗', ids: ['poke_bowl', 'brunch', 'cafe', 'fruits_de_mer', 'bbq', 'healthy'] },
]

function findGroupForId(id: string | null): string {
  if (!id) return CUISINE_GROUPS[0].key
  return CUISINE_GROUPS.find(g => g.ids.includes(id))?.key ?? CUISINE_GROUPS[0].key
}

interface CuisineSelectorProps {
  selected: string | null
  onSelect: (id: string) => void
}

export function CuisineSelector({ selected, onSelect }: CuisineSelectorProps) {
  const { t, lang } = useI18n()
  const [activeGroup, setActiveGroup] = useState<string>(() => findGroupForId(selected))
  const tabsRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  const profileMap = useMemo(
    () => Object.fromEntries(CUISINE_PROFILES.map(p => [p.id, p])),
    [],
  )

  const currentGroup = useMemo(
    () => CUISINE_GROUPS.find(g => g.key === activeGroup) ?? CUISINE_GROUPS[0],
    [activeGroup],
  )

  // Slide the indicator under the active tab
  useEffect(() => {
    const container = tabsRef.current
    const indicator = indicatorRef.current
    if (!container || !indicator) return

    const activeBtn = container.querySelector(`[data-group="${activeGroup}"]`) as HTMLElement | null
    if (!activeBtn) return

    const containerRect = container.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()

    indicator.style.width = `${btnRect.width}px`
    indicator.style.transform = `translateX(${btnRect.left - containerRect.left + container.scrollLeft}px)`
  }, [activeGroup])

  // Auto-scroll active tab into view
  useEffect(() => {
    const container = tabsRef.current
    if (!container) return
    const activeBtn = container.querySelector(`[data-group="${activeGroup}"]`) as HTMLElement | null
    if (!activeBtn) return
    activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeGroup])

  const handleSelect = useCallback((id: string) => {
    onSelect(id)
  }, [onSelect])

  const handleGroupChange = useCallback((key: string) => {
    setActiveGroup(key)
  }, [])

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header + selected badge */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t('profile.cuisine')}
          </label>
          {selected && profileMap[selected] && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#C9A961]/[0.08] rounded-full border border-[#C9A961]/15">
              <span className="text-sm">{profileMap[selected].emoji}</span>
              <span className="text-xs font-semibold text-[#C9A961]">{profileMap[selected].label}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Horizontal tab bar with sliding indicator ─────────────── */}
      <div className="relative">
        <div
          ref={tabsRef}
          className="flex overflow-x-auto scrollbar-hide px-4 gap-1 pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {CUISINE_GROUPS.map(group => {
            const isActive = activeGroup === group.key
            const hasSelected = group.ids.includes(selected ?? '')
            const label = lang === 'fr' ? group.labelFr : group.labelEn

            return (
              <button
                key={group.key}
                data-group={group.key}
                onClick={() => handleGroupChange(group.key)}
                className={`relative shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-[#2C2622] text-white shadow-sm'
                    : hasSelected
                      ? 'bg-[#C9A961]/10 text-[#C9A961]'
                      : 'text-gray-500 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <span className="text-base leading-none">{group.emoji}</span>
                <span>{label}</span>
                {hasSelected && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Sliding underline indicator */}
        <div className="relative h-0.5 mx-4">
          <div className="absolute inset-0 bg-gray-100 rounded-full" />
          <div
            ref={indicatorRef}
            className="absolute top-0 left-0 h-full bg-[#2C2622] rounded-full transition-all duration-300 ease-out"
          />
        </div>
      </div>

      {/* ── Cuisine items grid ────────────────────────────────────── */}
      <div className="p-4 pt-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {currentGroup.ids.map(id => {
            const profile = profileMap[id]
            if (!profile) return null
            const isCurrent = selected === id

            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                aria-pressed={isCurrent}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 active:scale-95 ${
                  isCurrent
                    ? 'border-[#C9A961] bg-[#C9A961]/10 shadow-sm shadow-[#C9A961]/10'
                    : 'border-transparent bg-gray-50/80 hover:bg-gray-100 hover:border-gray-200 active:border-[#C9A961]/30'
                }`}
              >
                <span className="text-2xl leading-none">{profile.emoji}</span>
                <span className={`text-[11px] text-center leading-tight line-clamp-2 font-medium ${
                  isCurrent ? 'text-[#C9A961]' : 'text-gray-600'
                }`}>
                  {profile.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
