#!/usr/bin/env bash
# Dépôt unique : prépare dans iphone/upstream/ (ignoré par git) le code de CE dépôt (app/, relay/, journal/…)
# au commit suivi par iphone/upstream.json, puis y applique les adaptations de l'iPhone : patches/*.patch (dans
# l'ordre des noms), overlay/ (fichiers ajoutés) et ios/ (projet natif, copié dans upstream/app/ios).
# Remplace le script du dépôt HealthTrack-iOS, qui clonait HealthTrack : ici rien n'est téléchargé, le code est là.
#
#   scripts/upstream.sh            prépare upstream/ au commit de upstream.json
#   scripts/upstream.sh --latest   met d'abord upstream.json sur le dernier commit de main dont « Play — AAB » a réussi
#                                  (= la dernière version envoyée sur Google Play), puis prépare upstream/
#
# upstream.json « commit » :
#   - un SHA : le code à ce commit (mécanisme du dépôt iOS, gardé tel quel à la bascule) ;
#   - "HEAD" : les fichiers suivis tels qu'ils sont dans le dossier de travail (étape suivante, quand une même
#     PR change le code partagé et ses correctifs ; voir iphone/README.md). versionCode n'est alors pas comparé.
#
# upstream/ est un petit dépôt git jetable (un commit : le code d'origine), pour que `git apply --index`, `git diff`
# et `git apply --3way` y marchent comme avant ; ses objets manquants sont lus dans le dépôt principal.
# Échoue bruyamment si un correctif ne s'applique plus : le fichier a changé, le correctif est à refaire.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(git -C "$ROOT" rev-parse --show-toplevel)"
DEST="${UPSTREAM_DIR:-$ROOT/upstream}"
SLUG="$(node -p "require('$ROOT/upstream.json').repo")"

if [ "$(git -C "$REPO" rev-parse --is-shallow-repository)" = "true" ]; then
  echo "::error::clone sans historique : le numéro de version est le nombre de commits (git fetch --unshallow --filter=blob:none, ou fetch-depth: 0)" >&2
  exit 1
fi

if [ "${1:-}" = "--latest" ]; then
  git -C "$REPO" fetch --quiet origin main
  API="repos/$SLUG/actions/workflows/play-bundle.yml/runs?branch=main&status=success&per_page=1"
  if command -v gh >/dev/null 2>&1 && gh api "$API" >/dev/null 2>&1; then
    SHA="$(gh api "$API" --jq '.workflow_runs[0].head_sha')"
  else
    SHA="$(curl -fsSL "https://api.github.com/$API" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).workflow_runs[0].head_sha))")"
  fi
  git -C "$REPO" cat-file -e "$SHA^{commit}"
  COUNT="$(git -C "$REPO" rev-list --count "$SHA")"
  DATE="$(git -C "$REPO" log -1 --format=%cI "$SHA")"
  node -e "
    const fs = require('fs'), p = '$ROOT/upstream.json', u = JSON.parse(fs.readFileSync(p, 'utf8'));
    Object.assign(u, { commit: '$SHA', versionCode: $COUNT, date: '$DATE' });
    fs.writeFileSync(p, JSON.stringify(u, null, 2) + '\n');
  "
  echo "upstream.json → $SHA (Android v$COUNT, $DATE)"
fi

SHA="$(node -p "require('$ROOT/upstream.json').commit")"
EXPECTED="$(node -p "require('$ROOT/upstream.json').versionCode")"

# Dossier remis à neuf, sauf app/node_modules (long à réinstaller)
if [ -d "$DEST" ]; then
  find "$DEST" -mindepth 1 -maxdepth 1 ! -name app -exec rm -rf {} +
  [ -d "$DEST/app" ] && find "$DEST/app" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
fi
mkdir -p "$DEST"

# Tout le dépôt à ce commit, comme le clone d'avant (des tests de app/ lisent relay/ et journal/), sauf iphone/
if [ "$SHA" = "HEAD" ]; then
  COUNT="$(git -C "$REPO" rev-list --count HEAD)"
  (cd "$REPO" && git ls-files -z -- . ':(exclude)iphone' | tar --null --ignore-failed-read -T - -cf -) | tar -xf - -C "$DEST"
else
  git -C "$REPO" cat-file -e "$SHA^{commit}" 2>/dev/null || git -C "$REPO" fetch --quiet origin "$SHA"
  COUNT="$(git -C "$REPO" rev-list --count "$SHA")"
  if [ "$COUNT" != "$EXPECTED" ]; then
    echo "::error::upstream.json annonce v$EXPECTED mais le commit $SHA donne v$COUNT" >&2
    exit 1
  fi
  # Clone sans contenus (CI : filter blob:none) : les fichiers absents sont demandés en une fois, pas un par un
  if [ -n "$(git -C "$REPO" config --get remote.origin.promisor || true)" ]; then
    git -C "$REPO" rev-list --objects --missing=print --no-walk "$SHA" | sed -n 's/^?//p' \
      | git -C "$REPO" -c fetch.negotiationAlgorithm=noop fetch --quiet origin --no-tags --no-write-fetch-head \
          --recurse-submodules=no --filter=blob:none --stdin || true
  fi
  git -C "$REPO" archive "$SHA" -- . ':(exclude)iphone' | tar -xf - -C "$DEST"
fi

git -C "$DEST" init --quiet
mkdir -p "$DEST/.git/objects/info"
echo "$(git -C "$REPO" rev-parse --absolute-git-dir)/objects" > "$DEST/.git/objects/info/alternates"
printf 'app/node_modules/\n' > "$DEST/.git/info/exclude"
git -C "$DEST" add -A
git -C "$DEST" -c user.name=upstream -c user.email=upstream@localhost commit --quiet --allow-empty -m "code d'origine (v$COUNT, $SHA)"

shopt -s nullglob
PATCHES=("$ROOT"/patches/*.patch)
# Application directe (pas de fusion à trois) : un correctif qui ne s'applique plus tel quel est à refaire.
# Pour le refaire : git -C upstream apply --3way <correctif>, puis git -C upstream diff.
for patch in "${PATCHES[@]}"; do
  if ! git -C "$DEST" apply --index --whitespace=nowarn "$patch"; then
    echo "::error::Le correctif $(basename "$patch") ne s'applique plus sur v$COUNT : le refaire (git apply --3way, puis git diff)" >&2
    exit 1
  fi
done
if [ -d "$ROOT/overlay" ]; then
  cp -R "$ROOT/overlay/." "$DEST/"
fi
# Projet natif copié (pas lié) : le Package.swift que `cap sync ios` régénère pointe vers app/node_modules en relatif
rm -rf "$DEST/app/ios"
if [ -d "$ROOT/ios" ]; then
  cp -R "$ROOT/ios" "$DEST/app/ios"
fi

# Des tests de overlay/ relisent les workflows par leur chemin du dépôt iOS (../../.github/workflows depuis
# upstream/app, soit iphone/.github/workflows) : copie de ceux de la racine, sous leurs deux noms (ignorée par git)
rm -rf "$ROOT/.github"
mkdir -p "$ROOT/.github/workflows"
for wf in "$REPO"/.github/workflows/ios-*.yml; do
  cp "$wf" "$ROOT/.github/workflows/$(basename "$wf")"
  cp "$wf" "$ROOT/.github/workflows/$(basename "$wf" | sed 's/^ios-//')"
done

echo "upstream/ prêt : v$COUNT ($SHA), ${#PATCHES[@]} correctif(s)"
