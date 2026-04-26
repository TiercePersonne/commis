# ===========================
# Stage 1 : Dépendances
# ===========================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ===========================
# Stage 2 : Builder
# ===========================
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les dépendances (avec devDependencies pour le build)
COPY package*.json ./
RUN npm ci

COPY . .
# S'assurer que le dossier public existe (certains projets n'en ont pas)
RUN mkdir -p public
RUN npm run build

# ===========================
# Stage 3 : Runner (image finale minimale)
# ===========================
FROM node:22-alpine AS runner

WORKDIR /app

# C1+C2 — Installer uniquement les outils runtime nécessaires
RUN apk add --no-cache python3 py3-pip ffmpeg

# Créer un symlink python → python3
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Installer yt-dlp dans un virtualenv isolé
RUN python3 -m venv /opt/yt-dlp-env \
    && /opt/yt-dlp-env/bin/pip install --no-cache-dir yt-dlp

# Créer un wrapper script yt-dlp qui utilise le bon Python
RUN printf '#!/bin/sh\nexec /opt/yt-dlp-env/bin/python /opt/yt-dlp-env/bin/yt-dlp "$@"\n' \
    > /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

# C1 — Créer un utilisateur non-root (sécurité)
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copier uniquement les artefacts nécessaires depuis le builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# public/ est créé dans le builder même si vide, donc ce COPY ne plantera jamais
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# C1 — Basculer vers l'utilisateur non-root avant le démarrage
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
