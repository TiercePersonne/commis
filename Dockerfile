FROM node:20-alpine

WORKDIR /app

# Installer Python3 + pip + ffmpeg
RUN apk add --no-cache python3 py3-pip ffmpeg

# Créer un symlink python → python3
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Installer yt-dlp dans un virtualenv
RUN python3 -m venv /opt/yt-dlp-env \
    && /opt/yt-dlp-env/bin/pip install --no-cache-dir yt-dlp

# Créer un wrapper script yt-dlp qui utilise le bon Python
RUN printf '#!/bin/sh\nexec /opt/yt-dlp-env/bin/python /opt/yt-dlp-env/bin/yt-dlp "$@"\n' \
    > /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

# Vérifier que yt-dlp fonctionne
RUN yt-dlp --version

# Installer les dépendances Node.js
COPY package*.json ./
RUN npm ci

# Builder Next.js
COPY . .
RUN npm run build

# Copier les fichiers statiques dans le bon emplacement pour standalone
RUN cp -r .next/static .next/standalone/.next/static \
    && (cp -r public .next/standalone/public 2>/dev/null || true)

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
