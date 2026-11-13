# 2026-10-28 12:01 UTC — Suppression de la copie vérifiée (PR #31, mergée), Android v553, copie proposée à l'onboarding (PR #32)

**Étape** : I3  ·  **PR** : #31 (mergée), #32  ·  **Android suivi** : v553 (était v551)  ·  **iOS** : 551 sur `main`, 553 en PR (simulateur)  ·  **Parité** : 30 % (14/47)

## Déclenchement
- Tâche planifiée de 11:59 UTC, reçue à 12:01. Aucun message du propriétaire depuis le run précédent.
- `main` : 3818c65 (#30), CI de push verte (run 104).
- PR #31 : CI en cours depuis 11:18 (run 105), plus longue que d'habitude : 54 min, dont 48 de captures. Il n'y a pas d'erreur ; la sonde `[suppression]` est arrivée au bout et a écrit `fin`.

## Ce qui a été fait
- **CI de #31 verte** (run 105, 12:12). Sur les deux iPhone simulés :
  - `[suppression] avant {"count":1925,"copie":true}` puis `après {"entries":1925,"count":0,"copie":false}` ;
  - rappels et aller-retour des données toujours bons ;
  - 68 captures, 0 erreur JavaScript.
- Captures d'Android v551 regardées sur l'iPhone 16e (390 points de large, comme l'iPhone 12) :
  - Accueil : bien-être, tuiles, ventre ; la carte lilas des pistes est plus bas ;
  - Analyses : « Pistes à tester » et « Autres liens repérés » en une phrase, « Piste solide ».

  Zones sûres et barre d'onglets correctes. Branche à jour de `main` vérifiée, **#31 mergée** (96249cb).
- **Android v553** (`scripts/upstream.sh --latest`) : le correctif 06 ne s'appliquait plus. Android #468 a repris nos demandes ; la page Données dit maintenant « la sauvegarde du téléphone ».
  - Correctifs 06 et 11 refaits : même phrase sur iPhone (copie de secours dans Fichiers), branche Android sur la nouvelle phrase.
  - Empreintes des correctifs 06, 09, 11, 12 et 15 (`Data.jsx`) mises à jour : ils s'appliquent directement, sans repli à trois voies.
- **Demandes reprises par Android (#468)** : `DEMANDES.md` mis à jour.
  - Le relais laisse passer l'iPhone (`X-Integrity-Status: no_plugin`, déjà envoyé par l'app, ou `X-Platform: ios`).
  - Les 3 notes de Nouveautés propres à Android sont marquées.
  - Le texte de sauvegarde est neutre ; l'abonnement App Store est noté dans le BACKLOG d'Android.
  - Nouvelle petite demande : marquer aussi la note « Données : la sauvegarde du téléphone ».
- **Offre de la copie de secours à l'onboarding** : branche préparée au run de 11:01, `main` fusionnée (conflits du journal et de `captureMode` : version de la branche, `main` = contenu de #31), v553 ajouté, PR #32.
- Suite d'Android avec les 23 correctifs : **2722 passés** ; build `appstore` ✅.

- Préparé ensuite (branche `claude/ios-i3-import-fichier`, empilée sur #32, poussée sans PR) : **import par le
  sélecteur de fichiers, le geste réel**. La sonde `probeFileImport` :
  - écrit un ancien fichier de sauvegarde inventé (tableau nu, 2 notes datées de 2020) dans Documents, visible dans Fichiers › Sur mon iPhone › Halcya ;
  - ouvre Vos données sans recharger ;
  - laisse le nouveau test d'interface `DonneesUITests/testImporterUnFichierDepuisFichiers` toucher « Choisir un fichier à importer » et choisir le fichier dans le sélecteur ;
  - touche ensuite « Ajouter à mes données » et recompte la base.

  1 test écrit d'abord ; suite : 2723 ✅. Le test d'interface n'a encore jamais tourné : il imprime l'arbre d'accessibilité à chaque étape manquée, pour l'ajuster au premier essai sur la CI.

- Commencé ensuite **I6, l'abonnement App Store** (branche `claude/ios-i6-storekit`, partie de `main`, poussée sans
  PR ; plan dans `BACKLOG.md`) :
  - `BillingRule` (HalcyaRules, 5 tests XCTest) rend les deux produits App Store sous la forme des formules de
    Google Play ;
  - un test Vitest passe cette forme à `describePlans` d'Android : 2 formules, essai de 14 jours, économie 16 % ;
  - plugin Swift `AppStoreBilling` (StoreKit 2 : formules, achat, abonnements en cours, achats arrivés hors du
    parcours) enregistré mais inactif côté JS, tant que le relais ne vérifie pas les achats d'Apple.

  Correctif 24 (`loadBillingPlugin()` de `playBilling.js`) : sur iPhone, ce plugin à la place de rien. **PR #33**
  ouverte en parallèle pour compiler tôt : `swift test` (dont `BillingRule`) ✅ et build Xcode avec StoreKit ✅
  (run 108, 12:28) ; captures en cours. Suite : 2716 ✅.

## Suite
- CI de #32 :
  - captures `restauration-onboarding` (carte au-dessus du premier écran : texte, zones sûres) et `restauration-reprise` ;
  - `[restauration] après {"bouton":true,"count":1925}` ;
  - `[suppression]` toujours bon ;
  - si tout est vert → merger, « Sauvegarde du téléphone » reste 🟡 (réglages non repris) mais la reprise devient un geste.
- Ensuite : `main` fusionnée dans `claude/ios-i3-import-fichier`, PR ; lire `[import] fichier` (attendu `après = avant + 2`)
  et la capture `import-apres` ; puis #33 (I6) : captures inchangées → merger après
  #32 (`main` fusionnée d'abord) ; ensuite fichier `.storekit` et `SKTestSession` pour un achat d'essai sur simulateur.
