// enrich-descriptions — Template lookup + GPT-4o-mini batch enrichment
// Deploy: supabase functions deploy enrich-descriptions --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { canonicalizeDishName } from '../_shared/normalize.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

interface EnrichItem {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface CuisineContext {
  bread?: string;
  serving?: string;
  sauce?: string;
  ambiance?: string;
  cultural_context?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header manquant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 },
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration serveur incomplète' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
      );
    }

    const body = await req.json();
    const items: EnrichItem[] = body.items;
    const cuisineProfileId: string = body.cuisineProfileId;
    const cuisineContext: CuisineContext | null = body.cuisineContext ?? null;

    if (!items?.length || !cuisineProfileId) {
      return new Response(
        JSON.stringify({ success: false, error: 'items et cuisineProfileId requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      );
    }

    // ── Step 1: Template lookup — reuse validated/enriched descriptions ──
    const canonicalNames = items.map((i) => canonicalizeDishName(i.name));

    const { data: templates } = await supabase
      .from('dish_templates')
      .select('canonical_name, description, source')
      .eq('cuisine_profile_id', cuisineProfileId)
      .in('canonical_name', canonicalNames);

    // Build lookup map — user_validated takes precedence
    const templateMap = new Map<string, string>();
    if (templates) {
      // Sort: user_validated first, then ai_enriched
      const sorted = [...templates].sort((a, b) => {
        if (a.source === 'user_validated' && b.source !== 'user_validated') return -1;
        if (b.source === 'user_validated' && a.source !== 'user_validated') return 1;
        return 0;
      });
      for (const t of sorted) {
        if (!templateMap.has(t.canonical_name)) {
          templateMap.set(t.canonical_name, t.description);
        }
      }
    }

    // ── Step 2: Split items — template hits vs AI needed ──
    const descriptions: { itemId: string; description: string }[] = [];
    const needsAI: EnrichItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const canonical = canonicalNames[i];
      const templateDesc = templateMap.get(canonical);
      if (templateDesc) {
        descriptions.push({ itemId: items[i].id, description: templateDesc });
        console.log(`📋 Template hit: ${items[i].name} → reused`);
      } else {
        needsAI.push(items[i]);
      }
    }

    // ── Step 3: AI enrichment for remaining items ──
    if (needsAI.length > 0) {
      const contextParts: string[] = [];
      if (cuisineContext?.cultural_context) contextParts.push(`Cuisine: ${cuisineContext.cultural_context}`);
      if (cuisineContext?.bread) contextParts.push(`Typical bread/base: ${cuisineContext.bread}`);
      if (cuisineContext?.serving) contextParts.push(`Typical serving: ${cuisineContext.serving}`);
      if (cuisineContext?.sauce) contextParts.push(`Typical sauces: ${cuisineContext.sauce}`);
      const contextStr = contextParts.length > 0 ? contextParts.join('. ') + '.' : '';

      const dishList = needsAI.map((item) => {
        const parts = [`- "${item.name}" (category: ${item.category || 'plat'})`];
        if (item.description?.trim()) {
          parts.push(`  Current description: "${item.description.trim()}"`);
        }
        return parts.join('\n');
      }).join('\n');

      const systemPrompt = [
        'You are an expert in visual food descriptions for AI image generation.',
        'Transform each dish into a photographic description of 40-80 words in English.',
        'Include: physical shape of ingredients, visible textures, colors, arrangement on the plate/bread, steam/shine if appropriate.',
        'DO NOT invent ingredients not implied by the name, category, or existing description.',
        'If a current description is provided, improve it — keep its ingredients but add visual detail.',
        contextStr ? `Restaurant context: ${contextStr}` : '',
        '',
        'Respond in JSON format: { "descriptions": [{ "name": "dish name", "description": "enriched description" }] }',
      ].filter(Boolean).join('\n');

      const userPrompt = `Enrich these ${needsAI.length} dishes:\n${dishList}`;

      console.log(`🤖 Enriching ${needsAI.length} dishes via GPT-4o-mini...`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 2000,
            temperature: 0.3,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const errText = await response.text();
          console.error(`❌ OpenAI error: ${response.status} — ${errText}`);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
          const parsed = JSON.parse(content);
          const aiDescriptions: { name: string; description: string }[] = parsed.descriptions ?? [];

          // Match AI results back to items
          for (const aiDesc of aiDescriptions) {
            const aiCanonical = canonicalizeDishName(aiDesc.name);
            const matchedItem = needsAI.find((item) => {
              const itemCanonical = canonicalizeDishName(item.name);
              return itemCanonical === aiCanonical || item.name.toLowerCase() === aiDesc.name.toLowerCase();
            });
            if (matchedItem) {
              descriptions.push({ itemId: matchedItem.id, description: aiDesc.description });
              console.log(`✅ Enriched: ${matchedItem.name}`);
            }
          }

          // Save to dish_templates (ai_enriched, never overwrite user_validated)
          const templateUpserts = aiDescriptions.map((aiDesc) => {
            const canonical = canonicalizeDishName(aiDesc.name);
            const original = needsAI.find((item) => {
              const c = canonicalizeDishName(item.name);
              return c === canonical || item.name.toLowerCase() === aiDesc.name.toLowerCase();
            });
            return {
              cuisine_profile_id: cuisineProfileId,
              canonical_name: canonical,
              display_name: original?.name ?? aiDesc.name,
              description: aiDesc.description,
              category: original?.category || 'plat',
              source: 'ai_enriched',
            };
          });

          if (templateUpserts.length > 0) {
            // Only upsert where source is NOT user_validated
            // Use a two-step approach: check existing user_validated, then upsert the rest
            const existingValidated = new Set<string>();
            const { data: validatedRows } = await supabase
              .from('dish_templates')
              .select('canonical_name')
              .eq('cuisine_profile_id', cuisineProfileId)
              .eq('source', 'user_validated')
              .in('canonical_name', templateUpserts.map((t) => t.canonical_name));

            if (validatedRows) {
              for (const row of validatedRows) {
                existingValidated.add(row.canonical_name);
              }
            }

            const toUpsert = templateUpserts.filter((t) => !existingValidated.has(t.canonical_name));
            if (toUpsert.length > 0) {
              const { error: upsertError } = await supabase
                .from('dish_templates')
                .upsert(toUpsert, { onConflict: 'cuisine_profile_id,canonical_name' });
              if (upsertError) {
                console.warn(`⚠️ dish_templates upsert error: ${upsertError.message}`);
              } else {
                console.log(`💾 Saved ${toUpsert.length} templates to dish_templates`);
              }
            }
          }
        }
      } catch (fetchError) {
        clearTimeout(timeout);
        const isTimeout = fetchError instanceof DOMException && fetchError.name === 'AbortError';
        console.error(`❌ GPT-4o-mini ${isTimeout ? 'timeout' : 'error'}: ${fetchError}`);
        // Fail gracefully — return whatever template matches we have
      }
    }

    console.log(`✅ Enrichment complete: ${descriptions.length}/${items.length} items enriched`);

    return new Response(
      JSON.stringify({ success: true, descriptions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('💥 enrich-descriptions error:', error);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
