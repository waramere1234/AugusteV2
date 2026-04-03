import { useState, useCallback } from 'react'
import { supabase, ensureSession } from '@/lib/supabase'

export interface CreditPack {
  id: 'starter' | 'popular' | 'complete'
  credits: number
  priceNum: number
  price: string
  pricePerCredit: string
  popular?: boolean
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'starter', credits: 20, priceNum: 19, price: '19€', pricePerCredit: '0,95€' },
  { id: 'popular', credits: 30, priceNum: 25, price: '25€', pricePerCredit: '0,83€', popular: true },
  { id: 'complete', credits: 50, priceNum: 35, price: '35€', pricePerCredit: '0,70€' },
]

export function useCheckout() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const VALID_PACK_IDS = CREDIT_PACKS.map((p) => p.id)

  const checkout = useCallback(async (packId: string) => {
    if (!VALID_PACK_IDS.includes(packId as CreditPack['id'])) {
      setError('Invalid pack')
      return
    }

    setLoading(packId)
    setError(null)

    try {
      await ensureSession()

      const successUrl = `${window.location.origin}/profil?payment=success&pack=${encodeURIComponent(packId)}`
      const cancelUrl = `${window.location.origin}/profil?payment=cancelled`

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { packId, successUrl, cancelUrl },
      })

      if (fnError) throw new Error(fnError.message)
      if (!data?.url) throw new Error('URL de paiement manquante')

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de paiement')
      setLoading(null)
    }
  }, [])

  return { checkout, loading, error, clearError: () => setError(null) }
}
