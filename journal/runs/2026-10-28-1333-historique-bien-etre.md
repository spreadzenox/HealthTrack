# Run du 28/10/2026 13:33 (Paris, CET) — Historique du bien-être : jours et couleurs

**Type** : 🎨 UI (variantes play et sideload)

## Constat au démarrage
- Main à `f1fe166` (#469), v338 verte. Aucune PR « [Auto] » ouverte (PR #51 `cursor/*` hors routine, non touchée).

## Fait (POL-PLAY-18)
- `WellbeingHistory.jsx`, `axisLabels` : en semaine, `weekday: 'short'` sans point, deux premières lettres
  (« di lu ma me je ve sa ») au lieu de `narrow` (« D L M M J V S », mardi et mercredi identiques).
- `WellbeingHistory.css` : barres « Expressions » en `--mint-label` (menthe = bien-être) au lieu de `--lilac-bar`
  (lilas = pistes). Contraste correct en clair (#0B6B53) et en sombre (#6FE0B8).

## Tests
- `WellbeingHistory.test.jsx` : « étiquette les 7 jours de la semaine sans ambiguïté » (échouait avant : lettres
  seules) ; 5 verts.

## Vérifications
- `npm run test` : 2 614 verts ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play --routes=/bien-etre` clair et `--dark` (démo) : axe « je ve sa di lu ma me », barres
  menthe, rien ne déborde.

## Suite
- POL-PLAY-19 (écran Montre), puis 24 à 28.
