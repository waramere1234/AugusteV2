import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Loader2, LogOut, X, Check, Eye, Upload } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useRestaurant } from '@/hooks/useRestaurant'
import { GoogleBusinessCard } from '@/components/profile/GoogleBusinessCard'
import { CuisineSelector } from '@/components/profile/CuisineSelector'

export function ProfilePage() {
  const { t } = useI18n()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const {
    restaurant, loading, saving, saved, analyzingStyle, error, clearError,
    updateField, searchGoogle, applyGoogleData, uploadPhoto, selectStylePhoto,
  } = useRestaurant()
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
  const googlePhotoUrls = restaurant?.google_business_data?.photo_urls ?? []

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

      {/* ── ADN visuel — photo de référence + style ───────────────────────── */}
      <section className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        {/* Hero: selected photo with gradient overlay */}
        {restaurant?.style_photo_url ? (
          <div className="relative">
            <img
              src={restaurant.style_photo_url}
              alt={restaurant.name || t('profile.title')}
              className="w-full h-48 lg:h-60 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">{t('profile.style.visualDna')}</p>
                {analyzingStyle ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A961] mt-1">
                    <Loader2 size={12} className="animate-spin" />
                    {t('profile.style.analyzing')}
                  </span>
                ) : restaurant?.style_description ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7C9A6B] mt-1">
                    <Eye size={12} />
                    {t('profile.style.detected')}
                  </span>
                ) : null}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:bg-white/30 transition-colors"
              >
                <Upload size={12} />
                {t('profile.photo.change')}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white px-5 pt-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('profile.style.visualDna')}</p>
            <p className="text-xs text-gray-400 mt-1 mb-3">{t('profile.style.hint')}</p>
          </div>
        )}

        <div className="bg-white p-5 space-y-4">
          {/* Google photos picker */}
          {googlePhotoUrls.length > 0 && (
            <div>
              <p className="text-xs text-[#2C2622]/50 mb-2.5">{t('profile.photo.pickGoogle')}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {googlePhotoUrls.map((url, i) => {
                  const isSelected = restaurant?.style_photo_url === url
                  return (
                    <button
                      key={i}
                      onClick={() => selectStylePhoto(url)}
                      className={`relative aspect-square rounded-xl overflow-hidden transition-all active:scale-95 ${
                        isSelected
                          ? 'ring-2 ring-[#C9A961] ring-offset-2 shadow-md'
                          : 'ring-1 ring-gray-100 hover:ring-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-t from-[#C9A961]/40 to-transparent flex items-end justify-center pb-1.5">
                          <span className="bg-[#C9A961] text-white rounded-full p-0.5">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upload — shown as primary only when no Google photos */}
          {googlePhotoUrls.length === 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 active:border-[#C9A961] active:text-[#C9A961] transition-colors"
            >
              {uploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <Camera size={24} />
                  <span className="text-sm">{t('profile.photo.add')}</span>
                </>
              )}
            </button>
          )}

          {/* Compact upload when Google photos exist but user wants their own */}
          {googlePhotoUrls.length > 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-[#2C2622]/35 hover:text-[#2C2622]/60 active:text-[#C9A961] transition-colors"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Upload size={14} />
                  {t('profile.photo.uploadOwn')}
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

          {/* Style description — elegant sub-card */}
          {restaurant?.style_description && (
            <div className="bg-[#FAF8F5] rounded-xl p-4 space-y-2 border border-[#C9A961]/10">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-[#C9A961] uppercase tracking-wider">{t('profile.style.description')}</label>
                <Eye size={12} className="text-[#C9A961]/40" />
              </div>
              <textarea
                value={restaurant.style_description}
                onChange={(e) => updateField('style_description', e.target.value)}
                rows={2}
                className="w-full text-sm text-[#2C2622]/80 leading-relaxed bg-transparent outline-none resize-none placeholder:text-[#2C2622]/30"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Quick link: Menu ──────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/menu')}
        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md hover:border-gray-200 active:scale-[0.97] transition-all flex items-center gap-4"
      >
        <span className="text-2xl">📋</span>
        <div>
          <p className="text-sm font-semibold text-[#2C2622]">{t('profile.menus')}</p>
          <p className="text-xs text-[#C9A961] mt-0.5 font-medium">+ {t('profile.addMenu')}</p>
        </div>
      </button>

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
