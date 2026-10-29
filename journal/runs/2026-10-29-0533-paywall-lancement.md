# Run du 29/10/2026 05:33 (Paris, CET) — Paywall du lancement (POL-PLAY-39)

**Type** : 🎨 UI / ergonomie

## Constat au démarrage
- Main à `4c83636` (#493), tous les workflows verts (Build & Release v353, Play — AAB, Tests, émulateur A56).
- Aucune PR « [Auto] » ouverte. PR #51 (`cursor/*`) non touchée.

## Audit de l'onboarding play pas à pas (POL-PLAY-12)
`npm run visual -- --play --empty --routes=/bienvenue --click="Mon ventre > Continuer > …"` : 01 objectif, 02 ce que
vous suivez, 03 montre (« Pas de montre »), 04 premier geste du ventre (clair et sombre), 05 paywall soft (sans et avec
`--subscription=launch`). Écrans 01–04 cohérents. Défaut retenu sur le 05 en période de lancement : le titre
« Premium offert pendant le test » était répété mot pour mot dans un cadre en bas, avec la date coupée
« jusqu'au 18 / nov. 2026 ».

## Fait
- POL-PLAY-39 : `Premium.jsx` en période de lancement → phrase d'accueil « Merci de tester l'app ! Jusqu'au <date>,
  tout ce qui suit est débloqué : vous n'avez rien à payer, aucune carte bancaire n'est demandée. », plus de cadre
  `paywall-active` (Paramètres garde `describeEntitlement`). `fixFrenchSpacing` : insécables jour–mois–année
  (mois abrégés et complets, « 1er »). `entitlement.shortDate` : « 1er déc. 2026 » en français.

## Tests
- `frenchSpacing.test.js` +1 (dates), `entitlement.test.js` et `Premium.test.jsx` mis à jour (« 1er déc. », une seule
  mention) ; rouges avant, verts après.

## Vérifications
- `npm run test` : vert (2 654) ; lint 6 erreurs (inchangé) ; build OK.
- Captures relues : onboarding 05 en lancement (clair), `/premium` en lancement (sombre).

## Demandes iOS
- Note de Nouveautés commune (pas de `variants`) : le paywall de lancement existe aussi sur iPhone.

## Suite
- POL-PLAY-12 : onboarding avec Health Connect (`health`, `aha`) et lecture du visage (`--face=on`) ; POL-PLAY-11
  quand Android vitals le permet ; P33 au propriétaire.
