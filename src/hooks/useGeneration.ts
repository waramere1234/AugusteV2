import { useState, useCallback } from 'react'
import { supabase, ensureSession } from '@/lib/supabase'
import type { MenuItem, Restaurant } from '@/types'

export interface GenerationJob {
  itemId: string
  itemName: string
  status: 'pending' | 'generating' | 'done' | 'error'
  imageUrl?: string
  error?: string
}

interface UseGenerationReturn {
  jobs: GenerationJob[]
  generating: boolean
  progress: { done: number; total: number }
  generateBatch: (items: MenuItem[], restaurant: Restaurant) => Promise<void>
  regenerateOne: (item: MenuItem, restaurant: Restaurant, instructions?: string) => Promise<string | null>
}

export function useGeneration(): UseGenerationReturn {
  const [jobs, setJobs] = useState<GenerationJob[]>([])
  const [generating, setGenerating] = useState(false)

  const doneCount = jobs.filter((j) => j.status === 'done').length
  const progress = { done: doneCount, total: jobs.length }

  // Generate photos for a batch of items, one at a time
  const generateBatch = useCallback(async (items: MenuItem[], restaurant: Restaurant) => {
    if (items.length === 0) return

    // Initialize jobs
    const initialJobs: GenerationJob[] = items.map((item) => ({
      itemId: item.id,
      itemName: item.nom,
      status: 'pending',
    }))
    setJobs(initialJobs)
    setGenerating(true)

    await ensureSession()

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      // Mark as generating
      setJobs((prev) =>
        prev.map((j, idx) => (idx === i ? { ...j, status: 'generating' } : j)),
      )

      try {
        const { data, error } = await supabase.functions.invoke('generate-dish-photo', {
          body: {
            itemId: item.id,
            name: item.nom,
            category: item.categorie,
            description: item.description,
            cuisineProfile: restaurant.cuisine_profile_id,
            cuisineTypes: restaurant.cuisine_types,
            restaurantId: restaurant.id,
          },
        })

        if (error) throw new Error(error.message)

        const imageUrl = data?.imageUrl ?? data?.image_url ?? data?.url
        setJobs((prev) =>
          prev.map((j, idx) =>
            idx === i ? { ...j, status: 'done', imageUrl } : j,
          ),
        )
      } catch (err) {
        setJobs((prev) =>
          prev.map((j, idx) =>
            idx === i
              ? { ...j, status: 'error', error: err instanceof Error ? err.message : 'Erreur' }
              : j,
          ),
        )
      }
    }

    setGenerating(false)
  }, [])

  // Regenerate a single item's photo
  const regenerateOne = useCallback(async (
    item: MenuItem,
    restaurant: Restaurant,
    instructions?: string,
  ): Promise<string | null> => {
    try {
      await ensureSession()
      const { data, error } = await supabase.functions.invoke('generate-dish-photo', {
        body: {
          itemId: item.id,
          name: item.nom,
          category: item.categorie,
          description: item.description,
          cuisineProfile: restaurant.cuisine_profile_id,
          cuisineTypes: restaurant.cuisine_types,
          restaurantId: restaurant.id,
          userInstructions: instructions,
        },
      })

      if (error) throw new Error(error.message)
      return data?.imageUrl ?? data?.image_url ?? data?.url ?? null
    } catch {
      return null
    }
  }, [])

  return { jobs, generating, progress, generateBatch, regenerateOne }
}
