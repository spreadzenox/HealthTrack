# 2026-11-02 05:00 UTC — Renouvellement des abonnements iPhone transmis au relais

**Étape** : I6 (abonnement), suivi d'Android  ·  **PR** : #199, journal  ·  **Android suivi** : v703 (`a798e1f`)  ·  **iOS** : 703 sur `main` et sur TestFlight (703.197)  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- Aucun ; deux questions attendent (date de soumission et période de lancement ; page d'un abonnement dans App Store
  Connect) ; A6 aussi.

## Android depuis le run précédent
- Rien de publié depuis v703 (#619). PR ouvertes : #620 (sodium, essayée au run précédent) et #621 (Analyses :
  habitudes pas encore comparables rangées dans « Bientôt », POL-PLAY-98) : essai à blanc de #621, les 33 correctifs
  s'appliquent ; sa note de Nouveautés vaut pour toutes les variantes.

## Ce qui a été fait
- DEMANDES relues contre le code actuel d'Android (lecture seule) : « Formules Silver et Gold » est faite (v689, v691),
  marquée ✅ ; les petites demandes sur les notes de Nouveautés, le profil (poids de Health Connect) et le bouton de
  l'onboarding restent à transmettre (rien de changé chez Android ; contournées côté iPhone).
- Trou trouvé avant les premiers abonnés : le relais lit depuis v689 le `renewalInfo` signé par Apple (renouvellement
  automatique, période de grâce), mais ni le plugin iPhone ni le code partagé ne l'envoyaient. Effet : `autoRenewing`
  faux pour tout achat fait sur iPhone, donc « Silver actif · jusqu'au … » au lieu de « renouvellement le … », jamais
  « Abonnement annulé », jamais de période de grâce.
- PR #199 : le plugin `AppStoreBilling` joint `renewalInfo` à chaque achat (`Product.SubscriptionInfo.status`, même
  `originalID`) ; correctif 37 (`entitlement.js`, `playBilling.js`) qui le transmet au relais (achat, « Restaurer un
  achat » et relecture à l'ouverture, événement `purchasesUpdated`) ; Google Play inchangé. Tests : 5 Vitest, XCTest
  StoreKit (JWS en trois parties à l'achat d'essai) ; 34 correctifs, 3110 tests et la build appstore passent dans le
  conteneur.

- Première CI de #199 : Swift compilé, Vitest vert ; StoreKit Test rouge : `renewalInfo` vide à l'achat d'essai (la
  conversion précédait `finish()`). Correctif poussé : statut lu sur la transaction (`subscriptionStatus`, iOS 17+),
  sinon sur le groupe ; le test termine la transaction avant de la rendre, comme le plugin, et dit pourquoi s'il
  manque encore.
- Vu dans la même CI, sans lien avec #199 et déjà présent sur `main` (#196) : le geste réel du rapport PDF échoue
  depuis #184 (« Créer le PDF » introuvable : le faux magasin des captures met l'app en version gratuite, la carte
  montre « Débloquer ») ; inscrit au BACKLOG.

- Deuxième CI de #199 verte (StoreKit Test : les 3 tests passent, `renewalInfo` présent ; captures, Vitest ; aucune
  erreur JS ni texte d'Android) ; **mergée** (au run suivant, 06:40 UTC). Pas de TestFlight propre : la v705 qui suit
  l'emporte.

## Suite
- Faux magasin des captures limité à l'écran d'achat (BACKLOG) : PR #200, avec Android v705.
