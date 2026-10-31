# Run du 31/10/2026 15:33 (Paris, CET) — Nutrition : barres hachurées (POL-PLAY-86)

**Type** : 🎨 polissage (audit prévu par le run de 14:33 : Nutrition en sombre)

## Constat au démarrage
- Main à `4d417c9` (#565, journal) ; v408 publiée ; Tests, Build & Release, Play — AAB et émulateur verts.
  Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée).

## Audit `/nutrition` (variante play, démo, sombre puis clair)
- Profil, moyenne « par jour saisi », avertissement « des repas manquent », étiquette « partiel », repères ANSES et
  attribution Ciqual : lisibles, rien à redire.
- Défaut : les barres « incertain : repas manquants » (`--chart-bar-2`, #2f5a4b en sombre, #b9dccd en clair) se
  distinguaient à peine de leur piste : contraste 2,0:1 en sombre, 1,3:1 en clair (WCAG 1.4.11 demande 3:1 pour un
  élément graphique). Toute la page démo est dans cet état (repas manquants), donc presque toutes les barres.

## Fait (`Nutrition.css`)
- `.nutrition-bar-uncertain` : hachures à 135° `--chart-ref` (#6fa893, 5,7:1 sur la piste sombre) / `--chart-bar-2`.
  Les hachures disent « estimation » sans couleur d'alerte (règle 6) ; la pastille de légende suit (même classe).

## Tests
- `nutritionLegend.test.js` : 1 cas (dégradé hachuré, teinte `--chart-ref`, aucune couleur d'alerte).

## Vérifications
- `npm run test` (2 792 réussis), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual` complet (15 pages ok).
- Captures relues : `/nutrition` `--play --dark` et `--play` (clair), avant et après.

## Données
- Aucune : affichage seulement.

## Demandes iOS
- Rien de propre à Android (note de Nouveautés sans `variants`).

## Suite
- Journal → Tendances en vierge (clair et sombre).
