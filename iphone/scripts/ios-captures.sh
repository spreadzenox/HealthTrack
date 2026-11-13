#!/usr/bin/env bash
# Installe l'app (build simulateur avec VITE_IOS_CAPTURE=1) sur deux simulateurs : un iPhone de 390 × 844 points
# comme l'iPhone 12 de test, et un iPhone récent. L'app parcourt elle-même ses pages (overlay/app/src/ios/
# captureMode.js) : quand une page est prête, elle écrit son nom dans Documents/capture/ready.txt de son conteneur ;
# on capture l'écran, puis on répond dans Documents/capture/ack.txt, et l'app passe à la suite, jusqu'à « fin ».
# La console est enregistrée ; ses erreurs JavaScript sont résumées dans js-errors.txt.
# Sur la feuille « Accès à Santé » (I4) et les étapes des notifications du soir (I5), les tests d'interface du dépôt
# (uitests/, déjà construits : fichier .xctestrun) touchent les boutons avant l'accusé (voir ui_steps).
#   scripts/ios-captures.sh <chemin/App.app> <dossier de sortie> [<fichier .xctestrun>]
set -euo pipefail
APP="$1"; OUT="$2"; XCTESTRUN="${3:-}"; BUNDLE="fr.jpesquet.sante"
mkdir -p "$OUT"

# Premier simulateur disponible dont le nom correspond, dans l'ordre de préférence donné
pick() {
  for name in "$@"; do
    udid="$(xcrun simctl list devices available -j | jq -r --arg n "$name" \
      '[.devices | to_entries[] | select(.key | test("iOS")) | .value[] | select(.name == $n)] | last | .udid // empty')"
    if [ -n "$udid" ]; then echo "$udid $name"; return 0; fi
  done
  return 1
}

SMALL="$(pick "iPhone 16e" "iPhone 14" "iPhone 13" "iPhone 12" || true)"
LARGE="$(pick "iPhone 17 Pro" "iPhone 17" "iPhone 16 Pro" "iPhone 16" "iPhone 15 Pro" || true)"
# Fiche App Store (I9) : CAPTURE_DEVICES (« iPhone 17 Pro Max », ou plusieurs noms séparés par des virgules, par
# ordre de préférence) remplace les deux simulateurs habituels par le premier trouvé, pour les captures 6,9 pouces
if [ -n "${CAPTURE_DEVICES:-}" ]; then
  IFS=',' read -ra WANTED <<< "$CAPTURE_DEVICES"
  SMALL="$(pick "${WANTED[@]}" || true)"; LARGE=""
fi
[ -n "$SMALL$LARGE" ] || { echo "::error::Aucun simulateur iPhone disponible"; xcrun simctl list devices available; exit 1; }

# Tests d'interface du dépôt (uitests/, fichier .xctestrun) lancés sur certaines pages, avant l'accusé : chacun suivi
# d'une capture de l'écran qu'il laisse. Sans eux, les feuilles et alertes restent ouvertes.
ui_steps() { # <page> → lignes « <Classe/test> <suffixe de capture> »
  case "$1" in
    healthkit-autorisation) echo "SanteUITests/testAccepterLaFeuilleSante healthkit-apres" ;;
    notification-autorisation) echo "NotificationsUITests/testAutoriserLesNotifications notification-autorisee" ;;
    notification-bilan) echo "NotificationsUITests/testRepondreGeneDepuisLaBanniere notification-apres" ;;
    note-du-soir) echo "NotificationsUITests/testNoterLaSoireeDepuisLaBanniere note-apres" ;;
    rappel-portion) echo "NotificationsUITests/testToucherLeRappelDePortion rappel-apres" ;;
    import-fichier) echo "DonneesUITests/testImporterUnFichierDepuisFichiers import-apres" ;;
    export-partage) echo "DonneesUITests/testEnregistrerLaSauvegardeDansFichiers export-apres" ;;
    rapport-partage) echo "DonneesUITests/testEnregistrerLeRapportDansFichiers rapport-apres" ;;
  esac
}

run_ui_steps() { # <udid> <préfixe des fichiers> <page>
  local steps test suffix
  steps="$(ui_steps "$3")"
  [ -n "$steps" ] || return 0
  if [ -z "$XCTESTRUN" ] || [ ! -f "$XCTESTRUN" ]; then
    echo "::warning::test d'interface absent : $3 laissée telle quelle"
    return 0
  fi
  while read -r test suffix; do
    if xcodebuild test-without-building -xctestrun "$XCTESTRUN" -destination "id=$1" \
        -only-testing:"HalcyaUITests/$test" < /dev/null > "$OUT/$2-$suffix-test.txt" 2>&1; then
      echo "test d'interface : $test ✓"
    else
      echo "::warning::$2 : $test en échec (voir $2-$suffix-test.txt)"
      grep -E "error:|failed|introuvable|absent|non atteint" "$OUT/$2-$suffix-test.txt" | head -8 || true
    fi
    sleep 2
    xcrun simctl io "$1" screenshot "$OUT/$2-$suffix.png" >/dev/null || true
  done <<< "$steps"
}

run_device() { # <udid> <nom> [taille du texte d'iOS, pour le passage en grand texte]
  local udid="$1" name="$2" size="${3:-}" dev log pid seen=0 deadline
  dev="$(echo "$name" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')${size:+-grand-texte}"
  log="$OUT/$dev-console.txt"
  echo "== $name ($udid)"
  xcrun simctl boot "$udid" 2>/dev/null || true
  xcrun simctl bootstatus "$udid" -b >/dev/null
  # iPhone en français (feuilles et boutons d'iOS comme chez un utilisateur français) : réglage global, puis
  # redémarrage du simulateur pour que les processus d'iOS le prennent
  xcrun simctl spawn "$udid" defaults write -g AppleLanguages -array fr-FR
  xcrun simctl spawn "$udid" defaults write -g AppleLocale -string fr_FR
  xcrun simctl shutdown "$udid"
  xcrun simctl boot "$udid"
  xcrun simctl bootstatus "$udid" -b >/dev/null
  xcrun simctl ui "$udid" appearance light
  # Taille du texte d'iOS (la vue web la suit, TextSize.swift) : par défaut (« Grand »), sauf au passage en grand texte
  xcrun simctl ui "$udid" content_size "${size:-large}" || true
  # Fiche App Store : barre d'état propre, comme sur les captures d'Apple (9:41, batterie pleine, réseau plein)
  if [ -n "${CAPTURE_DEVICES:-}" ]; then
    xcrun simctl status_bar "$udid" override --time "9:41" --batteryState charged --batteryLevel 100 \
      --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 || true
  fi
  # Passage en grand texte : app neuve, le plan des captures repart de zéro (largeTextPlan de captureMode.js)
  [ -z "$size" ] || xcrun simctl uninstall "$udid" "$BUNDLE" 2>/dev/null || true
  xcrun simctl install "$udid" "$APP"
  # Écran d'accueil de l'iPhone juste après l'installation : icône et nom « Halcya » (I1, à vérifier sur l'accueil)
  sleep 3
  xcrun simctl io "$udid" screenshot "$OUT/$dev-ecran-accueil.png" >/dev/null || true
  # Accusé vide créé d'avance : sans lui, chaque lecture de l'app en attente remplit la console d'erreurs « fichier absent »
  data="$(xcrun simctl get_app_container "$udid" "$BUNDLE" data)"
  mkdir -p "$data/Documents/capture"
  # Lecture du visage (I7) : le simulateur n'a pas de caméra ; un portrait du domaine public (tests d'Android) la
  # remplace dans la build de captures, et la permission de la caméra est accordée d'avance
  PORTRAIT="$(cd "$(dirname "$0")/.." && pwd)/upstream/app/android/app/src/test/resources/face/face-frontal.png"
  if [ -f "$PORTRAIT" ]; then
    cp "$PORTRAIT" "$data/Documents/capture/visage.png"
    xcrun simctl privacy "$udid" grant camera "$BUNDLE" || true
  fi
  : > "$data/Documents/capture/ack.txt"
  xcrun simctl launch --console-pty --terminate-running-process "$udid" "$BUNDLE" > "$log" 2>&1 &
  pid=$!
  # 25 min par iPhone : le parcours et les trois essais de notifications (bannières attendues 45 s) en prennent ~19
  deadline=$((SECONDS + 1500)); last=""
  while [ "$SECONDS" -lt "$deadline" ]; do
    page="$(cat "$data/Documents/capture/ready.txt" 2>/dev/null || true)"
    if [ -n "$page" ] && [ "$page" != "$last" ]; then
      [ "$page" = fin ] && break
      xcrun simctl io "$udid" screenshot "$OUT/$dev-$page.png" >/dev/null
      echo "capture : $dev-$page.png"
      seen=$((seen + 1)); last="$page"
      run_ui_steps "$udid" "$dev" "$page"
      printf '%s' "$page" > "$data/Documents/capture/ack.txt"
    fi
    # L'app s'est arrêtée (plantage) : inutile d'attendre la limite, la cause est dans la console
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "::warning::$name : l'app s'est arrêtée en cours de parcours (voir $dev-console.txt)"
      grep -a -m1 "Terminating app" "$log" || true
      break
    fi
    sleep 0.3
  done
  [ "$(cat "$data/Documents/capture/ready.txt" 2>/dev/null)" = fin ] || echo "::warning::$name : parcours des pages inachevé ($seen capture(s))"
  # Données (I3) : la copie de secours s'écrit 10 s après le dernier chargement ; où WKWebView range IndexedDB
  sleep 12
  { echo "== Documents"; ls -la "$data/Documents"; echo "== Documents/Copie de secours"; ls -la "$data/Documents/Copie de secours"; echo "== Library/WebKit"; find "$data/Library/WebKit" -maxdepth 6 2>/dev/null | sed "s|$data/||" | head -60; } > "$OUT/$dev-donnees.txt" 2>&1
  # La copie est vue par la sonde [sauvegarde], avant « Supprimer toutes mes données » qui l'efface (dossier vide ensuite) ;
  # pas de sonde au passage en grand texte
  if [ -n "$size" ]; then :
  elif grep -a '\[sauvegarde\] Documents/Copie de secours {' "$log" | grep -qE '"files":[1-9]'; then echo "copie de secours : présente (sonde [sauvegarde])"
  else echo "::warning::$name : pas de copie de secours dans Documents/Copie de secours (sonde [sauvegarde])"; fi
  # Copie de secours hors de la sauvegarde iCloud (directive 5.1.3 (ii), décision du 1/11) : dossier marqué exclu
  if [ -n "$size" ]; then :
  elif grep -a '\[sauvegarde\] Documents/Copie de secours {' "$log" | grep -q '"excluded":true'; then echo "copie de secours : exclue de la sauvegarde iCloud"
  else echo "::error::$name : le dossier de la copie de secours n'est pas exclu de la sauvegarde iCloud (sonde [sauvegarde])"; fi
  xcrun simctl terminate "$udid" "$BUNDLE" 2>/dev/null || true
  sleep 1; kill "$pid" 2>/dev/null || true
  xcrun simctl shutdown "$udid" || true
}

[ -z "$SMALL" ] || run_device "${SMALL%% *}" "${SMALL#* }"
[ -z "$LARGE" ] || run_device "${LARGE%% *}" "${LARGE#* }"
# Taille du texte d'iOS en très grand (« extra-extra-extra-large », la plus grande hors accessibilité : texte × 1,35),
# sur le petit iPhone (390 points, comme l'iPhone 12) : quelques pages, hors captures de la fiche
[ -n "${CAPTURE_DEVICES:-}" ] || [ -z "$SMALL" ] || run_device "${SMALL%% *}" "${SMALL#* }" extra-extra-extra-large

# Erreurs JavaScript relayées par Capacitor (« ⚡️  [error] - … ») et exceptions non rattrapées
grep -hE "\[error\]|Unhandled|TypeError|ReferenceError|SyntaxError|JS ERROR" "$OUT"/*-console.txt > "$OUT/js-errors.txt" || true
echo "erreurs JavaScript : $(wc -l < "$OUT/js-errors.txt" | tr -d ' ') ligne(s) (js-errors.txt)"
# Audit des textes (I2) : pages de l'iPhone où un mot propre à Android reste affiché (captureMode.js, androidWords)
for f in "$OUT"/*-console.txt; do
  grep -ho "\[texte\] .*" "$f" | sed "s|^|$(basename "$f" -console.txt) |" || true
done > "$OUT/texte-android.txt"
echo "textes propres à Android : $(wc -l < "$OUT/texte-android.txt" | tr -d ' ') page(s) (texte-android.txt)"
