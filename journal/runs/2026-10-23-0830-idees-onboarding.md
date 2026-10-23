# 2026-10-23 08:30 Paris (06:30 UTC) — Run « idées » : jalon 4 spécifié, import Health Connect du jour 1

**Type** : 💡 idées (pas de code produit) · **PR** : voir ci-dessous

## Pourquoi
- Main à `7e227de` (#288) ; Build & Release, Tests, émulateur A56, Play — AAB, fiche, Pages, Relais — déploiement :
  tous verts. Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Run de 08:30 → run « idées ». Le prochain gros run de code est le jalon 4 (onboarding, « aha », paywall soft), sans
  spécification jusqu'ici : la préparer accélère les 3 runs qui le livreront.

## Ce qui a été fait
- Lecture du code concerné : `connectors/autoSync.js`, `connectors/HealthConnectConnector.js` (`sync`),
  `pages/Connectors.jsx`, manifestes play / sideload / plugin, `PermissionDisclosure`, `useDisclosure`,
  `config/distribution.js`, `pages/Premium.jsx`, `services/today.js`.
- Veille : doc Health Connect « Read data » (règle des 30 jours, ancrée sur la première autorisation, erreur au-delà),
  RevenueCat 2026 (via SaaStr), Adapty (source tierce), revue de l'onboarding de Nerva, fiche Cara Care.
- `IDEES.md` I153–I156 ; `BACKLOG.md` VC-11 + découpage 4a / 4b / 4c du jalon 4 ; `PRODUIT.md` jalon 4, VC-11,
  critère C1, historique ; résumé de la semaine + ligne du tableau.

## Vérifications
- Journal seulement ; `npm run test` lancé avant le merge (voir la PR).

## Apprentissages / décisions
- **VC-11** : `DEFAULT_HISTORY_DAYS = 180` à la première synchro + `lastSyncAt` qui avance même quand tout échoue →
  aucun import sur une installation neuve sans `READ_HEALTH_DATA_HISTORY` (non déclarée). À confirmer sur l'émulateur
  (message exact) ; le correctif est de toute façon sans risque (bornage à première autorisation − 29 j).
- Onboarding : notifications jamais pendant l'onboarding ; jamais montré à un utilisateur existant ; « Continuer
  gratuitement » aussi visible que la croix ; 18+ par une ligne de consentement, pas de date de naissance.

## Suite
- Runs de code : 6b-2c (journaux Integrity → `enforce`), **VC-11**, puis 4a → 4b → 4c ; passe VC ensuite.
