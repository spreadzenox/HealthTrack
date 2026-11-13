# 2026-11-01 08:00 UTC — Offre Gold d'Android reportée sur iPhone, identifiants des abonnements corrigés

**Étape** : I6 (abonnement), préparation  ·  **PR** : celle-ci (abonnements et journal)  ·  **Android suivi** : v675 (aucune nouvelle version publiée)  ·  **iOS** : 675 sur `main` et sur TestFlight (675.163)  ·  **Parité** : 48 % (23/48)

## Messages du propriétaire depuis le run précédent
- Aucun.

## Ce qui a été fait
- **Android** : rien de publié depuis la v675 ; #592 ne touche que son journal (textes restants à reprendre, offre
  Gold proposée au propriétaire, P35). Rien à suivre dans l'app.
- **Offre Gold (P35 d'Android, 1/11 08:33) reportée dans `store/app-store/abonnements.md`** : Gold mensuel seul au
  lancement (9,99 € ou 10,00 €), annuel à 79,99 € plus tard, pas d'essai Gold ; Silver = l'abonnement « premium »
  d'Android, 4,99 €/mois ou 29,99 €/an, essai de 14 jours sur l'annuel.
- **Identifiants des abonnements iPhone corrigés avant toute création** : Silver garde `halcya_premium_annuel` et
  `halcya_premium_mensuel`, comme le produit Silver d'Android, le plugin `AppStoreBilling` et le fichier StoreKit de
  la CI ; le brouillon `halcya_silver_mensuel` du 31/10 est abandonné (un identifiant d'Apple ne se réutilise
  jamais) ; Gold : `halcya_gold_mensuel` (et `halcya_gold_annuel` si décidé). Un seul groupe, Gold au niveau 1.
- **Le piège de double facturation relevé par Android (GOLD-b2) n'existe pas sur iPhone** : dans un même groupe,
  Apple ne garde qu'un abonnement actif (montée tout de suite avec remboursement au prorata, descente au
  renouvellement). Noté pour le relais dans `DEMANDES.md` (formule lue dans le `productId` du JWS ; après une
  descente, Gold jusqu'au renouvellement).
- BACKLOG (I6) mis à jour.

## Suite
- Suivre la prochaine version d'Android.
- I6 : quand Android aura branché Gold dans `playBilling.js` (GOLD-b), même forme côté iPhone : produits Gold dans le
  fichier StoreKit de la CI et dans la règle de conversion, puis achat d'essai Silver → Gold sur simulateur.
- Run de lundi 2/11, 00:00 à Paris (dimanche 23:00 UTC) : archiver le résumé de la semaine S44.
