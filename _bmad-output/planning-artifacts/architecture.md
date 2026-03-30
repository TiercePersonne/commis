---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-30'
inputDocuments: [prd.md, ux-design-specification.md, product-brief-commis-2026-02-09.md]
workflowType: 'architecture'
project_name: 'commis'
user_name: 'Gauthier'
date: '2026-03-30'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**36 Functional Requirements** en 7 catégories :
- Gestion recettes (FR1-FR6) — CRUD classique
- Import recettes (FR7-FR16b) — pipeline web à 3 niveaux (JSON-LD → HTML parsing → LLM fallback) + pipeline Reel (Whisper + LLM)
- Source & traçabilité (FR17)
- Organisation & recherche (FR18-FR26) — tags, filtres, recherche texte, scroll infini
- Planification (FR27-FR30) — grille semaine, CRUD slots
- Ingrédients & courses (FR31-FR33) — sélection + copie presse-papier
- Interface & accès (FR34-FR36) — responsive, français, auth

**21 Non-Functional Requirements** :
- Performance : FCP < 1.5s, TTI < 3s, import web < 10s, import Reel < 30s, 500+ recettes sans dégradation
- Sécurité/RGPD : HTTPS, export JSON, suppression compte, zéro tracking
- Résilience : 3 retries Reel, service externe down ≠ app down
- Accessibilité : WCAG AA

### Scale & Complexity

| Indicateur | Évaluation |
|------------|----------|
| Complexité globale | Basse-moyenne |
| Domaine technique | Full-stack web (Next.js + Supabase) |
| Temps réel | Non |
| Multi-tenancy | Schema prêt, un seul user MVP |
| Intégrations externes | 2 (scraping web + Whisper/OpenAI) |
| Complexité UI | Moyenne (9 custom components, meal planner grid) |
| Volume données | Faible (500 recettes max MVP) |
| Conformité réglementaire | RGPD basique (export + suppression) |

### Implications architecturales clés

1. **Pipeline web = 1 pipeline à 3 niveaux** (JSON-LD → HTML parsing → LLM fallback en cascade), pas 3 pipelines indépendants. Pipeline Reel séparé.
2. **Server Actions pour le CRUD rapide, streaming pour les imports longs** — Next.js 16 supporte le streaming des Server Actions, adapté au skeleton loading progressif.
3. **Pagination cursor-based** pour le scroll infini — `created_at` + `id`, plus robuste qu'offset si la collection change.
4. **Pas de temps réel** — pas de WebSockets, pas de Supabase Realtime.
5. **SPA derrière auth** — pas de SSR pour les pages app, pas de SEO.
6. **Schema multi-user dès le départ** — `user_id` sur chaque table, un seul compte MVP.
7. **Auto-save brouillons en localStorage** — limitation single-device, OK pour MVP.
8. **Copie presse-papier** — Clipboard API côté client uniquement.

### Technical Constraints & Dependencies

- **Stack imposée** : Next.js 16, React 19, TypeScript, Tailwind CSS v4, Supabase
- **Design System** : shadcn/ui + Radix UI
- **Dev solo** (Gauthier, intermédiaire, premier projet)
- **Pas de PWA, pas d'offline, pas de SEO**
- **Dépendance externe** : API OpenAI (Whisper + potentiellement GPT pour LLM fallback)

### Cross-Cutting Concerns

- **Auth** : Supabase Auth sur toutes les routes/actions
- **Error handling** : Gestion gracieuse des échecs d'import (résultat partiel)
- **RGPD** : Export JSON + suppression cascade sur toutes les tables
- **Responsive** : Mobile-first, breakpoint `lg` (1024px)
- **Images** : Stocker uniquement l'URL source (pas de téléchargement/stockage) — approche la plus économique. Fallback emoji/initiales si l'URL devient inaccessible.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web (Next.js + Supabase) — SPA mobile-first derrière authentification.

### Existing Project State

Projet déjà initialisé via `create-next-app`. Pas besoin de bootstrapper.

### Current Stack (package.json)

| Package | Version |
|---------|--------|
| Next.js | 16.1.6 (dernière stable : 16.2.1) |
| React | 19.2.3 |
| TypeScript | ^5 |
| Tailwind CSS | v4 (via @tailwindcss/postcss) |
| ESLint | ^9 + eslint-config-next |

### Architectural Decisions by Starter

- **App Router** (pas Pages Router)
- **TypeScript** strict
- **Tailwind CSS v4** avec PostCSS
- **Dossier `app/`** à la racine → migration vers `src/` prévue à l'implémentation (convention shadcn/ui)

### Dependencies à ajouter

| Package | Usage |
|---------|-------|
| `@supabase/supabase-js` + `@supabase/ssr` | Base de données + auth |
| shadcn/ui (CLI init) | Composants UI |
| `react-hook-form` + `zod` | Validation formulaires |
| `next/font/google` (Lora + Poppins) | Typographie |
| `eslint-plugin-jsx-a11y` | Accessibilité |
| `lucide-react` | Icônes |
| `vitest` | Tests unitaires |

**Note :** L'initialisation du projet et l'ajout des dépendances seront la première story d'implémentation.

## Core Architectural Decisions

### Data Architecture

**Database : Supabase (PostgreSQL)**

**Schéma :**

```
recipes
  id            uuid PK default gen_random_uuid()
  user_id       uuid FK -> auth.users NOT NULL
  title         text NOT NULL
  ingredients   jsonb NOT NULL  -- [{ "text": "400g blancs de poulet", "order": 0 }]
  steps         jsonb NOT NULL  -- [{ "text": "Couper les blancs...", "order": 0 }]
  source_url    text            -- URL d'origine (web ou Reel)
  source_type   text NOT NULL   -- 'web' | 'reel' | 'manual'
  image_url     text            -- URL de l'image source (pas de stockage)
  confidence    text            -- 'complete' | 'partial'
  notes         text            -- feedback texte libre
  created_at    timestamptz default now()
  updated_at    timestamptz default now()

tags
  id            uuid PK default gen_random_uuid()
  user_id       uuid FK -> auth.users NOT NULL
  name          text NOT NULL
  created_at    timestamptz default now()
  UNIQUE(user_id, name)

recipe_tags
  recipe_id     uuid FK -> recipes ON DELETE CASCADE
  tag_id        uuid FK -> tags ON DELETE CASCADE
  PRIMARY KEY(recipe_id, tag_id)

meal_plans
  id            uuid PK default gen_random_uuid()
  user_id       uuid FK -> auth.users NOT NULL
  recipe_id     uuid FK -> recipes ON DELETE CASCADE
  week_start    date NOT NULL        -- lundi ISO, date pure (pas de timestamp)
  day           smallint NOT NULL     -- 0 (lun) à 6 (dim)
  meal_type     text NOT NULL         -- 'lunch' | 'dinner'
  created_at    timestamptz default now()
  UNIQUE(user_id, week_start, day, meal_type)

import_jobs
  id            uuid PK default gen_random_uuid()
  user_id       uuid FK -> auth.users NOT NULL
  status        text NOT NULL    -- 'pending' | 'downloading' | 'transcribing' | 'structuring' | 'done' | 'error'
  source_url    text NOT NULL
  source_type   text NOT NULL    -- 'web' | 'reel'
  result        jsonb            -- résultat de l'extraction (recette structurée)
  error_message text
  created_at    timestamptz default now()
  updated_at    timestamptz default now()
```

**Décisions data :**
- Ingrédients et étapes en JSONB : `[{ text, order }]` — pas de parsing quantité/unité pour le MVP
- Images : URL source uniquement (pas de stockage Supabase Storage) — fallback emoji si URL inaccessible
- Migrations : Supabase CLI (`supabase migration`)
- Validation : Zod côté client + RLS côté Supabase
- Pas de cache serveur — volume trop faible pour le MVP

### Authentication & Security

- **Supabase Auth** : email/password, un seul compte MVP
- **RLS** sur toutes les tables : `WHERE user_id = auth.uid()`
- **Middleware Next.js** : vérification token Supabase via `@supabase/ssr` sur chaque route protégée
- **RGPD** : Server Action export JSON (toutes tables) + suppression cascade (`ON DELETE CASCADE` sur user_id)
- **Env vars** : `.env.local` pour Supabase URL, anon key, OpenAI key — jamais commité

### API & Communication Patterns

- **Server Actions** pour tout le CRUD rapide
- **Import en étapes (polling pattern)** pour les imports longs :
  1. `startImport(url)` → crée un `import_job`, retourne `jobId` (< 5s)
  2. Client poll `getImportStatus(jobId)` toutes les 3s
  3. `getImportResult(jobId)` quand status = 'done'
  - Chaque appel < 10s → compatible Vercel free tier
  - Traitement lourd (Whisper, LLM) via API OpenAI async
  - Le polling alimente le skeleton loading progressif
- **Typage retour Server Actions** : discriminated union
  ```typescript
  type ActionResult<T> =
    | { data: T; error: null }
    | { data: null; error: string }
  ```
- **Pas de rate limiting** — un seul utilisateur MVP

### Frontend Architecture

- **State** : React state local + Server Actions. Pas de store global (Redux, Zustand). Cache client via `useSWR` si besoin.
- **Composants** : `src/components/ui/` (shadcn) + `src/components/` (custom métier)
- **Routing** (App Router) :
  - `/` → Collection (page d'accueil)
  - `/recipes/[id]` → Vue recette détaillée
  - `/import` → Import (cartes sélecteurs + aperçu = état dans la même page, pas de route séparée)
  - `/planner` → Meal planner
  - `/profile` → Profil (export, suppression compte)
- **Performance** : `next/image` (lazy), virtualisation scroll infini, `next/font` (Lora + Poppins)

### Infrastructure & Deployment

- **Hosting** : Vercel (free tier — compatible grâce au pattern de polling pour les imports longs)
- **DB** : Supabase cloud (free tier : 500MB)
- **CI/CD** : Vercel auto-deploy sur push `main`
- **Monitoring** : Vercel Analytics (gratuit)
- **Pas de scaling** — un seul utilisateur

### Decision Impact Analysis

**Séquence d'implémentation :**
1. Setup projet (src/, deps, shadcn, fonts, design tokens)
2. Supabase (schema, RLS, auth)
3. CRUD recettes + collection
4. Formulaire + tags + recherche
5. Meal planner
6. Import web (pipeline cascade + polling)
7. Import Reel (Whisper + polling)

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (PostgreSQL/Supabase) :**
- Tables : `snake_case` pluriel → `recipes`, `tags`, `recipe_tags`, `meal_plans`, `import_jobs`
- Colonnes : `snake_case` → `user_id`, `source_url`, `created_at`
- Contraintes : `{table}_{colonnes}_{type}` → `meal_plans_user_id_week_start_day_meal_type_key`

**Code TypeScript :**
- Fichiers composants : `kebab-case.tsx` → `recipe-card.tsx`, `meal-planner-grid.tsx`
- Fichiers utilitaires : `kebab-case.ts` → `import-web.ts`, `supabase-client.ts`
- Composants React : `PascalCase` → `RecipeCard`, `MealPlannerGrid`
- Fonctions/variables : `camelCase` → `getRecipes`, `startImport`, `userId`
- Types/Interfaces : `PascalCase` → `Recipe`, `ImportJob`, `ActionResult<T>`
- Constantes : `UPPER_SNAKE_CASE` → `MAX_RETRIES`, `POLL_INTERVAL_MS`
- Server Actions : `camelCase` verbe + nom → `createRecipe`, `deleteTag`, `startImport`

**Routes Next.js :**
- `kebab-case` → `/recipes/[id]`, `/import`, `/planner`, `/profile`

### Structure Patterns

**Organisation projet :**

```
src/
  app/                    # Routes Next.js (App Router)
    (auth)/               # Routes protégées (layout avec auth check)
      page.tsx            # / → Collection
      recipes/[id]/page.tsx
      import/page.tsx
      planner/page.tsx
      profile/page.tsx
    login/page.tsx        # Route publique
    layout.tsx            # Root layout (fonts, providers)
    globals.css           # Tailwind + design tokens
  components/
    ui/                   # shadcn/ui (généré par CLI, ne pas modifier)
    recipe-card.tsx       # Custom métier
    recipe-preview.tsx
    import-source-selector.tsx
    ingredient-list.tsx
    meal-planner-grid.tsx
    recipe-picker-dialog.tsx
    slot-picker-dialog.tsx
    confidence-indicator.tsx
    empty-state.tsx
  lib/
    supabase/
      client.ts           # Supabase browser client
      server.ts           # Supabase server client
      middleware.ts        # Auth middleware
    actions/
      recipes.ts          # Server Actions CRUD recettes
      tags.ts             # Server Actions tags
      meal-plans.ts       # Server Actions planning
      import.ts           # Server Actions import (start, poll, result)
    utils/
      import-web.ts       # Pipeline web (JSON-LD → HTML → LLM)
      import-reel.ts      # Pipeline Reel (Whisper + LLM)
      clipboard.ts        # Copie ingrédients
  types/
    database.ts           # Types Supabase (générés)
    index.ts              # Types métier (Recipe, Tag, ImportJob, ActionResult)
```

**Règles :**
- Pas de dossier `__tests__/` séparé — tests co-localisés : `recipe-card.test.tsx` à côté de `recipe-card.tsx`
- Un composant par fichier
- Les Server Actions sont dans `src/lib/actions/` — jamais dans les composants
- Les utilitaires d'import sont dans `src/lib/utils/` — logique métier séparée des actions

### Format Patterns

**Retour Server Actions :**
```typescript
type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }
```
Jamais de `throw` dans les Server Actions — toujours retourner `{ data, error }`.

**Dates :**
- DB : `timestamptz` (ISO 8601)
- Client : `Date` natif JavaScript
- Affichage : `Intl.DateTimeFormat('fr-FR')` — jamais de lib de dates (dayjs, moment)
- `week_start` dans meal_plans : `YYYY-MM-DD` (date pure, toujours un lundi)

**JSON côté DB (JSONB) :**
- `snake_case` pour les clés → `{ "text": "...", "order": 0 }`

**JSON côté API/client :**
- `camelCase` pour les variables TypeScript
- Mapping automatique via les types Supabase (snake_case DB → camelCase TS)

### Process Patterns

**Error Handling :**
- Server Actions → retournent `{ data: null, error: "message lisible en français" }`
- Composants → affichent le `error` via Toast (erreur non-bloquante) ou inline (erreur formulaire)
- Import partiel → `confidence: 'partial'` + champs surlignes, jamais de perte de données
- Erreur réseau → message "Connexion perdue, réessayez" + bouton retry

**Loading States :**
- Chargement court (< 2s) : spinner dans le bouton (propriété `loading` du Button shadcn)
- Chargement long (import) : skeleton loading progressif via polling du statut `import_jobs`
- Collection : skeleton cards pendant le fetch initial
- Navigation : pas de loading global — chaque page gère son propre état

**Validation :**
- Schémas Zod dans `src/types/` — partagés entre formulaires et Server Actions
- Validation au blur côté client (react-hook-form + zod resolver)
- Validation côté serveur dans chaque Server Action (même schéma Zod)
- RLS Supabase comme dernière couche de sécurité

### Enforcement Guidelines

**Tous les agents IA DOIVENT :**
1. Utiliser `ActionResult<T>` pour tous les retours de Server Actions
2. Nommer les fichiers en `kebab-case`
3. Placer les Server Actions dans `src/lib/actions/`
4. Ne jamais modifier les fichiers dans `src/components/ui/` (shadcn)
5. Utiliser les design tokens CSS (pas de couleurs en dur)
6. Écrire les messages utilisateur en français
7. Ajouter `aria-label` sur les boutons icône-seule
8. Toujours vérifier `user_id` via RLS (jamais de filtre `WHERE user_id = ...` en dur dans le code)

**Anti-patterns à éviter :**
- `throw new Error()` dans une Server Action
- Couleur en dur (`#C4704B`) au lieu du token CSS (`var(--accent)`)
- Fichier composant en PascalCase (`RecipeCard.tsx` → utiliser `recipe-card.tsx`)
- Store global (Redux/Zustand) — utiliser React state local
- `moment.js` ou `dayjs` — utiliser `Intl.DateTimeFormat`
- Accès direct à Supabase depuis un composant client — toujours passer par une Server Action

## Project Structure & Boundaries

### Complete Project Directory Structure

```
commis/
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── .env.local                # SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY
├── .env.example              # Template sans valeurs
├── .gitignore
├── public/
│   └── favicon.ico
├── supabase/
│   ├── config.toml           # Config Supabase CLI
│   └── migrations/
│       ├── 001_recipes.sql
│       ├── 002_tags.sql
│       ├── 003_meal_plans.sql
│       └── 004_import_jobs.sql
└── src/
    ├── app/
    │   ├── layout.tsx          # Root layout (fonts Lora+Poppins, providers)
    │   ├── globals.css         # Tailwind v4 + design tokens CSS
    │   ├── (auth)/             # Route group — navigation (sidebar/tab bar)
    │   │   ├── layout.tsx      # Navigation uniquement (auth = middleware)
    │   │   ├── page.tsx        # / → Collection
    │   │   ├── recipes/
    │   │   │   └── [id]/
    │   │   │       └── page.tsx  # Vue recette détaillée
    │   │   ├── import/
    │   │   │   └── page.tsx      # Import (sélecteur + aperçu, même page)
    │   │   ├── planner/
    │   │   │   └── page.tsx      # Meal planner (grille semaine)
    │   │   └── profile/
    │   │       └── page.tsx      # Profil (export JSON, suppression compte)
    │   └── login/
    │       └── page.tsx        # Login (route publique)
    ├── components/
    │   ├── ui/                 # shadcn/ui — NE PAS MODIFIER
    │   ├── recipe-card.tsx
    │   ├── recipe-preview.tsx
    │   ├── import-source-selector.tsx
    │   ├── ingredient-list.tsx
    │   ├── meal-planner-grid.tsx
    │   ├── recipe-picker-dialog.tsx
    │   ├── slot-picker-dialog.tsx
    │   ├── confidence-indicator.tsx
    │   ├── empty-state.tsx
    │   ├── nav-sidebar.tsx     # Navigation desktop
    │   └── nav-tab-bar.tsx     # Navigation mobile
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts       # createBrowserClient()
    │   │   ├── server.ts       # createServerClient()
    │   │   └── middleware.ts    # Auth middleware helper
    │   ├── actions/
    │   │   ├── recipes.ts      # createRecipe, getRecipes, getRecipe, updateRecipe, deleteRecipe
    │   │   ├── tags.ts         # createTag, getTags, deleteTag, addTagToRecipe, removeTagFromRecipe
    │   │   ├── meal-plans.ts   # getMealPlan, addToSlot, removeFromSlot
    │   │   ├── import.ts       # startImport, getImportStatus, getImportResult
    │   │   └── profile.ts      # exportData, deleteAccount
    │   └── utils/
    │       ├── import-web.ts   # Pipeline: JSON-LD → HTML → LLM fallback
    │       ├── import-reel.ts  # Pipeline: download → Whisper → LLM
    │       ├── clipboard.ts    # formatIngredientsForClipboard()
    │       └── draft.ts        # saveDraft(), loadDraft(), clearDraft() — FR16b
    ├── types/
    │   ├── database.ts         # Output de `supabase gen types typescript` (généré, ne pas modifier)
    │   └── index.ts            # Types métier : Recipe, Tag, MealPlan, ImportJob, ActionResult<T>
    └── middleware.ts            # Next.js middleware → auth redirect vers /login
```

### Architectural Boundaries

**Auth Boundary :**
- `src/middleware.ts` → intercepte toutes les requêtes, redirige vers `/login` si pas de session
- `src/app/(auth)/layout.tsx` → navigation uniquement (sidebar/tab bar), PAS de vérification auth
- RLS Supabase → dernière ligne de défense, `user_id = auth.uid()` sur chaque table

**Data Boundary :**
- Composants → appellent Server Actions → accèdent à Supabase
- Jamais d'accès direct à Supabase depuis les composants client (y compris le polling)
- Les Server Actions sont le seul point d'accès aux données

**Import Boundary :**
- `src/lib/actions/import.ts` → orchestration (crée le job, lance le pipeline, retourne le statut)
- `src/lib/utils/import-web.ts` / `import-reel.ts` → logique métier pure (parsing, transcription)
- Les utils ne connaissent pas Supabase — elles prennent une URL et retournent une recette structurée

### Requirements to Structure Mapping

| FRs | Fichier principal |
|-----|------------------|
| FR1-FR6 (CRUD recettes) | `actions/recipes.ts` + `(auth)/page.tsx` + `recipes/[id]/page.tsx` |
| FR7-FR16 (Import) | `actions/import.ts` + `utils/import-web.ts` + `utils/import-reel.ts` + `import/page.tsx` |
| FR16b (Auto-save brouillon) | `utils/draft.ts` + `import/page.tsx` |
| FR17 (Source origine) | `recipe-card.tsx` + `recipes/[id]/page.tsx` (lien cliquable) |
| FR18-FR26 (Organisation) | `actions/tags.ts` + `(auth)/page.tsx` (filtres, recherche) |
| FR27-FR30 (Planning) | `actions/meal-plans.ts` + `planner/page.tsx` + `meal-planner-grid.tsx` |
| FR31-FR33 (Ingrédients) | `ingredient-list.tsx` + `utils/clipboard.ts` |
| FR34-FR36 (Interface) | `layout.tsx` + `middleware.ts` + `nav-sidebar.tsx` + `nav-tab-bar.tsx` |

### External Integrations

| Service | Usage | Point d'intégration |
|---------|-------|-------------------|
| Supabase Auth | Email/password login | `lib/supabase/` + `middleware.ts` |
| Supabase DB | PostgreSQL (toutes les tables) | `lib/actions/` |
| OpenAI Whisper | Transcription audio Reels | `lib/utils/import-reel.ts` |
| OpenAI GPT | LLM fallback (blogs narratifs) + structuration Reel | `lib/utils/import-web.ts` + `import-reel.ts` |
| Sites web tiers | Scraping JSON-LD / HTML | `lib/utils/import-web.ts` |

### Data Flow

```
[User] → [Component] → [Server Action] → [Supabase RLS] → [PostgreSQL]
                                        → [OpenAI API] (import uniquement)
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility :** Toutes les technologies compatibles (Next.js 16 + React 19 + TS + Tailwind v4 + shadcn + Supabase + Vercel).

**Pattern Consistency :** Aucune contradiction — naming cohérent (snake_case DB → camelCase TS), ActionResult<T> uniforme, auth boundary claire.

**Structure Alignment :** L'arborescence supporte toutes les décisions (route group auth, lib/actions séparé de lib/utils, types générés vs métier).

### Requirements Coverage ✅

- **36/36 FRs couverts** — chaque FR mappé à un fichier spécifique
- **21/21 NFRs couverts** — performance (Vercel, next/image, cursor-based), sécurité (RLS, HTTPS), résilience (polling, retries), accessibilité (WCAG AA, Radix)

### Testing Strategy (MVP)

**Framework : Vitest**
- Rapide, compatible TypeScript natif, zero-config
- Script : `"test": "vitest"` dans package.json
- Tests co-localisés (`*.test.ts` à côté des fichiers)

**Ce qu'on teste dès le Bloc 1 :**
- **Schémas Zod** (`types/index.test.ts`) — validation des structures de données
- **Server Actions** (`actions/*.test.ts`) — retours `ActionResult<T>` corrects (mock Supabase)
- **Utils pures** (`utils/*.test.ts`) — `clipboard.ts`, `draft.ts`, fonctions sans dépendance

**Ce qu'on ne teste PAS pour le MVP :**
- Composants React (nécessite Testing Library)
- E2E (Playwright)

### Gap Analysis

- **Gaps critiques :** Aucun
- **Gaps importants :** `react-window` (scroll infini) à ajouter au Bloc 2
- **Gaps nice-to-have :** Seed data, monitoring (Sentry), tests composants — post-MVP

### Architecture Readiness Assessment

**Statut : PRÊT POUR L'IMPLÉMENTATION** ✅

**Confiance : Haute**

**Points forts :**
- Stack cohérente et moderne
- Boundaries claires (auth, data, import)
- Patterns détaillés avec exemples et anti-patterns
- 36 FRs + 21 NFRs couverts
- Structure projet complète jusqu'au fichier
- Tests basiques dès le départ

**Améliorations futures (post-MVP) :**
- Testing Library pour composants React
- Playwright pour E2E
- Monitoring (Sentry)
- Cache client (SWR) si performance insuffisante
