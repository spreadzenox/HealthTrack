#!/usr/bin/env bash
# Vérifie les manifestes fusionnés des deux variantes (journal/PRODUIT.md, jalon 3), après un build Gradle :
#   - play     : identifiant fr.jpesquet.sante, AUCUNE permission REQUEST_INSTALL_PACKAGES (refusée par Google Play
#                pour une app qui n'est pas un magasin d'applications) ;
#   - sideload : identifiant historique com.healthtrack.app, avec REQUEST_INSTALL_PACKAGES (mise à jour en un clic).
# Usage : bash scripts/check-play-manifest.sh [--play-only]
#         (depuis app/, après ./gradlew bundlePlayRelease assembleSideloadDebug ; --play-only après bundlePlayRelease seul)
set -euo pipefail
BUILD="android/app/build/intermediates"
fail=0

manifest_for() {
  # Manifeste fusionné final de la variante (ex. playRelease) ; le chemin exact dépend de la version d'AGP
  find "$BUILD" -path "*merged_manifest*/$1/*" -name AndroidManifest.xml 2>/dev/null | head -1 || true
}

check() {
  local variant="$1" app_id="$2" install="$3" m
  m="$(manifest_for "$variant")"
  if [ -z "$m" ]; then
    echo "::error::Manifeste fusionné introuvable pour $variant (le build Gradle a-t-il tourné ?)"
    fail=1
    return
  fi
  if ! grep -q "package=\"$app_id\"" "$m"; then
    echo "::error::$variant : identifiant attendu $app_id ($m)"
    fail=1
  fi
  if grep -q 'android.permission.REQUEST_INSTALL_PACKAGES' "$m"; then
    [ "$install" = "yes" ] || { echo "::error::$variant : REQUEST_INSTALL_PACKAGES ne doit pas y être ($m)"; fail=1; }
  else
    [ "$install" = "no" ] || { echo "::error::$variant : REQUEST_INSTALL_PACKAGES manquante ($m)"; fail=1; }
  fi
  echo "$variant : $m vérifié"
}

check playRelease fr.jpesquet.sante no
[ "${1:-}" = "--play-only" ] || check sideloadDebug com.healthtrack.app yes
exit $fail
