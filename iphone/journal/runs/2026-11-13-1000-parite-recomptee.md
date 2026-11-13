# 2026-11-13 10:00 UTC — Parité recomptée : 70 %

**Étape** : PARITE (lignes en retard)  ·  **PR** : PR du journal  ·  **Android suivi** : v1019 (`340bbe1`)  ·  **iOS** :
1019.513 chez les testeurs externes (10:29, Paris) ; version 844 dans App Store Connect, build 844.344 attachée  ·
**Parité** : **70 %** (33/47)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis le 12/11 16:35. Android : toujours rien après #942 (12/11, 17:06 UTC), 17 h
  (signalé le 13/11 05:05).

## Ce run
- Relecture des lignes non vertes de `PARITE.md` : deux étaient en retard sur le travail fait.
  - « Test fermé » (TestFlight externe) : ❌ « A6 » alors que le groupe « Testeurs Halcya » reçoit chaque build depuis le
    9/11 (déploiement continu depuis le 10/11) → ✅, avec la preuve (relevé `IN_BETA_TESTING` de la 1019.513).
  - « Anti-abus des crédits IA » (App Attest) : ❌ alors que plugin, branchement sur l'analyse (correctif 38) et droit
    dans l'app signée sont faits (BACKLOG) → 🟡 : reste l'essai sur un vrai iPhone, sans effet sur le compte.
- Recompte par script des sections 1 à 4 : 55 lignes, 33 ✅, 7 — et 1 ⛔ exclues → 33/47 = **70 %**.
- Build de main après #499 en cours (TestFlight déjà fait : 1019.513).

## Suite
- Prochaine version d'Android ; build de main de #499 à vérifier ; essais sur l'iPhone 12 (geste de retour, taille du
  texte, App Attest).
