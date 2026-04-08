# Story 4.3 : Aperçu, Correction & Sauvegarde

Status: done

## Story

As a utilisateur,
I want vérifier et corriger la recette extraite avant de la sauvegarder,
so that je sois sûr que les données sont correctes.

## Acceptance Criteria

1. Quand `status === 'done'`, un aperçu affiche tous les champs pré-remplis : titre, ingrédients, étapes, image URL
2. Un `ConfidenceIndicator` affiche "Recette complète" (confidence='complete') ou "À vérifier" (confidence='partial') avec les champs manquants surlignes
3. Tous les champs de l'aperçu sont modifiables (titre en input text, ingrédients et étapes en liste éditable)
4. Chaque modification est auto-sauvegardée dans localStorage via `draft.ts` (`saveDraft`, `loadDraft`, `clearDraft`)
5. Au chargement de la page `/import`, si un brouillon existe en localStorage, proposer "Reprendre le brouillon ?"
6. Des tags sont suggérés automatiquement par l'IA (depuis `suggested_tags` dans le résultat d'extraction) — l'utilisateur peut les ajouter/retirer avant sauvegarde
7. En confirmant, la recette est sauvegardée en DB avec `source_url`, `source_type: 'web'`, `confidence`, `image_url`
8. À n'importe quelle étape, cliquer "Annuler" vide le brouillon localStorage et revient à la page d'import vierge
9. Pendant le polling (status pending/downloading/structuring), un skeleton loading progressif est affiché

## Tasks / Subtasks

- [x] Task 1 : Créer `draft.ts` (AC: 4, 5, 8)
  - [ ] Créer `src/lib/utils/draft.ts`
  - [ ] `saveDraft(draft: Partial<ExtractedRecipe>): void` — `localStorage.setItem('import_draft', JSON.stringify(draft))`
  - [ ] `loadDraft(): Partial<ExtractedRecipe> | null` — parse et retourne le brouillon ou null
  - [ ] `clearDraft(): void` — `localStorage.removeItem('import_draft')`
  - [ ] Écrire `src/lib/utils/draft.test.ts` — tester save/load/clear avec mock localStorage

- [x] Task 2 : Créer `ConfidenceIndicator` (AC: 2)
  - [ ] Créer `src/app/components/confidence-indicator.tsx` — Client Component
  - [ ] Props : `confidence: 'complete' | 'partial'`
  - [ ] `'complete'` → badge vert "✓ Recette complète"
  - [ ] `'partial'` → badge orange "⚠ À vérifier — certains champs peuvent être incomplets"

- [x] Task 3 : Créer `RecipePreview` (AC: 1, 2, 3, 4, 6)
  - [ ] Créer `src/app/components/recipe-preview.tsx` — Client Component (`'use client'`)
  - [ ] Props : `initialRecipe: ExtractedRecipe`, `onSave: (recipe: ExtractedRecipe) => Promise<void>`, `onCancel: () => void`
  - [ ] Champ titre : `<input type="text">` éditable
  - [ ] Ingrédients : liste de `<input>` éditables avec boutons ajouter/supprimer
  - [ ] Étapes : idem
  - [ ] Image URL : champ texte optionnel (avec aperçu `<img>` si valide)
  - [ ] `ConfidenceIndicator` en haut
  - [ ] Section tags : afficher `suggested_tags` de l'extraction, intégrer `TagSelector` existant (`src/app/components/tag-selector.tsx`)
  - [ ] `useEffect` qui appelle `saveDraft(currentState)` à chaque modification (debounce 500ms)
  - [ ] Bouton "Sauvegarder" → appelle `onSave`
  - [ ] Bouton "Annuler" → appelle `clearDraft()` puis `onCancel()`

- [x] Task 4 : Polling et skeleton dans `import/page.tsx` (AC: 5, 9)
  - [ ] Convertir `src/app/import/page.tsx` en Client Component (`'use client'`) pour gérer l'état du flow
  - [ ] États : `'idle' | 'polling' | 'preview' | 'saving'`
  - [ ] Quand `jobId` reçu → démarrer `setInterval` toutes les 3s qui appelle `getImportStatus(jobId)`
  - [ ] Pendant polling : afficher un `SkeletonImport` (3 blocs gris animés — titre, ingrédients, étapes)
  - [ ] Quand `status === 'done'` → arrêter le poll, appeler `getImportResult(jobId)`, passer en état `'preview'`
  - [ ] Au montage : vérifier `loadDraft()` — si brouillon, afficher banner "Vous avez un brouillon non sauvegardé. [Reprendre] [Ignorer]"
  - [ ] Nettoyer l'intervalle dans le `return` du `useEffect` (éviter les fuites mémoire)

- [x] Task 5 : `saveImportedRecipe` ajoutée dans `actions/recipes.ts` (AC: 7)
  - [ ] Dans `src/app/actions/recipes.ts`, créer une nouvelle action `saveImportedRecipe(recipe: ExtractedRecipe, jobId: string): Promise<ActionResult<{ id: string }>>` (ne pas modifier `createRecipe` existant)
  - [ ] Cette action insère la recette avec `source_url`, `source_type: 'web'`, `image_url`, `confidence`
  - [ ] Met à jour `import_jobs` : marquer le job comme lié (`result` déjà rempli par le pipeline)
  - [ ] Après sauvegarde : `clearDraft()` côté client, `revalidatePath('/')`, redirect vers `/recipes/{id}`

- [x] Task 6 : Tags suggérés (AC: 6)
  - [ ] Dans `RecipePreview`, `suggested_tags` du résultat LLM sont des noms de tags (strings)
  - [ ] Avant d'afficher, vérifier si ces tags existent déjà via `getTags()` — créer ceux qui manquent via `createTag()` si l'utilisateur confirme
  - [ ] Réutiliser le composant `TagSelector` existant (`src/app/components/tag-selector.tsx`)

## Dev Notes

### Structure réelle du projet

> ⚠️ Toujours utiliser la structure **réelle** :
- Composants → `src/app/components/`
- Actions → `src/app/actions/`
- Utils → `src/lib/utils/`

### `draft.ts` — localStorage côté client uniquement

`localStorage` n'est accessible qu'en navigateur. Le fichier `draft.ts` doit **ne pas** importer de modules serveur. Toutes les fonctions s'exécutent côté client. Dans les tests, mocker `localStorage` :

```typescript
// src/lib/utils/draft.test.ts
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
```

Clé localStorage : `'commis_import_draft'` (préfixer avec le nom de l'app pour éviter les conflits).

### Polling avec `setInterval` dans React

Pattern recommandé avec cleanup :

```typescript
useEffect(() => {
  if (!jobId || status !== 'polling') return;
  
  const intervalId = setInterval(async () => {
    const result = await getImportStatus(jobId);
    if (result.error) {
      clearInterval(intervalId);
      setImportStatus('error');
      return;
    }
    if (result.data?.status === 'done') {
      clearInterval(intervalId);
      const recipeResult = await getImportResult(jobId);
      if (recipeResult.data) {
        setExtractedRecipe(recipeResult.data);
        setPageState('preview');
      }
    } else if (result.data?.status === 'error') {
      clearInterval(intervalId);
      setImportError(result.data.errorMessage ?? 'Erreur inconnue');
      setPageState('error');
    }
  }, 3000);
  
  return () => clearInterval(intervalId); // cleanup
}, [jobId, status]);
```

### `RecipePreview` — liste éditable d'ingrédients/étapes

Pattern pour la liste éditable (même structure que JSONB : `{ text, order }`) :

```tsx
{ingredients.map((item, index) => (
  <div key={index} className="flex gap-2 items-center">
    <input
      type="text"
      value={item.text}
      onChange={(e) => updateIngredient(index, e.target.value)}
      className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)]"
    />
    <button onClick={() => removeIngredient(index)} aria-label="Supprimer cet ingrédient">×</button>
  </div>
))}
<button onClick={addIngredient}>+ Ajouter un ingrédient</button>
```

### `ConfidenceIndicator` — design

Utiliser les tokens CSS uniquement :
- `'complete'` → fond `#d4edda` (vert clair), texte `#155724`, icône `✓`
- `'partial'` → fond token accent light, texte `var(--color-accent)`, icône `⚠`

Ou utiliser des classes inline avec les tokens existants si les couleurs vert ne sont pas dans les tokens — dans ce cas, exprimer en `style={{ backgroundColor: '...', color: '...' }}` avec des hex valeurs neutres.

### `saveImportedRecipe` vs `createRecipe` existant

**Ne pas modifier** `createRecipe` — il est utilisé par le formulaire de création manuelle. Créer une action séparée `saveImportedRecipe` dans `src/app/actions/recipes.ts` :

```typescript
export async function saveImportedRecipe(
  recipe: ExtractedRecipe,
  tagIds: string[]
): Promise<ActionResult<{ id: string }>> {
  // ...
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      source_url: recipe.source_url,  // nécessite champ sur ExtractedRecipe
      source_type: 'web',
      image_url: recipe.image_url,
      confidence: recipe.confidence,
    })
    .select()
    .single();
  // ...
}
```

`ExtractedRecipe` doit avoir `source_url?: string` (ajouté lors du pipeline — l'URL de la page importée).

### `TagSelector` existant

Le composant `src/app/components/tag-selector.tsx` existe déjà. Vérifier son interface de props avant de l'utiliser dans `RecipePreview` pour ne pas la casser.

### Skeleton loading

Composant inline dans `import/page.tsx` (pas besoin d'un fichier séparé) :

```tsx
function SkeletonImport() {
  return (
    <div className="animate-pulse space-y-4 mt-8">
      <div className="h-8 bg-[var(--color-border)] rounded-[var(--radius-md)] w-2/3" />
      <div className="space-y-2">
        {[1,2,3].map(i => (
          <div key={i} className="h-4 bg-[var(--color-border-light)] rounded w-full" />
        ))}
      </div>
    </div>
  );
}
```

### Auto-save debounce

```typescript
const saveTimeout = useRef<NodeJS.Timeout>(null);

const handleFieldChange = (updates: Partial<ExtractedRecipe>) => {
  const newRecipe = { ...currentRecipe, ...updates };
  setCurrentRecipe(newRecipe);
  
  if (saveTimeout.current) clearTimeout(saveTimeout.current);
  saveTimeout.current = setTimeout(() => saveDraft(newRecipe), 500);
};
```

### References

- [Source: architecture.md#API & Communication Patterns] — Pattern polling
- [Source: architecture.md#Structure Patterns] — `draft.ts`, `confidence-indicator.tsx`, `recipe-preview.tsx`
- [Source: epics.md#Story 4.3] — Acceptance criteria originaux
- [Source: ux-design-specification.md#Import Strategy] — Post-import commun, auto-save, ConfidenceIndicator
- [Source: tag-selector.tsx] — Composant réutilisable tags existant

## Dev Agent Record

### Agent Model Used

Cascade (Windsurf)

### Debug Log References

### Completion Notes List

#### ⚠️ Divergence : Images stockées dans Supabase Storage

L'architecture (`architecture.md`, Cross-Cutting Concerns) prescrit : *"Images : stocker uniquement l'URL source (pas de téléchargement/stockage) — fallback emoji/initiales si l'URL devient inaccessible."*

**Implémentation réelle :** Un bucket Supabase Storage `recipe-images` a été créé (migration `007_recipe_images_bucket.sql`). Lors d'une édition manuelle de recette, si l'utilisateur colle une URL d'image accessible (HTTP 200 + `Content-Type: image/*`), l'image est copiée dans Storage et l'URL publique Supabase remplace l'URL d'origine en base.

**Pourquoi :** Certains sites (ex: `lacuisinedebernard.com`) bloquent toutes les requêtes serveur (403 IP-based), rendant l'URL d'origine inutilisable. Le Storage garantit l'affichage durable même si le site source coupe l'accès.

**Comportement réel de `saveImportedRecipe` :** L'`image_url` extraite est sauvegardée telle quelle en DB (pas d'upload automatique à l'import). L'upload n'intervient que si l'utilisateur édite manuellement l'`image_url` via le formulaire de modification (`updateRecipe`).

**Composants ajoutés hors scope initial :**
- `src/lib/utils/image.ts` — helpers `getImageSrc()` et `getImageProxySrc()`
- `src/app/components/recipe-image.tsx` — Client Component avec fallback proxy deux niveaux (URL directe → proxy → icône 🍽️)
- `src/app/api/image-proxy/route.ts` — proxy serveur pour contourner l'hotlink protection
- `supabase/migrations/007_recipe_images_bucket.sql` — bucket `recipe-images` public

**Champ `image_url` éditable dans le formulaire de modification :**
Le formulaire `src/app/recipes/[id]/edit/page.tsx` a été enrichi d'un champ `image_url` avec aperçu live, permettant à l'utilisateur de coller manuellement une URL d'image valide (ex: depuis le CDN d'un site). Ce champ n'était pas prévu dans la story 1.4 (Modifier une recette).

#### Note : Migration `006_recipes_import_fields.sql`

Les champs `source_url`, `source_type`, `image_url`, `confidence` ont été ajoutés à la table `recipes` via une migration dédiée `006_recipes_import_fields.sql`, séparément de la création initiale de la table.

### File List

- `src/lib/utils/draft.ts` — créé
- `src/lib/utils/draft.test.ts` — créé
- `src/app/components/confidence-indicator.tsx` — créé
- `src/app/components/recipe-preview.tsx` — créé (inclut champ image_url avec aperçu live)
- `src/app/import/page.tsx` — modifié (Client Component, polling, états, skeleton, draft banner)
- `src/app/actions/recipes.ts` — modifié (ajout `saveImportedRecipe`, champ `image_url` dans `updateRecipe`)
- `src/lib/utils/image.ts` — créé (hors scope, helpers image)
- `src/app/components/recipe-image.tsx` — créé (hors scope, fallback proxy)
- `src/app/api/image-proxy/route.ts` — créé (hors scope, proxy anti-hotlink)
- `supabase/migrations/006_recipes_import_fields.sql` — créé
- `supabase/migrations/007_recipe_images_bucket.sql` — créé (hors scope, divergence architecture)
