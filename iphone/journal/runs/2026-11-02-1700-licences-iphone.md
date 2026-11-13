# 2026-11-02 17:00 UTC — Android v717 : page « Licences », version iPhone

**Étape** : suivi d'Android  ·  **PR** : #215 (v717), journal  ·  **Android suivi** : v717 (`1981d25`)  ·  **iOS** : 717 sur `main` et sur TestFlight (717.216)  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- Aucun ; la date de soumission (période de lancement) et la page d'un abonnement dans App Store Connect attendent ;
  App Attest (capacité, Team ID) et A6 aussi.

## Android depuis le run précédent
- #632 (v716) : page « Licences » ; #633 (v717) : rien d'Android sur l'App Store, `IOS_LICENSES` à remplir par la
  routine iOS (reprise de notre demande du 2/11, sans qu'on ait eu à la transmettre).

## Ce qui a été fait
- `scripts/upstream.sh --latest` → v717 : correctif 26 refait (ligne « Licences » dans `More.jsx`) ; le sous-titre
  « Conditions » de l'iPhone devient celui d'Android (« Utilisation, abonnement et remboursements », vrai depuis
  l'ouverture de l'achat), test mis à jour.
- Correctif 39 : `IOS_LICENSES` (TensorFlow Lite C, Apache-2.0 ; Capacitor pour iOS, MIT) ; modèles valence / éveil
  tus sur l'App Store (éteints sur iPhone) ; 4 tests.
- Page `/licences` ajoutée aux captures ; note de Nouveautés iOS.
- 36 correctifs, 3146 tests, build appstore. PR #215.
- DEMANDES : la demande « Licences » close.

- #215 : CI macOS verte ; captures regardées (Licences : TensorFlow Lite C et Capacitor pour iOS, rien d'Android ;
  Réglages : « Conditions » en « Utilisation, abonnement et remboursements », ligne « Licences ») ; aucune erreur JS ni
  texte d'Android ; **mergée** ; **TestFlight 717.216** ; fiche renvoyée.

## Suite
