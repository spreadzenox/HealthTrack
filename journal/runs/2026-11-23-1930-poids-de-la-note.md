# Run 23/11 19:30 — #1222 complétée (poids de la note) et passée en « prête »

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 910c1d4 (#1221),
release v890 · **TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé de 07:33 UTC), 1244.1244 attachée
à la version 893 · **Parité** : 70 % (33/47), 2 correctifs iPhone restent (01, 27)

## État de départ
- main vert sur 910c1d4 : Tests, émulateur ; Build & Release v890 et Play — AAB verts (#1220).
- PR de la routine ouverte : **#1222** (run de 18:30, DEM-IOS-7), en brouillon pour grouper un second petit
  correctif avant un seul build iPhone. Le run de 18:30 avait fini (compte rendu poussé). #51 (`cursor/*`) pas touchée.

## Ajouté à #1222 : le poids de la note du jour (personas du 22/11, « À étudier »)
- Constat : « Ma note 4/5 et 4 lectures du visage à 2,8 donnent 3,7 ? » ; « Comment c'est calculé » disait que les deux
  sources sont réunies, sans leur poids.
- Le modèle (`services/method/stateSpace.js`) donne à la note un écart type de 0,35 et au visage 0,8 au départ (puis
  appris sur les jours où les deux existent) : la note pèse 0,8² / 0,35² ≈ 5 fois plus. Avec 4 et 2,8 : ≈ 3,8 avant le
  lissage, 3,7 affiché, cohérent.
- Texte ajouté (Objectifs › Votre bien-être › Comment c'est calculé) : « Votre note compte environ 5 fois plus que le
  visage au départ, puis selon l’accord des deux chez vous. » Le chiffre est calculé depuis `OBS_SD`, il suit le modèle.
- Test d'abord (`Recommendations.test.jsx`, rouge puis vert). Note de Nouveautés commune
  (`2026-11-23-1930-poids-de-la-note.json`).
- En local : `npm run test` (4 479 verts avant l'ajout, puis la page et les données vertes), `npm run build`,
  `npm run lint` (0 erreur), `npm run visual` (aucune erreur JS ; `recommendations-bien-etre-3` relue, volet replié,
  mise en page inchangée). Correctifs iPhone 01 et 27 : `git apply --check` vert.

## PR
- #1222 passe en « prête » : un seul build iPhone pour les deux correctifs. Merge au run suivant, après les checks
  verts et la capture iPhone de l'accueil (« Vos sources ») où « ⚙ Réglages » doit s'afficher en texte, pas en emoji
  couleur ; sinon revenir à « la roue › » en toutes lettres.

## Suite
1. Run suivant (20:30, après le run « idées » de 20:00 s'il a lieu) : relire les checks et la capture iPhone de #1222,
   puis merger.
2. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
