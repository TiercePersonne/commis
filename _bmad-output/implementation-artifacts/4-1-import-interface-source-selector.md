# Story 4.1 : Interface d'Import & Sélection de Source

Status: done

## Story

As a utilisateur,
I want une page d'import claire pour coller une URL,
so that je puisse importer des recettes facilement.

## Acceptance Criteria

1. La page `/import` existe et est accessible depuis la navigation (nouvel item "Import" dans `app-layout.tsx`)
2. La page affiche un `ImportSourceSelector` avec deux cartes : "Site web" (active) et "Reel Instagram" (désactivée, badge "Bientôt")
3. Quand je clique sur la carte "Site web", un champ URL s'affiche (la carte s'agrandit)
4. Quand je colle une URL valide et soumets, le formulaire démarre l'import et bloque le champ pendant le traitement (état `loading`)
5. Quand je soumets une URL invalide (pas `http://` ou `https://`), un message d'erreur en français s'affiche sous le champ
6. La page respecte le thème Warm Modern (tokens CSS `--color-*`, `--radius-*`)

## Tasks / Subtasks

- [x] Task 1 : Créer la page `/import` (AC: 1, 6)
  - [ ] Créer `src/app/import/page.tsx` — Server Component qui render l'`ImportSourceSelector`
  - [ ] Ajouter "Import" dans `navItems` de `src/app/components/app-layout.tsx` (href `/import`)

- [x] Task 2 : Créer le composant `ImportSourceSelector` (AC: 2, 3, 4, 5)
  - [ ] Créer `src/app/components/import-source-selector.tsx` — Client Component (`'use client'`)
  - [ ] Deux cartes : "🌐 Site web" (cliquable) et "🎬 Reel Instagram" (désactivée, `opacity-50`, badge "Bientôt disponible")
  - [ ] État local `selectedSource: 'web' | 'reel' | null` — carte sélectionnée s'agrandit avec animation
  - [ ] Quand `selectedSource === 'web'` : afficher un `<form>` avec `<input type="url">` et bouton "Importer"
  - [ ] Validation URL côté client : `url.startsWith('http://') || url.startsWith('https://')` — sinon message d'erreur
  - [ ] État `isPending` (via `useTransition` ou `useState`) qui bloque le champ et bouton pendant l'import

- [x] Task 3 : Écrire les tests (AC: 4, 5)
  - [ ] Créer `src/app/components/import-source-selector.test.tsx`
  - [ ] Test : URL invalide → message d'erreur affiché
  - [ ] Test : URL valide → pas de message d'erreur

## Dev Notes

### Structure réelle du projet (priorité sur architecture.md)

> ⚠️ Le projet a divergé de l'architecture doc. Utiliser la structure **réelle** ci-dessous :

- Composants custom → `src/app/components/` (pas `src/components/`)
- Server Actions → `src/app/actions/` (pas `src/lib/actions/`)
- Pas de route group `(auth)` — les pages sont à la racine de `src/app/`
- Navigation → `src/app/components/app-layout.tsx` (composant `AppLayout`, pas `nav-sidebar.tsx`)

### Page `/import` et layout

La page doit wrapper son contenu dans `<AppLayout>` exactement comme `src/app/page.tsx` et `src/app/planner/page.tsx` :

```tsx
// src/app/import/page.tsx
import { AppLayout } from '@/app/components/app-layout';
import { ImportSourceSelector } from '@/app/components/import-source-selector';

export default function ImportPage() {
  return (
    <AppLayout>
      <div className="px-10 pb-10">
        <h1 className="text-[28px] font-serif font-bold text-[var(--color-text-primary)] pt-8 pb-2">
          Importer une recette
        </h1>
        <ImportSourceSelector />
      </div>
    </AppLayout>
  );
}
```

### Navigation — ajouter "Import"

Dans `src/app/components/app-layout.tsx`, `navItems` array (ligne ~16) :

```ts
const navItems = [
  { href: '/', label: 'Collection' },
  { href: '/import', label: 'Import' },
  { href: '/planner', label: 'Planning' },
  { href: '/profile', label: 'Profil' },
];
```

La logique `isActive` couvre déjà les routes exactes — `/import` sera actif quand `pathname.startsWith('/import')`.

### Design des cartes ImportSourceSelector

Inspiration UX spec : "Chaque carte s'agrandit au clic pour révéler le champ de saisie" (ux-design-specification.md, section Import Strategy).

Carte non-sélectionnée :
- `rounded-[var(--radius-lg)]`, `border border-[var(--color-border)]`, `bg-[var(--color-bg-card)]`
- `p-6`, icône grande + titre + description courte
- `cursor-pointer hover:border-[var(--color-accent)] transition-colors`

Carte sélectionnée (web) :
- `border-[var(--color-accent)] border-2`
- Révèle un formulaire en dessous avec `<input type="url">` + bouton

Carte désactivée (Reel) :
- `opacity-50 cursor-not-allowed`
- Badge "Bientôt disponible" en `text-[var(--color-text-muted)] text-xs`

### Validation URL (côté client uniquement — story 4.2 gère le serveur)

```ts
function isValidUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}
```

Message d'erreur : `"URL invalide. Veuillez coller une adresse web commençant par http:// ou https://"`

### État `isPending` dans cette story

Dans cette story, le bouton "Importer" appelle une fonction `onSubmit` qui sera connectée à `startImport()` (Story 4.2). Pour l'instant, le composant accepte une prop `onImport?: (url: string) => Promise<void>` ou gère l'état de chargement en interne. Le champ et le bouton sont `disabled` quand `isPending === true`.

### Thème et tokens CSS

Utiliser **exclusivement** les tokens CSS définis dans `src/app/globals.css` :
- `--color-bg-primary` (#f5ede3), `--color-bg-secondary` (#fdfaf6), `--color-bg-card` (#ffffff)
- `--color-text-primary` (#2c1810), `--color-text-secondary` (#6b5344), `--color-text-muted` (#9c8578)
- `--color-accent` (#c4704b), `--accent-primary-hover` (#a85a38)
- `--color-border` (#e8ddd2), `--color-border-light` (#f0e8de)
- `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (20px)

**Anti-pattern :** jamais `text-orange-600` ou `#c4704b` en dur — toujours `var(--color-accent)`.

### Type `Recipe` — champs à venir

Le type `Recipe` dans `src/lib/schemas/recipe.ts` n'a pas encore `source_url`, `source_type`, `image_url`, `confidence`. Ces champs seront ajoutés en Story 4.2/4.3. Ne pas toucher au schema dans cette story.

### Fichiers à NE PAS toucher

- `src/components/ui/` — composants shadcn (ne pas modifier)
- `src/lib/supabase/` — clients Supabase déjà en place
- `src/app/actions/recipes.ts`, `tags.ts`, `meal-plans.ts`, `profile.ts` — pas concernés

### References

- [Source: architecture.md#Frontend Architecture] — Route `/import`, pattern AppLayout
- [Source: architecture.md#Structure Patterns] — Structure réelle divergente notée ci-dessus
- [Source: epics.md#Story 4.1] — Acceptance criteria originaux
- [Source: ux-design-specification.md#Import Strategy] — Cartes visuelles, agrandissement au clic
- [Source: app-layout.tsx] — Pattern navigation existant

## Dev Agent Record

### Agent Model Used

_à remplir_

### Debug Log References

### Completion Notes List

### File List

- `src/app/import/page.tsx` — créé
- `src/app/components/import-source-selector.tsx` — créé
- `src/app/components/import-source-selector.test.tsx` — créé
- `src/app/components/app-layout.tsx` — modifié (ajout nav item Import)
