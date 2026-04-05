// ── Menu item sub-types (jsonb columns) ──────────────────────────────────────

export interface Taille {
  label: string;   // "S", "M", "L", "30cm", "Pièce"
  prix: number;
}

export interface Supplement {
  nom: string;          // "Fromage", "Bacon"
  prix: number;         // 2.00
  obligatoire: boolean; // true = le client doit choisir
}

export interface Accompagnement {
  nom: string;     // "Frites", "Salade"
  prix: number;    // 0 si inclus
  inclus: boolean; // true = pas de surcoût
}

// ── MenuItem ─────────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  nom: string;
  categorie: string;
  description: string;
  original_description?: string | null;
  prix: string;
  style: string;
  image_url?: string;
  tailles?: Taille[];
  supplements?: Supplement[];
  accompagnements?: Accompagnement[];
  allergenes?: string[];
  labels?: string[];
  disponible?: boolean;
  item_type?: 'plat' | 'formule' | 'boisson' | 'dessert';
  image_source?: 'platform' | 'generated' | 'enhanced' | 'user' | null;
  generated_at?: string | null;
  position?: number;
}

// ── Restaurant (NEW — v2 pivot) ─────────────────────────────────────────────
export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  cuisine_profile_id: string | null;
  cuisine_types: string[];
  address: string | null;
  phone: string | null;
  description: string | null;
  style_photo_url: string | null;
  dish_reference_url: string | null;
  hero_photo_url: string | null;
  google_place_id: string | null;
  google_business_data: GoogleBusinessData | null;
  presentation_style_id: string | null;
  style_description: string | null;
  logo_url: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

// ── Menu ─────────────────────────────────────────────────────────────────────
export interface Menu {
  id: string;
  restaurant_id: string;
  file_name: string;
  source_type: 'file' | 'url' | 'photo';
  cuisine_profile: string | null;
  hero_photo_url: string | null;
  category_order: string[] | null;
  created_at: string;
  items: MenuItem[];
}

// ── Google Business Data ─────────────────────────────────────────────────────
export interface GoogleBusinessData {
  place_id: string;
  name: string;
  address: string;
  phone: string;
  rating: number | null;
  reviews_count: number;
  hours: string[];
  description: string;
  cuisine_types: string[];
  primary_type: string;
  primary_type_display: string;
  detected_cuisine_profile: string | null;
  website: string;
  google_maps_url: string;
  photo_references: string[];
  photo_urls: string[];
}

// ── User / Credits ───────────────────────────────────────────────────────────
export interface UserCredits {
  user_id: string;
  credits_remaining: number;
  total_generated: number;
}
