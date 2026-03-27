# Architecture technique — Auguste v2

**Dernière MAJ :** Mars 2026

---

## Stack

| Couche | Techno |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions Deno) |
| IA Photos | OpenAI gpt-image-1.5 (plats) |
| IA Extraction | OpenAI GPT-4o (vision menu) |
| Paiement | Stripe Checkout (one-time packs) |
| Routing | React Router v7 |
| Icônes | Lucide React |
| Projet Supabase | `cgsykmcohllfuwtessbp` (eu-west-1) |

---

## Modèle de données

```
auth.users
  └── restaurants (1:1)           → Pivot central v2
        ├── name, cuisine_profile_id, cuisine_types[]
        ├── google_place_id, google_business_data (jsonb)
        ├── address, phone, description
        ├── style_photo_url, dish_reference_url, hero_photo_url, logo_url
        ├── presentation_style_id, style_description
        ├── stripe_customer_id
        └── menus (1:N)
              ├── file_name, source_type (file|url|photo)
              ├── detected_cuisine_profile, hero_photo_url
              ├── category_order (jsonb)
              └── menu_items (1:N)
                    ├── nom, categorie, description, prix, style
                    ├── image_url, image_source
                    ├── tailles (jsonb), supplements (jsonb), accompagnements (jsonb)
                    ├── allergenes (text[]), labels (text[])
                    ├── disponible, item_type, position
                    └── generated_images (1:1)
                          ├── image_url
                          └── prompt

user_credits (1:1 auth.users)
  ├── credits_remaining
  └── total_generated

categories (N:1 menus)
  ├── nom, position
  ├── parent_id (self-ref)
  └── cuisine_profile
```

### Tables héritées de v1 (ignorées par v2)

`leads`, `workspaces`, `usage_tracking` — restent en place mais ne sont plus utilisées par le frontend v2.

---

## Flux métier

### 1. Création du profil restaurant

```
Utilisateur se connecte (LoginPage)
→ useRestaurant charge le restaurant existant OU en crée un vide automatiquement
→ ProfilePage affiche le formulaire (nom, adresse, cuisine, etc.)
→ updateField() sauvegarde chaque champ avec un debounce de 800ms
→ Optionnel : recherche Google Business via searchGoogle()
  → applyGoogleData() remplit auto les champs depuis Google Places
→ Le cuisine_profile_id choisi ici déterminera le style de toutes les photos IA
```

### 2. Import du menu

```
Utilisateur uploade un fichier (photo, PDF) ou colle un lien (Uber Eats, Deliveroo)
→ MenuPage → useMenus.importFromFile() ou importFromUrl()
→ ensureSession() rafraîchit le token JWT
→ Edge Function extract-menu (fichier) ou extract-menu-from-url (lien)
→ GPT-4o analyse le contenu et retourne les plats structurés
→ Les plats sont insérés dans menu_items côté serveur
→ Le frontend anime l'apparition des plats un par un (150ms entre chaque)
→ useMenus.reload() recharge les données depuis Supabase
```

### 3. Génération de photos IA

```
Utilisateur sélectionne des plats dans PhotosPage
→ useGeneration.generateBatch() lance la génération séquentielle (1 plat à la fois)
→ ensureSession() + Edge Function generate-dish-photo pour chaque plat
→ Le cuisine_profile_id + cuisine_types du restaurant sont envoyés pour le style
→ L'image générée est stockée dans Supabase Storage
→ generated_images est créé avec l'URL et le prompt
→ Les crédits sont décrémentés côté serveur (Edge Function)
→ Le frontend affiche la progression (pending → generating → done/error)
```

### 4. Paiement (crédits)

```
Utilisateur achète un pack de crédits
→ Edge Function create-checkout crée une session Stripe Checkout
→ Utilisateur paie sur la page Stripe
→ Edge Function stripe-webhook reçoit la confirmation
→ Les crédits sont ajoutés dans user_credits côté serveur
→ useCredits recharge le solde affiché dans le frontend
```

### 5. Export

```
Utilisateur accède à ExportPage
→ Choix du format : PDF, ZIP (photos), CSV, ou menu web + QR code
→ Le presentation_style_id du restaurant influence le style PDF
→ Export généré côté client ou via Edge Function selon le format
```

---

## Edge Functions

| Fonction | Provider | Rôle |
|---|---|---|
| `extract-menu` | GPT-4o | Extraction depuis fichier image/PDF |
| `extract-menu-from-url` | GPT-4o | Extraction depuis URL (Uber Eats, Deliveroo) |
| `generate-dish-photo` | gpt-image-1.5 | Génération photo plat individuel |
| `generate-images` | gpt-image-1.5 | Génération photos batch |
| `analyze-style` | GPT-4o-mini | Analyse style depuis photo restaurant |
| `generate-hero` | DALL-E | Génération banner hero |
| `generate-hero-flux` | Flux | Génération banner hero (alternative) |
| `generate-restaurant-banner` | IA | Bannière restaurant |
| `generate-dalle` | DALL-E | Génération image DALL-E |
| `search-restaurant` | Google Places | Recherche Google Business |
| `get-restaurant-details` | Google Places | Détails Google Business |
| `create-checkout` | Stripe | Création session checkout |
| `stripe-webhook` | Stripe | Traitement paiement |
| `compare-menu` | GPT-4o | Comparaison de menus |
| `optimize-menu` | GPT-4o | Optimisation de menu |
| `complete-item` | GPT-4o | Complétion auto d'un plat |
| `match-dish-photos` | GPT-4o | Association photos ↔ plats |
| `enrich-descriptions` | GPT-4o | Enrichissement descriptions plats |

---

## Design system

```
Couleurs :
  Or :        #C9A961   (CTA, accents, nav active)
  Crème :     #FAF8F5   (fond page)
  Noir encre : #2C2622  (textes)
  Cuivre :    #D4895C   (warnings)
  Sauge :     #7C9A6B   (succès)

Typographie :
  Headings : Playfair Display (font-serif)
  Body :     Inter (font-sans)

5 styles de présentation PDF :
  french_bistro, fine_dining, street_food, asian_fusion, mediterranean
```

---

## Structure du projet

```
src/
├── App.tsx                        → Routeur React Router (BrowserRouter, 5 routes)
├── main.tsx                       → Point d'entrée React (StrictMode)
├── index.css                      → Tailwind v4 + design tokens Auguste
├── pages/
│   ├── LoginPage.tsx              → /login — Auth email/password
│   ├── ProfilePage.tsx            → /profil — Profil restaurant + cuisine + Google
│   ├── MenuPage.tsx               → /menu — Import menu (photo/fichier/lien)
│   ├── PhotosPage.tsx             → /photos — Galerie photos IA + génération
│   └── ExportPage.tsx             → /export — PDF, ZIP, CSV, Web+QR
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          → Shell responsive (sidebar + bottom nav + Outlet)
│   │   ├── BottomNav.tsx          → Navigation mobile (4 onglets, fixe en bas)
│   │   └── Sidebar.tsx            → Navigation desktop (sidebar gauche 240px)
│   └── profile/
│       ├── GoogleBusinessCard.tsx → Recherche Google + affichage infos Business
│       └── CuisineSelector.tsx    → Sélecteur cuisine groupé (6 groupes, 38 profils)
├── hooks/
│   ├── useRestaurant.ts           → CRUD restaurant + Google Search + upload photo
│   ├── useMenus.ts                → Import menu (fichier/URL) + CRUD items
│   ├── useGeneration.ts           → Génération photos IA batch + régénération unitaire
│   └── useCredits.ts              → Lecture solde crédits (remaining + totalGenerated)
├── lib/
│   ├── supabase.ts                → Client Supabase + ensureSession()
│   ├── auth.tsx                   → AuthProvider + useAuth() (login/signup/logout)
│   └── i18n.tsx                   → I18nProvider + useI18n() (FR/EN)
├── types/
│   └── index.ts                   → Types centralisés (Restaurant, Menu, MenuItem, etc.)
└── constants/
    ├── cuisineProfiles.ts         → 38 profils cuisine avec contexte culturel IA
    └── presentationStyles.ts      → 5 styles de présentation PDF
```

---

## Routes

| Route | Composant | Accès | Description |
|---|---|---|---|
| `/login` | LoginPage | Public | Connexion / inscription email |
| `/profil` | ProfilePage | Protégé | Profil restaurant (page d'accueil) |
| `/menu` | MenuPage | Protégé | Import et gestion de la carte |
| `/photos` | PhotosPage | Protégé | Galerie et génération photos IA |
| `/export` | ExportPage | Protégé | Hub d'export (PDF, ZIP, CSV) |
| `*` | → `/profil` | — | Redirect par défaut |

---

## Composants

### Layout (`components/layout/`)

| Composant | Rôle |
|---|---|
| `AppLayout` | Shell responsive : sidebar desktop + bottom nav mobile + Outlet |
| `BottomNav` | Navigation mobile (barre fixe en bas, 4 onglets) |
| `Sidebar` | Navigation desktop (sidebar gauche 240px) |

### Profil (`components/profile/`)

| Composant | Rôle |
|---|---|
| `GoogleBusinessCard` | Recherche Google Business, affiche note/avis/horaires, auto-remplit le profil |
| `CuisineSelector` | Sélecteur de profil cuisine groupé par catégorie (38 options en 6 groupes) |

---

## Hooks custom

| Hook | Rôle | Dépendances |
|---|---|---|
| `useRestaurant` | Charge ou crée le restaurant, sauvegarde debounced, recherche Google, upload photo | `useAuth`, `supabase`, `ensureSession` |
| `useMenus` | Import menu (fichier ou URL), CRUD items, gestion catégories ordonnées | `supabase`, `ensureSession` |
| `useGeneration` | Génération photos batch séquentielle, régénération unitaire avec instructions | `supabase`, `ensureSession` |
| `useCredits` | Lecture du solde crédits (remaining + totalGenerated), read-only | `useAuth`, `supabase` |

---

## Constantes métier

### CUISINE_PROFILES (38 profils)

Fichier : `src/constants/cuisineProfiles.ts`

Chaque profil contient : `id`, `emoji`, `label`, `bread`, `serving`, `sauce`, `ambiance`, `cultural_context`. Le `cuisine_profile_id` du restaurant détermine le style des photos IA.

Helpers : `getCuisineProfile(id)`, `CUISINE_PROFILE_MAP`, `CUISINE_PROFILE_IDS`.

### PRESENTATION_STYLES (5 styles)

Fichier : `src/constants/presentationStyles.ts`

Styles PDF : `french_bistro`, `fine_dining`, `street_food`, `asian_fusion`, `mediterranean`.

Helper : `findStyleByHint(description)`.

---

## Notes techniques

- **ensureSession() obligatoire** — Toujours appeler `ensureSession()` avant un appel Edge Function. Sans ça, le token JWT peut être expiré et l'appel échoue silencieusement. Tous les hooks qui appellent des Edge Functions le font déjà.

- **Crédits serveur-only** — Les crédits sont décrémentés par les Edge Functions, jamais par le frontend. `useCredits` est en lecture seule. Cela empêche la fraude côté client.

- **cuisine_profile_id est le pivot IA** — Ce champ sur `restaurants` détermine le style visuel de toutes les photos générées (type de pain, présentation, sauce, ambiance). Changer le profil cuisine change le rendu de toutes les futures photos.

- **Sauvegarde debounced (800ms)** — `useRestaurant.updateField()` applique le changement en local immédiatement (optimistic update) mais attend 800ms avant de sauvegarder en base. Cela évite un appel Supabase à chaque frappe de clavier.

- **Génération séquentielle, pas parallèle** — `useGeneration.generateBatch()` génère les photos une par une, pas en parallèle. C'est voulu : ça évite de surcharger l'API OpenAI et permet d'afficher la progression en temps réel.

- **Edge Functions = Deno, pas Node** — Les Edge Functions tournent sur Deno côté Supabase. Elles ne sont pas dans ce repo frontend. Ne pas essayer d'importer des packages npm dedans.

- **Un restaurant par utilisateur** — `useRestaurant` charge le premier restaurant trouvé pour le user, ou en crée un vide. Le modèle est 1:1 (un user = un restaurant), pas 1:N.

- **category_order respecté** — `useMenus` trie les catégories selon `menu.category_order` si défini, sinon par ordre d'apparition. Les catégories non listées dans l'ordre sont ajoutées à la fin.
