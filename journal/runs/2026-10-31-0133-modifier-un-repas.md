# Run du 31/10/2026 01:33 (Paris, CET) — Modifier un repas à 360 px (POL-PLAY-73)

**Type** : 🎨 Polissage play

## Constat au démarrage
- Main à `ef9cc6d` (#538) : Tests, Build & Release, Play — AAB et émulateur Samsung A56 verts.
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée). Plantage du visage du 30/10 corrigé (#531) :
  retest du propriétaire attendu.

## Audit
- `npm run visual -- --play --size=360x780 --routes=/journal --click="Actions pour ce repas > Modifier ce repas"` (démo, clair).
- Défauts : dans l'éditeur de repas, la rangée « − g + kcal ✕ » (≈ 308 px) dépassait la carte du Journal (≈ 256 px
  utiles) : le bouton ✕ sortait de la carte à droite ; « Enregistrer les modifications » sur trois lignes.
- Vu, laissé tel quel : champ « Heure du repas » au format américain dans la capture (locale de Chromium ; sur le
  téléphone, format du système) ; apostrophes droites des noms Ciqual (« à l'eau »).

## Fait
- `MealEditor` : kcal de l'aliment sur la ligne du nom, à droite, en mono ; le nom passe à la ligne s'il est long.
  Partagé avec l'analyse d'une photo (vérifiée en sombre, 360 px).
- `SavedMealEditor` : bouton « Enregistrer ».

## Tests
- `MealEditor.test.jsx` : kcal dans `.mei-head`, pas dans `.mei-controls` (rouge avant, vert après) ; libellés mis à
  jour dans `Food.test.jsx` et `Journal.test.jsx`.

## Vérifications
- `npm run test` (2 755 tests), `npm run build`, `npm run lint` (6 erreurs, comme avant), captures relues : Journal →
  modifier un repas (clair), analyse photo (`--food-analysis --dark`).

## Données
- Aucune donnée, migration ni export touché.

## Demandes iOS
- Changement commun aux plateformes : note de Nouveautés sans `variants`.

## Après le merge (#539)
- Build & Release : release **v395** publiée (APK 34 517 066 octets) ; Play — AAB vert.
- Tests sur main rouge : job « Protocole montre (Java) », `curl: (22) … 404` en téléchargeant JUnit depuis Maven
  Central (URL valide, même job vert sur la PR) → échec passager ; job relancé. Le script continuait malgré l'échec
  et javac finissait en « package org.junit does not exist » trompeur.
- Seconde PR (CI) : `java-protocol-test.sh` réessaie 4 fois et s'arrête net avec « Téléchargement impossible ».

## Suite
- Retest du visage par le propriétaire ; POL-PLAY-11 (alpha) après une journée sans plantage dans Android vitals.
- Prochain audit : Repas → repas habituels et « Décrire » (démo, clair, 360 px).
