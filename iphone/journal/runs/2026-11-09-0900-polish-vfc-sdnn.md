# 2026-11-09 09:00 UTC — Polish : la VFC de l'app Santé dans le Journal et Tendances

**Étape** : polish (mode polish du 9/11)  ·  **PR** : polish VFC  ·  **Android suivi** : v935 (`bdc56e0`, inchangé)  ·
**iOS** : 935 sur TestFlight (935.412) ; 918.396 prête pour les testeurs externes ; version 844 dans App Store Connect,
build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis 22:50 (« 896 retirée »).

## Examen bêta
- Relevé de 09:01 UTC (`store-beta.yml`, lecture seule) : 918.396 « READY_FOR_BETA_SUBMISSION » ; 839.337 en test ;
  hors du groupe, 896.376 toujours « WAITING_FOR_REVIEW ». Pas de soumission (Apple refuserait) ; le message du
  09/11 00:10 de `POUR-ORCHESTRATEUR.md` (faire expirer la 896.376, ou « expire la 896 ») tient toujours.

## Fin du run précédent
- #398 (v935) mergée (`677db54`) ; TestFlight 935.412 ; fiche envoyée (« Version 844 gardée (build 844.344
  attachée, choisie par le propriétaire) ; builds en 893 »).

## Android depuis le run précédent
- Rien de publié (main à `bdc56e0`, v935).

## Polish : captures relues (iPhone 16e, build 934)
- Accueil (sombre), Journal, Tendances, Analyses › Digestion, accueil « trouvé » et « première note ».
- **Constat** : dans le Journal, la tuile « VFC (SDNN) » (la VFC de l'app Santé, écrite par l'Apple Watch) est grise
  avec l'icône par défaut (trois points) : son libellé manque à `CHIP_KEYS` (`journalChips.js`), alors que la VFC
  d'Android est rose avec l'icône du pouls.
- **En creusant** : Journal › Tendances n'a aucune courbe de VFC sur iPhone (`TREND_MEASURES` ne lit que la RMSSD,
  `hrv`) ; et la ligne « VFC (SDNN) » de l'Accueil (clé `hrv`, correctif 30) ouvre `/tendances?mesure=hrv`, une
  courbe « VFC nuit » sans données sur iPhone.
- **Correctif 56** (`TodayBySource.jsx`, `journalChips.js`, `trendsData.js`, une ligne chacun ou presque) :
  `'VFC (SDNN)': 'hrvDay'` (icône et thème de la VFC, sans norme, comme l'Accueil) ; mesure `hrvSdnn` « VFC (SDNN) »
  (rose, ms, glose « telle que la mesure l'app Santé (SDNN) »), proposée dès trois jours, jamais mêlée à la RMSSD ;
  la ligne de l'Accueil mène à `hrvSdnn`. Sur Android, sans SDNN, rien ne change.
- Tests : `dailyJournal.ios.test.js` (icône et thème), `trendsData.ios.test.js` (courbe, glose, unité commune),
  `TodayBySource.ios.test.jsx` (lien et couleur ; « VFC nuit » inchangée). Note de Nouveautés iPhone
  `2026-11-09-1000-vfc-sante-tendances-iphone`.
- Rien d'autre à corriger sur ces captures (« Et votre ventre ? » de la première note : texte voulu et testé par
  Android, `Onboarding.test.jsx`, pas propre à l'iPhone).

## Vérifications
- 46 correctifs appliqués par `scripts/upstream.sh` ; Vitest, build appstore, ESLint, tests des scripts, fiche.

## Suite
- Merge après les vérifications et les captures (Journal, Tendances) ; TestFlight ; examen bêta de la 918 dès que la
  896.376 ne bloque plus.
