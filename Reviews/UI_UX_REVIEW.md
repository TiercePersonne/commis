# Review UI/UX — Commis

---

## 1. Faux checkboxes inaccessibles

- **Fichier** : `src/app/components/ingredient-list.tsx` ~L63-75, `src/app/components/planner-shopping-list.tsx` ~L85-97
- **Catégorie** : A11Y
- **Sévérité** : CRITIQUE
- **Description** : Les "checkboxes" sont des `<div>` avec `onClick`, sans `<input type="checkbox">`, sans `role="checkbox"`, sans `tabIndex`, sans `onKeyDown`. Les lecteurs d'écran et la navigation clavier ne peuvent pas interagir avec ces éléments. De plus, le `<label>` englobant ne contient aucun input associé — cliquer sur le texte de l'ingrédient ne déclenche pas le toggle (le `onClick` est uniquement sur le `<div>` interne).
- **Piste** : Remplacer le `<div>` par un vrai `<input type="checkbox" className="sr-only">` dans le `<label>`, ou ajouter `role="checkbox"`, `tabIndex={0}`, `aria-checked`, et un handler `onKeyDown` (Space/Enter).

---

## 2. Onglet "En masse" jamais actif visuellement

- **Fichier** : `src/app/components/import-source-selector.tsx` ~L159
- **Catégorie** : UX
- **Sévérité** : CRITIQUE
- **Description** : L'onglet "En masse" passe toujours `false` à `tabButtonClass` : `className={tabButtonClass(false)}`. L'onglet n'affiche jamais son état actif quand sélectionné — l'utilisateur n'a aucun feedback visuel.
- **Piste** : Remplacer par `tabButtonClass(activeTab === 'bulk')`.

---

## 3. Dialogs sans accessibilité

- **Fichier** : `src/app/components/recipe-picker-dialog.tsx` ~L80-81, `src/app/components/slot-picker-dialog.tsx` ~L112-113
- **Catégorie** : A11Y
- **Sévérité** : HAUTE
- **Description** : Les deux modales n'ont ni `role="dialog"`, ni `aria-modal="true"`, ni `aria-labelledby`. Aucun focus trap : l'utilisateur peut tabber en dehors du dialog vers les éléments cachés derrière l'overlay. Le focus n'est pas déplacé dans le dialog à l'ouverture.
- **Piste** : Ajouter `role="dialog"` et `aria-modal="true"` sur le conteneur interne, `aria-labelledby` pointant vers le `<h2>`, et un focus trap (ex: boucle focus sur Tab/Shift+Tab, ou `<dialog>` HTML natif).

---

## 4. Hamburger sans aria-expanded

- **Fichier** : `src/app/components/app-layout.tsx` ~L97-101
- **Catégorie** : A11Y
- **Sévérité** : HAUTE
- **Description** : Le bouton hamburger mobile n'a pas `aria-expanded={isMenuOpen}`. Le menu déroulant mobile n'a pas `role="navigation"` ni `aria-label` pour le distinguer du nav desktop. Pas de focus trap dans le drawer.
- **Piste** : Ajouter `aria-expanded={isMenuOpen}` sur le `<button>`, `aria-label="Navigation mobile"` et `role="navigation"` sur le `<nav>` mobile.

---

## 5. alert() natif pour les erreurs (5 composants)

- **Fichier** : `src/app/components/meal-planner-grid.tsx` ~L37, `src/app/components/recipe-picker-dialog.tsx` ~L64, `src/app/components/recipe-notes.tsx` ~L26, `src/app/components/planner-shopping-list.tsx` ~L57, `src/app/components/ingredient-list.tsx` ~L37
- **Catégorie** : UX
- **Sévérité** : HAUTE
- **Description** : `alert()` natif utilisé pour afficher les erreurs dans 5 composants. Casse complètement la cohérence visuelle de l'app (style OS, bloquant, pas de style warm modern).
- **Piste** : Créer un composant toast/notification ou afficher l'erreur inline dans un `<div>` stylé comme les banners d'erreur existants (cf. pattern `bg-red-50 border-red-200` déjà utilisé ailleurs).

---

## 6. px-10 non responsive sur 3 pages

- **Fichier** : `src/app/profile/page.tsx` ~L49 (`px-10`), `src/app/recipes/new/page.tsx` ~L16 (`px-10`), `src/app/recipes/[id]/edit/page.tsx` ~L82,93 (`px-10`)
- **Catégorie** : RESPONSIVE
- **Sévérité** : HAUTE
- **Description** : `px-10` (40px) de padding horizontal sans breakpoint responsive. Sur mobile (<400px), ça laisse très peu d'espace pour le contenu. Les autres pages (import, planner) utilisent correctement `px-4 md:px-10`.
- **Piste** : Remplacer `px-10` par `px-4 md:px-10` sur ces pages.

---

## 7. Recette entière dans l'URL (edit page)

- **Fichier** : `src/app/recipes/[id]/page.tsx` ~L23, `src/app/recipes/[id]/edit/page.tsx` ~L29-32
- **Catégorie** : PERF
- **Sévérité** : HAUTE
- **Description** : La recette entière est sérialisée en JSON puis encodée dans l'URL du lien "Modifier" (`encodeURIComponent(JSON.stringify(recipe))`). Pour des recettes longues (50+ ingrédients, étapes détaillées), cela peut dépasser la limite URL (~2000-8000 chars selon navigateur). De plus l'edit page (client component) déclare `searchParams` comme `Promise` et fait `await searchParams` dans un useEffect — pattern non standard pour un client component.
- **Piste** : Charger la recette côté edit page via un server action `getRecipe(id)` au lieu de la passer dans l'URL. Supprimer le `searchParams` prop.

---

## 8. InfiniteScroll : stale closure et observer instable

- **Fichier** : `src/app/components/infinite-scroll.tsx` ~L30-53
- **Catégorie** : RENDER
- **Sévérité** : HAUTE
- **Description** : `loadMore` dépend de `recipes` et `recipeTagsMap` dans son `useCallback`. Chaque chargement de page recrée `loadMore` -> recrée l'`IntersectionObserver` dans le `useEffect`. Risque de stale closure : `recipes` dans le callback référence le tableau au moment de la création, pas le plus récent.
- **Piste** : Utiliser des updaters fonctionnels (`setRecipes(prev => [...prev, ...newRecipes])`) et sortir `recipes`/`recipeTagsMap` des deps du callback, ou utiliser un `useRef` pour le state courant.

---

## 9. Onglets import sans ARIA tabs

- **Fichier** : `src/app/components/import-source-selector.tsx` ~L130-158
- **Catégorie** : A11Y
- **Sévérité** : MOYENNE
- **Description** : Les onglets (web/reel/image/text/bulk) n'utilisent pas le pattern ARIA tabs : pas de `role="tablist"` sur le conteneur, pas de `role="tab"` / `aria-selected` sur les boutons, pas de `role="tabpanel"` sur le contenu. La navigation clavier entre onglets (flèches) n'est pas implémentée.
- **Piste** : Ajouter les rôles ARIA correspondants et gérer la navigation clavier gauche/droite.

---

## 10. ConfidenceIndicator inutilement client

- **Fichier** : `src/app/components/confidence-indicator.tsx` ~L1
- **Catégorie** : CLIENT_SERVER
- **Sévérité** : MOYENNE
- **Description** : Marqué `'use client'` mais n'a aucune interactivité : pas de state, pas d'event handler, pas de hook. Composant purement présentationnel qui pourrait être un Server Component.
- **Piste** : Supprimer la directive `'use client'`.

---

## 11. TagSelector sans état de chargement

- **Fichier** : `src/app/components/tag-selector.tsx` ~L20-24
- **Catégorie** : UX
- **Sévérité** : MOYENNE
- **Description** : Aucun état de chargement pendant le fetch des tags via `getUserTags()`. L'utilisateur voit une zone vide pendant le chargement réseau, sans feedback.
- **Piste** : Ajouter un `isLoading` state + skeleton ou spinner pendant le fetch.

---

## 12. Labels non associés aux inputs (recipe-preview)

- **Fichier** : `src/app/components/recipe-preview.tsx` ~L107-118, L123-133, L154-168, L194-211
- **Catégorie** : A11Y
- **Sévérité** : MOYENNE
- **Description** : Les `<label>` ne sont pas associées à leurs `<input>` — pas de `htmlFor` / `id` pairing. Les labels sont visuels mais pas programmatiquement liés.
- **Piste** : Ajouter des `id` uniques aux inputs et `htmlFor` correspondant sur les labels.

---

## 13. navItems recréé à chaque render

- **Fichier** : `src/app/components/app-layout.tsx` ~L18-59
- **Catégorie** : RENDER
- **Sévérité** : MOYENNE
- **Description** : `navItems` (tableau avec inline SVG JSX) est recréé à chaque render du layout. Comme `AppLayout` est le shell de toute l'app, cela se produit à chaque navigation.
- **Piste** : Extraire `navItems` en constante module-level (en dehors du composant).

---

## 14. Déduplication tags non memoizée

- **Fichier** : `src/app/components/recipe-filters.tsx` ~L46-52
- **Catégorie** : PERF
- **Sévérité** : MOYENNE
- **Description** : La déduplication des tags utilise `JSON.stringify` / `JSON.parse` à chaque render (pas memoizé). Pour des collections larges, c'est coûteux.
- **Piste** : Envelopper dans `useMemo` avec `recipeTagsMap` comme dépendance.

---

## 15. Images de recettes sans loading="lazy"

- **Fichier** : `src/app/components/recipe-filters.tsx` ~L29-37
- **Catégorie** : PERF
- **Sévérité** : MOYENNE
- **Description** : `RecipeCardImage` utilise `<img>` natif sans `loading="lazy"`. Dans une grille de potentiellement 50+ recettes, toutes les images sont chargées immédiatement (eager par défaut dans certains navigateurs).
- **Piste** : Ajouter `loading="lazy"` sur le `<img>`.

---

## 16. handleCardClick : code mort

- **Fichier** : `src/app/components/import-source-selector.tsx` ~L66-67
- **Catégorie** : PROPS
- **Sévérité** : BASSE
- **Description** : La fonction `handleCardClick` est définie mais jamais appelée. Code mort depuis le refactoring vers `handleTabClick`.
- **Piste** : Supprimer `handleCardClick`.

---

## 17. selectedSource initialisé à null vs activeTab fallback

- **Fichier** : `src/app/components/import-source-selector.tsx` ~L27-31
- **Catégorie** : STATE
- **Sévérité** : BASSE
- **Description** : `selectedSource` initialisé à `null`, mais `activeTab` fait un fallback `?? 'web'`. L'état interne et l'état visuel sont désynchronisés au premier render. Si `selectedSource` est utilisé ailleurs, sa valeur `null` ne correspond pas à l'onglet affiché.
- **Piste** : Initialiser `selectedSource` à `'web'` directement.

---

## 18. useCallback inutile sur stableOnClose

- **Fichier** : `src/app/components/recipe-picker-dialog.tsx` ~L29
- **Catégorie** : RENDER
- **Sévérité** : BASSE
- **Description** : `stableOnClose` encapsule `onClose` dans `useCallback` mais dépend de `[onClose]` — ça ne stabilise rien. Le useCallback est inutile.
- **Piste** : Utiliser `onClose` directement dans l'effet, ou stabiliser via un ref si la prop change fréquemment.

---

## 19. compressImage définie dans le composant

- **Fichier** : `src/app/components/import-source-selector.tsx` ~L31-63
- **Catégorie** : RENDER
- **Sévérité** : BASSE
- **Description** : `compressImage` est une fonction pure utilitaire définie à l'intérieur du composant — recréée à chaque render.
- **Piste** : Extraire en dehors du composant ou dans un fichier utilitaire.

---

## 20. aria-label manquant sur boutons mobile (planner grid)

- **Fichier** : `src/app/components/meal-planner-grid.tsx` ~L103-109
- **Catégorie** : A11Y
- **Sévérité** : BASSE
- **Description** : Le bouton "Retirer" en mobile n'a pas d'`aria-label` (contrairement à la version desktop L212 qui en a un). Le bouton "+" (slot vide mobile, L114-125) n'a pas d'`aria-label` non plus.
- **Piste** : Ajouter `aria-label` descriptif comme sur la version desktop.

---

# Résumé — Top 3 des patterns à corriger en priorité

1. **Faux éléments interactifs sans accessibilité** (issues #1, #3, #4, #9, #12, #20)
   Les `<div>` et `<span>` servant de checkboxes, les dialogs sans `role`/focus-trap, et les tabs sans ARIA reviennent dans presque tous les composants interactifs. C'est le pattern le plus impactant : l'app est inutilisable au clavier et avec lecteur d'écran. Corriger avec de vrais `<input>`, `role="dialog"`, et le pattern ARIA tabs.

2. **`alert()` natif pour les erreurs** (issue #5)
   5 composants utilisent `alert()` au lieu d'un feedback inline stylé. C'est incohérent avec le soin apporté au reste de l'UI. Un composant toast réutilisable résoudrait tous les cas d'un coup.

3. **Padding `px-10` non responsive** (issue #6) + **recette dans l'URL** (issue #7)
   Trois pages ont un padding excessif sur mobile, et le passage de la recette entière via l'URL est fragile (limite de taille) et non standard. Ces deux points impactent directement l'expérience mobile au quotidien.
