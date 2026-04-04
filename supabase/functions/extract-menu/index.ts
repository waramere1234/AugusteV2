import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

async function checkRateLimit(userId: string, supabaseUrl: string, supabaseKey: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/check_and_increment_usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      p_user_id: userId,
      p_action_type: 'menu_extraction',
      p_limit: 20
    })
  });

  if (!response.ok) {
    console.error('Rate limit check failed:', response.status);
    // Fail closed
    return { allowed: false, current_count: 0, limit: 20, remaining: 0 };
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header manquant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const body = await req.json()
    const { fileParts, prompt, workspaceId } = body

    if (!Array.isArray(fileParts)) {
      return new Response(
        JSON.stringify({ success: false, error: 'fileParts doit être un tableau' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    if (fileParts.length === 0 && !prompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'fileParts ou prompt requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ── Rate limiting — 20 extractions per day ──
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (supabaseUrl && supabaseKey) {
      const rateLimitCheck = await checkRateLimit(user.id, supabaseUrl, supabaseKey);
      if (!rateLimitCheck.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Limite atteinte (${rateLimitCheck.current_count}/${rateLimitCheck.limit} extractions aujourd'hui)`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
    }

    console.log('📥 Received:', { workspaceId, fileParts: fileParts.length, prompt: typeof prompt === 'string' ? prompt.substring(0, 50) : '' })

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration serveur incomplète' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const systemPrompt = `Tu es un expert en extraction de données de menus de restaurant.
Extrais TOUS les plats visibles. Ignore les en-têtes de section et logos.
Retourne UNIQUEMENT un JSON valide avec un tableau "items".

Format par item :
{
  "nom": "Pizza Margherita",
  "categorie": "Plats",
  "description": "Tomate, mozzarella, basilic frais",
  "prix": "11.00",
  "style": "pasta",
  "item_type": "plat",
  "item_profile": "personnalisable",
  "tailles": [{"label": "S", "prix": 8.00}, {"label": "M", "prix": 11.00}, {"label": "L", "prix": 14.00}],
  "supplements": [{"nom": "Fromage supplémentaire", "prix": 2.00, "obligatoire": false}],
  "accompagnements": [{"nom": "Frites", "prix": 0, "inclus": true}],
  "allergenes": ["gluten", "lactose"],
  "labels": ["best-seller"]
}

Règles CATEGORIES (TRÈS IMPORTANT) :
- Chaque item DOIT avoir une catégorie. Utilise les catégories du menu source quand elles existent.
- Si le menu source n'a pas de catégories claires, classe chaque item dans la catégorie la plus adaptée parmi : Entrées, Plats, Desserts, Boissons, Accompagnements, Formules, Snacks, Petits-déjeuners, Sauces.
- Exemples de classification :
  - Coca, Sprite, Eau, Jus, Café, Thé, Bière, Vin → "Boissons"
  - Frites, Salade, Riz, Pain → "Accompagnements"
  - Gâteau, Tiramisu, Crêpe sucrée, Glace → "Desserts"
  - Soupe, Salade composée, Bruschetta → "Entrées"
  - Menu Burger + Frites + Boisson → "Formules"
  - Ketchup, Mayonnaise, Harissa → "Sauces"
- Garde les noms de catégories en français, au pluriel, avec majuscule initiale.
- Ne crée PAS de catégorie vide. Ne laisse JAMAIS categorie vide.

Règles autres champs :
- tailles : extraire si plusieurs tailles/formats/contenances sont mentionnés. Sinon []
- supplements : extras payants mentionnés. Sinon []
- accompagnements : garnitures/sides inclus ou en option. Sinon []
- allergenes : si mentionnés ou clairement déductibles des ingrédients. Valeurs normalisées : gluten, lactose, oeufs, poisson, crustaces, arachides, fruits_a_coque, soja, celeri, moutarde, sesame, sulfites, lupin, mollusques. Sinon []
- labels : vegetarien, vegan, sans_gluten, halal, casher, bio, fait_maison, best-seller, nouveau, coup_de_coeur, epice, sans_lactose. Sinon []
- prix : prix principal (ou prix de la taille par défaut si tailles multiples)
- style : UNIQUEMENT → burger | pokebowl | steak | turc | pasta | gastronomique | dessert | cocktail | sandwich
- item_type : "plat" pour un plat individuel, "formule" pour un menu/combo/formule, "boisson" pour les boissons seules, "dessert" pour les desserts seuls. Par défaut "plat"
- item_profile : "personnalisable" si le plat a des options (pizza, burger, bowl...), "simple" si pas d'option (entrée, soupe...), "formule" si menu/combo, "boisson" pour les boissons, "dessert" pour les desserts. Par défaut "personnalisable"
- Si l'info n'est PAS dans le menu source, laisser [] — ne pas inventer

Format final : {"items": [...]}`

    // Build user prompt - adapt for single vs multi-file
    const defaultPrompt = fileParts.length > 1
      ? `Extrais le menu complet de ces ${fileParts.length} images/pages. Ce sont les différentes pages d'un même menu. Combine tous les plats de toutes les pages en un seul menu unifié, sans doublons.`
      : 'Extrais le menu de cette image.'

    const userContent = fileParts.length > 0
      ? [
          { type: 'text', text: prompt || defaultPrompt },
          ...fileParts.map((part: { inlineData: { mimeType: string; data: string } }) => ({
            type: 'image_url',
            image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
          }))
        ]
      : prompt;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]

    console.log('🔄 Calling OpenAI with', fileParts.length, 'file(s)...')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000)

    const maxTokens = Math.min(16000, 8000 + (fileParts.length - 1) * 4000)

    let response: Response
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          response_format: { type: 'json_object' },
          max_tokens: maxTokens
        }),
        signal: controller.signal
      })
    } catch (fetchError) {
      clearTimeout(timeout)
      console.error('❌ OpenAI fetch failed:', fetchError)
      const isTimeout = fetchError instanceof DOMException && fetchError.name === 'AbortError'
      return new Response(
        JSON.stringify({ success: false, error: isTimeout ? 'Timeout appel IA (120s)' : 'Erreur réseau vers le service IA' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ OpenAI Error:', response.status, errorText)
      const status = response.status === 429 ? 429 : 502
      return new Response(
        JSON.stringify({ success: false, error: status === 429 ? 'Limite de requêtes IA atteinte, réessayez dans quelques secondes' : 'Erreur du service IA' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
      )
    }

    const data = await response.json()
    console.log('✅ OpenAI Response OK')

    const rawContent = data.choices?.[0]?.message?.content ?? ''
    let result: { items?: unknown[] }
    try {
      const cleaned = rawContent.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      console.error('❌ JSON parse failed, raw:', rawContent.substring(0, 200))
      return new Response(
        JSON.stringify({ success: false, error: 'Réponse IA non parseable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }
    const menuItems = result.items || result

    console.log('✅ Returning:', menuItems.length, 'items from', fileParts.length, 'file(s)')

    return new Response(
      JSON.stringify({ success: true, data: menuItems }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('❌ Extract menu error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: message.includes('API') || message.includes('key') ? 'Erreur interne du serveur' : message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
