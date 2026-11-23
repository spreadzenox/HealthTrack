# Run 23/11 03:30 — #1209 mergée, 1268.1268 validée, FUSION-3 : correctifs 05 et 10 (PR en brouillon)

**Type** : 🔧 run de code (code partagé, rien de visible sur Android) · **Contrôle d'intégrité** : empreinte conforme
(dd430fbd…) · **Android** : main 7058de4 (#1209), release **v880** (APK 35,7 Mo, 02:34 UTC), Tests et
Play — AAB verts · **TestFlight** : **1268.1268** validée (examen APPROVED, en test chez « Testeurs
Halcya ») ; 1244.1244 reste attachée à la version 893 · **Parité** : 70 % (33/47), 8 correctifs iPhone restent

## Contexte
- main vert sur 82e51b5 ; PR de la routine ouverte : **#1209** (run de 02:30), 15 checks verts dont la build iOS,
  à jour sur main. #51 (`cursor/*`) pas touchée.
- « Play — Alpha » de la nuit pas encore parti à 02:35 UTC (cron en retard comme les jours précédents, 02:40 à 03:50 UTC).

## Fait
1. **#1209** : captures iPhone (`captures/pr-1209`) relues : page Licences (bibliothèques, MPL de Capacitor Health avec
   son code source), Tendances en sombre ; console sans erreur. **Mergée en squash (7058de4)**, message écrit à la main.
2. **TestFlight** : relevé `ios-store-beta.yml` (lecture seule) : 1268.1268 et 1244.1244 en test, toutes les autres
   expirées. Rien à expirer (1244.1244 = build de la soumission App Store).
3. **FUSION-3, correctifs 05 et 10** fondus dans le code partagé :
   - `missingOnIos()` passe d'`iphone/overlay/app/src/ios/` à `app/src/ios/nativePlugins.js`, avec son test (qui couvre
     aussi le visage) ;
   - 05 : `faceSense.js` n'a pas de plugin sur iPhone tant que le Swift manque ; carte Visage « Bientôt sur iPhone. »
     sous `FEATURES.iosStore` ;
   - 10 : note du soir, rappel de portion, soir du ventre, marqueur de sauvegarde, voix et montre retombent comme dans
     un navigateur sur iPhone.
   - Android : `missingOnIos` est faux hors iOS (test), rien ne change.
4. **PR en brouillon** (CI économe, règle 1) : pas de build iPhone tout de suite. Le run suivant y ajoute le correctif 16
   (guides des montres) puis passe la PR en « prête » : un seul build iPhone pour trois correctifs.

## Vérifications
- `npm run test` (app) : 401 fichiers verts (3 sautés) ; eslint propre sur les fichiers touchés.
- `iphone/scripts/upstream.sh` : v1270 (HEAD), 8 correctifs appliqués ; Vitest de `upstream/app` (`src/ios`, visage) :
  297 tests verts.
- Pas de `npm run visual` : aucun écran Android ne change.

## Suite
1. Run suivant : fondre 16 dans la même branche, passer la PR en « prête », puis build iPhone, captures (Sources, carte
   Visage), merge.
2. Relever l'Alpha de la nuit.
3. 27 (lien « Envoyer un avis » vers l'ancien dépôt iOS) attend une décision ; 01 (variante `appstore`) en dernier.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
