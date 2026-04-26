# Review qualité de code — Commis

**Date** : 2025-04-13
**Scope** : Pipeline d'import, Server Actions, Schemas, Utilitaires
**Fichiers analysés** : 14 fichiers (`src/lib/utils/*`, `src/lib/schemas/*`, `src/app/actions/*`)

---

## Résumé exécutif

| Sévérité     | Nombre |
|--------------|--------|
| **CRITIQUE** | 2      |
| **HAUTE**    | 7      |
| **MOYENNE**  | 5      |
| **BASSE**    | 3      |
| **Total**    | **17** |

### Patterns récurrents

- **Duplication massive** : initialisation Gemini + parsing JSON réponse (×5), auth check (×15+)
- **Dead code** : fonctions d'extraction HTML/JSON-LD, `getImageSrc`, check `ERROR:` post-catch
- **Incohérence du error handling** : chaque action gère les `ImportError` différemment
- **Validations manquantes** : file upload (type, taille), `source_type` hardcodé, content-type mismatch
- **`deleteAccount` incomplet** : tables oubliées, pas de transaction, user auth non supprimé

### 3 actions prioritaires

1. **Corriger `saveImportedRecipe`** — `source_type` hardcodé à `'web'` et content-type incorrect si sharp échoue.
2. **Nettoyer le dead code** — `extractFromJsonLd`, `extractFromHtml`, `getImageSrc`, check `ERROR:` mort dans import-reel.
3. **Factoriser le code Gemini** — 5 copies du même pattern init + parse JSON.

---

## Problèmes détectés

### 1 · `exportUserData` fuite potentielle de données (CRITIQUE)

- **Fichier** : `src/app/actions/profile.ts` ~L49
- **Catégorie** : ROBUSTESSE
- **Description** : `exportUserData` requête `recipe_tags` **sans filtre `user_id`**. La table `recipe_tags` n'a probablement pas de colonne `user_id` directe, donc même avec RLS, ce `select` peut retourner les associations tag↔recette d'autres utilisateurs.
- **Piste** : Joindre via `recipes` pour filtrer : `.select('recipe_id, tag_id').in('recipe_id', userRecipeIds)`.

---

### 2 · `saveImportedRecipe` — source_type hardcodé (CRITIQUE)

- **Fichier** : `src/app/actions/recipes.ts` ~L286
- **Catégorie** : BUG
- **Description** : `source_type` est hardcodé à `'web'` quel que soit l'import réel. Une recette importée depuis un Reel (`source_type: 'reel'`) ou une image sera marquée `'web'` en DB.
- **Piste** : Passer `source_type` en paramètre ou le déduire de `recipe.source_url`.

---

### 3 · `uploadImageFromUrl` — content-type incorrect si sharp échoue (HAUTE)

- **Fichier** : `src/app/actions/recipes.ts` ~L257–264
- **Catégorie** : BUG
- **Description** : Si `sharp` échoue, `processedBuffer = rawBuffer` (JPEG/PNG original) mais l'upload utilise toujours `contentType: 'image/webp'` et filename `.webp`. Le fichier stocké a un MIME-type incorrect → images potentiellement cassées à l'affichage.
- **Piste** : Tracker le contentType effectif et l'extension en fonction du succès/échec de sharp.

---

### 4 · `extractFromJsonLd` et `extractFromHtml` — dead code (HAUTE)

- **Fichier** : `src/lib/utils/import-web.ts`
- **Catégorie** : DEAD_CODE
- **Description** : Ces deux fonctions exportées ne sont appelées nulle part dans le pipeline `extractRecipeFromUrl` (qui passe par Jina → LLM → GeminiURL). Aucun fichier action ne les importe non plus. Restes d'un ancien pipeline pré-LLM.
- **Piste** : Supprimer ou marquer comme deprecated si conservées pour fallback futur.

---

### 5 · `extractWithGeminiUrl` — le modèle ne peut pas naviguer (HAUTE)

- **Fichier** : `src/lib/utils/import-web.ts` ~L212
- **Catégorie** : BUG
- **Description** : Le prompt demande au modèle « Va sur cette URL et extrait la recette ». Gemini **ne peut pas naviguer sur le web** — il ne reçoit que le texte du prompt. Le résultat dépend entièrement de la mémoire d'entraînement du modèle, ce qui est non fiable et potentiellement faux (hallucinations de recettes).
- **Piste** : Si Jina échoue, utiliser Google Search grounding ou abandonner proprement plutôt que simuler un browse.

---

### 6 · Check `ERROR:` mort après `.catch()` dans import-reel (HAUTE)

- **Fichier** : `src/lib/utils/import-reel.ts` ~L56–62
- **Catégorie** : DEAD_CODE
- **Description** : Le `.catch(() => ({ stdout: '', stderr: '' }))` sur le `execFileAsync` de description avale toutes les erreurs. Le check `if (descStderr?.includes('ERROR:'))` juste après est **du code mort** : si yt-dlp échoue (exit non-zero), le catch remplace stderr par `''`, et la condition n'est jamais vraie.
- **Piste** : Retirer le `.catch()` et gérer l'erreur explicitement, ou retirer le check `ERROR:` inutile.

---

### 7 · `getImageSrc` — fonction identité inutile (HAUTE)

- **Fichier** : `src/lib/utils/image.ts` ~L1–3
- **Catégorie** : DEAD_CODE
- **Description** : `getImageSrc` retourne son argument tel quel (`return imageUrl`). Ne fait strictement rien. `getImageProxySrc` existe pour le proxy. `getImageSrc` est du dead code ou un reste de refactoring incomplet.
- **Piste** : Supprimer `getImageSrc` et remplacer ses usages par l'URL directe.

---

### 8 · `deleteAccount` incomplet (HAUTE)

- **Fichier** : `src/app/actions/profile.ts` ~L82–115
- **Catégorie** : ROBUSTESSE
- **Description** :
  - Ne supprime pas `user_settings` (cookies Instagram chiffrés restent en DB)
  - Ne supprime pas `import_jobs`
  - Ne supprime pas le user dans Supabase Auth (seulement `signOut` — le compte auth survit)
  - Suppressions séquentielles sans transaction — une erreur intermédiaire laisse un état incohérent
- **Piste** : Ajouter les tables manquantes, utiliser une RPC/transaction côté DB, et appeler `supabase.auth.admin.deleteUser()`.

---

### 9 · Incohérence du error handling entre actions d'import (HAUTE)

- **Fichier** : `src/app/actions/import.ts` ~L50, ~L130, ~L155
- **Catégorie** : ERROR_HANDLING
- **Description** :
  - `startImport` : `IMPORT_ERROR_MESSAGES[error.code]` → message user-friendly ✓
  - `startImportFromReel` : `error.message` → message technique brut ✗
  - `startImportFromImage` : `error instanceof Error` sans check `ImportError` → peut exposer des messages internes ✗
- **Piste** : Uniformiser — toujours utiliser `IMPORT_ERROR_MESSAGES[error.code]` pour les `ImportError`.

---

### 10 · `startImportFromImage` — pas de validation fichier (MOYENNE)

- **Fichier** : `src/app/actions/import.ts` ~L155
- **Catégorie** : ROBUSTESSE
- **Description** :
  - `formData.get('image') as File | null` : cast non sûr, pourrait être un `string`
  - Pas de validation du MIME type côté serveur (un PDF serait envoyé à Gemini)
  - Pas de limite de taille : un fichier de 100 Mo serait lu entièrement en mémoire puis converti en base64
- **Piste** : Valider `instanceof File`, vérifier `file.type.startsWith('image/')`, et limiter `file.size` (max 10 Mo).

---

### 11 · Fractions tronquées dans `ingredients.ts` (MOYENNE)

- **Fichier** : `src/lib/utils/ingredients.ts` ~L7–9
- **Catégorie** : BUG
- **Description** : `'1/3': 0.33` et `'2/3': 0.66` — valeurs tronquées. Lors d'agrégation, 3 × ⅓ = 0.99 au lieu de 1. Perte de précision cumulative sur les plans de repas.
- **Piste** : Utiliser des valeurs plus précises (`0.333`, `0.667`) ou un calcul dynamique `eval(fraction)`.

---

### 12 · Singularisation naïve casse certains mots français (MOYENNE)

- **Fichier** : `src/lib/utils/ingredients.ts` ~L56, ~L79
- **Catégorie** : BUG
- **Description** : `.slice(0, -1)` sur les mots finissant par 's'. Produit des résultats incorrects : « ananas » → « anana », « noix » → « noi », « maïs » → « maï ». `normalizeUnit` a le même problème.
- **Piste** : Ajouter une liste d'exceptions (mots invariables en français) ou ne pas singulariser les noms d'ingrédients.

---

### 13 · Initialisation Gemini dupliquée ×5 (MOYENNE)

- **Fichier** : `src/lib/utils/import-web.ts`, `import-reel.ts`, `import-image.ts`
- **Catégorie** : DUPLICATION
- **Description** : Le pattern suivant est copié-collé 5 fois :
  ```ts
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  // → generateContent → regex JSON → JSON.parse → map ingredients/steps
  ```
- **Piste** : Extraire un helper `getGeminiModel()` et un `parseGeminiRecipeResponse(content)`.

---

### 14 · `updateRecipe` peut écraser `image_url` silencieusement (MOYENNE)

- **Fichier** : `src/app/actions/recipes.ts` ~L162
- **Catégorie** : ROBUSTESSE
- **Description** : `image_url: rawImageUrl` — si le formulaire d'édition n'envoie pas le champ `image_url`, la valeur sera `null`, ce qui **écrase** l'URL existante en DB. Toute modification de recette risque de perdre l'image.
- **Piste** : Ne mettre à jour `image_url` que si le champ est explicitement présent dans le formData.

---

### 15 · Non-null assertion sur `GEMINI_API_KEY` (BASSE)

- **Fichier** : `src/lib/utils/import-web.ts` ~L170
- **Catégorie** : TYPES
- **Description** : `process.env.GEMINI_API_KEY!` — assertion non-null dans `extractWithLlm` alors que la vérification de la clé n'est faite qu'en amont dans certains chemins. Si appelé directement, crash runtime.
- **Piste** : Ajouter une guard `if (!process.env.GEMINI_API_KEY) return null;` en début de fonction.

---

### 16 · `deleteAccount` — sous-requête silencieusement échouée (BASSE)

- **Fichier** : `src/app/actions/profile.ts` ~L93–99
- **Catégorie** : ROBUSTESSE
- **Description** : La suppression de `recipe_tags` utilise `.data?.map(...) || []`. Si la sous-requête échoue, `.data` est null, le fallback `[]` ne supprime rien, et le code continue à supprimer les recettes sans erreur.
- **Piste** : Vérifier le résultat de la sous-requête avant de procéder.

---

### 17 · Bloc auth dupliqué dans toutes les actions (BASSE)

- **Fichier** : `src/app/actions/import.ts`, `recipes.ts`, `tags.ts`, `meal-plans.ts`, `profile.ts`
- **Catégorie** : DUPLICATION
- **Description** : Le bloc suivant est copié-collé dans chaque fonction (~15 occurrences) :
  ```ts
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };
  ```
- **Piste** : Extraire un helper `requireAuth()` retournant `{ supabase, user }` ou throw.
