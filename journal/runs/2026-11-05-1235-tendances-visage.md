# 05/11 12:35 — Tendances : le bien-être estimé (signalement du 05/11 vers 11:45)

Type : 🚑 run de code (12:35 Paris). Priorité : signalement du propriétaire du 05/11 vers 11:45 (juste après la
livraison continue).

## Constat au démarrage
- main vert (`40ec206`, v509) ; « Play — Alpha (livraison continue) » vert sur `40ec206` et `c2c67c7` (100800 et
  suivantes envoyées sur Alpha, en examen chez Google). Aucune PR « [Auto] » ouverte, aucun autre run actif.
- Cause du signalement confirmée : `WellbeingCharts.jsx` ne lisait que `listEntries({ type: 'wellbeing' })` (notes
  à la main), jamais les rafales `face_burst`. Capture « avant » (démo) : courbe en entiers 0 à 3, notes seules, alors
  que l'Accueil affiche 2,6 estimé.

## Fait (branche `claude/auto-tendances-visage`)
- `services/mood/wellbeingHistory.js` : période `fortnight` (14 jours) dans `PERIODS`.
- `services/mood/faceMoodData.js` : `loadWellbeingTrends` (une seule lecture de la base → `wellbeingHistory` sur 14
  jours et sur aujourd'hui), même série que l'historique et la carte de l'Accueil.
- `pages/WellbeingHistory.jsx` : étiquettes d'axe pour 14 jours (une date tous les 3 jours, jusqu'à aujourd'hui),
  `ReadingDetail` exporté.
- `components/WellbeingCharts.jsx` réécrit sur `HistoryChart` : « Par jour, sur 5 (14 derniers jours) » et
  « Aujourd'hui » (lecture par lecture, ou par heure au-delà de 24) ; notes à la main en losanges ; légende ; toucher un
  point ouvre son détail (valence, éveil, expressions, lectures peu nettes). « Attendu d'après vos habitudes » :
  explication repliée « Ce que vos jours notés à la main laissent attendre pour une journée comme aujourd'hui
  (sommeil, pas…) », comparé à « votre note du jour » (l'ancien « réel » prêtait à confusion). Le point orange de
  prédiction sur la courbe est retiré (la valeur reste dans la ligne sous la courbe).
- Règle 5 inchangée : les courbes ne lisent que des entrées Y (rafales, notes) ; la prédiction reste celle du moteur.
- Journal : signalement et I220 OUI (→ VENTRE-BE-2) dans BACKLOG et PRODUIT ; décision iOS du 05/11 vers 12:00 et note
  de code partagé dans POUR-IOS.

## Vérifications
- TDD : `WellbeingCharts.test.jsx` réécrit (11 tests + 2 de cache) ; « montre les lectures du visage même sans aucune
  note » échoue sur l'ancien composant, passe sur le nouveau. `npm run test` : 3088 verts ; lint 0 erreur ; build OK.
- Captures `/tendances` relues : démo clair (courbe estimée, losanges, bloc Aujourd'hui avec fourchettes), sombre avec
  un point touché (« Dimanche 1 novembre, 2,3 / 5, 5 lectures dont 2 peu nettes »), vide (ligne « Pas encore de
  bien-être noté ni estimé » et tuiles menthe). Avant / après dans `journal/captures/tendances-visage/`.
