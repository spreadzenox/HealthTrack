#!/bin/bash
# Contrôles de l'orchestrateur après chaque lancement de run. Lecture seule : ne modifie aucun dépôt.
# Usage : controle-horaire.sh <clone de HealthTrack> [<clone de HealthTrack-iOS>]
# État local (hors dépôt) : $ORCH_STATE, par défaut ~/.halcya-orchestration.
set -u
HT=${1:?clone de HealthTrack}; IOS=${2:-}; ST=${ORCH_STATE:-$HOME/.halcya-orchestration}; mkdir -p "$ST"
cd "$HT" && git fetch -q origin || exit 1
echo "== main"; git log --oneline -3 origin/main; echo "commits : $(git rev-list --count origin/main)"
echo "== instructions de la routine"
got=$(for f in $(git ls-tree -r --name-only origin/main orchestration/routine/ | grep -E '/0[1-4]-.*\.md$' | sort); do git show "origin/main:$f"; done | sha256sum | cut -d' ' -f1)
want=$(git show origin/main:orchestration/routine/LANCEUR.md | grep -oE '^[0-9a-f]{64}$' | head -1)
[ "$got" = "$want" ] && echo "empreinte OK" || echo "EMPREINTE DIFFÉRENTE : $got (lanceur : $want)"
echo "== tête du résumé de la semaine"; git show origin/main:journal/README.md | sed -n 10,16p | cut -c1-400
echo "== signal « P48 maintenant » (déclaration Health Connect « Règles »)"
git show origin/main:journal/README.md | grep -n "P48 maintenant" | grep -v "pas encore" | head -3
git show origin/main:journal/PRODUIT.md | grep -n "^| P48" | cut -c1-160
if [ -n "$IOS" ]; then
  echo "== boîte iPhone (journal/POUR-ORCHESTRATEUR.md de HealthTrack-iOS)"
  cd "$IOS" && git fetch -q origin '+refs/heads/*:refs/remotes/origin/*' || exit 1
  echo "main : $(git log -1 --format='%h %ci %s' origin/main)"
  # Les messages peuvent rester sur la branche de travail de la routine iOS tant que sa PR n'est pas mergée.
  BR=$(git branch -r --sort=-committerdate | grep -E 'origin/claude/' | head -1 | tr -d ' ')
  F=journal/POUR-ORCHESTRATEUR.md
  TXT=$( { git show "origin/main:$F" 2>/dev/null; [ -n "$BR" ] && git show "$BR:$F" 2>/dev/null; } | grep -E '^\| [0-9]{2}/[0-9]{2}' | sort -u -r -k2,3 )
  NEW=$(echo "$TXT" | sha1sum | cut -d' ' -f1); OLD=$(cat "$ST/ios_inbox.state" 2>/dev/null)
  if [ "$NEW" = "$OLD" ]; then echo "rien de nouveau"; else echo "NOUVEAU :"; echo "$TXT" | head -3 | cut -c1-700; echo "$NEW" > "$ST/ios_inbox.state"; fi
fi
