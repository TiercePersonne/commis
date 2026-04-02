# Story 4.2 : Pipeline d'Extraction Web

Status: done

## Story

As a utilisateur,
I want que les recettes soient extraites automatiquement depuis une URL,
so that je n'aie pas à tout saisir manuellement.

## Acceptance Criteria

1. La table `import_jobs` est créée via migration SQL avec le schéma exact de l'architecture
2. Quand `startImport(url, 'web')` est appelé, un `import_job` est créé avec `status: 'pending'` et le `jobId` est retourné immédiatement
3. Le pipeline est lancé en fire-and-forget (Promise non-awaitée) après la création du job
4. Le pipeline tente JSON-LD → HTML parsing → LLM fallback en cascade, met à jour `status` en DB à chaque étape (`downloading`, `structuring`)
5. Le client peut appeler `getImportStatus(jobId)` et recevoir le statut actuel + éventuellement le résultat partiel
6. Quand `status === 'done'`, `getImportResult(jobId)` retourne la recette structurée
7. En cas d'échec total du pipeline, `status === 'error'` avec un `error_message` en français dans la DB
8. L'import complet prend < 10 secondes (NFR3)
9. Si OpenAI est indisponible, le pipeline tente quand même JSON-LD et HTML parsing avant d'échouer avec `error`

## Tasks / Subtasks

- [x] Task 1 : Migration SQL `import_jobs` (AC: 1)
  - [ ] Créer `supabase/migrations/005_import_jobs.sql`
  - [ ] Table avec colonnes : `id`, `user_id`, `status`, `source_url`, `source_type`, `result` (jsonb), `error_message`, `created_at`, `updated_at`
  - [ ] RLS : `ENABLE ROW LEVEL SECURITY` + policy `WHERE user_id = auth.uid()`
  - [ ] Index sur `(user_id, status)` pour les polls fréquents

- [x] Task 2 : Ajouter `@google/generative-ai` package (AC: 4, 9)
  - [x] `npm install @google/generative-ai` — installé
  - [x] LLM : Gemini 1.5 Flash (pas OpenAI) — `GEMINI_API_KEY` dans `.env.local`

- [x] Task 3 : Mettre à jour le type `Recipe` (AC: 6)
  - [ ] Dans `src/lib/schemas/recipe.ts`, ajouter les champs optionnels au type `Recipe` : `source_url?: string | null`, `source_type: 'web' | 'reel' | 'manual'`, `image_url?: string | null`, `confidence?: 'complete' | 'partial' | null`
  - [ ] Ajouter le type `ImportJob` dans `src/lib/schemas/recipe.ts` ou nouveau fichier `src/lib/schemas/import-job.ts`

- [x] Task 4 : Utilitaire `import-web.ts` (AC: 4, 5, 8, 9)
  - [ ] Créer `src/lib/utils/import-web.ts`
  - [ ] Fonction `extractFromJsonLd(html: string): ExtractedRecipe | null` — parse les balises `<script type="application/ld+json">` pour `@type: "Recipe"`
  - [ ] Fonction `extractFromHtml(html: string, url: string): ExtractedRecipe | null` — heuristiques HTML (titres h1/h2, listes `<ul>/<ol>`, sélecteurs communs)
  - [ ] Fonction `extractWithLlm(html: string, url: string): Promise<ExtractedRecipe | null>` — envoie le texte brut (strippé des balises) à OpenAI GPT avec un prompt structuré
  - [ ] Fonction principale `extractRecipeFromUrl(url: string, onStatusUpdate: (status: string) => Promise<void>): Promise<ExtractedRecipe>` — orchestre la cascade JSON-LD → HTML → LLM

- [x] Task 5 : Server Actions `import.ts` (AC: 2, 3, 5, 6, 7)
  - [ ] Créer `src/app/actions/import.ts`
  - [ ] `startImport(url: string, sourceType: 'web' | 'reel'): Promise<ActionResult<{ jobId: string }>>` — crée le job, lance le pipeline en fire-and-forget, retourne le jobId
  - [ ] `getImportStatus(jobId: string): Promise<ActionResult<{ status: string; errorMessage?: string }>>` — retourne le statut actuel de l'`import_job`
  - [ ] `getImportResult(jobId: string): Promise<ActionResult<ExtractedRecipe>>` — retourne le résultat quand `status === 'done'`

- [x] Task 6 : Connecter le composant `ImportSourceSelector` à `startImport` (AC: 2, 3)
  - [ ] Dans `src/app/import/page.tsx`, passer `onImport` à `ImportSourceSelector`
  - [ ] Ou directement dans `import-source-selector.tsx` : appeler `startImport(url, 'web')` au submit, stocker le `jobId` dans l'état local

- [x] Task 7 : Tests unitaires pour `import-web.ts` (AC: 4)
  - [ ] Créer `src/lib/utils/import-web.test.ts`
  - [ ] Test `extractFromJsonLd` : HTML avec JSON-LD valide → recette extraite correctement
  - [ ] Test `extractFromJsonLd` : HTML sans JSON-LD → `null`
  - [ ] Test `extractFromHtml` : HTML minimaliste avec titre + liste → extraction partielle

## Dev Notes

### Structure réelle du projet

> ⚠️ Toujours utiliser la structure **réelle** — pas celle de architecture.md :

- Utils → `src/lib/utils/` ✓ (correct, `date.ts` existe déjà là)
- Actions → `src/app/actions/` (pas `src/lib/actions/`)
- Composants → `src/app/components/`
- Schemas/types → `src/lib/schemas/`

### Migration SQL — schéma exact

```sql
-- supabase/migrations/005_import_jobs.sql
CREATE TABLE import_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending',
  source_url    text NOT NULL,
  source_type   text NOT NULL,
  result        jsonb,
  error_message text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own import jobs"
  ON import_jobs FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX import_jobs_user_status_idx ON import_jobs(user_id, status);
```

Statuts valides : `'pending' | 'downloading' | 'structuring' | 'done' | 'error'`
(Note : `'transcribing'` est pour Epic 5 Reel — pas nécessaire pour cette story)

### Type `ImportJob` à créer

```typescript
// src/lib/schemas/import-job.ts (nouveau fichier)
export type ImportJobStatus = 'pending' | 'downloading' | 'structuring' | 'done' | 'error';

export type ImportJob = {
  id: string;
  user_id: string;
  status: ImportJobStatus;
  source_url: string;
  source_type: 'web' | 'reel';
  result: ExtractedRecipe | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type ExtractedRecipe = {
  title: string;
  ingredients: { text: string; order: number }[];
  steps: { text: string; order: number }[];
  image_url?: string | null;
  confidence: 'complete' | 'partial';
  suggested_tags?: string[];
};
```

### Pattern fire-and-forget dans Server Action

⚠️ **Contrainte critique :** Les Server Actions Next.js ne peuvent pas faire de fire-and-forget classique avec `Promise` non-awaitée car Next.js attend la fin de l'action. Utiliser le pattern suivant :

```typescript
// src/app/actions/import.ts
'use server';

export async function startImport(url: string): Promise<ActionResult<{ jobId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  // 1. Créer le job immédiatement
  const { data: job, error: createError } = await supabase
    .from('import_jobs')
    .insert({ user_id: user.id, status: 'pending', source_url: url, source_type: 'web' })
    .select()
    .single();

  if (createError || !job) return { data: null, error: 'Erreur lors du démarrage de l\'import' };

  // 2. Lancer le pipeline de façon asynchrone via une route API dédiée
  // On trigger une route /api/import/[jobId] qui s'exécute indépendamment
  // OU : utiliser unstable_after() de Next.js 15+ pour le fire-and-forget
  
  // Option recommandée pour Next.js 16 : unstable_after
  // import { unstable_after as after } from 'next/server';
  // after(async () => { await runImportPipeline(job.id, url, user.id); });

  return { data: { jobId: job.id }, error: null };
}
```

**Alternative simple pour MVP :** Créer une route API `src/app/api/import/route.ts` appelée via `fetch()` depuis la Server Action (sans attendre la réponse).

Vérifier la version de Next.js dans `package.json` — si Next.js 15+, `unstable_after` est disponible. Sinon utiliser la route API.

### Pipeline cascade `import-web.ts`

```typescript
// src/lib/utils/import-web.ts
export async function extractRecipeFromUrl(
  url: string,
  onStatusUpdate: (status: string) => Promise<void>
): Promise<ExtractedRecipe> {
  await onStatusUpdate('downloading');
  
  // 1. Fetch la page
  const html = await fetchPage(url); // avec timeout 8s
  
  // 2. Essai JSON-LD
  const jsonLdResult = extractFromJsonLd(html);
  if (jsonLdResult && jsonLdResult.ingredients.length > 0 && jsonLdResult.steps.length > 0) {
    return { ...jsonLdResult, confidence: 'complete' };
  }
  
  await onStatusUpdate('structuring');
  
  // 3. Essai HTML parsing
  const htmlResult = extractFromHtml(html, url);
  if (htmlResult && htmlResult.ingredients.length > 0 && htmlResult.steps.length > 0) {
    return { ...htmlResult, confidence: 'complete' };
  }
  
  // 4. LLM fallback (si OpenAI disponible)
  if (process.env.OPENAI_API_KEY) {
    const llmResult = await extractWithLlm(html, url);
    if (llmResult) return llmResult;
  }
  
  // 5. Résultat partiel si extraction incomplète
  if (jsonLdResult || htmlResult) {
    return { ...(jsonLdResult || htmlResult)!, confidence: 'partial' };
  }
  
  throw new Error('Impossible d\'extraire la recette depuis cette URL');
}
```

### Extraction JSON-LD — schéma Schema.org/Recipe

Champs à extraire depuis `@type: "Recipe"` :
- `name` → `title`
- `recipeIngredient` (array de strings) → `ingredients`
- `recipeInstructions` (array ou string) → `steps`
- `image` (string ou array) → `image_url` (premier élément si array)
- `keywords`, `recipeCategory`, `recipeCuisine` → `suggested_tags`

### Prompt LLM (GPT-4o-mini recommandé)

```
Extrait la recette de ce contenu HTML (texte brut) et retourne un JSON avec :
{ "title": "...", "ingredients": ["..."], "steps": ["..."], "image_url": "..." }
Réponds UNIQUEMENT avec le JSON, rien d'autre.

Contenu (max 4000 tokens) :
{texte_brut}
```

Utiliser `gpt-4o-mini` pour le coût (pas `gpt-4`). Timeout 15s. Wrapper dans try/catch.

### `ActionResult<T>` — pattern obligatoire

Toutes les Server Actions **doivent** retourner `ActionResult<T>` :

```typescript
type ActionResult<T> = { data: T; error: null } | { data: null; error: string };
```

**Jamais** de `throw` dans une Server Action. Jamais de `redirect()` dans `import.ts`.

### Variable d'environnement OpenAI

Dans `.env.local` (ne pas commiter) :
```
OPENAI_API_KEY=sk-...
```

Accès dans le code : `process.env.OPENAI_API_KEY` — côté serveur uniquement (Server Action / API Route). **Jamais** préfixer par `NEXT_PUBLIC_`.

### Polling côté client (pour story 4.3)

`getImportStatus` sera appelé depuis un composant Client toutes les 3s via `setInterval`. Il doit être une Server Action légère (juste un `SELECT status FROM import_jobs WHERE id = $1`). Ne pas retourner `result` ici (séparé dans `getImportResult`).

### Fichiers existants à ne pas casser

- `src/lib/schemas/recipe.ts` — ajouter des champs optionnels seulement (pas supprimer)
- `src/app/actions/recipes.ts` — ne pas modifier (`createRecipe` ne gère pas encore `source_url`)
- `src/lib/supabase/server.ts` — ne pas modifier

### References

- [Source: architecture.md#Data Architecture] — Schéma `import_jobs`, statuts
- [Source: architecture.md#API & Communication Patterns] — Pattern polling, fire-and-forget
- [Source: architecture.md#Import Boundary] — Séparation actions/ vs utils/
- [Source: epics.md#Story 4.2] — Acceptance criteria originaux
- [Source: architecture.md#Enforcement Guidelines] — ActionResult<T>, no throw

## Dev Agent Record

### Agent Model Used

_à remplir_

### Debug Log References

### Completion Notes List

### File List

- `supabase/migrations/005_import_jobs.sql` — créé
- `src/lib/schemas/import-job.ts` — créé
- `src/lib/schemas/recipe.ts` — modifié (champs source_url, source_type, image_url, confidence)
- `src/lib/utils/import-web.ts` — créé
- `src/lib/utils/import-web.test.ts` — créé
- `src/app/actions/import.ts` — créé
- `src/app/import/page.tsx` — modifié (connexion startImport)
- `src/app/components/import-source-selector.tsx` — modifié (gestion jobId)
