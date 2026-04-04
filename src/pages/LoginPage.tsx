import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Loader2, Check, ArrowLeft } from 'lucide-react'

export function LoginPage() {
  const { t } = useI18n()
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === '1')
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [acceptCgu, setAcceptCgu] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (resetMode) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      setLoading(false)
      if (resetError) {
        setError(t('auth.resetError'))
      } else {
        setResetSent(true)
      }
      return
    }

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      navigate('/profil')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold font-serif text-[#C9A961]">Auguste</h1>
        <p className="text-sm text-gray-500 mt-2">
          Des photos pro pour votre carte, en 3 minutes
        </p>
      </div>

      {/* Reset sent confirmation */}
      {resetSent ? (
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#7C9A6B]/10 flex items-center justify-center">
            <Check size={24} className="text-[#7C9A6B]" />
          </div>
          <p className="text-sm font-medium text-[#2C2622]">{t('auth.resetSent')}</p>
          <p className="text-xs text-[#2C2622]/50">{t('auth.resetSentDesc')}</p>
          <button
            onClick={() => { setResetMode(false); setResetSent(false) }}
            className="text-sm text-[#C9A961] font-medium"
          >
            {t('auth.backToLogin')}
          </button>
        </div>
      ) : (
        <>
          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            {resetMode && (
              <button
                type="button"
                onClick={() => { setResetMode(false); setError(null) }}
                className="flex items-center gap-1 text-xs text-[#2C2622]/40 hover:text-[#C9A961] transition-colors"
              >
                <ArrowLeft size={14} />
                {t('auth.backToLogin')}
              </button>
            )}

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email')}
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:border-[#C9A961] outline-none bg-white transition-colors"
              />
            </div>

            {!resetMode && (
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  required
                  minLength={6}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:border-[#C9A961] outline-none bg-white transition-colors"
                />
              </div>
            )}

            {!resetMode && isSignUp && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptCgu}
                  onChange={(e) => setAcceptCgu(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#C9A961] focus:ring-[#C9A961] accent-[#C9A961]"
                />
                <span className="text-xs text-[#2C2622]/50 leading-relaxed">
                  {t('auth.acceptCgu')}{' '}
                  <a href="/cgu" target="_blank" className="text-[#C9A961] underline">{t('auth.cguLink')}</a>
                  {' '}{t('auth.andThe')}{' '}
                  <a href="/confidentialite" target="_blank" className="text-[#C9A961] underline">{t('auth.privacyLink')}</a>
                </span>
              </label>
            )}

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || (isSignUp && !resetMode && !acceptCgu)}
              className="w-full py-3.5 bg-[#C9A961] text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {resetMode
                ? t('auth.sendReset')
                : isSignUp ? t('auth.signup') : t('auth.login')}
            </button>

            {!resetMode && (
              <>
                <button
                  type="button"
                  onClick={() => { setResetMode(true); setError(null) }}
                  className="w-full text-center text-xs text-[#2C2622]/35 hover:text-[#C9A961] transition-colors"
                >
                  {t('auth.forgotPassword')}
                </button>

                <p className="text-center text-sm text-gray-500">
                  {isSignUp ? t('landing.alreadyAccount') : t('landing.noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[#C9A961] font-medium"
                  >
                    {isSignUp ? t('auth.login') : t('auth.signup')}
                  </button>
                </p>
              </>
            )}
          </form>

          {/* Back to landing */}
          <button
            onClick={() => navigate('/')}
            className="mt-8 text-xs text-gray-400 hover:text-[#C9A961] transition-colors"
          >
            &larr; {t('landing.howItWorks')}
          </button>
        </>
      )}
    </div>
  )
}
