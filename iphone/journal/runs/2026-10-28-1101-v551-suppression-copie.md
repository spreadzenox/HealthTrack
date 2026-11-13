# 2026-10-28 11:01 UTC — Sauvegarde mesurée (PR #30, mergée), copie de secours effacée avec les données, Android v551 (PR #31)

**Étape** : I3  ·  **PR** : #30 (mergée), #31  ·  **Android suivi** : v551 (était v548)  ·  **iOS** : 548 sur `main`, 551 en PR (simulateur)  ·  **Parité** : 30 % (14/47)

## Déclenchement
- Tâche planifiée de 10:59 UTC, reçue à 11:01. Aucun message du propriétaire depuis le run précédent.
- `main` : f66bc5c (#29), CI de push en cours (run 102). PR #30 : CI en cours (run 103, captures depuis 10:30).
- `scripts/upstream.sh --latest` : **v551** (6e9e9d3), les 21 correctifs s'appliquent.

## Ce qui a été fait
- **CI de #30 verte** (run 103, 11:10). Sur les deux iPhone simulés :
  - `swift test` (dont `DeviceMarker`) ✅, build Xcode ✅, 68 captures, 0 erreur JavaScript ;
  - rappels et aller-retour des données toujours bons (1925 mesures).
- **Ce que la sonde a montré** (`[sauvegarde]`) :
  - `Documents` (copie de secours, 775 Ko) : `excluded:false` → iCloud l'emporte ;
  - **la base IndexedDB de WKWebView** (`Library/WebKit/fr.jpesquet.sante/WebsiteData/Default/<hash>/<hash>/IndexedDB`, 2,8 Mo) : **`excluded:true`, exclue par WebKit lui-même**. Le localStorage, sous le même dossier, l'est donc aussi. Ni l'app ni Capacitor ne posent cette marque ;
  - `device_marker` : `excluded:true` ; `repère {"restored":false}`.

  Conséquence : sur iPhone, la sauvegarde du téléphone emporte la copie de secours, pas la base. Après une restauration, l'app repart vide (onboarding compris), et la copie se restaure par « Vos données › Restaurer la copie de secours ». Les réglages ne sont pas repris. « Sauvegarde du téléphone » passe ❌ → 🟡 dans `PARITE.md`.
- Description de #30 corrigée avant le merge : elle disait à tort que les données suivaient la sauvegarde. Branche à jour de `main` vérifiée, **#30 mergée** (3818c65).
- **Défaut trouvé et corrigé** (branche `claude/ios-i3-restauration`, PR #31) :
  - « Supprimer toutes mes données » vidait la base mais laissait la copie de secours de Documents. Elle contient toutes les entrées et le profil, est visible dans Fichiers et part dans la sauvegarde iCloud : la promesse « Efface de ce téléphone vos repas, notes, mesures… » n'était pas tenue sur iPhone ;
  - correctif 22 (`deleteAllData.js`, 2 lignes) : `deleteDeviceSnapshot()` après la base. Les sauvegardes exportées par la personne restent ;
  - tests écrits d'abord : 4 dans `snapshot.test.js`, 1 dans `services/deleteAllData.ios.test.js` (la copie est effacée après la base) ;
  - sonde de capture `probeDeleteAll`, en dernier (`[suppression] avant / après`), 2 tests.
- **Suivi d'Android v551** (#464 journal ; #465 l'Accueil annonce les pistes ; #466 Analyses, liens en une phrase) :
  - code web partagé, arrive tel quel ;
  - nouvelle clé `healthtrack_pistes_summary`, déjà dans la liste effacée par « Supprimer toutes mes données ».
- Suite d'Android avec les 22 correctifs : **2713 passés** ; build `appstore` ✅.

- Préparé ensuite (branche `claude/ios-i3-copie-onboarding`, empilée sur #31, poussée sans PR) : **la copie de
  secours proposée au premier écran de l'onboarding** (`SnapshotWelcome.jsx` en `overlay/`, correctif 23 :
  2 lignes d'`Onboarding.jsx`) — l'onboarding revient après une restauration iCloud (le localStorage n'y est pas
  non plus), alors qu'à l'Accueil la synchro Santé remplirait la base avant l'offre. « Reprendre mes données » =
  import « ajouter » (entrées et profil) ; « Commencer sans ». Sonde `[restauration]` (base vidée, copie gardée,
  onboarding rouvert sans recharger, captures `restauration-onboarding` et `restauration-reprise`). 5 + 1 tests
  écrits d'abord ; suite : 2719 ✅ ; builds `appstore` et captures ✅.

## Suite
- CI de #31 :
  - captures Accueil et Analyses (v551) à regarder ;
  - `[suppression]` attendu : `avant {"count":1925,"copie":true}`, `après {"entries":1925,"count":0,"copie":false}` → merger.
- Puis : `main` fusionnée dans `claude/ios-i3-copie-onboarding`, PR ; regarder les deux captures de restauration
  (zones sûres, texte) et `[restauration] après {"bouton":true,"count":1925}`.
- Ensuite : import réel par le sélecteur de fichiers (« Sur mon iPhone › Halcya » est visible dans Fichiers : `UIFileSharingEnabled`) ; puis I6 StoreKit 2 (`.storekit` + `SKTestSession`).
