# 2026-11-13 08:00 UTC — Taille du texte : le rem, comme Android

**Étape** : parité (taille du texte d'iOS)  ·  **PR** : #499 (en cours)  ·  **Android suivi** : v1019 (`340bbe1`)  ·
**iOS** : 1019.510 chez les testeurs externes ; version 844 dans App Store Connect, build 844.344 attachée  ·
**Parité** : 67 % (31/46)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis le 12/11 16:35. Android : toujours rien après #942 (12/11, 17:06 UTC).

## Ce run
- **#499, premier essai vert mais pas mergé** : XCTest au vert (dont `TextSizeTests`), 8 captures en très grand texte
  (iPhone 16e, texte × 1,35) regardées : le texte grandit bien, mais dans le Journal « Nutrition » et « Tendances » se
  chevauchent et la barre du bas coupe « Aujourd'… ». Cause : `-webkit-text-size-adjust` multiplie le texte **après**
  les plafonds des mises en page communes (`font-size: min(1em, 4.5cqi)` des onglets, `min(1em, 17cqi)` de la barre,
  NAV-LIBELLE-320 d'Android), alors que le zoom du texte d'Android agrandit le rem (commentaire de `useNarrowBox.js`
  d'Android).
- **Corrigé** : `TextSize.swift` multiplie maintenant la police de `<html>` (le rem), comme Android ; les plafonds en
  largeur jouent pareil ; tests et note de Nouveautés ajustés (le test des notes iPhone refuse le mot « Android »).
  Vérifié dans le conteneur : `scripts/upstream.sh`, tests `src/ios` et `src/data`, build appstore, lint. Nouvelle build
  macOS lancée.
- Le passage en grand texte ajoute ~12 min aux captures (49 min au lieu de 37) : acceptable sous la limite de 90 min.

## Suite
- #499 : captures en grand texte à relire (onglets du Journal, barre du bas, Paramètres, accueil vierge), merge,
  TestFlight, testeurs.
