---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
date: 2026-02-09
author: Gauthier
---

# Product Brief: commis

## Executive Summary

Commis est une application de gestion de recettes personnelle qui centralise toutes les recettes d'un utilisateur — peu importe leur source (Instagram Reels, Pinterest, sites web, photos de livres ou notes manuscrites) — dans un espace unique, consultable et organisé. L'app transforme des heures de recherche et de planification en une expérience fluide : trouver quoi manger, varier les repas, et préparer ses courses sans effort.

---

## Core Vision

### Problem Statement

Les passionnés de cuisine accumulent des recettes partout : favoris Instagram, onglets de navigateur, livres physiques, notes manuscrites. Quand vient le moment de planifier les repas de la semaine, ils passent 2 à 3 heures à fouiller dans ces sources dispersées pour trouver quoi cuisiner, varier les plats et compiler une liste de courses.

### Problem Impact

- **Temps perdu** : 2-3h par semaine à chercher et organiser des recettes éparpillées
- **Frustration** : Impossible de retrouver facilement une recette déjà vue
- **Manque de variété** : Difficile de varier les repas quand on ne visualise pas l'ensemble de son répertoire
- **Perte d'information** : Les retours d'expérience sur une recette (ajustements, notes) ne sont jamais conservés

### Why Existing Solutions Fall Short

Les apps de recettes existantes (Marmiton, Jow, etc.) proposent leur propre base de recettes. Aucune ne résout le vrai problème : agréger les recettes que l'utilisateur a **déjà trouvées et aimées** depuis des sources variées et hétérogènes. L'utilisateur ne veut pas découvrir de nouvelles recettes dans une base générique — il veut **retrouver et organiser les siennes**.

### Proposed Solution

Commis permet de :
- **Capturer** des recettes depuis Instagram (Reels/posts), Pinterest, sites web, et photos (livres, notes manuscrites) — le "capture flow" est le cœur de l'expérience
- **Extraire automatiquement** le contenu des recettes (analyse audio des Reels, OCR des photos, scraping des sites)
- **Organiser** par catégories (origine du plat, ingrédients principaux, mots-clés)
- **Consulter** chaque recette sous forme écrite et structurée — plus besoin de relancer un Reel en boucle
- **Annoter** avec des notes et feedbacks personnels pour la prochaine réalisation
- **Noter les recettes** avec un système de notation pour identifier ses plats favoris et orienter ses choix futurs
- **Ajuster les quantités** grâce à un système d'aide qui recalcule les ingrédients selon le nombre de personnes
- **Copier** la liste des ingrédients facilement

### Key Differentiators

- **Agrégation multi-sources** : Seule app qui unifie Instagram Reels (avec analyse audio), Pinterest, sites web et photos manuscrites
- **Capture flow instantané** : Le geste "je vois → je capture → c'est structuré" est le moment clé
- **Centré sur l'utilisateur** : Ce sont SES recettes, pas une base générique
- **Notes et notation** : Feedback, ajustements et système de notation conservés d'une réalisation à l'autre
- **Aide aux quantités** : Recalcul intelligent des ingrédients selon le nombre de convives

### MVP Strategy (insight Party Mode)

- **Phase 1** : Import depuis URLs de sites web (scraping) — source la plus simple techniquement
- **Phase 2** : Import Instagram Reels/posts (analyse audio via transcription)
- **Phase 3** : Import photos (OCR livres et notes manuscrites)
- **Phase 4** : Pinterest et sources additionnelles

## Target Users

### Primary Users

#### Persona 1 : Clara, la passionnée organisée

- **Profil** : 25-35 ans, cuisine pour 4 personnes, passionnée de cuisine du monde
- **Contexte** : Accumule des recettes depuis Instagram, Pinterest, sites web et livres de cuisine. Planifie ses repas le dimanche (journée + soirée), parfois le lundi midi au bureau
- **Appareils** : Téléphone (scroll Instagram, capture rapide) + ordinateur (planification, organisation)
- **Comportement actuel** : Favoris Instagram noyés dans la masse, dizaines d'onglets ouverts, livres de cuisine empilés. Passe 2-3h/semaine à fouiller pour varier les repas
- **Frustration principale** : Retrouver une recette déjà vue parmi des sources éclatées, et varier les plats en optimisant les ingrédients
- **Motivation** : Cuisiner des plats qui sortent de l'ordinaire, d'origines variées — pas les classiques du quotidien
- **Moment "aha!"** : Ouvrir Commis et voir TOUTES ses recettes au même endroit, cherchables, organisées — après un import massif initial
- **Succès** : "Je sais quoi cuisiner cette semaine en 10 minutes au lieu de 2 heures"

#### Persona 2 : Le batch cooker du week-end

- **Profil** : 25-40 ans, prépare plusieurs repas en une session le week-end
- **Contexte** : Suit des créateurs de contenu cuisine, consulte des blogs spécialisés
- **Besoin spécifique** : Voir rapidement les ingrédients communs entre recettes pour optimiser les courses
- **Frustration** : Relancer un Reel 15 fois pour noter les quantités

### Secondary Users

#### L'accompagnant courses

- **Profil** : Conjoint ou colocataire qui fait les courses
- **Interaction** : Reçoit la liste d'ingrédients copiée depuis Commis dans une app de liste partagée (ex : Rappels iPhone)
- **Pas d'accès direct à Commis nécessaire** pour le MVP — un simple copier-coller suffit

#### Communauté (futur)

- **Profil** : Amis, famille, autres passionnés
- **Interaction envisagée** : Partage de recettes vers des non-utilisateurs, aspect communautaire — à explorer dans une version ultérieure

### User Journey

1. **Découverte** : Bouche-à-oreille, recommandation d'un proche
2. **Onboarding** : Import massif — l'utilisateur veut tout centraliser d'un coup (favoris Instagram, URLs sauvegardées, photos de livres)
3. **Usage quotidien** : Le dimanche, ouvrir Commis, filtrer par origine/ingrédients, choisir les recettes de la semaine, copier les ingrédients dans une app de liste partagée
4. **Capture au fil du temps** : Quand une nouvelle recette apparaît (Reel, site web, livre), l'ajouter à Commis en un geste
5. **Moment de valeur** : La première fois que la planification de la semaine prend 15 min au lieu de 2h
6. **Long terme** : Commis devient le carnet de recettes unique — notes, ajustements de quantités, favoris notés 5 étoiles

## Success Metrics

### Métriques utilisateur

- **Taux d'adoption** : L'utilisateur utilise Commis 90-95% du temps quand elle planifie ses repas/courses
- **Temps gagné** : Réduction significative du temps de planification (de 2-3h à <30min/semaine)
- **Réflexe de capture** : Au lieu de liker/sauvegarder sur Instagram, l'utilisateur copie le lien directement dans Commis
- **Rétention hebdomadaire** : L'utilisateur ouvre l'app chaque semaine pour planifier ses repas

### Business Objectives

- **Fiabilité** : 95% des imports de recettes fonctionnent correctement (extraction, structuration)
- **Modèle économique** : Projet personnel dans un premier temps, potentiellement public avec modèle gratuit/dons
- **À 3 mois** : L'app est utilisée au quotidien par l'utilisateur principale, les imports fonctionnent de manière fiable
- **À 12 mois** : Support de plateformes additionnelles, premiers utilisateurs externes, peu de bugs remontés

### Key Performance Indicators

| KPI | Cible | Mesure |
|-----|-------|--------|
| Taux de succès d'import | ≥ 95% | Recettes importées correctement / total des imports |
| Utilisation hebdomadaire | ≥ 90% des semaines | Semaines avec au moins 1 session de planification |
| Temps de planification | < 30 min | Temps entre ouverture de l'app et liste de courses copiée |
| Recettes ajoutées/mois | Croissant | Nombre de nouvelles recettes importées par mois |
| Bugs critiques | < 2/mois | Bugs bloquants remontés par les utilisateurs |

## MVP Scope

### Core Features

1. **Import depuis URL de site web** : Coller un lien, extraction automatique de la recette (titre, ingrédients, étapes)
2. **Import et transcription de Reels Instagram** : Coller un lien de Reel, extraction audio → transcription → structuration de la recette
3. **Organisation par catégories** : Classer les recettes par origine du plat, ingrédients principaux, mots-clés
4. **Consultation de la recette** : Affichage structuré et lisible de chaque recette (titre, ingrédients, étapes)
5. **Copier/coller les ingrédients** : Bouton pour copier la liste des ingrédients dans le presse-papier
6. **Feedback par recette** : Ajouter des notes/commentaires personnels sur chaque recette

### Out of Scope for MVP

- **OCR photos** (livres de cuisine, notes manuscrites) → Phase ultérieure
- **Pinterest** → Phase ultérieure
- **Système de notation** (étoiles/favoris) → v2
- **Ajustement des quantités** (recalcul par nombre de personnes) → v2
- **Liste de courses automatisée** → v2
- **Communauté / partage** → Futur
- **Authentification multi-utilisateurs** → Futur

### MVP Success Criteria

- L'utilisateur peut importer une recette depuis un site web ET un Reel Instagram
- La recette est affichée de manière structurée et lisible
- Elle peut retrouver une recette par catégorie ou mot-clé
- Elle peut copier les ingrédients en un clic
- Elle peut laisser un feedback sur une recette réalisée
- Le tout fonctionne sur téléphone ET ordinateur

### Future Vision

- **v2** : Notation des recettes, ajustement des quantités, liste de courses automatisée
- **v3** : OCR photos (livres, notes manuscrites), import Pinterest
- **Long terme** : Communauté, partage de recettes, suggestions basées sur les favoris, ouverture au public avec modèle gratuit/dons
