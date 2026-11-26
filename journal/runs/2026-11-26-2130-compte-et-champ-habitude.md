# Run 26/11 21:30 — Accueil et Ma journée comptent pareil ; champ d'habitude visible (POLISH-SIM-174, 175)

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
51c649a (#1295) vert (Tests, émulateur A56) · **TestFlight** : 1335.1335 chez « Testeurs Halcya », validée (build du
soir attendue, cron de 21:20 en retard habituel) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Run de 21:30 : run de code. Suite proposée par le run de 20:30 : POLISH-SIM-174 et 175 groupés (un seul build iPhone).

## Fait
- **POLISH-SIM-174** : l'Accueil disait « 6 bulles à faire » quand Ma journée disait « Encore 8 choses » (les repas
  comptaient pour une bulle d'un côté, pour un par repas manquant de l'autre). `CompanionHome.jsx` passe
  `list.remaining` (déjà calculé par `homeBubbles`, chaque repas manquant compte) à `bubblesLeftText`, qui dit
  maintenant « Encore N choses aujourd’hui », les mots de Ma journée. Étiquette sous Pilou et bandeau de défilement.
  Tests d'abord (rouges puis verts) : `bubbles.test.js` (texte, `remaining` avec un repas noté), `CompanionHome.test.jsx`.
- **POLISH-SIM-175** : à l'étape 4 de l'accueil, le champ « Ajouter une habitude » restait à moitié sous le bouton fixe
  « C’est parti ! ». Au toucher, il remonte (`onFocus` → `scrollIntoView({ block: 'nearest' })`, avec
  `scroll-margin-bottom` = hauteur du pied collant + 40 px). Test d'abord dans `Onboarding.test.jsx`.
- Nouveautés : `2026-11-26-2130-compte-et-champ-habitude.json` (les deux magasins).

## Vérifications
- `npm run test` : 4 722 tests verts ; `npm run lint` : 0 erreur (comme avant) ; `npm run build` vert.
- `npm run visual -- --routes=/,/ma-journee --now=14:00` : captures relues, « Pilou est tranquille · Encore 4 choses
  aujourd’hui » sous l'îlot et « Encore 4 choses aujourd’hui » dans Ma journée (Repas 0/3 + Bien-être).
- Étape 4 rejouée dans Chromium (412×780, objectif digestion, champ placé à moitié sous le bouton) : avant, le champ est
  coupé ; après le toucher, il est entier, 12 px au-dessus du bouton. Aucune erreur JS.
- PR en brouillon, puis « prête » une fois le journal fini : un seul build iPhone (CI économe).

## Suite proposée
1. Finir la PR si le build iPhone n'est pas fini à la fin du run (captures de l'Accueil et de l'accueil en 4 temps).
2. Ce soir : TestFlight du soir et Alpha de 23:45 ; soumission bêta de la build du soir au premier run qui la voit
   traitée, expiration des anciennes.
3. Restes du passage de 20:30 « À étudier » (« Jour 1 sur 7 » et « 0 sur 7 jours notés »).

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51. Réponses attendues : PROP-SIM-19, « go
courbes / go phases / non », « rituel 2D / 3D / pas de rituel ».
