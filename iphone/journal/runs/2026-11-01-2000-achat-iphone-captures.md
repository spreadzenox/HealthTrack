# 2026-11-01 20:00 UTC — Achat sur iPhone : CI verte, capture défilée de l'écran d'abonnement

**Étape** : I6 (abonnement)  ·  **PR** : #184 (achat sur iPhone, v693) mergée ; journal  ·  **Android suivi** : v693 (`066a6e4`)  ·  **iOS** : 691 sur `main` et sur TestFlight (691.183)  ·  **Parité** : 48 % (23/48)

## Messages du propriétaire depuis le run précédent
- Aucun ; la question sur la période de lancement (soumettre après le 20/11, ou l'exclure pour l'iPhone) attend sa
  réponse.

## Android depuis le run précédent
- #610, #611 : journal seulement (audit de la version Play vierge, I6-RELAIS-7) ; rien dans l'app : v693 reste suivie.

## Ce qui a été fait
- #184 : première CI macOS **verte** (build, XCTest, achat d'essai StoreKit : 3 tests, captures, Vitest) ; aucune
  erreur JS, aucun texte d'Android. Captures relues :
  - écran d'abonnement : Silver et Gold de l'App Store, avantages, « Toujours gratuit » ; les formules, les prix, le
    bouton et les mentions de renouvellement sont sous le pli ;
  - Nouveautés : « Version installée : 693 », notes de l'iPhone (abonnements, copie de secours).
- Capture défilée ajoutée (`/premium` dans `SCROLLS` : « premium-2 ») pour voir les prix, l'essai, le renouvellement
  et les liens, et pour servir de capture pour l'examen d'Apple ; seconde CI en cours.

- Seconde CI verte ; **capture « premium-2 » relue : l'écran d'achat est complet** (Silver / Gold, annuel 29,99 €
  « soit 2,50 € par mois » et −50 %, mensuel 4,99 €, frise de l'essai, « Essayer 14 jours gratuitement », « Puis
  29,99 € par an. Rappel 2 jours avant la fin de l'essai. Annulable à tout moment dans l'App Store. », « Restaurer un
  achat · Conditions · Confidentialité ») ; **#184 mergée** ; TestFlight 693 et captures 6,9" lancés.

## Suite
- TestFlight 693 ; fiche (paragraphe « Abonnements facultatifs ») ; capture pour l'examen envoyée
  (`capture_examen: iphone-17-pro-max-demo-clair-premium-2.png`) ; journal mergé en dernier.
- Run de dimanche 23:00 UTC : archiver le résumé de la semaine S44.
