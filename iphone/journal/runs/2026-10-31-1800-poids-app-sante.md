# 2026-10-31 18:00 UTC — Nutrition : le poids de l'app Santé n'est plus « saisi »

**Étape** : I4 (Santé), suivi d'Android  ·  **PR** : #138 (correctif 35, mergée), journal  ·  **Android suivi** : v654 sur `main` (v656 pas encore publié sur Google Play)  ·  **iOS** : 654 sur `main` et sur TestFlight (654.139)  ·  **Parité** : 48 % (23/48)

## Messages du propriétaire depuis le run précédent
- Aucun. A6 et version d'iOS de l'iPhone 12 attendus.

## Ce qui a été fait
- **Android** : v655 (#571, journal) et v656 (#572, cartes de Sources au pastel de leur thème) ne sont pas encore
  passés par « Play — AAB » : `--latest` reste sur v654. Essai à blanc sur v656 : les 34 correctifs s'y appliquent
  tous ; sur iPhone, la carte de l'app Santé (`health_connect`) sera menthe, celle du temps d'écran (`phone`) lilas.
- **PR #138 : poids et masse grasse de l'app Santé** (demande du 29/10 à Android, toujours à transmettre ; le
  correctif iOS était prévu pour l'arrivée de TestFlight) :
  - le profil de Nutrition annonçait un poids de l'app Santé « (saisi le 28/10) » et taisait sa masse grasse ;
  - correctif 35 (`bodyProfile.js`, `BodyProfileCard.jsx`) : origine « health », « (app Santé, 28/10) »,
    « (app Santé) » pour la masse grasse ; un poids saisi ou de Withings garde son libellé ;
  - démo de l'iPhone : la balance passe par l'app Santé (poids, masse grasse seule), plus de Withings en direct ;
  - 4 tests rouges avant, 2 témoins, 1 test de démo ; note des Nouveautés ; 35 correctifs, tests (3020) et build
    appstore OK. CI en cours.
- `DEMANDES.md` : la demande garde son état (« à transmettre »), avec le contournement iOS.

## Fin du run
- **#138 mergée** : CI verte ; captures regardées sur l'iPhone 16e :
  - Nutrition : « 77,2 kg (app Santé, 28/10) », « Masse grasse 21,2 % (app Santé) », plus de Withings ;
  - Nouveautés : la note « correctif » en tête ; audit vide, aucune erreur JavaScript.
- **Envoi TestFlight** (run 41229898007, `main` 33001b2) : réussi, build **654.139**. Même numéro de version : la
  fiche App Store n'a pas à changer.

## Suite
- Android v656 dès sa publication sur Google Play (nos correctifs s'y appliquent déjà).
- Le reste attend le propriétaire : A6 (iPhone 12), version d'iOS de l'iPhone 12, décisions (sauvegarde iCloud,
  identifiant d'installation, AffectNet).
