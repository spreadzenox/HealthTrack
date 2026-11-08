#!/usr/bin/env bash
# Télécharge la distribution Gradle du wrapper avec reprises, puis par un miroir si le serveur officiel ne répond pas
# (08/11 : services.gradle.org → GitHub en 504 et délais dépassés pendant plus d'une heure, CI de main rouge).
# L'empreinte SHA-256 (distributionSha256Sum, prise sur services.gradle.org) est vérifiée quelle que soit la source ;
# le wrapper pointe ensuite sur le fichier local. À lancer depuis app/android.
set -euo pipefail
props=gradle/wrapper/gradle-wrapper.properties
url=$(sed -n 's/^distributionUrl=//p' "$props" | sed 's#\\:#:#g')
sum=$(sed -n 's/^distributionSha256Sum=//p' "$props")
[ -n "$sum" ] || { echo "distributionSha256Sum manquant dans $props" >&2; exit 1; }
name=$(basename "$url")
out="${RUNNER_TEMP:-/tmp}/$name"
for src in "$url" "https://mirrors.cloud.tencent.com/gradle/$name"; do
  echo "Téléchargement de $name depuis $src"
  if curl -fsSL --retry 4 --retry-all-errors --retry-delay 10 --connect-timeout 20 --max-time 600 -o "$out" "$src" \
    && echo "$sum  $out" | sha256sum -c --status; then
    sed -i "s#^distributionUrl=.*#distributionUrl=file\\\\://$out#" "$props"
    echo "Gradle prêt (empreinte vérifiée) : $out"
    exit 0
  fi
  echo "Échec ou empreinte différente depuis $src" >&2
  rm -f "$out"
done
echo "Distribution Gradle introuvable" >&2
exit 1
