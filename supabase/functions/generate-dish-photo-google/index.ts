// Google Imagen 4 — food photo generation aligned with OpenAI prompt quality
// Deploy: supabase functions deploy generate-dish-photo-google --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const IMAGEN_MODELS = {
  fast: 'imagen-4.0-fast-generate-001',    // $0.02
  standard: 'imagen-4.0-generate-001',      // $0.04
} as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

// ============================================================================
// CATEGORY_STYLES — plating, surface, texture per category
// ============================================================================

const CATEGORY_STYLES: Record<string, {
  angle: string;
  background: string;
  plate_type: string;
  plate_color: string;
  garnish: string;
  texture: string;
}> = {
  pizza: { angle: '90° overhead', background: 'dark rustic stone surface', plate_type: 'round wooden board', plate_color: 'natural warm wood', garnish: 'none', texture: 'bubbling melted cheese, charred crust edges, vibrant toppings' },
  burger: { angle: '45° side angle', background: 'dark textured wood surface', plate_type: 'dark slate board', plate_color: 'dark charcoal', garnish: 'sesame seeds on bun only', texture: 'golden toasted bun, melted cheese dripping, juicy visible patty layers' },
  poutine: { angle: '45° overhead angle', background: 'dark rustic wood surface', plate_type: 'deep ceramic bowl or oval plate', plate_color: 'warm white or natural', garnish: 'none', texture: 'crispy golden fries under melted cheese curds, glossy gravy coating, rustic and hearty' },
  sandwich: { angle: '45° side angle', background: 'light wooden surface', plate_type: 'wooden cutting board', plate_color: 'natural light wood', garnish: 'none', texture: 'toasted bread crust, visible layered fillings, fresh ingredients' },
  pokebowl: { angle: '90° overhead', background: 'white marble surface', plate_type: 'wide ceramic bowl', plate_color: 'clean white', garnish: 'sesame seeds, microgreens, thin lemon slice', texture: 'colorful fresh ingredients neatly arranged in sections, vibrant colors' },
  pasta: { angle: '45° overhead', background: 'warm linen surface', plate_type: 'wide shallow ceramic plate', plate_color: 'off-white cream', garnish: 'fresh parsley or basil, grated parmesan, cracked black pepper', texture: 'glossy sauce coating noodles, al dente texture, steam rising' },
  soupe: { angle: '45° overhead', background: 'dark slate surface', plate_type: 'deep ceramic bowl', plate_color: 'warm white or terracotta', garnish: 'fresh herb sprig, light cream swirl, croutons', texture: 'smooth velvety broth, gentle steam, glossy surface' },
  salade: { angle: '90° overhead', background: 'white marble surface', plate_type: 'wide flat ceramic plate', plate_color: 'pure white', garnish: 'croutons, light dressing drizzle', texture: 'crisp fresh leaves, vibrant colors, glistening light dressing' },
  steak: { angle: '30° low side angle', background: 'dark dramatic slate surface', plate_type: 'dark slate or cast iron plate', plate_color: 'deep black charcoal', garnish: 'fresh thyme sprig, pat of melting herb butter, sea salt flakes', texture: 'dramatic sear marks, juicy pink interior, caramelized crust' },
  viande: { angle: '30° low side angle', background: 'dark warm wood surface', plate_type: 'dark ceramic plate', plate_color: 'deep charcoal', garnish: 'fresh rosemary, jus reduction drizzle', texture: 'golden roasted exterior, tender interior, caramelized surface' },
  poisson: { angle: '45° side angle', background: 'white marble surface', plate_type: 'wide white ceramic plate', plate_color: 'pure white', garnish: 'thin lemon slice, fresh dill or chives, caper berries', texture: 'flaky tender flesh, crispy golden skin, fresh and glistening' },
  dessert: { angle: '45° front angle', background: 'white marble surface', plate_type: 'white ceramic dessert plate', plate_color: 'pure white', garnish: 'powdered sugar dusting, fresh berry, mint leaf', texture: 'delicate layers, rich creamy textures, glossy glaze' },
  gateau: { angle: '45° front angle', background: 'white marble surface', plate_type: 'white marble cake stand or plate', plate_color: 'white marble', garnish: 'fresh fruit slices, edible flowers, powdered sugar', texture: 'moist crumb visible in cross-section, smooth frosting, layered interior' },
  glace: { angle: '45° front angle', background: 'white marble surface', plate_type: 'white ceramic bowl or waffle cone', plate_color: 'clean white', garnish: 'wafer, fresh fruit, chocolate sauce drizzle', texture: 'smooth creamy scoops, slight melting edges, frosty appearance' },
  cocktail: { angle: 'straight-on side angle', background: 'dark marble bar surface', plate_type: 'elegant cocktail glass', plate_color: 'transparent crystal clear', garnish: 'citrus twist, fresh herbs, decorative straw', texture: 'vibrant liquid color, condensation droplets on glass, clear ice cubes' },
  boisson: { angle: 'straight-on side angle', background: 'white or light marble surface', plate_type: 'appropriate glass or cup', plate_color: 'clean transparent or ceramic white', garnish: 'fresh fruit slice, mint sprig, straw if appropriate', texture: 'clear vibrant color, condensation or steam depending on temperature' },
  entree: { angle: '45° overhead angle', background: 'dark linen or slate surface', plate_type: 'elegant white ceramic plate', plate_color: 'pure white', garnish: 'fine sauce dots only if part of the dish', texture: 'precise elegant plating, delicate textures, fine dining presentation' },
  turc: { angle: '45° side angle', background: 'warm terracotta or stone surface', plate_type: 'copper tray or rustic ceramic plate', plate_color: 'warm copper or earthy terracotta', garnish: 'none', texture: 'charred grilled marks, warm spiced colors, rich hearty presentation' },
  kebab_sandwich: { angle: '45° three-quarter angle', background: 'dark wood surface or kraft paper', plate_type: 'kraft paper wrapper or aluminium barquette', plate_color: 'brown kraft or silver aluminium', garnish: 'none — show the sandwich as served', texture: 'Turkish galette bread (soft, slightly charred, puffy), generous shaved meat overflowing, fresh vegetables (tomato, onion, lettuce), white sauce drizzle, hearty generous street food portion' },
  kebab_assiette: { angle: '45° overhead angle', background: 'dark wood or warm stone surface', plate_type: 'large oval plate or aluminium barquette', plate_color: 'white ceramic or silver aluminium', garnish: 'none', texture: 'grilled shaved meat with charred edges, golden fries, fresh side salad, white sauce and hot sauce on the side, generous fast-food portion' },
  doner: { angle: '45° side angle', background: 'warm casual surface, slightly blurred kebab shop interior', plate_type: 'kraft paper or aluminium foil wrap', plate_color: 'kraft brown', garnish: 'none', texture: 'thinly shaved rotisserie meat, stacked high, Turkish flatbread, fresh vegetables visible, sauce dripping, authentic street food' },
  durum: { angle: '45° side angle, cut in half to show cross-section', background: 'kraft paper on dark surface', plate_type: 'kraft paper or aluminium foil', plate_color: 'brown kraft', garnish: 'none', texture: 'tightly rolled thin lavash wrap, visible filling layers in cross-section — shaved meat, fries, vegetables, melted cheese, sauce — generous and overflowing' },
  gastronomique: { angle: '45° overhead angle', background: 'dark matte slate surface', plate_type: 'wide white fine china plate', plate_color: 'pure white with thin gold rim', garnish: 'minimal, only if part of the dish', texture: 'precise elegant plating, delicate textures, artistic composition' },
  french_tacos: { angle: '45° three-quarter angle', background: 'dark brushed metal surface or kraft paper', plate_type: 'kraft paper wrapper or branded paper tray', plate_color: 'brown kraft or black branded', garnish: 'none — show the wrap as-is, pressed and golden', texture: 'golden-brown crispy grilled exterior, visible grill marks, melted cheese oozing at the edge, visible filling layers when cut in half' },
  riz_crousty: { angle: '45° overhead angle', background: 'dark surface or branded container', plate_type: 'black takeaway container or bowl', plate_color: 'matte black', garnish: 'sauce drizzle zigzag pattern on top', texture: 'golden breaded crispy chicken pieces on white rice base, contrasting white creamy sauce and spicy orange sauce drizzled, steam rising, ASMR-style close-up texture detail' },
  loaded_fries: { angle: '45° angle', background: 'dark rustic wood or metal tray', plate_type: 'metal basket lined with kraft paper or paper cone', plate_color: 'metallic or kraft', garnish: 'melted cheese pull, sauce drizzle', texture: 'crispy golden fries generously topped with melted cheese, pulled meat or toppings, fresh herbs, colorful sauce drizzle' },
  smash_burger: { angle: 'straight-on side angle, slightly below eye level', background: 'dark surface with soft bokeh lights behind', plate_type: 'kraft paper or small wooden board', plate_color: 'brown kraft', garnish: 'none — burger speaks for itself', texture: 'thin crispy-edged smashed patty, melted cheese draped perfectly over edges, caramelized onions visible, brioche bun with sesame seeds, sauce dripping slightly' },
  wrap: { angle: '45° side angle', background: 'light wooden surface or kraft paper', plate_type: 'kraft paper wrap or parchment', plate_color: 'natural kraft brown', garnish: 'none', texture: 'tightly rolled tortilla with visible filling at the cut end, fresh colorful ingredients visible in cross-section' },
  bowl: { angle: '90° overhead or slight 75° tilt', background: 'light wood or marble surface', plate_type: 'deep round ceramic bowl', plate_color: 'matte white or earth tone', garnish: 'sesame seeds, fresh herbs on top, lime wedge', texture: 'colorful ingredients beautifully arranged in sections, grain base visible, protein on top, vibrant vegetables' },
  naan: { angle: '45° overhead', background: 'warm terracotta or dark wood', plate_type: 'round copper plate or rustic board', plate_color: 'copper or dark wood', garnish: 'fresh coriander leaves, butter melting', texture: 'soft pillowy naan with charred bubbles, golden brown spots, brushed with melted butter' },
  default: { angle: '45° angle', background: 'neutral dark surface', plate_type: 'clean ceramic plate', plate_color: 'white or neutral', garnish: 'none', texture: 'appetizing professional presentation' },
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
// CUISINE_PROFILE_DATA — cultural context from cuisine profiles
// ============================================================================

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

// ============================================================================
// NORMALIZE CATEGORY — smart resolution: name > style > category
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
// EXTRACT NEGATIVE CONSTRAINTS — "no basilic", "sans tomate", etc.
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
// DETECT ACCOMPANIMENTS
// ============================================================================

interface AccompanimentHint {
  keyword: string;
  inSandwich: string;
  onPlate: string;
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
// EXTRACT QUANTITY INSTRUCTION — "6 nuggets", "duo", "lot de 3", etc.
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
  const namedQty: Record<string, number> = { duo: 2, trio: 3, double: 2, triple: 3 };
  for (const [word, qty] of Object.entries(namedQty)) {
    if (text.includes(word)) return `QUANTITY: Show EXACTLY ${qty} pieces — count them precisely. Not ${qty - 1}, not ${qty + 1}, exactly ${qty}.`;
  }
  return '';
}

// ============================================================================
// ASPECT RATIO — Imagen uses ratio strings, not pixel sizes
// ============================================================================

const CATEGORY_ASPECT_RATIO: Record<string, string> = {
  burger: '3:4', smash_burger: '3:4',
  boisson: '3:4', cocktail: '3:4',
  glace: '3:4', wrap: '3:4',
  pokebowl: '4:3', bowl: '4:3',
  salade: '4:3', pizza: '4:3', naan: '4:3',
};

function getAspectRatio(category: string): string {
  return CATEGORY_ASPECT_RATIO[normalizeCategory(category)] || '1:1';
}

// ============================================================================
// BEVERAGE SYSTEM — templates + format/brand detection (aligned with OpenAI)
// ============================================================================

type BeverageFormat = 'can_33cl' | 'bottle_50cl' | 'bottle_large' | 'glass_only' | 'hot_drink' | 'default';

const BEVERAGE_PROMPTS: Record<BeverageFormat, string> = {
  can_33cl: `A cold {name} aluminum can (33cl) with realistic condensation droplets on the surface, placed next to a clear glass filled with ice cubes and {liquid} poured in. The can is the main subject, the glass is secondary. Studio product photography, slightly below eye level, reflective dark surface.`,
  bottle_50cl: `A {name} glass bottle (50cl) with condensation on the glass, placed next to a tall glass filled with {liquid} and ice. Product photography, straight-on angle, dark reflective surface.`,
  bottle_large: `A {name} large bottle prominently displayed, with a filled glass of {liquid} beside it. Elegant product photography, dark background, subtle rim lighting.`,
  glass_only: `A tall clear glass generously filled with {liquid}, ice cubes visible, condensation on the glass exterior. Fresh, appetizing. Straight-on angle, soft neutral background.`,
  hot_drink: `A ceramic cup filled with {name}, gentle steam rising from the surface. Top-down 45° angle. Warm cozy lighting, wood or marble surface. Latte art if appropriate.`,
  default: `A refreshing {name} served in an appropriate glass filled with {liquid}. Condensation droplets, appetizing presentation. Product photography, clean background.`,
};

// deno-lint-ignore no-explicit-any
function detectBeverageFormat(name: string, description: string, tailles?: any[]): BeverageFormat {
  const text = `${name} ${description}`.toLowerCase();
  const tailleLabels = (tailles || []).map((t: { label: string }) => t.label?.toLowerCase() || '').join(' ');
  const all = `${text} ${tailleLabels}`;
  if (/\b(thé|the|café|coffee|chocolat chaud|cappuccino|latte|espresso|infusion)\b/.test(all)) return 'hot_drink';
  if (/\b(canette|can|33\s*cl)\b/.test(all)) return 'can_33cl';
  if (/\b(bouteille|bottle|50\s*cl)\b/.test(all)) return 'bottle_50cl';
  if (/\b(1\s*[.,]?\s*5\s*l|75\s*cl|1\s*l|magnum)\b/.test(all)) return 'bottle_large';
  if (/\b(verre|glass|pression|draft|pint)\b/.test(all)) return 'glass_only';
  return 'default';
}

interface BrandHint { color: string; style: string }
const KNOWN_BRANDS: Record<string, BrandHint> = {
  'coca-cola': { color: 'dark caramel brown', style: 'fizzy cola with bubbles' },
  'coca cola': { color: 'dark caramel brown', style: 'fizzy cola with bubbles' },
  'coca': { color: 'dark caramel brown', style: 'fizzy cola with bubbles' },
  'pepsi': { color: 'dark caramel brown', style: 'fizzy cola with bubbles' },
  'fanta': { color: 'bright orange', style: 'sparkling orange soda' },
  'sprite': { color: 'clear transparent', style: 'sparkling lemon-lime soda' },
  'orangina': { color: 'cloudy orange with pulp', style: 'sparkling citrus with visible pulp' },
  'perrier': { color: 'clear with fine bubbles', style: 'sparkling mineral water' },
  'san pellegrino': { color: 'clear with fine bubbles', style: 'sparkling mineral water' },
  'evian': { color: 'crystal clear', style: 'still mineral water' },
  'red bull': { color: 'pale golden amber', style: 'energy drink' },
  'schweppes': { color: 'pale yellow', style: 'sparkling tonic' },
  'lipton': { color: 'amber iced tea', style: 'iced tea with lemon' },
  'oasis': { color: 'bright fruit-colored', style: 'fruit juice drink' },
  'ice tea': { color: 'amber iced tea', style: 'iced tea' },
  'diabolo': { color: 'pale tinted', style: 'lemonade with fruit syrup' },
  'sirop': { color: 'bright colored', style: 'flavored syrup drink' },
  'menthe': { color: 'bright green', style: 'mint syrup drink' },
  'grenadine': { color: 'deep red', style: 'grenadine syrup drink' },
};

function detectBrand(name: string): BrandHint | null {
  const lower = name.toLowerCase();
  for (const [brand, hint] of Object.entries(KNOWN_BRANDS)) {
    if (lower.includes(brand)) return hint;
  }
  return null;
}

// ============================================================================
// PROMPT BUILDER — Imagen-optimized: short, subject-first, affirmative only
// Max ~250 words to stay under Imagen 4's ~480 token limit.
// Imagen ignores negations ("do not") — only describe what SHOULD appear.
// The dish name must appear in the first 10 words for correct subject rendering.
// ============================================================================

/** Resolve the category key with cuisine-aware disambiguation */
// deno-lint-ignore no-explicit-any
function resolveCategoryKey(dish: any): string {
  const keyFromName = normalizeCategory(dish.name);
  const keyFromStyle = dish.style ? normalizeCategory(dish.style) : 'default';
  const keyFromCategory = normalizeCategory(dish.category || '');
  let key = keyFromName !== 'default' ? keyFromName
    : keyFromStyle !== 'default' ? keyFromStyle
    : keyFromCategory;

  if (key === 'default' || key === 'viande' || key === 'sandwich') {
    const CUISINE_STYLE_OVERRIDES: Record<string, Record<string, string>> = {
      kebab: { sandwich: 'kebab_sandwich', viande: 'kebab_assiette', default: 'kebab_sandwich' },
      turc: { sandwich: 'kebab_sandwich', viande: 'turc', default: 'turc' },
      libanais: { sandwich: 'kebab_sandwich', viande: 'turc', default: 'turc' },
      indien: { default: 'naan' },
    };
    const overrides = dish.cuisineProfile ? CUISINE_STYLE_OVERRIDES[dish.cuisineProfile] : null;
    if (overrides) {
      key = overrides[key] || overrides['default'] || key;
    }
  }
  return key;
}

/** Truncate text to a max word count */
function truncateWords(text: string, max: number): string {
  const words = text.split(/\s+/);
  return words.length <= max ? text : words.slice(0, max).join(' ') + '...';
}

// deno-lint-ignore no-explicit-any
function buildGooglePrompt(dish: any): string {
  const key = resolveCategoryKey(dish);
  const style = CATEGORY_STYLES[key] || CATEGORY_STYLES['default'];
  const camera = CAMERA_BY_CATEGORY[key] || CAMERA_BY_CATEGORY['default'];
  const microTex = MICRO_TEXTURES_BY_CATEGORY[key] || MICRO_TEXTURES_BY_CATEGORY['default'];
  const profile = dish.cuisineProfile ? CUISINE_PROFILE_DATA[dish.cuisineProfile] : null;

  // ── Beverage early return — dedicated templates + brand detection ────────
  if (key === 'boisson' || key === 'cocktail') {
    const bevFormat = detectBeverageFormat(dish.name, dish.description || '', dish.tailles);
    const bevTemplate = BEVERAGE_PROMPTS[bevFormat] || BEVERAGE_PROMPTS['default'];
    const brand = detectBrand(dish.name);
    const liquidDesc = brand ? `${brand.color} liquid (${brand.style})` : 'the same beverage';
    let bevPrompt = bevTemplate
      .replace(/\{name\}/g, dish.name)
      .replace(/\{liquid\}/g, liquidDesc);
    if (dish.restaurantStyleDescription) bevPrompt += ` ${dish.restaurantStyleDescription}.`;
    if (dish.userInstructions?.trim()) bevPrompt += ` ${dish.userInstructions.trim()}`;
    return bevPrompt;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Imagen-optimized prompt: ~150-200 words max, subject FIRST, affirmative.
  // - Dish name in the first 10 words (Imagen front-weights attention)
  // - NO negations (Imagen ignores "do not" / "no X")
  // - NO food terms from cuisine profile (prevents competing with subject)
  // - Only ambiance/lighting from cuisine profile (safe visual context)
  // ══════════════════════════════════════════════════════════════════════════

  const parts: string[] = [];

  // ── 1. SUBJECT — dish name + ingredients (FIRST — most important) ────────
  // Truncate description to 50 words max to stay within Imagen's ~480 token limit
  if (dish.description) {
    const desc = truncateWords(dish.description, 50);
    parts.push(`Professional food photo of "${dish.name}": ${desc}.`);
  } else {
    parts.push(`Professional food photo of "${dish.name}".`);
  }

  // Accompaniments (short)
  const accomp = detectAccompaniments(dish.description || dish.name, key);
  if (accomp) parts.push(accomp);

  // Quantity (short)
  const qty = extractQuantityInstruction(dish.name, dish.description);
  if (qty) parts.push(qty);

  // ── 2. STYLE — one sentence ──────────────────────────────────────────────
  parts.push('Editorial food photography for a restaurant menu, photorealistic, appetizing.');

  // ── 3. PLATING — plate + texture (one sentence) ─────────────────────────
  const garnish = style.garnish && style.garnish !== 'none' ? `, ${style.garnish}` : '';
  parts.push(`Served on ${style.plate_type} (${style.plate_color})${garnish}. ${style.texture}.`);

  // ── 4. CAMERA — angle + lens (one sentence) ─────────────────────────────
  parts.push(camera);

  // ── 5. AMBIANCE — lighting + surface ONLY (no food terms from profile!) ──
  // BUG FIX: Only use ambiance/lighting from cuisine profile.
  // Do NOT include bread, serving, sauce, or cultural_context — these contain
  // food descriptions that compete with the actual dish and confuse Imagen.
  if (dish.restaurantStyleDescription) {
    parts.push(`${dish.restaurantStyleDescription}.`);
  } else if (profile) {
    parts.push(`${profile.ambiance}. Surface: ${style.background}.`);
  } else {
    parts.push(`Surface: ${style.background}. Soft warm lighting.`);
  }

  // ── 6. MICRO-TEXTURES — hyper-realistic detail (one sentence) ───────────
  parts.push(microTex);

  // ── 7. USER INSTRUCTIONS — if any ───────────────────────────────────────
  if (dish.userInstructions?.trim()) {
    parts.push(dish.userInstructions.trim());
  }

  return parts.join(' ');
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
    const { dishes, restaurantType, imagenQuality } = body;
    // imagenQuality: 'fast' (default, $0.02) | 'standard' ($0.04)
    const modelKey = imagenQuality === 'fast' ? 'fast' : 'standard';
    const modelId = IMAGEN_MODELS[modelKey];

    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Aucun plat fourni' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Rate limit
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (supabaseUrl && supabaseKey) {
      const rateLimitCheck = await checkRateLimit(user.id, dishes.length, supabaseUrl, supabaseKey);
      if (!rateLimitCheck.allowed) {
        return new Response(
          JSON.stringify({ success: false, error: `Limite atteinte (${rateLimitCheck.current_count}/${rateLimitCheck.limit})` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
    }

    // Credit check & atomic decrement
    const creditCheck = await supabase.rpc('decrement_credits', {
      p_user_id: user.id,
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

    console.log(`[Google Imagen ${modelKey}] Credits OK: ${creditResult.remaining} remaining. Processing ${dishes.length} dishes...`);

    const PARALLEL_BATCH_SIZE = 3;
    const results: { dishId: string; imageUrl: string | null; error?: string }[] = [];

    // ── Helper: process a single dish ──
    // deno-lint-ignore no-explicit-any
    async function processOneDish(dish: any): Promise<{ dishId: string; imageUrl: string | null; error?: string }> {
      const prompt = buildGooglePrompt(dish);
      const key = resolveCategoryKey(dish);
      const aspectRatio = CATEGORY_ASPECT_RATIO[key] || '1:1';
      console.log(`[Google Imagen] ${dish.name} | key: ${key} | ratio: ${aspectRatio} | words: ${prompt.split(/\s+/).length} | prompt: ${prompt}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict`,
          {
            method: 'POST',
            headers: {
              'x-goog-api-key': GOOGLE_API_KEY!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              instances: [{ prompt }],
              parameters: {
                sampleCount: 1,
                aspectRatio,
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
          return { dishId: dish.id, imageUrl: null, error: `Google API ${response.status}` };
        }

        const data = await response.json();
        const base64Image = data?.predictions?.[0]?.bytesBase64Encoded;

        if (!base64Image) {
          console.error(`[Google Imagen] No image in response for ${dish.name}`);
          return { dishId: dish.id, imageUrl: null, error: 'Pas d\'image retournée' };
        }

        const imageUrl = `data:image/png;base64,${base64Image}`;
        console.log(`[Google Imagen] ✅ ${dish.name}`);
        return { dishId: dish.id, imageUrl };
      } catch (err) {
        clearTimeout(timeout);
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error(`[Google Imagen] ❌ ${dish.name}:`, msg);
        return { dishId: dish.id, imageUrl: null, error: msg };
      }
    }

    // ── Phase 1: Anchor — first dish alone ──
    console.log(`🔒 Phase 1: Generating anchor image (${dishes[0].name})...`);
    const anchorResult = await processOneDish(dishes[0]);
    results.push(anchorResult);

    // ── Phase 2: Remaining dishes in parallel batches of 3 ──
    const remainingDishes = dishes.slice(1);
    if (remainingDishes.length > 0) {
      console.log(`⚡ Phase 2: ${remainingDishes.length} dishes in parallel (batches of ${PARALLEL_BATCH_SIZE})...`);

      for (let i = 0; i < remainingDishes.length; i += PARALLEL_BATCH_SIZE) {
        const batch = remainingDishes.slice(i, i + PARALLEL_BATCH_SIZE);
        const batchNum = Math.floor(i / PARALLEL_BATCH_SIZE) + 1;
        console.log(`  Batch ${batchNum}: ${batch.map((d: { name: string }) => d.name).join(', ')}`);

        const batchResults = await Promise.allSettled(
          // deno-lint-ignore no-explicit-any
          batch.map((dish: any) => processOneDish(dish))
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
      JSON.stringify({ success: true, images: results, model: `imagen-4.0-${modelKey}`, count: results.length }),
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
