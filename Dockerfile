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

# Installer Python3 + ffmpeg
RUN apk add --no-cache python3 ffmpeg curl

# Créer un symlink python → python3 (Alpine n'a que python3)
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Installer yt-dlp comme binaire standalone
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Copier les fichiers Next.js buildés
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "server.js"]
