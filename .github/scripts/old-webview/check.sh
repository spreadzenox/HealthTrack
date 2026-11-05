#!/usr/bin/env bash
# WEBVIEW-MIN (04/11) : sur Android 9 (API 28), l'image d'émulateur garde sa WebView d'origine, plus ancienne que
# android.minWebViewVersion (capacitor.config.json). L'app doit montrer sa page « Mettez à jour Android System
# WebView » (server.errorPath) au lieu d'un écran blanc, sans planter. Il a trouvé le 04/11 le plantage à l'ouverture
# sous Android ≤ 12 (AssociationInfo dans une signature de CompanionPlugin, PLUGIN-API) : Capacitor lit les plugins
# avant de charger la page, donc ce job couvre aussi le démarrage natif sur un vieil Android. Si la WebView de l'image est assez récente,
# l'app doit simplement s'ouvrir (aucun plantage) : le résumé le dit.
set -u
APK="$1"
OUT=old-webview
mkdir -p "$OUT"
MIN=$(node -e "console.log(require('./app/capacitor.config.json').android.minWebViewVersion)")
PKG=com.healthtrack.app

timeout 180 adb install -r "$APK" >/dev/null || { echo "::error::installation impossible"; exit 1; }
WV=$(timeout 30 adb shell dumpsys webviewupdate | tr -d '\r' | grep -m1 -oE 'Current WebView package \(name, version\): \([^)]*\)' || true)
MAJOR=$(echo "$WV" | grep -oE ', [0-9]+' | head -1 | tr -dc '0-9')
timeout 15 adb logcat -c
timeout 60 adb shell am start -n "$PKG/.MainActivity" >/dev/null
sleep 12
timeout 30 adb exec-out screencap -p > "$OUT/ecran.png"
# L'arbre d'accessibilité de la WebView se remplit parfois tard : plusieurs lectures, sur 40 s au plus.
for i in 1 2 3 4 5; do
  timeout 60 adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  timeout 30 adb pull /sdcard/ui.xml "$OUT/ui.xml" >/dev/null 2>&1 || true
  grep -q "Android System WebView" "$OUT/ui.xml" 2>/dev/null && break
  sleep 8
done
timeout 30 adb logcat -d > "$OUT/logcat.txt"

ALIVE=$(timeout 15 adb shell pidof "$PKG" | tr -d '\r')
# Seuls les plantages du processus de l'app comptent (CI-OLDWV-1, 05/11) : l'outil uiautomator lui-même plante
# parfois (« FATAL EXCEPTION: UiAutomation », sans ligne « Process: »), ce qui n'est pas un défaut de l'app.
CRASH=$(grep -cE "AndroidRuntime: Process: $PKG(,|:| )" "$OUT/logcat.txt" || true)
OTHER=$(( $(grep -c "FATAL EXCEPTION" "$OUT/logcat.txt" || true) - CRASH ))
SHOWN=$(grep -c "Android System WebView" "$OUT/ui.xml" 2>/dev/null || true)

{
  echo "## WebView trop ancienne (API 28)"
  echo "- WebView de l'image : ${WV:-inconnue} (majeure ${MAJOR:-?}) ; minimum déclaré : $MIN"
  echo "- Processus vivant : $([ -n "$ALIVE" ] && echo oui || echo NON) ; plantages Java : $CRASH (autres processus : $OTHER)"
  echo "- Page « Mettez à jour Android System WebView » lue à l'écran : $([ "$SHOWN" -gt 0 ] && echo oui || echo non)"
} > old_webview.md
cat old_webview.md

[ -n "$ALIVE" ] || { echo "::error::l'app s'est fermée sous Android 9"; exit 1; }
[ "$CRASH" -eq 0 ] || { echo "::error::plantage Java sous Android 9"; exit 1; }
if [ -n "$MAJOR" ] && [ "$MAJOR" -lt "$MIN" ] && [ "$SHOWN" -eq 0 ]; then
  echo "::error::WebView $MAJOR < $MIN mais la page de mise à jour n'est pas affichée"
  exit 1
fi
