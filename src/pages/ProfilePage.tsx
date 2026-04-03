import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, Loader2, LogOut, Sparkles, X, Check, Zap, Crown, Flame } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useCredits } from '@/hooks/useCredits'
import { useCheckout, CREDIT_PACKS } from '@/hooks/useCheckout'
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
  const { credits, reload: reloadCredits } = useCredits()
  const { checkout, loading: checkoutLoading, error: checkoutError, clearError: clearCheckoutError } = useCheckout()
  const [searchParams, setSearchParams] = useSearchParams()

  const [uploading, setUploading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Handle Stripe return
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      setPaymentSuccess(true)
      reloadCredits()
      // Clean URL
      searchParams.delete('payment')
      searchParams.delete('pack')
      setSearchParams(searchParams, { replace: true })
      setTimeout(() => setPaymentSuccess(false), 5000)
    } else if (payment === 'cancelled') {
      searchParams.delete('payment')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, reloadCredits])
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

      {/* ── Credits + Packs ──────────────────────────────────────────────────── */}
      <section className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        {/* Credits header — gradient banner */}
        <div className="bg-gradient-to-r from-[#2C2622] to-[#3D352F] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A961]/20 flex items-center justify-center">
                <Sparkles size={18} className="text-[#C9A961]" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{t('profile.credits')}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-bold tabular-nums ${
                    credits?.remaining === 0 ? 'text-[#D4895C]' : 'text-[#C9A961]'
                  }`}>
                    {credits?.remaining ?? '—'}
                  </span>
                  {credits?.totalGenerated ? (
                    <span className="text-[10px] text-white/30">{credits.totalGenerated} {t('profile.generated')}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-white/30 max-w-[120px] text-right leading-tight">{t('profile.credits.desc')}</p>
          </div>
        </div>

        {/* Body — packs */}
        <div className="bg-white p-4 space-y-3">
          {/* Payment success banner */}
          {paymentSuccess && (
            <div className="bg-[#7C9A6B]/10 border border-[#7C9A6B]/20 rounded-xl px-4 py-3 flex items-center gap-2 animate-fade-in">
              <Check size={16} className="text-[#7C9A6B] shrink-0" />
              <p className="text-sm font-medium text-[#7C9A6B]">{t('profile.paymentSuccess')}</p>
            </div>
          )}

          {/* Checkout error */}
          {checkoutError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="flex-1">{checkoutError}</span>
              <button onClick={clearCheckoutError} className="p-1 rounded text-red-400 active:bg-red-100">
                <X size={14} />
              </button>
            </div>
          )}

          <p className="text-xs font-semibold text-[#2C2622]/70 uppercase tracking-wider">{t('profile.choosePack')}</p>

          {/* Pack cards — stacked on mobile for readability */}
          <div className="space-y-2.5">
            {CREDIT_PACKS.map((pack) => {
              const icons = { starter: Zap, popular: Crown, complete: Flame }
              const PackIcon = icons[pack.id]
              const isLoading = checkoutLoading === pack.id

              return (
                <button
                  key={pack.id}
                  onClick={() => checkout(pack.id)}
                  disabled={!!checkoutLoading}
                  className={`relative w-full flex items-center gap-3.5 p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                    pack.popular
                      ? 'border-[#C9A961] bg-gradient-to-r from-[#C9A961]/[0.06] to-[#C9A961]/[0.02] shadow-[0_2px_12px_rgba(201,169,97,0.12)]'
                      : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  } ${checkoutLoading && !isLoading ? 'opacity-50' : ''}`}
                >
                  {/* Popular badge */}
                  {pack.popular && (
                    <span className="absolute -top-2.5 left-4 bg-[#C9A961] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      {t('profile.popular')}
                    </span>
                  )}

                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    pack.popular ? 'bg-[#C9A961]/15' : 'bg-[#F0EDE8]'
                  }`}>
                    <PackIcon size={20} className={pack.popular ? 'text-[#C9A961]' : 'text-[#2C2622]/30'} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-[#2C2622]">{t(`profile.pack.${pack.id}`)}</span>
                      <span className="text-[10px] text-[#2C2622]/30">{pack.pricePerCredit}/{t('profile.perCredit')}</span>
                    </div>
                    <p className="text-xs text-[#2C2622]/40 mt-0.5">{t(`profile.pack.${pack.id}.desc`)}</p>
                  </div>

                  {/* Price + credits */}
                  <div className="text-right shrink-0">
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin text-[#C9A961] mx-auto" />
                    ) : (
                      <>
                        <p className={`text-lg font-bold tabular-nums ${pack.popular ? 'text-[#C9A961]' : 'text-[#2C2622]'}`}>{pack.price}</p>
                        <p className="text-[10px] text-[#2C2622]/30 font-medium">{pack.credits} {t('profile.credits.unit')}</p>
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Trust line */}
          <p className="text-[10px] text-center text-[#2C2622]/25 pt-1">{t('profile.stripe.trust')}</p>
        </div>
      </section>

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
