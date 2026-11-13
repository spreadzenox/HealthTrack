# 2026-10-31 05:00 UTC — le temps d'écran sur TestFlight (625.108) ; temps par catégorie d'app ; Android v631

**Étape** : I8 (temps d'écran), I9  ·  **PR** : #105, #108 et #109 (mergées), #110  ·  **Android suivi** : v631 sur `main`  ·  **iOS** : 625 sur `main` et sur TestFlight (625.108)  ·  **Parité** : 49 % (23/47)

## Messages du propriétaire depuis le run précédent
- Aucun. A6, version d'iOS de l'iPhone 12 et trois décisions toujours attendus.

## Ce qui a été fait
- **#105 mergée** (temps d'écran, étape 3) : CI verte sur `main` fusionnée (v625).
  - Audit des mots d'Android vide, aucune erreur JavaScript, sondes bonnes.
  - Nouveautés de l'iPhone : « Temps d'écran et sommeil sur iPhone » (Nouveau) vue en image.
  - Tests (2960) et build appstore passés en local sur la même tête.
- **Envoi TestFlight** (run 41170819122, `main` 0063d30) : réussi, build **625.108**, la première avec le temps
  d'écran.
- **#108 mergée** (journal de 04:00), juste après #105, comme le veut la charte.
- **Android v631** (#546 journal, #547 CI : rien pour l'iPhone) ajouté à la branche de v629 : PR #109 (v626 à v631).
  - 34 correctifs appliqués directement ; `npm ci`, tests (2963) et build appstore OK ; CI en cours.
- **PR #110 : temps par catégorie d'app** (comme Android, I116).
  - Plugin : chaque segment rend ses apps (identifiant, nom, catégorie de Temps d'écran, durée) ;
    `import ManagedSettings`.
  - `phoneAppsIos.js` : mêmes catégories et mêmes entrées `phone_apps` qu'Android. Classement :
    1. messageries, puis apps connues par identifiant iPhone ;
    2. puis catégorie de Temps d'écran, en français ou en anglais ;
    3. sinon « autres apps ».
  - Que des minutes (D5/D6).
  - `syncSegments` écrit ces entrées seulement si le plugin rend des apps ; textes de la carte et de l'accord
    (correctif 34, deux phrases) ; faux plugin des captures avec des apps ; note des Nouveautés de l'iPhone.
  - 9 tests, rouges avant. Ma note disait d'abord « comme sur Android » : refusée par le test des Nouveautés,
    corrigée.
- **Confidentialité sur iPhone** (dans #110) : la page disait « sans temps d'écran », alors que la fonction est sur
  `main`. Section « Temps d'écran (facultatif) » ajoutée :
  - autorisation Temps d'écran d'Apple, lecture heure par heure, rien ne quitte l'iPhone ;
  - UE et iOS 26.4+, comment l'arrêter ;
  - « temps d'écran » dans ce qui est enregistré ; mise à jour du 31/10.
  Le site se régénère depuis ce fichier.
- Journal :
  - README : la 625.108 ; quoi essayer sur l'iPhone 12 ; ligne de 06:00 ;
  - PARITE (temps d'écran) et BACKLOG à jour.
- **#109 mergée** (v631) : CI verte ; Nutrition : légende « atteint · incertain : repas manquants » seulement, barres
  incertaines en vert pâle (vu en image) ; audit vide, sondes bonnes. Envoi TestFlight de la 631 lancé en fin de run
  (résultat au prochain run). #110 compile (build Xcode verte) ; ses captures étaient en cours.

## Suite
- Résultat de l'envoi TestFlight de la 631.
- #110 : `main` fusionnée après #109, CI, captures (« Dont … » sur la carte, Nouveautés), merge, TestFlight.
- Essai sur l'iPhone 12 dès A6 : temps d'écran réel, noms d'apps (Apple peut les taire), durée de lecture.
