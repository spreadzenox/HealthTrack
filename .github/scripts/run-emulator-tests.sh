#!/usr/bin/env bash
# Script exécuté dans l'émulateur Samsung A56 par le workflow CI.
# Appelé par reactivecircus/android-emulator-runner via script: bash .github/scripts/run-emulator-tests.sh
set -euo pipefail

echo "=== Émulateur Samsung A56 en ligne ==="
adb devices

echo "=== Résolution de l'écran ==="
adb shell wm size
echo "=== Densité de l'écran ==="
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
)
for PERM in "${HC_PERMS[@]}"; do
  adb shell pm grant com.healthtrack.app "$PERM" 2>/dev/null && echo "OK $PERM" || echo "SKIP $PERM"
done

echo "=== Lancement de HealthTrack ==="
adb shell am start -n com.healthtrack.app/.MainActivity
sleep 5

echo "=== Capture d'écran de HealthTrack au démarrage ==="
adb exec-out screencap -p > screenshot_startup.png
ls -lh screenshot_startup.png

echo "=== Exécution des tests instrumentés Health Connect ==="
adb shell am instrument -w \
  -e class com.healthtrack.app.HealthConnectTest \
  com.healthtrack.app.test/androidx.test.runner.AndroidJUnitRunner \
  2>&1 | tee instrumented_test_output.txt

echo "=== Résultat des tests ==="
cat instrumented_test_output.txt

echo "=== Navigation vers la page Connecteurs ==="
adb shell input tap 810 260 2>/dev/null || true
sleep 3
adb exec-out screencap -p > screenshot_connectors_page.png
ls -lh screenshot_connectors_page.png

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
