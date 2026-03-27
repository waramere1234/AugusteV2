import { useEffect, useState, useCallback } from 'react'
import { supabase, ensureSession } from '@/lib/supabase'
import type { MenuItem } from '@/types'

interface MenuRow {
  id: string
  restaurant_id: string | null
  file_name: string | null
  cuisine_profile: string | null
  category_order: string[] | null
  created_at: string
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

interface UseMenusReturn {
  menu: MenuRow | null
  items: MenuItem[]
  categories: string[]
  loading: boolean
  extracting: boolean
  extractedItems: string[]
  error: string | null
  importFromFile: (file: File, restaurantId: string) => Promise<void>
  importFromUrl: (url: string, restaurantId: string) => Promise<void>
  updateItem: (itemId: string, updates: Partial<MenuItem>) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  reload: () => void
}

export function useMenus(restaurantId: string | null): UseMenusReturn {
  const [menu, setMenu] = useState<MenuRow | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [extractedItems, setExtractedItems] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Load the latest menu + items for this restaurant
  useEffect(() => {
    if (!restaurantId) {
      setLoading(false)
      return
    }
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      // Get the most recent menu for this restaurant
      const { data: menuData, error: menuError } = await supabase
        .from('menus')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      if (menuError) {
        setError(menuError.message)
        setLoading(false)
        return
      }

      if (!menuData) {
        setMenu(null)
        setItems([])
        setCategories([])
        setLoading(false)
        return
      }

      setMenu(menuData as MenuRow)

      // Load items for this menu
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menuData.id)
        .order('position', { ascending: true })

      if (cancelled) return
      if (itemsError) {
        setError(itemsError.message)
        setLoading(false)
        return
      }

      const menuItems = (itemsData ?? []) as MenuItem[]
      setItems(menuItems)

      // Build category list, respecting category_order if set
      const order = menuData.category_order as string[] | null
      const allCats = [...new Set(menuItems.map((i) => i.categorie).filter(Boolean))]
      if (order?.length) {
        const ordered = order.filter((c) => allCats.includes(c))
        const remaining = allCats.filter((c) => !order.includes(c))
        setCategories([...ordered, ...remaining])
      } else {
        setCategories(allCats)
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [restaurantId, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  // Import from file (photo or PDF)
  const importFromFile = useCallback(async (file: File, restId: string) => {
    // Validate file before sending
    if (file.size > MAX_FILE_SIZE) {
      setError(`Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)} Mo). Maximum : 20 Mo.`)
      return
    }

    const mimeType = file.type || guessMimeType(file.name)
    if (!mimeType || !ACCEPTED_TYPES.includes(mimeType)) {
      setError('Format non supporté. Utilisez une image (JPG, PNG, WebP) ou un PDF.')
      return
    }

    setExtracting(true)
    setExtractedItems([])
    setError(null)

    try {
      await ensureSession()

      // Convert file to base64
      const base64 = await fileToBase64(file)

      const { data, error: fnError } = await supabase.functions.invoke('extract-menu', {
        body: {
          fileParts: [{ data: base64, mimeType }],
          fileName: file.name,
          restaurantId: restId,
        },
      })

      if (fnError) {
        const message = await extractEdgeFunctionError(fnError)
        throw new Error(message)
      }

      if (!data) throw new Error('Aucune donnée retournée par le serveur')

      // Animate extracted items
      const extractedNames: string[] = (data.items ?? data.menuItems ?? []).map(
        (i: { nom?: string; name?: string }) => i.nom ?? i.name ?? '?',
      )
      for (const name of extractedNames) {
        setExtractedItems((prev) => [...prev, name])
        await delay(150)
      }

      // Reload data from DB
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur extraction')
    } finally {
      setExtracting(false)
    }
  }, [reload])

  // Import from URL (Uber Eats, Deliveroo, etc.)
  const importFromUrl = useCallback(async (url: string, restId: string) => {
    setExtracting(true)
    setExtractedItems([])
    setError(null)

    try {
      await ensureSession()

      const { data, error: fnError } = await supabase.functions.invoke('extract-menu-from-url', {
        body: { url, restaurantId: restId },
      })

      if (fnError) {
        const message = await extractEdgeFunctionError(fnError)
        throw new Error(message)
      }

      if (!data) throw new Error('Aucune donnée retournée par le serveur')

      const extractedNames: string[] = (data.items ?? data.menuItems ?? []).map(
        (i: { nom?: string; name?: string }) => i.nom ?? i.name ?? '?',
      )
      for (const name of extractedNames) {
        setExtractedItems((prev) => [...prev, name])
        await delay(150)
      }

      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur extraction URL')
    } finally {
      setExtracting(false)
    }
  }, [reload])

  // Update a single menu item
  const updateItem = useCallback(async (itemId: string, updates: Partial<MenuItem>) => {
    const { error: updateError } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', itemId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
    )
  }, [])

  // Delete a menu item
  const deleteItem = useCallback(async (itemId: string) => {
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }, [])

  return {
    menu,
    items,
    categories,
    loading,
    extracting,
    extractedItems,
    error,
    importFromFile,
    importFromUrl,
    updateItem,
    deleteItem,
    reload,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:xxx;base64, prefix
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function guessMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', heic: 'image/heic', pdf: 'application/pdf',
  }
  return map[ext ?? ''] ?? ''
}

async function extractEdgeFunctionError(
  fnError: { message?: string; context?: unknown },
): Promise<string> {
  const ctx = fnError.context
  if (ctx && typeof ctx === 'object') {
    // context may be a Response (needs .json())
    if ('json' in ctx && typeof (ctx as Response).json === 'function') {
      try {
        const body = await (ctx as Response).json()
        if (typeof body.error === 'string') return body.error
        if (typeof body.message === 'string') return body.message
      } catch { /* not parseable */ }
    }
    // context may already be parsed JSON
    const obj = ctx as Record<string, unknown>
    if (typeof obj.error === 'string') return obj.error
    if (typeof obj.message === 'string') return obj.message
  }
  return fnError.message || 'Extraction échouée'
}
