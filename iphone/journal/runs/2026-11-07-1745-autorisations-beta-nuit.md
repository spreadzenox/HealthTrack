# 2026-11-07 17:45 UTC — Autorisations du propriétaire ; #356 mergée (871.370) ; examen bêta chaque nuit

**Étape** : message du propriétaire  ·  **PR** : examen bêta chaque nuit (`claude/ios-beta-nuit`)  ·  **Android suivi** :
v871 (`19f6f34`)  ·  **iOS** : **871 sur TestFlight (871.370)** ; version 844 dans App Store Connect, build 844.344
attachée  ·  **Parité** : 67 % (30/45)

## Message du propriétaire (dans cette session, 07/11 vers 18:30, heure de Paris)
1. Merge de mes PR sur HealthTrack-iOS (squash) sans sa relecture, dès que les garde-fous sont verts ; permanent.
2. Chaque jour, après la dernière version d'Android (Alpha à 23:45) : la dernière build TestFlight ajoutée au groupe
   externe « Testeurs Halcya » et soumise à l'examen bêta d'Apple par la CI ; jamais la version de l'App Store.
3. Ces deux autorisations inscrites dans la consigne de la routine : **fait** (`update_trigger`, 17:47 UTC ; l'interdit
   « soumettre à l'examen d'Apple » précise maintenant « une version à l'examen de l'App Store », avec l'examen bêta du
   groupe externe pour seule exception).
4. Ce soir jusqu'à minuit, chaque run reprend la dernière version d'Android et la merge.

## Ce qui s'est passé
- #356 mergée par le propriétaire à 17:38 UTC (commit de merge `ab44552`, tête `e495f84` : v854 à v871 et « digestion »
  sur l'iPhone), avant la fin de sa build simulateur ; build simulateur de `main` verte ensuite.
- TestFlight automatique : **871.370** (17:45 UTC). `store-push.yml` : « Version 844 gardée (build 844.344 attachée,
  choisie par le propriétaire) ; builds en 871 » ; fiche fr-FR mise à jour (description « digestion »…).
- Lignes de blocage du merge retirées de `POUR-ORCHESTRATEUR.md` (levé par le propriétaire).
- Examen bêta chaque nuit : `scripts/store-beta-submit.mjs` (+ 6 tests), `.github/workflows/store-beta-submit.yml`,
  « À tester » en français (`store/app-store/fr-FR/testflight-a-tester.txt`, 846 caractères, « digestion », de 1 à 5),
  essai à blanc et tests ajoutés à `store-check.yml`. Le script saute ce qui est déjà fait, attend une build traitée,
  refuse tout chemin `appStoreVersion(s)`, `appStoreVersionSubmission(s)`, `reviewSubmission(s)` et ne lit jamais le lien
  public. Premier lancement cette nuit, après la dernière version d'Android.

## Suite
- Merger cette PR après `store-check.yml` ; chaque run jusqu'à minuit : dernière version d'Android, merge, TestFlight.
- Après 23:45 : `store-beta-submit.yml` sur la dernière build traitée ; relevé par `store-beta.yml`.
