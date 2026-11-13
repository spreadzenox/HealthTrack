# 2026-11-08 18:00 UTC — Nouvel accueil (décision du propriétaire) ; Android v916

**Étape** : décision du propriétaire + suivi d'Android  ·  **PR** : nouvel accueil  ·  **Android suivi** : v916
(`76eda0b`)  ·  **iOS** : 914 sur TestFlight (914.394, version 893) ; 896.376 en examen bêta ; version 844 dans App Store
Connect, build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md`, ligne de 18:45 : **Décision du propriétaire (08/11)** : nouvel accueil (ACC-1 à ACC-10) ; sur iPhone,
  la carte principale dit Santé ; vérifier la lecture du visage à l'ouverture seulement. Reportée dans le résumé.

## Fin du run précédent
- #380 (v914, correctif 30 refait) : trois vérifications vertes, Accueil regardé (pas d'hier retirés, « VFC (SDNN) »
  gardée), mergée (`2afab7d`) ; TestFlight **914.394** ; fiche envoyée (version 844 et build 844.344 inchangées).

## Android depuis le run précédent (v914 → v916)
- #838 : nouvel accueil (tuto, objectifs multiples, sources, trouvé, visage, première note, Gold) ;
  `services/onboardingFlow.js` (`healthStoreName()` : « Santé » sur iOS) ; `settings/onboarding.js` (`FLOW_VERSION` 2,
  `goals`). #839 : Tendances, libellés de l'humeur à l'horizontale. #840 (v917) : « Play — AAB » encore en cours.

## Ce qui a été fait
- Correctifs de l'accueil repris sur le nouvel écran : 08 réduit à Sources et au connecteur ; 46 et `PermissionsStep`
  retirés (Santé, météo et temps d'écran sur « Branchez vos sources », caméra sur l'écran du visage : la décision du
  6/11 « toutes les autorisations pendant l'accueil » reste tenue) ; 23 refait (copie de secours au 1er écran, iPhone
  seulement : sinon les tests d'Android tombaient sur `parseBackup`) ; 45 complété (`IMPORT_SPAN` : « 6 derniers mois »
  sur iPhone, `IOS_FIRST_IMPORT_DAYS` = 180) ; 52 nouveau (texte du temps d'écran : « L'iPhone demande votre accord
  (Face ID ou code) » au lieu de « Android ouvre un réglage ») ; 48 refait (Android a ajouté « Et votre ventre ? » à
  `ALLOWED`, texte validé par le propriétaire).
- Visage : sur iPhone `faceAppOpen` est vrai et le natif n'annonce pas `unlockAvailable` : seul « Quand vous ouvrez
  Halcya » est proposé ; vérifié par un test.
- Mode captures : écrans de l'accueil rouverts par `lastScreen` (objectifs, sources, trouvé, visage, première note ;
  2e carte du tuto) ; tests mis à jour.
- Nouveautés : la note d'Android (« Health Connect… ») masquée sur iPhone (correctif 28), note iPhone équivalente.
- Vérifié en local : 44 correctifs, Vitest 3586 tests, build appstore, ESLint.

## Suite
- Merge après les vérifications et les captures des écrans de l'accueil (Santé, temps d'écran, visage), puis
  TestFlight et fiche ; v917 au run suivant ; passage des personas iPhone sur la version du soir, examen bêta après 23:45.
