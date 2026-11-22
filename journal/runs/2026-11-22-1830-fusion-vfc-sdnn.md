# Run du 22/11 18:30 — #1200 mergée, FUSION-3 lot VFC SDNN (9 correctifs iPhone)

**Type** : 🛠️ code (en coulisses) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main ec7a63d au départ.

## État de départ
- main sur ec7a63d (#1199) : Build & Release, Tests, Play — AAB et émulateur Galaxy A56 verts.
- #1200 (run de 17:30, temps d'écran iPhone) ouverte, prête, 15 checks verts (build iOS sur simulateur compris), à
  jour sur main. Aucune autre PR de la routine.

## #1200 finie
- Captures iPhone (`captures/pr-1200`) relues : Sources (Apple Watch « Reçu », variabilité cardiaque (SDNN)), carte
  « Temps d'écran et sommeil » (2 h 03 d'écran, 25 prises en main, réseaux sociaux / messageries / vidéo, nuit estimée
  01:00 → 07:10). `js-errors.txt` vide.
- Android : `npm run visual -- --routes=/,/connectors` sur la branche : Accueil et Sources sans erreur.
- Mergée en squash (822aebc), titre et message écrits à la main, sans ligne d'attribution.

## FUSION-3 : lot VFC SDNN
- Correctifs 17, 19, 20, 21, 30, 32, 56, 57 et 64 appliqués tels quels dans `app/src/` puis supprimés de
  `iphone/patches/` : **19 correctifs restent.** Une seule PR, donc un seul build iPhone (CI économe).
- Pourquoi sans condition de plus : la mesure `heartRateVariabilitySdnn` n'est écrite que par l'app Santé ; tout ce
  qui ne fait que la lire reste inerte sur Android. Ce qui créerait une variable ou un facteur vide (variable
  `hrv_sdnn_ms` des analyses, facteur de « Ce qui pèse », norme SDNN, axe VFC du radar) restait déjà derrière
  `DISTRIBUTION === 'appstore'`.
- `sdnnBaseline.js`, `sdnnBaseline.test.js` et `sdnnRadar.test.js` : d'`iphone/overlay/app/src/ios/` à `app/src/ios/`.
  Les tests d'overlay sans variante (`TodayBySource.ios.test.jsx`, `dailyJournal.ios.test.js`,
  `dayDeviations.ios.test.js`, `trendsData.ios.test.js`) passent dans `app/src/` ; ceux qui forcent la variante appstore
  (`analysisEngine`, `analysisResults`, `firstImport`, `today`, `BaselineCards`, `healthApps`) restent la preuve iPhone.
- Nouveau test Android `app/src/ios/sdnnBaseline.android.test.js` : ni norme ni variable ni facteur SDNN, radar sur la
  RMSSD, VFC RMSSD comptée comme avant, tuile VFC d'Aujourd'hui sans clé SDNN.
- Rien de visible sur Android : pas de note de Nouveautés.

## Vérifications
Voir la PR (tests, lint, build Android ; `scripts/upstream.sh` et tests des fichiers touchés dans le code embarqué).
Build iPhone sur simulateur au passage de la PR en « prête » ; merge au run suivant après lecture des captures
(Accueil, Tendances, Objectifs ; Sources).

## Suite proposée
1. Finir cette PR (build iOS, captures Accueil/Tendances), puis FUSION-3 : 06 (textes, à découper) ou 05/25 (visage).
2. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45 ; demain lundi, archive de S47 et relevé des heures de Mac.

## Pour le propriétaire
« 👉 PI2 prête » (inchangé). Parité iPhone : 70 %. TestFlight : 1244.1244 chez « Testeurs Halcya » (dernier relevé).
Testeurs Play : 4 inscrits sur 12 (dernier relevé connu).
