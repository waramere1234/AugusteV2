import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Loader2, LogOut, X, Check, Eye, Upload, ArrowLeft, Sparkles, Search, UtensilsCrossed, Image } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useRestaurant } from '@/hooks/useRestaurant'
import { GoogleBusinessCard } from '@/components/profile/GoogleBusinessCard'
import { CuisineSelector } from '@/components/profile/CuisineSelector'

const WIZARD_STEPS = 4

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
  const [wizardStep, setWizardStep] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Error translation
  const I18N_ERRORS = ['error.google.details', 'error.google.search', 'error.unknown'] as const
  type EK = typeof I18N_ERRORS[number]
  const translatedError = error && (I18N_ERRORS.includes(error as EK) ? t(error as EK) : error)

  // Wizard vs Edit mode — wizard shown for brand new restaurants (no name)
  const showWizard = !restaurant?.name?.trim()

  const handleSelectGoogle = useCallback(async (result: { place_id: string }) => {
    setApplyingGoogle(true)
    await applyGoogleData(result.place_id)
    setApplyingGoogle(false)
    setWizardStep(prev => prev === 1 ? 2 : prev)
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

  const googlePhotoUrls = restaurant?.google_business_data?.photo_urls ?? []

  // Completion tracking
  const stepDefs = [
    { done: !!restaurant?.name, label: t('profile.step.name') },
    { done: !!restaurant?.google_place_id, label: t('profile.step.google') },
    { done: !!restaurant?.cuisine_profile_id, label: t('profile.step.cuisine') },
    { done: !!restaurant?.style_photo_url, label: t('profile.step.dna') },
  ]
  const completedCount = stepDefs.filter(s => s.done).length
  const completionPct = Math.round((completedCount / stepDefs.length) * 100)

  // Hidden file input (shared)
  const fileInput = (
    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#C9A961]" size={32} />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WIZARD MODE
  // ─────────────────────────────────────────────────────────────────────────
  if (showWizard) {
    const stepIcons = [UtensilsCrossed, Search, Sparkles, Image]
    const StepIcon = stepIcons[wizardStep] ?? Sparkles

    return (
      <div className="min-h-[calc(100dvh-10rem)] flex flex-col animate-fade-in">
        {fileInput}

        {/* ── Progress bar + back ─────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          {wizardStep > 0 ? (
            <button
              onClick={() => setWizardStep(wizardStep - 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[#2C2622]/40 active:text-[#C9A961] active:bg-[#C9A961]/5 transition-colors shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
          ) : <div className="w-10" />}
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: WIZARD_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < wizardStep ? 'bg-[#C9A961]'
                    : i === wizardStep ? 'bg-[#C9A961]/40'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="w-10" />
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {translatedError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
            <span className="flex-1">{translatedError}</span>
            <button onClick={clearError} className="shrink-0 p-1"><X size={14} /></button>
          </div>
        )}

        {/* ── STEP 0: Name ─────────────────────────────────────── */}
        {wizardStep === 0 && (
          <div className="flex-1 flex flex-col items-center pt-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#C9A961]/10 flex items-center justify-center mb-6">
              <StepIcon size={28} className="text-[#C9A961]" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold font-serif text-[#2C2622] text-center leading-tight mb-2">
              {t('profile.wizard.nameTitle')}
            </h2>
            <p className="text-sm text-[#2C2622]/40 text-center mb-10">
              {t('profile.wizard.nameHint')}
            </p>

            <div className="w-full max-w-sm">
              <input
                type="text"
                autoFocus
                value={restaurant?.name ?? ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder={t('profile.name.placeholder')}
                className="w-full text-center text-xl font-serif font-semibold text-[#2C2622] border-b-2 border-gray-200 focus:border-[#C9A961] outline-none pb-3 bg-transparent transition-colors placeholder:text-gray-300 placeholder:font-sans placeholder:text-base placeholder:font-normal"
              />
            </div>

            <div className="mt-auto pt-8 w-full">
              <button
                onClick={() => setWizardStep(1)}
                disabled={!restaurant?.name?.trim()}
                className="w-full py-4 bg-[#C9A961] text-white font-semibold rounded-full text-sm disabled:opacity-25 active:scale-[0.97] transition-all"
              >
                {t('profile.wizard.continue')}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 1: Google Business ──────────────────────────── */}
        {wizardStep === 1 && (
          <div className="flex-1 flex flex-col items-center pt-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#C9A961]/10 flex items-center justify-center mb-6">
              <StepIcon size={28} className="text-[#C9A961]" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold font-serif text-[#2C2622] text-center leading-tight mb-2">
              {t('profile.wizard.googleTitle')}
            </h2>
            <p className="text-sm text-[#2C2622]/40 text-center mb-8">
              {t('profile.wizard.googleHint')}
            </p>

            <div className="w-full">
              <GoogleBusinessCard
                googleData={restaurant?.google_business_data ?? null}
                googlePlaceId={restaurant?.google_place_id ?? null}
                applying={applyingGoogle}
                onSearch={searchGoogle}
                onSelect={handleSelectGoogle}
                onDisconnect={handleDisconnectGoogle}
              />
            </div>

            <div className="mt-auto pt-6 w-full">
              <button
                onClick={() => setWizardStep(2)}
                className="w-full py-3.5 text-sm text-[#2C2622]/35 font-medium active:text-[#C9A961] transition-colors"
              >
                {t('profile.wizard.skip')}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Cuisine ──────────────────────────────────── */}
        {wizardStep === 2 && (
          <div className="flex-1 flex flex-col items-center pt-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#C9A961]/10 flex items-center justify-center mb-6">
              <StepIcon size={28} className="text-[#C9A961]" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold font-serif text-[#2C2622] text-center leading-tight mb-2">
              {t('profile.wizard.cuisineTitle')}
            </h2>
            <p className="text-sm text-[#2C2622]/40 text-center mb-2">
              {t('profile.wizard.cuisineHint')}
            </p>

            {/* Google auto-detected badge */}
            {restaurant?.google_business_data?.detected_cuisine_profile && restaurant.cuisine_profile_id && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C9A6B]/10 text-[#7C9A6B] text-xs font-medium mb-4">
                <Check size={12} />
                {t('profile.wizard.detected')}
              </div>
            )}

            <div className="w-full mt-2">
              <CuisineSelector
                selected={restaurant?.cuisine_profile_id ?? null}
                onSelect={handleCuisineSelect}
              />
            </div>

            <div className="mt-auto pt-6 w-full">
              <button
                onClick={() => setWizardStep(3)}
                disabled={!restaurant?.cuisine_profile_id}
                className="w-full py-4 bg-[#C9A961] text-white font-semibold rounded-full text-sm disabled:opacity-25 active:scale-[0.97] transition-all"
              >
                {t('profile.wizard.continue')}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Photo ────────────────────────────────────── */}
        {wizardStep === 3 && (
          <div className="flex-1 flex flex-col items-center pt-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#C9A961]/10 flex items-center justify-center mb-6">
              <StepIcon size={28} className="text-[#C9A961]" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold font-serif text-[#2C2622] text-center leading-tight mb-2">
              {t('profile.wizard.photoTitle')}
            </h2>
            <p className="text-sm text-[#2C2622]/40 text-center mb-8">
              {t('profile.wizard.photoHint')}
            </p>

            <div className="w-full space-y-4">
              {/* Google photos picker */}
              {googlePhotoUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {googlePhotoUrls.map((url, i) => {
                    const isSelected = restaurant?.style_photo_url === url
                    return (
                      <button
                        key={i}
                        onClick={() => selectStylePhoto(url)}
                        className={`relative aspect-square rounded-xl overflow-hidden transition-all active:scale-95 ${
                          isSelected
                            ? 'ring-2 ring-[#C9A961] ring-offset-2 shadow-md'
                            : 'ring-1 ring-gray-100'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#C9A961]/20 flex items-center justify-center">
                            <span className="bg-[#C9A961] text-white rounded-full p-1">
                              <Check size={14} strokeWidth={3} />
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Upload zone */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 active:border-[#C9A961] active:text-[#C9A961] transition-colors ${
                  googlePhotoUrls.length > 0 ? 'py-4 border-gray-150' : 'h-36 border-gray-200'
                }`}
              >
                {uploading ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <>
                    <Camera size={googlePhotoUrls.length > 0 ? 18 : 24} />
                    <span className="text-sm">{googlePhotoUrls.length > 0 ? t('profile.photo.uploadOwn') : t('profile.photo.add')}</span>
                  </>
                )}
              </button>

              {/* Selected photo preview */}
              {restaurant?.style_photo_url && (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={restaurant.style_photo_url} alt="" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    {analyzingStyle ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A961] bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <Loader2 size={11} className="animate-spin" />
                        {t('profile.style.analyzing')}
                      </span>
                    ) : restaurant.style_description ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7C9A6B] bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <Eye size={11} />
                        {t('profile.style.detected')}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 w-full flex gap-3">
              <button
                onClick={() => setWizardStep(4)}
                className="flex-1 py-3.5 text-sm text-[#2C2622]/35 font-medium active:text-[#C9A961] transition-colors"
              >
                {t('profile.wizard.skip')}
              </button>
              {restaurant?.style_photo_url && (
                <button
                  onClick={() => setWizardStep(4)}
                  className="flex-1 py-4 bg-[#C9A961] text-white font-semibold rounded-full text-sm active:scale-[0.97] transition-all"
                >
                  {t('profile.wizard.continue')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── DONE ─────────────────────────────────────────────── */}
        {wizardStep === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-[#7C9A6B]/10 flex items-center justify-center mb-6">
              <Check size={36} className="text-[#7C9A6B]" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold font-serif text-[#2C2622] mb-3">
              {t('profile.wizard.doneTitle')}
            </h2>
            <p className="text-sm text-[#2C2622]/40 max-w-xs mb-10">
              {t('profile.wizard.doneSubtitle')}
            </p>

            {/* Summary pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {restaurant?.name && (
                <span className="px-3 py-1.5 bg-[#C9A961]/10 text-[#C9A961] text-xs font-medium rounded-full">
                  {restaurant.name}
                </span>
              )}
              {restaurant?.google_place_id && (
                <span className="px-3 py-1.5 bg-[#7C9A6B]/10 text-[#7C9A6B] text-xs font-medium rounded-full">
                  Google
                </span>
              )}
              {restaurant?.cuisine_profile_id && (
                <span className="px-3 py-1.5 bg-[#C9A961]/10 text-[#C9A961] text-xs font-medium rounded-full">
                  {restaurant.cuisine_profile_id}
                </span>
              )}
            </div>

            <button
              onClick={() => navigate('/menu')}
              className="cta-shine w-full max-w-xs py-4 bg-[#C9A961] text-white font-semibold rounded-full text-sm active:scale-[0.97] transition-all shadow-lg shadow-[#C9A961]/20"
            >
              {t('profile.wizard.doneCta')}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EDIT MODE (returning users)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      {fileInput}

      {/* ── Header: avatar + name + progress ──────────────────────────── */}
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
                <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${step.done ? 'bg-[#7C9A6B]' : 'bg-gray-300'}`} />
                <span className={`text-[10px] font-medium transition-colors duration-300 ${step.done ? 'text-[#7C9A6B]' : 'text-gray-400'}`}>
                  {step.label}
                </span>
                {i < stepDefs.length - 1 && <span className="text-gray-300 text-[10px] mx-0.5">·</span>}
              </div>
            ))}
            {completionPct === 100 && (
              <span className="text-[10px] font-semibold text-[#7C9A6B] ml-1">{t('profile.complete')}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {translatedError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="flex-1">{translatedError}</span>
          <button onClick={clearError} aria-label={t('common.dismiss')} className="shrink-0 p-2 -mr-1 rounded-md text-red-400 active:bg-red-100 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Restaurant info card ───────────────────────────────────────── */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div>
          <label htmlFor="resto-name" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            {t('profile.name')}
          </label>
          <input
            id="resto-name"
            type="text"
            value={restaurant?.name ?? ''}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={t('profile.name.placeholder')}
            className="w-full text-lg font-semibold text-[#2C2622] border-b-2 border-gray-100 focus:border-[#C9A961] focus-visible:ring-2 focus-visible:ring-[#C9A961]/20 outline-none pb-2 bg-transparent transition-colors placeholder:text-gray-400"
          />
        </div>

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

      {/* ── Google Business ─────────────────────────────────────────────── */}
      <GoogleBusinessCard
        googleData={restaurant?.google_business_data ?? null}
        googlePlaceId={restaurant?.google_place_id ?? null}
        applying={applyingGoogle}
        onSearch={searchGoogle}
        onSelect={handleSelectGoogle}
        onDisconnect={handleDisconnectGoogle}
      />

      {/* ── Cuisine selector ───────────────────────────────────────────── */}
      <CuisineSelector
        selected={restaurant?.cuisine_profile_id ?? null}
        onSelect={handleCuisineSelect}
      />

      {/* ── ADN visuel ─────────────────────────────────────────────────── */}
      <section className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        {restaurant?.style_photo_url ? (
          <div className="relative">
            <img src={restaurant.style_photo_url} alt={restaurant.name || t('profile.title')} className="w-full h-48 lg:h-60 object-cover" />
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

          {googlePhotoUrls.length === 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 active:border-[#C9A961] active:text-[#C9A961] transition-colors"
            >
              {uploading ? <Loader2 size={24} className="animate-spin" /> : (
                <>
                  <Camera size={24} />
                  <span className="text-sm">{t('profile.photo.add')}</span>
                </>
              )}
            </button>
          )}

          {googlePhotoUrls.length > 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-[#2C2622]/35 hover:text-[#2C2622]/60 active:text-[#C9A961] transition-colors"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : (
                <>
                  <Upload size={14} />
                  {t('profile.photo.uploadOwn')}
                </>
              )}
            </button>
          )}

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

      {/* ── Quick link: Menu ─────────────────────────────────────────── */}
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

      {/* ── Logout ────────────────────────────────────────────────────── */}
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
