#!/bin/bash
#
# Build manuel de secours. La voie normale est la CI : elle incrémente la
# version sur la PR, refuse d'écraser une version déjà publiée et tague le
# dépôt. Lancé ici à la main, rien ne vérifie que $VERSION est libre.
set -e

# Configuration demandée
readonly IMAGE_NAME="krisanselmo/step-cook"
readonly PLATFORMS="linux/amd64,linux/arm64"

# Récupération de la version depuis le package.json (optionnel, pour tagger proprement)
readonly VERSION=$(grep '"version"' package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
readonly TAG="${VERSION:-latest}"
# Tag immuable : même si un tag de version était réécrit, l'image resterait
# atteignable par le commit dont elle est issue.
readonly SHA="sha-$(git rev-parse --short=7 HEAD)"

echo "🚀 Préparation du build pour : $IMAGE_NAME"
echo "📦 Plateformes cibles : $PLATFORMS"
echo "🏷️  Tags : latest, $TAG, $SHA"

# Création d'un builder Buildx (si inexistant)
docker buildx create --use --name step-cook-builder 2>/dev/null || true
docker buildx inspect step-cook-builder --bootstrap

# Build et Push vers le registre Docker
# Si vous testez localement sans registre, retirez "--push" et utilisez "--load"
# (mais --load ne supporte qu'une seule architecture à la fois)
echo "⚙️  Démarrage de la compilation..."
docker buildx build \
  --platform "$PLATFORMS" \
  --tag "$IMAGE_NAME:latest" \
  --tag "$IMAGE_NAME:$TAG" \
  --tag "$IMAGE_NAME:$SHA" \
  --push \
  .

echo "✅ Build et push terminés avec succès !"
