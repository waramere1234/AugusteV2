---
name: update-architecture
description: |
  Met à jour automatiquement le fichier docs/architecture.md après chaque modification significative du code.
  Utilise ce skill après avoir ajouté, supprimé ou modifié : des fichiers source (pages, composants, hooks, lib),
  des types TypeScript, des tables Supabase, des Edge Functions, des routes, des constantes métier,
  ou tout changement qui affecte la façon dont les parties du projet se connectent entre elles.
  Déclenche aussi quand l'utilisateur dit "mets à jour la fiche technique", "update l'architecture",
  "synchronise la doc", "explique comment ça marche", ou toute mention de documentation technique du projet.
  IMPORTANT : ce skill doit être utilisé de manière proactive après toute modification de code substantielle,
  même si l'utilisateur ne le demande pas explicitement.
---

# Mise à jour de la fiche technique (architecture.md)

Ce skill maintient `docs/architecture.md` synchronisé avec l'état réel du code. Le fichier architecture.md est **la carte du projet Auguste** — il doit permettre à quelqu'un qui ne connaît pas le code de comprendre comment l'app fonctionne en 5 minutes.

## Philosophie

Boz (l'utilisateur) est novice en développement. La fiche technique est son repère principal. Elle doit répondre à trois questions :

1. **Quoi** — qu'est-ce qui existe dans le code ? (structure, fichiers, types)
2. **Comment** — comment les pièces s'emboîtent ? (flux de données, parcours utilisateur)
3. **Pourquoi** — pourquoi c'est fait comme ça ? (décisions techniques, contraintes)

Le "quoi" seul n'est pas suffisant. Un listing de fichiers sans explication de comment ils interagissent ne sert pas à grand-chose. Le vrai travail de ce skill est de rendre les connexions visibles.

## Quand exécuter ce skill

Après toute modification qui change la structure OU le comportement du projet :

- Ajout/suppression d'un fichier dans `src/` (page, composant, hook, lib)
- Modification des types dans `src/types/index.ts`
- Ajout/modification d'une table Supabase
- Ajout/modification d'une Edge Function
- Changement de route dans `App.tsx`
- Modification des constantes métier (cuisineProfiles, presentationStyles)
- Changement de dépendance majeure dans `package.json`
- Ajout d'un nouveau flux métier (ex: nouveau parcours utilisateur)
- Découverte d'un gotcha ou d'une contrainte technique importante

## Procédure

### Étape 1 : Scanner l'état actuel du code

Lire ces fichiers pour comprendre l'état réel du projet :

```
src/App.tsx                    → Routes actuelles
src/types/index.ts             → Types/interfaces TypeScript
src/lib/*.ts, src/lib/*.tsx    → Modules utilitaires
src/hooks/*.ts                 → Hooks custom
src/pages/*.tsx                → Pages (1 page = 1 route)
src/components/**/*.tsx        → Composants UI (layout + feature)
src/constants/*.ts             → Constantes métier
package.json                   → Dépendances et scripts
```

Utiliser `Glob` pour lister tous les fichiers dans `src/` et ses sous-dossiers, puis `Read` pour inspecter les fichiers clés. Ne pas se limiter aux noms de fichiers — lire le contenu pour comprendre les connexions.

### Étape 2 : Lire le fichier architecture.md actuel

Lire `docs/architecture.md` en entier. Si le fichier n'existe pas, le créer from scratch.

### Étape 3 : Comparer et identifier les différences

Pour chaque section du document, vérifier :

| Section | Source de vérité |
|---|---|
| Stack | `package.json` + `CLAUDE.md` |
| Modèle de données | Tables Supabase (utiliser le MCP Supabase si disponible, sinon `src/types/index.ts`) |
| Edge Functions | Liste des fonctions Supabase (MCP) ou section Edge Functions du `CLAUDE.md` |
| Design system | `src/index.css` + constantes dans `CLAUDE.md` |
| Structure du projet | Arborescence réelle de `src/` |
| Routes | `src/App.tsx` |
| Hooks | Fichiers dans `src/hooks/` |
| Composants | Fichiers dans `src/components/` |
| Constantes métier | Fichiers dans `src/constants/` |
| Flux métier | Code des pages + hooks (qui appelle quoi, dans quel ordre) |

En plus de la structure, identifier :
- **Nouvelles connexions** entre composants (ex: un hook qui utilise un autre hook)
- **Flux de données** qui traversent plusieurs fichiers (ex: menu import → extraction → stockage)
- **Points d'attention** découverts pendant le code (gotchas, contraintes, limites)

### Étape 4 : Mettre à jour le document

Réécrire uniquement les sections qui ont changé. Conserver le format et le style du document existant.

#### Structure du document

Le document doit suivre cette structure :

```markdown
# Architecture technique — Auguste v2

**Dernière MAJ :** [mois année]

---

## Stack
[Tableau couche/techno]

---

## Modèle de données
[Schéma ASCII des tables et relations]

---

## Flux métier
[Diagrammes ASCII des parcours clés : import menu, génération photos, paiement]

---

## Edge Functions
[Tableau fonction/provider/rôle]

---

## Design system
[Couleurs, typographie, styles de présentation]

---

## Structure du projet
[Arborescence src/ avec descriptions courtes]

---

## Routes
[Liste des routes avec composant et description]

---

## Composants
[Tableau des composants organisés par dossier, avec rôle]

---

## Hooks custom
[Tableau des hooks avec description du rôle et dépendances]

---

## Constantes métier
[Résumé des constantes : nombre de profils, styles, etc.]

---

## Notes techniques
[Décisions, gotchas, contraintes — ce qu'il faut savoir pour ne pas se piéger]
```

#### Section "Flux métier" — comment l'écrire

C'est la section la plus utile. Elle montre comment les pièces s'emboîtent en suivant le parcours de l'utilisateur. Utiliser des diagrammes ASCII simples avec des flèches :

```markdown
## Flux métier

### Import menu
Utilisateur uploade un fichier (photo, PDF, ou URL)
→ MenuPage appelle ensureSession() + Edge Function `extract-menu`
→ GPT-4o analyse le fichier et retourne les plats structurés
→ Les plats sont insérés dans `menu_items` via Supabase
→ MenuPage affiche la carte importée

### Génération photos
Utilisateur sélectionne des plats dans PhotosPage
→ Le cuisine_profile_id du restaurant détermine le style visuel
→ PhotosPage appelle `generate-dish-photo` pour chaque plat
→ Les images sont stockées dans Supabase Storage
→ generated_images est créé avec l'URL et le prompt utilisé
→ Les crédits sont décrémentés côté serveur (jamais côté client)
```

Le format exact peut varier, mais chaque flux doit montrer : **qui déclenche → quoi se passe → où c'est stocké**.

#### Section "Notes techniques" — comment l'écrire

Cette section capture ce qui n'est pas évident en lisant le code. Deux types de notes :

1. **Décisions** — pourquoi c'est fait comme ça (ex: "Les crédits sont gérés côté serveur pour éviter la fraude côté client")
2. **Gotchas** — ce qui peut surprendre (ex: "ensureSession() doit toujours être appelé avant un appel Edge Function, sinon le token peut être expiré")

Format :

```markdown
## Notes techniques

- **ensureSession() obligatoire** — Toujours appeler `ensureSession()` avant un appel Edge Function. Sans ça, le token JWT peut être expiré et l'appel échoue silencieusement.
- **Crédits serveur-only** — Les crédits sont décrémentés par les Edge Functions, jamais par le frontend. Le frontend affiche le solde mais ne le modifie pas.
- **cuisine_profile_id est le pivot IA** — Ce champ sur `restaurants` détermine le style de toutes les photos générées. Changer le profil cuisine change le rendu de toutes les futures photos.
```

Ne pas remplir cette section de choses évidentes. Chaque note doit faire gagner du temps à quelqu'un qui lirait le code pour la première fois.

#### Section "Composants" — comment l'écrire

Organiser les composants par dossier fonctionnel, pas en vrac :

```markdown
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
| `GoogleBusinessCard` | Carte affichant les infos Google Business du restaurant |
| `CuisineSelector` | Sélecteur de profil cuisine (38 options) |
```

#### Règles de rédaction

- **Concis** : chaque description tient en 1 ligne (max ~80 caractères)
- **Factuel** : décrire ce qui EXISTE, pas ce qui est prévu
- **Lisible** : Boz est novice, éviter le jargon sans explication
- **Date de MAJ** : toujours mettre à jour la date en haut du document
- **ASCII pour les schémas** : diagrammes texte simples avec des flèches, pas de syntaxe Mermaid ou complexe
- **Pas de duplication avec CLAUDE.md** : architecture.md montre comment ça marche, CLAUDE.md donne les règles de dev

### Étape 5 : Vérifier la cohérence

Après la mise à jour, relire le document complet et vérifier :
- Aucune référence à des fichiers qui n'existent plus
- Aucun fichier existant oublié dans la structure
- Les types listés correspondent à `src/types/index.ts`
- Les routes listées correspondent à `App.tsx`
- Les flux métier reflètent le code réel des pages/hooks
- Les notes techniques sont toujours valides
- La date de MAJ est à jour

### Étape 6 : Informer l'utilisateur

Résumer les changements en 2-3 lignes, par exemple :
> Fiche technique mise à jour : ajouté le flux "import menu", mis à jour les hooks (4 hooks maintenant), ajouté les composants profile/, ajouté 3 notes techniques.
