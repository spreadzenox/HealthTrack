# 2026-11-02 13:00 UTC — Android v713 ; App Attest branché sur l'analyse des repas

**Étape** : I6 (anti-abus), suivi d'Android  ·  **PR** : #210, journal  ·  **Android suivi** : v713 (`ce528bf`)  ·  **iOS** : 713 sur `main` et sur TestFlight (713.211)  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- Aucun ; deux questions attendent (date de soumission et période de lancement ; page d'un abonnement dans App Store
  Connect) ; A6 aussi.

## Android depuis le run précédent
- #629 (v713) : la garde d'intégrité du relais vérifie l'assertion App Attest de chaque analyse iPhone, sur le corps
  brut (`X-AppAttest-Key`, `-Assertion`, `-Time`), statuts `attest_passed` / `missing` / `rejected` / `unavailable`,
  bloquants seulement en `enforce` ; coupée par défaut (I6-RELAIS-5d-2). Le côté relais est complet (5a à 5d) ; reste
  à Android de l'allumer (`APP_ATTEST_MODE=observe`, Team ID).

## Ce qui a été fait
- DEMANDES : nom de l'en-tête réglé par Android (`X-AppAttest-Key`, déjà celui de #208).
- PR #210 : correctif 38 (`aiRelay.js` › `postRelay`) : corps sérialisé une fois, en-têtes App Attest signés dessus,
  sur iPhone seulement ; `iosAttestHeaders` (rien ailleurs ni en cas d'erreur) ; enregistrement retenté au plus une
  fois par heure tant que les routes sont coupées ; tests (corps exact, délai, plateforme) ; v713 suivie ; 35
  correctifs, 3127 tests, build appstore.
- README : l'action du propriétaire pour App Attest devient concrète (capacité de l'identifiant, Team ID à Android,
  me prévenir pour le droit).

- #210 : CI macOS verte (aucune erreur JS ni texte d'Android, copie de secours présente et exclue d'iCloud, geste
  réel du rapport PDF ✓ ; l'analyse IA n'est pas lancée par les captures) ; aucun écran touché ; **mergée** ;
  **TestFlight 713.211** ; fiche renvoyée.

## Suite
- Le droit App Attest (`production`) dès que le propriétaire aura coché la capacité.
