# 2026-10-27 17:59 UTC — PR #7 mergée, PR #8 réparée, connecteur Santé sur HealthKit (I4)

**Étape** : I3 (PR #8), I4 (PR #7, #9)  ·  **PR** : #7 et #8 (mergées), #9  ·  **Android suivi** : v525  ·  **iOS** : 525 (simulateur)  ·  **Parité** : 23 % (11/47)

## Déclenchement
- Tâche planifiée de 17:59 UTC, à l'heure. `main` vert. Travail en cours : PR #7 (verte) et PR #8 (rouge).

## Ce qu'Android a livré depuis le run précédent
- Rien : toujours v525 (`scripts/upstream.sh --latest`).

## Ce qui a été fait
- PR #7 (essai HealthKit) : 2e CI verte sur la branche remise à jour (48 captures, 0 erreur JavaScript, sonde
  identique, copie de secours présente) → mergée.
- PR #8 rouge : le test `bundleGuard` d'Android exige que toute feuille CSS soit chargée d'emblée
  (`src/pageStyles.js`) ; la feuille ajoutée dans `overlay/` ne l'était pas. Je n'avais lancé que les tests ciblés.
  Corrigé sans CSS (classe `.actions` d'Android), charte : pas de CSS dans `overlay/`, suite complète avant chaque
  push. Branche remise à jour sur `main`, CI relancée.
- PR #9 (I4, 1re partie) : le connecteur Health Connect lit HealthKit sur iPhone (correctif 08 refait, 13 ajouté) :
  disponibilité par HealthKit ; « accordé » dès que la demande a été faite sur l'appareil (HealthKit ne révèle
  jamais la lecture : sinon la carte dirait « Refusé » et la synchro automatique ne partirait jamais) ; VFC ni
  demandée ni lue (SDNN contre RMSSD) ; textes iPhone : carte « App Santé (montre, bague, balance…) », message
  d'indisponibilité, bouton « Autoriser l'app Santé » de l'onboarding, divulgation « Avant d'autoriser l'app
  Santé » (sans VFC, réglage dans Réglages › Santé › Accès aux données et appareils). Tests écrits d'abord.

- Simulateurs des captures passés en français (`AppleLanguages fr-FR`, `AppleLocale fr_FR`, puis redémarrage) :
  joint à la PR #9 pour économiser une CI macOS.
- `DEMANDES.md` : avant de passer le relais en `INTEGRITY_MODE=enforce` (prévu par Android « quand quelques
  testeurs auront envoyé des jetons »), laisser passer l'app iPhone ; sinon l'analyse IA des repas serait refusée
  sur iPhone. Rappelé dans le résumé du propriétaire.
- PR #8 : 2e CI verte (2624 tests, 48 captures, 0 erreur JavaScript), écart du bouton visible sur les deux iPhone
  → mergée. PR #9 remise à jour sur `main` (suite : 2628 ✅), CI relancée.
- Captures de la PR #9 (CI précédant la remise à jour) : feuille « Accès à Santé » en français (« Tout activer »,
  « Autoriser », « Refuser »), carte « App Santé (montre, bague, balance…) » et sa description iPhone, choix de la
  montre conformes. Reste : la ligne Gadgetbridge des données de démo (« … Health Connect dans Gadgetbridge »).

## Vérifications
- `scripts/upstream.sh` ✅ (13 correctifs) · suite d'Android avec les correctifs : 2628 ✅ (44 ignorés) · build web
  `appstore` ✅ · build iOS et captures : CI des PR #8 et #9.

## Suite
- Merger #9 après sa CI sur la branche à jour.
- VFC SDNN : consommée par le sous-type `heartRateVariability` dans `analysisEngine`, `baselines`, `dailyJournal`,
  `today`, `radar`, `firstImport` et `HealthRadar` : la ranger sous un sous-type à part (ignoré partout), puis
  l'afficher et lui donner sa propre norme.
- I4 : vérifier l'import réel (données de démo dans l'app Santé du simulateur, feuille acceptée par XCUITest) ;
  VFC SDNN tenue à part ; simulateurs en français.
