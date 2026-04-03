import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface Credits {
  remaining: number
  totalGenerated: number
}

export function useCredits() {
  const { user } = useAuth()
  const [credits, setCredits] = useState<Credits | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits_remaining, total_generated')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) {
      setCredits({ remaining: 0, totalGenerated: 0 })
    } else {
      setCredits({
        remaining: data.credits_remaining,
        totalGenerated: data.total_generated,
      })
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  return { credits, loading, reload: load }
}
