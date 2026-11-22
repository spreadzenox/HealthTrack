# Run du 22/11 11:30 — FUSION-3, correctif 58

**Type** : 🛠️ code (en coulisses) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 261cc5a au départ.

## État de départ
- main vert sur 261cc5a (#1193 EXPORT-CSV, release v866, APK 35,7 Mo) : Build & Release, Tests, Play — AAB et
  émulateur Galaxy A56 verts. Aucune PR « [Auto] » ouverte. Rien de neuf du propriétaire dans le prompt.

## Ce qui a été fait
**FUSION-3, correctif 58** (cycle de l'app Santé, iPhone) fondu dans le code partagé :
- `iphone/overlay/app/src/ios/cycleSante.js` et son test → `app/src/ios/` (le module n'enregistre le plugin natif
  `CycleHealth` qu'à son premier appel : rien n'est touché sur Android).
- `app/src/connectors/HealthConnectConnector.js` : l'autorisation du cycle avec « Mon cycle » (même feuille d'Apple
  que les autres mesures) et la lecture du cycle à chaque synchro, sous `isIos()`, comme le faisait le correctif.
- Le test du connecteur (`overlay/.../HealthConnectConnector.ios.test.js`) devient
  `app/src/connectors/HealthConnectConnector.cycleSante.test.js` ; il vérifie aussi que rien ne part sur Android.
- `iphone/patches/58-cycle-sante.patch` supprimé ; les fichiers d'overlay qui importent `../ios/cycleSante`
  (`CycleSanteCard.jsx`, correctif 61) gardent le même chemin. **39 correctifs restent.**
- Rien de visible : pas de note de Nouveautés.

## Vérifications
- Android : suite complète Vitest 4 255 tests verts (44 sautés, comme avant), lint propre, build OK.
- iPhone : `scripts/upstream.sh` applique les 39 correctifs ; dans `iphone/upstream/app`, les tests des dossiers
  `ios`, `connectors`, `settings`, `DayEntries` et `Connectors` passent (50 fichiers, 472 tests).
- Build iPhone de la PR (simulateur) au passage en « prête ».

## Suite proposée
1. FUSION-3 : correctif 61 (carte du cycle dans Sources), puis 09 avec `saveTextFile.js`.
2. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45 ; demain lundi, archive de S47.

## Pour le propriétaire
« 👉 PI2 prête » (inchangé) : dire à Claude dans Chrome « fais la mission PI2 », puis « Submit for Review ».
Parité iPhone : 70 %. TestFlight : 1244.1244 chez « Testeurs Halcya ».
