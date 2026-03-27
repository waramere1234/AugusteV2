import { useState } from 'react'
import { MapPin, Star, Phone, Globe, Clock, ChevronDown, ExternalLink, Check, Search, Loader2 } from 'lucide-react'
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

  // ── Applying state: loading indicator ──────────────────────────────────────
  if (applying) {
    return (
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-[#C9A961]" />
          <span className="text-sm font-medium text-[#2C2622]">{t('profile.google.applying')}</span>
        </div>
      </section>
    )
  }

  // ── Linked but no data yet (edge case) ────────────────────────────────────
  if (googlePlaceId && !googleData) {
    return (
      <section className="rounded-2xl overflow-hidden border border-[#C9A961]/25 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#7C9A6B]/10 flex items-center justify-center">
              <Check size={13} className="text-[#7C9A6B]" />
            </div>
            <span className="text-sm text-gray-500">{t('profile.google.linkedPartial')}</span>
          </div>
          <button
            onClick={onDisconnect}
            className="text-xs text-gray-400 active:text-red-400 transition-colors px-3 py-2 rounded-lg"
          >
            {t('profile.google.disconnect')}
          </button>
        </div>
      </section>
    )
  }

  // ── Linked state: rich card ─────────────────────────────────────────────────
  if (googlePlaceId && googleData) {
    return (
      <section className="rounded-2xl overflow-hidden border border-[#C9A961]/25 bg-gradient-to-br from-white via-white to-[#C9A961]/[0.03] shadow-sm">
        {/* Header bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#7C9A6B]/10 flex items-center justify-center">
              <Check size={13} className="text-[#7C9A6B]" />
            </div>
            <span className="text-sm font-medium text-[#7C9A6B]">{t('profile.google.linked')}</span>
          </div>
          <button
            onClick={onDisconnect}
            className="text-xs text-gray-400 active:text-red-400 transition-colors px-3 py-2 -mr-1 rounded-lg"
          >
            {t('profile.google.disconnect')}
          </button>
        </div>

        {/* Rating row */}
        {googleData.rating != null && (
          <div className="px-5 pb-3 flex items-center gap-2.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={15}
                  className={s <= Math.round(googleData.rating!) ? 'text-[#C9A961] fill-[#C9A961]' : 'text-gray-200 fill-gray-200'}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-[#2C2622]">{googleData.rating}</span>
            {googleData.reviews_count > 0 && (
              <span className="text-xs text-gray-400">({googleData.reviews_count} {t('profile.google.reviews')})</span>
            )}
          </div>
        )}

        {/* Info rows */}
        <div className="px-5 pb-4 space-y-3">
          {googleData.address && (
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-[#C9A961] mt-0.5 shrink-0" />
              <span className="text-sm text-[#2C2622] leading-snug">{googleData.address}</span>
            </div>
          )}
          {googleData.phone && (
            <div className="flex items-center gap-3">
              <Phone size={15} className="text-[#C9A961] shrink-0" />
              <a href={`tel:${googleData.phone}`} className="text-sm text-[#2C2622] active:text-[#C9A961] transition-colors">
                {googleData.phone}
              </a>
            </div>
          )}
          {googleData.website && (
            <div className="flex items-center gap-3">
              <Globe size={15} className="text-[#C9A961] shrink-0" />
              <a
                href={googleData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#C9A961] active:underline truncate"
              >
                {googleData.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            </div>
          )}
          {googleData.description && (
            <p className="text-xs text-gray-500 leading-relaxed pl-7 line-clamp-2">
              {googleData.description}
            </p>
          )}
        </div>

        {/* Hours (collapsible) */}
        {googleData.hours?.length > 0 && (
          <div className="border-t border-gray-100/80">
            <button
              onClick={() => setShowHours(!showHours)}
              className="w-full px-5 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Clock size={15} className="text-[#C9A961]" />
                <span className="text-sm font-medium text-[#2C2622]">{t('profile.google.hours')}</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${showHours ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${showHours ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="px-5 pb-4 pl-12 space-y-1">
                {googleData.hours.map((h, i) => (
                  <p key={i} className="text-xs text-gray-500">{h}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Google Maps link */}
        {googleData.google_maps_url && (
          <div className="border-t border-gray-100/80 px-5 py-3">
            <a
              href={googleData.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#C9A961] font-medium active:underline"
            >
              <ExternalLink size={14} />
              {t('profile.google.maps')}
            </a>
          </div>
        )}
      </section>
    )
  }

  // ── Not linked: search UI ─────────────────────────────────────────────────
  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[#C9A961]/10 flex items-center justify-center shrink-0">
          <Search size={17} className="text-[#C9A961]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#2C2622]">{t('profile.google')}</h3>
          <p className="text-xs text-gray-400 leading-snug">{t('profile.google.notLinked')}</p>
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
            className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 text-sm focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/10 focus-visible:ring-[#C9A961]/20 outline-none transition-all"
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

      {/* Search results */}
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
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#C9A961]/5 active:bg-[#C9A961]/10 focus-visible:bg-[#C9A961]/5 focus-visible:outline-none transition-colors"
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

      {/* No results feedback */}
      {searchDone && results.length === 0 && (
        <p className="mt-3 text-xs text-gray-400 text-center py-2">{t('profile.google.noResults')}</p>
      )}
    </section>
  )
}
