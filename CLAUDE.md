# Auguste v2

## Ce que fait ce projet

Auguste permet aux restaurateurs de transformer leur carte en menu visuel professionnel avec photos IA. L'utilisateur crée un profil restaurant, importe son menu, et obtient des photos générées automatiquement — le tout depuis son téléphone en moins de 3 minutes.

## Stack

- **Frontend** : React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend** : Supabase (PostgreSQL, Auth, Storage, Edge Functions Deno)
- **IA** : OpenAI GPT-4o (extraction menu) + gpt-image-1.5 (photos plats)
- **Paiement** : Stripe Checkout (one-time packs)
- **Routing** : React Router v7
- **Icônes** : Lucide React

## Commandes

```bash
npm run dev          # Serveur dev Vite (http://localhost:5173)
npm run build        # Build production (tsc + vite build)
npx tsc --noEmit     # Typecheck seul (rapide)
```

### Vérification avant chaque commit

Toujours exécuter dans cet ordre :

```bash
npx tsc --noEmit          # 1. Typecheck — 0 erreur obligatoire
npm run build             # 2. Build — doit passer
```

Si le typecheck échoue, corriger AVANT de continuer. Ne jamais ignorer une erreur TypeScript.

## Structure du projet

```
src/
├── App.tsx                    → Routeur React Router (point d'entrée)
├── main.tsx                   → Mount React
├── index.css                  → Tailwind + design tokens + animations (fade-in, slide-up)
├── pages/                     → 1 fichier = 1 route
│   ├── LoginPage.tsx          → /login (public)
│   ├── ProfilePage.tsx        → /profil (Mon Restaurant — profil, Google, cuisine, photo, crédits)
│   ├── MenuPage.tsx           → /menu (Import photo/fichier/URL, liste plats, édition, sélection)
│   ├── PhotosPage.tsx         → /photos (Génération batch, grille, plein écran, régénérer)
│   └── ExportPage.tsx         → /export (PDF avec thèmes, ZIP, CSV/QR bientôt)
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      → Shell responsive (sidebar desktop + bottom nav mobile)
│   │   ├── BottomNav.tsx      → Navigation mobile (bottom bar fixe)
│   │   └── Sidebar.tsx        → Navigation desktop (sidebar gauche)
│   └── profile/
│       ├── GoogleBusinessCard.tsx → Carte Google Business (recherche, lien, déconnexion)
│       └── CuisineSelector.tsx    → Grille de sélection des profils cuisine avec filtre
├── hooks/                     → Custom hooks (logique métier, 1 hook par domaine)
│   ├── useRestaurant.ts       → CRUD restaurant, auto-save debounced, Google search, upload photo
│   ├── useCredits.ts          → Lecture crédits depuis user_credits
│   ├── useMenus.ts            → Chargement menu + items, import fichier/URL, édition, suppression
│   └── useGeneration.ts       → Génération batch/unitaire de photos IA, progression
├── lib/
│   ├── supabase.ts            → Client Supabase + ensureSession()
│   ├── auth.tsx               → AuthProvider + useAuth()
│   └── i18n.tsx               → I18nProvider + useI18n() (FR/EN, ~70 clés)
├── types/
│   └── index.ts               → Tous les types TypeScript centralisés
└── constants/
    ├── cuisineProfiles.ts     → 38 profils cuisine (kebab, pizza, bistrot...)
    └── presentationStyles.ts  → 5 styles de présentation PDF
```

## Architecture — décisions clés

### Le profil restaurant est le pivot central

Tout part de `Restaurant`. Un restaurant a un `cuisine_profile_id` qui détermine le style visuel de toutes les photos générées. Les menus héritent du style du restaurant automatiquement.

```
auth.users → restaurants → menus → menu_items → generated_images
```

### Mobile-first

Le design est conçu pour le téléphone d'abord. Tailwind breakpoints :
- **Défaut** (< 640px) : mobile, bottom nav, 1 colonne
- **lg** (1024px+) : desktop, sidebar gauche, contenu élargi

### Navigation

4 routes protégées avec React Router :
- `/profil` — Profil restaurant (page d'accueil)
- `/menu` — Liste des plats + import
- `/photos` — Galerie photos IA
- `/export` — Hub d'export (PDF, ZIP, CSV)

La bottom nav (mobile) et la sidebar (desktop) sont définies dans `components/layout/`. Les items de nav sont définis une seule fois dans chaque composant — si tu ajoutes une route, mets à jour les deux.

## Conventions code

### TypeScript

- Mode strict activé — jamais de `any`, jamais de `@ts-ignore`
- Tous les types dans `src/types/index.ts` — ne pas créer de types inline dans les composants
- Interfaces pour les objets, `type` pour les unions/intersections

```typescript
// ✅ Bon
import type { MenuItem, Restaurant } from '@/types'

// ❌ Mauvais
const item: any = response.data
```

### React

- Composants fonctionnels uniquement, jamais de classes
- Un composant par fichier, nom du fichier = nom du composant en PascalCase
- Hooks custom dans `src/hooks/` — préfixe `use`
- État local avec `useState` / `useReducer` — pas de state manager externe

### Imports

- Toujours utiliser l'alias `@/` (racine src) — jamais de `../../`

```typescript
// ✅ Bon
import { useAuth } from '@/lib/auth'

// ❌ Mauvais
import { useAuth } from '../../lib/auth'
```

### Tailwind CSS

- Utility-first, pas de CSS custom sauf dans `index.css`
- Design tokens Auguste :
  - Or : `#C9A961` (CTA, accents, nav active)
  - Crème : `#FAF8F5` (fond page)
  - Noir encre : `#2C2622` (textes)
  - Cuivre : `#D4895C` (warnings)
  - Sauge : `#7C9A6B` (succès)
- Fonts : `font-serif` = Playfair Display (headings), `font-sans` = Inter (body)
- Mobile-first : écrire le style mobile par défaut, ajouter `lg:` pour desktop
- Boutons touch : minimum `py-3 px-4` (48px de hauteur touchable)

```tsx
// ✅ Mobile-first
<div className="flex flex-col lg:flex-row">

// ❌ Desktop-first (à éviter)
<div className="flex flex-row md:flex-col">
```

### Textes et i18n

- Jamais de texte hardcodé en français dans le JSX
- Utiliser `useI18n()` et `t('clé')` pour tous les textes d'interface
- Ajouter les traductions FR et EN dans `src/lib/i18n.tsx`

```tsx
// ✅ Bon
const { t } = useI18n()
<button>{t('common.save')}</button>

// ❌ Mauvais
<button>Enregistrer</button>
```

## Supabase

### Règle critique

`ensureSession()` dans `lib/supabase.ts` doit TOUJOURS être appelé avant un appel Edge Function. Sans ça, le token peut être expiré et l'appel échoue silencieusement.

```typescript
// ✅ Toujours
await ensureSession()
const { data } = await supabase.functions.invoke('generate-dish-photo', { body })

// ❌ Jamais
const { data } = await supabase.functions.invoke('generate-dish-photo', { body })
```

### Edge Functions

Les Edge Functions sont en Deno (PAS Node). Elles vivent côté Supabase et ne sont pas dans ce repo frontend. Ne pas essayer d'importer des packages npm dans les Edge Functions.

| Fonction | Rôle |
|---|---|
| `extract-menu` | Extraction menu depuis fichier (GPT-4o vision) |
| `extract-menu-from-url` | Extraction depuis URL (Uber Eats, Deliveroo) |
| `generate-dish-photo` | Génération photo plat unitaire (gpt-image-1.5) |
| `generate-images` | Génération batch de photos |
| `generate-dalle` | Génération DALL-E (alternative) |
| `generate-hero` / `generate-hero-flux` | Bannière hero restaurant |
| `generate-restaurant-banner` | Bannière restaurant (alternative) |
| `search-restaurant` | Recherche Google Business |
| `get-restaurant-details` | Détails Google Business |
| `analyze-style` | Analyse style visuel |
| `enrich-descriptions` | Enrichissement descriptions plats |
| `complete-item` | Complétion item (IA) |
| `compare-menu` | Comparaison de menus |
| `optimize-menu` | Optimisation menu |
| `match-dish-photos` | Matching photos existantes / plats |
| `create-checkout` | Session Stripe Checkout |
| `stripe-webhook` | Traitement paiement |

### Crédits

Les crédits sont gérés côté serveur (Edge Function) — ne JAMAIS décrémenter côté client. Le frontend affiche le solde, le backend le modifie.

## Hooks métier

Chaque hook encapsule un domaine fonctionnel. Les pages n'ont jamais de logique Supabase directe.

| Hook | Fichier | Rôle | Utilisé par |
|---|---|---|---|
| `useRestaurant` | `hooks/useRestaurant.ts` | CRUD restaurant, auto-save (debounce 800ms), recherche Google Business, upload photo | ProfilePage |
| `useCredits` | `hooks/useCredits.ts` | Lecture crédits depuis `user_credits` | ProfilePage |
| `useMenus` | `hooks/useMenus.ts` | Charge menu + items par `restaurant_id`, import fichier/URL (edge functions), édition/suppression items | MenuPage |
| `useGeneration` | `hooks/useGeneration.ts` | Génération batch (séquentielle) + unitaire, progression par job (pending/generating/done/error) | PhotosPage |

### Flux de données entre hooks et pages

```
ProfilePage → useRestaurant (restaurant_id) → useCredits
MenuPage    → useRestaurant (restaurant_id) → useMenus(restaurant_id)
PhotosPage  → useRestaurant + useMenus + useGeneration
ExportPage  → useRestaurant + useMenus (lecture items + photos)
```

### Pattern auto-save (useRestaurant)

`updateField('name', value)` fait :
1. Mise à jour optimiste du state local (immédiat)
2. Debounce 800ms
3. `supabase.update()` en background
4. Indicateur `saving` visible dans l'UI

## Constantes métier

### CUISINE_PROFILES (38 profils)

Fichier : `src/constants/cuisineProfiles.ts`

Chaque profil a : `id`, `emoji`, `label`, `bread`, `serving`, `sauce`, `ambiance`, `cultural_context`. Le `cuisine_profile_id` du restaurant détermine le style des photos.

Helpers disponibles : `getCuisineProfile(id)`, `CUISINE_PROFILE_MAP`, `CUISINE_PROFILE_IDS`.

### PRESENTATION_STYLES (5 styles)

Fichier : `src/constants/presentationStyles.ts`

Styles de présentation pour l'export PDF : `french_bistro`, `fine_dining`, `street_food`, `asian_fusion`, `mediterranean`.

## Erreurs fréquentes à éviter

### Ne pas faire

- Créer des composants de plus de 300 lignes — découper en sous-composants
- Mettre de la logique métier dans les composants — utiliser des hooks custom
- Utiliser `useEffect` pour synchroniser du state — préférer le state dérivé
- Ajouter des `console.log` en prod — les retirer avant commit
- Créer des fichiers de test sans les faire passer
- Modifier les constantes cuisine/style sans vérifier l'impact sur les Edge Functions

### Toujours faire

- Vérifier le typecheck (`npx tsc --noEmit`) après chaque modification
- Tester sur viewport mobile (375px) ET desktop (1024px+)
- Utiliser les types de `@/types` — ne pas en inventer de nouveaux inline
- Garder les pages simples — la logique va dans les hooks, l'UI dans les composants

## Base de données (Supabase PostgreSQL)

### Tables principales

| Table | Rôle | RLS |
|---|---|---|
| `restaurants` | Pivot central — profil, style, Google data | owner_id = auth.uid() |
| `menus` | Menus importés, liés à un restaurant | via restaurant_id |
| `menu_items` | Plats extraits (nom, prix, catégorie, tailles, supplements, allergènes) | via menu_id |
| `generated_images` | Photos IA générées, liées 1:1 à un menu_item | via menu_item_id |
| `user_credits` | Crédits restants par utilisateur (défaut: 10) | user_id = auth.uid() |
| `categories` | Catégories par menu avec position et cuisine_profile | via menu_id |
| `leads` | Legacy v1 — facturation Stripe uniquement | via workspace_id |
| `workspaces` | Legacy v1 — lien user/restaurant | user_id = auth.uid() |
| `usage_tracking` | Analytics actions utilisateur | via lead_id |

### Relations

```
auth.users 1→N restaurants 1→N menus 1→N menu_items 1→1 generated_images
auth.users 1→1 user_credits
```

## Documentation

- `prd/prd_v2.md` — PRD complet (vision, parcours, architecture, roadmap)

## Utilisateur

L'utilisateur (Boz) est novice en dev. Réponses courtes et actionnables. Pas de jargon sans explication. Toujours finir par une question de décision ou d'action.

---

*Ce fichier est vivant. Chaque fois que Claude fait une erreur, ajouter la règle ici pour qu'elle ne se reproduise pas.*
