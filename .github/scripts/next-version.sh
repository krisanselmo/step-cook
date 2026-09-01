#!/usr/bin/env bash
#
# Calcule la prochaine version depuis les préfixes de commit, et écrit le
# résultat au format `clé=valeur` (sorties d'une étape GitHub Actions).
#
#   feat            -> mineure
#   `!` ou BREAKING -> majeure
#   le reste        -> patch
#
# La référence est le dernier tag `v*`. Le bump est ignoré si package.json a
# déjà dépassé la dernière version publiée : l'étape est ainsi rejouable sans
# empiler les incréments à chaque nouveau commit poussé sur la PR.
set -euo pipefail

current=$(node -p "require('./package.json').version")
last_tag=$(git tag -l 'v*' --sort=-v:refname | head -1)
released=${last_tag#v}

if [ -z "$last_tag" ]; then
  # Aucun tag : on part de package.json et on lit tout l'historique.
  released=$current
  range=HEAD
else
  range="$last_tag..HEAD"
fi

if [ "$current" != "$released" ]; then
  printf 'bump_needed=false\nversion=%s\nprevious=%s\nlevel=none\n' "$current" "$released"
  exit 0
fi

log=$(git log --format='%s%n%b' "$range")

if grep -qE '^[a-z]+(\([^)]*\))?!:|^BREAKING CHANGE' <<<"$log"; then
  level=major
elif grep -qE '^feat(\([^)]*\))?:' <<<"$log"; then
  level=minor
else
  level=patch
fi

IFS=. read -r major minor patch <<<"$released"

case "$level" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac

printf 'bump_needed=true\nversion=%s.%s.%s\nprevious=%s\nlevel=%s\n' \
  "$major" "$minor" "$patch" "$released" "$level"
