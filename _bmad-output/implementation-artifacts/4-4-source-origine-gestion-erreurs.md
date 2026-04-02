# Story 4.4 : Source d'Origine & Gestion d'Erreurs

Status: done

## Story

As a utilisateur,
I want accéder à la source d'origine et comprendre les erreurs d'import,
so that je puisse vérifier la recette originale ou corriger le problème.

## Acceptance Criteria

1. Sur la page `/recipes/[id]`, si la recette a un `source_url`, un lien cliquable "Voir la source" est affiché (ouvre dans un nouvel onglet)
2. Quand le pipeline d'import échoue, un message d'erreur explicite en français est affiché sur la page `/import` (URL invalide, site inaccessible, extraction impossible)
3. Sur la page d'erreur d'import, un bouton "Réessayer" permet de relancer l'import avec la même URL
4. Si OpenAI est indisponible, l'app continue de fonctionner (pipeline tente JSON-LD et HTML avant d'échouer — NFR17)
5. Les messages d'erreur sont distincts selon le cas : URL invalide, site inaccessible (timeout/403), extraction impossible (aucun contenu exploitable)

## Tasks / Subtasks

- [x] Task 1 : Lien source sur la page recette (AC: 1)
  - [ ] Dans `src/app/recipes/[id]/page.tsx`, vérifier si `recipe.source_url` est non-null
  - [ ] Si présent : afficher un lien `<a href={recipe.source_url} target="_blank" rel="noopener noreferrer">Voir la source originale</a>` avec icône lien externe (Lucide `ExternalLink`)
  - [ ] Style : `text-[var(--color-text-muted)] text-sm hover:text-[var(--color-accent)] flex items-center gap-1`

- [x] Task 2 : Messages d'erreur explicites dans le pipeline (AC: 2, 4, 5)
  - [ ] Dans `src/lib/utils/import-web.ts`, distinguer les types d'erreurs :
    - URL invalide (non-HTTP) : `"URL invalide. Vérifiez que l'adresse commence par http:// ou https://"`
    - Site inaccessible (timeout, 403, 404) : `"Impossible d'accéder à ce site. Il est peut-être privé ou indisponible."`
    - Extraction impossible (aucun résultat) : `"Impossible d'extraire la recette depuis cette page. Essayez de copier-coller le contenu manuellement."`
    - OpenAI indisponible : pipeline continue avec résultat partiel ou échec gracieux sans crasher
  - [ ] Dans `src/app/actions/import.ts`, propager `error_message` lisible dans l'`import_job`

- [x] Task 3 : Affichage erreur + bouton Réessayer dans `import/page.tsx` (AC: 2, 3)
  - [ ] Quand `pageState === 'error'`, afficher :
    - Message d'erreur récupéré depuis `importError` (string en français)
    - Bouton "Réessayer" qui remet l'URL dans le champ et repasse en état `'idle'`
    - Bouton "Nouvelle URL" qui vide tout et remet en état `'idle'`
  - [ ] Design : card avec bordure rouge/orange, icône `AlertCircle` (Lucide), message lisible

- [x] Task 4 : Tests (AC: 2, 4, 5)
  - [ ] Dans `src/lib/utils/import-web.test.ts` (existant depuis story 4.2) :
    - Test : URL qui retourne 404 → erreur "Impossible d'accéder"
    - Test : fetch qui throw (réseau) → erreur "Impossible d'accéder"
    - Test : page sans contenu recette + OpenAI mock indisponible → erreur "Impossible d'extraire"
    - Test : OpenAI indisponible → fallback sur résultat HTML partiel si disponible

## Dev Notes

### Structure réelle du projet

> ⚠️ Utiliser la structure **réelle** :
- Pages → `src/app/recipes/[id]/page.tsx` (vérifier le chemin exact)
- Composants → `src/app/components/`
- Actions → `src/app/actions/`

### Page recette `/recipes/[id]` — structure existante

Vérifier `src/app/recipes/[id]/page.tsx` avant de modifier. Le lien source doit s'intégrer visuellement sans casser le layout existant. Placer le lien dans une zone discrète sous le titre ou en bas de page — pas dans les métadonnées principales.

```tsx
{recipe.source_url && (
  <a
    href={recipe.source_url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
  >
    <ExternalLink size={14} />
    Voir la source originale
  </a>
)}
```

Import `ExternalLink` depuis `lucide-react` (déjà installé dans le projet).

### Gestion des erreurs dans `import-web.ts`

Créer une classe d'erreur custom ou utiliser des codes d'erreur :

```typescript
export class ImportError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_URL' | 'SITE_UNREACHABLE' | 'EXTRACTION_FAILED' | 'LLM_UNAVAILABLE'
  ) {
    super(message);
  }
}

// Messages en français selon le code
export const IMPORT_ERROR_MESSAGES: Record<ImportError['code'], string> = {
  INVALID_URL: "URL invalide. Vérifiez que l'adresse commence par http:// ou https://",
  SITE_UNREACHABLE: "Impossible d'accéder à ce site. Il est peut-être privé ou temporairement indisponible.",
  EXTRACTION_FAILED: "Impossible d'extraire la recette depuis cette page. Essayez de la saisir manuellement.",
  LLM_UNAVAILABLE: "Le service d'extraction par IA est temporairement indisponible. Une extraction partielle a été tentée.",
};
```

### Résilience OpenAI (NFR17)

Wrapper l'appel OpenAI dans un try/catch qui :
1. En cas d'erreur → log l'erreur côté serveur (console.error)
2. Retourne `null` (pas de throw)
3. Le pipeline utilise alors le résultat HTML partiel s'il existe

```typescript
async function extractWithLlm(html: string, url: string): Promise<ExtractedRecipe | null> {
  try {
    // ... appel OpenAI
  } catch (error) {
    console.error('[import-web] LLM fallback failed:', error);
    return null; // graceful degradation
  }
}
```

### UI état d'erreur dans `import/page.tsx`

Quand `pageState === 'error'` :

```tsx
<div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-[var(--radius-lg)]">
  <div className="flex items-start gap-3">
    <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
    <div className="flex-1">
      <p className="font-medium text-red-800">Import échoué</p>
      <p className="text-sm text-red-700 mt-1">{importError}</p>
    </div>
  </div>
  <div className="flex gap-3 mt-4">
    <button
      onClick={handleRetry}
      className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--accent-primary-hover)] text-sm font-medium transition-colors"
    >
      Réessayer
    </button>
    <button
      onClick={handleReset}
      className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-primary)] text-sm transition-colors"
    >
      Nouvelle URL
    </button>
  </div>
</div>
```

`handleRetry` : remettre l'URL dans le champ, repasser en `'idle'` avec l'URL pré-remplie
`handleReset` : vider l'URL, clearDraft(), repasser en `'idle'`

### Type `Recipe` — champ `source_url` visible

Vérifier que `src/lib/schemas/recipe.ts` a bien été mis à jour en Story 4.2 avec `source_url`. Cette story ne fait que lire le champ — pas besoin de le modifier à nouveau.

### `rel="noopener noreferrer"` obligatoire

Tout lien `target="_blank"` **doit** avoir `rel="noopener noreferrer"` pour la sécurité (prévient les attaques tabnabbing).

### Statut du job error dans la DB

Quand le pipeline échoue dans `import.ts` (catch du pipeline fire-and-forget) :

```typescript
await supabase
  .from('import_jobs')
  .update({
    status: 'error',
    error_message: error instanceof ImportError
      ? IMPORT_ERROR_MESSAGES[error.code]
      : "Une erreur inattendue s'est produite lors de l'import.",
    updated_at: new Date().toISOString(),
  })
  .eq('id', jobId);
```

Le client récupère ce message via `getImportStatus` → `errorMessage` → affiché dans l'UI.

### Lucide icons disponibles

`lucide-react` est déjà installé. Icons utiles pour cette story :
- `ExternalLink` — lien source
- `AlertCircle` — état d'erreur
- `RefreshCw` — bouton réessayer (optionnel)

### References

- [Source: epics.md#Story 4.4] — Acceptance criteria originaux
- [Source: architecture.md#Process Patterns] — Error Handling patterns
- [Source: architecture.md#External Integrations] — NFR17 résilience OpenAI
- [Source: prd.md] — FR15 (messages d'erreur explicites), FR17 (lien source)
- [Source: ux-design-specification.md] — "Confiance dans les imports : Feedback visuel clair, gestion gracieuse des erreurs"

## Dev Agent Record

### Agent Model Used

_à remplir_

### Debug Log References

### Completion Notes List

### File List

- `src/app/recipes/[id]/page.tsx` — modifié (ajout lien source_url)
- `src/lib/utils/import-web.ts` — modifié (ImportError class, messages distincts)
- `src/app/actions/import.ts` — modifié (propagation error_message)
- `src/app/import/page.tsx` — modifié (état error, boutons Réessayer/Nouvelle URL)
- `src/lib/utils/import-web.test.ts` — modifié (tests erreurs)
