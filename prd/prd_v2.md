# PRD v2 — Auguste

**Dernière MAJ :** Mars 2026

---

## 1. Vision et contexte

**Auguste** permet aux restaurateurs de transformer leur carte en un menu visuel professionnel avec photos IA, en moins de 3 minutes, depuis leur téléphone.

### Ce qui change dans la v2

> **Constat v1 :** L'interface actuelle demande 5-6 étapes avant de voir un résultat. Le setup de style (2 photos + profil cuisine) est obligatoire. La page Restaurant fait 2 253 lignes. C'est trop complexe pour un restaurateur pressé sur son téléphone.

| Aspect | v1 (actuel) | v2 (cible) |
|---|---|---|
| Pivot central | Le menu (fichier) | Le profil restaurant |
| Première photo visible | > 5 minutes | < 2 minutes |
| Setup style obligatoire | Oui (2 photos + cuisine) | Uniquement la Google Card. Suffisant pour déduire le style du restaurant |
| Mobile | Non optimisé | Mobile-first |
| Parcours | Linéaire rigide | Express (auto) + Avancé (optionnel) |
| Nombre d'écrans | 4-5 écrans complexes | 3 écrans simples |

---

## 2. Le Profil Restaurant comme pivot

Tout part du restaurant. Le restaurateur crée son profil une fois, et toutes les générations de photos héritent automatiquement du bon style.

### Modèle de données — nouvelle table `restaurants`

On remplace la table `leads` comme pivot par une vraie table `restaurants` qui porte l'identité visuelle :

| Champ | Type | Description |
|---|---|---|
| id | uuid (PK) | Identifiant unique |
| owner_id | uuid (FK auth.users) | Propriétaire du restaurant |
| name | text | Nom du restaurant |
| cuisine_profile_id | text | Profil cuisine (kebab, pizza, bistrot...) |
| cuisine_types | text[] | Types de cuisine détectés |
| address | text | Adresse |
| phone | text | Téléphone |
| description | text | Description courte |
| style_photo_url | text | Photo d'ambiance (optionnelle) |
| dish_reference_url | text | Photo plat référence (optionnelle) |
| hero_photo_url | text | Banner hero |
| google_place_id | text | Lien Google Business |
| google_business_data | jsonb | Données Google cachées |
| presentation_style_id | text | Style PDF (bistrot, gastro...) |
| style_description | text | Description style personnalisée |
| logo_url | text | Logo du restaurant |
| created_at | timestamptz | Date de création |

> **Principe clé :** Le style visuel vit sur le restaurant, pas sur le menu. Un restaurant = un style. Tous les menus héritent du même style automatiquement. Le restaurateur peut surcharger par menu s'il le souhaite (mode avancé).

### Relations entre tables

```
auth.users 1→N restaurants 1→N menus 1→N menu_items 1→1 generated_images
```

La table `leads` reste pour les données de facturation (crédits, Stripe). Le restaurant porte l'identité visuelle. Le menu porte les plats.

---

## 3. Parcours utilisateur Express

> **Objectif :** Le restaurateur voit ses premières photos générées en moins de 2 minutes, depuis son téléphone, sans aucune configuration de style.

### Étape 1 — Créer son profil

Un seul écran mobile-friendly avec 3 champs :

- **Nom du restaurant** — texte libre. Champ principal, gros et visible.
- **Type de cuisine** — sélecteur visuel avec émojis (kebab, pizza, burger, bistrot...). Un tap suffit.
- **Google Card** — Appel à l'API Google pour chercher son restaurant. On s'en inspire pour déduire le style du restaurant et aider à la génération d'images.
- **Photo du restaurant** — optionnel. Bouton « Prendre une photo » (caméra mobile) ou upload.

Alternative rapide : **recherche Google Business**. Le restaurateur tape son nom, on remplit tout automatiquement (nom, adresse, cuisine, photos Google).

### Étape 2 — Importer son menu

Depuis l'écran du profil, un gros bouton **« Ajouter mon menu »** avec 3 options :

- **Photo** — prendre en photo sa carte avec le téléphone (accès caméra direct)
- **Fichier** — upload PDF ou image depuis la galerie
- **Lien** — coller l'URL Uber Eats / Deliveroo / Just Eat

L'extraction GPT-4o se lance immédiatement. Pendant le chargement, un écran de progression anime les plats détectés un par un (« Margherita détectée... Tiramisu détecté... »).

### Étape 3 — Résultat + Génération auto

Dès l'extraction terminée, l'utilisateur voit sa liste de plats. Deux boutons :

- **« Générer toutes les photos ou celles sélectionnées »** — lance la génération batch avec le style déduit du profil cuisine, ou uniquement les images sélectionnées
- **« Éditer d'abord »** — permet de corriger noms/prix avant de générer (mode avancé)

> **Déduction automatique du style :** Le système combine le `cuisine_profile_id` du restaurant avec les `CATEGORY_STYLES` existants (24+ catégories). Pas besoin de photo d'ambiance ni de sélection de style. Si le restaurateur a mis une photo de son resto, elle est utilisée comme référence visuelle. Sinon, le profil cuisine suffit.

---

## 4. Design Mobile-First

L'application web doit être utilisable sur un smartphone comme une app native. Pas de refonte complète du code — on adapte le responsive avec Tailwind.

### Principes de design

| Principe | Implémentation |
|---|---|
| Touch-friendly | Boutons min 48px, espacement généreux, pas de hover-only |
| Un écran = une action | Pas de panneaux multiples visibles sur mobile |
| Navigation bottom | Barre de nav en bas (Profil / Menu / Photos / Export) |
| Caméra native | Accès caméra via input capture pour photo menu/resto |
| Scroll vertical | Pas de scroll horizontal, pas de tableaux larges sur mobile |
| Feedback immédiat | Skeleton loaders, animations de progression, toasts |
| Offline-tolerant | Les photos générées restent visibles même hors connexion (cache) |

### Breakpoints Tailwind

| Breakpoint | Cible | Layout |
|---|---|---|
| < 640px (défaut) | Smartphone | 1 colonne, nav bottom, cards empilées |
| sm (640px) | Grand téléphone | 1 colonne, images plus grandes |
| md (768px) | Tablette | 2 colonnes pour la grille de plats |
| lg (1024px+) | Desktop | Sidebar + contenu, layout actuel amélioré |

### Navigation mobile

On remplace les onglets desktop (TopNav) par une bottom navigation bar fixe avec 4 icônes :

| Icône | Label | Route | Description |
|---|---|---|---|
| 🏠 | Mon resto | /profil | Profil restaurant + infos |
| 📋 | Ma carte | /menu | Liste des plats + édition |
| 📷 | Photos | /photos | Génération + galerie photos IA |
| 📤 | Exporter | /export | PDF, CSV, lien web, QR code |

---

## 5. Détail des écrans

### Écran 1 — Mon Restaurant (profil)

C'est la page d'accueil une fois connecté. Elle montre l'identité du restaurant et donne accès à tout.

- **Header** : photo hero (ou placeholder coloré) + nom du restaurant + type cuisine
- **Infos éditables** : nom, adresse, téléphone, description (tap pour éditer)
- **Section style** : cuisine profile (sélecteur émoji), photo ambiance, photo plat référence
- **Section menus** : liste des menus importés (cards), bouton « + Ajouter un menu »
- **Crédits** : jauge de crédits restants + bouton acheter

### Écran 2 — Ma Carte (menu)

Vue liste des plats du menu actif, groupés par catégorie. Optimisée pour le scroll vertical mobile.

- **Catégories** : pills scrollables en haut (filtre horizontal)
- **Plat card** : miniature photo (si générée) + nom + prix. Tap → édition inline
- **Édition** : bottom sheet (slide up) avec nom, description, prix, tailles, suppléments, allergènes
- **Actions batch** : sélection multiple + « Générer les photos »

### Écran 3 — Photos (génération)

Galerie de toutes les photos générées, avec accès à la régénération.

- **Grille photos** : 2 colonnes sur mobile, 3-4 sur desktop. Nom du plat sous chaque photo.
- **Tap sur photo** : vue plein écran + options (régénérer, télécharger, partager)
- **Plats sans photo** : section « En attente » avec bouton générer
- **Progression** : barre de progression globale pendant la génération batch

### Écran 4 — Exporter

Hub d'export avec tous les formats disponibles :

- **PDF menu** — 14 thèmes visuels, prévisualisation, téléchargement
- **Photos ZIP** — toutes les photos en haute résolution
- **CSV Uber Eats** — format conforme pour import plateforme (Phase 3)
- **CSV Deliveroo** — format conforme pour import plateforme (Phase 3)
- **Lien web + QR** — menu consultable en ligne avec QR code (Phase 3)

---

## 6. Déduction automatique du style

Le cœur de la simplification : le restaurateur ne configure plus rien. Le système déduit le style à partir de ce qu'il sait.

### Logique de déduction

| Source | Ce qu'on en tire | Priorité |
|---|---|---|
| cuisine_profile_id | Ambiance, vaisselle, sauce, pain, éclairage (via CUISINE_PROFILES) | 1 — Principal |
| Noms des plats extraits | Catégorie du plat (pizza, burger, dessert...) via CATEGORY_STYLES | 2 — Par plat |
| Photo d'ambiance (si fournie) | Référence visuelle passée à gpt-image-1.5 | 3 — Bonus |
| Google Business data | Cuisine types, photos, description → détection auto du profil | 4 — Fallback |

Concrètement, si le restaurateur choisit « Kebab » comme profil et qu'un plat est détecté comme « burger », le prompt combine : ambiance kebab (barquette alu, sauce blanche) + catégorie burger (brioche bun, cheddar fondu). C'est ce qui fait déjà la force de la v1.

### Fallback sans profil cuisine

Si le restaurateur ne choisit pas de profil (skip), le système analyse les noms des plats extraits pour deviner :

| Plats détectés | Profil déduit |
|---|---|
| Kebab, Tacos XL, Assiette mixte | kebab |
| Margherita, Calzone, Tiramisu | pizza |
| Boeuf bourguignon, Crème brûlée | french_bistro |
| Pad Thaï, Nems, Bo bun | asian_fusion |
| Big Smash, Cheese Bacon, Onion Rings | burger |

Cette déduction se fait côté Edge Function (extract-menu) : le prompt GPT-4o retourne déjà les catégories. On ajoute un champ `detected_cuisine_profile` dans la réponse.

---

## 7. Modèle de données v2

Schéma cible complet, compatible avec la v1 (migration non-destructive).

### Table `restaurants` (NOUVELLE)

Déjà détaillée en section 2. C'est le pivot central.

### Table `menus` (modifiée)

| Champ | Changement | Raison |
|---|---|---|
| restaurant_id | AJOUT (FK restaurants) | Lie le menu au restaurant (remplace lead_id à terme) |
| lead_id | CONSERVÉ | Rétro-compatibilité pendant la migration |
| detected_cuisine_profile | AJOUT | Profil cuisine déduit des plats extraits |
| source_type | AJOUT | Type d'import : file, url, photo |

### Table `menu_items` (enrichie)

Les enrichissements déjà typés dans le code (tailles, supplements, accompagnements, allergenes, labels, disponible) sont appliqués en DB :

| Champ | Type | Statut |
|---|---|---|
| tailles | jsonb | Existe en TypeScript, à migrer en DB |
| supplements | jsonb | Existe en TypeScript, à migrer en DB |
| accompagnements | jsonb | Existe en TypeScript, à migrer en DB |
| allergenes | text[] | Existe en TypeScript, à migrer en DB |
| labels | text[] | Existe en TypeScript, à migrer en DB |
| disponible | boolean | Existe en TypeScript, à migrer en DB |
| item_type | text | Existe en TypeScript, à migrer en DB |
| position | integer | Déjà en DB |

### Table `leads` (conservée, simplifiée)

La table leads garde uniquement son rôle de facturation : credits_used, credits_purchased, stripe_customer_id. Les champs liés au restaurant (restaurant_name, style_description, etc.) migrent vers la table restaurants.

---

## 8. Roadmap par phases

### Phase 1 — Profil Restaurant + Parcours Express

**PRIORITÉ ABSOLUE** — 2-3 semaines

1. Créer la table `restaurants` + migration des données depuis leads
2. Créer l'écran **Profil Restaurant** (mobile-first)
3. Rendre le style optionnel dans **ImageGenerator** (fallback sur cuisine_profile)
4. Ajouter la **déduction auto du profil cuisine** dans extract-menu
5. Implémenter la **bottom navigation** mobile
6. Simplifier **FileUpload** : accès caméra + 3 options claires

> **Résultat Phase 1 :** Un restaurateur peut créer son profil, importer son menu, et voir ses photos générées en < 2 min depuis son téléphone. Zéro configuration de style requise.

### Phase 2 — Menu enrichi + Édition mobile

2-3 semaines

1. Migration DB : colonnes jsonb sur menu_items (tailles, supplements, allergènes)
2. Mettre à jour le prompt extract-menu pour extraire tailles/suppléments
3. Bottom sheet d'édition mobile (remplace le tableau desktop)
4. Gestion des catégories : réordonnancement, sous-catégories
5. Régénération photo avec instructions (« plus sombre », « angle différent »)

### Phase 3 — Exports multi-canaux

3-4 semaines

1. Export CSV Uber Eats (format conforme)
2. Export CSV Deliveroo (format conforme)
3. Menu web responsive : URL publique + QR code généré
4. Redimensionnement auto des photos par format (1200x800 Uber, carré Insta)

### Phase 4 — Mise en production

1-2 semaines

1. Deploy Vercel + domaine + Stripe live
2. CGU, mentions légales, RGPD
3. SEO basique + landing page optimisée mobile
4. Analytics (Plausible ou PostHog)

### Phase 5 — App native (futur)

À évaluer après validation du product-market fit

- PWA d'abord (Service Worker + manifest) pour l'installation sur écran d'accueil
- App native ensuite (React Native ou Capacitor) si la traction le justifie
- Intégration OpenClaw : automatisation (commandes vocales, WhatsApp, notifications)

---

## 9. Ce qui ne change pas

La v2 est une restructuration du parcours, pas une réécriture. Le moteur IA, le backend, et le système de paiement restent identiques.

| Composant | Statut v2 |
|---|---|
| Edge Functions (extract-menu, generate-dish-photo, etc.) | Conservées, enrichies |
| Supabase (Auth, Storage, DB) | Conservé |
| Stripe (crédits, checkout, webhook) | Conservé |
| gpt-image-1.5 + GPT-4o | Conservés |
| 14 styles de présentation PDF | Conservés |
| 24+ CATEGORY_STYLES | Conservés |
| CUISINE_PROFILES | Conservés (pivotés vers le restaurant) |
| Design system (or, cuivre, crème) | Conservé |
| Export PDF | Conservé, lié au restaurant au lieu du menu |
| i18n FR/EN | Conservé, à compléter |

---

## 10. Métriques de succès

| Métrique | Objectif | Mesure |
|---|---|---|
| Time-to-first-photo | < 2 min | Timer depuis inscription jusqu'à première photo affichée |
| Taux de complétion profil | > 80% | Profils avec cuisine_profile_id renseigné |
| Photos générées / session | > 10 | Moyenne de photos générées par visite |
| Usage mobile | > 60% | Part du trafic depuis mobile |
| Taux de conversion freemium | > 5% | Utilisateurs gratuits qui achètent un pack |
| NPS restaurateurs | > 40 | Enquête post-utilisation |

---

*Auguste v2 — Simple pour le restaurateur, puissant sous le capot.*
