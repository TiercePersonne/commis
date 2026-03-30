---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain-skipped, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments: [product-brief-commis-2026-02-09.md]
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - commis

**Author:** Gauthier
**Date:** 2026-02-10

## Executive Summary

**Commis** est une application web francophone de gestion de recettes personnelles. Elle centralise des recettes provenant de sources multiples (sites web, Reels Instagram, saisie manuelle) dans un espace unique, organisé et cherchable.

**Problème :** Mathilde passe 2-3h chaque dimanche à planifier ses repas, naviguant entre onglets de navigateur, favoris Instagram, et livres de cuisine. Aucune app francophone ne centralise toutes ces sources gratuitement.

**Solution :** Une SPA mobile-first qui importe, structure et organise les recettes automatiquement, avec un meal planner hebdomadaire et un système de copie d'ingrédients pour les courses.

**Différenciation :** 100% gratuit sans limites (vs Flavorish à $4.99/mois), focus francophone, notes/feedback par recette, privacy-first.

**Utilisateurs :** Mathilde (utilisatrice principale, planificatrice de repas), Gauthier (accompagnant courses, utilisateur indirect via Rappels iPhone).

## Success Criteria

### User Success

- **Centralisation réussie** : L'utilisateur retrouve toutes ses recettes au même endroit, peu importe la source d'origine
- **Temps de planification** : Passer de 2-3h à moins de 30 min pour planifier les repas de la semaine
- **Réflexe de capture** : L'utilisateur copie un lien dans Commis plutôt que de liker/sauvegarder sur la plateforme source
- **Adoption** : Commis est utilisé 90-95% du temps lors de la planification des repas/courses
- **Confiance dans l'import** : L'utilisateur peut vérifier et corriger chaque recette importée avant sauvegarde
- **Moment "aha!"** : La première fois que l'utilisateur ouvre Commis et voit toutes ses recettes organisées et cherchables

### Business Success

- **À 3 mois** : L'app est utilisée chaque semaine par l'utilisateur principale, les imports fonctionnent de manière fiable
- **À 12 mois** : Support de plateformes additionnelles, premiers utilisateurs externes, peu de bugs remontés
- **Modèle** : Projet personnel d'abord, potentiellement public avec modèle gratuit/dons

### Technical Success

- **Fiabilité d'import** : ≥ 95% des imports réussis (recette correctement extraite et structurée)
- **Performance import URL web** : < 10 secondes
- **Performance import Reel Instagram** : < 30 secondes (transcription audio incluse)
- **Capacité** : Support de 500+ recettes par utilisateur sans dégradation de performance
- **Connectivité** : Application 100% connectée (pas de mode offline)
- **Responsive** : Fonctionne sur téléphone et ordinateur

### Measurable Outcomes

| Outcome | Cible | Délai |
|---------|-------|-------|
| Taux de succès d'import web | ≥ 95% | Dès le MVP |
| Taux de succès d'import Reel | ≥ 90% | Dès le MVP |
| Taux de correction manuelle | < 30% | À terme |
| Temps de planification hebdo | < 30 min | À 1 mois d'usage |
| Recettes importées | 50+ | Premier mois |
| Bugs critiques | < 2/mois | En continu |

## Product Scope

### MVP - Minimum Viable Product

**Entrée de recettes :**
1. **Import URL web** : Coller un lien → extraction automatique (titre, ingrédients, étapes) en < 10s
2. **Import Reel Instagram** : Coller un lien → transcription audio → structuration en < 30s
3. **Création manuelle** : Saisie via formulaire (même formulaire que l'édition)

**Flow post-entrée :**
4. **Aperçu avant sauvegarde** : Vérification et correction avant confirmation
5. **Édition manuelle** : Correction/complétion à tout moment
6. **Annulation** : Possible à chaque étape de l'import
7. **Source d'origine** : Lien vers l'URL/Reel conservé et accessible

**Organisation & consultation :**
8. **Bibliothèque de tags** : Catégories créées et gérées par l'utilisateur
9. **Organisation** : Par catégories, ingrédients principaux, mots-clés
10. **Recherche & tri** : Texte libre, tri par date/nom/catégorie, scroll infini
11. **Consultation** : Affichage structuré (titre, ingrédients, étapes)

**Planification & courses :**
12. **Meal planner** : Vue semaine (grille jours × repas), blocs modulables en auto-layout
13. **Copier ingrédients** : Sélection/désélection avant copie dans le presse-papier
14. **Feedback** : Note texte libre par recette

**Accès :**
15. **Authentification** : Email/password, un seul compte MVP

### Post-MVP & Vision

Voir la roadmap détaillée dans [Project Scoping & Phased Development](#project-scoping--phased-development).

## User Journeys

### Journey 1 : Mathilde — Le dimanche de planification (Happy Path)

**Opening Scene :**
Dimanche matin. Mathilde a repéré 2-3 recettes cette semaine — un Reel de pâtes au citron vu mercredi soir, un blog de curry thaï trouvé pendant sa pause déjeuner lundi. Elle ouvre Commis sur son téléphone.

**Rising Action :**
1. Elle colle le lien du blog de curry thaï → en 8 secondes, la recette apparaît structurée : titre, ingrédients, étapes. Elle vérifie l'aperçu, ajoute la catégorie "Asiatique", confirme.
2. Elle colle le lien du Reel Instagram → en 25 secondes, l'audio est transcrit et la recette structurée. Quelques quantités manquent — elle complète "200g de spaghetti" dans l'aperçu, confirme.
3. Elle ouvre un de ses livres de cuisine, trouve une recette de tajine. Elle crée manuellement la recette : titre, ingrédients, étapes. Catégorie "Maghrébin".
4. Elle ouvre le meal planner et place ses recettes dans la grille de la semaine : curry thaï lundi soir, pâtes au citron mercredi, tajine vendredi. Les blocs s'organisent automatiquement.

**Climax :**
Pour chaque recette du planning, elle ouvre la liste d'ingrédients, décoche "oignons" et "huile d'olive" qu'elle a déjà en stock, puis appuie sur "Copier". Elle colle dans Rappels iPhone. En 20 minutes, sa semaine est planifiée — avec une liste de courses optimisée.

**Resolution :**
Mercredi soir, après avoir cuisiné le curry thaï, elle ouvre la recette dans Commis et note dans le feedback : "Mettre moins de piment la prochaine fois, et ajouter des cacahuètes". La prochaine fois qu'elle fera ce curry, elle saura exactement quoi ajuster.

**Capabilities révélées :** Import URL, Import Reel, Création manuelle, Aperçu/édition, Organisation par catégories, Recherche/filtrage, Meal planner, Sélection/désélection d'ingrédients, Copier ingrédients, Feedback texte

---

### Journey 2 : Mathilde — L'import qui ne marche pas (Edge Case)

**Opening Scene :**
Mathilde trouve un Reel de recette de ramen. Elle colle le lien dans Commis.

**Rising Action :**
1. L'import démarre... mais le Reel a de la musique forte par-dessus, la transcription est partielle : le titre est bon, quelques ingrédients sont détectés, mais les étapes sont incomplètes.
2. Commis affiche l'aperçu avec un indicateur : "Extraction partielle — veuillez compléter les champs manquants".
3. Mathilde voit les ingrédients partiels et complète ce qui manque. Elle rédige les étapes en relançant le Reel une dernière fois.
4. Elle vérifie, confirme, sauvegarde.

**Climax :**
Malgré l'extraction imparfaite, Mathilde a quand même gagné du temps : le titre, la catégorie et une partie des ingrédients étaient déjà remplis. Elle n'a pas eu à tout saisir from scratch.

**Resolution :**
La recette est dans sa collection, complète et utilisable. La prochaine fois qu'elle cherchera "ramen", elle la retrouvera.

**Capabilities révélées :** Gestion d'erreur gracieuse, Résultat partiel éditable, Indicateur de qualité d'extraction, Formulaire d'édition complet

---

### Journey 3 : Mathilde — Découverte et import massif initial (Onboarding)

**Opening Scene :**
Gauthier vient de montrer Commis à Mathilde. Elle est enthousiaste et veut tout centraliser. Elle a 30+ favoris Instagram, 15 onglets ouverts, et 3 livres de cuisine avec des post-its.

**Rising Action :**
1. Elle commence par ses onglets ouverts : elle colle les URLs une par une. Les imports web sont rapides (< 10s chacun). En 10 minutes, 15 recettes sont importées.
2. Elle passe aux favoris Instagram : elle copie les liens des Reels un par un. Certains s'importent parfaitement, d'autres nécessitent des corrections. En 30 minutes, 20 recettes de plus.
3. Pour ses livres, elle saisit manuellement ses 5 recettes préférées. 15 minutes.
4. Elle organise : elle ajoute des catégories (Italien, Asiatique, Maghrébin, Français...) et des mots-clés.

**Climax :**
Elle ouvre la vue d'ensemble : 40 recettes, toutes au même endroit, cherchables, organisées. C'est la première fois qu'elle voit TOUT son répertoire culinaire en un coup d'œil.

**Resolution :**
"C'est exactement ce qu'il me fallait." Elle sait déjà qu'elle n'ouvrira plus 15 onglets le dimanche.

**Capabilities révélées :** Import en série, Performance sous charge, Organisation par lots, Vue d'ensemble de la collection

---

### Journey 4 : Gauthier — L'accompagnant courses

**Opening Scene :**
Dimanche soir, Mathilde a fini de planifier la semaine sur Commis. Gauthier doit faire les courses lundi en rentrant du travail.

**Rising Action :**
1. Mathilde ouvre le meal planner de la semaine dans Commis. Toutes les recettes sont déjà placées dans la grille.
2. Pour chaque recette, elle ouvre la liste d'ingrédients, décoche ce qu'elle a déjà en stock, puis appuie sur "Copier".
3. Elle colle chaque liste dans l'app Rappels iPhone, dans une liste partagée "Courses semaine".
4. Gauthier reçoit la notification sur son iPhone : la liste est prête.

**Climax :**
Au supermarché, Gauthier suit la liste sur Rappels. Il n'a pas besoin d'ouvrir Commis — tout est dans Rappels, et uniquement ce qu'il faut acheter.

**Resolution :**
Zéro friction pour Gauthier. Il n'a pas besoin de compte Commis ni de comprendre l'app. Le copier-coller vers Rappels suffit.

**Capabilities révélées :** Meal planner, Sélection/désélection d'ingrédients, Copier ingrédients (format compatible listes externes), Pas de dépendance à un compte secondaire

---

### Journey Requirements Summary

| Capability | Journeys |
|-----------|----------|
| Import URL web (< 10s) | 1, 3 |
| Import Reel Instagram (< 30s) | 1, 2, 3 |
| Création manuelle | 1, 3 |
| Aperçu avant sauvegarde | 1, 2, 3 |
| Édition manuelle / correction | 1, 2, 3 |
| Résultat partiel en cas d'échec | 2 |
| Organisation par catégories/mots-clés | 1, 3 |
| Recherche et filtrage | 1, 3 |
| Consultation recette structurée | 1, 4 |
| Meal planner (vue semaine) | 1, 4 |
| Sélection/désélection d'ingrédients avant copie | 1, 4 |
| Copier ingrédients (presse-papier) | 1, 4 |
| Feedback texte libre | 1 |
| Vue d'ensemble de la collection | 3 |
| Performance sous charge (import en série) | 3 |

## Innovation & Novel Patterns

### Paysage concurrentiel

**Concurrent direct identifié : Flavorish** (flavorish.ai)
- Import depuis réseaux sociaux (Instagram, TikTok, YouTube), sites web, images, texte
- Meal planning, listes de courses auto par rayon
- Modèle freemium : gratuit limité (5 imports sociaux), $4.99/mois illimité
- Canadien anglophone, multi-plateforme (iOS, Android, Web)

**Autres apps similaires :** Paprika, CookBook, Cooked.wiki, Recipe Keeper

### Positionnement différenciant de Commis

1. **100% gratuit sans limites** : Pas de paywall sur les imports sociaux ni sur aucune fonctionnalité. Modèle financé par de la publicité légère et non-intrusive
2. **Focus francophone** : Interface, extraction et organisation pensées pour le marché francophone — sites FR (Marmiton, 750g, Cuisine AZ, blogs FR), unités métriques, catégories adaptées aux cuisines francophones
3. **Feedback et notes par recette** : Système de notes personnelles pour ajuster et améliorer ses recettes au fil des réalisations — fonctionnalité absente ou peu visible chez les concurrents
4. **Privacy-first** : Pas de tracking, pas de revente de données, pas de cookies tiers. Self-hosted envisageable en post-MVP

### Validation Approach

**Test MVP minimal :** 5 recettes importées via des canaux différents (URL web FR, Reel Instagram, création manuelle), puis consultation des recettes et copie d'une liste de courses. Si Mathilde peut planifier sa semaine en < 30 min avec ces 5 recettes, le concept est validé.

### Risk Mitigation

Voir la section complète dans [Risk Mitigation Strategy](#risk-mitigation-strategy).

## Web App Specific Requirements

### Project-Type Overview

Commis est une **Single Page Application (SPA)** construite avec Next.js 16, React 19, TypeScript et Tailwind CSS v4. L'application est 100% privée (derrière authentification), sans besoin de SEO ni d'indexation Google. Pas de fonctionnalités temps réel.

### Browser Matrix

| Navigateur | Version | Priorité |
|-----------|---------|----------|
| Safari (iOS) | Dernières 2 versions | Haute — usage principal mobile |
| Chrome (Desktop) | Dernières 2 versions | Haute — usage principal desktop |
| Firefox | Dernières 2 versions | Moyenne |
| Edge | Dernières 2 versions | Basse |

### Responsive Design

- **Mobile-first** : L'usage principal sera sur iPhone (Safari), le design doit être pensé mobile d'abord
- **Breakpoints** : Mobile (< 768px), Desktop (≥ 768px)
- **Pas de tablette spécifique** : Le layout desktop s'adapte naturellement

### SEO

- Aucun SEO nécessaire : application privée derrière authentification
- `noindex` sur toutes les pages applicatives
- Pages publiques limitées : landing page, page de connexion

### Technical Stack (indicatif)

- **Next.js App Router** avec rendu client (SPA) pour les pages applicatives
- **Server Actions** pour les appels API (import, CRUD recettes)
- **Supabase** pour la base de données et l'authentification
- **Services externes** : API de transcription audio (Whisper/OpenAI) pour les Reels Instagram
- **Pas de PWA** pour le MVP (pas d'offline, pas de notifications push)

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach :** MVP Experience — L'app doit être complète et agréable à utiliser, pas un prototype bancal
**Ressources :** Développeur solo (Gauthier), premier projet, 1-2h/jour en moyenne. Pas de deadline fixe.
**Timeline estimé :** 4-5 mois (apprentissage inclus), sans pression

### Décision architecturale : Auth

- **MVP** : Authentification Supabase basique (email/password, un seul compte)
- **Schéma DB** : Pensé multi-user dès le départ (`user_id` sur chaque table) pour faciliter la migration future
- **Post-MVP** : Ouverture à l'inscription publique

### MVP Feature Set — Phasage interne

**Bloc 1 — Fondations (semaines 1-2) :**
- Setup technique (Supabase, auth email/password, structure projet)
- CRUD recettes basique (créer, lire, éditer, supprimer)

**Bloc 2 — Formulaire & organisation (semaines 3-4) :**
- Formulaire complet (création/édition manuelle)
- Gestion des catégories/tags par l'utilisateur (bibliothèque de tags)
- Organisation par catégories, ingrédients principaux, mots-clés
- Consultation recette structurée, tri, scroll infini

**Bloc 3 — Planification des repas (semaines 5-6) :**
- Vue semaine (grille jours × repas)
- Assigner/retirer une recette à un slot
- Blocs modulables en auto-layout

**Bloc 4 — Import web & ingrédients (semaines 7-10) :**
- Import depuis URL de site web (scraping JSON-LD + HTML parsing)
- Aperçu avant sauvegarde, annulation à chaque étape
- Conservation du lien source d'origine
- Messages d'erreur explicites en cas d'échec
- Sélection/désélection d'ingrédients + copier dans le presse-papier
- Feedback texte libre (note unique) par recette

**Bloc 5 — Import Instagram (semaines 11-14+) :**
- Import et transcription de Reels Instagram
- Gestion des résultats partiels

> ⚠️ Chaque bloc est testable indépendamment. Le produit n'est livré à Mathilde qu'une fois le Bloc 5 terminé.

### Post-MVP Features

**Phase 2 (Growth) :**
- Ouverture multi-utilisateurs (inscription publique)
- Système de notation (étoiles/favoris)
- Ajustement des quantités selon le nombre de convives
- Liste de courses automatisée
- Import posts Instagram

**Phase 3 (Expansion) :**
- OCR photos (livres, notes manuscrites)
- Import Pinterest
- Communauté et partage
- Suggestions basées sur les favoris
- Ouverture au public avec publicité légère

### Risk Mitigation Strategy

**Risque technique — Import Instagram :**
- Mitigation : Module séparé branché sur le socle CRUD existant
- Fallback : Import semi-manuel (coller la transcription) si l'API est instable

**Risque technique — Scraping web :**
- Mitigation : JSON-LD (standard Recipe schema) en priorité, HTML parsing en fallback
- Les sites FR majeurs (Marmiton, 750g) utilisent JSON-LD

**Risque ressources — Dev solo, premier projet :**
- Mitigation : Phasage en blocs de 2 semaines, chaque bloc testable indépendamment
- Pas de deadline fixe — apprentissage intégré dans le rythme
- Résultats concrets visibles toutes les 2 semaines pour maintenir la motivation

**Risque marché — Flavorish existe :**
- Mitigation : Gratuit sans limites + francophone + feedback/notes

## Functional Requirements

### Gestion des recettes

- FR1: L'utilisateur peut créer une recette manuellement (titre, ingrédients, étapes)
- FR2: L'utilisateur peut consulter une recette sous forme structurée et lisible
- FR3: L'utilisateur peut modifier une recette existante (tous les champs)
- FR4: L'utilisateur peut supprimer une recette
- FR5: L'utilisateur peut rédiger et modifier une note libre associée à une recette (champ texte unique)
- FR6: L'utilisateur peut consulter la note associée à une recette

### Import de recettes

- FR7: L'utilisateur peut importer une recette en collant une URL de site web
- FR8: Le système peut extraire automatiquement le titre, les ingrédients et les étapes depuis une URL de site web (JSON-LD, HTML parsing, ou LLM fallback pour les blogs narratifs)
- FR9: L'utilisateur peut importer une recette en collant un lien de Reel Instagram
- FR10: Le système peut transcrire l'audio d'un Reel Instagram et structurer la recette extraite
- FR11: Le système affiche un aperçu de la recette extraite avant sauvegarde
- FR12: L'utilisateur peut corriger et compléter une recette partiellement extraite avant sauvegarde
- FR13: Le système indique à l'utilisateur quand une extraction est partielle ou incomplète
- FR14: L'utilisateur peut annuler un import à chaque étape du processus
- FR15: Le système affiche un message d'erreur explicite en cas d'échec d'import (URL invalide, site inaccessible, Reel privé, etc.)
- FR16: Le système conserve le lien source d'origine pour chaque recette importée
- FR16b: Le système sauvegarde automatiquement un brouillon en cours d'édition d'import (reprise possible après fermeture accidentelle)

### Source & traçabilité

- FR17: L'utilisateur peut accéder à la source d'origine d'une recette importée (retour vers l'URL/Reel)

### Organisation & recherche

- FR18: L'utilisateur peut créer et gérer ses propres catégories (bibliothèque de tags)
- FR18b: Le système suggère des tags/catégories par IA après import (modifiables par l'utilisateur)
- FR19: L'utilisateur peut attribuer une ou plusieurs catégories à une recette
- FR20: L'utilisateur peut attribuer des ingrédients principaux à une recette
- FR21: L'utilisateur peut attribuer des mots-clés à une recette
- FR22: L'utilisateur peut filtrer ses recettes par catégorie, ingrédient principal ou mot-clé
- FR23: L'utilisateur peut rechercher une recette par texte libre
- FR24: L'utilisateur peut trier ses recettes (par date d'ajout, nom, catégorie)
- FR25: L'utilisateur peut parcourir la liste complète de ses recettes en scroll infini
- FR26: Les catégories et tags sont toujours visibles et accessibles dans la navigation

### Planification des repas

- FR27: L'utilisateur peut organiser ses repas sur une vue semaine (grille jours × repas)
- FR28: L'utilisateur peut assigner une recette à un slot (jour + repas) depuis sa collection
- FR29: L'utilisateur peut retirer une recette d'un slot
- FR30: L'utilisateur peut consulter le planning de la semaine en cours

### Ingrédients & courses

- FR31: L'utilisateur peut voir la liste des ingrédients d'une recette
- FR32: L'utilisateur peut sélectionner/désélectionner des ingrédients individuels
- FR33: L'utilisateur peut copier les ingrédients sélectionnés dans le presse-papier

### Interface & accès

- FR34: L'utilisateur peut utiliser l'application sur mobile (Safari iOS) et desktop (Chrome)
- FR35: L'interface est en français
- FR36: L'accès à l'application est protégé par authentification email/password (un seul compte MVP)

## Non-Functional Requirements

### Performance

- NFR1: Les pages de l'application se chargent en < 1.5s (First Contentful Paint)
- NFR2: L'application est interactive en < 3s (Time to Interactive)
- NFR3: L'import depuis URL web complète en < 10 secondes
- NFR4: L'import depuis Reel Instagram complète en < 30 secondes (hors retry)
- NFR5: La liste de recettes (500+) se charge en < 2 secondes
- NFR6: Le score Lighthouse Performance est > 80
- NFR7: Le meal planner (vue semaine) se charge en < 1 seconde

### Sécurité & RGPD

- NFR8: Toutes les communications sont chiffrées (HTTPS)
- NFR9: Les mots de passe sont hashés côté serveur
- NFR10: Aucun accès non autorisé aux données d'un utilisateur
- NFR11: Pas de tracking, pas de cookies tiers, pas de revente de données
- NFR12: L'utilisateur peut exporter l'intégralité de ses données au format JSON (portabilité RGPD)
- NFR13: L'utilisateur peut supprimer son compte et toutes ses données associées (droit à l'effacement RGPD)

### Intégration & résilience

- NFR14: En cas d'échec d'import URL web, message d'erreur immédiat avec possibilité de réessayer manuellement
- NFR15: En cas d'échec d'import Reel Instagram, 3 retries automatiques espacés de 30 secondes. Si toujours en échec, message d'erreur avec option de réessayer ou saisir manuellement
- NFR16: L'utilisateur voit le statut de l'import en temps réel sur la même page (en cours, retry, succès, échec)
- NFR17: L'indisponibilité d'un service externe ne bloque pas le reste de l'application

### Accessibilité

- NFR18: Contraste suffisant pour la lisibilité
- NFR19: Navigation au clavier fonctionnelle
- NFR20: Labels sur tous les champs de formulaire
- NFR21: Boutons et zones tactiles de taille suffisante pour mobile (min 44×44px)
