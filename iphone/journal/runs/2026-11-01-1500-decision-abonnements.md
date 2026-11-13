# 2026-11-01 15:00 UTC — Décision : sortie avec les abonnements ; Gold dans le plugin App Store

**Étape** : I6 (abonnement), suivi d'Android  ·  **PR** : #177 (Gold dans le plugin App Store), journal (#178)  ·  **Android suivi** : v683 sur `main`  ·  **iOS** : 683 sur `main` et sur TestFlight (683.177)  ·  **Parité** : 48 % (23/48)

## Messages du propriétaire depuis le run précédent
- « Ok qu'est ce qu'il reste à faire avant de passer en prod ? » : réponse dans la conversation (prêt : version,
  TestFlight, fiche ; reste à lui : A6, A5, la copie de secours dans iCloud, relecture et soumission ; deux options :
  sortir gratuit tout de suite, ou avec les abonnements après A4 et le relais d'Android).
- « je veux sortir avec les abonnements :) » : **décision**. Chemin donné dans la conversation et en tête du résumé :
  A4 maintenant (contrat Paid Applications, banque, W-8BEN, contacts, statut de professionnel DSA), transmettre à la
  routine Android le message prêt à coller (`DEMANDES.md`), puis la routine crée les abonnements par l'API et ouvre
  l'achat sur iPhone.

## Ce qui a été fait
- `DEMANDES.md` : message prêt à coller pour la routine Android (vérification des achats App Store par le relais,
  niveau lu par préfixe d'identifiant, notifications serveur V2, mêmes droits et crédits).
- BACKLOG (I6) : la liste de ce qu'il faut pour vendre sur iPhone, dans l'ordre (A4, produits par l'API, relais,
  écran d'achat conforme à Apple, textes « compte Apple », rappel de fin d'essai, essai TestFlight).
- Android v685 (#601, passage Silver → Gold sans double abonnement sur Google Play) en cours d'envoi sur Google
  Play : essai à blanc avec la branche Gold, tout passe ; sur iPhone, Apple gère lui-même la montée dans un groupe.
- PR #177 (Gold dans le plugin App Store) : CI macOS en cours.

## Suite
- #177 : CI, merge ; suivre Android v685 ; journal (#178) mergé en dernier.
- Dès A4 « Actif » : créer le groupe et les abonnements par l'API (script à écrire sur le modèle de `store-push.mjs`).
- Run de lundi 2/11, 00:00 à Paris (dimanche 23:00 UTC) : archiver le résumé de la semaine S44.
