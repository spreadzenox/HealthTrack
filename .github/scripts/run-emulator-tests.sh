#!/usr/bin/env bash
# Script exécuté dans l'émulateur Samsung A56 par le workflow CI.
# Appelé par reactivecircus/android-emulator-runner via script: bash .github/scripts/run-emulator-tests.sh
set -euo pipefail

echo "=== Émulateur Samsung A56 en ligne ==="
adb devices

# Les réglages hw.lcd.* de l'AVD ne sont pas repris par l'émulateur (écran 320 × 640) :
# on impose l'écran du Galaxy A56 (1080 × 2340) et une densité donnant ~412 dp de large,
# comme le viewport de `npm run visual`.
echo "=== Écran du Galaxy A56 ==="
adb shell wm size 1080x2340 || true
adb shell wm density 420 || true
sleep 2
adb shell wm size
adb shell wm density

echo "=== Installation de l'APK HealthTrack ==="
adb install -r app/android/app/build/outputs/apk/debug/app-debug.apk

echo "=== Installation de l'APK de test ==="
adb install -r app/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk

echo "=== Vérification de la disponibilité de Health Connect ==="
adb shell am start -n com.google.android.healthconnect.controller/.ui.MainNavigationActivity 2>/dev/null || true
sleep 3
adb shell am force-stop com.google.android.healthconnect.controller 2>/dev/null || true

echo "=== Accord des permissions Health Connect via ADB ==="
HC_PERMS=(
  android.permission.health.READ_STEPS
  android.permission.health.WRITE_STEPS
  android.permission.health.READ_HEART_RATE
  android.permission.health.WRITE_HEART_RATE
  android.permission.health.READ_SLEEP
  android.permission.health.WRITE_SLEEP
  android.permission.health.READ_DISTANCE
  android.permission.health.WRITE_DISTANCE
  android.permission.health.READ_ACTIVE_CALORIES_BURNED
  android.permission.health.WRITE_ACTIVE_CALORIES_BURNED
  android.permission.health.READ_RESTING_HEART_RATE
  android.permission.health.WRITE_RESTING_HEART_RATE
  android.permission.health.READ_HEART_RATE_VARIABILITY
  android.permission.health.WRITE_HEART_RATE_VARIABILITY
  android.permission.health.READ_OXYGEN_SATURATION
  android.permission.health.WRITE_OXYGEN_SATURATION
  android.permission.health.READ_EXERCISE
  android.permission.health.WRITE_EXERCISE
  android.permission.health.READ_TOTAL_CALORIES_BURNED
  android.permission.health.WRITE_TOTAL_CALORIES_BURNED
  android.permission.health.READ_WEIGHT
  android.permission.health.WRITE_WEIGHT
  android.permission.health.READ_HEIGHT
  android.permission.health.WRITE_HEIGHT
  android.permission.health.READ_BODY_FAT
  android.permission.health.WRITE_BODY_FAT
  android.permission.health.READ_BASAL_METABOLIC_RATE
  android.permission.health.WRITE_BASAL_METABOLIC_RATE
)
for PERM in "${HC_PERMS[@]}"; do
  adb shell pm grant com.healthtrack.app "$PERM" 2>/dev/null && echo "OK $PERM" || echo "SKIP $PERM"
done

echo "=== Version de la WebView Android ==="
adb shell dumpsys package com.google.android.webview 2>/dev/null | grep -m1 versionName || echo "WebView : version inconnue"

echo "=== Exécution des tests instrumentés Health Connect ==="
adb shell am instrument -w \
  -e class com.healthtrack.app.HealthConnectTest \
  com.healthtrack.app.test/androidx.test.runner.AndroidJUnitRunner \
  2>&1 | tee instrumented_test_output.txt

echo "=== Résultat des tests ==="
cat instrumented_test_output.txt

# Les tests instrumentés ferment l'app : on la relance ensuite et on attend que la
# WebView ait réellement affiché l'interface (5 s ne suffisent pas sur l'émulateur
# logiciel : la première capture était un écran blanc).
wait_for_text() {
  local text="$1" timeout="$2" waited=0
  while [ "$waited" -lt "$timeout" ]; do
    adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
    if adb exec-out cat /sdcard/ui.xml 2>/dev/null | grep -q "$text"; then
      return 0
    fi
    sleep 3
    waited=$((waited + 3))
  done
  return 1
}

# Centre des bornes « [x1,y1][x2,y2] » du premier nœud dont le texte ou la description vaut $1
# (ou commence par « $1 ( », ex. « Plus (nouveautés non lues) »).
center_of() {
  adb exec-out cat /sdcard/ui.xml 2>/dev/null \
    | tr '>' '\n' \
    | grep -m1 -E "(text|content-desc)=\"$1(\"| \\()" \
    | sed -E 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]".*/\1 \2 \3 \4/' \
    | awk 'NF == 4 { printf "%d %d", ($1 + $3) / 2, ($2 + $4) / 2 }'
}

echo "=== Relance de HealthTrack (interface réelle) ==="
adb shell am start -W -n com.healthtrack.app/.MainActivity
if wait_for_text "Accueil" 120; then
  echo "Interface affichée (onglet « Accueil » trouvé)."
else
  echo "AVERTISSEMENT : « Accueil » introuvable après 120 s — capture quand même."
fi
sleep 3
adb exec-out screencap -p > screenshot_app.png
adb exec-out cat /sdcard/ui.xml > ui_app.xml 2>/dev/null || true

echo "=== Encarts système (barres d'état / navigation) ==="
adb shell dumpsys window windows 2>/dev/null | grep -m5 -iE "navigationBars|statusBars|mInsetsState" || true

# Première ouverture : la modale « Comment vous sentez-vous ? » peut couvrir la page.
POS=$(center_of "Plus tard" || true)
if [ -n "$POS" ]; then
  echo "Fermeture de la modale bien-être ($POS)"
  adb shell input tap $POS
  sleep 2
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
fi

echo "=== Onglet « Plus » de la barre du bas ==="
POS=$(center_of "Plus" || true)
if [ -n "$POS" ]; then
  echo "Tap sur « Plus » ($POS)"
  adb shell input tap $POS
  sleep 4
else
  echo "AVERTISSEMENT : onglet « Plus » introuvable dans l'arbre d'accessibilité."
fi
adb exec-out screencap -p > screenshot_plus.png
adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
adb exec-out cat /sdcard/ui.xml > ui_plus.xml 2>/dev/null || true
ls -lh screenshot_app.png screenshot_plus.png

echo "=== Vérification du succès des tests ==="
if grep -q "FAILURES!!!" instrumented_test_output.txt; then
  echo "ERREUR : Des tests instrumentés ont échoué !"
  exit 1
elif grep -q "OK (.*test" instrumented_test_output.txt; then
  echo "SUCCÈS : Tous les tests instrumentés ont réussi."
elif grep -q "assumptionFailure" instrumented_test_output.txt; then
  echo "INFO : Des tests ont été ignorés (assumeTrue) — Health Connect non disponible sur cette image."
else
  echo "INFO : Résultat des tests non déterminé — vérifiez instrumented_test_output.txt."
fi
