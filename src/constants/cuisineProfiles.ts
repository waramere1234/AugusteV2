// ── Cuisine Profiles ─────────────────────────────────────────────────────────
// Deuxième dimension de la génération d'images :
//   CATEGORY_STYLES (dans generate-dish-photo) = QUOI (burger, sandwich, dessert)
//   CUISINE_PROFILES                           = OÙ  (kebab, boulangerie, gastro)
//
// Chaque catégorie du menu se voit assigner un cuisine_profile.
// Le prompt combine les deux pour des images culturellement précises.
// ─────────────────────────────────────────────────────────────────────────────

export interface CuisineProfile {
  id: string;
  emoji: string;
  label: string;           // Nom affiché dans l'UI (FR)
  bread: string;           // Type de pain/base par défaut
  serving: string;         // Contenant/service typique
  sauce: string;           // Sauces / condiments typiques
  ambiance: string;        // Ambiance visuelle globale
  cultural_context: string; // Instruction culturelle pour le prompt IA
}

export const CUISINE_PROFILES: CuisineProfile[] = [
  // ── Street food & Fast-casual ──────────────────────────────────────────────
  {
    id: 'kebab',
    emoji: '🥙',
    label: 'Kebab / Turc',
    bread: 'pain turc (galette turque moelleuse) ou pain pita épais',
    serving: 'barquette aluminium, papier kraft, ou assiette simple',
    sauce: 'sauce blanche, sauce samouraï, sauce harissa',
    ambiance: 'warm street food lighting, casual fast-food atmosphere, vibrant and hearty',
    cultural_context: 'Turkish/French kebab shop. "Tacos" means FRENCH TACOS (grilled closed tortilla with meat, fries, and melted cheese sauce). Sandwiches use Turkish bread (galette), not baguette. Generous portions, melted cheese, grilled meat.',
  },
  {
    id: 'burger',
    emoji: '🍔',
    label: 'Burger',
    bread: 'brioche bun doré avec graines de sésame',
    serving: 'papier kraft, planche ardoise, ou panier métallique',
    sauce: 'ketchup, sauce burger maison, cheddar fondu',
    ambiance: 'dark moody lighting, American diner or modern burger joint vibe',
    cultural_context: 'Burger restaurant. Brioche buns, smashed or classic patties. Melted cheese dripping. American-style or gourmet burger presentation.',
  },
  {
    id: 'pizza',
    emoji: '🍕',
    label: 'Pizzeria',
    bread: 'pâte à pizza fine ou napolitaine (bord gonflé, charred)',
    serving: 'planche en bois ronde, assiette plate, ou carton pizza',
    sauce: 'sauce tomate, huile d\'olive, basilic frais',
    ambiance: 'warm rustic Italian trattoria, wood-fired oven glow, casual Mediterranean',
    cultural_context: 'Italian pizzeria. Wood-fired style, authentic Italian presentation. Calzones, antipasti, bruschetta follow Italian tradition.',
  },
  {
    id: 'tacos_fr',
    emoji: '🌯',
    label: 'Tacos Français',
    bread: 'tortilla de blé grillée et fermée (panini-press style, golden grill marks)',
    serving: 'papier kraft, barquette, emballage aluminium',
    sauce: 'sauce fromagère fondue, sauce algérienne, sauce blanche',
    ambiance: 'urban street food, bold fast-casual, generous and indulgent',
    cultural_context: 'French tacos restaurant. IMPORTANT: "Tacos" here is a FRENCH TACOS — a large grilled closed wheat tortilla filled with meat, fries, and melted cheese sauce. NOT Mexican tacos. Always show as a closed, pressed, golden-brown grilled wrap.',
  },
  {
    id: 'riz_crousty',
    emoji: '🍚',
    label: 'Riz Crousty',
    bread: 'base de riz blanc',
    serving: 'box noire ou container takeaway, bol noir',
    sauce: 'sauce fromagère blanche, sauce piquante orange, zigzag pattern',
    ambiance: 'modern street food, ASMR-style close-up, bold contrast black container',
    cultural_context: 'Crispy rice (riz crousty) restaurant. White rice base topped with golden crispy breaded chicken, dual sauce drizzle (white cheese + spicy orange) in zigzag pattern. Trendy French street food concept.',
  },
  {
    id: 'sandwich_boulangerie',
    emoji: '🥖',
    label: 'Boulangerie / Sandwicherie',
    bread: 'baguette tradition croustillante ou pain de campagne',
    serving: 'papier kraft, planche en bois, vitrine boulangerie',
    sauce: 'beurre, moutarde, mayonnaise maison',
    ambiance: 'warm natural light, artisan bakery atmosphere, rustic French charm',
    cultural_context: 'French bakery/sandwich shop. Sandwiches use traditional baguette or country bread. Classic French fillings (jambon-beurre, poulet crudités). Pastries and viennoiseries in artisan bakery style.',
  },
  {
    id: 'poulet_frit',
    emoji: '🍗',
    label: 'Poulet Frit / Chicken',
    bread: 'pain burger moelleux ou sans pain (poulet seul)',
    serving: 'bucket, barquette kraft, panier métallique avec papier',
    sauce: 'sauce BBQ, honey mustard, sauce piquante',
    ambiance: 'bold fast-food style, crispy textures, American fried chicken vibe',
    cultural_context: 'Fried chicken restaurant. Golden crispy coating, crunchy texture visible. Served in buckets, baskets, or boxes. Bold, generous, American-style presentation.',
  },
  {
    id: 'fish_and_chips',
    emoji: '🐟',
    label: 'Fish & Chips',
    bread: 'pas de pain — pané croustillant doré',
    serving: 'cornet de papier journal ou barquette kraft',
    sauce: 'tartar sauce, vinaigre de malt, citron',
    ambiance: 'British pub atmosphere, casual and hearty, golden fried tones',
    cultural_context: 'Fish and chips shop. Golden crispy battered fish, thick-cut chips. Served in newspaper cone or kraft tray. British pub style.',
  },
  {
    id: 'hot_dog',
    emoji: '🌭',
    label: 'Hot-Dog',
    bread: 'pain à hot-dog vapeur moelleux',
    serving: 'barquette kraft, papier aluminium, plateau street food',
    sauce: 'moutarde américaine, ketchup, oignons frits',
    ambiance: 'American street food cart, colorful toppings, fun casual vibe',
    cultural_context: 'Hot dog stand/restaurant. Steamed soft buns, sausage extending past the bun. American-style toppings.',
  },

  // ── Asie ────────────────────────────────────────────────────────────────────
  {
    id: 'japonais',
    emoji: '🍣',
    label: 'Japonais',
    bread: 'riz à sushi vinaigré, pas de pain',
    serving: 'plateau noir laqué, céramique noire, planche en bois de bambou',
    sauce: 'sauce soja, wasabi, gingembre mariné',
    ambiance: 'minimalist Japanese aesthetic, dark surfaces, zen elegance, precise arrangement',
    cultural_context: 'Japanese restaurant. Sushi, sashimi, ramen, bento. Minimalist precise presentation. Black ceramics, bamboo, chopsticks. Clean, zen aesthetic.',
  },
  {
    id: 'chinois',
    emoji: '🥡',
    label: 'Chinois',
    bread: 'riz blanc, nouilles, baozi (brioche vapeur)',
    serving: 'bol profond en céramique, boîte takeaway, assiette ronde',
    sauce: 'sauce soja, sauce aigre-douce, huile de sésame',
    ambiance: 'warm golden lighting, bustling Chinese restaurant feel, steam and wok hei',
    cultural_context: 'Chinese restaurant. Wok-fried dishes, dim sum, noodle soups. Deep bowls, chopsticks. Steam rising, glossy sauce, vibrant stir-fry colors.',
  },
  {
    id: 'thai',
    emoji: '🍜',
    label: 'Thaïlandais',
    bread: 'riz jasmin, nouilles de riz',
    serving: 'bol en bois ou céramique, assiette avec feuille de bananier',
    sauce: 'curry (vert, rouge, jaune), sauce pad thai, lait de coco',
    ambiance: 'vibrant tropical colors, warm golden light, fresh herbs, aromatic feel',
    cultural_context: 'Thai restaurant. Curries, pad thai, som tam. Fresh herbs (basil, cilantro, lime). Colorful, aromatic, served in bowls with jasmine rice.',
  },
  {
    id: 'vietnamien',
    emoji: '🍲',
    label: 'Vietnamien',
    bread: 'bánh mì (baguette vietnamienne croustillante), nouilles de riz',
    serving: 'bol profond pour phở, assiette plate, panier en bambou',
    sauce: 'nuoc mam, sauce hoisin, sriracha',
    ambiance: 'light and fresh, clear broth, abundant fresh herbs, delicate and aromatic',
    cultural_context: 'Vietnamese restaurant. Phở, bánh mì, bò bún, nems. Fresh herbs (mint, cilantro, basil), bean sprouts, lime. Clear aromatic broth, light and healthy aesthetic.',
  },
  {
    id: 'coreen',
    emoji: '🍱',
    label: 'Coréen',
    bread: 'riz blanc, pas de pain',
    serving: 'bol en pierre chauffé (dolsot), petits plats banchan, plateau compartimenté',
    sauce: 'gochujang, sauce soja coréenne, kimchi',
    ambiance: 'warm hearty feel, sizzling hot stone bowl, colorful banchan array',
    cultural_context: 'Korean restaurant. Bibimbap, Korean BBQ, japchae, kimchi. Stone bowls, banchan side dishes. Sizzling, colorful, generous.',
  },
  {
    id: 'indien',
    emoji: '🍛',
    label: 'Indien',
    bread: 'naan, chapati, riz basmati',
    serving: 'thali (plateau compartimenté), bol en inox, plat en cuivre',
    sauce: 'curry onctueux, raita, chutney de mangue',
    ambiance: 'rich warm spice colors (turmeric, saffron), aromatic and inviting, copper accents',
    cultural_context: 'Indian restaurant. Curries, tandoori, biryani, naan. Rich creamy sauces, vibrant spice colors. Copper/steel bowls, naan bread, basmati rice.',
  },
  {
    id: 'asiatique_fusion',
    emoji: '🥢',
    label: 'Asiatique Fusion',
    bread: 'bao buns, riz, nouilles variées',
    serving: 'céramique moderne, bol design, planche en ardoise',
    sauce: 'sauce teriyaki, mayo sriracha, ponzu',
    ambiance: 'modern sleek dark surfaces, neon accents, urban contemporary Asian',
    cultural_context: 'Asian fusion restaurant. Modern mix of Japanese, Chinese, Thai, Korean influences. Sleek modern presentation, creative plating, contemporary urban vibe.',
  },
  {
    id: 'bubble_tea',
    emoji: '🧋',
    label: 'Bubble Tea',
    bread: 'pas de pain — boissons uniquement',
    serving: 'gobelet transparent avec couvercle dôme, paille large',
    sauce: 'sirop de fruits, lait, perles de tapioca',
    ambiance: 'pastel colors, kawaii aesthetic, bright and playful, Instagram-worthy',
    cultural_context: 'Bubble tea shop. Transparent cups showing colorful layers, visible tapioca pearls at bottom. Bright pastel aesthetic, dome lid, wide straw. Clean modern presentation.',
  },

  // ── Méditerranée & Moyen-Orient ─────────────────────────────────────────────
  {
    id: 'libanais',
    emoji: '🧆',
    label: 'Libanais',
    bread: 'pain pita fin et moelleux, pain libanais (marqué)',
    serving: 'grande assiette à partager, plateau de mezzé, bol en terre cuite',
    sauce: 'houmous, tahini, toum (ail), labneh',
    ambiance: 'warm Mediterranean colors, generous sharing plates, rustic clay and wood',
    cultural_context: 'Lebanese restaurant. Mezze, shawarma, falafel, manouché. Generous sharing plates, pita bread, tahini drizzle. Warm rustic Mediterranean presentation.',
  },
  {
    id: 'turc',
    emoji: '🫓',
    label: 'Turc',
    bread: 'pain pide (bateau), pain lavash, simit',
    serving: 'plateau en cuivre, assiette en terre cuite, grill',
    sauce: 'yaourt, sumac, piment d\'Alep, grenade',
    ambiance: 'warm copper tones, grilled marks, aromatic spices, generous',
    cultural_context: 'Turkish restaurant. Kebabs, pide, lahmacun, grills. Copper trays, terracotta plates. Charred grill marks, warm spice colors.',
  },
  {
    id: 'grec',
    emoji: '🫒',
    label: 'Grec',
    bread: 'pain pita grec (épais, grillé)',
    serving: 'assiette blanche/bleue, papier kraft pour gyros, plat en terre cuite',
    sauce: 'tzatziki, huile d\'olive, citron, origan',
    ambiance: 'Mediterranean blue and white, sun-drenched, fresh olive oil glow',
    cultural_context: 'Greek restaurant. Gyros, souvlaki, Greek salad, moussaka. Blue/white aesthetics, thick pita, tzatziki. Fresh Mediterranean sun-kissed feel.',
  },
  {
    id: 'marocain',
    emoji: '🫕',
    label: 'Marocain',
    bread: 'pain marocain rond (khobz), msemen',
    serving: 'tajine en terre cuite avec couvercle conique, plat en céramique peinte',
    sauce: 'chermoula, harissa, preserved lemon',
    ambiance: 'warm earthy tones, ornate zellige tiles, aromatic steam from tagine',
    cultural_context: 'Moroccan restaurant. Tagine, couscous, pastilla, harira. Terracotta tagine pot, ornate ceramics, colorful spices. Warm, fragrant, generous.',
  },
  {
    id: 'italien',
    emoji: '🍝',
    label: 'Italien',
    bread: 'focaccia, ciabatta, grissini',
    serving: 'assiette en céramique rustique, planche en bois d\'olivier',
    sauce: 'sauce tomate San Marzano, pesto, huile d\'olive extra vierge',
    ambiance: 'warm rustic Italian trattoria, terracotta, olive wood, sun-drenched Tuscany feel',
    cultural_context: 'Italian restaurant. Pasta, risotto, antipasti, tiramisu. Rustic ceramics, olive wood boards. Basil, parmesan, olive oil. Warm Mediterranean light.',
  },
  {
    id: 'espagnol',
    emoji: '🦐',
    label: 'Espagnol / Tapas',
    bread: 'pan con tomate, pain cristal',
    serving: 'petites assiettes en terre cuite (cazuelas), planche à partager',
    sauce: 'aïoli, romesco, huile d\'olive pimentée',
    ambiance: 'warm rustic tavern, small sharing plates, convivial and colorful',
    cultural_context: 'Spanish restaurant. Tapas, paella, pintxos, patatas bravas. Small sharing plates, cazuelas en terre cuite. Convivial, colorful, Mediterranean warmth.',
  },

  // ── Français ────────────────────────────────────────────────────────────────
  {
    id: 'bistro',
    emoji: '🍷',
    label: 'Bistrot',
    bread: 'baguette tradition, pain de campagne',
    serving: 'assiette blanche classique, nappe à carreaux, ardoise',
    sauce: 'sauce au vin, béarnaise, beurre maître d\'hôtel',
    ambiance: 'warm Parisian bistro, zinc bar, checkered tablecloth, cozy golden light',
    cultural_context: 'French bistro. Plat du jour, steak-frites, crème brûlée. White ceramic plates, classic French plating. Warm Parisian brasserie atmosphere.',
  },
  {
    id: 'gastronomique',
    emoji: '⭐',
    label: 'Gastronomique',
    bread: 'pain artisanal de chef, pas de pain visible sur l\'assiette',
    serving: 'grande assiette blanche en porcelaine fine, bord doré',
    sauce: 'jus réduit, émulsion, coulis en points précis',
    ambiance: 'dark elegant matte slate, precise lighting, fine dining, Michelin-star feel',
    cultural_context: 'Fine dining / gastronomic restaurant. Precise artistic plating, wide white plates, micro-portions. Jus reduction dots, edible flowers only if intentional. Elegant, refined, minimalist.',
  },
  {
    id: 'creperie',
    emoji: '🥞',
    label: 'Crêperie',
    bread: 'crêpe fine au froment, galette de sarrasin',
    serving: 'assiette ronde, billig (crêpière), planche en bois',
    sauce: 'beurre salé, caramel au beurre salé, cidre',
    ambiance: 'warm Breton cottage feel, rustic wood, cozy and traditional',
    cultural_context: 'French crêperie. Thin crêpes (sweet) and galettes de sarrasin (savory). Folded or rolled presentation. Breton tradition, rustic warm atmosphere.',
  },
  {
    id: 'brasserie',
    emoji: '🍽️',
    label: 'Brasserie',
    bread: 'baguette, pain de seigle',
    serving: 'assiette blanche large, plateau de fruits de mer, nappe blanche',
    sauce: 'mayonnaise, aïoli, beurre citronné',
    ambiance: 'classic French brasserie, white tablecloth, elegant but relaxed, Art Deco accents',
    cultural_context: 'French brasserie. Choucroute, plateau de fruits de mer, steak tartare. Classic elegant white plates, white tablecloth. Art Deco atmosphere, refined but casual.',
  },

  // ── Mexicain & Latino ──────────────────────────────────────────────────────
  {
    id: 'mexicain',
    emoji: '🌮',
    label: 'Mexicain',
    bread: 'tortilla de maïs (small, soft, doubled), tortilla de blé pour burritos',
    serving: 'assiette colorée en céramique, panier avec papier, lime wedge',
    sauce: 'salsa verde, guacamole, crema, pico de gallo',
    ambiance: 'vibrant warm colors, rustic painted ceramics, festive and colorful',
    cultural_context: 'Mexican restaurant. IMPORTANT: "Tacos" here means AUTHENTIC MEXICAN TACOS — small open corn tortillas topped with meat, cilantro, onion, and lime. NOT French tacos. Burritos, quesadillas, guacamole. Colorful, fresh, festive.',
  },
  {
    id: 'bresilien',
    emoji: '🥩',
    label: 'Brésilien',
    bread: 'pão de queijo, farofa',
    serving: 'espeto (brochette), assiette large, planche à découper',
    sauce: 'chimichurri, vinaigrette, farofa',
    ambiance: 'warm churrascaria glow, grilled meats, generous and festive',
    cultural_context: 'Brazilian restaurant. Churrasco, feijoada, açaí. Grilled meats on skewers, generous portions. Warm festive atmosphere.',
  },
  {
    id: 'peruvien',
    emoji: '🐙',
    label: 'Péruvien',
    bread: 'pas de pain standard — maïs, pommes de terre',
    serving: 'assiette moderne blanche, bol en céramique',
    sauce: 'leche de tigre, ají amarillo, huancaína',
    ambiance: 'fresh coastal feel, vibrant citrus colors, modern Latin fusion',
    cultural_context: 'Peruvian restaurant. Ceviche, lomo saltado, causa. Fresh citrus-forward flavors, colorful modern plating. Coastal, vibrant, contemporary.',
  },

  // ── Afrique & Antilles ─────────────────────────────────────────────────────
  {
    id: 'africain',
    emoji: '🍲',
    label: 'Africain',
    bread: 'attiéké, foutou, semoule, injera (éthiopien)',
    serving: 'grande assiette à partager, bol profond, feuille de bananier',
    sauce: 'sauce arachide (mafé), sauce gombo, sauce tomate épicée',
    ambiance: 'warm earthy rich colors, generous family-style portions, vibrant and hearty',
    cultural_context: 'African restaurant. Mafé, yassa, thiéboudienne, attiéké. Generous portions, rich sauces, communal sharing style. Warm earth tones, hearty and vibrant.',
  },
  {
    id: 'antillais',
    emoji: '🌴',
    label: 'Antillais / Caribéen',
    bread: 'pain maison antillais, bokit (pain frit)',
    serving: 'assiette colorée, barquette, feuille de bananier',
    sauce: 'sauce chien, sauce colombo, piment',
    ambiance: 'tropical vibrant colors, Caribbean warmth, lush and festive',
    cultural_context: 'Caribbean/Antillean restaurant. Colombo, accras, boudin, poulet boucané. Tropical colors, banana leaf, plantain. Vibrant, generous, island warmth.',
  },

  // ── Autres concepts ────────────────────────────────────────────────────────
  {
    id: 'poke_bowl',
    emoji: '🥗',
    label: 'Poké / Bowl',
    bread: 'base riz sushi ou quinoa',
    serving: 'large bol rond vu du dessus, disposition géométrique en sections',
    sauce: 'sauce soja sucrée, mayo sriracha, ponzu, sésame',
    ambiance: 'bright healthy aesthetic, overhead shot, colorful geometric arrangement',
    cultural_context: 'Poke/bowl restaurant. Ingredients arranged in neat geometric sections, overhead view. Fresh, colorful, healthy. Hawaiian-inspired or açaí bowls.',
  },
  {
    id: 'brunch',
    emoji: '🥞',
    label: 'Brunch / Breakfast',
    bread: 'pain de mie toasté, pancakes, brioche, bagel',
    serving: 'grande assiette composée, planche en bois, mug en céramique',
    sauce: 'sirop d\'érable, hollandaise, confiture artisanale',
    ambiance: 'bright warm morning light, cozy cafe atmosphere, Instagram-worthy abundance',
    cultural_context: 'Brunch restaurant. Eggs benedict, pancakes, avocado toast, French toast. Abundant composed plates, morning golden light. Cozy, photogenic, generous.',
  },
  {
    id: 'cafe',
    emoji: '☕',
    label: 'Café / Salon de thé',
    bread: 'pâtisseries, viennoiseries, cake',
    serving: 'tasse en céramique, soucoupe, petite assiette à dessert',
    sauce: 'latte art, chocolat chaud, crème fouettée',
    ambiance: 'cozy warm interior, soft natural light, intimate cafe atmosphere',
    cultural_context: 'Cafe/tea room. Coffee drinks, pastries, light snacks. Ceramic cups, saucers, cake stands. Cozy, intimate, warm natural light. NO TEXT on drink surfaces.',
  },
  {
    id: 'fruits_de_mer',
    emoji: '🦞',
    label: 'Fruits de Mer',
    bread: 'pain de seigle, blinis',
    serving: 'plateau de fruits de mer sur glace pilée, assiette blanche large',
    sauce: 'mayonnaise, mignonette, beurre citronné',
    ambiance: 'coastal fresh atmosphere, crushed ice, ocean blues, elegant seafood display',
    cultural_context: 'Seafood restaurant. Plateaux de fruits de mer, oysters, lobster, fish. Crushed ice, lemon, seaweed garnish. Fresh coastal elegance.',
  },
  {
    id: 'bbq',
    emoji: '🔥',
    label: 'BBQ / Grill',
    bread: 'cornbread, brioche bun, pain de maïs',
    serving: 'planche en bois rustique, plateau métallique, papier kraft',
    sauce: 'sauce BBQ fumée, coleslaw, pickles',
    ambiance: 'smoky rustic atmosphere, charred wood, warm amber tones, hearty portions',
    cultural_context: 'BBQ/grill restaurant. Smoked meats, ribs, pulled pork, brisket. Rustic wood boards, kraft paper. Smoky, charred, generous American BBQ style.',
  },
  {
    id: 'healthy',
    emoji: '🥬',
    label: 'Healthy / Végétarien',
    bread: 'pain complet, wrap aux graines, pas de pain',
    serving: 'bol en bambou, assiette en grès, packaging eco-friendly',
    sauce: 'vinaigrette légère, tahini, houmous',
    ambiance: 'bright natural light, earthy tones, green accents, clean minimalist',
    cultural_context: 'Healthy/vegetarian restaurant. Salads, bowls, smoothies, grain-based dishes. Natural materials, earth tones, green accents. Fresh, clean, plant-forward aesthetic.',
  },
];

// ── Lookup helpers ───────────────────────────────────────────────────────────

/** Map profile ID → CuisineProfile for O(1) access */
export const CUISINE_PROFILE_MAP: Record<string, CuisineProfile> =
  Object.fromEntries(CUISINE_PROFILES.map(p => [p.id, p]));

/** All valid profile IDs (for validation & UI dropdown) */
export const CUISINE_PROFILE_IDS = CUISINE_PROFILES.map(p => p.id);

/** Find profile by ID, fallback to undefined */
export function getCuisineProfile(id: string | null | undefined): CuisineProfile | undefined {
  if (!id) return undefined;
  return CUISINE_PROFILE_MAP[id];
}
