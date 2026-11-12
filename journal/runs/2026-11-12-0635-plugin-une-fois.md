# Run 12/11 06:35 — Plugin AppManager enregistré une fois (POLISH-AUDIT-3)

**Type** : code (mode polish).

## Contexte
- Main 79f228f (#929) : « Build & Release », « Tests », émulateur A56, « Play — AAB » verts. Aucune PR « [Auto] »
  ouverte (seule la #51, hors routine).
- File du mode polish vide côté code (POLISH-SIM-* faits ; PROP-SIM-* attendent maquette et accord ; CYCLE-3 attend
  P48). Suite de l'audit visuel : `npm run visual -- --play` (clair, démo, 18 pages).

## Constat
- Écrans regardés sans défaut à corriger : Aujourd'hui, Journal › Jours, Tendances, Agir, Sources, Réglages.
  Agir vide garde la phrase du rapport médecin : voulu par ORG-1 (« par défaut, sans bouton »), rien changé.
- Rapport visuel : sur `/connectors`, « Capacitor plugin "AppManager" already registered. Cannot register plugins
  twice. » : `registerPlugin('AppManager')` dans `devices/phoneApps.js` et dans `components/WatchDiagnostic.jsx`.

## Fait
- Test d'abord : `src/pluginRegistration.test.js` (chaque nom passé à `registerPlugin` n'apparaît que dans un module
  de `src/`), rouge puis vert.
- `phoneApps.js` exporte `NativeAppManager` ; `WatchDiagnostic.jsx` l'importe.
- Pas d'entrée Nouveautés : rien de visible.

## Vérifs
- `npm run test` (3463 + 1 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual -- --play
  --routes=/connectors` (plus aucun message console), `npm run visual` complet.

## Suite
- Simulations du run « idées » de 08:35 ; PROP-SIM-11, 12, 13 (maquettes) ; CYCLE-3 attend P48.
