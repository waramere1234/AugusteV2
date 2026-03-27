import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

export function LoginPage() {
  const { t } = useI18n()
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

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

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
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

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#C9A961] text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading ? t('common.loading') : isSignUp ? t('auth.signup') : t('auth.login')}
        </button>

        <p className="text-center text-sm text-gray-500">
          {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#C9A961] font-medium"
          >
            {isSignUp ? t('auth.login') : t('auth.signup')}
          </button>
        </p>
      </form>
    </div>
  )
}
