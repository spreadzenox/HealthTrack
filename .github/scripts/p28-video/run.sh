#!/usr/bin/env bash
# P28 : installe l'APK d'aperçu, filme (drive.mjs), puis extrait des images de contrôle de la vidéo.
# Appelé par .github/workflows/p28-video.yml dans android-emulator-runner (émulateur démarré).
set -uo pipefail

adb wait-for-device
adb shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 1; done'
adb shell settings put global window_animation_scale 0.5
adb shell settings put global transition_animation_scale 0.5
adb shell settings put global animator_duration_scale 0.5
# Écran de verrouillage par balayage (sans code), qui envoie ACTION_USER_PRESENT au déverrouillage
adb shell locksettings set-disabled false >/dev/null 2>&1 || true
adb shell settings put system screen_off_timeout 600000
# Galaxy A56 : 1080 × 2340 à 385 ppi (le skin de l'émulateur fixe la taille, pas la densité : sans elle, mise en page
# de tablette). Puis on laisse le lanceur finir de démarrer et on ferme une éventuelle boîte « ne répond pas ».
adb shell wm size 1080x2340
adb shell wm density 385
sleep 20
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null 2>&1 || true
# -g accorde caméra et notifications à l'installation : le plan 4 (« si Android le demande ») est sauté. Essai du
# 26/10 : la boîte d'Android de l'émulateur n'était pas touchée de façon fiable, et sans notification les plans 5 et 8
# ne se filment pas.
adb install -r -g apercu.apk

node .github/scripts/p28-video/drive.mjs
STATUS=$?
adb logcat -d > p28-logcat.txt 2>/dev/null || true

if [ -f p28-video.mp4 ]; then
  mkdir -p frames
  ffmpeg -loglevel error -i p28-video.mp4 -vf "fps=1/3" frames/f_%03d.png || true
  # Planche de contrôle : une image toutes les 4 s, 6 par ligne
  ffmpeg -loglevel error -i p28-video.mp4 -vf "fps=1/4,scale=240:-1,tile=6x4" -frames:v 1 p28-planche.png || true
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 p28-video.mp4 2>/dev/null || echo "?")
  echo "Durée de la vidéo : ${DUR} s ($(du -h p28-video.mp4 | cut -f1))" | tee -a p28-video.md
  [ -n "${GITHUB_STEP_SUMMARY:-}" ] && echo "Durée de la vidéo : ${DUR} s" >> "$GITHUB_STEP_SUMMARY"
else
  echo "::error::Aucune vidéo produite"
  STATUS=1
fi
exit $STATUS
