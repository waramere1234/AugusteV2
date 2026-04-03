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
  analyzingStyle: boolean
  error: string | null
  clearError: () => void
  updateField: <K extends keyof Restaurant>(key: K, value: Restaurant[K]) => void
  searchGoogle: (query: string) => Promise<GoogleSearchResult[]>
  applyGoogleData: (placeId: string) => Promise<void>
  uploadPhoto: (file: File) => Promise<string | null>
  selectStylePhoto: (url: string) => void
}

export function useRestaurant(): UseRestaurantReturn {
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzingStyle, setAnalyzingStyle] = useState(false)
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

  // Analyze restaurant style from a single photo (non-blocking, background)
  const analyzeStyleFromPhoto = useCallback(async (photoUrl: string, restaurantId: string) => {
    setAnalyzingStyle(true)
    try {
      await ensureSession()
      const { data, error: fnError } = await supabase.functions.invoke('analyze-style', {
        body: { restaurantPhotoUrl: photoUrl },
      })
      if (fnError || !data?.styleDescription) return

      const styleDescription = data.styleDescription as string
      await supabase
        .from('restaurants')
        .update({ style_description: styleDescription })
        .eq('id', restaurantId)

      setRestaurant((prev) => prev ? { ...prev, style_description: styleDescription } : prev)
    } catch {
      // Style analysis is non-critical — fail silently
    } finally {
      setAnalyzingStyle(false)
    }
  }, [])

  // Select a photo (Google or any URL) as the restaurant's style reference
  const selectStylePhoto = useCallback((url: string) => {
    if (!restaurant) return
    updateField('style_photo_url', url)
    analyzeStyleFromPhoto(url, restaurant.id)
  }, [restaurant, updateField, analyzeStyleFromPhoto])

  // Apply Google details to the restaurant — saves IMMEDIATELY (not debounced)
  // because this is a deliberate user action and must persist before navigation
  const applyGoogleData = useCallback(async (placeId: string) => {
    if (!restaurant) return
    try {
      await ensureSession()
      const { data, error: fnError } = await supabase.functions.invoke('get-restaurant-details', {
        body: { placeId },
      })
      if (fnError || !data?.success) {
        setError(data?.error ?? 'error.google.details')
        return
      }

      // Edge function returns { success, restaurant: {...} }
      const gData = data.restaurant as GoogleBusinessData
      const updated: Restaurant = {
        ...restaurant,
        name: gData.name || restaurant.name,
        address: gData.address || restaurant.address,
        phone: gData.phone || restaurant.phone,
        description: gData.description || restaurant.description,
        google_place_id: gData.place_id,
        google_business_data: gData,
        cuisine_types: gData.cuisine_types?.length ? gData.cuisine_types : restaurant.cuisine_types,
        cuisine_profile_id: gData.detected_cuisine_profile || restaurant.cuisine_profile_id,
      }
      setRestaurant(updated)

      // Immediate save — no debounce
      setSaving(true)
      const { error: saveError } = await supabase
        .from('restaurants')
        .update({
          name: updated.name,
          address: updated.address,
          phone: updated.phone,
          description: updated.description,
          google_place_id: updated.google_place_id,
          google_business_data: updated.google_business_data as unknown as Record<string, unknown>,
          cuisine_types: updated.cuisine_types,
          cuisine_profile_id: updated.cuisine_profile_id,
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
    } catch {
      setError('error.google.search')
    }
  }, [restaurant])

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
    selectStylePhoto(publicUrl)
    return publicUrl
  }, [restaurant, selectStylePhoto])

  return {
    restaurant,
    loading,
    saving,
    saved,
    analyzingStyle,
    error,
    clearError,
    updateField,
    searchGoogle,
    applyGoogleData,
    uploadPhoto,
    selectStylePhoto,
  }
}
