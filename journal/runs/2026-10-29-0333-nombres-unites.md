# Run du 29/10/2026 03:33 (Paris, CET) — Nombres et unités insécables (POL-PLAY-37)

**Type** : 🎨 UI / ergonomie

## Constat au démarrage
- Main à `5488719` (#491), tous les workflows verts (Build & Release v351, Play — AAB, Tests, émulateur A56).
- Aucune PR « [Auto] » ouverte. PR #51 (`cursor/*`) non touchée.

## Fait
- POL-PLAY-37 : `fixFrenchSpacing` (déjà appliqué à l'affichage sur `#root`, POL-PLAY-36) lie aussi
  - un nombre à son unité courte (hPa, kcal, cal, bpm, pas, km, cm, mm, ms, min, mg, µg, kg, ml, Mo, Go, °C, h, j, g,
    l, m, s, %, €, °), sauf si une lettre suit (« 2 mois », « 5 grammes » inchangés) ;
  - les groupes de milliers (« 3 553 », « 12 480 »).

## Tests
- `frenchSpacing.test.js` : +3 (unités, mots non touchés, milliers) ; rouges avant, verts après.

## Vérifications
- `npm run test` : vert (2 651) ; un premier passage CI a échoué sur `noHardcodedPrice` (« 4,99 € » dans la note de Nouveautés, ajoutée après le test local) : exemple retiré ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play` sur `/connectors`, `/`, `/journal`, `/premium` : captures relues ; carte météo
  « 1004 hPa (−8) » sur une seule ligne, tuile « 10 085 » pas, rien ne déborde.
- Scripts de l'émulateur : recherche de texte déjà insensible aux espaces insécables (run précédent).

## Demandes iOS
- Note de Nouveautés commune (pas de `variants`) : vaut aussi pour l'app iPhone.

## Suite
- Poursuivre l'audit écran par écran (POL-PLAY-12) ; POL-PLAY-11 quand Android vitals le permet ; P33 au propriétaire.
