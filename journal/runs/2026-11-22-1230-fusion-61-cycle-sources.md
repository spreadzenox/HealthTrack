# Run du 22/11 12:30 — FUSION-3, correctif 61

**Type** : 🛠️ code (en coulisses) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 4747922 au départ.

## État de départ
- main sur 4747922 (#1194, correctif 58) : Build & Release vert, Tests, Play — AAB et émulateur Galaxy A56 en cours
  au départ (verts sur 261cc5a juste avant). Aucune PR « [Auto] » ouverte. Rien de neuf du propriétaire dans le prompt.

## Ce qui a été fait
**FUSION-3, correctif 61** (carte « Suivi du cycle (Santé) » dans Réglages › Sources, iPhone) fondu dans le code partagé :
- `iphone/overlay/app/src/ios/CycleSanteCard.jsx` et son test → `app/src/ios/`.
- `app/src/pages/Connectors.jsx` importe et affiche la carte sous « Mes appareils », comme le faisait le correctif.
  `shouldOfferCycleSante` ne la propose que sur iPhone (`Capacitor.getPlatform() === 'ios'`), avec « Mon cycle » et
  Santé déjà autorisée.
- Nouveau test `app/src/ios/CycleSanteCard.android.test.jsx` (module réel, sans simulation) : rien d'affiché sur
  Android ni dans le navigateur, la carte sur iPhone.
- `iphone/patches/61-cycle-sources.patch` supprimé. **38 correctifs restent.**
- Rien de visible sur Android : pas de note de Nouveautés.

## Vérifications
- Android : suite complète Vitest, lint propre, build OK (détail dans la PR).
- iPhone : `scripts/upstream.sh` applique les 38 correctifs (v1255) ; dans `iphone/upstream/app`, les tests des
  dossiers `ios`, `connectors`, `pages/Connectors` et `DayEntries` passent (40 fichiers, 387 tests).
- Build iPhone de la PR (simulateur) au passage en « prête ».

## Suite proposée
1. FUSION-3 : correctif 09 avec `saveTextFile.js`.
2. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45 ; demain lundi, archive de S47 (avec le relevé des
   heures de Mac de la semaine, déjà fait à 04:30).

## Pour le propriétaire
« 👉 PI2 prête » (inchangé) : dire à Claude dans Chrome « fais la mission PI2 », puis « Submit for Review ».
Parité iPhone : 70 %. TestFlight : 1244.1244 chez « Testeurs Halcya ». Testeurs Play : 4 inscrits sur 12 (dernier
relevé connu).
