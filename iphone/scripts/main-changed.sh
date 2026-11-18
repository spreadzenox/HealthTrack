#!/usr/bin/env bash
# CI économe (décision du propriétaire du 18/11) : les builds macOS de main ne partent plus à chaque merge, mais une fois
# par soir. Ce script dit si le code concerné a changé depuis la dernière exécution réussie du même workflow sur main :
# sinon, le build du soir est sauté (aucune minute Mac pour rien). Un lancement manuel (workflow_dispatch) part toujours.
#   scripts/main-changed.sh <fichier du workflow, ex. ios-build.yml> <pathspec git>...
# Écrit « changed=oui|non » dans $GITHUB_OUTPUT (ou sur la sortie standard hors CI). Besoin : GH_TOKEN (actions: read),
# GITHUB_REPOSITORY, et un dépôt cloné avec son historique (fetch-depth: 0).
set -euo pipefail
WORKFLOW="$1"; shift
out() { echo "changed=$1"; [ -z "${GITHUB_OUTPUT:-}" ] || echo "changed=$1" >> "$GITHUB_OUTPUT"; echo "$2"; }

if [ "${GITHUB_EVENT_NAME:-}" = workflow_dispatch ]; then out oui "Lancement manuel : build fait"; exit 0; fi

LAST="$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/$WORKFLOW/runs?branch=main&status=success&per_page=1" \
  --jq '.workflow_runs[0].head_sha // empty' 2>/dev/null || true)"
if [ -z "$LAST" ] || ! git cat-file -e "$LAST^{commit}" 2>/dev/null; then
  out oui "Aucune exécution réussie connue sur main : build fait"; exit 0
fi
CHANGED="$(git diff --no-renames --name-only "$LAST" HEAD -- "$@" | head -20)"
if [ -n "$CHANGED" ]; then
  out oui "Changé depuis ${LAST::7} (dernière exécution réussie) :"$'\n'"$CHANGED"
else
  out non "Rien de concerné n'a changé depuis ${LAST::7} : build du soir sauté"
fi
