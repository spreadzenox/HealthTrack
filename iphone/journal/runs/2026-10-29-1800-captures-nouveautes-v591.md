# 2026-10-29 18:00 UTC — v590 mergée (#67) ; bandeau des Nouveautés dans les captures corrigé ; Android v591

**Étape** : suivi d'Android, outil de captures  ·  **PR** : #67 (mergée), #68  ·  **Android suivi** : v591  ·  **iOS** : 590 sur `main`, 591 en PR  ·  **Parité** : 49 % (23/47)

## Messages du propriétaire depuis le run précédent
- Aucun. A1 reste en cours. (Déclenchement reçu à 18:00, prévu à 17:59.)

## Ce qui a été fait
- **Merge de #67** : CI verte sur `3d6bb36` (46 min) ; 110 captures, 0 erreur JavaScript ; import, export, rapport
  +2 et notifications rangées sur les deux iPhone. Sources regardée (iPhone 16e, données et vide) : titre « Ce que
  lit Halcya » au-dessus de la lecture du visage, comme le veut v590. Branche contenant `main` (`c851d5e`),
  squash-merge → `6ebe1c9`.
- **Écart vu sur ces captures** : un bandeau « Nouveau : Rapport PDF : plus de zéros trompeurs et 13 autres
  changements » en tête de chaque page. Cause : le mode captures marquait « vue » la note la plus récente de tout
  l'historique (`ALL_CHANGELOG[0]`), la note de v590 cachée sur iPhone ; absente des Nouveautés de l'iPhone,
  `getUnseenEntries` annonçait toutes les autres. L'app, elle, n'est pas touchée : l'onboarding et le bandeau
  marquent la dernière note de la variante (`CHANGELOG`). **#68** : `lastSeenChangelogId` prend `CHANGELOG[0]`
  (test d'abord, rouge puis vert). Leçon dans la charte (§ suivi d'Android) : cacher une note au suivi de sa
  version, jamais après qu'un iPhone l'a vue.
- **Android v591** (#507) : Journal vierge en couleur, trois tuiles (photo d'un repas, ventre ou bien-être, ajouter
  une source) ; code partagé, aucun correctif touché, note vraie sur iPhone. Suite d'Android : 2862 passés ; build
  appstore faite.

## Suite
- CI de #68 : plus de bandeau des Nouveautés sur les captures ; `vide-journal` avec les trois tuiles ; puis merger.
