import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Star, Phone, Globe, Clock, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Search, Loader2, Unlink } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { GoogleBusinessData } from '@/types'
import type { GoogleSearchResult } from '@/hooks/useRestaurant'

interface GoogleBusinessCardProps {
  googleData: GoogleBusinessData | null
  googlePlaceId: string | null
  applying?: boolean
  onSearch: (query: string) => Promise<GoogleSearchResult[]>
  onSelect: (result: GoogleSearchResult) => void
  onDisconnect: () => void
}

export function GoogleBusinessCard({ googleData, googlePlaceId, applying, onSearch, onSelect, onDisconnect }: GoogleBusinessCardProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GoogleSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchDone, setSearchDone] = useState(false)
  const [showHours, setShowHours] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    setSearchDone(false)
    const res = await onSearch(query)
    setResults(res)
    setSearching(false)
    setSearchDone(true)
  }

  // ── Applying state ────────────────────────────────────────────────────────
  if (applying) {
    return (
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-[#C9A961]" />
          <span className="text-sm font-medium text-[#2C2622]">{t('profile.google.applying')}</span>
        </div>
      </section>
    )
  }

  // ── Linked with partial data ──────────────────────────────────────────────
  if (googlePlaceId && !googleData) {
    return (
      <section className="rounded-2xl overflow-hidden border border-[#C9A961]/25 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#7C9A6B]/10 flex items-center justify-center">
              <Search size={13} className="text-[#7C9A6B]" />
            </div>
            <span className="text-sm text-gray-500">{t('profile.google.linkedPartial')}</span>
          </div>
          <button
            onClick={onDisconnect}
            className="text-xs text-gray-500 hover:text-gray-600 active:text-red-400 transition-colors px-3 py-2 rounded-lg"
          >
            {t('profile.google.disconnect')}
          </button>
        </div>
      </section>
    )
  }

  // ── LINKED STATE: Premium identity card ───────────────────────────────────
  if (googlePlaceId && googleData) {
    return (
      <LinkedCard
        googleData={googleData}
        showHours={showHours}
        onToggleHours={() => setShowHours(!showHours)}
        onDisconnect={onDisconnect}
      />
    )
  }

  // ── NOT LINKED: Search UI ─────────────────────────────────────────────────
  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A961]/15 to-[#D4895C]/10 flex items-center justify-center shrink-0">
          <Search size={18} className="text-[#C9A961]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#2C2622]">{t('profile.google')}</h3>
          <p className="text-xs text-gray-500 leading-snug">{t('profile.google.notLinked')}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('profile.google.placeholder')}
            aria-label={t('profile.google.placeholder')}
            className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 text-sm focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/10 outline-none transition-all"
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="px-4 py-3 bg-[#C9A961] hover:bg-[#C9A961]/90 text-white rounded-xl text-sm font-medium active:scale-95 transition-all disabled:opacity-40 shadow-sm shadow-[#C9A961]/20"
        >
          {searching ? <Loader2 size={16} className="animate-spin" /> : t('profile.google.search')}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-50 shadow-sm max-h-64 overflow-y-auto overscroll-contain">
          {results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => {
                onSelect(r)
                setResults([])
                setQuery('')
                setSearchDone(false)
              }}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#C9A961]/5 active:bg-[#C9A961]/10 transition-colors"
            >
              <MapPin size={17} className="text-[#C9A961] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#2C2622] text-sm truncate">{r.name}</p>
                <p className="text-xs text-gray-400 truncate">{r.address}</p>
              </div>
              {r.rating && (
                <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                  <Star size={12} className="text-[#C9A961] fill-[#C9A961]" />
                  {r.rating}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {searchDone && results.length === 0 && (
        <p className="mt-3 text-xs text-gray-400 text-center py-2">{t('profile.google.noResults')}</p>
      )}
    </section>
  )
}

// ── Photo Carousel ──────────────────────────────────────────────────────────

function PhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.offsetWidth)
    setActiveIdx(idx)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  function scrollTo(idx: number) {
    scrollRef.current?.scrollTo({ left: idx * (scrollRef.current?.offsetWidth ?? 0), behavior: 'smooth' })
  }

  if (photos.length === 0) return null

  return (
    <div className="relative group">
      {/* Scrollable photos */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {photos.map((url, i) => (
          <div key={i} className="w-full shrink-0 snap-center">
            <img
              src={url}
              alt={`${name} — ${i + 1}`}
              className="w-full h-52 lg:h-64 object-cover"
            />
          </div>
        ))}
      </div>

      {/* Arrow buttons (desktop hover) */}
      {photos.length > 1 && (
        <>
          <button
            onClick={() => scrollTo(Math.max(0, activeIdx - 1))}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${activeIdx === 0 ? 'invisible' : ''}`}
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scrollTo(Math.min(photos.length - 1, activeIdx + 1))}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${activeIdx === photos.length - 1 ? 'invisible' : ''}`}
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === activeIdx ? 'bg-white w-3' : 'bg-white/50'
              }`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Photo counter badge */}
      <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium rounded-full px-2 py-0.5">
        {activeIdx + 1}/{photos.length}
      </div>
    </div>
  )
}

// ── Linked Card ─────────────────────────────────────────────────────────────

function LinkedCard({
  googleData,
  showHours,
  onToggleHours,
  onDisconnect,
}: {
  googleData: GoogleBusinessData
  showHours: boolean
  onToggleHours: () => void
  onDisconnect: () => void
}) {
  const { t } = useI18n()
  const photos = googleData.photo_urls ?? []

  return (
    <section className="rounded-2xl overflow-hidden shadow-sm border border-[#C9A961]/20">
      {/* ── Photo carousel ─────────────────────────────────────────── */}
      {photos.length > 0 ? (
        <div className="relative">
          <PhotoCarousel photos={photos} name={googleData.name} />
          {/* Name overlay on last photo visible area */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pb-3 pointer-events-none">
            <h2 className="text-lg font-bold font-serif text-white leading-tight drop-shadow-sm">
              {googleData.name}
            </h2>
            {googleData.primary_type_display && (
              <span className="inline-block mt-1 text-[11px] font-medium text-white/90 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-0.5">
                {googleData.primary_type_display}
              </span>
            )}
          </div>
          {/* Verified badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
            <div className="w-3.5 h-3.5 rounded-full bg-[#7C9A6B] flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-[#2C2622]">Google</span>
          </div>
        </div>
      ) : (
        /* No photos — compact header */
        <div className="bg-gradient-to-br from-[#FAF8F5] to-[#C9A961]/[0.08] px-5 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-serif text-[#2C2622]">
                {googleData.name}
              </h2>
              {googleData.primary_type_display && (
                <span className="inline-block mt-1 text-[11px] font-medium text-[#C9A961] bg-[#C9A961]/10 rounded-full px-2.5 py-0.5">
                  {googleData.primary_type_display}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-[#7C9A6B]/10 rounded-full px-2.5 py-1">
              <div className="w-3.5 h-3.5 rounded-full bg-[#7C9A6B] flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[10px] font-semibold text-[#7C9A6B]">Google</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Rating bar ──────────────────────────────────────────────── */}
      {googleData.rating != null && (
        <div className="px-5 py-3 bg-white flex items-center gap-3 border-b border-gray-100/60">
          <span className="text-xl font-bold text-[#2C2622] tabular-nums">{googleData.rating}</span>
          <div className="flex items-center gap-px">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                className={s <= Math.round(googleData.rating!) ? 'text-[#C9A961] fill-[#C9A961]' : 'text-gray-200 fill-gray-200'}
              />
            ))}
          </div>
          {googleData.reviews_count > 0 && (
            <span className="text-xs text-gray-400">
              {googleData.reviews_count} {t('profile.google.reviews')}
            </span>
          )}
        </div>
      )}

      {/* ── Info rows ───────────────────────────────────────────────── */}
      <div className="bg-white px-5 py-3.5 space-y-3">
        {googleData.address && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C9A961]/8 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={15} className="text-[#C9A961]" />
            </div>
            <span className="text-sm text-[#2C2622] leading-snug pt-1">{googleData.address}</span>
          </div>
        )}
        {googleData.phone && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C9A961]/8 flex items-center justify-center shrink-0">
              <Phone size={15} className="text-[#C9A961]" />
            </div>
            <a href={`tel:${googleData.phone}`} className="text-sm text-[#2C2622] hover:text-[#C9A961] active:text-[#C9A961] transition-colors">
              {googleData.phone}
            </a>
          </div>
        )}
        {googleData.website && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C9A961]/8 flex items-center justify-center shrink-0">
              <Globe size={15} className="text-[#C9A961]" />
            </div>
            <a
              href={googleData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#C9A961] hover:underline active:underline truncate"
            >
              {googleData.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </a>
          </div>
        )}
        {googleData.description && (
          <p className="text-xs text-gray-500 leading-relaxed pl-11 line-clamp-3">
            {googleData.description}
          </p>
        )}
      </div>

      {/* ── Hours (collapsible) ─────────────────────────────────────── */}
      {googleData.hours?.length > 0 && (
        <div className="border-t border-gray-100/80 bg-white">
          <button
            onClick={onToggleHours}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C9A961]/8 flex items-center justify-center shrink-0">
                <Clock size={15} className="text-[#C9A961]" />
              </div>
              <span className="text-sm font-medium text-[#2C2622]">{t('profile.google.hours')}</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${showHours ? 'rotate-180' : ''}`}
            />
          </button>
          <div className={`overflow-hidden transition-all duration-200 ${showHours ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-5 pb-4 pl-16 space-y-1">
              {googleData.hours.map((h, i) => (
                <p key={i} className="text-xs text-gray-500">{h}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer: Maps link + disconnect ──────────────────────────── */}
      <div className="border-t border-gray-100/80 bg-white px-5 py-3 flex items-center justify-between">
        {googleData.google_maps_url ? (
          <a
            href={googleData.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#C9A961] font-medium hover:underline active:underline"
          >
            <ExternalLink size={14} />
            {t('profile.google.maps')}
          </a>
        ) : (
          <span />
        )}
        <button
          onClick={onDisconnect}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-500 active:text-red-400 transition-colors px-3 py-2 -mr-1 rounded-lg"
        >
          <Unlink size={12} />
          {t('profile.google.disconnect')}
        </button>
      </div>
    </section>
  )
}
