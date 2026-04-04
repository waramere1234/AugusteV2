// QA-CHECKED: generate-dish-photo — auth JWT, SSRF protection, timeouts, error masking
// Deploy: supabase functions deploy generate-dish-photo --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isAllowedImageUrl } from '../_shared/ssrf.ts'

const IMAGE_MODEL = Deno.env.get('OPENAI_IMAGE_MODEL') || 'gpt-image-1.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

// ============================================================================
// PLATING CONSTRAINTS — prevent AI from adding unrequested garnishes/props
// ============================================================================

const PLATING_CONSTRAINTS = [
  'PLATING RULES — strictly apply:',
  'Only include garnishes that are explicitly part of the dish or listed in the description.',
  'DO NOT add: microgreens, edible flowers, gold leaf, sauce dots, herb sprigs, lemon wedges, or any decorative prop not described.',
  'DO NOT add extra drizzles, reductions, or side elements not mentioned.',
  'Plate exactly as it would appear when served — no food styling additions.',
].join(' ');

// ============================================================================
// CATEGORY_STYLES — enrichi avec les 4 nouvelles variables
// ============================================================================

const CATEGORY_STYLES: Record<string, {
  angle: string;
  background: string;
  plate_type: string;
  plate_color: string;
  garnish: string;
  texture: string;
}> = {
  pizza: {
    angle:       '90° overhead',
    background:  'dark rustic stone surface',
    plate_type:  'round wooden board',
    plate_color: 'natural warm wood',
    garnish:     'none',
    texture:     'bubbling melted cheese, charred crust edges, vibrant toppings',
  },
  burger: {
    angle:       '45° side angle',
    background:  'dark textured wood surface',
    plate_type:  'dark slate board',
    plate_color: 'dark charcoal',
    garnish:     'sesame seeds on bun only',
    texture:     'golden toasted bun, melted cheese dripping, juicy visible patty layers',
  },
  poutine: {
    angle:       '45° overhead angle',
    background:  'dark rustic wood surface',
    plate_type:  'deep ceramic bowl or oval plate',
    plate_color: 'warm white or natural',
    garnish:     'none',
    texture:     'crispy golden fries under melted cheese curds, glossy gravy coating, rustic and hearty',
  },
  sandwich: {
    angle:       '45° side angle',
    background:  'light wooden surface',
    plate_type:  'wooden cutting board',
    plate_color: 'natural light wood',
    garnish:     'none',
    texture:     'toasted bread crust, visible layered fillings, fresh ingredients',
  },
  pokebowl: {
    angle:       '90° overhead',
    background:  'white marble surface',
    plate_type:  'wide ceramic bowl',
    plate_color: 'clean white',
    garnish:     'sesame seeds, microgreens, thin lemon slice',
    texture:     'colorful fresh ingredients neatly arranged in sections, vibrant colors',
  },
  pasta: {
    angle:       '45° overhead',
    background:  'warm linen surface',
    plate_type:  'wide shallow ceramic plate',
    plate_color: 'off-white cream',
    garnish:     'fresh parsley or basil, grated parmesan, cracked black pepper',
    texture:     'glossy sauce coating noodles, al dente texture, steam rising',
  },
  soupe: {
    angle:       '45° overhead',
    background:  'dark slate surface',
    plate_type:  'deep ceramic bowl',
    plate_color: 'warm white or terracotta',
    garnish:     'fresh herb sprig, light cream swirl, croutons',
    texture:     'smooth velvety broth, gentle steam, glossy surface',
  },
  salade: {
    angle:       '90° overhead',
    background:  'white marble surface',
    plate_type:  'wide flat ceramic plate',
    plate_color: 'pure white',
    garnish:     'croutons, light dressing drizzle',
    texture:     'crisp fresh leaves, vibrant colors, glistening light dressing',
  },
  steak: {
    angle:       '30° low side angle',
    background:  'dark dramatic slate surface',
    plate_type:  'dark slate or cast iron plate',
    plate_color: 'deep black charcoal',
    garnish:     'fresh thyme sprig, pat of melting herb butter, sea salt flakes',
    texture:     'dramatic sear marks, juicy pink interior, caramelized crust',
  },
  viande: {
    angle:       '30° low side angle',
    background:  'dark warm wood surface',
    plate_type:  'dark ceramic plate',
    plate_color: 'deep charcoal',
    garnish:     'fresh rosemary, jus reduction drizzle',
    texture:     'golden roasted exterior, tender interior, caramelized surface',
  },
  poisson: {
    angle:       '45° side angle',
    background:  'white marble surface',
    plate_type:  'wide white ceramic plate',
    plate_color: 'pure white',
    garnish:     'thin lemon slice, fresh dill or chives, caper berries',
    texture:     'flaky tender flesh, crispy golden skin, fresh and glistening',
  },
  dessert: {
    angle:       '45° front angle',
    background:  'white marble surface',
    plate_type:  'white ceramic dessert plate',
    plate_color: 'pure white',
    garnish:     'powdered sugar dusting, fresh berry, mint leaf',
    texture:     'delicate layers, rich creamy textures, glossy glaze',
  },
  gateau: {
    angle:       '45° front angle',
    background:  'white marble surface',
    plate_type:  'white marble cake stand or plate',
    plate_color: 'white marble',
    garnish:     'fresh fruit slices, edible flowers, powdered sugar',
    texture:     'moist crumb visible in cross-section, smooth frosting, layered interior',
  },
  glace: {
    angle:       '45° front angle',
    background:  'white marble surface',
    plate_type:  'white ceramic bowl or waffle cone',
    plate_color: 'clean white',
    garnish:     'wafer, fresh fruit, chocolate sauce drizzle',
    texture:     'smooth creamy scoops, slight melting edges, frosty appearance',
  },
  cocktail: {
    angle:       'straight-on side angle',
    background:  'dark marble bar surface',
    plate_type:  'elegant cocktail glass',
    plate_color: 'transparent crystal clear',
    garnish:     'citrus twist, fresh herbs, decorative straw',
    texture:     'vibrant liquid color, condensation droplets on glass, clear ice cubes',
  },
  boisson: {
    angle:       'straight-on side angle',
    background:  'white or light marble surface',
    plate_type:  'appropriate glass or cup',
    plate_color: 'clean transparent or ceramic white',
    garnish:     'fresh fruit slice, mint sprig, straw if appropriate',
    texture:     'clear vibrant color, condensation or steam depending on temperature',
  },
  entree: {
    angle:       '45° overhead angle',
    background:  'dark linen or slate surface',
    plate_type:  'elegant white ceramic plate',
    plate_color: 'pure white',
    garnish:     'fine sauce dots only if part of the dish',
    texture:     'precise elegant plating, delicate textures, fine dining presentation',
  },
  turc: {
    angle:       '45° side angle',
    background:  'warm terracotta or stone surface',
    plate_type:  'copper tray or rustic ceramic plate',
    plate_color: 'warm copper or earthy terracotta',
    garnish:     'none',
    texture:     'charred grilled marks, warm spiced colors, rich hearty presentation',
  },
  kebab_sandwich: {
    angle:       '45° three-quarter angle',
    background:  'dark wood surface or kraft paper',
    plate_type:  'kraft paper wrapper or aluminium barquette',
    plate_color: 'brown kraft or silver aluminium',
    garnish:     'none — show the sandwich as served',
    texture:     'Turkish galette bread (soft, slightly charred, puffy), generous shaved meat overflowing, fresh vegetables (tomato, onion, lettuce), white sauce drizzle, hearty generous street food portion',
  },
  kebab_assiette: {
    angle:       '45° overhead angle',
    background:  'dark wood or warm stone surface',
    plate_type:  'large oval plate or aluminium barquette',
    plate_color: 'white ceramic or silver aluminium',
    garnish:     'none',
    texture:     'grilled shaved meat with charred edges, golden fries, fresh side salad, white sauce and hot sauce on the side, generous fast-food portion',
  },
  doner: {
    angle:       '45° side angle',
    background:  'warm casual surface, slightly blurred kebab shop interior',
    plate_type:  'kraft paper or aluminium foil wrap',
    plate_color: 'kraft brown',
    garnish:     'none',
    texture:     'thinly shaved rotisserie meat, stacked high, Turkish flatbread, fresh vegetables visible, sauce dripping, authentic street food',
  },
  durum: {
    angle:       '45° side angle, cut in half to show cross-section',
    background:  'kraft paper on dark surface',
    plate_type:  'kraft paper or aluminium foil',
    plate_color: 'brown kraft',
    garnish:     'none',
    texture:     'tightly rolled thin lavash wrap, visible filling layers in cross-section — shaved meat, fries, vegetables, melted cheese, sauce — generous and overflowing',
  },
  gastronomique: {
    angle:       '45° overhead angle',
    background:  'dark matte slate surface',
    plate_type:  'wide white fine china plate',
    plate_color: 'pure white with thin gold rim',
    garnish:     'minimal, only if part of the dish',
    texture:     'precise elegant plating, delicate textures, artistic composition',
  },
  french_tacos: {
    angle:       '45° three-quarter angle',
    background:  'dark brushed metal surface or kraft paper',
    plate_type:  'kraft paper wrapper or branded paper tray',
    plate_color: 'brown kraft or black branded',
    garnish:     'none — show the wrap as-is, pressed and golden',
    texture:     'golden-brown crispy grilled exterior, visible grill marks, melted cheese oozing at the edge, visible filling layers when cut in half',
  },
  riz_crousty: {
    angle:       '45° overhead angle',
    background:  'dark surface or branded container',
    plate_type:  'black takeaway container or bowl',
    plate_color: 'matte black',
    garnish:     'sauce drizzle zigzag pattern on top',
    texture:     'golden breaded crispy chicken pieces on white rice base, contrasting white creamy sauce and spicy orange sauce drizzled, steam rising, ASMR-style close-up texture detail',
  },
  loaded_fries: {
    angle:       '45° angle',
    background:  'dark rustic wood or metal tray',
    plate_type:  'metal basket lined with kraft paper or paper cone',
    plate_color: 'metallic or kraft',
    garnish:     'melted cheese pull, sauce drizzle',
    texture:     'crispy golden fries generously topped with melted cheese, pulled meat or toppings, fresh herbs, colorful sauce drizzle',
  },
  smash_burger: {
    angle:       'straight-on side angle, slightly below eye level',
    background:  'dark surface with soft bokeh lights behind',
    plate_type:  'kraft paper or small wooden board',
    plate_color: 'brown kraft',
    garnish:     'none — burger speaks for itself',
    texture:     'thin crispy-edged smashed patty, melted cheese draped perfectly over edges, caramelized onions visible, brioche bun with sesame seeds, sauce dripping slightly',
  },
  wrap: {
    angle:       '45° side angle',
    background:  'light wooden surface or kraft paper',
    plate_type:  'kraft paper wrap or parchment',
    plate_color: 'natural kraft brown',
    garnish:     'none',
    texture:     'tightly rolled tortilla with visible filling at the cut end, fresh colorful ingredients visible in cross-section',
  },
  bowl: {
    angle:       '90° overhead or slight 75° tilt',
    background:  'light wood or marble surface',
    plate_type:  'deep round ceramic bowl',
    plate_color: 'matte white or earth tone',
    garnish:     'sesame seeds, fresh herbs on top, lime wedge',
    texture:     'colorful ingredients beautifully arranged in sections, grain base visible, protein on top, vibrant vegetables',
  },
  naan: {
    angle:       '45° overhead',
    background:  'warm terracotta or dark wood',
    plate_type:  'round copper plate or rustic board',
    plate_color: 'copper or dark wood',
    garnish:     'fresh coriander leaves, butter melting',
    texture:     'soft pillowy naan with charred bubbles, golden brown spots, brushed with melted butter',
  },
  default: {
    angle:       '45° angle',
    background:  'neutral dark surface',
    plate_type:  'clean ceramic plate',
    plate_color: 'white or neutral',
    garnish:     'none',
    texture:     'appetizing professional presentation',
  },
};

// ============================================================================
// CAMERA_BY_CATEGORY — real camera specs per category for photorealism
// ============================================================================

const CAMERA_BY_CATEGORY: Record<string, string> = {
  pizza: 'Overhead 90° flat lay. 50mm lens, f/2.8, shallow DoF on toppings.',
  burger: '45° three-quarter angle, slightly below eye level. 85mm lens, f/2.0, background bokeh.',
  poutine: '45° overhead. 50mm lens, f/3.5, full dish in focus.',
  sandwich: '45° side angle. 85mm lens, f/2.8, focus on cross-section layers.',
  pokebowl: '90° overhead flat lay. 35mm lens, f/4.0, all sections sharp.',
  pasta: '45° overhead. 50mm lens, f/2.8, steam in focus, background soft.',
  soupe: '45° overhead. 50mm lens, f/2.8, surface detail sharp, bowl rim soft.',
  salade: '90° overhead flat lay. 35mm lens, f/4.0, all ingredients visible and sharp.',
  steak: '30° low side angle. 85mm lens, f/2.0, dramatic shallow DoF, focus on sear.',
  viande: '30° low side angle. 85mm lens, f/2.0, focus on meat texture.',
  poisson: '45° side angle. 85mm lens, f/2.8, skin texture sharp.',
  dessert: '45° front angle. 85mm lens, f/2.0, layers in focus, background creamy bokeh.',
  gateau: '45° front angle. 85mm lens, f/2.0, cross-section detail sharp.',
  glace: '45° front angle. 85mm lens, f/2.0, melting edges in focus.',
  cocktail: 'Straight-on side angle. 85mm lens, f/2.8, glass and liquid sharp, background dark bokeh.',
  boisson: 'Straight-on side angle. 85mm lens, f/2.8, condensation detail sharp.',
  entree: '45° overhead. 50mm lens, f/2.8, precise plating in focus.',
  turc: '45° side angle. 50mm lens, f/3.5, charred details sharp.',
  kebab_sandwich: '45° three-quarter angle. 50mm lens, f/2.8, bread texture and filling sharp, background soft.',
  kebab_assiette: '45° overhead. 50mm lens, f/3.5, meat and fries sharp, full plate visible.',
  doner: '45° side angle. 50mm lens, f/2.8, shaved meat layers sharp, bread texture visible.',
  durum: '45° side angle. 85mm lens, f/2.0, cross-section filling layers sharp, shallow DoF.',
  gastronomique: '45° overhead. 50mm lens, f/2.8, precise artistic plating sharp.',
  french_tacos: '45° three-quarter angle. 50mm lens, f/2.8, grill marks and cheese visible.',
  riz_crousty: '45° overhead. 50mm lens, f/3.5, crispy texture detail sharp, sauce pattern visible.',
  loaded_fries: '45° angle. 50mm lens, f/2.8, cheese pull detail, toppings sharp.',
  smash_burger: 'Straight-on side angle, slightly below eye level. 85mm lens, f/1.8, crispy edges in focus.',
  wrap: '45° side angle. 85mm lens, f/2.8, cross-section filling visible.',
  bowl: '90° overhead or slight 75° tilt. 35mm lens, f/4.0, all sections visible.',
  naan: '45° overhead. 50mm lens, f/2.8, charred bubbles sharp.',
  default: '45° angle. 50mm lens, f/2.8, dish centered and sharp.',
};

// ============================================================================
// MICRO_TEXTURES_BY_CATEGORY — hyper-realistic food texture cues
// ============================================================================

const MICRO_TEXTURES_BY_CATEGORY: Record<string, string> = {
  pizza: 'Bubbling mozzarella micro-stretches, charred leopard-spotted crust, glistening olive oil pooling in pepperoni cups.',
  burger: 'Sesame seeds on brioche catching light, beef juice beading on patty surface, cheese draping in micro-folds.',
  poutine: 'Glossy gravy rivulets between fries, stretchy cheese curd pulls, individual fry ridges catching light.',
  sandwich: 'Bread crumb texture visible, lettuce vein detail, condiment glistening at edges.',
  pokebowl: 'Glistening raw fish grain, individual rice grains visible, sesame seeds casting tiny shadows.',
  pasta: 'Sauce clinging to ridges, parmesan micro-crystals, al dente bite visible where pasta breaks.',
  soupe: 'Micro-bubbles at surface edge, cream swirl marbling, herb leaf veins floating.',
  salade: 'Water droplets on crisp leaves, dressing coating each leaf, crouton pore detail.',
  steak: 'Maillard crust micro-crystals, juice pooling at cut, pink interior fibers visible.',
  viande: 'Caramelized surface grain, rendered fat glistening, herb fleck distribution.',
  poisson: 'Skin crackling separating into scales, flesh flaking along natural grain, citrus juice beading.',
  dessert: 'Sugar glaze micro-cracks, cream peaks with soft tips, fruit skin sheen.',
  gateau: 'Moist crumb structure visible at cut, frosting swirl texture, fruit glaze reflection.',
  glace: 'Micro-ice crystals on scoop surface, drip catching light mid-flow, cone waffle grid pattern.',
  cocktail: 'Condensation droplet trails on glass, ice facets refracting light, citrus oil misting surface.',
  boisson: 'Bubble columns rising in liquid, condensation beading on glass exterior, ice clarity.',
  entree: 'Sauce micro-dots precision, vegetable brunoise sharp edges, protein sear detail.',
  turc: 'Charred grill line depth, sumac grain scatter, flatbread bubble texture.',
  kebab_sandwich: 'Turkish bread bubbles and char marks, shaved meat grain visible, fresh tomato juice beading, white sauce dripping down bread, lettuce crunch texture.',
  kebab_assiette: 'Grilled meat char edges, golden fry ridges, fresh salad glistening, sauce pooling at plate edges.',
  doner: 'Thin meat layers stacked with visible grain, flatbread flour dusting, sauce trailing down.',
  durum: 'Lavash wrap char spots, cross-section showing distinct filling layers, cheese stretching, fry crunch visible.',
  gastronomique: 'Emulsion micro-bubbles, gel transparency, powder dusting settling on plate.',
  french_tacos: 'Grill press marks on tortilla, cheese sauce oozing at fold, crispy golden spots.',
  riz_crousty: 'Panko coating catching light individually, sauce zigzag drizzle thickness variation, rice grain separation.',
  loaded_fries: 'Cheese stretching between fries, sauce pooling in texture valleys, crispy fry edges.',
  smash_burger: 'Lacy crisp edges where patty thins, cheese bubble micro-texture, caramelized onion strands.',
  wrap: 'Tortilla char spots, filling cross-section color layers, sauce glistening at cut.',
  bowl: 'Grain texture separation, protein glaze reflection, pickled vegetable translucency.',
  naan: 'Charred bubble blisters, melted butter pooling in dimples, flour dusting on surface.',
  default: 'Appetizing food surface detail, natural highlights, realistic imperfections.',
};

// ============================================================================
// NORMALIZE CATEGORY — inchangé
// ============================================================================

const normalizeCategory = (category: string): string => {
  const safe = (category || 'default');
  const normalized = safe
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  const mapping: Record<string, string> = {
    // Multi-word trending styles — MUST match BEFORE single-word variants
    'french tacos': 'french_tacos', 'tacos frites': 'french_tacos', 'tacos gratine': 'french_tacos',
    'riz crousty': 'riz_crousty', 'riz croustillant': 'riz_crousty', 'crispy rice': 'riz_crousty', 'riz crispy': 'riz_crousty',
    'loaded fries': 'loaded_fries', 'frites chargees': 'loaded_fries', 'frites garnies': 'loaded_fries',
    'smash burger': 'smash_burger', 'smashburger': 'smash_burger', 'smashed burger': 'smash_burger',
    'buddha bowl': 'bowl', 'grain bowl': 'bowl', 'acai bowl': 'bowl',
    'cheese naan': 'naan', 'keema naan': 'naan', 'garlic naan': 'naan', 'naan garni': 'naan',
    'tortilla wrap': 'wrap',
    // Existing multi-word
    'poke bowl': 'pokebowl', 'fruits de mer': 'poisson', 'faux filet': 'steak',
    // Standard categories
    'pizza': 'pizza', 'pizzas': 'pizza',
    'burger': 'burger', 'burgers': 'burger', 'hamburger': 'burger',
    'poutine': 'poutine', 'poutines': 'poutine',
    'sandwich': 'sandwich', 'sandwichs': 'sandwich', 'sandwiches': 'sandwich',
    'poke': 'pokebowl', 'pokebowl': 'pokebowl',
    'pasta': 'pasta', 'pate': 'pasta', 'pates': 'pasta', 'tagliatelle': 'pasta', 'spaghetti': 'pasta',
    'soupe': 'soupe', 'soup': 'soupe', 'bouillon': 'soupe', 'veloute': 'soupe',
    'salade': 'salade', 'salad': 'salade', 'salades': 'salade',
    'steak': 'steak', 'steaks': 'steak', 'entrecote': 'steak',
    'viande': 'viande', 'viandes': 'viande', 'plat': 'viande', 'plats': 'viande',
    'poisson': 'poisson', 'fish': 'poisson', 'saumon': 'poisson',
    'dessert': 'dessert', 'desserts': 'dessert',
    'gateau': 'gateau', 'cake': 'gateau', 'tarte': 'gateau', 'tartes': 'gateau',
    'glace': 'glace', 'sorbet': 'glace', 'gelato': 'glace',
    'cocktail': 'cocktail', 'cocktails': 'cocktail',
    'boisson': 'boisson', 'boissons': 'boisson', 'drink': 'boisson', 'jus': 'boisson',
    'entree': 'entree', 'entrees': 'entree', 'starter': 'entree', 'starters': 'entree',
    'turc': 'turc', 'turk': 'turc', 'mediterraneen': 'turc', 'mediterranean': 'turc', 'mezze': 'turc',
    'kebab sandwich': 'kebab_sandwich', 'kebab galette': 'kebab_sandwich', 'kebab pain': 'kebab_sandwich',
    'galette poulet': 'kebab_sandwich', 'galette steak': 'kebab_sandwich', 'galette viande': 'kebab_sandwich', 'galette kebab': 'kebab_sandwich', 'galette merguez': 'kebab_sandwich', 'galette mixte': 'kebab_sandwich', 'galette escalope': 'kebab_sandwich', 'galette kefta': 'kebab_sandwich',
    'kebab assiette': 'kebab_assiette', 'assiette kebab': 'kebab_assiette', 'assiette': 'kebab_assiette',
    'doner': 'doner', 'doner kebab': 'doner', 'donner': 'doner',
    'durum': 'durum', 'durums': 'durum', 'wrap kebab': 'durum',
    'kebab': 'kebab_sandwich', 'shawarma': 'doner',
    'gastronomique': 'gastronomique', 'gastronomic': 'gastronomique', 'gastro': 'gastronomique', 'gourmet': 'gastronomique',
    // Single-word trending — AFTER multi-word to avoid premature matches
    'tacos': 'french_tacos',
    'crousty': 'riz_crousty',
    'smash': 'smash_burger',
    'wrap': 'wrap', 'wraps': 'wrap', 'tortilla': 'wrap',
    'bowl': 'bowl', 'bowls': 'bowl',
    'naan': 'naan', 'naans': 'naan',
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (normalized.includes(key)) return value;
  }

  return 'default';
};

// ============================================================================
// EXTRACT NEGATIVE CONSTRAINTS — détecte "no basilic", "sans tomate", etc.
// ============================================================================

function extractNegativeConstraints(description: string): string[] {
  const negativePatterns = [
    /\bno\s+(\w+)/gi,
    /\bsans\s+(\w[\w\s]*?)(?=[,.]|$)/gi,
    /\bpas\s+de\s+(\w[\w\s]*?)(?=[,.]|$)/gi,
    /\bwithout\s+(\w[\w\s]*?)(?=[,.]|$)/gi,
    /\bsuppress\s+(\w[\w\s]*?)(?=[,.]|$)/gi,
  ];
  const negatives: string[] = [];
  for (const pattern of negativePatterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      negatives.push(match[1].trim());
    }
  }
  return negatives;
}

// ============================================================================
// DETECT ACCOMPANIMENTS — enrichit le prompt avec les accompagnements détectés
// ============================================================================

interface AccompanimentHint {
  keyword: string;
  inSandwich: string;  // inside bread/wrap
  onPlate: string;     // on the side
}

const ACCOMPANIMENT_RULES: AccompanimentHint[] = [
  { keyword: 'frites', inSandwich: 'with golden crispy fries visible inside the bread among the filling', onPlate: 'with a generous portion of golden crispy fries on the side' },
  { keyword: 'frite', inSandwich: 'with golden crispy fries visible inside the bread among the filling', onPlate: 'with a generous portion of golden crispy fries on the side' },
  { keyword: 'riz', inSandwich: '', onPlate: 'with a portion of white rice on the side' },
  { keyword: 'salade', inSandwich: '', onPlate: 'with a fresh green side salad' },
  { keyword: 'potatoes', inSandwich: '', onPlate: 'with roasted golden potatoes on the side' },
  { keyword: 'pommes de terre', inSandwich: '', onPlate: 'with roasted golden potatoes on the side' },
  { keyword: 'coleslaw', inSandwich: '', onPlate: 'with a small portion of coleslaw on the side' },
  { keyword: 'galette', inSandwich: '', onPlate: 'with a side of flatbread/galette' },
  { keyword: 'pain', inSandwich: '', onPlate: 'with bread on the side' },
  { keyword: 'legumes', inSandwich: '', onPlate: 'with grilled or steamed vegetables on the side' },
  { keyword: 'puree', inSandwich: '', onPlate: 'with a smooth creamy mashed potato on the side' },
  { keyword: 'gratin', inSandwich: '', onPlate: 'with a golden bubbling gratin on the side' },
];

const SANDWICH_CATEGORIES = new Set(['kebab_sandwich', 'sandwich', 'doner', 'durum', 'wrap', 'french_tacos', 'burger', 'smash_burger', 'hot_dog']);

function detectAccompaniments(description: string, category: string): string {
  if (!description) return '';
  const lower = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isSandwich = SANDWICH_CATEGORIES.has(normalizeCategory(category));
  const hints: string[] = [];

  for (const rule of ACCOMPANIMENT_RULES) {
    if (lower.includes(rule.keyword)) {
      const hint = isSandwich ? rule.inSandwich : rule.onPlate;
      if (hint) hints.push(hint);
    }
  }

  return hints.length > 0 ? hints.join('. ') + '.' : '';
}

// ============================================================================
// EXTRACT QUANTITY INSTRUCTION — détecte "6 nuggets", "duo", "lot de 3", etc.
// ============================================================================

function extractQuantityInstruction(name: string, description?: string): string {
  const text = `${name} ${description || ''}`.toLowerCase();
  const patterns = [
    /(\d+)\s*(?:pi[eè]ces?|pieces?|pcs?)/i,
    /(\d+)\s*(?:nuggets?|nems?|samoussas?|samosas?|beignets?|falafels?|wings?|ailes?|briouats?|gyozas?|dumplings?|raviolis?|bouchees?|morceaux?)/i,
    /(\d+)\s*(?:boules?|scoops?)/i,
    /(\d+)\s*(?:tranches?|slices?)/i,
    /(\d+)\s*(?:brochettes?|skewers?)/i,
    /(\d+)\s*(?:sushis?|makis?|california)/i,
    /lot\s*de\s*(\d+)/i,
    /par\s*(\d+)/i,
    /x\s*(\d+)/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const count = parseInt(m[1]);
      if (count >= 2 && count <= 6) {
        return `QUANTITY: Show EXACTLY ${count} pieces — count them precisely. Not ${count - 1}, not ${count + 1}, exactly ${count}.`;
      }
      if (count > 6 && count <= 20) {
        return `QUANTITY: Show approximately ${count} pieces arranged appetizingly. A generous, clearly visible portion.`;
      }
      if (count > 20) {
        return `QUANTITY: Show a generous abundant portion suggesting many pieces.`;
      }
    }
  }
  // Named quantities
  const namedQty: Record<string, number> = { duo: 2, trio: 3, double: 2, triple: 3 };
  for (const [word, qty] of Object.entries(namedQty)) {
    if (text.includes(word)) return `QUANTITY: Show EXACTLY ${qty} pieces — count them precisely. Not ${qty - 1}, not ${qty + 1}, exactly ${qty}.`;
  }
  return '';
}

// ============================================================================
// DETECT BEVERAGE FORMAT — canette, bouteille, verre, boisson chaude
// ============================================================================

type BeverageFormat = 'can_33cl' | 'bottle_50cl' | 'bottle_large' | 'glass_only' | 'hot_drink' | 'default';

function detectBeverageFormat(name: string, description: string, tailles?: { label: string; prix: number }[]): BeverageFormat {
  const tailleLabels = (tailles || []).map(t => t.label.toLowerCase()).join(' ');
  const all = `${name} ${description} ${tailleLabels}`.toLowerCase();
  // Boissons chaudes
  if (/caf[eé]|coffee|espresso|cappuccino|latte|th[eé]\b|tea\b|chocolat\s+chaud|hot\s+chocolate|infusion/i.test(all)) return 'hot_drink';
  // Canette 33cl
  if (/33\s*cl|330\s*ml|canette|can\b/i.test(all)) return 'can_33cl';
  // Bouteille 50cl
  if (/50\s*cl|500\s*ml/i.test(all)) return 'bottle_50cl';
  // Grande bouteille
  if (/75\s*cl|1\s*l\b|1\.5\s*l|bouteille|bottle/i.test(all)) return 'bottle_large';
  // Verre seul
  if (/verre|glass|25\s*cl|pression|draft|pint/i.test(all)) return 'glass_only';
  return 'default';
}

// ============================================================================
// KNOWN BEVERAGE BRANDS — detect brand to generate recognizable bottle + glass
// ============================================================================

const KNOWN_BRANDS: { pattern: RegExp; color: string; style: string }[] = [
  { pattern: /coca[\s-]?cola|coca|coke/i, color: 'dark caramel brown', style: 'iconic red-label cola' },
  { pattern: /pepsi/i, color: 'dark caramel brown', style: 'blue-label cola' },
  { pattern: /fanta/i, color: 'bright orange', style: 'orange soda' },
  { pattern: /sprite/i, color: 'clear sparkling', style: 'lemon-lime soda' },
  { pattern: /orangina/i, color: 'pulpy orange', style: 'French sparkling orange with pulp' },
  { pattern: /perrier/i, color: 'clear sparkling with fine bubbles', style: 'French sparkling mineral water in green bottle' },
  { pattern: /san\s*pellegrino|s\.pellegrino/i, color: 'clear sparkling', style: 'Italian sparkling water in green bottle' },
  { pattern: /evian/i, color: 'still clear', style: 'French still mineral water' },
  { pattern: /vittel/i, color: 'still clear', style: 'French still mineral water' },
  { pattern: /badoit/i, color: 'lightly sparkling', style: 'French sparkling water' },
  { pattern: /schweppes/i, color: 'clear sparkling golden', style: 'tonic water or ginger ale' },
  { pattern: /ice[\s-]?tea|lipton/i, color: 'amber iced tea', style: 'iced tea' },
  { pattern: /red[\s-]?bull/i, color: 'golden amber', style: 'energy drink in slim tall can' },
  { pattern: /oasis/i, color: 'fruity tropical', style: 'French fruit drink' },
  { pattern: /7[\s-]?up/i, color: 'clear sparkling', style: 'lemon-lime soda' },
  { pattern: /dr[\s.]?pepper/i, color: 'dark cherry cola', style: 'cherry cola' },
  { pattern: /tropicana/i, color: 'deep orange', style: 'orange juice' },
  { pattern: /minute[\s-]?maid/i, color: 'fruit juice', style: 'fruit juice' },
];

function detectBrand(name: string): { color: string; style: string } | null {
  for (const brand of KNOWN_BRANDS) {
    if (brand.pattern.test(name)) return { color: brand.color, style: brand.style };
  }
  return null;
}

const BEVERAGE_PROMPTS: Record<BeverageFormat, string> = {
  can_33cl: `A cold {name} aluminum can (33cl) with realistic condensation droplets on the surface, placed next to a clear glass filled with ice cubes and {liquid} poured in. The can is the main subject, the glass is secondary. Studio product photography, slightly below eye level, reflective dark surface. No text, no logo, no brand name visible on the can, no watermark, no human hands.`,
  bottle_50cl: `A {name} glass bottle (50cl) with condensation on the glass, placed next to a tall glass filled with {liquid} and ice. Product photography, straight-on angle, dark reflective surface. No text, no logo, no brand name visible on the bottle, no watermark, no human hands.`,
  bottle_large: `A {name} large bottle prominently displayed, with a filled glass of {liquid} beside it. Elegant product photography, dark background, subtle rim lighting. No text, no logo, no brand name visible, no watermark, no human hands.`,
  glass_only: `A tall clear glass generously filled with {liquid}, ice cubes visible, condensation on the glass exterior. Fresh, appetizing. Straight-on angle, soft neutral background. No text, no watermark, no human hands.`,
  hot_drink: `A ceramic cup filled with {name}, gentle steam rising from the surface. Top-down 45° angle. Warm cozy lighting, wood or marble surface. Latte art if appropriate. No text, no watermark, no human hands.`,
  default: `A refreshing {name} served in an appropriate glass filled with {liquid}. Condensation droplets, appetizing presentation. Product photography, clean background. No text, no watermark, no human hands.`,
};

// ============================================================================
// INJECT USER INSTRUCTIONS — appended to any prompt if provided
// ============================================================================

function injectUserInstructions(prompt: string, userInstructions?: string): string {
  if (!userInstructions?.trim()) return prompt;
  return `${prompt}\n\nAdditional instructions from the restaurateur: ${userInstructions.trim()}`;
}

// ============================================================================
// GENERATE WITH STYLE IMAGES — /v1/images/edits avec photos de reference
// ============================================================================

async function generateWithStyleImages(
  prompt: string,
  apiKey: string,
  dishReferenceBase64: string,
  restaurantPhotoBase64: string,
  ambiancePhotoBase64?: string,
  quality: 'low' | 'medium' | 'high' = 'medium',
  siblingImageBase64?: string,
  size: '1024x1024' | '1536x1024' | '1024x1536' = '1024x1024',
  inputFidelity?: 'low' | 'high',
  outputFormat: 'webp' | 'png' = 'webp',
  isEnhance = false,
): Promise<string> {
  // Convertir base64 -> Blob PNG (handles both raw base64 and data:...;base64, URLs)
  const base64ToBlob = (b64: string): Blob => {
    let raw = b64;
    let mime = 'image/png';
    if (raw.startsWith('data:')) {
      const commaIdx = raw.indexOf(',');
      const header = raw.substring(0, commaIdx);
      mime = header.match(/:(.*?);/)?.[1] || mime;
      raw = raw.substring(commaIdx + 1);
    }
    const binaryStr = atob(raw);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  };

  const formData = new FormData();
  formData.append('model', IMAGE_MODEL);
  formData.append('prompt', prompt);
  formData.append('size', size);
  formData.append('quality', quality);
  formData.append('n', '1');
  formData.append('output_format', outputFormat);
  formData.append('background', 'opaque');
  if (inputFidelity) formData.append('input_fidelity', inputFidelity);

  // Image order matters — gpt-image-1.5 biases attention toward earlier images
  if (isEnhance) {
    // ENHANCE: user's real dish photo first (highest attention), then style references
    if (dishReferenceBase64) {
      formData.append('image[]', base64ToBlob(dishReferenceBase64), 'dish_photo.png');
    }
    if (restaurantPhotoBase64) {
      formData.append('image[]', base64ToBlob(restaurantPhotoBase64), 'restaurant_style.png');
    }
    if (siblingImageBase64) {
      formData.append('image[]', base64ToBlob(siblingImageBase64), 'sibling_style.png');
    }
  } else {
    // STYLED: dish reference first for plating, then restaurant for ambiance
    if (dishReferenceBase64) {
      formData.append('image[]', base64ToBlob(dishReferenceBase64), 'dish_reference.png');
    }
    if (restaurantPhotoBase64) {
      formData.append('image[]', base64ToBlob(restaurantPhotoBase64), 'restaurant_style.png');
    }
    if (ambiancePhotoBase64) {
      formData.append('image[]', base64ToBlob(ambiancePhotoBase64), 'ambiance_style.png');
    }
    if (siblingImageBase64) {
      formData.append('image[]', base64ToBlob(siblingImageBase64), 'sibling_style.png');
    }
  }

  // QA-CHECKED: Timeout 120s sur OpenAI image edits
  const editsController = new AbortController()
  const editsTimeout = setTimeout(() => editsController.abort(), 120_000)

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
      signal: editsController.signal,
    });
  } catch (fetchError) {
    clearTimeout(editsTimeout)
    const isTimeout = fetchError instanceof DOMException && fetchError.name === 'AbortError'
    throw new Error(isTimeout ? 'Timeout génération image (120s)' : 'Erreur réseau vers le service IA')
  }
  clearTimeout(editsTimeout)

  if (!response.ok) {
    const status = response.status
    let errorMessage = `HTTP ${status}`;
    try {
      const err = await response.json();
      errorMessage = err?.error?.message || errorMessage;
    } catch { /* ignore */ }
    // QA-CHECKED: log full error server-side, sanitize for client
    console.error(`❌ OpenAI /edits error: ${errorMessage}`)
    if (status === 429) throw new Error('Limite de requêtes IA atteinte, réessayez dans quelques secondes')
    if (status === 400 && errorMessage.includes('content_policy')) throw new Error('Image refusée par la politique de contenu IA')
    throw new Error('Erreur du service de génération d\'images')
  }

  const data = await response.json();
  const imageData = data.data?.[0];
  if (!imageData) throw new Error('No image data in /edits response');

  const editsMime = outputFormat === 'webp' ? 'image/webp' : 'image/png';
  if (imageData.b64_json) return `data:${editsMime};base64,${imageData.b64_json}`;
  if (imageData.url) return imageData.url;
  throw new Error('No b64_json or url in /edits response');
}

// ============================================================================
// GENERATE WITH TEXT ONLY — /v1/images/generations (fallback sans photos)
// ============================================================================

async function generateWithTextOnly(
  prompt: string,
  apiKey: string,
  size: '1024x1024' | '1536x1024' | '1024x1536' = '1024x1024',
  quality: 'low' | 'medium' | 'high' = 'medium',
  outputFormat: 'webp' | 'png' = 'webp',
): Promise<string> {
  // QA-CHECKED: Timeout 120s sur OpenAI image generations
  const genController = new AbortController()
  const genTimeout = setTimeout(() => genController.abort(), 120_000)

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt,
        size,
        quality,
        output_format: outputFormat,
        background: 'opaque',
        n: 1,
      }),
      signal: genController.signal,
    });
  } catch (fetchError) {
    clearTimeout(genTimeout)
    const isTimeout = fetchError instanceof DOMException && fetchError.name === 'AbortError'
    throw new Error(isTimeout ? 'Timeout génération image (120s)' : 'Erreur réseau vers le service IA')
  }
  clearTimeout(genTimeout)

  if (!response.ok) {
    const status = response.status
    let errorMessage = `HTTP ${status}`;
    try {
      const err = await response.json();
      errorMessage = err?.error?.message || errorMessage;
    } catch { /* ignore */ }
    console.error(`❌ OpenAI /generations error: ${errorMessage}`)
    if (status === 429) throw new Error('Limite de requêtes IA atteinte, réessayez dans quelques secondes')
    if (status === 400 && errorMessage.includes('content_policy')) throw new Error('Image refusée par la politique de contenu IA')
    throw new Error('Erreur du service de génération d\'images')
  }

  const data = await response.json();
  const imageData = data.data?.[0];
  if (!imageData) throw new Error('No image data in /generations response');

  const genMime = outputFormat === 'webp' ? 'image/webp' : 'image/png';
  if (imageData.b64_json) return `data:${genMime};base64,${imageData.b64_json}`;
  if (imageData.url) return imageData.url;
  throw new Error('No b64_json or url in /generations response');
}

// ============================================================================
// CUISINE PROFILE CONTEXT — builds cultural context string from profile ID
// ============================================================================

// Inline profile data for the edge function (no shared imports with frontend)
const CUISINE_PROFILE_DATA: Record<string, { bread: string; serving: string; sauce: string; ambiance: string; cultural_context: string }> = {
  kebab: { bread: 'pain turc (galette turque moelleuse) ou pain pita épais', serving: 'barquette aluminium, papier kraft', sauce: 'sauce blanche, sauce samouraï', ambiance: 'warm street food lighting, casual', cultural_context: 'Turkish/French kebab shop. "Tacos" means FRENCH TACOS (grilled closed tortilla with meat, fries, and melted cheese sauce). Sandwiches use Turkish bread, not baguette.' },
  burger: { bread: 'brioche bun doré avec graines de sésame', serving: 'papier kraft, planche ardoise', sauce: 'ketchup, sauce burger maison, cheddar fondu', ambiance: 'dark moody lighting, American diner vibe', cultural_context: 'Burger restaurant. Brioche buns, smashed or classic patties. Melted cheese dripping.' },
  pizza: { bread: 'pâte à pizza fine ou napolitaine', serving: 'planche en bois ronde', sauce: 'sauce tomate, huile d\'olive, basilic', ambiance: 'warm rustic Italian trattoria', cultural_context: 'Italian pizzeria. Wood-fired style, authentic Italian presentation.' },
  tacos_fr: { bread: 'tortilla de blé grillée et fermée (panini-press style)', serving: 'papier kraft, barquette', sauce: 'sauce fromagère fondue, sauce algérienne', ambiance: 'urban street food', cultural_context: 'French tacos restaurant. IMPORTANT: "Tacos" is a FRENCH TACOS — large grilled closed wheat tortilla with meat, fries, and melted cheese sauce. NOT Mexican tacos.' },
  riz_crousty: { bread: 'base de riz blanc', serving: 'box noire ou container takeaway', sauce: 'sauce fromagère blanche, sauce piquante orange, zigzag pattern', ambiance: 'modern street food, ASMR-style', cultural_context: 'Crispy rice restaurant. White rice topped with golden crispy breaded chicken, dual sauce drizzle zigzag.' },
  sandwich_boulangerie: { bread: 'baguette tradition croustillante', serving: 'papier kraft, planche en bois', sauce: 'beurre, moutarde, mayonnaise', ambiance: 'warm natural light, artisan bakery', cultural_context: 'French bakery. Sandwiches use traditional baguette. Classic French fillings.' },
  poulet_frit: { bread: 'pain burger moelleux ou sans pain', serving: 'bucket, barquette kraft', sauce: 'sauce BBQ, honey mustard', ambiance: 'bold fast-food style', cultural_context: 'Fried chicken restaurant. Golden crispy coating. Served in buckets or baskets.' },
  japonais: { bread: 'riz à sushi vinaigré', serving: 'plateau noir laqué, céramique noire', sauce: 'sauce soja, wasabi', ambiance: 'minimalist Japanese aesthetic, zen', cultural_context: 'Japanese restaurant. Minimalist precise presentation. Black ceramics, bamboo, chopsticks.' },
  chinois: { bread: 'riz blanc, nouilles, baozi', serving: 'bol profond en céramique', sauce: 'sauce soja, sauce aigre-douce', ambiance: 'warm golden lighting, wok hei', cultural_context: 'Chinese restaurant. Wok-fried dishes, dim sum. Deep bowls, chopsticks, steam rising.' },
  thai: { bread: 'riz jasmin, nouilles de riz', serving: 'bol en bois ou céramique', sauce: 'curry vert/rouge/jaune, lait de coco', ambiance: 'vibrant tropical colors', cultural_context: 'Thai restaurant. Fresh herbs (basil, cilantro, lime). Colorful, aromatic.' },
  vietnamien: { bread: 'bánh mì (baguette vietnamienne), nouilles de riz', serving: 'bol profond pour phở', sauce: 'nuoc mam, sauce hoisin, sriracha', ambiance: 'light and fresh, clear broth', cultural_context: 'Vietnamese restaurant. Phở, bánh mì, bò bún. Fresh herbs, clear broth.' },
  coreen: { bread: 'riz blanc', serving: 'bol en pierre chauffé (dolsot)', sauce: 'gochujang, kimchi', ambiance: 'warm hearty, sizzling', cultural_context: 'Korean restaurant. Bibimbap, Korean BBQ. Stone bowls, banchan side dishes.' },
  indien: { bread: 'naan, chapati, riz basmati', serving: 'thali, bol en inox, plat en cuivre', sauce: 'curry onctueux, raita, chutney', ambiance: 'rich warm spice colors', cultural_context: 'Indian restaurant. Rich creamy sauces, vibrant spice colors. Copper/steel bowls, naan.' },
  libanais: { bread: 'pain pita fin et moelleux', serving: 'grande assiette à partager, plateau de mezzé', sauce: 'houmous, tahini, toum', ambiance: 'warm Mediterranean, rustic clay', cultural_context: 'Lebanese restaurant. Mezze, shawarma, falafel. Generous sharing plates, pita bread.' },
  turc: { bread: 'pain pide, pain lavash', serving: 'plateau en cuivre, assiette en terre cuite', sauce: 'yaourt, sumac, grenade', ambiance: 'warm copper tones, grilled marks', cultural_context: 'Turkish restaurant. Kebabs, pide, lahmacun. Copper trays, charred grill marks.' },
  grec: { bread: 'pain pita grec épais grillé', serving: 'assiette blanche/bleue', sauce: 'tzatziki, huile d\'olive, citron', ambiance: 'Mediterranean blue and white', cultural_context: 'Greek restaurant. Gyros, souvlaki. Blue/white aesthetics, thick pita.' },
  marocain: { bread: 'pain marocain rond (khobz)', serving: 'tajine en terre cuite', sauce: 'chermoula, harissa', ambiance: 'warm earthy tones, zellige tiles', cultural_context: 'Moroccan restaurant. Tagine, couscous. Terracotta tagine pot, colorful spices.' },
  italien: { bread: 'focaccia, ciabatta', serving: 'assiette en céramique rustique', sauce: 'sauce tomate, pesto, huile d\'olive', ambiance: 'warm rustic Italian trattoria', cultural_context: 'Italian restaurant. Pasta, risotto, tiramisu. Rustic ceramics, basil, parmesan.' },
  bistro: { bread: 'baguette tradition', serving: 'assiette blanche classique', sauce: 'sauce au vin, béarnaise', ambiance: 'warm Parisian bistro, cozy golden light', cultural_context: 'French bistro. Classic French plating, white ceramic plates.' },
  gastronomique: { bread: 'pain artisanal de chef', serving: 'grande assiette blanche en porcelaine fine', sauce: 'jus réduit, émulsion', ambiance: 'dark elegant matte slate, precise lighting', cultural_context: 'Fine dining. Precise artistic plating, wide white plates, micro-portions.' },
  mexicain: { bread: 'tortilla de maïs (small, soft, doubled)', serving: 'assiette colorée, panier avec papier', sauce: 'salsa verde, guacamole, crema', ambiance: 'vibrant warm colors, festive', cultural_context: 'Mexican restaurant. IMPORTANT: "Tacos" means AUTHENTIC MEXICAN TACOS — small open corn tortillas with meat, cilantro, onion, lime. NOT French tacos.' },
  africain: { bread: 'attiéké, foutou, semoule', serving: 'grande assiette à partager', sauce: 'sauce arachide (mafé), sauce gombo', ambiance: 'warm earthy colors, generous', cultural_context: 'African restaurant. Generous portions, rich sauces, communal sharing.' },
  antillais: { bread: 'pain maison antillais, bokit', serving: 'assiette colorée, feuille de bananier', sauce: 'sauce chien, sauce colombo', ambiance: 'tropical vibrant colors', cultural_context: 'Caribbean restaurant. Colombo, accras. Tropical colors, plantain.' },
  poke_bowl: { bread: 'base riz sushi ou quinoa', serving: 'large bol rond vu du dessus', sauce: 'sauce soja sucrée, mayo sriracha', ambiance: 'bright healthy aesthetic', cultural_context: 'Poke/bowl restaurant. Geometric ingredient sections, overhead view.' },
  cafe: { bread: 'pâtisseries, viennoiseries', serving: 'tasse en céramique, soucoupe', sauce: 'latte art, chocolat chaud', ambiance: 'cozy warm interior, soft natural light', cultural_context: 'Cafe/tea room. Ceramic cups, cake stands. NO TEXT on drink surfaces.' },
  brunch: { bread: 'pain de mie toasté, pancakes, bagel', serving: 'grande assiette composée, planche en bois', sauce: 'sirop d\'érable, hollandaise', ambiance: 'bright warm morning light', cultural_context: 'Brunch restaurant. Abundant composed plates, morning golden light.' },
  fruits_de_mer: { bread: 'pain de seigle, blinis', serving: 'plateau de fruits de mer sur glace pilée', sauce: 'mayonnaise, mignonette', ambiance: 'coastal fresh atmosphere', cultural_context: 'Seafood restaurant. Crushed ice, lemon, fresh coastal elegance.' },
  bbq: { bread: 'cornbread, brioche bun', serving: 'planche en bois rustique', sauce: 'sauce BBQ fumée, coleslaw', ambiance: 'smoky rustic atmosphere', cultural_context: 'BBQ/grill restaurant. Smoked meats, charred wood, generous American BBQ.' },
  healthy: { bread: 'pain complet, wrap aux graines', serving: 'bol en bambou, assiette en grès', sauce: 'vinaigrette légère, tahini', ambiance: 'bright natural light, earthy tones', cultural_context: 'Healthy/vegetarian. Natural materials, earth tones, plant-forward.' },
  espagnol: { bread: 'pan con tomate, pain cristal', serving: 'petites assiettes en terre cuite (cazuelas)', sauce: 'aïoli, romesco', ambiance: 'warm rustic tavern', cultural_context: 'Spanish restaurant. Tapas, paella. Small sharing plates, convivial.' },
  creperie: { bread: 'crêpe fine au froment, galette de sarrasin', serving: 'assiette ronde, planche en bois', sauce: 'beurre salé, caramel', ambiance: 'warm Breton cottage', cultural_context: 'French crêperie. Thin crêpes and galettes de sarrasin. Breton tradition.' },
  brasserie: { bread: 'baguette, pain de seigle', serving: 'assiette blanche large, plateau de fruits de mer', sauce: 'mayonnaise, beurre citronné', ambiance: 'classic French brasserie, Art Deco', cultural_context: 'French brasserie. Choucroute, fruits de mer. Elegant but relaxed.' },
  bresilien: { bread: 'pão de queijo, farofa', serving: 'espeto (brochette), assiette large', sauce: 'chimichurri, vinaigrette', ambiance: 'warm churrascaria glow', cultural_context: 'Brazilian restaurant. Churrasco, feijoada. Grilled meats on skewers.' },
  peruvien: { bread: 'maïs, pommes de terre', serving: 'assiette moderne blanche', sauce: 'leche de tigre, ají amarillo', ambiance: 'fresh coastal feel, vibrant citrus', cultural_context: 'Peruvian restaurant. Ceviche, lomo saltado. Fresh citrus-forward.' },
  asiatique_fusion: { bread: 'bao buns, riz, nouilles variées', serving: 'céramique moderne, bol design', sauce: 'sauce teriyaki, mayo sriracha', ambiance: 'modern sleek dark surfaces', cultural_context: 'Asian fusion. Modern mix of influences. Sleek modern presentation.' },
  bubble_tea: { bread: 'pas de pain — boissons', serving: 'gobelet transparent avec couvercle dôme', sauce: 'sirop de fruits, perles de tapioca', ambiance: 'pastel colors, kawaii aesthetic', cultural_context: 'Bubble tea shop. Transparent cups, visible tapioca pearls. Bright pastel.' },
  fish_and_chips: { bread: 'pané croustillant doré', serving: 'cornet de papier journal ou barquette kraft', sauce: 'tartar sauce, vinaigre, citron', ambiance: 'British pub atmosphere', cultural_context: 'Fish and chips. Golden battered fish, thick-cut chips. British pub style.' },
  hot_dog: { bread: 'pain à hot-dog vapeur moelleux', serving: 'barquette kraft, papier aluminium', sauce: 'moutarde américaine, ketchup', ambiance: 'American street food cart', cultural_context: 'Hot dog stand. Steamed soft buns, sausage extending past the bun.' },
};

function buildCuisineProfileContext(profileId: string): string {
  const profile = CUISINE_PROFILE_DATA[profileId];
  if (!profile) return '';
  return `CUISINE CONTEXT: ${profile.cultural_context} Typical bread/base: ${profile.bread}. Typical serving: ${profile.serving}. Typical sauces: ${profile.sauce}. Ambiance: ${profile.ambiance}`;
}

// ============================================================================
// PROMPT BLOCK BUILDER — typed blocks with priority-based conflict resolution
// ============================================================================

type BlockPriority = 'SUBJECT' | 'USER_INPUT' | 'CATEGORY' | 'CUISINE' | 'SYSTEM' | 'SYSTEM_P0';
type BlockType = 'imageMapping' | 'styleDeclaration' | 'restaurantIdentity' | 'negative' | 'subject' | 'quantity'
               | 'cultural' | 'platingAndSurface' | 'camera' | 'lighting' | 'microTextures'
               | 'consistency' | 'restrictions';
type GenerationMode = 'generation' | 'styled' | 'enhance';

interface PromptBlock {
  type: BlockType;
  priority: BlockPriority;
  content: string;
}

interface ResolvedApiParams {
  size: '1024x1024' | '1536x1024' | '1024x1536';
  quality: 'low' | 'medium' | 'high';
  input_fidelity?: 'low' | 'high';
  output_format: 'webp' | 'png';
}

const PRIORITY_RANK: Record<BlockPriority, number> = {
  SUBJECT: 4, USER_INPUT: 3, CATEGORY: 2, CUISINE: 1, SYSTEM: 0, SYSTEM_P0: 5,
};

const BLOCK_RENDER_ORDER: BlockType[] = [
  'imageMapping', 'styleDeclaration', 'restaurantIdentity', 'negative', 'subject', 'quantity', 'cultural',
  'platingAndSurface', 'camera', 'lighting', 'microTextures', 'consistency', 'restrictions',
];

class PromptBlockBuilder {
  private blocks: PromptBlock[] = [];

  add(type: BlockType, priority: BlockPriority, content: string): this {
    if (!content.trim()) return this;
    this.blocks.push({ type, priority, content: content.trim() });
    return this;
  }

  resolve(): PromptBlock[] {
    const byType = new Map<BlockType, PromptBlock[]>();
    for (const block of this.blocks) {
      const existing = byType.get(block.type) || [];
      existing.push(block);
      byType.set(block.type, existing);
    }

    const resolved: PromptBlock[] = [];
    for (const [, blocks] of byType) {
      const systemBlocks = blocks.filter(b => b.priority === 'SYSTEM' || b.priority === 'SYSTEM_P0');
      const nonSystemBlocks = blocks.filter(b => b.priority !== 'SYSTEM' && b.priority !== 'SYSTEM_P0');
      resolved.push(...systemBlocks);
      if (nonSystemBlocks.length > 0) {
        nonSystemBlocks.sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
        resolved.push(nonSystemBlocks[0]);
      }
    }

    return resolved;
  }

  build(): string {
    const resolved = this.resolve();
    const ordered = BLOCK_RENDER_ORDER.flatMap(type =>
      resolved.filter(b => b.type === type)
    );
    return ordered.map(b => b.content).join('\n\n');
  }
}

// ─── Block adder functions ─────────────────────────────────────────────────

function addImageMappingBlock(builder: PromptBlockBuilder, mode: GenerationMode, hasRestaurant: boolean, hasDishRef: boolean, hasAmbiance: boolean, hasSibling: boolean): void {
  if (mode === 'enhance') {
    const lines = ['[IMAGE ROLE MAP]'];
    if (hasDishRef) lines.push('Image 1 "dish_photo.png" = the REAL dish photo to enhance. PRESERVE this dish exactly.');
    if (hasRestaurant) lines.push(`Image ${hasDishRef ? 2 : 1} "restaurant_style.png" = restaurant interior for lighting, surfaces, and color temperature.`);
    if (hasSibling) lines.push(`Image ${(hasDishRef ? 1 : 0) + (hasRestaurant ? 1 : 0) + 1} "sibling_style.png" = previously generated photo — match its visual style exactly.`);
    builder.add('imageMapping', 'SYSTEM_P0', lines.join('\n'));
  } else if (mode === 'styled') {
    const lines = ['[IMAGE ROLE MAP]'];
    let idx = 1;
    if (hasDishRef) { lines.push(`Image ${idx} "dish_reference.png" = plating style reference. Match its presentation and arrangement.`); idx++; }
    if (hasRestaurant) { lines.push(`Image ${idx} "restaurant_style.png" = restaurant interior for lighting, surfaces, and color temperature.`); idx++; }
    if (hasAmbiance) { lines.push(`Image ${idx} "ambiance_style.png" = interior atmosphere reinforcement.`); idx++; }
    if (hasSibling) { lines.push(`Image ${idx} "sibling_style.png" = previously generated photo — match its visual style exactly.`); }
    builder.add('imageMapping', 'SYSTEM_P0', lines.join('\n'));
  }
  // generation mode has no images → no imageMapping needed
}

function addStyleDeclarationBlock(builder: PromptBlockBuilder): void {
  builder.add('styleDeclaration', 'SYSTEM_P0',
    'Professional food photography, editorial quality, shot for a high-end restaurant menu. Photorealistic, appetizing, commercial standard.');
}

function addNegativeBlock(builder: PromptBlockBuilder, description?: string): void {
  const negatives = extractNegativeConstraints(description ?? '');
  if (negatives.length > 0) {
    builder.add('negative', 'SUBJECT', `STRICT EXCLUSIONS: Do NOT include: ${negatives.join(', ')}. This is a strict requirement.`);
  } else {
    builder.add('negative', 'SYSTEM', `STRICT EXCLUSIONS: This dish contains no excluded ingredients.`);
  }
}

function addRestaurantIdentityBlock(builder: PromptBlockBuilder, restaurantStyleDescription?: string, cuisineProfile?: string): void {
  if (!restaurantStyleDescription) return;
  const profile = cuisineProfile ? CUISINE_PROFILE_DATA[cuisineProfile] : null;
  const ambianceLine = profile ? ` Restaurant ambiance: ${profile.ambiance}.` : '';
  builder.add('restaurantIdentity', 'SYSTEM_P0',
    `RESTAURANT VISUAL DNA (MANDATORY — override defaults): ${restaurantStyleDescription}.${ambianceLine} ` +
    `Every photo MUST reflect this identity: same surfaces, same color palette, same lighting temperature, same mood, same atmosphere. ` +
    `This takes priority over generic category defaults for surface, lighting, and plating style.`);
}

function addSubjectBlock(builder: PromptBlockBuilder, name: string, description?: string, category?: string, cuisineProfile?: string): void {
  const profile = cuisineProfile ? CUISINE_PROFILE_DATA[cuisineProfile] : null;
  const breadHint = profile ? ` Default bread/base for this restaurant: ${profile.bread}. Default serving: ${profile.serving}.` : '';
  const accompHint = detectAccompaniments(description || name, category || '');

  if (description) {
    builder.add('subject', 'SUBJECT',
      `The dish "${name}" contains: ${description}. Show ONLY the ingredients listed. Do not add unlisted ingredients.${breadHint}${accompHint ? ` ACCOMPANIMENTS: ${accompHint}` : ''}`);
  } else {
    builder.add('subject', 'SUBJECT',
      `The dish is "${name}" — a typical ${category || 'restaurant'} dish. Use standard ingredients for this dish type.${breadHint}`);
  }
}

function addQuantityBlock(builder: PromptBlockBuilder, name: string, description?: string): void {
  const qty = extractQuantityInstruction(name, description);
  if (qty) builder.add('quantity', 'SUBJECT', qty);
}

function addCulturalBlock(builder: PromptBlockBuilder, cuisineProfile?: string, cuisineTypes?: string[], restaurantType?: string, gastroLevel?: string): void {
  const parts: string[] = [];
  if (cuisineProfile) {
    const ctx = buildCuisineProfileContext(cuisineProfile);
    if (ctx) parts.push(ctx);
  }
  if (cuisineTypes?.length) parts.push(`Restaurant cuisine types: ${cuisineTypes.join(', ')}.`);
  if (restaurantType) parts.push(restaurantType);
  if (gastroLevel === 'fine_dining') parts.push('Fine dining, refined plating.');
  else if (gastroLevel === 'bistronomique') parts.push('Modern bistro, relaxed elegance.');
  else if (gastroLevel === 'casual') parts.push('Casual friendly restaurant.');
  else if (gastroLevel === 'street_food') parts.push('Street food, bold authentic style.');
  if (parts.length > 0) builder.add('cultural', 'CUISINE', parts.join(' '));
}

function addPlatingAndSurfaceBlock(builder: PromptBlockBuilder, category: string, backgroundDescription?: string, restaurantStyleDescription?: string): void {
  const key = normalizeCategory(category);
  const s = CATEGORY_STYLES[key] || CATEGORY_STYLES['default'];

  // Plating
  const garnishLine = s.garnish && s.garnish !== 'none'
    ? `Served on ${s.plate_type} (${s.plate_color}), garnished with ${s.garnish}.`
    : `Served on ${s.plate_type} (${s.plate_color}), no added garnish.`;

  // Surface — cascade: USER > CUISINE > CATEGORY
  let surfaceLine: string;
  let priority: BlockPriority;
  if (backgroundDescription) {
    surfaceLine = `Surface: ${backgroundDescription}.`;
    priority = 'USER_INPUT';
  } else if (restaurantStyleDescription) {
    surfaceLine = `Surface: match the surfaces, materials, and environment from the restaurant's visual DNA. Do NOT use generic category surface.`;
    priority = 'USER_INPUT';
  } else {
    surfaceLine = `Surface: ${s.background}.`;
    priority = 'CATEGORY';
  }

  builder.add('platingAndSurface', priority, `${garnishLine}\n${surfaceLine}\n${PLATING_CONSTRAINTS}`);
}

function addCameraBlock(builder: PromptBlockBuilder, category: string): void {
  const key = normalizeCategory(category);
  const cam = CAMERA_BY_CATEGORY[key] || CAMERA_BY_CATEGORY['default'];
  builder.add('camera', 'CATEGORY', `Camera: ${cam}`);
}

function addLightingBlock(builder: PromptBlockBuilder, _mode: GenerationMode, restaurantStyleDescription?: string, cuisineProfile?: string): void {
  if (restaurantStyleDescription) {
    builder.add('lighting', 'USER_INPUT', `Lighting: ${restaurantStyleDescription}.`);
  } else if (cuisineProfile) {
    const profile = CUISINE_PROFILE_DATA[cuisineProfile];
    if (profile) builder.add('lighting', 'CUISINE', `Lighting: ${profile.ambiance}.`);
  }
}

function addMicroTexturesBlock(builder: PromptBlockBuilder, category: string): void {
  const key = normalizeCategory(category);
  const tex = MICRO_TEXTURES_BY_CATEGORY[key] || MICRO_TEXTURES_BY_CATEGORY['default'];
  builder.add('microTextures', 'CATEGORY', `Micro-textures: ${tex}`);
}

function addConsistencyBlock(builder: PromptBlockBuilder, mode: GenerationMode, hasSiblingImage: boolean, enrichedStyleDescription?: string): void {
  // Image role labelling is now in imageMapping block — consistency block focuses on style matching
  if (mode === 'styled' && hasSiblingImage) {
    builder.add('consistency', 'SYSTEM',
      `VISUAL CONSISTENCY: Match the lighting, surface, and color temperature of sibling_style.png exactly. All photos must look like they belong to the same restaurant menu.`);
  } else if (mode === 'styled') {
    builder.add('consistency', 'SYSTEM',
      `VISUAL CONSISTENCY: Use the reference images to ensure consistent lighting, surfaces, and color temperature.`);
  } else if (mode === 'generation' && hasSiblingImage && enrichedStyleDescription) {
    builder.add('consistency', 'SYSTEM',
      `VISUAL CONSISTENCY: All menu photos must look like they belong to the same set. Match this visual style: ${enrichedStyleDescription}. Same surface, same lighting temperature, same color palette, same mood.`);
  }
}

function addRestrictionsBlock(builder: PromptBlockBuilder): void {
  builder.add('restrictions', 'SYSTEM', 'ABSOLUTE RESTRICTIONS: No text, no watermark, no logo, no brand name, no human hands, no human body parts, no borders, no frames, no illustration, no cartoon style. Photographic realism only.');
}

function addAdaptiveContextBlock(builder: PromptBlockBuilder, hasRestaurant: boolean, hasDishRef: boolean, hasAmbiance: boolean, category: string): void {
  const parts: string[] = [];
  if (hasRestaurant && !hasDishRef) {
    const catStyle = CATEGORY_STYLES[normalizeCategory(category)] || CATEGORY_STYLES['default'];
    parts.push(`No dish reference photo. Follow plating rules strictly: ${catStyle.plate_type} (${catStyle.plate_color}), ${catStyle.texture}. Shot from ${catStyle.angle}.`);
  } else if (hasDishRef && !hasRestaurant) {
    parts.push(`No restaurant style photo. Use the text style description for lighting, surfaces, and atmosphere. Match the dish reference for plating only.`);
  }
  if (!hasAmbiance) parts.push('No ambiance photo — infer interior atmosphere from the restaurant style photo and text description.');
  if (parts.length > 0) builder.add('camera', 'SYSTEM', parts.join(' '));
}

function addEnhanceModeBlocks(builder: PromptBlockBuilder, name: string, description?: string, restaurantStyleDescription?: string, backgroundDescription?: string): void {
  const descPart = description ? `, described as "${description}"` : '';
  builder.add('subject', 'SUBJECT', [
    `Professional food photo enhancement of "${name}"${descPart}.`,
    `INPUT: the first image ("dish_photo.png") is the REAL dish photo submitted by the restaurateur.`,
    `PRESERVE the dish EXACTLY: every ingredient, plate/bowl shape and color, food positioning, quantities, arrangement. Do NOT add, remove, or move any food element.`,
  ].join(' '));

  builder.add('camera', 'SUBJECT',
    `COMPOSITION: Center the dish in the frame using rule of thirds. If the original photo is off-center or poorly framed, adjust the framing to create a balanced, professional composition with equal padding around the plate.`);

  if (backgroundDescription) {
    builder.add('platingAndSurface', 'USER_INPUT',
      `REPLACE the background entirely: remove the original table, surface, and surroundings. New background: ${backgroundDescription}.`);
  } else {
    builder.add('platingAndSurface', 'SYSTEM',
      `REPLACE the background entirely: remove the original table, surface, and surroundings. Match the EXACT surface, materials, and environment from "restaurant_style.png".`);
  }

  if (restaurantStyleDescription) {
    builder.add('lighting', 'SUBJECT',
      `RESTAURANT IDENTITY: ${restaurantStyleDescription}. Every visual element MUST reflect this identity — same surfaces, same color palette, same lighting temperature, same mood. Apply soft natural diffused lighting with subtle warmth.`);
  } else {
    builder.add('lighting', 'SYSTEM',
      `LIGHTING: Apply soft natural diffused lighting with subtle warmth. Ensure consistent brightness and color temperature. Uniform exposure, no harsh shadows, gentle highlights on the food.`);
  }

  builder.add('microTextures', 'SYSTEM', `Apply gentle sharpness boost on the food only. Keep the background slightly soft (shallow depth of field).`);
}

// ─── buildPromptForDish — single orchestrator replacing 3 builders ─────────

interface StyleTemplate {
  lighting: string;
  surface: string;
  palette: string;
  mood: string;
}

interface DishPromptInput {
  name: string;
  category: string;
  description?: string;
  style?: string;
  restaurantStyleDescription?: string;
  backgroundDescription?: string;
  tailles?: { label: string; prix: number }[];
  cuisineProfile?: string;
  cuisineTypes?: string[];
  restaurantType?: string;
  gastroLevel?: string;
  isEnhance?: boolean;
  userInstructions?: string;
  hasRestaurantPhoto: boolean;
  hasDishReference: boolean;
  hasAmbiancePhoto: boolean;
  hasSiblingImage: boolean;
  styleTemplate?: StyleTemplate;
}

function buildPromptForDish(input: DishPromptInput): string {
  // Try name first (most specific), then style, then category as fallback
  const keyFromName = normalizeCategory(input.name);
  const keyFromStyle = input.style ? normalizeCategory(input.style) : 'default';
  const keyFromCategory = normalizeCategory(input.category);
  let key = keyFromName !== 'default' ? keyFromName
    : keyFromStyle !== 'default' ? keyFromStyle
    : keyFromCategory;

  // Cuisine-aware disambiguation: when key is too generic, use cuisineProfile to refine
  if (key === 'default' || key === 'viande' || key === 'sandwich') {
    const CUISINE_STYLE_OVERRIDES: Record<string, Record<string, string>> = {
      kebab: { sandwich: 'kebab_sandwich', viande: 'kebab_assiette', default: 'kebab_sandwich' },
      turc: { sandwich: 'kebab_sandwich', viande: 'turc', default: 'turc' },
      libanais: { sandwich: 'kebab_sandwich', viande: 'turc', default: 'turc' },
      indien: { default: 'naan' },
    };
    const overrides = input.cuisineProfile ? CUISINE_STYLE_OVERRIDES[input.cuisineProfile] : null;
    if (overrides) {
      key = overrides[key] || overrides['default'] || key;
    }
  }
  const hasStyleImages = input.hasRestaurantPhoto || input.hasDishReference || input.hasAmbiancePhoto;
  const mode: GenerationMode = input.isEnhance && hasStyleImages ? 'enhance'
    : hasStyleImages ? 'styled' : 'generation';

  // Beverage early return — templates + brand detection + restrictions
  if (key === 'boisson' || key === 'cocktail') {
    const bevFormat = detectBeverageFormat(input.name, input.description || '', input.tailles);
    const bevTemplate = BEVERAGE_PROMPTS[bevFormat] || BEVERAGE_PROMPTS['default'];
    const brand = detectBrand(input.name);
    // Build liquid description: brand color if known, else generic "the same beverage"
    const liquidDesc = brand
      ? `${brand.color} liquid (${brand.style})`
      : 'the same beverage';
    let bevPrompt = bevTemplate
      .replace(/\{name\}/g, input.name)
      .replace(/\{liquid\}/g, liquidDesc);
    if (input.backgroundDescription) bevPrompt += ` Background: ${input.backgroundDescription}.`;
    if (input.restaurantStyleDescription) bevPrompt += ` Lighting and ambiance: ${input.restaurantStyleDescription}.`;
    bevPrompt += ' No text, no watermark, no logo, no human hands, no borders, no illustration.';
    return injectUserInstructions(bevPrompt, input.userInstructions);
  }

  const builder = new PromptBlockBuilder();

  if (mode === 'enhance') {
    // P0 blocks — image roles + style declaration
    addImageMappingBlock(builder, mode, input.hasRestaurantPhoto, true, false, input.hasSiblingImage);
    addStyleDeclarationBlock(builder);
    addEnhanceModeBlocks(builder, input.name, input.description, input.restaurantStyleDescription, input.backgroundDescription);
    addConsistencyBlock(builder, mode, input.hasSiblingImage);
    addRestrictionsBlock(builder);
  } else {
    // P0 blocks — image roles + style declaration (before everything)
    addImageMappingBlock(builder, mode, input.hasRestaurantPhoto, input.hasDishReference, input.hasAmbiancePhoto, input.hasSiblingImage);
    addStyleDeclarationBlock(builder);

    // Restaurant identity — ADN visuel as top priority
    addRestaurantIdentityBlock(builder, input.restaurantStyleDescription, input.cuisineProfile);

    // Subject cluster
    addNegativeBlock(builder, input.description);
    addSubjectBlock(builder, input.name, input.description, input.category, input.cuisineProfile);
    addQuantityBlock(builder, input.name, input.description);

    // Context
    addCulturalBlock(builder, input.cuisineProfile, input.cuisineTypes, input.restaurantType, input.gastroLevel);

    // Visual specification
    addPlatingAndSurfaceBlock(builder, input.category, input.backgroundDescription, input.restaurantStyleDescription);
    addCameraBlock(builder, input.category);
    addLightingBlock(builder, mode, input.restaurantStyleDescription, input.cuisineProfile);
    addMicroTexturesBlock(builder, input.category);

    if (mode === 'styled') {
      addAdaptiveContextBlock(builder, input.hasRestaurantPhoto, input.hasDishReference, input.hasAmbiancePhoto, input.category);
    }

    const enrichedStyle = [input.restaurantStyleDescription, input.restaurantType,
      input.cuisineProfile ? buildCuisineProfileContext(input.cuisineProfile) : '',
      input.cuisineTypes?.length ? `Restaurant cuisine types: ${input.cuisineTypes.join(', ')}.` : '',
    ].filter(Boolean).join('. ');
    addConsistencyBlock(builder, mode, input.hasSiblingImage, enrichedStyle);
    addRestrictionsBlock(builder);
  }

  let prompt = builder.build();

  // Style template — invariant prefix for batch consistency
  if (input.styleTemplate) {
    const parts: string[] = [];
    if (input.styleTemplate.lighting) parts.push(`Lighting: ${input.styleTemplate.lighting}`);
    if (input.styleTemplate.surface) parts.push(`Surface: ${input.styleTemplate.surface}`);
    if (input.styleTemplate.palette) parts.push(`Palette: ${input.styleTemplate.palette}`);
    if (input.styleTemplate.mood) parts.push(`Mood: ${input.styleTemplate.mood}`);
    if (parts.length > 0) {
      prompt = `[STYLE GUIDE — INVARIANT FOR ALL DISHES]\n${parts.join('. ')}.\nEvery dish in this menu MUST maintain these visual invariants.\n\n${prompt}`;
    }
  }

  return injectUserInstructions(prompt, input.userInstructions);
}

// ─── Aspect ratio by category ──────────────────────────────────────────────

const CATEGORY_ASPECT_RATIO: Record<string, '1024x1024' | '1536x1024' | '1024x1536'> = {
  burger: '1024x1536', smash_burger: '1024x1536',
  boisson: '1024x1536', cocktail: '1024x1536',
  glace: '1024x1536', wrap: '1024x1536',
  pokebowl: '1536x1024', bowl: '1536x1024',
  salade: '1536x1024', pizza: '1536x1024', naan: '1536x1024',
};

function getAspectRatio(category: string): '1024x1024' | '1536x1024' | '1024x1536' {
  return CATEGORY_ASPECT_RATIO[normalizeCategory(category)] || '1024x1024';
}

function resolveApiParams(
  category: string, mode: GenerationMode, hasStyleImages: boolean,
  isAnchor: boolean, dishQuality?: string,
): ResolvedApiParams {
  let quality: 'low' | 'medium' | 'high' = 'medium';
  if (mode === 'enhance') quality = 'high';
  else if (isAnchor) quality = 'high';
  else if (dishQuality === 'premium') quality = 'high';

  return {
    size: getAspectRatio(category),
    quality,
    ...(hasStyleImages ? { input_fidelity: 'high' as const } : {}),
    output_format: 'webp',
  };
}

// ============================================================================
// RATE LIMIT CHECK
// ============================================================================

async function checkRateLimit(userId: string, imageCount: number, supabaseUrl: string, supabaseKey: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/check_and_increment_usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      p_user_id: userId,
      p_action_type: 'image_generation',
      p_limit: 50
    })
  });

  if (!response.ok) {
    console.error('Rate limit check failed:', response.status);
    // Fail closed — deny request when rate limit service is unavailable
    return { allowed: false, current_count: 0, limit: 50, remaining: 0 };
  }

  const result = await response.json();

  if (result.remaining < imageCount) {
    return { ...result, allowed: false };
  }

  return result;
}

// ============================================================================
// EDGE FUNCTION
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // QA-CHECKED: Auth JWT vérifiée — userId vient du token, pas du body
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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration serveur incomplète' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const body = await req.json();
    const { dishes, restaurantType, gastroLevel } = body;

    // QA-CHECKED: userId from JWT, not from body (prevents spoofing)
    const resolvedUserId = user.id;

    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun plat fourni' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (supabaseUrl && supabaseKey) {
      const rateLimitCheck = await checkRateLimit(resolvedUserId, dishes.length, supabaseUrl, supabaseKey);
      if (!rateLimitCheck.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Limite atteinte (${rateLimitCheck.current_count}/${rateLimitCheck.limit})`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
    }

    // ── Server-side credit check & atomic decrement ──
    // Credits are deducted BEFORE generation to prevent race conditions
    const creditCheck = await supabase.rpc('decrement_credits', {
      p_user_id: resolvedUserId,
      p_count: dishes.length
    });

    if (creditCheck.error) {
      console.error('Credit check RPC error:', creditCheck.error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur lors de la vérification des crédits' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const creditResult = creditCheck.data as { success: boolean; error?: string; remaining: number };
    if (!creditResult.success) {
      const msg = creditResult.error === 'insufficient_credits'
        ? `Crédits insuffisants (${creditResult.remaining} restants, ${dishes.length} requis)`
        : 'Compte crédits introuvable — veuillez vous reconnecter';
      return new Response(
        JSON.stringify({ success: false, error: msg, credits_remaining: creditResult.remaining }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
      );
    }

    console.log(`Credits OK: ${creditResult.remaining} remaining after deducting ${dishes.length}`);
    console.log(`Processing ${dishes.length} dishes...`);

    const results: { dishId: string; imageUrl: string | null; error?: string }[] = [];
    const PARALLEL_BATCH_SIZE = 3;

    // Style lock — first generated image serves as visual reference for batch consistency
    let firstGeneratedImageBase64: string | null = null;

    // ── Pre-fetch shared restaurant photo once (cover URL → Google photo fallback) ──
    let sharedRestaurantPhotoBase64 = '';
    const firstCoverUrl = dishes.find((d: { restaurantCoverUrl?: string }) => d.restaurantCoverUrl)?.restaurantCoverUrl;
    // Fallback: if no cover URL, use first Google photo from any dish
    const firstGooglePhotoUrl = !firstCoverUrl
      ? dishes.find((d: { googlePhotoUrls?: string[] }) => d.googlePhotoUrls?.length)?.googlePhotoUrls?.[0]
      : undefined;
    const photoUrlToFetch = firstCoverUrl || firstGooglePhotoUrl;
    if (photoUrlToFetch && isAllowedImageUrl(photoUrlToFetch)) {
      try {
        const coverController = new AbortController();
        const coverTimeout = setTimeout(() => coverController.abort(), 10_000);
        const imgResponse = await fetch(photoUrlToFetch, { signal: coverController.signal });
        clearTimeout(coverTimeout);
        if (imgResponse.ok) {
          const buffer = await imgResponse.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          sharedRestaurantPhotoBase64 = btoa(binary);
          console.log(`✅ Restaurant photo pré-fetched (${firstCoverUrl ? 'cover' : 'google'}) une seule fois`);
        }
      } catch (e) {
        console.warn(`⚠️ Pre-fetch restaurant photo failed: ${e}`);
      }
    }

    // ── Helper: process a single dish ──
    // deno-lint-ignore no-explicit-any
    async function processOneDish(dish: any, siblingForBatch: string) {
      try {
        // Fetch dish reference image if needed (sourceImageUrl = CDN, dishReferenceUrl = restaurant's own)
        let finalDishReferenceBase64 = dish.dishReferenceBase64 || '';
        const dishImageUrl = dish.sourceImageUrl || dish.dishReferenceUrl;
        if (!finalDishReferenceBase64 && dishImageUrl && isAllowedImageUrl(dishImageUrl)) {
          try {
            const imgController = new AbortController();
            const imgTimeout = setTimeout(() => imgController.abort(), 10_000);
            const imgResponse = await fetch(dishImageUrl, { signal: imgController.signal });
            clearTimeout(imgTimeout);
            if (imgResponse.ok) {
              const buffer = await imgResponse.arrayBuffer();
              const bytes = new Uint8Array(buffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              finalDishReferenceBase64 = btoa(binary);
              console.log(`✅ Image source récupérée : ${dishImageUrl.substring(0, 60)}...`);
            }
          } catch (e) {
            console.warn(`⚠️ Image source fetch failed for ${dish.name}: ${e}`);
          }
        }

        // Use pre-fetched restaurant photo (or per-dish override)
        const finalRestaurantPhotoBase64 = dish.restaurantPhotoBase64 || sharedRestaurantPhotoBase64;

        const hasStyleImages = !!(finalDishReferenceBase64 || finalRestaurantPhotoBase64 || dish.ambiancePhotoBase64);
        console.log(`Processing: ${dish.name} | mode: ${hasStyleImages ? 'style-images (/edits)' : 'text-only (/generations)'}`);

        const isAnchor = !siblingForBatch && !dish.isEnhance;
        const siblingBase64 = dish.siblingImageBase64
          || (!dish.isEnhance && siblingForBatch ? siblingForBatch : '');
        const hasRestaurant = !!finalRestaurantPhotoBase64;
        const hasDishRef = !!finalDishReferenceBase64;
        const hasAmbiance = !!dish.ambiancePhotoBase64;

        const prompt = buildPromptForDish({
          name: dish.name,
          category: dish.category,
          description: dish.description,
          style: dish.style,
          restaurantStyleDescription: dish.restaurantStyleDescription,
          backgroundDescription: dish.backgroundDescription,
          tailles: dish.tailles,
          cuisineProfile: dish.cuisineProfile,
          cuisineTypes: dish.cuisineTypes,
          restaurantType,
          gastroLevel,
          isEnhance: dish.isEnhance,
          userInstructions: dish.userInstructions,
          hasRestaurantPhoto: hasRestaurant,
          hasDishReference: hasDishRef,
          hasAmbiancePhoto: hasAmbiance,
          hasSiblingImage: !!siblingBase64,
          styleTemplate: dish.styleTemplate,
        });

        console.log(`Prompt: ${prompt}`);

        const mode: GenerationMode = dish.isEnhance && hasStyleImages ? 'enhance'
          : hasStyleImages ? 'styled' : 'generation';
        const apiParams = resolveApiParams(dish.category, mode, hasStyleImages, isAnchor, dish.quality);

        let imageUrl: string;
        if (hasStyleImages) {
          imageUrl = await generateWithStyleImages(
            prompt, OPENAI_API_KEY!, finalDishReferenceBase64,
            finalRestaurantPhotoBase64, dish.ambiancePhotoBase64 || '',
            apiParams.quality, siblingBase64, apiParams.size,
            apiParams.input_fidelity, apiParams.output_format, !!dish.isEnhance,
          );
        } else {
          imageUrl = await generateWithTextOnly(
            prompt, OPENAI_API_KEY!, apiParams.size,
            apiParams.quality, apiParams.output_format,
          );
        }

        console.log(`✅ Done: ${dish.name}`);
        return { dishId: dish.id, imageUrl };
      } catch (dishError: unknown) {
        const msg = dishError instanceof Error ? dishError.message : "Erreur inconnue";
        console.error(`❌ Error processing ${dish.name}: ${msg}`);
        return {
          dishId: dish.id,
          imageUrl: null,
          error: dish.isEnhance ? "enhance_failed" : "generation_failed",
        };
      }
    }

    // ── Phase 1: Anchor — generate first non-enhance dish alone to establish style lock ──
    const anchorIndex = dishes.findIndex((d: { isEnhance?: boolean }) => !d.isEnhance);

    if (anchorIndex >= 0) {
      console.log(`🔒 Phase 1: Generating anchor image (${dishes[anchorIndex].name})...`);
      const anchorResult = await processOneDish(dishes[anchorIndex], '');
      results.push(anchorResult);

      if (anchorResult.imageUrl?.startsWith('data:')) {
        firstGeneratedImageBase64 = anchorResult.imageUrl;
        console.log(`🔒 Style lock captured — batch reference set`);
      }
    }

    // ── Phase 2: Remaining dishes in parallel batches of PARALLEL_BATCH_SIZE ──
    const remainingDishes = dishes.filter((_: unknown, i: number) => i !== anchorIndex);

    if (remainingDishes.length > 0) {
      const siblingRef = firstGeneratedImageBase64 || '';
      console.log(`⚡ Phase 2: ${remainingDishes.length} dishes in parallel (batches of ${PARALLEL_BATCH_SIZE})...`);

      for (let i = 0; i < remainingDishes.length; i += PARALLEL_BATCH_SIZE) {
        const batch = remainingDishes.slice(i, i + PARALLEL_BATCH_SIZE);
        const batchNum = Math.floor(i / PARALLEL_BATCH_SIZE) + 1;
        console.log(`  Batch ${batchNum}: ${batch.map((d: { name: string }) => d.name).join(', ')}`);

        const batchResults = await Promise.allSettled(
          // deno-lint-ignore no-explicit-any
          batch.map((dish: any) => processOneDish(dish, siblingRef))
        );

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error('Unexpected batch rejection:', result.reason);
          }
        }
      }
    }

    console.log(`✅ All done: ${results.filter(r => r.imageUrl).length}/${results.length} images generated`);

    return new Response(
      JSON.stringify({ success: true, images: results, count: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    // QA-CHECKED: Typage error + messages safe pour le client
    const rawMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('💥 Edge function error:', error)
    // Messages user-friendly passent tels quels, sinon message générique
    const safePatterns = ['Timeout', 'Limite', 'Aucun plat', 'réseau', 'politique de contenu', 'génération']
    const isSafe = safePatterns.some(p => rawMessage.includes(p))
    return new Response(
      JSON.stringify({ success: false, error: isSafe ? rawMessage : 'Erreur lors de la génération d\'images' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});