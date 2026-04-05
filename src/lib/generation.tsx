import { createContext, useContext, type ReactNode } from 'react'
import { useGeneration } from '@/hooks/useGeneration'
import type { GenerationJob } from '@/hooks/useGeneration'
import type { MenuItem, Restaurant } from '@/types'

interface GenerationContextValue {
  jobs: GenerationJob[]
  generating: boolean
  progress: { done: number; total: number }
  insufficientCredits: boolean
  clearInsufficientCredits: () => void
  generateBatch: (items: MenuItem[], restaurant: Restaurant) => Promise<void>
  regenerateOne: (item: MenuItem, restaurant: Restaurant, instructions?: string) => Promise<string | null>
  enhanceOne: (item: MenuItem, restaurant: Restaurant, sourceImageUrl: string) => Promise<string | null>
}

const GenerationContext = createContext<GenerationContextValue | null>(null)

export function GenerationProvider({ children }: { children: ReactNode }) {
  const generation = useGeneration()
  return (
    <GenerationContext.Provider value={generation}>
      {children}
    </GenerationContext.Provider>
  )
}

export function useGenerationContext(): GenerationContextValue {
  const ctx = useContext(GenerationContext)
  if (!ctx) throw new Error('useGenerationContext must be used within GenerationProvider')
  return ctx
}
