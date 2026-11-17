# Restes du sprint : le monde de Pilou branché dans la scène — découpage en runs

Préparé par le run « idées » du 17/11 08:30 (lecture du code de main 049bfdb et de #1080, sans code produit).
Références : `specs/ile.SPEC.md` § 6 (cycle du jour) et § 8 (croissance, saisons), `journal/sprint/LOT-MONDE.md`,
`journal/sprint/LOT-SCENE.md` (« Laissé écrit, pas branché »), `app/src/companion/CONTRAT.md` § 5.

## 1. Ce qui existe et ce qui manque (état du 17/11 08:30)

| Morceau | Écrit (lot MONDE, testé) | Consommé par la scène ? |
|---|---|---|
| Cycle du jour `lightAt(now, { wake, bedtime })` | oui (`world/daylight.js`) | **en partie** : `CompanionScene.jsx` appelle `world.lightAt(now)` **sans** lever ni coucher → toujours 7 h et 22 h 30 |
| Lever et coucher habituels `loadWorldContext()` | oui (`world/context.js`, sommeil des 35 derniers jours, ≥ 7 nuits) | **non** dans la scène ; **oui** dans le widget (`widgetSync.js`) |
| Météo `weatherDecor` | oui | oui (étiquette et effets) |
| Croissance `growthAt(jours d'usage)` | oui (`world/growth.js`) | **non** : `createIsland` n'a ni échelle, ni arbre, ni îlot voisin, ni mare |
| Saisons `seasonOf(date, hémisphère)` | oui | **non** : aucune couleur de saison dans `scene/` (le 17/11, l'îlot devrait être en automne) |
| Nouvelles de l'îlot `worldNews(avant, après)` | oui (« Un îlot voisin est apparu ») | **non** : ni étiquette, ni petit saut |

**Défaut que voit déjà l'utilisateur** : le widget Android et l'île ne s'endorment pas à la même heure dès que la
personne a 7 nuits de sommeil lisibles. Exemple : couché vers 0 h 15 en moyenne. À 23 h, le widget dit encore « soir »
(Pilou éveillé) alors que l'île affiche « Pilou dort. » depuis 22 h 30. À l'inverse, pour un lever moyen à 9 h, l'île
réveille Pilou à 7 h alors que le widget le montre encore endormi.

## 2. Découpage proposé : un run de code par ligne, dans cet ordre

### MONDE-1 — lever et coucher réels dans la scène (petit, à faire en premier)
- `CompanionScene.jsx`, effet « la lumière » : charger `loadWorldContext()` une fois par jour (`worldDayKey`), comme le
  fait `syncPilouWidget` (même cache possible : extraire `worldContextForDay(now)` dans `world/context.js` et le faire
  utiliser par les deux, pour qu'ils ne divergent jamais), puis `world.lightAt(now, { wake, bedtime })`.
- `mood.js` n'a rien à changer : il suit `time:phase` / `light.asleep`.
- Tests : (a) `world/context.test.js` : le cache commun rend la même valeur au widget et à la scène dans la journée,
  relit au changement de jour (4 h) ; (b) scène (jsdom, module monde simulé) : avec un coucher moyen à 0 h 15, à 23 h
  `time:phase` n'est pas endormi ; à 0 h 30, il l'est. Rouge avant, vert après.
- Captures : `npm run visual --routes=/ --tz=…` à 23 h sur données de démo (le sommeil de démo donne un coucher moyen :
  le relever d'abord avec `computeSleepRegularity` sur la graine) ; iPhone : captures de la PR, Accueil clair et sombre.
- Risques : sommeil fragmenté ou travail de nuit (coucher 8 h, lever 15 h) : `dayPhase` gère déjà `bed < wake` ; ajouter
  un test « travail de nuit » pour le dire. Pas de migration, rien de stocké, rien ne sort du téléphone.
- Nouveautés : une note courte (« Pilou se couche et se lève à vos heures, d'après votre sommeil »), toutes variantes.

### MONDE-2 — la saison sur l'îlot (visible dès aujourd'hui : automne)
- `scene/island.js` : `createIsland({ …, season })` et `island.setSeason(season)` : teinte de l'herbe et des touffes
  (automne : herbe dorée ; hiver : calotte de neige claire sur le dessus ; fin d'hiver : quelques fleurs blanches ;
  printemps-été : l'herbe actuelle). Le feuillage de l'arbuste du J1 (`scene/gifts.js`) suit la saison.
- `CompanionScene.jsx` : `seasonOf(now, hémisphère de loadWorldContext)` au chargement et au changement de jour.
- Palier « bas » (image fixe) : garder l'image actuelle (pas de 4 × 2 images à produire) ; le noter dans PARITE.md si
  l'iPhone tombe au palier bas en CI.
- Tests : couleur de l'herbe par saison (matériau lu dans le groupe three), hémisphère sud décalé de six mois.
- Contraste : en sombre, l'étiquette reste lisible sur la calotte de neige (test de contraste de `lifeTokens` étendu).

### MONDE-3 — la croissance de l'îlot (échelle, touffes, arbre)
- `island.setGrowth(growth)` : `group.scale` = (`islandScaleXZ`, `islandScaleY`, `islandScaleXZ`) ; la caméra
  (`scene/camera.js`) recule de façon à garder Pilou à la même taille à l'écran (sinon l'îlot × 1,3 sort du cadre).
- Touffes : `growthAt().tufts` (14 → 42, unité de la SPEC : touffes **fleuries**) n'est pas la même unité que
  `quality.tufts` (600 brins d'herbe instanciés). Ne pas les confondre : les brins restent au palier ; les 14 → 42
  touffes fleuries sont les couronnes de `scene/flowers.js` (« une couronne par semaine », SPEC § 7). À trancher dans le
  run, en lisant `flowerGrowth.js` d'abord.
- Arbre (`tree`, g ≥ 0,5) : l'arbuste du J1 grandit (`shrubScale`).
- Changement **hors de la vue** seulement (au changement de jour ou à l'ouverture), jamais sous les yeux.
- Tests : `growthAt(0)` laisse l'îlot actuel au pixel près (aucune régression pour les nouveaux), `growthAt(90)` donne
  l'échelle × 1,3 / × 1,12 ; la caméra garde la boîte de Pilou (`pilouBox()`) à ± 5 %.
- Captures : graine de démo à 75 jours d'usage (g ≈ 0,83) ; comparer à `specs/` et aux images du kit.

### MONDE-4 — îlot voisin (30 jours) et mare (90 jours), avec la nouvelle à l'ouverture
- Deux petits objets de `scene/` (îlot voisin à droite, apparition 900 ms `back` ; mare sur le dessus).
- À l'ouverture : `worldNews(état gardé, état du jour)` → l'étiquette dit la nouvelle (une fois) et Pilou fait un petit
  saut (événement existant du bus). L'état d'avant est gardé en `localStorage` (pas de donnée de santé : un nombre de
  jours et une saison), inclus ou non dans l'export : non (c'est un état d'affichage, recalculé).
- Tests : la nouvelle n'est dite qu'une fois ; rien la première fois (pas de « nouveau » au premier lancement).

### Hors de ce découpage
- Poses du widget re-rendues avec le vrai Pilou (`app/scripts/companion/render-widget-poses.mjs`, module PILOU) :
  indépendant, peut passer entre deux de ces runs.
- Rituel du soir et lanternes du défi des 5 soirs (SPEC journée § 7) : lot VIE, découpage à faire par un run « idées ».
- Palier de qualité et temps d'image : seulement sur un vrai téléphone (le propriétaire), la CI rend en logiciel.

## 3. Parité iPhone
Tout est dans le code partagé (`app/src/companion/`) : l'iPhone le reçoit au même merge, sans correctif
(`iphone/patches/` ne touche pas `companion/`, vérifié le 17/11). La build simulateur et ses captures de l'Accueil
font la preuve. Le widget n'existe que sur Android (ligne déjà dans PARITE.md).
