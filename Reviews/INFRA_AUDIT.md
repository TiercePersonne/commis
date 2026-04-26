# Audit Infrastructure & Configuration — Commis

> Date : 2026-04-13

---

## Problèmes identifiés

### CRITIQUE

| # | Fichier | Catégorie | Description | Piste de correction |
|---|---------|-----------|-------------|---------------------|
| 1 | `Dockerfile` (entier) | DOCKER | Single-stage build — l'image finale contient sources, devDependencies, cache npm, outils de build (~1.5 GB). | Multi-stage : stage deps, stage builder, stage runner minimal avec `.next/standalone`, static, public et venv yt-dlp. |
| 2 | `Dockerfile` (aucun `USER`) | DOCKER | Le conteneur tourne en root. Compromission = privilèges root complets. | Ajouter `addgroup/adduser` + `USER app` avant `CMD`. |

### HAUTE

| # | Fichier | Catégorie | Description | Piste de correction |
|---|---------|-----------|-------------|---------------------|
| 3 | `next.config.ts` | NEXTCONFIG | Aucun header de sécurité (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP, Permissions-Policy). | Ajouter un bloc `headers()` avec les headers standards. |
| 4 | `next.config.ts:7-16` | NEXTCONFIG | `remotePatterns` accepte `hostname: "**"` + HTTP — risque SSRF via le proxy d'images et mixed content. | Supprimer le pattern HTTP, limiter les hostnames aux domaines utilisés. |
| 5 | `package.json` (deps) | DEPS | `@types/sharp@0.31.1` en `dependencies` — déprécié (sharp 0.34+ embarque ses propres types) et mal classé. | Supprimer `@types/sharp`. |
| 6 | `package.json` (deps) | DEPS | 4 packages inutilisés : `class-variance-authority`, `clsx`, `tailwind-merge`, `react-hook-form`. | Supprimer les 4 packages. |
| 7 | `eslint.config.mjs` | LINT | `eslint-plugin-jsx-a11y` installé mais jamais importé/configuré — règles a11y inactives. | Ajouter le plugin dans la config ESLint flat ou le retirer. |
| 8 | `render.yaml` | DEPLOY | Aucun `healthCheckPath` — un déploiement cassé est considéré comme réussi. | Ajouter `healthCheckPath: /api/health` + créer la route. |
| 9 | `Dockerfile:1` | DOCKER | `node:20-alpine` — Node.js 20 EOL le 30 avril 2026 (~2 semaines). | Migrer vers `node:22-alpine`. |

### MOYENNE

| # | Fichier | Catégorie | Description | Piste de correction |
|---|---------|-----------|-------------|---------------------|
| 10 | `next.config.ts` | NEXTCONFIG | `poweredByHeader` non désactivé — header `X-Powered-By: Next.js` expose la stack. | Ajouter `poweredByHeader: false`. |
| 11 | `vitest.config.ts` | TEST | Aucune config de coverage (ni provider, ni seuils, ni reporters). | Ajouter `coverage: { provider: 'v8', thresholds: { lines: 70 } }`. |
| 12 | `tsconfig.json:12` | TYPESCRIPT | `jsx: "react-jsx"` au lieu de `"preserve"` — Next.js gère la transformation JSX lui-même. | Changer en `"jsx": "preserve"`. |
| 13 | `.dockerignore` | DOCKER | Fichiers inutiles copiés : `supabase/`, `vitest.*`, `eslint.*`, `postcss.*`, `scratch_test.ts`. | Ajouter ces patterns au `.dockerignore`. |

### BASSE

| # | Fichier | Catégorie | Description | Piste de correction |
|---|---------|-----------|-------------|---------------------|
| 14 | `.gitignore` | GITIGNORE | `scratch_test.ts` à la racine est versionné. | L'ajouter au `.gitignore` et le supprimer du repo. |
| 15 | `vitest.config.ts:9` | TEST | Alias `"@": "/src"` — chemin absolu OS, peut casser en CI/Docker. | Utiliser `path.resolve(__dirname, './src')`. |
| 16 | `render.yaml:5` | DEPLOY | Plan Free — cold starts de 30-60s après 15 min d'inactivité. | Passer à `starter` ou mettre en place un cron keep-alive. |

---

## Top 3 améliorations les plus impactantes

1. **Multi-stage Dockerfile + user non-root** — Réduit l'image de ~1.5 GB à ~300 MB, élimine le risque root, accélère les déploiements.
2. **Headers de sécurité HTTP** — Protège contre clickjacking, MIME sniffing, active HSTS. Combiné avec la restriction des `remotePatterns` et `poweredByHeader: false`.
3. **Nettoyage deps + health check Render** — Supprime 5 packages inutiles, garantit que Render ne route jamais vers une instance cassée.
