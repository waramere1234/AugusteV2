import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_remaining, total_generated')
        .eq('user_id', user!.id)
        .maybeSingle()

      if (cancelled) return

      if (error || !data) {
        setCredits({ remaining: 0, totalGenerated: 0 })
      } else {
        setCredits({
          remaining: data.credits_remaining,
          totalGenerated: data.total_generated,
        })
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [user])

  return { credits, loading }
}
