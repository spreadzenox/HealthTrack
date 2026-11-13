# 2026-11-12 07:00 UTC — v1009 mergée ; AppStoreBilling enregistré une fois

**Étape** : déploiement continu, puis polissage iPhone  ·  **PR** : #473 (v1009, mergée), PR du correctif  ·
**Android suivi** : v1009 (`c853444`)  ·  **iOS** : 1008.485 chez les testeurs externes (07:17, Paris), 1009 en
route ; version 844 dans App Store Connect, build 844.344 attachée  ·  **Parité** : 67 % (31/46)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis 21:35 (10/11). Android : rien après #930.

## Fin du run précédent
- 1008.485 (v1008, #471) chez les testeurs (relevé de 06:17 UTC, examen accepté) ; 1007.484 expirée.
- #473 (v1009, correctif 63) : vérifications vertes, `js-errors.txt` et `texte-android.txt` vides ; console de la build
  de captures relue : les sondes de notifications passent avec les plugins importés (`[notification]`, `[note]`,
  `[portion]`), et les doublons `GutEvening`, `EveningNote`, `PortionReminder` (et `AppManager`, côté Android) ont
  disparu des « already registered » (53 → 44). Mergée (`1bc9fdf`) ; déploiement continu lancé.

## Correctif : AppStoreBilling enregistré une fois
- Restaient 2 « already registered » pour `AppStoreBilling` : notre correctif 24 appelait `registerPlugin` à chaque
  lecture de l'abonnement (`loadBillingPlugin`). Test d'abord (`playBilling.appstore.test.js` : deux appels, un seul
  enregistrement, le même objet ; rouge), puis le plugin gardé au niveau du module (`appStoreBilling ??= …`) ; vert.
- Les 42 autres sont `SystemBars`, réenregistré par `theme.js` d'Android à chaque changement de thème alors que
  Capacitor 8 l'enregistre déjà ; même schéma pour `PlayBilling` chez Android. Code partagé : demande (petite) dans
  `DEMANDES.md`.
- Rien de visible pour les testeurs : pas de note de Nouveautés.

## Vérifications
- `scripts/upstream.sh` (53 correctifs) ; Vitest (3819 tests), build appstore, ESLint.

## Suite
- Merge après la build macOS (console : plus d'`AppStoreBilling` en double) ; déploiement de la 1009 en cours.
