# Run du 31/10/2026 20:33 (Paris, CET) — Idées : « Quand consulter » relu, réintroduction après l'éviction

**Type** : 💡 idées (journal seul, aucun code produit)

## Constat au démarrage
- Main à `2f9a2ae` (#575, journal) ; v413 publiée ; Tests, Build & Release, Play — AAB et émulateur A56 verts.
  Aucune PR « [Auto] » ouverte (#51 `cursor/*` non touchée).

## Fait (suite proposée par le run « idées » du 31/10 08:33)
- ameli.fr « quand consulter » : toujours 403. Relu à la place : FMC-HGE POST'U 2022 (J.-M. Sabaté, résumé ACG 2020)
  et l'extrait de VIDAL Recos (mise à jour 19/12/2022).
- Comparé à `WHEN_TO_SEE_DOCTOR` (`services/today.js`) : il manque **l'antécédent familial de cancer du côlon ou de
  MICI** → I202, POL-PLAY-91.
- Comparé à `Reintroduction.jsx` : rien ne dit que la réintroduction suit 2 à 6 semaines d'éviction → I203,
  POL-PLAY-92 (ligne statique, ne bloque rien).
- Vérifié : le journal des selles (Bristol, I176) ne déduit aucun sous-type, conforme.
- Fiche Play et I197 : déjà livrés (POL-PLAY-62, 30/10) ; rien à reprendre.

## Fichiers
- `journal/IDEES.md` (I202, I203), `journal/BACKLOG.md` (POL-PLAY-91, -92), `journal/PRODUIT.md`, `journal/README.md`.

## Vérifications
- Journal seul ; `npm run test` lancé avant la PR (garde-fou).

## Demandes iOS
- Aucune concernée (pas de note de Nouveautés).

## Suite
- Prochain run de code : POL-PLAY-91 puis -92 (petits, testables), puis la liste de polissage (Premium et paywall de
  l'onboarding en vierge sombre, Historique du bien-être vue Mois en démo sombre).
- Prochain run « idées » : relire les recommandations SNFGE quand l'actualisation annoncée paraîtra ; sinon, veille
  règles Play santé de novembre.
