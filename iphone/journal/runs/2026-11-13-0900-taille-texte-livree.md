# 2026-11-13 09:00 UTC — Taille du texte de l'iPhone : mergée, envoi aux testeurs

**Étape** : parité (taille du texte d'iOS)  ·  **PR** : #499 (mergée), PR du journal  ·  **Android suivi** : v1019
(`340bbe1`)  ·  **iOS** : **1019.513 chez les testeurs externes** (10:29, Paris) ; version 844 dans App Store
Connect, build 844.344 attachée  ·  **Parité** : 68 % (32/47, ligne « Taille du texte du système » ajoutée)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis le 12/11 16:35. Android : toujours rien après #942 (12/11, 17:06 UTC).

## Ce run
- **#499 terminée** : Vitest vert, build simulateur et captures vertes ; XCTest « TEST SUCCEEDED » (5 tests
  `TextSizeTests`, dont le changement de taille relu dans la page) ; `js-errors.txt` et `texte-android.txt` vides.
  Captures en très grand texte (× 1,35, iPhone 16e) relues avec la police de `<html>` : onglets du Journal séparés
  (« Nutrition », « Tendances »), « Aujourd'hui » entier dans la barre du bas, Paramètres, Sources, Tendances, accueil
  vierge corrects ; Accueil à la taille normale inchangé. Mergée (squash) sur main à jour.
- **Déploiement** : TestFlight → 1019.513 ; fiche (version 844 gardée, builds en 893) ; soumission refaite 5 min plus
  tard (pas encore traitée la 1re fois) → groupe « Testeurs Halcya », examen bêta accepté, `IN_BETA_TESTING` à 09:29 UTC ;
  nettoyage : 1019.510 expirée ; restent 844.344 et 1019.513.
- PARITE : ligne « Taille du texte du système » (✅) ; BACKLOG : entrée cochée ; résumé : la limite « taille du texte »
  retirée de « ce qui ne pourra pas marcher pareil ».

## Suite
- Fin du déploiement ; essayer sur l'iPhone 12 (Réglages › Luminosité et affichage › Taille du texte) ; prochaine
  version d'Android.
