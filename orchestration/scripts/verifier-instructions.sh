#!/bin/bash
# Vérifie que les quatre fichiers d'instructions de la routine correspondent à l'empreinte inscrite dans le lanceur.
# À lancer à la racine du dépôt, avant d'envoyer un lanceur et après toute modification de orchestration/routine/.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 2
got=$(cat orchestration/routine/0[1-4]-*.md | sha256sum | cut -d' ' -f1)
want=$(grep -oE '^[0-9a-f]{64}$' orchestration/routine/LANCEUR.md | head -1)
echo "calculée : $got"; echo "lanceur  : $want"
[ "$got" = "$want" ] && echo "OK" || { echo "DIFFÉRENT : mettre à jour LANCEUR.md (et le lanceur envoyé aux runs)"; exit 1; }
