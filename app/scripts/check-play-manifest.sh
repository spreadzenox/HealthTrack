#!/usr/bin/env bash
# Vérifie les manifestes fusionnés des deux variantes (journal/PRODUIT.md, jalon 3), après un build Gradle :
#   - play     : identifiant fr.jpesquet.sante, AUCUNE permission REQUEST_INSTALL_PACKAGES (refusée par Google Play
#                pour une app qui n'est pas un magasin d'applications), ni service caméra de premier plan, ni
#                exemption de batterie (journal/PLAY-CONFORMITE.md), ni écriture Health Connect (I131) ; avec la
#                permission com.android.vending.BILLING (Google Play Billing, jalon 6c-2) ;
#   - sideload : identifiant historique com.healthtrack.app, avec REQUEST_INSTALL_PACKAGES (mise à jour en un clic)
#                et la lecture du visage au déverrouillage (FaceSenseService), sans Play Billing.
# Usage : bash scripts/check-play-manifest.sh [--play-only | --face-unlock-preview | --face-unlock-play]
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
  # Lecture du visage au déverrouillage : sideload seulement
  local face=no
  [ "$install" = "yes" ] && face=yes
  for needle in '.FaceSenseService"' 'android.permission.FOREGROUND_SERVICE_CAMERA' 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS'; do
    if grep -qF "$needle" "$m"; then
      [ "$face" = "yes" ] || { echo "::error::$variant : $needle ne doit pas y être ($m)"; fail=1; }
    else
      [ "$face" = "no" ] || { echo "::error::$variant : $needle manquant ($m)"; fail=1; }
    fi
  done
  if [ "$face" = "no" ] && grep -q 'android.permission.health.WRITE_' "$m"; then
    echo "::error::$variant : permissions d'écriture Health Connect présentes ($m)"
    fail=1
  fi
  # Google Play Billing (jalon 6c-2) : permission BILLING en play seulement, la sideload n'a pas Play Billing
  if grep -q 'com.android.vending.BILLING' "$m"; then
    [ "$face" = "no" ] || { echo "::error::$variant : com.android.vending.BILLING ne doit pas y être ($m)"; fail=1; }
  else
    [ "$face" = "yes" ] || { echo "::error::$variant : com.android.vending.BILLING manquante ($m)"; fail=1; }
  fi
  echo "$variant : $m vérifié"
}

# Aperçu play avec l'interrupteur POL-1 allumé (-PfaceUnlockPlay=true -PplayPreview=true, après assemblePlayDebug) :
# service caméra et FOREGROUND_SERVICE_CAMERA présents ; ni relance (FaceResumeJob / Receiver), ni exemption de
# batterie, ni REQUEST_INSTALL_PACKAGES, ni écriture Health Connect ; Play Billing gardé.
# --face-unlock-play : mêmes règles sur l'AAB play signé du brouillon P28 (-PfaceUnlockPlay=true, bundlePlayRelease,
# identifiant fr.jpesquet.sante ; workflow « Play — brouillon P28 »).
check_face_unlock_preview() {
  local variant="${1:-playDebug}" app_id="${2:-fr.jpesquet.sante.apercu}" m
  m="$(manifest_for "$variant")"
  if [ -z "$m" ]; then echo "::error::Manifeste fusionné introuvable pour $variant"; exit 1; fi
  grep -q "package=\"$app_id\"" "$m" || { echo "::error::aperçu : identifiant $app_id attendu"; fail=1; }
  for needle in '.FaceSenseService"' 'android.permission.FOREGROUND_SERVICE_CAMERA' 'com.android.vending.BILLING'; do
    grep -qF "$needle" "$m" || { echo "::error::aperçu : $needle manquant ($m)"; fail=1; }
  done
  for needle in '.FaceResumeJob"' '.FaceResumeReceiver"' 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS' \
      'android.permission.REQUEST_INSTALL_PACKAGES' 'android.permission.health.WRITE_'; do
    if grep -qF "$needle" "$m"; then echo "::error::aperçu : $needle ne doit pas y être ($m)"; fail=1; fi
  done
  echo "$variant (lecture au déverrouillage allumée) : $m vérifié"
}

if [ "${1:-}" = "--face-unlock-preview" ]; then
  check_face_unlock_preview
  exit $fail
fi
if [ "${1:-}" = "--face-unlock-play" ]; then
  check_face_unlock_preview playRelease fr.jpesquet.sante
  exit $fail
fi
check playRelease fr.jpesquet.sante no
[ "${1:-}" = "--play-only" ] || check sideloadDebug com.healthtrack.app yes
exit $fail
