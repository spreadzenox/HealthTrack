# 07/11 11:35 — Vos données du jour par source (TESTEUR-1d-b)

Type : 🎨 run de code (retours du premier testeur iPhone du 06/11, point (1), maquette `maquettes/aujourdhui/` §2.4).

## Constat au démarrage
- main `a22d096` (#776), workflows verts (Tests, Build & Release, émulateur A56, Play — AAB, Alpha ×3). Aucune PR
  « [Auto] » ouverte (seule #51, cursor/*, non touchée).

## Fait
- `services/today.js` : `todayBySource({ tiles, summary, entries, now, showGut })` (fonction pure) range les chiffres
  du jour en `watch` (sommeil, VFC nuit, FC au repos ; pas quand ils viennent d'une montre connue ou du même appareil
  que la nuit), `phone` (pas, nuit estimée par le téléphone, temps d'écran) et `noted` (dernière note de bien-être du
  jour en menthe, du ventre en pêche seulement avec « Mon ventre », repas, cigarettes ; jamais une note d'hier).
  `measureTiles` expose `estimated` pour la nuit estimée.
- `components/TodayBySource.jsx` (+ CSS) : titre « Vos données du jour », une carte neutre par source, appareil
  d'origine en mono à droite (« Garmin » plutôt que « Health Connect · Garmin »), lien « Ajouter une montre › » vers
  Sources sans montre ; rien du tout au premier jour.
- `Dashboard.jsx` : `TodayBySource` remplace `MeasureTiles` (supprimé, avec ses tests).
- `MoodEstimateCard.{jsx,css,test}` supprimés ; `UnlockReminder` et `StartCalibration` (et leurs styles, dont
  `.mood-manual` utilisé par l'historique) passent dans `WellbeingNudges.{jsx,css}`, avec leurs tests.
- Nouveautés : `2026-11-07-1135-donnees-du-jour.json`.

## Vérifications
- `npm run test` : 3 250 passés, 44 ignorés (−5 : tests de l'ancienne carte retirés, +11 nouveaux). `npm run lint` :
  0 erreur. `npm run build` : vert. `npm run visual` (toutes pages) : vert.
- Captures relues (`--play --routes=/`) : démo clair et sombre (carte « Montre » : sommeil, VFC, pas de Gadgetbridge),
  vierge clair (aucune section, « Noter » directement après les analyses).

## Écarts à la maquette
- Pas de météo dans « Téléphone » : elle n'est enregistrée que pour les journées terminées (aucune entrée du jour).
- Pas de « il y a 12 min » en tête de carte : la fraîcheur reste par tuile (« cette nuit », « hier »).

## Suite
- TESTEUR-1d-2 (« Ce qui change aujourd'hui » + carte lilas réécrite), puis 1e (animation).
