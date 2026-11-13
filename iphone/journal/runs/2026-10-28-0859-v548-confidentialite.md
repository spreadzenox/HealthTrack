# 2026-10-28 08:59 UTC — Android v548, manifeste de confidentialité (PR #28)

**Étape** : suivi d'Android, I9  ·  **PR** : #28  ·  **Android suivi** : v548  ·  **iOS** : 545 sur `main` (548 avec #28)  ·  **Parité** : 30 % (14/47)

## Déclenchement
- Tâche planifiée de 08:59 UTC, à l'heure. `main` : d8b19fe (#27), CI de push en cours (run 96). PR #28 ouverte à
  08:39 : Vitest ✅, tests Swift ✅, build ✅, **manifeste de confidentialité et chiffrement vérifiés dans l'app
  construite** ✅, captures en cours.

## Ce qu'Android a livré depuis le run précédent (v545 → v548)
- #463 : une piste « avec / sans » (alcool, sport le soir, écran tard…) n'est dite « solide » qu'à partir de 8 jours
  de chaque côté (`statistics.js`, `behaviorTags.js`) : analyse partagée, arrive telle quelle ; note de Nouveautés
  vraie sur iPhone.
- #461, #462 : journal d'Android (dont un audit écran par écran de la version Play, POL-PLAY-21 à 28 : à relire pour
  la parité des écrans).
- Les 21 correctifs s'appliquent ; suite : 2690 ✅ (code de sortie 0) ; build `appstore` ✅.

## Ce qui a été fait
- PR #28 : suivi de v548 ajouté (un cycle de CI au lieu de deux).

- Audit écran par écran d'Android (POL-PLAY-21 à 28) relu : **POL-PLAY-25** (textes « tout reste sur cet appareil »
  à rendre honnêtes, sauvegarde Google) vaut aussi pour l'iPhone (sauvegarde iCloud du téléphone) : quand Android
  réécrira ces textes, vérifier qu'ils restent justes sur iPhone (formule neutre ou variante) ; POL-PLAY-28 (titre
  « Health Connect ») déjà remplacé par « App Santé » sur iPhone ; les autres points sont du code partagé.
- Préparé pendant la CI (branche `claude/ios-i3-donnees`, empilée sur #28, poussée sans PR) : **sonde des données**
  (`probeDataRoundtrip`) : toute la base exportée comme par « Exporter », écrite dans Documents comme le fait l'app,
  relue, réimportée en fusion (rien ne doit s'ajouter), fichier d'essai retiré ; 2 tests écrits d'abord ; suite :
  2692 ✅.

## Suite
- CI de #28 : merger ; puis ouvrir la PR de `claude/ios-i3-donnees`.
- Relire l'audit écran par écran d'Android (POL-PLAY-21 à 28) pour la parité des écrans (§2 de `PARITE.md`).
- I3 : import d'un export Android sur iPhone par le sélecteur de fichiers (test d'interface) ; I6 : essai de
  StoreKit 2 sur simulateur avec un fichier de configuration StoreKit.

## Fin du run (09:35 UTC)
- CI de #28 verte (run 98 ; 68 captures, 0 erreur JavaScript ; les trois rappels toujours vérifiés jusqu'à
  l'historique ; manifeste et chiffrement vérifiés dans l'app construite) ; page Analyses regardée (v548).
  **PR #28 mergée** (1697b08). Branche de la sonde des données remise sur `main` et ouverte en PR #29.
- Message du propriétaire (≈ 09:45 UTC) : « j'ai transmis le tout » — les 4 demandes en attente de `DEMANDES.md`
  (intégrité, abonnement App Store, variantes des Nouveautés, textes de sauvegarde) sont transmises à la routine
  Android ; état mis à jour, à suivre dans ses livraisons (suivi d'Android à chaque run).

