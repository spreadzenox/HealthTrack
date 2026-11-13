# 2026-10-27 16:10 UTC — Captures défilées (I2), copie de secours de la base (I3)

**Étape** : I2 (audit) puis I3 (données)  ·  **PR** : #5, #6  ·  **Android suivi** : v524  ·  **iOS** : 524 (simulateur)  ·  **Parité** : 23 % (11/47)

## Déclenchement
- Tâche planifiée de 15:59 UTC arrivée à 16:10. `main` vert après le merge de la PR #4 (run 18 ✅).

## Ce qu'Android a livré depuis le run précédent
- #438 (journal : 100522 en test interne avec la lecture au déverrouillage) : sans objet sur iOS.
- #439 « Accueil vierge sans montre supposée ; « Tester un groupe FODMAP » lisible » : code web partagé, arrive tel
  quel. Les 10 correctifs s'appliquent sur v524.

## Ce qui a été fait
- PR #5 (I2) : le mode captures photographie aussi les écrans suivants des pages longues (Sources ×4, Vos données
  et Paramètres ×3, défilés d'environ 80 % de l'écran) et le 3e écran de l'onboarding vierge (choix de la montre) :
  22 captures par iPhone au lieu de 18 (1re CI : derniers écrans en double et limite de 10 min atteinte sur
  l'iPhone 16e → défilement réduit, limite à 15 min). Tests du plan écrits d'abord. Les captures défilées
  montrent « Version 524 » en bas de Paramètres (numéro de version ✅) ; zones sûres ✅ (iPhone 16e et 17 Pro) → parité 23 % et, dans Sources, la carte
  Health Connect qui garde sa description Android (→ I4).
- Recherche (I3) : IndexedDB n'est pas durable dans WKWebView (guide « Data Storage » de Capacitor ; politique de
  stockage de WebKit 2023 ; `navigator.storage.persist()` peu fiable) : sources et plan dans `RECHERCHE.md`.
- PR #6 (I3, 1re partie) : `overlay/app/src/ios/snapshot.js` + correctif `11-copie-de-secours-iphone.patch`. Dans
  l'app iPhone : stockage persistant demandé ; au démarrage (après 10 s) et à chaque passage en arrière-plan, le
  même JSON que « Télécharger la sauvegarde » est écrit dans Documents (`Halcya-copie-de-secours.json`, visible
  dans Fichiers › Sur mon iPhone › Halcya, sauvegardé par iCloud avec l'app) ; une base vide n'écrase jamais la
  copie ; « Vos données » le dit. Restauration : « Importer » (aperçu, ajouter ou remplacer), comme pour tout
  fichier de sauvegarde. Le script de captures relève en fin de parcours le dossier Documents et l'arborescence
  `Library/WebKit` (preuve de la copie, emplacement d'IndexedDB pour la question d'iCloud).

## Vérifications
- `scripts/upstream.sh` ✅ (11 correctifs) · suite d'Android avec les correctifs : 2617 ✅ (44 ignorés) · build web
  `appstore` ✅ · build iOS et captures : CI des PR #5 et #6.

## Suite
- I3 : au démarrage, base vide alors qu'une copie existe → proposer de la restaurer ; import d'un fichier
  d'Android sur iPhone (test avec un export réel anonymisé de la démo) ; vérifier sur la CI où vit IndexedDB.
- I2 : finir l'audit avec les captures défilées (carte Santé, capteurs Bluetooth, bas de Paramètres).
