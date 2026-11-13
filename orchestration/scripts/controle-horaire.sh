#!/bin/bash
# Contrôles de l'orchestrateur après chaque lancement de run. Lecture seule : ne modifie aucun dépôt.
# Usage : controle-horaire.sh <clone de HealthTrack>
# État local (hors dépôt) : $ORCH_STATE, par défaut ~/.halcya-orchestration.
set -u
HT=${1:?clone de HealthTrack}; ST=${ORCH_STATE:-$HOME/.halcya-orchestration}; mkdir -p "$ST"
cd "$HT" && git fetch -q origin || exit 1
echo "== main"; git log --oneline -3 origin/main
if [ "$(git rev-parse --is-shallow-repository)" = true ]; then echo "commits : clone superficiel, compte non fiable"
else echo "commits : $(git rev-list --count origin/main)"; fi
echo "== instructions de la routine"
got=$(for f in $(git ls-tree -r --name-only origin/main orchestration/routine/ | grep -E '/0[1-4]-.*\.md$' | sort); do git show "origin/main:$f"; done | sha256sum | cut -d' ' -f1)
want=$(git show origin/main:orchestration/routine/LANCEUR.md | grep -oE '^[0-9a-f]{64}$' | head -1)
[ "$got" = "$want" ] && echo "empreinte OK" || echo "EMPREINTE DIFFÉRENTE : $got (lanceur : $want)"
echo "== tête du résumé de la semaine"; git show origin/main:journal/README.md | sed -n 10,16p | cut -c1-400
echo "== signal « P48 maintenant » (déclaration Health Connect « Règles »)"
# Le signal est dans la tête du résumé ; les phrases qui l'annoncent seulement (« je vous dirai « P48 maintenant » »,
# « pas encore ») ne comptent pas, même coupées par un retour à la ligne : la tête est relue d'un seul tenant.
git show origin/main:journal/README.md | sed -n 1,60p | sed 's/^> \{0,1\}//' | tr '\n' ' ' \
  | grep -oE '.{0,90}P48 maintenant.{0,60}' | grep -v -e "pas encore" -e "dirai" | head -3
git show origin/main:journal/PRODUIT.md | grep -n "^| P48" | cut -c1-160
echo "== iPhone (dossier iphone/, depuis la fusion du 13/11)"
# L'ancien dépôt HealthTrack-iOS n'est plus lu : un second argument est accepté pour ne pas casser un appel, et ignoré.
git show origin/main:iphone/fusion/bascule.json 2>/dev/null | grep -o '"publication": *[a-z]*' || echo "iphone/ absent de main"
git show origin/main:iphone/upstream.json 2>/dev/null | grep -E '"(commit|versionCode)"' | tr -d ' \n'; echo
git show origin/main:iphone/journal/README.md 2>/dev/null | sed -n 1,40p | grep -m1 -n "TestFlight" | cut -c1-300
