---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-03-30'
inputDocuments: [prd.md, architecture.md, ux-design-specification.md]
---

# Commis - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Commis, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: L'utilisateur peut créer une recette manuellement (titre, ingrédients, étapes)
- FR2: L'utilisateur peut consulter une recette sous forme structurée et lisible
- FR3: L'utilisateur peut modifier une recette existante (tous les champs)
- FR4: L'utilisateur peut supprimer une recette
- FR5: L'utilisateur peut rédiger et modifier une note libre associée à une recette
- FR6: L'utilisateur peut consulter la note associée à une recette
- FR7: L'utilisateur peut importer une recette en collant une URL de site web
- FR8: Le système peut extraire automatiquement le titre, les ingrédients et les étapes depuis une URL de site web (JSON-LD, HTML parsing, ou LLM fallback pour les blogs narratifs)
- FR9: L'utilisateur peut importer une recette en collant un lien de Reel Instagram
- FR10: Le système peut transcrire l'audio d'un Reel Instagram et structurer la recette extraite
- FR11: Le système affiche un aperçu de la recette extraite avant sauvegarde
- FR12: L'utilisateur peut corriger et compléter une recette partiellement extraite avant sauvegarde
- FR13: Le système indique à l'utilisateur quand une extraction est partielle ou incomplète
- FR14: L'utilisateur peut annuler un import à chaque étape du processus
- FR15: Le système affiche un message d'erreur explicite en cas d'échec d'import
- FR16: Le système conserve le lien source d'origine pour chaque recette importée
- FR16b: Le système sauvegarde automatiquement un brouillon en cours d'édition d'import
- FR17: L'utilisateur peut accéder à la source d'origine d'une recette importée
- FR18: L'utilisateur peut créer et gérer ses propres catégories (bibliothèque de tags)
- FR18b: Le système suggère des tags/catégories par IA après import
- FR19: L'utilisateur peut attribuer une ou plusieurs catégories à une recette
- FR20: L'utilisateur peut attribuer des ingrédients principaux à une recette
- FR21: L'utilisateur peut attribuer des mots-clés à une recette
- FR22: L'utilisateur peut filtrer ses recettes par catégorie, ingrédient principal ou mot-clé
- FR23: L'utilisateur peut rechercher une recette par texte libre
- FR24: L'utilisateur peut trier ses recettes (par date d'ajout, nom, catégorie)
- FR25: L'utilisateur peut parcourir la liste complète de ses recettes en scroll infini
- FR26: Les catégories et tags sont toujours visibles et accessibles dans la navigation
- FR27: L'utilisateur peut organiser ses repas sur une vue semaine (grille jours × repas)
- FR28: L'utilisateur peut assigner une recette à un slot (jour + repas) depuis sa collection
- FR29: L'utilisateur peut retirer une recette d'un slot
- FR30: L'utilisateur peut consulter le planning de la semaine en cours
- FR31: L'utilisateur peut voir la liste des ingrédients d'une recette
- FR32: L'utilisateur peut sélectionner/désélectionner des ingrédients individuels
- FR33: L'utilisateur peut copier les ingrédients sélectionnés dans le presse-papier
- FR34: L'utilisateur peut utiliser l'application sur mobile (Safari iOS) et desktop (Chrome)
- FR35: L'interface est en français
- FR36: L'accès à l'application est protégé par authentification email/password

### NonFunctional Requirements

- NFR1: Les pages se chargent en < 1.5s (FCP)
- NFR2: L'application est interactive en < 3s (TTI)
- NFR3: L'import depuis URL web complète en < 10 secondes
- NFR4: L'import depuis Reel Instagram complète en < 30 secondes
- NFR5: La liste de recettes (500+) se charge en < 2 secondes
- NFR6: Le score Lighthouse Performance est > 80
- NFR7: Le meal planner se charge en < 1 seconde
- NFR8: Toutes les communications sont chiffrées (HTTPS)
- NFR9: Les mots de passe sont hashés côté serveur
- NFR10: Aucun accès non autorisé aux données d'un utilisateur
- NFR11: Pas de tracking, pas de cookies tiers, pas de revente de données
- NFR12: L'utilisateur peut exporter ses données au format JSON (RGPD)
- NFR13: L'utilisateur peut supprimer son compte et toutes ses données (RGPD)
- NFR14: En cas d'échec d'import URL web, message d'erreur immédiat + retry manuel
- NFR15: En cas d'échec d'import Reel, 3 retries automatiques × 30s, puis erreur
- NFR16: L'utilisateur voit le statut de l'import en temps réel
- NFR17: L'indisponibilité d'un service externe ne bloque pas le reste de l'app
- NFR18: Contraste suffisant pour la lisibilité
- NFR19: Navigation au clavier fonctionnelle
- NFR20: Labels sur tous les champs de formulaire
- NFR21: Boutons et zones tactiles min 44×44px

### Additional Requirements

**From Architecture:**
- Starter template : Next.js 16 déjà initialisé, migration vers src/ nécessaire
- Supabase CLI pour les migrations DB
- shadcn/ui CLI init pour les composants UI
- Design tokens CSS (Tailwind v4) : bg #F5EDE3, accent #C4704B, text #2C1810
- Fonts : Lora (serif) + Poppins (sans-serif) via next/font/google
- Vitest pour tests unitaires dès le Bloc 1
- RLS Supabase sur toutes les tables
- Server Actions + polling pattern pour imports longs
- ActionResult<T> discriminated union pour tous les retours
- Pagination cursor-based pour scroll infini

**From UX Design:**
- Mobile-first, breakpoint principal lg (1024px)
- Tab bar mobile (< 1024px), sidebar desktop (≥ 1024px)
- 9 custom components : ImportSourceSelector, RecipeCard (3 variants), RecipePreview (progressif), IngredientList, MealPlannerGrid, RecipePickerDialog, SlotPickerDialog, ConfidenceIndicator, EmptyState
- Skeleton loading progressif pour les imports
- Toast non-bloquant pour les confirmations
- Ingrédients tous cochés par défaut, décocher ce qu'on a
- Import : aperçu obligatoire, champ bloqué pendant import en cours (MVP)
- Planning bidirectionnel : RecipePickerDialog depuis planning, SlotPickerDialog depuis recette
- Retour contextuel (Planning → recette → retour au Planning)
- eslint-plugin-jsx-a11y pour accessibilité

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1-FR4 | Epic 1 | CRUD recettes (créer, lire, modifier, supprimer) |
| FR5-FR6 | Epic 1 | Feedback/notes par recette |
| FR7-FR8 | Epic 4 | Import URL web (JSON-LD → HTML → LLM) |
| FR9-FR10 | Epic 5 | Import Reel Instagram (Whisper + LLM) |
| FR11-FR16b | Epic 4 | Flow post-import (aperçu, correction, annulation, brouillon) |
| FR17 | Epic 4 | Source d'origine |
| FR18-FR26 | Epic 2 | Tags, recherche, filtres, scroll infini |
| FR27-FR30 | Epic 3 | Meal planner (grille semaine) |
| FR31-FR33 | Epic 3 | Ingrédients & copie presse-papier |
| FR34-FR36 | Epic 1 | Responsive, français, auth |
| NFR12-NFR13 | Epic 1 | RGPD (export JSON, suppression compte) |
| NFR18-NFR21 | Epic 1 | Accessibilité (contraste, clavier, labels, tactile 44px) |

## Epic List

### Epic 1 : Fondations & Première Recette

L'utilisateur peut se connecter, créer/consulter/modifier/supprimer des recettes, ajouter des notes, gérer son profil (export données, suppression compte).

**FRs couverts :** FR1, FR2, FR3, FR4, FR5, FR6, FR34, FR35, FR36
**NFRs couverts :** NFR12, NFR13 (RGPD), NFR18-NFR21 (accessibilité)
**Inclut :** Setup projet (src/, deps, shadcn, fonts, design tokens, Supabase, auth, RLS, Vitest, eslint-plugin-jsx-a11y)

### Epic 2 : Organisation & Découverte

L'utilisateur peut organiser ses recettes avec des tags/catégories, chercher par texte libre, filtrer et parcourir sa collection en scroll infini.

**FRs couverts :** FR18, FR18b, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26

### Epic 3 : Ma Semaine de Repas

L'utilisateur peut planifier ses repas sur une vue semaine, assigner des recettes à des créneaux, et copier les ingrédients sélectionnés pour ses courses.

**FRs couverts :** FR27, FR28, FR29, FR30, FR31, FR32, FR33

### Epic 4 : Import Web

L'utilisateur peut importer une recette en collant une URL de site web, vérifier l'aperçu, corriger les champs si extraction partielle, et sauvegarder.

**FRs couverts :** FR7, FR8, FR11, FR12, FR13, FR14, FR15, FR16, FR16b, FR17

### Epic 5 : Import Instagram

L'utilisateur peut importer une recette depuis un Reel Instagram via transcription audio, avec le même flow d'aperçu et correction.

**FRs couverts :** FR9, FR10 (réutilise le flow FR11-FR17 de l'Epic 4)

## Epic 1 : Fondations & Première Recette

L'utilisateur peut se connecter, créer/consulter/modifier/supprimer des recettes, ajouter des notes, gérer son profil (export données, suppression compte).

### Story 1.1 : Setup Projet & Design System

As a développeur,
I want un projet Next.js configuré avec toutes les dépendances et le design system,
So that je puisse commencer à implémenter les fonctionnalités.

**Acceptance Criteria:**

**Given** le projet Next.js existant **When** je migre vers `src/` et installe les deps **Then** shadcn/ui, Supabase, Vitest, Zod, react-hook-form, lucide-react, eslint-plugin-jsx-a11y sont installés
**Given** le root layout **When** je configure les fonts **Then** Lora (titres) et Poppins (corps) sont chargés via next/font
**Given** globals.css **When** je définis les design tokens **Then** les couleurs (bg #F5EDE3, accent #C4704B, text #2C1810), radius et espacements sont en variables CSS
**Given** le projet **When** je lance `pnpm test` **Then** Vitest s'exécute sans erreur
**Given** le projet **When** je lance `pnpm dev` **Then** l'app démarre sans erreur et affiche une page avec le bon thème (couleurs, fonts)

### Story 1.2 : Authentification

As a utilisateur,
I want me connecter avec email et mot de passe,
So that mes recettes soient privées et sécurisées.

**Acceptance Criteria:**

**Given** la page `/login` **When** je saisis email + password valides **Then** je suis redirigé vers `/` (collection)
**Given** un email/password invalide **When** je soumets le formulaire **Then** un message d'erreur en français s'affiche
**Given** je ne suis pas connecté **When** j'accède à une route protégée **Then** je suis redirigé vers `/login`
**Given** la DB Supabase **When** le schema est créé **Then** RLS est activé sur toutes les tables avec `user_id = auth.uid()`
**Given** le middleware Next.js **When** une requête arrive sans session **Then** elle est redirigée vers `/login`

### Story 1.3 : Créer et Consulter une Recette

As a utilisateur,
I want créer une recette manuellement et la consulter,
So that je puisse commencer à stocker mes recettes.

**Acceptance Criteria:**

**Given** la page collection **When** je clique sur "Nouvelle recette" **Then** un formulaire s'affiche (titre, ingrédients, étapes)
**Given** le formulaire rempli **When** je soumets **Then** la recette est sauvegardée en DB avec `source_type: 'manual'` **And** je suis redirigé vers la vue recette
**Given** un titre vide **When** je soumets **Then** une erreur de validation Zod s'affiche inline
**Given** la page `/recipes/[id]` **When** je l'ouvre **Then** la recette s'affiche structurée (titre, ingrédients listés, étapes numérotées)
**Given** la table `recipes` **When** elle est créée **Then** elle contient les champs du schéma architecture (ingredients/steps en JSONB `[{ text, order }]`)

### Story 1.4 : Modifier et Supprimer une Recette

As a utilisateur,
I want modifier ou supprimer une recette,
So that je puisse corriger des erreurs ou retirer des recettes.

**Acceptance Criteria:**

**Given** la vue recette **When** je clique sur "Modifier" **Then** le formulaire s'ouvre pré-rempli
**Given** le formulaire modifié **When** je soumets **Then** la recette est mise à jour en DB **And** `updated_at` est actualisé
**Given** la vue recette **When** je clique sur "Supprimer" **Then** une confirmation s'affiche
**Given** la confirmation **When** je confirme **Then** la recette est supprimée **And** je suis redirigé vers la collection
**Given** la confirmation **When** j'annule **Then** rien ne se passe

### Story 1.5 : Notes & Feedback par Recette

As a utilisateur,
I want ajouter une note libre à une recette,
So that je puisse noter mes ajustements après avoir cuisiné.

**Acceptance Criteria:**

**Given** la vue recette **When** je vois la section notes **Then** un champ texte libre est affiché
**Given** le champ notes **When** je saisis du texte et sauvegarde **Then** la note est persistée en DB (champ `notes` de la table `recipes`)
**Given** une note existante **When** je modifie et sauvegarde **Then** la note est mise à jour
**Given** la vue recette **When** une note existe **Then** elle est affichée sous les étapes

### Story 1.6 : Navigation & Layout Responsive

As a utilisateur,
I want naviguer entre les pages sur mobile et desktop,
So that l'application soit utilisable sur mon téléphone et mon ordinateur.

**Acceptance Criteria:**

**Given** un écran < 1024px **When** je vois l'app **Then** une tab bar s'affiche en bas (Collection, Import, Planning, Profil)
**Given** un écran ≥ 1024px **When** je vois l'app **Then** une sidebar s'affiche à gauche
**Given** le layout `(auth)/` **When** je navigue **Then** la navigation est toujours visible
**Given** l'interface **When** je la parcours **Then** tous les textes sont en français
**Given** les boutons et zones tactiles **When** je les mesure **Then** ils font au minimum 44×44px

### Story 1.7 : Profil & RGPD

As a utilisateur,
I want exporter mes données et supprimer mon compte,
So that mes droits RGPD soient respectés.

**Acceptance Criteria:**

**Given** la page `/profile` **When** je clique sur "Exporter mes données" **Then** un fichier JSON est téléchargé contenant toutes mes recettes, tags et plans
**Given** la page `/profile` **When** je clique sur "Supprimer mon compte" **Then** une confirmation s'affiche
**Given** la confirmation de suppression **When** je confirme **Then** toutes mes données sont supprimées (CASCADE) **And** je suis déconnecté **And** redirigé vers `/login`

## Epic 2 : Organisation & Découverte

L'utilisateur peut organiser ses recettes avec des tags/catégories, chercher par texte libre, filtrer et parcourir sa collection en scroll infini.

### Story 2.1 : Bibliothèque de Tags

As a utilisateur,
I want créer et gérer mes propres catégories/tags,
So that je puisse organiser mes recettes comme je le souhaite.

**Acceptance Criteria:**

**Given** la table `tags` et `recipe_tags` **When** elles sont créées **Then** elles suivent le schéma architecture (UNIQUE user_id+name, CASCADE)
**Given** n'importe quelle vue recette ou formulaire **When** j'ajoute un tag **Then** je peux choisir un tag existant ou en créer un nouveau
**Given** un tag existant **When** je le supprime **Then** il est retiré de toutes les recettes associées
**Given** une recette **When** j'attribue des tags **Then** la relation many-to-many est sauvegardée en DB

### Story 2.2 : Attribuer Tags, Ingrédients Principaux & Mots-clés

As a utilisateur,
I want attribuer des catégories, ingrédients principaux et mots-clés à mes recettes,
So that je puisse les retrouver facilement.

**Acceptance Criteria:**

**Given** le formulaire de recette (création ou édition) **When** je l'ouvre **Then** je vois des champs pour tags, ingrédients principaux et mots-clés
**Given** une recette **When** j'attribue plusieurs tags **Then** ils sont tous sauvegardés et affichés sur la RecipeCard
**Given** les tags d'une recette **When** je les consulte **Then** ils sont visibles dans la vue recette et sur la card

### Story 2.3 : Recherche & Tri

As a utilisateur,
I want chercher mes recettes par texte libre et les trier,
So that je retrouve rapidement ce que je cherche.

**Acceptance Criteria:**

**Given** la page collection **When** je tape dans le champ recherche **Then** les recettes sont filtrées en temps réel par titre, ingrédients ou mots-clés
**Given** la page collection **When** je sélectionne un tri (date, nom, catégorie) **Then** les recettes se réordonnent
**Given** la recherche **When** aucun résultat ne correspond **Then** un EmptyState s'affiche avec un message en français

### Story 2.4 : Filtrage par Catégorie & Scroll Infini

As a utilisateur,
I want filtrer mes recettes par tag et parcourir ma collection en scroll infini,
So that je puisse naviguer efficacement même avec beaucoup de recettes.

**Acceptance Criteria:**

**Given** la page collection **When** je clique sur un tag/catégorie **Then** seules les recettes avec ce tag sont affichées
**Given** les tags dans la navigation **When** je les consulte **Then** ils sont toujours visibles et accessibles
**Given** 500+ recettes **When** je scroll **Then** les recettes se chargent progressivement (pagination cursor-based `created_at` + `id`)
**Given** le chargement **When** les recettes arrivent **Then** des skeleton cards s'affichent pendant le fetch

## Epic 3 : Ma Semaine de Repas

L'utilisateur peut planifier ses repas sur une vue semaine, assigner des recettes à des créneaux, et copier les ingrédients sélectionnés pour ses courses.

### Story 3.1 : Vue Semaine du Meal Planner

As a utilisateur,
I want voir ma semaine de repas sous forme de grille,
So that j'aie une vue d'ensemble de mes repas planifiés.

**Acceptance Criteria:**

**Given** la table `meal_plans` **When** elle est créée **Then** elle suit le schéma architecture (week_start = lundi ISO, UNIQUE constraint)
**Given** la page `/planner` **When** je l'ouvre **Then** une grille 7 jours × 2 repas (déjeuner/dîner) s'affiche pour la semaine en cours
**Given** un slot vide **When** je le vois **Then** il est affiché comme "pas de repas prévu"
**Given** le planner **When** il charge **Then** il s'affiche en < 1 seconde (NFR7)

### Story 3.2 : Assigner & Retirer une Recette

As a utilisateur,
I want assigner une recette à un créneau et pouvoir la retirer,
So that je puisse planifier et ajuster ma semaine.

**Acceptance Criteria:**

**Given** un slot vide dans le planner **When** je clique dessus **Then** un RecipePickerDialog s'ouvre avec ma collection de recettes
**Given** le RecipePickerDialog **When** je sélectionne une recette **Then** elle est assignée au slot **And** le dialog se ferme
**Given** un slot occupé **When** je clique sur retirer **Then** la recette est désassignée **And** le slot redevient vide
**Given** la vue recette `/recipes/[id]` **When** je clique "Ajouter au planning" **Then** un SlotPickerDialog s'ouvre pour choisir le créneau (bidirectionnel)

### Story 3.3 : Copier les Ingrédients pour les Courses

As a utilisateur,
I want sélectionner des ingrédients et les copier dans le presse-papier,
So that je puisse les coller dans mon app de courses (Rappels iPhone).

**Acceptance Criteria:**

**Given** la vue recette **When** j'ouvre la liste d'ingrédients **Then** tous sont cochés par défaut
**Given** la liste d'ingrédients **When** je décoche un ingrédient **Then** il est exclu de la copie
**Given** les ingrédients sélectionnés **When** je clique "Copier" **Then** le texte formaté est copié dans le presse-papier (Clipboard API) **And** un toast confirme la copie
**Given** le format copié **When** je le colle dans Rappels **Then** chaque ingrédient est sur une ligne séparée

## Epic 4 : Import Web

L'utilisateur peut importer une recette en collant une URL de site web, vérifier l'aperçu, corriger les champs si extraction partielle, et sauvegarder.

### Story 4.1 : Interface d'Import & Sélection de Source

As a utilisateur,
I want une page d'import claire pour coller une URL,
So that je puisse importer des recettes facilement.

**Acceptance Criteria:**

**Given** la page `/import` **When** je l'ouvre **Then** je vois un ImportSourceSelector (carte URL web, carte Reel Instagram)
**Given** la carte URL web **When** je la sélectionne **Then** un champ URL s'affiche
**Given** le champ URL **When** je colle une URL valide et soumets **Then** l'import démarre **And** le champ est bloqué pendant l'import (MVP)
**Given** une URL invalide **When** je soumets **Then** un message d'erreur en français s'affiche

### Story 4.2 : Pipeline d'Extraction Web

As a utilisateur,
I want que les recettes soient extraites automatiquement depuis une URL,
So that je n'aie pas à tout saisir manuellement.

**Acceptance Criteria:**

**Given** la table `import_jobs` **When** elle est créée **Then** elle suit le schéma architecture (status, result JSONB, error_message)
**Given** une URL soumise **When** `startImport()` est appelé **Then** un import_job est créé avec status 'pending' **And** le pipeline est lancé en fire-and-forget (Promise non-awaitée) **And** le jobId est retourné immédiatement
**Given** le pipeline **When** il extrait une recette **Then** il essaie JSON-LD → HTML parsing → LLM fallback en cascade **And** met à jour le statut en DB à chaque étape
**Given** le client **When** il poll `getImportStatus(jobId)` toutes les 3s **Then** il reçoit le statut actuel **And** le skeleton loading se met à jour progressivement
**Given** une extraction réussie **When** status = 'done' **Then** `getImportResult(jobId)` retourne la recette structurée
**Given** l'import **When** il complète **Then** il prend < 10 secondes (NFR3)

### Story 4.3 : Aperçu, Correction & Sauvegarde

As a utilisateur,
I want vérifier et corriger la recette extraite avant de la sauvegarder,
So that je sois sûr que les données sont correctes.

**Acceptance Criteria:**

**Given** une recette extraite **When** l'aperçu s'affiche **Then** je vois tous les champs pré-remplis (titre, ingrédients, étapes, image URL)
**Given** une extraction partielle **When** l'aperçu s'affiche **Then** un ConfidenceIndicator indique "Extraction partielle" **And** les champs manquants sont surlignes
**Given** l'aperçu **When** je modifie un champ **Then** les modifications sont prises en compte
**Given** l'aperçu **When** je modifie un champ **Then** le brouillon est auto-sauvegardé en localStorage (FR16b, via `draft.ts`)
**Given** l'aperçu **When** la recette est extraite **Then** le système suggère des tags/catégories par IA (FR18b) **And** l'utilisateur peut les modifier avant sauvegarde
**Given** l'aperçu modifié **When** je confirme **Then** la recette est sauvegardée en DB avec `source_url` et `source_type: 'web'`
**Given** n'importe quelle étape **When** je clique "Annuler" **Then** l'import est annulé **And** je reviens à la page d'import vierge

### Story 4.4 : Source d'Origine & Gestion d'Erreurs

As a utilisateur,
I want accéder à la source d'origine et comprendre les erreurs d'import,
So that je puisse vérifier la recette originale ou corriger le problème.

**Acceptance Criteria:**

**Given** une recette importée **When** je la consulte **Then** un lien cliquable vers l'URL source est affiché
**Given** un échec d'import **When** le pipeline échoue **Then** un message d'erreur explicite en français s'affiche (URL invalide, site inaccessible, extraction impossible)
**Given** une erreur **When** elle s'affiche **Then** un bouton "Réessayer" est disponible
**Given** le service externe (OpenAI) **When** il est indisponible **Then** le reste de l'app continue de fonctionner (NFR17)

## Epic 5 : Import Instagram

L'utilisateur peut importer une recette depuis un Reel Instagram via transcription audio, avec le même flow d'aperçu et correction.

### Story 5.1 : Import Reel Instagram

As a utilisateur,
I want importer une recette depuis un Reel Instagram,
So that je puisse sauvegarder les recettes que je découvre sur Instagram.

**Acceptance Criteria:**

**Given** la page `/import` **When** je sélectionne "Reel Instagram" **Then** un champ URL Reel s'affiche
**Given** un lien Reel soumis **When** l'import démarre **Then** un import_job est créé avec `source_type: 'reel'`
**Given** le pipeline Reel **When** il s'exécute **Then** il télécharge → transcrit via Whisper → structure via LLM
**Given** le client **When** il poll le statut **Then** les étapes s'affichent progressivement (téléchargement → transcription → structuration)
**Given** l'import **When** il complète **Then** l'aperçu s'affiche avec les champs pré-remplis (réutilise le flow Story 4.3)

### Story 5.2 : Retries & Gestion d'Erreurs Reel

As a utilisateur,
I want que l'import Reel réessaie automatiquement en cas d'échec,
So that je n'aie pas à tout refaire manuellement si ça échoue.

**Acceptance Criteria:**

**Given** un import Reel **When** il échoue **Then** le système retente automatiquement (3 retries × 30s) **And** le statut affiche le numéro de tentative
**Given** 3 retries échoués **When** l'import est définitivement en échec **Then** un message d'erreur s'affiche **And** l'utilisateur peut réessayer manuellement ou saisir la recette manuellement
**Given** l'import **When** il complète **Then** il prend < 30 secondes hors retries (NFR4)
