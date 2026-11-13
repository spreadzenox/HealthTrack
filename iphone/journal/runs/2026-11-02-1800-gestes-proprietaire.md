# 2026-11-02 18:00 UTC — Les gestes du propriétaire avant la production ; Android v718

**Étape** : suivi d'Android, I9 (publication : gestes du propriétaire)  ·  **PR** : #215 (terminée), #216 (v718), journal  ·  **Android suivi** : v718 (`0218f6a`)  ·  **iOS** : 717 sur TestFlight (717.216) ; 718 sur la branche de #216  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- « qu'est ce qu'il reste à faire côté humain avant la prod ? » : réponse dans la conversation, dans l'ordre :
  bloquant (date de soumission et période de lancement ; « métadonnées manquantes » des abonnements, avec le rappel que
  les premiers abonnements partent avec une version ; statut DSA en examen ; la soumission elle-même), fortement
  conseillé (A6, l'iPhone 12), utile (App Attest, licence des poids du visage, petites demandes à Android).
- « tu peux prendre le contrôle de mon chrome pour faire tout ça ? » : pas depuis cette session (cloud, sans accès à
  son ordinateur) ; l'API App Store Connect ne sait pas activer App Attest (vérifié : capacité absente de
  `CapabilityType`) ; même avec Chrome, la connexion, les décisions, la soumission, l'invitation d'une personne et la
  transmission à la routine Android restent à lui.
- « on va déléguer à une session sur mon pc, prépare un prompt avec tout le contexte » : prompt autonome préparé
  (tâche suggérée dans l'app et fichier envoyé) : contexte et repères (dépôt public, journal, produits, prix), règles
  (connexion par lui, aucun secret, aucune dépense, jamais de soumission, ni prix ni niveau ni essai changés, rien
  écrit dans les dépôts, données personnelles jamais recopiées, « ok » avant chaque modification), cinq gestes
  (métadonnées des abonnements, App Attest et Team ID, statut DSA, préparation de la soumission sur demande,
  invitation de la testeuse) et deux blocs à recoller (routine iOS, routine Android).

## Android depuis le run précédent
- #634 (v718) : « 1er » et « 21e » avec le même exposant, dans la police Figtree (composant `Ordinal`), POL-PLAY-101 ;
  note pour toutes les variantes.

## Ce qui a été fait
- #215 (v717, page « Licences ») : captures regardées, mergée, TestFlight 717.216, fiche renvoyée.
- `scripts/upstream.sh --latest` → v718 : correctif 23 refait (import de `SnapshotWelcome` après celui d'`Ordinal`) ;
  36 correctifs, 3150 tests, build appstore ; PR #216.

## Suite
- #216 : CI, captures (onboarding, écran d'achat), merge, TestFlight 718, fiche renvoyée.
- Le compte rendu de la session Chrome du propriétaire, quand il le recollera : métadonnées des abonnements, App Attest
  (alors le droit dans l'app), statut DSA.
