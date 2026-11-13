# 2026-11-01 17:00 UTC — Relais d'Android prêt pour l'App Store ; v689 ; préparation de l'achat sur iPhone

**Étape** : I6 (abonnement), I3 (copie de secours), suivi d'Android  ·  **PR** : #181 (copie hors d'iCloud et v689) et #183 (capture pour l'examen) mergées ; #182 (rappel de fin d'essai), journal (#178)  ·  **Android suivi** : v689 (`6a24a54`)  ·  **iOS** : 689 sur `main` et sur TestFlight (689.181)  ·  **Parité** : 48 % (23/48)

## Messages du propriétaire depuis le run précédent
- Aucun nouveau depuis « j'ai transmis à la routine android » (reporté dans le run de 16:00).

## Android depuis le run précédent
- **#605 (v689) : le relais vérifie les achats de l'App Store** (I6-RELAIS-1+2), à peine 30 minutes après la
  transmission du message par le propriétaire : transaction StoreKit 2 dans le même `purchaseToken`, chaîne `x5c`
  jusqu'à Apple Root CA - G3, bundleId, environnement (Sandbox pour TestFlight), échéance, remboursement ;
  `halcya_gold…` → Gold, `halcya_premium…` → Silver ; même sortie que Google Play avec `source: 'appstore'` ;
  `renewalInfo` signé facultatif ; relais déployé. Rien dans l'app.
- #604 : banc Silver / Gold lancé, **promesse « moins d'erreurs » non confirmée** (GOLD-b6) : Gold reste décrit par ses
  20 analyses par jour (déjà la règle de `store/app-store/abonnements.md`).
- Annoncé par Android : I6-RELAIS-3 (notifications serveur V2 et leur adresse) et I6-RELAIS-6 (nom du magasin dans
  l'écran d'abonnement, liens de gestion App Store).

## Ce qui a été fait
- v689 ajoutée à #181 (35 correctifs tels quels, 3077 tests, build appstore avec la copie hors d'iCloud) : une seule
  CI macOS et une seule build TestFlight (689) pour les deux ; la CI d'avant annulée ; PARITE.
- **#182 : rappel de fin d'essai sur iPhone** (plugin `TrialReminder`, promis par l'écran d'abonnement : 2 jours avant
  le premier paiement) : `TrialReminderRule` (4 tests XCTest ; au toucher, seule la gestion des abonnements d'Apple
  s'ouvre), plugin Swift `schedule` / `cancel` / `requestNotifications` comme Android, enregistré ; inactif tant que
  l'achat est fermé.
- **#183 : capture pour l'examen d'Apple envoyée par l'API** (`--capture-examen`, entrée du workflow) : sans elle, les
  trois abonnements restent « métadonnées manquantes » ; 11 tests contre l'App Store Connect simulé.

- #181 : CI macOS verte ; sonde de sauvegarde sur les deux iPhone simulés : `Documents/Copie de secours`
  `excluded: true` avec la copie (1 fichier) ; reprise de la copie à l'onboarding (1325 mesures et les réglages, capture
  relue), « Supprimer toutes mes données » efface la copie ; aucune erreur JS ni texte d'Android ; **mergée** ;
  **TestFlight 689.181** (18:45) ; fiche renvoyée (nouvelle phrase sur la copie de secours).
- #183 : remise à jour sur main, contrôle vert, **mergée**.
- #182 : CI d'avant annulée (base dépassée), branche remise à jour après #183, nouvelle CI en cours.

## Ce qui reste pour ouvrir l'achat sur iPhone
1. Textes de l'écran d'abonnement qui disent « Google Play » (achat, annulation, gestion, rappel d'essai, « déjà
   Gold ») : I6-RELAIS-6 chez Android ; s'il tarde, un correctif iPhone.
2. `FEATURES.billing` vrai pour appstore ; captures de l'écran d'achat avec les trois formules (faux plugin des
   captures) ; capture pour l'examen envoyée (#183).
3. Partie vente des conditions et de la confidentialité de l'iPhone, paragraphe d'abonnement de la fiche (lien vers
   les conditions, exigé par Apple pour un abonnement).
4. Adresse des notifications serveur V2 (I6-RELAIS-3 d'Android) dans App Store Connect.
5. Essai d'achat sur l'iPhone 12 par TestFlight (achats de test gratuits), puis soumission par le propriétaire.

## Suite
- #182 : CI, merge ; puis journal (#178).
- Android : I6-RELAIS-6 (textes « Google Play » de l'écran d'abonnement) ; dès qu'il arrive, ouvrir l'achat sur iPhone.
- Run de dimanche 23:00 UTC : archiver le résumé de la semaine S44.
