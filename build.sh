#!/bin/bash
#
# Fallback manual build. CI is the normal path and refuses to overwrite a
# published version; run by hand, nothing checks that $VERSION is free.
set -e

readonly IMAGE_NAME="krisanselmo/step-cook"
readonly PLATFORMS="linux/amd64,linux/arm64"

readonly VERSION=$(grep '"version"' package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
readonly TAG="${VERSION:-latest}"
# Immutable tag: the image stays reachable by its commit.
readonly SHA="sha-$(git rev-parse --short=7 HEAD)"

echo "🚀 Préparation du build pour : $IMAGE_NAME"
echo "📦 Plateformes cibles : $PLATFORMS"
echo "🏷️  Tags : latest, $TAG, $SHA"

docker buildx create --use --name step-cook-builder 2>/dev/null || true
docker buildx inspect step-cook-builder --bootstrap

# Without a registry, swap --push for --load (single architecture only).
echo "⚙️  Démarrage de la compilation..."
docker buildx build \
  --platform "$PLATFORMS" \
  --tag "$IMAGE_NAME:latest" \
  --tag "$IMAGE_NAME:$TAG" \
  --tag "$IMAGE_NAME:$SHA" \
  --push \
  .

echo "✅ Build et push terminés avec succès !"
