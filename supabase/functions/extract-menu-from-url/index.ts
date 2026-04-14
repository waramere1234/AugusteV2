import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

// ── Rate limiting ──────────────────────────────────────────────────────────────
async function checkRateLimit(userId: string, supabaseUrl: string, supabaseKey: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/check_and_increment_usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      p_user_id: userId,
      p_action_type: 'menu_extraction',
      p_limit: 20,
    }),
  })
  if (!response.ok) {
    console.error('Rate limit check failed:', response.status)
    return { allowed: false, current_count: 0, limit: 20, remaining: 0 }
  }
  return await response.json()
}

// ── Uber Eats: decode slug → UUID ──────────────────────────────────────────────
// Uber Eats store URLs end with a base64url-encoded slug like "hm-uayvZXOi09GmadmyLlw"
// which decodes to 16 raw bytes = a UUID.
function decodeUberSlug(slug: string): string {
  // base64url → standard base64
  let b64 = slug.replace(/-/g, '+').replace(/_/g, '/')
  // pad to multiple of 4
  while (b64.length % 4 !== 0) b64 += '='

  const raw = atob(b64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)

  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  // Format as UUID: 8-4-4-4-12
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

// ── Uber Eats: fetch menu via internal API ─────────────────────────────────────
async function fetchUberEatsMenu(url: string) {
  // Extract slug from URL: /store/restaurant-name/SLUG or /fr/store/restaurant-name/SLUG
  const match = url.match(/\/store\/[^/]+\/([A-Za-z0-9_-]+)/)
  if (!match) throw new Error('URL Uber Eats invalide — slug introuvable')

  const slug = match[1]
  const storeUuid = decodeUberSlug(slug)
  console.log(`🔍 Uber Eats slug "${slug}" → UUID "${storeUuid}"`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(
      `https://www.ubereats.com/api/getStoreV1?storeUuid=${storeUuid}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'x-csrf-token': 'x',
        },
        body: JSON.stringify({ storeUuid, sfNuggetCount: 0 }),
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error(`❌ Uber Eats API ${response.status}:`, text.slice(0, 300))
      throw new Error(`Uber Eats API erreur ${response.status}`)
    }

    const json = await response.json()
    const data = json.data
    if (!data) throw new Error('Uber Eats: réponse vide (pas de data)')

    const restaurantName = data.title ?? ''
    const heroImage = data.heroImageUrls?.[0]?.url ?? ''
    console.log(`✅ Uber Eats store: "${restaurantName}", hero: ${heroImage ? 'yes' : 'no'}`)

    // Parse catalogSectionsMap → flat list of items
    const items: Record<string, unknown>[] = []
    const sectionsMap = data.catalogSectionsMap

    if (!sectionsMap || typeof sectionsMap !== 'object') {
      throw new Error('Uber Eats: catalogSectionsMap absent ou vide')
    }

    for (const sectionId of Object.keys(sectionsMap)) {
      const categories = sectionsMap[sectionId]
      if (!Array.isArray(categories)) continue

      for (const category of categories) {
        const categoryTitle: string = category.payload?.standardItemsPayload?.title?.text
          ?? category.title ?? 'Sans catégorie'

        const catalogItems = category.payload?.standardItemsPayload?.catalogItems ?? []

        for (const item of catalogItems) {
          const priceCents = item.price ?? 0
          const priceEur = (priceCents / 100).toFixed(2)

          items.push({
            nom: item.title ?? '',
            categorie: categoryTitle,
            description: item.itemDescription ?? '',
            prix: priceEur,
            imageUrl: item.imageUrl ?? '',
            style: '',
            item_type: 'plat',
            item_profile: 'personnalisable',
            tailles: [],
            supplements: [],
            accompagnements: [],
            allergenes: [],
            labels: [],
          })
        }
      }
    }

    console.log(`✅ Parsed ${items.length} items from Uber Eats`)
    return { items, restaurantName, heroImage }
  } finally {
    clearTimeout(timeout)
  }
}

// ── Deliveroo: fetch menu via __NEXT_DATA__ (initialState.menuPage) ─────────────
async function fetchDeliverooMenu(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(`Deliveroo HTTP ${response.status}`)

    const html = await response.text()
    const match = html.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/)
    if (!match) throw new Error('Deliveroo: __NEXT_DATA__ introuvable')

    const nextData = JSON.parse(match[1])

    // Deliveroo 2025+: data lives in initialState.menuPage.menu (not pageProps)
    const menuState = nextData?.props?.initialState?.menuPage?.menu
    if (!menuState) throw new Error('Deliveroo: menuPage.menu introuvable — structure page changée')

    const restaurantName: string = menuState.header?.title ?? ''
    console.log(`🔍 Deliveroo store: "${restaurantName}"`)

    // Build categoryId → name map from layoutGroups
    const catMap: Record<string, string> = {}
    const layoutGroups = menuState.layoutGroups ?? []
    for (const group of layoutGroups) {
      for (const layout of group.layouts ?? []) {
        if (layout.header && layout.key) {
          catMap[layout.key] = layout.header
        }
      }
    }

    // Items with name, description, price, categoryId, image
    const rawItems = menuState.metas?.root?.items ?? []
    if (rawItems.length === 0) throw new Error('Deliveroo: aucun item trouvé dans metas.root.items')

    const items: Record<string, unknown>[] = []

    for (const item of rawItems) {
      // Skip unavailable items
      if (item.available === false) continue

      // Price: { code: "EUR", fractional: 1550, formatted: "15,50 €" }
      const priceFractional = item.price?.fractional ?? 0
      const priceEur = (priceFractional / 100).toFixed(2)

      // Image URL — replace {w} and {h} placeholders with reasonable values
      let imageUrl = item.image?.url ?? ''
      if (imageUrl) {
        imageUrl = imageUrl.replace('{w}', '640').replace('{h}', '640')
      }

      const categoryName = catMap[item.categoryId] ?? 'Sans catégorie'

      items.push({
        nom: item.name ?? '',
        categorie: categoryName,
        description: item.description ?? '',
        prix: priceEur,
        imageUrl,
        style: '',
        item_type: 'plat',
        item_profile: 'personnalisable',
        tailles: [],
        supplements: [],
        accompagnements: [],
        allergenes: [],
        labels: item.popular ? ['best-seller'] : [],
      })
    }

    console.log(`✅ Parsed ${items.length} items from Deliveroo`)
    return { items, restaurantName }
  } finally {
    clearTimeout(timeout)
  }
}

// ── Claude Haiku: infer style & labels ─────────────────────────────────────────
async function inferStyleAndLabels(items: Record<string, unknown>[]) {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey || items.length === 0) return items

  // Build compact list for Haiku
  const compact = items.map((it, i) => `[${i}] ${it.nom} — ${it.description || ''} — ${it.categorie}`).join('\n')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45_000)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Pour chaque plat ci-dessous, déduis :
- "style" : un parmi → burger | pokebowl | steak | turc | pasta | gastronomique | dessert | cocktail | sandwich | salade | pizza | asiatique | indien | mexicain. Si aucun ne colle, laisse vide.
- "item_type" : plat | formule | boisson | dessert
- "labels" : tableau parmi → vegetarien, vegan, sans_gluten, halal, casher, bio, fait_maison, best-seller, nouveau, epice, sans_lactose. [] si rien.
- "allergenes" : tableau parmi → gluten, lactose, oeufs, poisson, crustaces, arachides, fruits_a_coque, soja, celeri, moutarde, sesame, sulfites. [] si pas déductible.

Plats :
${compact}

Réponds UNIQUEMENT en JSON : [{"i": 0, "style": "...", "item_type": "...", "labels": [...], "allergenes": [...]}, ...]`,
          },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error('❌ Haiku error:', response.status)
      return items
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()
    const enrichments: Array<{ i: number; style?: string; item_type?: string; labels?: string[]; allergenes?: string[] }> = JSON.parse(cleaned)

    for (const e of enrichments) {
      if (e.i >= 0 && e.i < items.length) {
        if (e.style) items[e.i].style = e.style
        if (e.item_type) items[e.i].item_type = e.item_type
        if (e.labels?.length) items[e.i].labels = e.labels
        if (e.allergenes?.length) items[e.i].allergenes = e.allergenes
      }
    }

    console.log(`✅ Haiku enriched ${enrichments.length} items`)
    return items
  } catch (err) {
    console.error('⚠️ Haiku inference failed (non-blocking):', err)
    return items
  } finally {
    clearTimeout(timeout)
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ success: false, error: 'Authorization header manquant' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return jsonResponse({ success: false, error: 'Non autorisé' }, 401)

    // Body
    const body = await req.json()
    const { url } = body
    if (!url || typeof url !== 'string') {
      return jsonResponse({ success: false, error: 'URL requise' }, 400)
    }

    // SSRF check
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return jsonResponse({ success: false, error: 'URL invalide' }, 400)
      }
    } catch {
      return jsonResponse({ success: false, error: 'URL invalide' }, 400)
    }

    // Rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (supabaseUrl && supabaseKey) {
      const rateLimitCheck = await checkRateLimit(user.id, supabaseUrl, supabaseKey)
      if (!rateLimitCheck.allowed) {
        return jsonResponse(
          { success: false, error: `Limite atteinte (${rateLimitCheck.current_count}/${rateLimitCheck.limit} extractions aujourd'hui)` },
          429,
        )
      }
    }

    console.log(`📥 extract-menu-from-url: ${url}`)

    // ── Route by platform ──────────────────────────────────────────────────────
    const lowerUrl = url.toLowerCase()
    let items: Record<string, unknown>[]

    if (lowerUrl.includes('ubereats.com')) {
      const result = await fetchUberEatsMenu(url)
      items = result.items
    } else if (lowerUrl.includes('deliveroo.')) {
      const result = await fetchDeliverooMenu(url)
      items = result.items
    } else {
      return jsonResponse({ success: false, error: 'Plateforme non supportée. URLs acceptées : Uber Eats, Deliveroo.' }, 400)
    }

    if (items.length === 0) {
      return jsonResponse({ success: false, error: 'Aucun plat trouvé sur cette page' }, 404)
    }

    // ── Enrich with Claude Haiku (style, labels, allergenes) ───────────────────
    items = await inferStyleAndLabels(items)

    console.log(`✅ Returning ${items.length} items`)
    return jsonResponse({ success: true, data: items })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('❌ extract-menu-from-url error:', error)
    return jsonResponse(
      { success: false, error: message.includes('API') || message.includes('key') ? 'Erreur interne du serveur' : message },
      500,
    )
  }
})
