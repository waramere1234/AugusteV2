import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, ensureSession } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import type { Restaurant, GoogleBusinessData } from '@/types'

export interface GoogleSearchResult {
  place_id: string
  name: string
  address: string
  rating: number | null
}

interface UseRestaurantReturn {
  restaurant: Restaurant | null
  loading: boolean
  saving: boolean
  saved: boolean
  error: string | null
  clearError: () => void
  updateField: <K extends keyof Restaurant>(key: K, value: Restaurant[K]) => void
  searchGoogle: (query: string) => Promise<GoogleSearchResult[]>
  applyGoogleData: (placeId: string) => Promise<void>
  uploadPhoto: (file: File) => Promise<string | null>
}

export function useRestaurant(): UseRestaurantReturn {
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timers on unmount to prevent state updates after unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // Load or create restaurant on mount
  useEffect(() => {
    if (!user) {
      setRestaurant(null)
      setLoading(false)
      return
    }
    let cancelled = false

    async function loadOrCreate() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user!.id)
          .limit(1)
          .maybeSingle()

        if (cancelled) return
        if (fetchError) throw fetchError

        if (data) {
          setRestaurant(data as Restaurant)
        } else {
          const { data: created, error: createError } = await supabase
            .from('restaurants')
            .insert({ owner_id: user!.id, name: '' })
            .select()
            .single()

          if (cancelled) return
          if (createError) throw createError
          setRestaurant(created as Restaurant)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'error.unknown')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOrCreate()
    return () => { cancelled = true }
  }, [user])

  // Debounced save to DB
  const saveToDb = useCallback((updated: Restaurant) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      const { error: saveError } = await supabase
        .from('restaurants')
        .update({
          name: updated.name,
          cuisine_profile_id: updated.cuisine_profile_id,
          cuisine_types: updated.cuisine_types,
          address: updated.address,
          phone: updated.phone,
          description: updated.description,
          style_photo_url: updated.style_photo_url,
          dish_reference_url: updated.dish_reference_url,
          hero_photo_url: updated.hero_photo_url,
          google_place_id: updated.google_place_id,
          google_business_data: updated.google_business_data as Record<string, unknown> | null,
          presentation_style_id: updated.presentation_style_id,
          style_description: updated.style_description,
          logo_url: updated.logo_url,
        })
        .eq('id', updated.id)
      setSaving(false)
      if (saveError) {
        setError(saveError.message)
      } else {
        setSaved(true)
        if (savedTimer.current) clearTimeout(savedTimer.current)
        savedTimer.current = setTimeout(() => setSaved(false), 1500)
      }
    }, 800)
  }, [])

  // Update a single field optimistically + debounced save
  const updateField = useCallback(
    <K extends keyof Restaurant>(key: K, value: Restaurant[K]) => {
      setRestaurant((prev) => {
        if (!prev) return prev
        const updated = { ...prev, [key]: value }
        saveToDb(updated)
        return updated
      })
    },
    [saveToDb],
  )

  // Search Google Business
  const searchGoogle = useCallback(async (query: string): Promise<GoogleSearchResult[]> => {
    if (!query.trim()) return []
    try {
      await ensureSession()
      const { data, error: fnError } = await supabase.functions.invoke('search-restaurant', {
        body: { query },
      })
      if (fnError || !data) return []
      return (data.results ?? data) as GoogleSearchResult[]
    } catch {
      return []
    }
  }, [])

  // Apply Google details to the restaurant
  const applyGoogleData = useCallback(async (placeId: string) => {
    if (!restaurant) return
    try {
      await ensureSession()
      const { data, error: fnError } = await supabase.functions.invoke('get-restaurant-details', {
        body: { placeId },
      })
      if (fnError || !data) {
        setError('error.google.details')
        return
      }

      const gData = data as GoogleBusinessData
      setRestaurant((prev) => {
        if (!prev) return prev
        const updated: Restaurant = {
          ...prev,
          name: gData.name || prev.name,
          address: gData.address || prev.address,
          phone: gData.phone || prev.phone,
          description: gData.description || prev.description,
          google_place_id: gData.place_id,
          google_business_data: gData,
          cuisine_types: gData.cuisine_types?.length ? gData.cuisine_types : prev.cuisine_types,
          cuisine_profile_id: gData.detected_cuisine_profile || prev.cuisine_profile_id,
        }
        saveToDb(updated)
        return updated
      })
    } catch {
      setError('error.google.search')
    }
  }, [restaurant, saveToDb])

  // Upload photo to Supabase Storage
  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    if (!restaurant) return null

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `restaurants/${restaurant.id}/photo_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('restaurant-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('restaurant-photos')
      .getPublicUrl(path)

    const publicUrl = urlData.publicUrl
    updateField('style_photo_url', publicUrl)
    return publicUrl
  }, [restaurant, updateField])

  return {
    restaurant,
    loading,
    saving,
    saved,
    error,
    clearError,
    updateField,
    searchGoogle,
    applyGoogleData,
    uploadPhoto,
  }
}
