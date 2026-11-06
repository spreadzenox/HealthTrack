# 06/11 23:35 — Accueil : petites retouches du testeur iPhone (TESTEUR-1a)

Type : 🎨 run de code (retours du premier testeur iPhone du 06/11, point (1)).

## Constat au démarrage
- main `9067716` (#763) vert (Tests, Build & Release, Play — AAB, émulateurs, livraison continue Alpha).
- PR #764 (run de 22:35) : 11 checks verts, sans conflit, base = main, merge refusé à ce run-là par les permissions.
  **Mergée par ce run** (squash, `7debbb9`) avant de commencer.

## Fait (TESTEUR-1a)
- `headerLine()` renvoie `{ date, hello }` : la date courte et « Bonjour » sur deux lignes (`.today-hello`), plus de « · ».
- `MeasureTiles` : sans aucune mesure du jour, plus rien (ni tuiles « — », ni « Pas et nuits peuvent venir de votre
  téléphone ; une montre ajoute le cœur · Ajouter une source ») ; CSS mort retiré.
- Carte du compte à rebours (Accueil et Analyses) : « Vos (pistes →) analyses [du ventre | du bien-être] arrivent dans
  N jours » ; retirés de la carte partagée : « (6 dernières semaines) » et « Avec moins de jours, les résultats seraient
  surtout dus au hasard » (avance une partie de TESTEUR-3a ; la phrase reste dans le texte propre à l'onglet Analyses,
  `Recommendations.jsx`, pour TESTEUR-3a).
- « · » retirés de la carte bien-être : « dernière lecture le 21 oct. à 10:19 », « moy. 3,0 sur 3 j » ; ligne des
  détails de la carte des analyses en phrases.
- Tests mis à jour (today, Dashboard, TodayCards, MoodEstimateCard, Recommendations, tokens) ; trois tests du Dashboard
  attendaient le bloc « Mesures du jour » comme signal de fin de chargement : ils attendent la fin du chargement.
- Nouveautés : `2026-11-06-2335-accueil-retouches.json`.

## Vérifications
- `npm run test` : 3 209 verts. `npm run lint` : 0 erreur. `npm run build` OK.
- Captures Accueil play vierge avant / après (clair, sombre) : date et « Bonjour » sur deux lignes, plus de carte grise
  des sources, carte lilas « Vos analyses du ventre arrivent dans 28 jours » sans ligne technique.
- `npm run visual -- --play` (démo) : 17 pages ok ; Accueil et Analyses → Ventre relus.

## Suite
- TESTEUR-4b (photo directe depuis l'Accueil et Nutrition), puis 3a (reste : phrase « hasard » de l'onglet Analyses),
  4c ; TESTEUR-1b en run idées (maquette du statut du jour).
