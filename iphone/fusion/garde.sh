#!/usr/bin/env bash
# Garde des workflows iOS qui publient (TestFlight, fiche et abonnements App Store, examen bêta) : ils ne démarrent
# que sur main de spreadzenox/HealthTrack, et seulement quand iphone/fusion/bascule.json dit « publication: true ».
# Le job qui publie dépend de cette garde ; sinon il est sauté, et l'environnement « appstore » n'est jamais demandé.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ON="$(node -p "require('$DIR/bascule.json').publication === true")"
OUT="${GITHUB_OUTPUT:-/dev/stdout}"
if [ "${GITHUB_REPOSITORY:-}" != "spreadzenox/HealthTrack" ] || [ "${GITHUB_REF:-}" != "refs/heads/main" ]; then
  echo "::notice::Publication iOS réservée à la branche main de spreadzenox/HealthTrack : rien n'est lancé ici."
  echo "publication=non" >> "$OUT"
elif [ "$ON" != "true" ]; then
  echo "::notice::Publication iOS éteinte (iphone/fusion/bascule.json) : rien n'est envoyé à Apple avant la bascule."
  echo "publication=non" >> "$OUT"
else
  echo "publication=oui" >> "$OUT"
fi
