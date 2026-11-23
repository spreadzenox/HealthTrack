# Run 23/11 11:30 — #1215 mergée, FUSION-3 : correctif 02 (mode captures)

**Type** : 🔧 (code partagé, rien de visible sur Android) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main 8abf151 (#1215) · **TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé de 07:33 UTC),
1244.1244 attachée à la version 893 · **Parité** : 70 % (33/47), 2 correctifs iPhone restent

## État de départ
- main vert sur c970b9b (#1214 : Tests, Build & Release v884, émulateur, Play — AAB).
- PR de la routine ouverte : **#1215** (run de 10:30, POLISH-SIM-148, prête), 15 checks verts dont le build iPhone
  (35 min), branche à jour sur main. #51 (`cursor/*`) pas touchée.

## #1215
- Captures iPhone (`captures/pr-1215`, build 1277.1277) de l'Accueil relues, clair et sombre : bulles Digestion,
  Repas et Bien-être entières, rien ne les cache (la démo, au jour 76, n'a pas de cadeau : la preuve du coin est la
  capture du jour 3 du run de 10:30 et le test `bubbles.test.js`).
- **Mergée en squash (8abf151)**, titre et message écrits à la main, sans ligne d'attribution.
- **Build & Release de 8abf151 en échec** : Gradle n'a pas pu lire `error_prone_annotations-2.3.1.pom`, Maven Central
  a répondu **429 Too Many Requests** (limite de débit, pas le code ; Tests et Play — AAB du même commit verts).
  Job relancé (`rerun-failed-jobs`) : **vert**, release **v885** publiée (APK 35 673 017 octets, 10:42 UTC).

## FUSION-3, correctif 02
- `iphone/overlay/app/src/ios/captureMode.js` et ses deux tests passent dans `app/src/ios/` (`git mv`) ;
  `app/src/main.jsx` les charge par un import dynamique sous `import.meta.env.VITE_IOS_CAPTURE === '1'` (la build de
  captures de `ios-build.yml`), comme le faisait le correctif. `iphone/patches/02-mode-captures.patch` supprimé.
- Test d'abord : `captureMode.gate.test.js` (une seule ligne de `main.jsx` nomme `ios/captureMode`, sous la condition ;
  aucun import statique) ; rouge sans le changement de `main.jsx`, vert avec.
- Les 73 tests du mode captures tournent désormais aussi dans les tests d'Android. Le test d'overlay
  `Premium.appstore.test.jsx` importe `../ios/captureMode.js` : il le trouve dans le code commun une fois copié.
- Commentaires mis à jour (`captureMode.js`, `ios-build.yml`, `PARITE.md`).

## Vérifications
- `npm run test` : 407 fichiers, 4 469 tests verts ; `npm run lint` sur les fichiers touchés : 0 erreur ;
  `npm run build` vert, et `dist/` ne contient ni `installCaptureMode` ni `halcya_ios_capture_step` : rien n'arrive
  dans l'APK ni dans la build TestFlight (qui n'a pas `VITE_IOS_CAPTURE`).
- `iphone/scripts/upstream.sh` ne tourne pas dans ce clone sans historique ; les deux correctifs restants (01
  `distribution.js`, 27 `feedback.js`) ne touchent ni `main.jsx` ni `ios/`. Le job « Tests d'Android avec les correctifs
  iOS » de la PR le confirmera.
- Pas de `npm run visual` : aucun écran ne change.

## Suite
1. Run suivant : checks de la PR (build iPhone : les captures doivent toutes être là, c'est le mode captures lui-même
   qui les prend), merge.
2. FUSION-3 : 27 attend une décision (« Votre avis » de l'iPhone vise l'ancien dépôt : FUSION-4), puis 01 en dernier.
3. POLISH-SIM-146 et 150 après le banc ; PERSONAS-OUTIL-2.
4. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
