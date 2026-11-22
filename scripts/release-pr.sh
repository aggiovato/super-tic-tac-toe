#!/usr/bin/env bash
# Opens a release PR: bumps package.json (no tag), turns the CHANGELOG's Unreleased section into
# the version (scripts/changelog-release.mjs, npm's `version` script), commits
# "chore(release): vX.Y.Z" on release/vX.Y.Z, pushes it and opens the PR against main. Merging it
# is the release: CD deploys pre, smoke-tests it, promotes to production and creates the tag.
# Shared by `task release:*` (after its guard) and the Release workflow. Usage: release-pr.sh <patch|minor|major>
set -euo pipefail

bump="${1:-}"
case "$bump" in
  patch | minor | major) ;;
  *) echo "Usage: $0 <patch|minor|major>" >&2; exit 1 ;;
esac

npm version "$bump" --no-git-tag-version
version="v$(node -p "require('./package.json').version")"
if git ls-remote --exit-code --heads origin "release/$version" > /dev/null; then
  echo "release/$version already exists on origin: merge or close its PR first." >&2
  exit 1
fi
git switch -c "release/$version"
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): $version"
git push -u origin "release/$version"
gh pr create --base main --head "release/$version" --title "chore(release): $version" \
  --body "Release $version: the version and its CHANGELOG section. Merging sends main to pre; when the smoke test passes there, CD deploys production and tags $version."
