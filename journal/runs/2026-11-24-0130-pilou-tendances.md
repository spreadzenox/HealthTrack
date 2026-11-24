# Run 24/11 01:30 — #1226 mergée, POLISH-SIM-154 (Pilou dans Tendances)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 5004896 (#1226),
release v892 encore la dernière au moment d'écrire (Build & Release de #1226 en cours) · **TestFlight** : 1268.1268
validée pour « Testeurs Halcya », 1244.1244 attachée à la version 893 ; build du soir pas encore partie à 00:40 UTC ·
**Parité** : 70 % (33/47), 2 correctifs iPhone restent (01, 27)

## État de départ
- main vert sur 25e5cdf (journal du run 23:30) : Tests et émulateur verts ; v892 publiée.
- PR de la routine ouverte : **#1226** (run 00:30, prête, à jour sur main), 18 checks verts dont « Build iOS
  (simulateur) et captures » (fini à 00:20 UTC). #51 (`cursor/*`) pas touchée.

## #1226 : mergée (squash, 5004896)
- Captures iPhone `captures/pr-1226` relues : `iphone-16e-demo-clair-ma-journee.png` (Repas, Bien-être, digestion du
  soir, habitudes : propre) et `iphone-16e-demo-clair-food.png` (Vos repas, Refaire un repas : propre). Console sans
  erreur.
- Android en local : `npm run visual -- --routes=/ma-journee,/food` sans erreur JS, captures propres ;
  `DayChecklist.test.jsx` et `MealEditor.test.jsx` verts (25 tests).
- Message de merge écrit à la main, sans ligne d'attribution.

## POLISH-SIM-154 : Pilou dans Tendances (PR à merger au run suivant)
- Reproduit : `npm run visual -- --empty --weigh-in --routes=/tendances?mesure=weight` et `--routes=/tendances`
  montrent seulement l'antenne et le front, la tête coupée au ras des yeux par la fenêtre de 34 px.
- Correctif : `.pilou-peek` passe à 48 px de haut (`app/src/companion/life/Guide.css`). La tête entière dépasse, yeux
  et bouche visibles, une main posée sur le bord de la carte ; la carte descend de 14 px. Clair et sombre relus.
  Aucun correctif iPhone ne touche `Guide.css`.
- Pas de test unitaire (géométrie seulement) : la vérification est la capture.
- Note de Nouveautés (les deux magasins), BACKLOG coché.

## Ce qui n'a pas pu être fait
- Soumission bêta de la build du soir : `ios-testflight.yml` (cron) pas encore parti à 00:40 UTC (les nuits passées :
  00:20 à 01:30 UTC). Alpha de la nuit pas encore partie non plus (02:40 à 03:10 UTC).

## Suite
1. Run suivant : captures `captures/pr-<N>` de Tendances (clair, sombre, vide) relues, puis merge si tout est vert.
2. Build du soir traitée par Apple → `ios-store-beta-submit.yml`, puis `ios-store-beta-expire.yml` ; noter l'Alpha.
3. PERSONAS-OUTIL-3 (faux relais des repas), puis la proposition « Poids » avec maquette au run « idées » de 08:00.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
