# 2026-10-23 10:30 Paris (08:30 UTC) — Jalon 4a : onboarding, écrans 1 à 3 et mécanique

**Type** : 🧭 chantier produit (jalon 4, découpage I154 : 4a)

## Constat
- Main à `a480fb1` (#290) ; Build & Release, Tests, émulateur A56, Play — AAB : verts. Aucune PR « [Auto] » ouverte
  (seule #51 `cursor/*`, non touchée). Run de code (10:30).

## Ce qui a été fait
- `app/src/settings/onboarding.js` : état local `healthtrack_onboarding` (`done`, `endedBy` completed / skipped /
  existing, `goal`, `tracks`, `watch`, `step`, `maxStep` pour I156), objectifs, suivis cochés d'avance par objectif,
  `needsOnboarding()` : oui seulement si jamais fait **et** base vide ; base non vide → noté « existing » sans rien
  afficher ; base illisible → non (on ne le montre jamais par erreur).
- `app/src/pages/Onboarding.jsx` (+ `.css`, chargé d'emblée via `pageStyles.js`) : route `/bienvenue` hors Layout
  (plein écran, sans onglets) ; écran 1 de la maquette (illustration menthe, titre, 3 tuiles mono, 3 objectifs
  numérotés 01/02/03, ligne cadenas, « 18 ans ou plus ») ; écran 2 « Que voulez-vous suivre ? » (cases) ; écran 3
  « Avez-vous une montre ? » (Health Connect / compatible Huawei / pas de montre, aucune autorisation) ; barre de
  progression + `01/03` mono ; « Retour » et « Passer » dès l'écran 2 ; reprise à l'écran atteint. Fin : Huawei ou
  Health Connect → Sources (en attendant l'écran Health Connect du 4b), sinon Aujourd'hui.
- `Layout.jsx` : `useOnboardingRedirect` (une fois à l'ouverture, pas sur le retour Withings).
- `visual-check.mjs` : `/bienvenue` dans les pages par défaut ; onboarding noté fait ailleurs (sauf `--onboarding`) ;
  `--click` sait aussi cocher un choix radio ou une case.
- Changelog `2026-10-23-1030-bienvenue.json`.
- Au passage : espace manquante « Halcyavous » dans la phrase d’accueil vide (`Dashboard.jsx`).

## Vérifications
- `npm run test` : **1 973 verts** sur 158 fichiers (18 nouveaux tests : 10 `onboarding`, 8 `Onboarding` dont la redirection — installation
  vierge → onboarding ; base non vide → jamais).
- `npm run build` OK ; `npm run lint` : 6 erreurs, identiques à main.
- Captures relues : `--empty --play --onboarding --routes=/` → l'Accueil redirige vers l'écran 1 ; écrans 2 et 3
  (`--click`), clair et sombre.

## Suite
- **4b** : écran Health Connect (divulgation `health_connect` + `requestPermissions`), import avec progression réelle,
  « aha » des 30 derniers jours avec sources. **4c** : visage, premier geste, paywall soft (play). Puis I155 (l'objectif
  règle l'Accueil) et I156 (compteur dans le diagnostic exporté).
