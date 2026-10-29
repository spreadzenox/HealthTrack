# Run du 29/10/2026 08:33 (Paris, CET) — Idées : des mesures FODMAP cohérentes avec les repères

**Type** : 💡 Idées (run de 08 h : pas de code produit)

## Constat au démarrage
- Main à `aa4abd9` (#496), tous les workflows verts (Build & Release v356, Play — AAB, Tests, émulateur A56).
- Aucune PR « [Auto] » ouverte (PR #51 `cursor/*` non touchée).
- Les audits écran par écran (POL-PLAY-12) sont faits presque partout par les runs de code de la nuit : sujet choisi,
  la fiabilité des chiffres (« chiffres fiables », décision du 27/10) appliquée à `fodmapMeasurements.json`, qui
  reste ouvert dans N3 (demande du 26/10 14:45).

## Fait
- Relecture de `fodmapMeasurements.json` (45 aliments, 6 sources) et de `fodmapGroups.js` (repères Varney 2017).
- Lecture de Ferjančič 2024 (tableau 1 complet : 23 lignes non reprises), Liljebo 2020 (supplément CC BY / CC0
  téléchargé et lu en entier, hors dépôt), Pejcz 2019, Miranda 2020 ; licence AFCD vérifiée (écartée).
- Calcul à la main sur les valeurs de la table : 80 g de baguette = 0,11 g de fructanes → « bas » ; 100 g de poireau
  = 0,24 g → « bas » ; avec les mesures de la série qui a fixé les repères : 0,82 g et 3,8 g → « élevé ».
- Noms Ciqual exacts vérifiés pour 13 aliments à ajouter.
- `IDEES.md` I191 à I193 ; `BACKLOG.md` N3d à N3f ; `RESEARCH.md`, `PRODUIT.md` (historique) et résumé de la semaine.

## Idées rangées (par impact)
- I191 (18) fourchette `g_high` quand deux mesures publiées divergent de plus de 2 fois (pain, poireau, oignon) :
  jamais « bas », « probable » entre les bornes → **N3d, avant les testeurs**.
- I192 (17) les 23 lignes restantes de Ferjančič (légumes courants, riz, pommes de terre : « ND » en limite) → N3e.
- I193 (16) Liljebo 2020 en « citée » : fructanes des céréales (cuits par l'eau Ciqual), polyols des fruits et
  légumes quand Ciqual ne les mesure pas → N3f.

## Demandes iOS
- Rien de propre à Android ; pas de note de Nouveautés (journal seul).

## Vérifications
- Journal seul : `npm run test` vert (2 657).

## Suite
- Runs de code : N3d (petit, testable, chiffres fiables), puis la suite de POL-PLAY-12 ; N3e et N3f ensuite.
