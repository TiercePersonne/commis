# Stage 1 : build Next.js
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2 : image de production
FROM node:20-alpine AS runner

WORKDIR /app

# Installer Python3 + ffmpeg + yt-dlp via apk
RUN apk add --no-cache python3 ffmpeg yt-dlp

# Créer un symlink python → python3 (Alpine n'a que python3)
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Copier les fichiers Next.js buildés
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "server.js"]
