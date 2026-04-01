# Guide de Migration - Epic 3 : Ma Semaine de Repas

## Migration SQL à appliquer

La table `meal_plans` doit être créée dans votre base de données Supabase.

### Option 1 : Via l'interface Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans l'éditeur SQL
3. Copiez et exécutez le contenu du fichier `supabase/migrations/003_meal_plans.sql`

### Option 2 : Via Supabase CLI (si configuré)

```bash
supabase db push
```

### Contenu de la migration

Le fichier `supabase/migrations/003_meal_plans.sql` contient :
- Création de la table `meal_plans`
- Activation de RLS (Row Level Security)
- Création des policies de sécurité
- Index pour optimiser les performances

## Vérification

Après avoir appliqué la migration, vérifiez que :
1. La table `meal_plans` existe
2. Les policies RLS sont actives
3. L'index `idx_meal_plans_user_week` est créé

## Fonctionnalités implémentées

### Story 3.1 : Vue Semaine du Meal Planner ✅
- Table `meal_plans` avec schéma complet
- Grille 7 jours × 2 repas (déjeuner/dîner)
- Navigation semaine précédente/suivante
- Affichage des recettes planifiées
- Suppression de recettes du planning

### Story 3.2 : Assigner & Retirer une Recette ✅
- RecipePickerDialog : sélection de recette depuis le planner
- SlotPickerDialog : ajout au planning depuis la page recette
- Navigation bidirectionnelle complète
- Recherche de recettes dans le picker

### Story 3.3 : Copier les Ingrédients pour les Courses ✅
- Liste d'ingrédients avec checkboxes
- Tous cochés par défaut
- Copie dans le presse-papier (Clipboard API)
- Toast de confirmation
- Format compatible avec l'app Rappels iPhone

## Fichiers créés/modifiés

### Nouveaux fichiers
- `supabase/migrations/003_meal_plans.sql`
- `src/lib/schemas/meal-plan.ts`
- `src/app/actions/meal-plans.ts`
- `src/app/components/meal-planner-grid.tsx`
- `src/app/components/recipe-picker-dialog.tsx`
- `src/app/components/slot-picker-dialog.tsx`
- `src/app/components/ingredient-list.tsx`
- `src/app/components/nav-bar.tsx`
- `src/app/planner/page.tsx`
- `src/app/recipes/[id]/add-to-planner-button.tsx`

### Fichiers modifiés
- `src/app/page.tsx` (ajout NavBar)
- `src/app/recipes/[id]/page.tsx` (IngredientList + bouton planning)

## Prochaines étapes

1. Appliquer la migration SQL
2. Tester le planning :
   - Créer quelques recettes
   - Les ajouter au planning
   - Naviguer entre les semaines
   - Copier les ingrédients
3. Vérifier la navigation bidirectionnelle
4. Passer à l'Epic suivant
