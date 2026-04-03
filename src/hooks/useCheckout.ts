import { useState, useCallback } from 'react'
import { supabase, ensureSession } from '@/lib/supabase'

export interface CreditPack {
  id: 'starter' | 'popular' | 'complete'
  credits: number
  price: string
  label: string
  popular?: boolean
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'starter', credits: 20, price: '19€', label: 'Petit Menu' },
  { id: 'popular', credits: 30, price: '25€', label: 'Menu Complet', popular: true },
  { id: 'complete', credits: 50, price: '35€', label: 'Grande Carte' },
]

export function useCheckout() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkout = useCallback(async (packId: string) => {
    setLoading(packId)
    setError(null)

    try {
      await ensureSession()

      const successUrl = `${window.location.origin}/profil?payment=success&pack=${packId}`
      const cancelUrl = `${window.location.origin}/profil?payment=cancelled`

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { packId, successUrl, cancelUrl },
      })

      if (fnError) throw new Error(fnError.message)
      if (!data?.url) throw new Error('URL de paiement manquante')

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de paiement')
      setLoading(null)
    }
  }, [])

  return { checkout, loading, error, clearError: () => setError(null) }
}
