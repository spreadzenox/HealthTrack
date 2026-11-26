# Run 26/11 01:30 — Notes de digestion gardées (POLISH-SIM-76 et 93)

**Type** : 🔧 (code produit, polish) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main 69f7baa vert (Tests, émulateur A56, Play — AAB, Build & Release) · **TestFlight** : 1313.1313 chez
« Testeurs Halcya » ; build du soir du 25/11 (cron 21:20) et Alpha de 23:45 pas encore partis à 00:35 UTC (retard
habituel du cron : la veille, 03:33 et 05:02 UTC) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas à la routine). Pas de réponse du propriétaire.

## Fait
- **POLISH-SIM-76 et 93** (personas « Tout mesurer » et « Sportif », J45) : avec un autre objectif que la digestion,
  les jours de digestion déjà notés n'avaient plus de place visible dans Objectifs, ni de chemin pour les retrouver
  (règle de la refonte : rien de caché sans autre maison). Objectifs affiche sous les cartes, en texte discret :
  « Vos notes de digestion (N jours) sont gardées. Pour les retrouver : Réglages › Paramètres › Vos objectifs. »
  N vient de `notedDays(states, 'digestion')` (`services/objectivesOverview.js`, calcul déjà fait pour les cartes).
  Rien sans jour noté. La migration de l'étape 5a ne change pas.
- Le bandeau « Le suivi digestif est masqué » de Confort digestif renvoyait à « Ce qui vous amène », nom d'un réglage
  remplacé par « Vos objectifs » à l'étape 5a : corrigé, avec un test.
- Tri du BACKLOG : **POLISH-SIM-71b**, **83** et **96** soldées sans objet (Journal jour par jour et objectif sport
  retirés par la refonte).
- Tests d'abord (3 rouges, puis verts). `npm run test` : 4 702 verts (44 sautés, comme avant) ; ESLint propre sur les
  fichiers touchés ; `npm run build` vert ; `npm run visual -- --routes=/recommendations` sans erreur, capture
  relue (ligne sous la carte Bien-être, « 9 jours » sur la démo).
- Note de Nouveautés `2026-11-26-0130-notes-digestion-gardees.json` (code partagé : vaut pour les deux magasins).

## Suite proposée
1. Merger la PR au run suivant si les checks (dont le build iPhone) sont verts ; captures d'Objectifs sur iPhone.
2. Vérifier le build du soir, TestFlight et l'Alpha ; soumission bêta et expiration au premier run qui voit la build
   traitée par Apple.
3. Reste « à vérifier » des personas : POLISH-SIM-80 (note de bien-être qui bouge sans saisie).

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
