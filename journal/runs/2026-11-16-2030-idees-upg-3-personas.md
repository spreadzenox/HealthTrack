# Run 16/11 20:30 — « idées » : UPG-3a, deux personas (installation neuve, mise à jour)

**Type** : run « idées » (sans code produit)  ·  **Android** : main vert sur a0ea2e6 (#1043 mergée : Tests, Build &
Release v762, Play — AAB, émulateur A56 ; build iOS simulateur en cours)  ·  **TestFlight** : 1107.1107 chez « Testeurs
Halcya » (soumission du jour faite à 07:36 UTC ; la build du soir viendra après l'Alpha de 23:45)  ·  **Parité** : 70 %
(33/47), inchangée

## Contexte
- Empreinte des instructions conforme (69177875…). Les quatre fichiers lus en entier.
- PR ouvertes : #1045 (UPG-4, run de 19:30, ouverte depuis 30 min, build iOS en cours) : pas touchée (règle 0, un
  autre run peut encore y travailler) ; #1046 (orchestration) et #1047 (« Sprint PHOTO ») ne viennent pas de cette
  routine : pas touchées ; #51 (cursor) pas touchée.
- iPhone : `upstream.json` suit `HEAD` (aucun épinglage à avancer) ; aucune note iPhone à reporter dans PARITE.md.

## Fait
- **UPG-3a** : deux simulations par agents à accès visuel seul (outil `npm run persona`) :
  - « Ventre et données », Samsung + Galaxy Watch, **jour 1, installation neuve** :
    [`rapport`](../simulations/2026-11-16-2030-ventre-et-donnees-J1.md).
  - « Tout mesurer », Pixel Watch 3, **jour 45 `--legacy`** (objectifs `sport,cycle`, essai en cours) :
    [`rapport`](../simulations/2026-11-16-2030-tout-mesurer-maj-J45.md).
- Vérifié par moi : capture de Paramètres (« Confort digestif » coché après conversion de `sport,cycle`) ; table
  FODMAP : seul l'oignon cru a ses fructanes (`fodmapMeasurements.json`), l'oignon cuit n'en a aucune.
- Écarté : le repas décrit rendu en « carbonara » vient de l'analyse factice de l'outil de simulation.
- Constats rangés en **POLISH-SIM-99 à 108** (BACKLOG, sous UPG-3).

## Suite
- Merger #1045 après sa build iOS. Puis, avant le 22/11 : POLISH-SIM-99 (visite guidée : étape « Ma journée », plus
  d'« Agir » comme onglet), 100 (objectifs convertis expliqués), 101 (note de navigation en tête de la page
  Nouveautés), 102 (décomptes de la digestion). Ensuite une seconde paire de personas (« Stressé et pressé » J14,
  « Prendre soin de soi » J45 `--legacy`) pour finir UPG-3, puis REFONTE-8.
