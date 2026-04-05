import { useState, useCallback } from 'react'
import { supabase, ensureSession } from '@/lib/supabase'
import type { MenuItem, Restaurant } from '@/types'

export interface GenerationJob {
  itemId: string
  itemName: string
  type: 'generate' | 'enhance'
  status: 'pending' | 'generating' | 'done' | 'error'
  imageUrl?: string
  error?: string
}

export type GenerationModel = 'openai' | 'google'

const EDGE_FUNCTIONS: Record<GenerationModel, string> = {
  openai: 'generate-dish-photo',
  google: 'generate-dish-photo-google',
}

interface UseGenerationReturn {
  jobs: GenerationJob[]
  generating: boolean
  progress: { done: number; total: number }
  insufficientCredits: boolean
  clearInsufficientCredits: () => void
  generateBatch: (items: MenuItem[], restaurant: Restaurant, model?: GenerationModel) => Promise<void>
  regenerateOne: (item: MenuItem, restaurant: Restaurant, instructions?: string, model?: GenerationModel) => Promise<string | null>
  enhanceOne: (item: MenuItem, restaurant: Restaurant, sourceImageUrl: string) => Promise<string | null>
}

/** Map a MenuItem + Restaurant into the dish shape the Edge Function expects */
function buildDish(
  item: MenuItem,
  restaurant: Restaurant,
  options?: { instructions?: string; sourceImageUrl?: string; isEnhance?: boolean },
) {
  const googlePhotoUrls = restaurant.google_business_data?.photo_urls?.slice(0, 2) ?? []
  return {
    id: item.id,
    name: item.nom,
    category: item.categorie,
    description: item.description,
    style: item.style,
    cuisineProfile: restaurant.cuisine_profile_id,
    cuisineTypes: restaurant.cuisine_types,
    userInstructions: options?.instructions,
    sourceImageUrl: options?.sourceImageUrl,
    isEnhance: options?.isEnhance,
    restaurantCoverUrl: restaurant.style_photo_url || undefined,
    restaurantStyleDescription: restaurant.style_description || undefined,
    googlePhotoUrls: googlePhotoUrls.length > 0 ? googlePhotoUrls : undefined,
    dishReferenceUrl: restaurant.dish_reference_url || undefined,
  }
}

/** Get the current user's ID from Supabase Auth (ensures valid session first) */
async function getUserId(): Promise<string> {
  await ensureSession()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

/**
 * Persist a generated image: upload to Storage → update menu_items → insert generated_images.
 * Storage RLS requires path: {userId}/filename — so we prefix with the authenticated user's ID.
 * Returns the public Storage URL.
 */
async function persistImage(itemId: string, dataUri: string, userId: string, imageSource: 'generated' | 'enhanced' = 'generated', provider?: GenerationModel): Promise<string> {
  // Convert data URI to Blob
  const res = await fetch(dataUri)
  const blob = await res.blob()

  // Determine extension from MIME
  const ext = blob.type === 'image/png' ? 'png' : 'webp'
  const filePath = `${userId}/${itemId}_${Date.now()}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(filePath, blob, { contentType: blob.type, upsert: true })
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('menu-images')
    .getPublicUrl(filePath)

  // Update menu_items row
  const { error: updateError } = await supabase
    .from('menu_items')
    .update({ image_url: publicUrl, image_source: imageSource })
    .eq('id', itemId)
  if (updateError && import.meta.env.DEV) console.error('menu_items update error:', updateError.message)

  // Insert into generated_images
  const { error: insertError } = await supabase
    .from('generated_images')
    .insert({ menu_item_id: itemId, image_url: publicUrl, generation_provider: provider ?? null })
  if (insertError && import.meta.env.DEV) console.error('generated_images insert error:', insertError.message)

  return publicUrl
}

export function useGeneration(): UseGenerationReturn {
  const [jobs, setJobs] = useState<GenerationJob[]>([])
  const [generating, setGenerating] = useState(false)
  const [insufficientCredits, setInsufficientCredits] = useState(false)

  const doneCount = jobs.filter((j) => j.status === 'done').length
  const progress = { done: doneCount, total: jobs.length }

  // Generate photos for a batch of items — handles both fresh generation and enhance (user photos)
  const generateBatch = useCallback(async (items: MenuItem[], restaurant: Restaurant, model: GenerationModel = 'openai') => {
    if (items.length === 0) return

    const initialJobs: GenerationJob[] = items.map((item) => ({
      itemId: item.id,
      itemName: item.nom,
      type: (item.image_source === 'user' && item.image_url) ? 'enhance' : 'generate',
      status: 'pending',
    }))
    setJobs(initialJobs)
    setGenerating(true)

    try {
      await ensureSession()
      const userId = await getUserId()

      // Mark all as generating
      setJobs((prev) => prev.map((j) => ({ ...j, status: 'generating' })))

      // Build dishes — user photos get isEnhance + sourceImageUrl flags
      const dishes = items.map((item) => {
        const isUserPhoto = item.image_source === 'user' && item.image_url
        return buildDish(item, restaurant, isUserPhoto
          ? { sourceImageUrl: item.image_url, isEnhance: true }
          : {},
        )
      })

      const fnName = EDGE_FUNCTIONS[model]
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          dishes,
          restaurantType: restaurant.cuisine_profile_id,
        },
      })

      if (error) {
        // Extract real error message from Edge Function response
        let msg = error.message
        let status: number | undefined
        try {
          const ctx = error.context as Response | undefined
          status = ctx?.status
          if (ctx?.json) {
            const body = await ctx.json()
            msg = body?.error || body?.message || msg
          }
        } catch { /* not parseable */ }
        if (status === 402) setInsufficientCredits(true)
        if (import.meta.env.DEV) console.error('generate-dish-photo error:', msg)
        throw new Error(msg)
      }
      if (!data?.success) throw new Error(data?.error || 'Erreur de génération')

      const images: { dishId: string; imageUrl: string | null; error?: string }[] = data.images ?? []

      // Persist each image: upload to Storage + update DB
      for (const img of images) {
        // Skip failed enhance results — keep user photo untouched
        if (!img.imageUrl || img.error) {
          setJobs((prev) =>
            prev.map((j) =>
              j.itemId === img.dishId
                ? { ...j, status: 'error', error: img.error === 'enhance_source_unavailable'
                    ? 'Photo source inaccessible'
                    : img.error || 'Pas d\'image retournée' }
                : j,
            ),
          )
          continue
        }

        try {
          const job = initialJobs.find((j) => j.itemId === img.dishId)
          const source = job?.type === 'enhance' ? 'enhanced' as const : 'generated' as const
          // Enhance always uses OpenAI regardless of toggle
          const provider = source === 'enhanced' ? 'openai' as const : model
          const storageUrl = img.imageUrl.startsWith('data:')
            ? await persistImage(img.dishId, img.imageUrl, userId, source, provider)
            : img.imageUrl

          setJobs((prev) =>
            prev.map((j) =>
              j.itemId === img.dishId
                ? { ...j, status: 'done', imageUrl: storageUrl }
                : j,
            ),
          )
        } catch (err) {
          setJobs((prev) =>
            prev.map((j) =>
              j.itemId === img.dishId
                ? { ...j, status: 'error', error: err instanceof Error ? err.message : 'Upload échoué' }
                : j,
            ),
          )
        }
      }

      // Mark any items that didn't get an image as error
      setJobs((prev) =>
        prev.map((j) =>
          j.status === 'generating'
            ? { ...j, status: 'error', error: 'Pas d\'image retournée' }
            : j,
        ),
      )
    } catch (err) {
      setJobs((prev) =>
        prev.map((j) =>
          j.status !== 'done'
            ? { ...j, status: 'error', error: err instanceof Error ? err.message : 'Erreur' }
            : j,
        ),
      )
    }

    setGenerating(false)
  }, [])

  // Regenerate a single item's photo
  const regenerateOne = useCallback(async (
    item: MenuItem,
    restaurant: Restaurant,
    instructions?: string,
    model: GenerationModel = 'openai',
  ): Promise<string | null> => {
    try {
      await ensureSession()
      const userId = await getUserId()

      const fnName = EDGE_FUNCTIONS[model]
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          dishes: [buildDish(item, restaurant, { instructions })],
          restaurantType: restaurant.cuisine_profile_id,
        },
      })

      if (error) {
        const ctx = error.context as Response | undefined
        if (ctx?.status === 402) setInsufficientCredits(true)
        throw new Error(error.message)
      }
      if (!data?.success) return null

      const images: { dishId: string; imageUrl: string }[] = data.images ?? []
      const rawUrl = images[0]?.imageUrl
      if (!rawUrl) return null

      // Persist: upload to Storage + update DB
      return rawUrl.startsWith('data:')
        ? await persistImage(item.id, rawUrl, userId, 'generated', model)
        : rawUrl
    } catch {
      return null
    }
  }, [])

  // Enhance a single item using the user's uploaded photo URL as reference
  const enhanceOne = useCallback(async (
    item: MenuItem,
    restaurant: Restaurant,
    sourceImageUrl: string,
  ): Promise<string | null> => {
    await ensureSession()
    const userId = await getUserId()

    const { data, error } = await supabase.functions.invoke('generate-dish-photo', {
      body: {
        dishes: [buildDish(item, restaurant, {
          sourceImageUrl,
          isEnhance: true,
        })],
        restaurantType: restaurant.cuisine_profile_id,
      },
    })

    if (error) {
      const ctx = error.context as Response | undefined
      if (ctx?.status === 402) setInsufficientCredits(true)
      throw new Error(error.message)
    }
    if (!data?.success) throw new Error(data?.error || 'Enhance échoué')

    const images: { dishId: string; imageUrl: string }[] = data.images ?? []
    const rawUrl = images[0]?.imageUrl
    if (!rawUrl) throw new Error('Pas d\'image retournée')

    return rawUrl.startsWith('data:')
      ? await persistImage(item.id, rawUrl, userId, 'enhanced', 'openai')
      : rawUrl
  }, [])

  return {
    jobs, generating, progress,
    insufficientCredits, clearInsufficientCredits: () => setInsufficientCredits(false),
    generateBatch, regenerateOne, enhanceOne,
  }
}
