import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Sparkles, Zap, Crown, Flame, Loader2, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useCheckout, CREDIT_PACKS } from '@/hooks/useCheckout'

interface CreditsSheetProps {
  open: boolean
  onClose: () => void
  remaining: number | null
  totalGenerated: number | null
  paymentSuccess?: boolean
}

export function CreditsSheet({ open, onClose, remaining, totalGenerated, paymentSuccess }: CreditsSheetProps) {
  const { t } = useI18n()
  const { checkout, loading: checkoutLoading, error: checkoutError, clearError: clearCheckoutError } = useCheckout()

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const icons = { starter: Zap, popular: Crown, complete: Flame } as const

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md lg:max-w-lg bg-white rounded-t-3xl lg:rounded-3xl overflow-hidden animate-slide-up shadow-2xl">
        {/* Header */}
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
                    remaining === 0 ? 'text-[#D4895C]' : 'text-[#C9A961]'
                  }`}>
                    {remaining ?? '—'}
                  </span>
                  {totalGenerated ? (
                    <span className="text-[10px] text-white/30">{totalGenerated} {t('profile.generated')}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 active:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
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

          {/* Pack cards */}
          <div className="space-y-2.5">
            {CREDIT_PACKS.map((pack) => {
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

          {/* Legal links */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link to="/cgu" onClick={onClose} className="text-[10px] text-[#2C2622]/25 hover:text-[#C9A961] transition-colors">CGU</Link>
            <span className="text-[#2C2622]/15">·</span>
            <Link to="/confidentialite" onClick={onClose} className="text-[10px] text-[#2C2622]/25 hover:text-[#C9A961] transition-colors">Confidentialité</Link>
          </div>
        </div>

        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}
