#!/usr/bin/env bash
# Réimporte l'état du dépôt spreadzenox/HealthTrack-iOS, à un commit donné, dans le dossier iphone/ de ce dépôt.
# Répétable : la routine iOS continue de travailler dans son dépôt jusqu'à la bascule ; on relance ce script le jour J.
#
#   iphone/fusion/importer.sh                       dernier commit de main du dépôt iOS (clone temporaire)
#   iphone/fusion/importer.sh <commit>              ce commit
#   iphone/fusion/importer.sh --source <clone> [<commit>]   depuis un clone local déjà à jour (rien n'est téléchargé)
#
# Ce que fait un import :
#   1. iphone/ reçoit l'arbre du dépôt iOS tel quel (patches/, overlay/, ios/, scripts/, store/, site/, uitests/,
#      journal/, upstream.json, testflight-version.json, .gitignore) ; ce qui a disparu là-bas disparaît ici.
#   2. Trois fichiers ne sont PAS repris, parce que le dépôt unique a les siens (liste REMPLACES) :
#      scripts/upstream.sh (le code n'est plus téléchargé), CLAUDE.md et README.md. S'ils ont changé dans le dépôt iOS
#      depuis le dernier import, le script le dit, montre la différence et sort en code 3 : à reporter à la main.
#   3. iphone/fusion/ (ce dossier) n'est jamais touché.
#   4. .github/workflows/ios-*.yml sont régénérés depuis les workflows du dépôt iOS (porter-workflows.mjs).
#   5. iphone/fusion/IMPORT.json note le commit importé et le nombre de commits du dépôt iOS à ce commit.
# Le script ne committe rien et ne pousse rien : relire `git status`, puis committer.
# Le dépôt iOS est seulement lu.
set -euo pipefail

SRC_URL="https://github.com/spreadzenox/HealthTrack-iOS"
HERE="$(cd "$(dirname "$0")" && pwd)"
IPHONE="$(dirname "$HERE")"
REPO="$(git -C "$IPHONE" rev-parse --show-toplevel)"
PREFIX="iphone"
REMPLACES=(scripts/upstream.sh CLAUDE.md README.md)
# Lus pour détecter un changement, sans être copiés : pages.yml (le site est construit par ios-site.yml, écrit à la main)
SURVEILLES=("${REMPLACES[@]}" .github/workflows/pages.yml)

SOURCE=""; REV=""
while [ $# -gt 0 ]; do
  case "$1" in
    --source) SOURCE="$2"; shift 2 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) REV="$1"; shift ;;
  esac
done

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
if [ -z "$SOURCE" ]; then
  SOURCE="$TMP/src"
  git clone --quiet --filter=blob:none --no-checkout "$SRC_URL" "$SOURCE"
  REV="${REV:-origin/main}"
else
  REV="${REV:-HEAD}"
fi
SHA="$(git -C "$SOURCE" rev-parse --verify "$REV^{commit}")"
COMMITS="$(git -C "$SOURCE" rev-list --count "$SHA")"
DATE="$(git -C "$SOURCE" log -1 --format=%cI "$SHA")"
echo "Import de HealthTrack-iOS@${SHA:0:7} ($DATE, $COMMITS commits)"

# Fichiers remplacés ou surveillés : ont-ils changé dans le dépôt iOS depuis le dernier import ?
MANIFEST="$HERE/IMPORT.json"
A_REPORTER=()
for f in "${SURVEILLES[@]}"; do
  new="$(git -C "$SOURCE" rev-parse --verify --quiet "$SHA:$f" || echo absent)"
  old="$( [ -f "$MANIFEST" ] && node -p "require('$MANIFEST').surveilles?.['$f'] ?? ''" || true)"
  if [ -n "$old" ] && [ "$old" != "$new" ]; then
    A_REPORTER+=("$f")
    echo
    echo "⚠ $f a changé dans le dépôt iOS depuis le dernier import (à reporter à la main dans ce dépôt) :"
    if [ "$old" != absent ] && [ "$new" != absent ] && git -C "$SOURCE" cat-file -e "$old" 2>/dev/null; then
      git -C "$SOURCE" --no-pager diff "$old" "$new" || true
    fi
  fi
  printf '%s\t%s\n' "$f" "$new" >> "$TMP/surveilles.tsv"
done

# 1. Arbre du dépôt iOS, sans ses workflows ni les fichiers remplacés
mkdir "$TMP/tree"
git -C "$SOURCE" archive "$SHA" | tar -xf - -C "$TMP/tree"
mkdir "$TMP/workflows"
cp "$TMP/tree/.github/workflows/"*.yml "$TMP/workflows/"
rm -rf "$TMP/tree/.github"
for f in "${REMPLACES[@]}"; do rm -f "$TMP/tree/$f"; done
if [ -e "$TMP/tree/fusion" ]; then echo "::error::le dépôt iOS a un dossier fusion/ : il écraserait celui-ci" >&2; exit 1; fi

# Ce qui était suivi sous iphone/ et ne vient pas d'ici disparaît (fusion/ et les fichiers remplacés restent)
keep_re="^$PREFIX/fusion/"
for f in "${REMPLACES[@]}"; do keep_re="$keep_re|^$PREFIX/$f\$"; done
(cd "$REPO" && git ls-files -z -- "$PREFIX" | { grep -zEv "$keep_re" || true; } | xargs -0 -r rm -f --)
find "$IPHONE" -depth -type d -empty -not -path "$IPHONE/upstream/*" -delete 2>/dev/null || true
mkdir -p "$IPHONE"
cp -R "$TMP/tree/." "$IPHONE/"

# Le .gitignore de la racine de ce dépôt ignore toutes les images ; celles de l'iPhone sont suivies
cat >> "$IPHONE/.gitignore" <<'GITIGNORE'

# --- Dépôt unique (ajouté par fusion/importer.sh) : la racine ignore *.png et *.jpg, pas ici
!*.png
!*.jpg
# Dossiers créés par la CI dans iphone/
/captures/
/captures-store/
/captures-ipad/
/_site/
GITIGNORE

# 4. Workflows
echo "Workflows :"
(cd "$REPO" && git ls-files -z -- '.github/workflows/ios-*.yml' | { xargs -0 -r grep -lZ '^# GÉNÉRÉ par iphone/fusion/porter-workflows.mjs' || true; } | xargs -0 -r rm -f --)
node "$HERE/porter-workflows.mjs" "$TMP/workflows" "$REPO/.github/workflows" "$SHA"

# 5. Manifeste
node -e "
  const fs = require('fs')
  const surveilles = Object.fromEntries(fs.readFileSync('$TMP/surveilles.tsv', 'utf8').trim().split('\n').map((l) => l.split('\t')))
  fs.writeFileSync('$MANIFEST', JSON.stringify({ depot: 'spreadzenox/HealthTrack-iOS', commit: '$SHA', date: '$DATE', commits: $COMMITS, surveilles }, null, 2) + '\n')
"

# Rien d'importé ne doit être ignoré par git (sinon l'import serait incomplet sans le dire)
cd "$REPO"
git add -A -- "$PREFIX" .github/workflows
MISSING="$(cd "$TMP/tree" && find . -type f | sed "s#^\./#$PREFIX/#" | while read -r f; do git -C "$REPO" ls-files --error-unmatch -- "$f" >/dev/null 2>&1 || echo "$f"; done)"
if [ -n "$MISSING" ]; then
  echo "::error::fichiers importés mais pas suivis par git (ignorés ?) :" >&2; echo "$MISSING" >&2; exit 1
fi

echo
echo "Import prêt (rien n'est committé) : $(git ls-files -- "$PREFIX" | wc -l | tr -d ' ') fichiers sous $PREFIX/."
if [ ${#A_REPORTER[@]} -gt 0 ]; then
  echo "À REPORTER À LA MAIN avant de committer : ${A_REPORTER[*]} (différences ci-dessus)."
  exit 3
fi
