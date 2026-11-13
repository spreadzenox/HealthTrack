#!/usr/bin/env bash
# Lecture du visage sur iPhone (I7) : les 3 modèles du Face Landmarker de MediaPipe (Apache-2.0), mêmes fichiers et
# mêmes empreintes SHA-256 que la build Android (lues dans upstream/app/android/app/face-models.gradle, préparé par
# scripts/upstream.sh), et TensorFlow Lite C (Apache-2.0) pour les faire tourner, comme LiteRT sur Android.
# Téléchargés puis vérifiés, jamais versionnés (ignorés par git) : les modèles dans
# ios/HalcyaFaceModels/Sources/HalcyaFaceModels/Models/ (embarqués dans l'app par le paquet), le moteur dans
# ios/HalcyaFaceModels/Vendor/. Recopiés dans upstream/app/ios/, où l'app se construit, s'il existe.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GRADLE="$ROOT/upstream/app/android/app/face-models.gradle"
PKG="$ROOT/ios/HalcyaFaceModels"
DEST="$PKG/Vendor"
MODELS="$PKG/Sources/HalcyaFaceModels/Models"
# TensorFlow Lite C 2.17.0, l'archive du pod CocoaPods TensorFlowLiteC (dernière publiée) ; empreinte relevée en CI le
# 28/10/2026 (run 40769499312), figée ici : une archive différente arrête le script
TFLITE_URL="https://dl.google.com/tflite-release/ios/prod/tensorflow/lite/release/ios/release/32/20240729-115310/TensorFlowLiteC/2.17.0/0c10b3543e01f547/TensorFlowLiteC-2.17.0.tar.gz"
TFLITE_SHA256="9667b476015f136e5b332ce040e12822c4ac6d5c58947882ddc809cdff0fb99e"

sha() { shasum -a 256 "$1" | cut -d' ' -f1; }
fetch() { curl -fsSL --retry 3 --retry-delay 2 -o "$2" "$1"; }

[ -f "$GRADLE" ] || { echo "face-models.sh : $GRADLE absent, lancer d'abord scripts/upstream.sh" >&2; exit 1; }
TASK_URL="$(sed -n "s/^def faceTaskUrl = '\(.*\)'$/\1/p" "$GRADLE")"
TASK_SHA="$(sed -n "s/^def faceTaskSha256 = '\([0-9a-f]*\)'$/\1/p" "$GRADLE")"
LIST="$(sed -n "s/^ *'\(face_[a-z_]*\.tflite\)' *: *'\([0-9a-f]*\)',*$/\1 \2/p" "$GRADLE")"
[ -n "$TASK_URL" ] && [ -n "$TASK_SHA" ] && [ "$(echo "$LIST" | wc -l | tr -d ' ')" = 3 ] \
  || { echo "face-models.sh : URL ou empreintes introuvables dans $GRADLE" >&2; exit 1; }

mkdir -p "$DEST" "$MODELS"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ok=1
while read -r name sum; do [ -f "$MODELS/$name" ] && [ "$(sha "$MODELS/$name")" = "$sum" ] || ok=0; done <<< "$LIST"
if [ "$ok" = 0 ]; then
  fetch "$TASK_URL" "$TMP/face_landmarker.task"
  [ "$(sha "$TMP/face_landmarker.task")" = "$TASK_SHA" ] || { echo "face-models.sh : empreinte du .task inattendue" >&2; exit 1; }
  unzip -q -o "$TMP/face_landmarker.task" -d "$TMP/task"
  while read -r name sum; do
    [ "$(sha "$TMP/task/$name")" = "$sum" ] || { echo "face-models.sh : empreinte de $name inattendue" >&2; exit 1; }
    cp "$TMP/task/$name" "$MODELS/$name"
  done <<< "$LIST"
fi
echo "Modèles du visage : 3 fichiers vérifiés (empreintes d'Android)"

if [ ! -d "$DEST/TensorFlowLiteC.xcframework" ]; then
  fetch "$TFLITE_URL" "$TMP/tflite.tar.gz"
  got="$(sha "$TMP/tflite.tar.gz")"
  if [ "$got" != "$TFLITE_SHA256" ]; then
    echo "face-models.sh : empreinte de TensorFlow Lite C inattendue ($got)" >&2
    exit 1
  fi
  tar -xzf "$TMP/tflite.tar.gz" -C "$TMP"
  SRC="$(find "$TMP" -type d -name TensorFlowLiteC.xcframework | head -1)"
  # Le pod livre des frameworks statiques sans Info.plist : en binaryTarget, Xcode les embarquerait dans l'app (refusé).
  # On en fait un .xcframework de bibliothèques statiques (même code, mêmes en-têtes), lié sans être embarqué.
  ARGS=()
  for slice in "$SRC"/*/; do
    fw="${slice%/}/TensorFlowLiteC.framework"
    [ -d "$fw" ] || continue
    name="$(basename "${slice%/}")"
    echo "TensorFlow Lite C, $name : $(file -b "$fw/TensorFlowLiteC" | cut -c1-60)"
    inc="$TMP/lib/$name/include"
    mkdir -p "$inc/TensorFlowLiteC"
    cp "$fw"/Headers/*.h "$inc/TensorFlowLiteC/"
    umbrella="$(sed -n 's/.*umbrella header "\(.*\)".*/\1/p' "$fw/Modules/module.modulemap" 2>/dev/null | head -1)"
    if [ -z "$umbrella" ]; then
      umbrella="TensorFlowLiteC-all.h"
      (cd "$inc/TensorFlowLiteC" && for h in *.h; do echo "#include \"$h\""; done) > "$TMP/all.h"
      mv "$TMP/all.h" "$inc/TensorFlowLiteC/$umbrella"
    fi
    printf 'module TensorFlowLiteC {\n  umbrella header "TensorFlowLiteC/%s"\n  export *\n  link "c++"\n}\n' "$umbrella" > "$inc/module.modulemap"
    cp "$fw/TensorFlowLiteC" "$TMP/lib/$name/libTensorFlowLiteC.a"
    ARGS+=(-library "$TMP/lib/$name/libTensorFlowLiteC.a" -headers "$inc")
  done
  [ "${#ARGS[@]}" -gt 0 ] || { echo "face-models.sh : aucun framework dans l'archive de TensorFlow Lite C" >&2; exit 1; }
  xcodebuild -create-xcframework "${ARGS[@]}" -output "$DEST/TensorFlowLiteC.xcframework" > /dev/null
fi
echo "TensorFlow Lite C : $(ls "$DEST/TensorFlowLiteC.xcframework" | tr '\n' ' ')"

# L'app se construit dans upstream/app/ios (copie de ios/ par scripts/upstream.sh) : y recopier ce qui est vérifié
if [ -d "$ROOT/upstream/app/ios/HalcyaFaceModels" ]; then
  mkdir -p "$ROOT/upstream/app/ios/HalcyaFaceModels/Sources/HalcyaFaceModels"
  rm -rf "$ROOT/upstream/app/ios/HalcyaFaceModels/Vendor" "$ROOT/upstream/app/ios/HalcyaFaceModels/Sources/HalcyaFaceModels/Models"
  cp -R "$DEST" "$ROOT/upstream/app/ios/HalcyaFaceModels/Vendor"
  cp -R "$MODELS" "$ROOT/upstream/app/ios/HalcyaFaceModels/Sources/HalcyaFaceModels/Models"
fi
