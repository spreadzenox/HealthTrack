# 2026-11-02 16:00 UTC — Pas de nouvelle version Android ; page « Licences » (PR #632) essayée à blanc

**Étape** : suivi d'Android (préparation)  ·  **PR** : journal  ·  **Android suivi** : v714 (`df3f8e5`)  ·  **iOS** : 714 sur `main` et sur TestFlight (714.213)  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- Aucun ; la date de soumission (période de lancement) et la page d'un abonnement dans App Store Connect attendent ;
  App Attest (capacité, Team ID) et A6 aussi.

## Android depuis le run précédent
- #631 : journal seulement (audit Play de l'onboarding), pas de nouvelle version.
- PR #632 ouverte : page « Licences » (Réglages → Licences : bibliothèques, polices, modèles du visage, tables
  d'aliments, avec leur licence ; `services/thirdPartyLicenses.js`, test qui échoue si une dépendance manque).

## Ce qui a été fait
- Essai à blanc de #632 avec nos correctifs et `overlay/` : 34 correctifs sur 35 ; le correctif 26 ne s'applique plus
  (`More.jsx` : la ligne « Licences » s'insère avant la fin de la liste, contexte du correctif) ; les tests de la page
  et de la liste passent.
- Lu dans `thirdPartyLicenses.js` : sur iPhone la page dirait « Google Play Billing, Play Integrity » (filtre sur
  `features.billing`, vrai sur l'App Store), listerait AndroidX, LiteRT et ONNX Runtime (absents de l'iPhone), tairait
  TensorFlow Lite C et Capacitor iOS, et citerait les modèles valence / éveil (éteints sur iPhone).
- DEMANDES : variante et plateforme dans la liste (à transmettre). BACKLOG : ce qu'il faudra faire à la publication.

## Suite
- À la publication de #632 : correctif 26 refait, liste de l'iPhone, capture de la page, TestFlight.
