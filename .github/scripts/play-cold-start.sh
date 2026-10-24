#!/usr/bin/env bash
# Premier lancement à froid de la variante play sur données vierges (critère C4 de la version candidate, VC-9).
# Appelé par run-emulator-tests.sh, émulateur déjà démarré. Mesure :
#   - le temps de démarrage de l'activité rapporté par Android (`am start -W`, TotalTime) ;
#   - le temps jusqu'au premier écran utile (titre de l'onboarding visible dans l'arbre d'accessibilité) ;
#   - les erreurs JavaScript de la WebView (journal Capacitor/Console de la build debug).
# Écrit play_coldstart.md (résumé du job), play_logcat.txt, play_crash.txt et screenshot_play_first.png.
# Code de sortie non nul : premier écran jamais affiché, ou erreur JS non interceptée (« Uncaught »).
set -uo pipefail

APK=app/android/app/build/outputs/apk/play/debug/app-play-debug.apk
PKG=fr.jpesquet.sante
FIRST_SCREEN="Comprenez ce qui va"
TIMEOUT_S=90
OUT=play_coldstart.md

if [ ! -f "$APK" ]; then
  echo "::warning::APK play introuvable ($APK) : premier lancement non mesuré"
  echo "Premier lancement play : APK introuvable, non mesuré." > "$OUT"
  exit 0
fi

echo "=== Variante play : installation neuve ==="
# La variante sideload, relancée juste avant pour ses captures, ne doit pas mêler ses journaux à la mesure
adb shell am force-stop com.healthtrack.app >/dev/null 2>&1 || true
adb uninstall "$PKG" >/dev/null 2>&1 || true
adb install "$APK"
COMPONENT=$(adb shell cmd package resolve-activity --brief "$PKG" | tr -d '\r' | tail -1)
echo "Activité de lancement : $COMPONENT"

# Tous les tampons, y compris « crash » : un plantage antérieur (tests instrumentés, sideload) ne compte pas ici
adb logcat -b all -c || true
T0=$(date +%s%N)
adb shell am start -W -n "$COMPONENT" | tr -d '\r' | tee play_am_start.txt
TOTAL_MS=$(grep -m1 "TotalTime" play_am_start.txt | awk '{print $2}')

FIRST_MS=""
while [ $(( ($(date +%s%N) - T0) / 1000000000 )) -lt "$TIMEOUT_S" ]; do
  adb shell uiautomator dump /sdcard/ui_play.xml >/dev/null 2>&1 || true
  if adb exec-out cat /sdcard/ui_play.xml 2>/dev/null | grep -q "$FIRST_SCREEN"; then
    FIRST_MS=$(( ($(date +%s%N) - T0) / 1000000 ))
    break
  fi
  sleep 0.5
done
adb exec-out screencap -p > screenshot_play_first.png || true
adb exec-out cat /sdcard/ui_play.xml > ui_play_first.xml 2>/dev/null || true

PID=$(adb shell pidof "$PKG" | tr -d '\r')
if [ -n "$PID" ]; then
  adb logcat -d --pid="$PID" > play_logcat.txt 2>/dev/null || true
else
  adb logcat -d > play_logcat.txt 2>/dev/null || true
fi
# Un plantage natif tue le processus : on le cherche dans tout le journal
adb logcat -d -b crash > play_crash.txt 2>/dev/null || true
grep -E " E Capacitor/Console|Uncaught|Unhandled" play_logcat.txt > play_js_errors.txt || true
UNCAUGHT=$(grep -c "Uncaught" play_js_errors.txt || true)
JS_ERRORS=$(wc -l < play_js_errors.txt | tr -d ' ')
# Le tampon « crash » couvre tout l'appareil : on ne compte que les plantages du processus de l'app
# (« Process: fr.jpesquet.sante, PID: … », y compris ses sous-processus « fr.jpesquet.sante:xxx »)
CRASH=$(grep -c "Process: ${PKG}[,:]" play_crash.txt || true)
OTHER_CRASH=$(( $(grep -c "FATAL EXCEPTION" play_crash.txt || true) - CRASH ))

{
  echo "## Premier lancement à froid — variante play, données vierges"
  echo
  echo "| Mesure | Valeur |"
  echo "|---|---|"
  echo "| Démarrage de l'activité (Android, TotalTime) | ${TOTAL_MS:-?} ms |"
  echo "| Premier écran utile (« ${FIRST_SCREEN}… » visible) | ${FIRST_MS:-non affiché après ${TIMEOUT_S} s} ${FIRST_MS:+ms} |"
  echo "| Erreurs JavaScript (console.error + non interceptées) | ${JS_ERRORS} (dont ${UNCAUGHT} « Uncaught ») |"
  echo "| Plantages natifs (FATAL EXCEPTION) | ${CRASH} |"
  echo "| Plantages d'autres processus de l'émulateur (ignorés) | ${OTHER_CRASH} |"
  echo
  echo "Build debug, émulateur logiciel sans GPU : les temps sont des majorants (un vrai téléphone est plus rapide)."
  echo "La détection du premier écran interroge l'arbre d'accessibilité toutes les ~1 à 2 s."
  if [ "$JS_ERRORS" != 0 ]; then
    echo
    echo '```'
    head -20 play_js_errors.txt
    echo '```'
  fi
  if [ -s play_crash.txt ]; then
    echo
    echo "Tampon « crash » de l'émulateur (40 premières lignes) :"
    echo
    echo '```'
    head -40 play_crash.txt
    echo '```'
  fi
} > "$OUT"
cat "$OUT"

STATUS=0
if [ -z "$FIRST_MS" ]; then
  echo "::error::Variante play : premier écran non affiché après ${TIMEOUT_S} s"
  STATUS=1
fi
if [ "$UNCAUGHT" != 0 ] || [ "$CRASH" != 0 ]; then
  echo "::error::Variante play : ${UNCAUGHT} erreur(s) JS non interceptée(s), ${CRASH} plantage(s) natif(s) au premier lancement"
  STATUS=1
fi
adb uninstall "$PKG" >/dev/null 2>&1 || true
exit "$STATUS"
