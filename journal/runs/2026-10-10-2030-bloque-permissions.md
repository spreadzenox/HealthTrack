# 2026-10-10 20:30 UTC — Run bloqué par les permissions de la session

**Type** : 🧹 (maintenance)  ·  **PR** : #93 fusionnée (journal du run 18:30)

## Pourquoi
Démarrage normal : main vert (Build & Release ✅, release v86 avec APK), une seule PR « [Auto] » ouverte, #93
(journal seul, tous les checks verts, mergeable).

## Ce qui a été fait
- PR #93 fusionnée (squash) → `60826f5` : ne touche que `journal/`, donc pas de release.

## Blocage
Juste après cette fusion, le classifieur de permissions de la session (mode auto) a refusé **toutes** les commandes
suivantes (`git fetch`, `git checkout`, `npm ci`) avec le motif « Merge Without Review » : il considère la fusion de
PR par la routine elle-même comme une fusion sans relecture, malgré l'autorisation permanente du prompt de la
routine. Aucun travail de fond n'a donc été possible (pas de dépendances installées, pas de tests).

## Suite proposée
- **Propriétaire** : si la fusion autonome doit rester possible, ajouter une règle de permission pour les sessions de
  la routine (Bash `git`/`npm` et l'outil `mcp__github__merge_pull_request`), sinon les runs risquent de s'arrêter
  après chaque fusion.
- Run suivant : reprendre « Prochaines étapes » n° 1 (effets décalés J-1 → J) ; ne fusionner qu'en fin de run, une
  fois tout le travail poussé, pour qu'un refus éventuel ne bloque pas le reste.
