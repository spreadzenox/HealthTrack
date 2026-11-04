#!/usr/bin/env bash
# WEBVIEW-MIN (04/11) : sur Android 9 (API 28), l'image d'émulateur garde sa WebView d'origine, plus ancienne que
# android.minWebViewVersion (capacitor.config.json). L'app doit montrer sa page « Mettez à jour Android System
# WebView » (server.errorPath) au lieu d'un écran blanc, sans planter. Si la WebView de l'image est assez récente,
# l'app doit simplement s'ouvrir (aucun plantage) : le résumé le dit.
set -u
APK="$1"
OUT=old-webview
mkdir -p "$OUT"
MIN=$(node -e "console.log(require('./app/capacitor.config.json').android.minWebViewVersion)")
PKG=com.healthtrack.app

adb install -r "$APK" >/dev/null
WV=$(adb shell dumpsys webviewupdate | tr -d '\r' | grep -m1 -oE 'Current WebView package \(name, version\): \([^)]*\)' || true)
MAJOR=$(echo "$WV" | grep -oE ', [0-9]+' | head -1 | tr -dc '0-9')
adb logcat -c
adb shell am start -W -n "$PKG/.MainActivity" >/dev/null
sleep 12
adb exec-out screencap -p > "$OUT/ecran.png"
adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
adb pull /sdcard/ui.xml "$OUT/ui.xml" >/dev/null 2>&1 || true
adb logcat -d > "$OUT/logcat.txt"

ALIVE=$(adb shell pidof "$PKG" | tr -d '\r')
CRASH=$(grep -c "FATAL EXCEPTION" "$OUT/logcat.txt" || true)
SHOWN=$(grep -c "Android System WebView" "$OUT/ui.xml" 2>/dev/null || true)

{
  echo "## WebView trop ancienne (API 28)"
  echo "- WebView de l'image : ${WV:-inconnue} (majeure ${MAJOR:-?}) ; minimum déclaré : $MIN"
  echo "- Processus vivant : ${ALIVE:+oui}${ALIVE:-NON} ; plantages Java : $CRASH"
  echo "- Page « Mettez à jour Android System WebView » lue à l'écran : $([ "$SHOWN" -gt 0 ] && echo oui || echo non)"
} > old_webview.md
cat old_webview.md

[ -n "$ALIVE" ] || { echo "::error::l'app s'est fermée sous Android 9"; exit 1; }
[ "$CRASH" -eq 0 ] || { echo "::error::plantage Java sous Android 9"; exit 1; }
if [ -n "$MAJOR" ] && [ "$MAJOR" -lt "$MIN" ] && [ "$SHOWN" -eq 0 ]; then
  echo "::error::WebView $MAJOR < $MIN mais la page de mise à jour n'est pas affichée"
  exit 1
fi
