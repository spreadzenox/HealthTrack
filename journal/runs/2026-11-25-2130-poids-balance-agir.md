# Run 25/11 21:30 — poids, balance et carte Agir (POLISH-SIM-165 à 167)

**Type** : 🔧 (code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main 62d3a57 vert (Tests, émulateur A56, Build & Release, Play — AAB) · **TestFlight** : 1313.1313 chez
« Testeurs Halcya » ; le build du soir (cron de 21:20) n'était pas encore parti à 21:45 (retard habituel) ·
**Parité** : 70 % (33/47), inchangée

## État de départ
- Aucune PR de la routine ouverte (#51, `cursor/*`, pas touchée). Pas de réponse du propriétaire (LANT-4, courbes,
  PROP-SIM-19).
- Suite proposée par le run de 20:30 : POLISH-SIM-166, 165 et 167 groupés en une PR (un seul build iPhone).

## Fait (tests d'abord, rouges puis verts)
- **POLISH-SIM-166** (`devices/healthApps.js`) : une source qui n'envoie que des mesures ponctuelles (poids, masse
  grasse, tension, glycémie) reste « à jour » 14 jours au lieu de 3 ; passé ce délai : « Aucune mesure depuis plus de
  deux semaines. », sans parler de montre. Une montre qui envoie aussi le poids garde la règle des 3 jours. 3 tests.
- **POLISH-SIM-165** (`services/trendsAxis.js`, sorti de `TrendsViewer.jsx`) : écart minimal de l'axe par unité
  (2 kg, 10 bpm, 20 ms, 2 h, 2 000 pas), centré sur les valeurs, jamais sous zéro. 6 tests. Le test POLISH-SIM-47
  (pas de 0,25 kg) est remplacé : avec 2 kg au moins, le pas est 0,5 kg ; il vérifie toujours qu'aucune graduation
  n'est arrondie (« 77,3 » absent) et l'écart de 2 kg.
- **POLISH-SIM-167** (`services/trials.js` `homeActIdle`, `Dashboard.jsx`) : sans essai en cours, la carte Agir lit
  le résumé des pistes mémorisé par Analyses (aucun calcul de plus) : « N pistes à tester », sinon « Aucune piste à
  tester pour l'instant » ; « Vérifier une piste par un essai » reste quand un essai fini ou une habitude remplit la
  page Agir.
- Note de Nouveautés commune `2026-11-25-2130-poids-balance-agir.json`.

## Vérifications
- `npm run test` : 4 696 tests verts (457 fichiers) ; `npm run lint` : aucune erreur (comme avant) ; `npm run build` vert.
- `npm run visual -- --routes=/,/sources,/tendances?mesure=weight` : sans erreur JS. Captures relues : Tendances ›
  Semaine › Poids, axe 76 → 79 kg pour 77,1 → 77,2 kg (avant : 77,05 → 77,25) ; Accueil, carte Agir « Aucune piste à
  tester pour l'instant » (démo sans essai). Sources dans le navigateur n'a pas Health Connect : la règle est couverte
  par les tests.
- PR ouverte en brouillon puis passée prête une fois finie (un seul build iPhone).

## Suite proposée
1. Run suivant : relire les captures iPhone de Tendances et de l'Accueil du build de la PR, puis merger.
2. Build iPhone du soir et TestFlight ; Alpha à 23:45 ; soumission bêta de la build du soir au premier run qui la voit
   traitée, expiration des anciennes.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51. Réponses attendues : « rituel 2D / 3D / pas de
rituel », « go courbes / go phases / non », PROP-SIM-19.
