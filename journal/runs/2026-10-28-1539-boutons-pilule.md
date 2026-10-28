# Run du 28/10/2026 15:39 (Paris, CET) — Boutons pilule partout (POL-PLAY-24)

**Type** : 🎨 UI (variantes play et sideload, CSS commun avec l'app iPhone)

## Constat au démarrage
- Main à `c89a5b8` (#473), v340 verte (Build & Release, Play — AAB, Tests, émulateur). Aucune PR « [Auto] » ouverte
  (PR #51 `cursor/*` hors routine, non touchée).

## Fait (POL-PLAY-24)
- `App.css` `.btn` : `border-radius: var(--radius-pill)` (avant `--radius` 12 px), `min-height: var(--button-height)`
  (52 px, DESIGN.md), contenu centré en `inline-flex` ; `.btn-secondary` contour 2 px (avant 1 px).
- `.upload-btn` (Photo / Galerie / Décrire du Journal) en pilule.
- Boutons compacts : `.connector-btn` (Sources) et boutons du bandeau de mise à jour (sideload) gardent leur taille avec
  `min-height: var(--tap-min)` (44 px) ; bandeau en pilule aussi.
- `.settings-link-btn` (`Food.css`) : `display: flex` pour garder le libellé centré avec la hauteur minimale.

## Tests
- `src/buttonShape.test.js` (4 tests, échouaient avant) : `.btn` pilule + hauteur, `.upload-btn` pilule, 44 px pour
  les compacts, aucune règle `.btn` ne remet un rayon autre que pilule.

## Vérifications
- `npm run visual -- --play` sur `/`, `/settings`, `/connectors`, `/premium`, `/montre`, `/food`, `/data` (démo,
  clair), `/settings` et `/connectors` en `--dark`, `/` et `/connectors` en `--empty` : pilules partout, aucun débordement,
  « Désactiver » compact dans la carte météo, « Restaurer un achat » / « Plus tard » en contour 2 px.
- `npm run test` : 2 619 verts ; lint 6 erreurs (inchangé) ; build OK.

## Suite
- POL-PLAY-25 (textes « tout reste ici » honnêtes ; « Tout reste sur cet appareil » encore visible en tête de Sources),
  puis 26 à 28.
