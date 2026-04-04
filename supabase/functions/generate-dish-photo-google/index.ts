// Test Edge Function — Google Imagen 4 for food photo generation
// Compare with generate-dish-photo (OpenAI gpt-image-1.5)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Auth manquant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Non autorisé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'GOOGLE_AI_API_KEY non configurée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const body = await req.json();
    const { dishes, restaurantType } = body;

    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Aucun plat fourni' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    console.log(`[Google Imagen] Processing ${dishes.length} dishes...`);

    const results: { dishId: string; imageUrl: string | null; error?: string }[] = [];

    for (const dish of dishes) {
      try {
        // Build prompt — same logic as OpenAI version but simplified for testing
        const prompt = buildGooglePrompt(dish, restaurantType);
        console.log(`[Google Imagen] ${dish.name} — prompt: ${prompt.substring(0, 200)}...`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict`,
          {
            method: 'POST',
            headers: {
              'x-goog-api-key': GOOGLE_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              instances: [{ prompt }],
              parameters: {
                sampleCount: 1,
                aspectRatio: '1:1',
                personGeneration: 'dont_allow',
              },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Google Imagen] Error ${response.status}:`, errText);
          results.push({ dishId: dish.id, imageUrl: null, error: `Google API ${response.status}` });
          continue;
        }

        const data = await response.json();
        const base64Image = data?.predictions?.[0]?.bytesBase64Encoded;

        if (!base64Image) {
          console.error(`[Google Imagen] No image in response for ${dish.name}`);
          results.push({ dishId: dish.id, imageUrl: null, error: 'Pas d\'image retournée' });
          continue;
        }

        // Return as data URI
        const imageUrl = `data:image/png;base64,${base64Image}`;
        results.push({ dishId: dish.id, imageUrl });
        console.log(`[Google Imagen] ✅ ${dish.name} — image generated`);

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error(`[Google Imagen] ❌ ${dish.name}:`, msg);
        results.push({ dishId: dish.id, imageUrl: null, error: msg });
      }
    }

    return new Response(
      JSON.stringify({ success: true, images: results, model: 'imagen-4.0-fast' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    console.error('[Google Imagen] Fatal:', err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// ── Prompt builder for Google Imagen ────────────────────────────────────────

function buildGooglePrompt(dish: any, restaurantType?: string): string {
  const parts: string[] = [];

  // Style declaration
  parts.push('Professional food photography for a restaurant menu. Photorealistic, appetizing, editorial quality, shot with a 50mm lens f/2.8.');

  // Restaurant identity (ADN visuel)
  if (dish.restaurantStyleDescription) {
    parts.push(`RESTAURANT VISUAL IDENTITY: ${dish.restaurantStyleDescription}. Match this exact atmosphere, surfaces, lighting, and color palette.`);
  }

  // Subject
  if (dish.description) {
    parts.push(`The dish "${dish.name}" contains: ${dish.description}. Show ONLY the ingredients listed.`);
  } else {
    parts.push(`The dish is "${dish.name}".`);
  }

  // Cuisine context
  if (dish.cuisineProfile) {
    const ctx = getCuisineContext(dish.cuisineProfile);
    if (ctx) parts.push(ctx);
  }

  // Restrictions
  parts.push('No text, no watermark, no logo, no human hands, no borders, no illustration. Photographic realism only.');

  return parts.join(' ');
}

const CUISINE_CONTEXTS: Record<string, string> = {
  kebab: 'Turkish/French kebab restaurant. Turkish bread (galette), generous portions, melted cheese, grilled meat. Served in kraft paper or aluminium barquette.',
  burger: 'Burger restaurant. Brioche buns, smashed or classic patties, melted cheese dripping. Dark moody lighting.',
  pizza: 'Italian pizzeria. Wood-fired style, charred crust, authentic Italian presentation.',
  tacos_fr: 'French tacos restaurant. FRENCH TACOS = large grilled closed wheat tortilla with meat, fries, and melted cheese sauce. NOT Mexican tacos.',
  japonais: 'Japanese restaurant. Minimalist precise presentation, black ceramics, chopsticks.',
  indien: 'Indian restaurant. Rich creamy sauces, vibrant spice colors, copper bowls, naan bread.',
  bistro: 'French bistro. Classic French plating, white ceramic plates, warm golden light.',
  gastronomique: 'Fine dining. Precise artistic plating, wide white plates, minimal garnish.',
};

function getCuisineContext(profileId: string): string {
  return CUISINE_CONTEXTS[profileId] ? `CUISINE: ${CUISINE_CONTEXTS[profileId]}` : '';
}
