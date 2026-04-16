import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, ensureSession } from '@/lib/supabase'
import { fileToBase64, delay, guessMimeType, extractEdgeFunctionError } from '@/lib/menuHelpers'
import { getCuisineProfile } from '@/constants/cuisineProfiles'
import { canonicalizeDishName } from '@/lib/normalize'
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
  enriching: boolean
  extractedItems: string[]
  error: string | null
  importFromFiles: (files: File[], restaurantId: string) => Promise<void>
  importFromUrl: (url: string, restaurantId: string) => Promise<void>
  enrichDescriptions: (cuisineProfileId: string) => Promise<void>
  updateItem: (itemId: string, updates: Partial<MenuItem>) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  reload: () => void
}

export type { MenuRow }

export function useMenus(restaurantId: string | null): UseMenusReturn {
  const [menu, setMenu] = useState<MenuRow | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [extractedItems, setExtractedItems] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const cancelledRef = useRef(false)

  useEffect(() => () => { cancelledRef.current = true }, [])

  // ── Load menu + items ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) { setLoading(false); return }
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: menuData, error: menuError } = await supabase
        .from('menus').select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle()

      if (cancelled) return
      if (menuError) { setError(menuError.message); setLoading(false); return }
      if (!menuData) { setMenu(null); setItems([]); setCategories([]); setLoading(false); return }

      setMenu(menuData as MenuRow)

      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items').select('*, generated_images(created_at, batch_id)')
        .eq('menu_id', menuData.id)
        .order('position', { ascending: true })
        .order('created_at', { foreignTable: 'generated_images', ascending: false })

      if (cancelled) return
      if (itemsError) { setError(itemsError.message); setLoading(false); return }

      const menuItems = (itemsData ?? []).map((row) => {
        const { generated_images, ...item } = row as Record<string, unknown>
        type GenImg = { created_at: string; batch_id: string | null }
        const gi = generated_images as GenImg | GenImg[] | null
        const first = Array.isArray(gi) ? gi[0] : gi
        return {
          ...item,
          generated_at: first?.created_at ?? null,
          batch_id: first?.batch_id ?? null,
        } as MenuItem
      })
      setItems(menuItems)

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

  // ── Shared: animate items + save to DB ─────────────────────────────────────
  async function processExtraction(
    aiItems: Record<string, unknown>[],
    restId: string,
    fileName: string,
    sourceType: 'photo' | 'file' | 'url',
    includeImageUrl: boolean,
  ) {
    // Animate (cancellable)
    for (const item of aiItems) {
      if (cancelledRef.current) break
      setExtractedItems((prev) => [...prev, (item.nom as string) ?? '?'])
      await delay(150)
    }

    // Create menu row
    const { data: menuRow, error: menuError } = await supabase
      .from('menus')
      .insert({ restaurant_id: restId, file_name: fileName, source_type: sourceType })
      .select('id').single()
    if (menuError) throw new Error(menuError.message)

    // Build & insert item rows
    const rows = aiItems.map((item, i) => ({
      menu_id: menuRow.id,
      nom: item.nom ?? '', categorie: item.categorie ?? '',
      description: item.description ?? '', prix: item.prix ?? '',
      style: item.style ?? '', item_type: item.item_type ?? 'plat',
      ...(includeImageUrl && item.image_url ? { image_url: item.image_url } : {}),
      tailles: item.tailles ?? [], supplements: item.supplements ?? [],
      accompagnements: item.accompagnements ?? [],
      allergenes: item.allergenes ?? [], labels: item.labels ?? [],
      position: i,
    }))

    const { error: insertError } = await supabase.from('menu_items').insert(rows)
    if (insertError) throw new Error(insertError.message)

    reload()
  }

  // ── Import from files (photos and/or PDFs) ─────────────────────────────────
  const importFromFiles = useCallback(async (files: File[], restId: string) => {
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) { setError('error.menu.fileTooLarge'); return }
      const mime = file.type || guessMimeType(file.name)
      if (!mime || !ACCEPTED_TYPES.includes(mime)) { setError('error.menu.invalidFormat'); return }
    }

    setExtracting(true); setExtractedItems([]); setError(null)
    try {
      await ensureSession()
      const fileParts = await Promise.all(files.map(async (file) => {
        const mimeType = file.type || guessMimeType(file.name)
        const base64 = await fileToBase64(file)
        return { inlineData: { data: base64, mimeType } }
      }))

      const { data, error: fnError } = await supabase.functions.invoke('extract-menu', {
        body: { fileParts },
      })

      if (fnError) throw new Error(await extractEdgeFunctionError(fnError))
      if (!data?.success) throw new Error(data?.error ?? 'error.menu.extractionFailed')

      const aiItems = data.data as Record<string, unknown>[]
      if (!aiItems?.length) throw new Error('error.menu.noItems')

      const hasPdf = files.some(f => (f.type || guessMimeType(f.name)) === 'application/pdf')
      const sourceType = files.length === 1 && !hasPdf ? 'photo' as const : 'file' as const
      const fileName = files.length === 1 ? files[0].name : `${files.length} fichiers`
      await processExtraction(aiItems, restId, fileName, sourceType, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error.menu.extractionError')
    } finally {
      setExtracting(false)
    }
  }, [reload])

  // ── Import from URL (Uber Eats, Deliveroo, etc.) ───────────────────────────
  const importFromUrl = useCallback(async (url: string, restId: string) => {
    // Validate URL scheme to prevent SSRF (javascript:, file:, data:, etc.)
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setError('error.menu.invalidUrl')
        return
      }
    } catch {
      setError('error.menu.invalidUrl')
      return
    }

    setExtracting(true); setExtractedItems([]); setError(null)
    try {
      await ensureSession()
      const { data, error: fnError } = await supabase.functions.invoke('extract-menu-from-url', {
        body: { url },
      })

      if (fnError) throw new Error(await extractEdgeFunctionError(fnError))
      if (!data?.success) throw new Error(data?.error ?? 'error.menu.extractionFailed')

      const aiItems = data.data as Record<string, unknown>[]
      if (!aiItems?.length) throw new Error('error.menu.noItems')

      await processExtraction(aiItems, restId, url, 'url', true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error.menu.extractionError')
    } finally {
      setExtracting(false)
    }
  }, [reload])

  // ── Enrich descriptions (template match + AI fallback) ─────────────────────
  const enrichDescriptions = useCallback(async (cuisineProfileId: string) => {
    if (!menu) return

    setEnriching(true)
    setError(null)
    try {
      await ensureSession()

      // Fetch fresh items from DB to avoid stale closure
      const { data: freshRows } = await supabase
        .from('menu_items').select('id, nom, categorie, description, original_description')
        .eq('menu_id', menu.id)

      const freshItems = (freshRows ?? []) as Pick<MenuItem, 'id' | 'nom' | 'categorie' | 'description' | 'original_description'>[]

      // Enrich items with empty OR sparse descriptions (< 15 words)
      const itemsToEnrich = freshItems.filter((i) => {
        if (!i.description?.trim()) return true
        return i.description.trim().split(/\s+/).length < 15
      })
      if (itemsToEnrich.length === 0) { setEnriching(false); return }

      const profile = getCuisineProfile(cuisineProfileId)
      const cuisineContext = profile ? {
        bread: profile.bread,
        serving: profile.serving,
        sauce: profile.sauce,
        ambiance: profile.ambiance,
        cultural_context: profile.cultural_context,
      } : null

      const { data, error: fnError } = await supabase.functions.invoke('enrich-descriptions', {
        body: {
          items: itemsToEnrich.map((i) => ({
            id: i.id,
            name: i.nom,
            category: i.categorie,
            description: i.description || '',
          })),
          cuisineProfileId,
          cuisineContext,
        },
      })

      if (fnError) throw new Error(fnError.message)
      if (!data?.success) throw new Error(data?.error || 'Erreur enrichissement')

      const descriptions: { itemId: string; description: string }[] = data.descriptions ?? []

      // Batch update DB — save original_description before overwriting
      for (const desc of descriptions) {
        const item = freshItems.find((i) => i.id === desc.itemId)
        const update: Record<string, string> = { description: desc.description }
        if (item && !item.original_description) {
          update.original_description = item.description || ''
        }
        await supabase.from('menu_items')
          .update(update)
          .eq('id', desc.itemId)
      }

      // Update local state with enriched descriptions
      setItems((prev) => prev.map((item) => {
        const match = descriptions.find((d) => d.itemId === item.id)
        if (!match) return item
        return {
          ...item,
          description: match.description,
          original_description: item.original_description ?? item.description ?? '',
        }
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur enrichissement')
    } finally {
      setEnriching(false)
    }
  }, [menu])

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const updateItem = useCallback(async (itemId: string, updates: Partial<MenuItem>) => {
    const { error: e } = await supabase.from('menu_items').update(updates).eq('id', itemId)
    if (e) { setError(e.message); return }
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i)))

    // Auto-learning: if user edited description, save to dish_templates
    if (updates.description) {
      const item = items.find((i) => i.id === itemId)
      if (item) {
        const canonical = canonicalizeDishName(item.nom)
        supabase.from('dish_templates').upsert({
          cuisine_profile_id: menu?.cuisine_profile ?? 'unknown',
          canonical_name: canonical,
          display_name: item.nom,
          description: updates.description,
          category: item.categorie || 'plat',
          source: 'user_validated',
        }, { onConflict: 'cuisine_profile_id,canonical_name' }).then(({ error: e }) => {
          if (e && import.meta.env.DEV) console.error('dish_templates upsert error:', e.message)
        })
      }
    }
  }, [items, menu])

  const deleteItem = useCallback(async (itemId: string) => {
    const { error: e } = await supabase.from('menu_items').delete().eq('id', itemId)
    if (e) { setError(e.message); return }
    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }, [])

  return {
    menu, items, categories, loading, extracting, enriching, extractedItems, error,
    importFromFiles, importFromUrl, enrichDescriptions, updateItem, deleteItem, reload,
  }
}
