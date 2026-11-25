# Run 25/11 12:30 — la lanterne du matin

**Type** : 🔧 (code) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 205cf05 vert,
release **v917** · **TestFlight** : 1313.1313 chez « Testeurs Halcya », en examen bêta depuis le 25/11 04:31 UTC ·
**Parité** : 70 % (33/47), inchangée

## État de départ
- #1260 (POLISH-NOTE-LOSANGE) déjà mergée par le run de 11:30 (205cf05) : Build & Release (release v917), Play — AAB,
  Tests et émulateur A56 verts. Aucune PR de la routine ouverte (#51 est `cursor/*`, pas à la routine).
- Restes « À étudier » : tous attendent le propriétaire (courbes de la montre, poids) ou un run « idées »
  (METHODE-ECHELLE-VENTRE). FUSION-3 étape 3 attend une question à l'orchestrateur. Pris : **LANT-3**, reste de la
  refonte (découpage du 17/11, `journal/maquettes/compagnon/DECOUPAGE-RITUEL-LANTERNES.md`).

## Fait
**LANT-3 — la lanterne du matin** : pendant un essai, à l'ouverture de l'Accueil le matin qui suit un jour « avec »
tenu, la lanterne de l'îlot (cadeau du 2ᵉ jour) vacille, monte, tient puis s'éteint (2,6 s), Pilou la regarde et fait
un petit saut. Une fois par jour.
- `services/trials.js` : `morningLantern(rows, { summaries, now })` (hier jour « avec » tenu d'après les données ou
  la réponse « c'était tenu ? » ; essai retiré exclu ; le dernier jour d'un essai qui vient de finir compte).
- `companion/bubbles/morningLantern.js` : résumés des jours tirés des saisies que l'Accueil a déjà lues (même calcul
  qu'Agir, habitudes comprises), clé du jour `halcya.lantern.morningSeen`. Aucune lecture de plus.
- `pages/Dashboard.jsx` : émet `gift:lantern-lit` (`{ date, at }`), ajouté au bus et à `CONTRAT.md`.
- `scene/gifts.js` : `lanternMorning(ms)` (vacille 120 ms, monte en 400 ms, s'éteint à 2,6 s ; fondu de 300 ms en
  mouvements réduits), `lightLantern(t)`, `lanternSpot()`. `CompanionScene.jsx` : la scène allume, Pilou regarde et
  saute (pas s'il dort), seulement si l'événement a moins de 20 s ; rien sans lanterne.
- Note de Nouveautés `2026-11-25-1230-lanterne-du-matin.json` (code commun, les deux magasins).

## Vérifications
- Tests d'abord pour `morningLantern`, `lanternMorning` et `lightLantern` (rouges, puis verts) ; puis
  `morningLantern.test.js` et `Dashboard.test.jsx` (l'Accueil émet une fois, pas au second affichage du jour).
- `npm run test` : 4 682 tests verts ; `npm run build` vert ; `npm run lint` : aucune erreur.
- `npm run visual -- --play --routes=/ --trial=8 --trial-factor=habit --now=08:30` : Accueil relu, aucune erreur JS.
- Sonde Playwright locale (scratchpad, essai tenu hier, cadeaux de la semaine reçus) : l'événement part et la clé du
  jour est posée, mais la scène passe en palier « bas » (image fixe, rendu logiciel trop lent) : **l'allumage n'a pas
  pu être filmé ici**. La courbe et l'objet sont couverts par les tests ; à voir sur un vrai téléphone.
- iPhone : code partagé, aucun correctif touché ; build iPhone de la PR une fois passée en « prête ».

## Suite proposée
1. Run suivant : merge de la PR si le build iPhone et l'émulateur sont verts (console du simulateur relue).
2. LANT-4 : la question 2D / 3D du rituel du soir au propriétaire (proposition : 2D dans une feuille) ; WIDGET-POSES.
3. Build iPhone et TestFlight du soir, puis soumission bêta au premier run qui voit la build traitée.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51. Réponses attendues : « go courbes », « go
phases » ou « non » (maquette du 19/11) ; PROP-SIM-19 (poids).
