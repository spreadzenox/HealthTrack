# Run 26/11 17:30 — Repas : le détail FODMAP en mots simples (POLISH-SIM-172)

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
35a7524 (#1291) vert (Tests, Build & Release, Play — AAB, émulateur A56) · **TestFlight** : 1335.1335 chez « Testeurs
Halcya », validée (inchangé ; build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Run de 17:30 : run de code. La copie locale de `main` du conteneur avait un historique sans rapport avec
  origin/main : travail parti de origin/main en tête détachée, branche `auto/repas-fodmap-mots-simples`.

## Choix de l'étape
« À étudier » du passage du 25/11 20:30 (« Ventre, sans technique », capture `repas-fodmap-jargon.png`) : « Riche en
fructanes », « 2,3 à 6,6 g selon les mesures publiées, pour un repère de 0,3 g par repas » ; la persona « voulait
juste savoir si c'est grave ou pas ».

## Fait
- `components/MealFodmapLine.jsx` : sous chaque groupe déplié, une phrase au lieu des grammes : « Bien plus que ce
  qui gêne certaines personnes. » (au moins 3 fois le repère au bas de la fourchette), « Un peu plus … », ou
  « Peut-être plus … : les mesures varient. » (bas de la fourchette sous le repère) / « … : teneur mal connue. »
  (confiance basse). La note finit par « d'autres très bien : vos repas et votre confort digestif diront ce qu'il en
  est pour vous. » (règle 6, sans mot de diagnostic). Les grammes (« Fructanes : 1,4 à 4,4 g selon les mesures,
  repère 0,3 g. ») passent sur la ligne des sources, en petit, devant « Repères de départ : Varney 2017. Teneurs : … ».
- Tests d'abord, rouges puis verts : `MealFodmapLine.test.jsx` (5 tests changés ou ajoutés : « Un peu », « Bien »,
  « Peut-être », grammes sur la ligne des sources, aucun chiffre dans la liste).
- Nouveautés : `2026-11-26-1730-repas-fodmap-mots-simples.json` (les deux magasins).

## Vérifications
- `npm run test` : 4 718 verts ; `npm run lint` : 0 erreur ; `npm run build` vert.
- Outil des personas (jour 14, téléphone seul, objectif digestion), Ma journée › Repas › Décrire le repas, « pâtes
  à la sauce oignon et un yaourt », Détails : [`capture`](captures/2026-11-26-1730-repas-fodmap-mots-simples.png)
  (lactose « Bien plus », fructanes « Un peu plus », note puis grammes en petit). Thème sombre pas recapturé : aucune
  règle CSS changée, seuls les textes.
- PR en brouillon puis prête : un build iPhone (code embarqué changé), captures de l'iPhone à regarder avant merge.

## Suite proposée
1. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta au premier run qui voit la build.
2. Dernier « À étudier » du 25/11 : ordre de grandeur des exemples du 28e jour (« Fructanes −3,5 pt », « GOS +1,8 pt »).
3. FUSION-4 : mission d'archivage de l'ancien dépôt quand ses builds TestFlight sont expirées.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, envoyer le message E.
