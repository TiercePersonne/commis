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

# Installer Python3 + pip + ffmpeg (requis par yt-dlp pour la conversion audio)
RUN apk add --no-cache python3 py3-pip ffmpeg

# Installer yt-dlp
RUN pip3 install --no-cache-dir yt-dlp --break-system-packages

# Copier les fichiers Next.js buildés
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "server.js"]
