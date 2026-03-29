import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Loader2, LogOut, Sparkles, X, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useCredits } from '@/hooks/useCredits'
import { GoogleBusinessCard } from '@/components/profile/GoogleBusinessCard'
import { CuisineSelector } from '@/components/profile/CuisineSelector'

export function ProfilePage() {
  const { t } = useI18n()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const {
    restaurant, loading, saving, saved, error, clearError,
    updateField, searchGoogle, applyGoogleData, uploadPhoto,
  } = useRestaurant()
  const { credits } = useCredits()

  const [uploading, setUploading] = useState(false)
  const [applyingGoogle, setApplyingGoogle] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Translate known error keys, fallback to raw message
  const I18N_ERRORS = ['error.google.details', 'error.google.search', 'error.unknown'] as const
  type EK = typeof I18N_ERRORS[number]
  const translatedError = error && (I18N_ERRORS.includes(error as EK) ? t(error as EK) : error)

  const handleSelectGoogle = useCallback(async (result: { place_id: string }) => {
    setApplyingGoogle(true)
    await applyGoogleData(result.place_id)
    setApplyingGoogle(false)
  }, [applyGoogleData])

  const handleDisconnectGoogle = useCallback(() => {
    updateField('google_place_id', null)
    updateField('google_business_data', null)
  }, [updateField])

  const handleCuisineSelect = useCallback((id: string) => {
    updateField('cuisine_profile_id', id)
  }, [updateField])

  const handleLogout = useCallback(async () => { await signOut(); navigate('/login') }, [signOut, navigate])

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.size > 10 * 1024 * 1024 || !file.type.startsWith('image/')) return
    setUploading(true)
    await uploadPhoto(file)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [uploadPhoto])

  // Completion steps (photo excluded — marked as optional)
  const stepDefs = [
    { done: !!restaurant?.name, label: t('profile.step.name') },
    { done: !!restaurant?.google_place_id, label: t('profile.step.google') },
    { done: !!restaurant?.cuisine_profile_id, label: t('profile.step.cuisine') },
  ]
  const completedCount = stepDefs.filter(s => s.done).length
  const completionPct = Math.round((completedCount / stepDefs.length) * 100)
  const isNewRestaurant = completedCount === 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#C9A961]" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header: avatar + name + progress ────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label={t('profile.photo.avatarLabel')}
          className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#C9A961]/20 to-[#D4895C]/10 shadow-sm active:scale-95 transition-transform"
        >
          {restaurant?.style_photo_url ? (
            <img src={restaurant.style_photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera size={22} className="text-[#C9A961]/50" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-white" />
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-serif text-[#2C2622] truncate">{restaurant?.name || t('profile.title')}</h1>
            {saving ? <Loader2 size={14} className="animate-spin text-[#C9A961] shrink-0" />
              : saved ? <Check size={14} className="text-[#7C9A6B] shrink-0" /> : null}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>

          {/* Step indicators */}
          <div className="mt-2 flex items-center gap-1.5">
            {stepDefs.map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  step.done ? 'bg-[#7C9A6B]' : 'bg-gray-300'
                }`} />
                <span className={`text-[10px] font-medium transition-colors duration-300 ${
                  step.done ? 'text-[#7C9A6B]' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
                {i < stepDefs.length - 1 && <span className="text-gray-300 text-[10px] mx-0.5">·</span>}
              </div>
            ))}
            {completionPct === 100 && (
              <span className="text-[10px] font-semibold text-[#7C9A6B] ml-1">
                {t('profile.complete')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Onboarding hint (first visit only) ───────────────────────────── */}
      {isNewRestaurant && (
        <div className="bg-[#C9A961]/[0.06] border border-[#C9A961]/15 rounded-xl px-4 py-3 animate-fade-in">
          <p className="text-sm text-[#2C2622]/80 leading-snug">
            {t('profile.onboarding')}
          </p>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {translatedError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="flex-1">{translatedError}</span>
          <button
            onClick={clearError}
            aria-label={t('common.dismiss')}
            className="shrink-0 p-2 -mr-1 rounded-md text-red-400 active:bg-red-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Restaurant info card ────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="resto-name" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            {t('profile.name')}
          </label>
          <input
            id="resto-name"
            type="text"
            autoFocus={!restaurant?.name}
            value={restaurant?.name ?? ''}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={t('profile.name.placeholder')}
            className="w-full text-lg font-semibold text-[#2C2622] border-b-2 border-gray-100 focus:border-[#C9A961] focus-visible:ring-2 focus-visible:ring-[#C9A961]/20 outline-none pb-2 bg-transparent transition-colors placeholder:text-gray-400"
          />
        </div>

        {/* Address + Phone row — visible once Google is linked or any field has a value */}
        {(restaurant?.google_place_id || restaurant?.address != null || restaurant?.phone != null) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="resto-address" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t('profile.address')}
              </label>
              <input
                id="resto-address"
                type="text"
                value={restaurant?.address ?? ''}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full text-sm text-[#2C2622] border-b-2 border-gray-100 focus:border-[#C9A961] focus-visible:ring-2 focus-visible:ring-[#C9A961]/20 outline-none pb-1.5 bg-transparent transition-colors"
              />
            </div>
            <div>
              <label htmlFor="resto-phone" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t('profile.phone')}
              </label>
              <input
                id="resto-phone"
                type="tel"
                value={restaurant?.phone ?? ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full text-sm text-[#2C2622] border-b-2 border-gray-100 focus:border-[#C9A961] focus-visible:ring-2 focus-visible:ring-[#C9A961]/20 outline-none pb-1.5 bg-transparent transition-colors"
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Google Business ─────────────────────────────────────────────────── */}
      <GoogleBusinessCard
        googleData={restaurant?.google_business_data ?? null}
        googlePlaceId={restaurant?.google_place_id ?? null}
        applying={applyingGoogle}
        onSearch={searchGoogle}
        onSelect={handleSelectGoogle}
        onDisconnect={handleDisconnectGoogle}
      />

      {/* ── Cuisine selector ────────────────────────────────────────────────── */}
      <CuisineSelector
        selected={restaurant?.cuisine_profile_id ?? null}
        onSelect={handleCuisineSelect}
      />

      {/* ── Restaurant photo ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          {t('profile.photo')}
          <span className="ml-1.5 normal-case tracking-normal text-gray-400">({t('profile.photo.optional')})</span>
        </label>

        {restaurant?.style_photo_url ? (
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={restaurant.style_photo_url}
              alt={restaurant.name || t('profile.title')}
              className="w-full h-44 lg:h-56 object-cover"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 active:bg-black/80 transition-colors"
            >
              <Camera size={14} />
              {t('profile.photo.change')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 active:border-[#C9A961] active:text-[#C9A961] transition-colors"
          >
            {uploading ? (
              <Loader2 size={28} className="animate-spin" />
            ) : (
              <>
                <Camera size={28} />
                <span className="text-sm">{t('profile.photo.add')}</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </section>

      {/* ── Quick links: Menu + Credits ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/menu')}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md hover:border-gray-200 active:scale-[0.97] transition-all"
        >
          <span className="text-2xl">📋</span>
          <p className="text-sm font-semibold text-[#2C2622] mt-2">{t('profile.menus')}</p>
          <p className="text-xs text-[#C9A961] mt-0.5 font-medium">+ {t('profile.addMenu')}</p>
        </button>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
          <Sparkles size={18} className="text-[#C9A961]" />
          <p className={`text-2xl font-bold mt-2 tabular-nums ${
            credits?.remaining === 0 ? 'text-[#D4895C]' : 'text-[#C9A961]'
          }`}>
            {credits?.remaining ?? '—'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t('profile.credits')}</p>
          <button className="mt-3 w-full py-2.5 bg-[#C9A961] hover:bg-[#C9A961]/90 text-white text-xs font-medium rounded-lg active:scale-95 transition-all shadow-sm shadow-[#C9A961]/20">
            {t('common.buy')}
          </button>
        </div>
      </div>

      {/* ── Logout ──────────────────────────────────────────────────────────── */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm text-gray-500 rounded-xl hover:text-gray-600 active:text-red-500 active:bg-red-50 transition-colors"
      >
        <LogOut size={16} />
        {t('auth.logout')}
      </button>
    </div>
  )
}
