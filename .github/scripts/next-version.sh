#!/usr/bin/env bash
#
# Next version from commit prefixes, written as GitHub Actions step outputs.
#
#   feat           -> minor
#   `!` / BREAKING -> major
#   anything else  -> patch
#
# Skips the bump once package.json is past the last released version, so
# pushing more commits to a PR does not stack increments.
set -euo pipefail

current=$(node -p "require('./package.json').version")
last_tag=$(git tag -l 'v*' --sort=-v:refname | head -1)
released=${last_tag#v}

if [ -z "$last_tag" ]; then
  # No tag yet: start from package.json and read the whole history.
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
