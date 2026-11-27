# Run 27/11 21:30 — Nutrition : « non mesuré » (POLISH-NUTRI-ZERO)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 682c9f2 (#1315) vert
(Tests, émulateur A56) · **TestFlight** : 1362.1362 chez « Testeurs Halcya » (inchangé ; le cron du soir, 21:20, n'avait
pas encore démarré à 21:50, GitHub le lance en retard) · **Parité** : 70 % (33/47), inchangée

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). main vert. Pas de nouvelle réponse du
  propriétaire.
- iPhone : rien à soumettre ni à expirer avant la build du soir.

## Fait
POLISH-NUTRI-ZERO (relevé par « Prendre soin de soi » au passage de 20:30) : quand Ciqual ne donne une teneur pour aucun
aliment mangé de la semaine, Données › Nutrition écrivait « Oméga-3 partiel · ≥ 0 g/j ».
- `nutritionIntakeCompare.js` : une ligne à 0 dont la teneur est inconnue pour au moins 10 % du poids mangé est
  `unmeasured` (statut `unmeasured`) ; elle sort de la légende, du compte « N repères atteints sur M » et du compte qui
  déclenche la note « partiel » du pied de page.
- `Nutrition.jsx` : « non mesuré · obj. 2 g », barre vide, sans étiquette « partiel » ; lecteur d'écran : « Oméga-3 :
  non mesuré dans vos aliments ».
- Tests d'abord (service et page, rouges puis verts). Nouveautés : `2026-11-27-2130-nutrition-non-mesure.json`.

## Vérifications
- `npm run test` : 4 744 tests verts (44 ignorés, comme avant) ; `npm run lint` : 0 erreur avant et après ;
  `npm run build` vert ; `npm run visual` complet vert (toutes les pages, aucune erreur JS).
- Captures `--routes=/nutrition --history-days=2`, clair et sombre, relues : « Oméga-3 · non mesuré · obj. 2 g »,
  barre vide ; les autres lignes inchangées (Folates gardent « partiel · ≥ 52 µg/j »).
- iPhone : code partagé seulement, aucun correctif à refaire ; build iOS au passage de la PR en « prête ».

## Suite proposée
1. Run suivant : un autre petit correctif ajouté à cette PR, puis passage en « prête » (un seul build iPhone) ;
   captures iPhone de Nutrition à regarder.
2. Ce soir : build iPhone et TestFlight (cron de 21:20 en retard), Alpha à 23:45 ; soumission bêta de la build du soir
   au premier run qui la voit traitée, expiration des anciennes.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E.
