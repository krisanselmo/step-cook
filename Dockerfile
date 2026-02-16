# Étape 1 : Construction
FROM node:22-alpine AS builder
WORKDIR /app

# Installation des dépendances
COPY package.json package-lock.json ./
RUN npm ci

# Copie du code source et build
COPY . .
# Désactive la télémétrie pour le build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Étape 2 : Exécution (Image finale légère)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Important pour Docker : écouter sur toutes les interfaces
ENV HOSTNAME="0.0.0.0"

# Copie uniquement les fichiers nécessaires générés par l'étape de build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Lancement direct du serveur optimisé
CMD ["node", "server.js"]
