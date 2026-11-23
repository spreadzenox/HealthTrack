# Run 23/11 05:30 — #1210 mergée ; FUSION-3 : correctif 28 (Nouveautés de l'iPhone)

**Type** : 🔧 run de code (code partagé, rien de visible sur Android ni sur iPhone) · **Contrôle d'intégrité** :
empreinte conforme (dd430fbd…) · **Android** : main 5cbcfc1 (#1210), release **v881** (APK 35,7 Mo, 04:35 UTC) ·
**TestFlight** : 1268.1268 chez « Testeurs Halcya », 1244.1244 attachée à la version 893 · **Parité** : 70 % (33/47),
6 correctifs iPhone restent

## Contexte
- main vert sur 7058de4 (#1209). PR de la routine ouverte : **#1210** (runs de 03:30 et 04:30), prête, tous les
  checks verts (Vitest, Build APK, émulateurs, build iPhone sur simulateur et captures). #51 (`cursor/*`) pas touchée.

## Fait
1. **#1210 mergée** (squash, branche à jour sur main) après lecture des captures iPhone de `captures/pr-1210` :
   Sources (« Ce que lit Halcya », carte Visage avec « Activer la lecture du visage ») et guides « Votre montre
   n'apparaît pas ? » par l'app Santé (Garmin déplié : trois étapes, rien qui parle de Health Connect).
   `js-errors.txt` vide, `TEST BUILD SUCCEEDED`. Build & Release vert : **v881**, APK 35 671 285 octets.
2. **Correctif 28 fondu** : `APPSTORE_CHANGELOG_SINCE` (premier TestFlight, 30/10 21:00) et `APPSTORE_HIDDEN` (notes
   communes fausses sur iPhone) passent dans `app/src/data/changelog.js`, avec le filtre `appstore` de `changelogFor`.
   `iphone/patches/28-nouveautes-iphone.patch` supprimé.
3. Test Android ajouté (`changelog.test.js`) : Google Play et hors store ne perdent aucune note, y compris celles
   cachées sur iPhone. Dans le code commun, `'appstore'` n'est pas encore une distribution reconnue (correctif 01) :
   le filtre iPhone lui-même reste prouvé par `overlay/…/changelog.appstore.test.js`, qui reste dans l'overlay comme
   les notes `["appstore"]`.
4. PR ouverte **en brouillon** (CI économe) : le run suivant y ajoute un autre correctif, puis la passe en « prête ».

## Vérifications
- `npm run test` (app) : 401 fichiers verts (3 sautés) ; eslint propre sur les fichiers touchés.
- `iphone/scripts/upstream.sh` : v1271 (HEAD), 6 correctifs appliqués ; Vitest de `upstream/app` sur `changelog`
  (dont le test d'overlay) : 23 tests verts.
- Pas de `npm run visual` : aucun écran ne change.

## Suite
1. Run suivant : ajouter 24 (abonnement App Store) à la PR s'il tient en un run, sinon la passer en « prête » telle
   quelle ; puis build iPhone, captures de Nouveautés (doivent être identiques), merge.
2. FUSION-3 ensuite : 38 (App Attest), 49 (personas), 02 (captures), 27 (attend une décision sur le lien « Envoyer un
   avis »), 01 en dernier.
3. Vérifier que l'examen bêta de 1268.1268 est fini et que la build du soir part bien.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
