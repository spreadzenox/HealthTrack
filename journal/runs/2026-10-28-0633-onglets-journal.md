# Run du 28/10/2026 06:33 (Paris, CET) — Onglets du Journal sur petit écran (POL-PLAY-17)

**Type** : 🎨 UI / ergonomie

## Constat au démarrage
- Main à `110f838` (#458), Build & Release v332 verte, aucune PR « [Auto] » ouverte (seule #51, `cursor/*`). Run de code.
- Suite de l'audit écran par écran (POL-PLAY-12) sur les pages les moins revues : historique du bien-être, Montre,
  Nutrition, Tendances (`npm run visual -- --play`, données de démo).

## Fait
- **Défaut trouvé (POL-PLAY-17)** : à 360 px de large (petits Android), les sous-onglets du Journal (Jours, Repas,
  Nutrition, Tendances) avaient tous la même largeur sans marge intérieure : « Tendances » remplissait sa pilule et
  touchait la bordure (sur l'A56, 412 px, c'était juste à la limite).
- **Correction** (`TabBar.css`) : largeur selon le libellé (`flex: 1 1 auto`), marge intérieure 8 px, `nowrap`,
  écart 6 px ; sous 380 px, marge 6 px et 15 px de police.
- **Nouveau contrôle dans `npm run visual`** : « TEXTE QUI DÉBORDE (« … ») » signale les boutons, liens et onglets
  dont le libellé dépasse son cadre ou, s'il a une bordure ou un fond, touche ses bords à moins de 4 px (mesure par
  `Range`). Avertissement, pas un échec. Avant la correction : seulement Journal, Repas, Nutrition, Tendances
  (« Nutrition », « Tendances ») à 360 px ; après : rien, en démo et en vierge (`--play --empty --size=360x780`).
- FLAKY-UPDATEBANNER coché : déjà réparé par #448 (attente du pilote avant le clic), case restée ouverte.
- Autres remarques de l'audit (rangées, non traitées) : voir POL-PLAY-18 à 20 dans BACKLOG.

## Vérifications
- `npm run test` : 2 596 verts ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play` (412 px), `--size=360x780` (démo et `--empty`), `--dark` sur Journal et Tendances :
  15 pages sans erreur, captures des onglets relues en clair, sombre et 360 px.

## Suite
- POL-PLAY-18 à 20 ; POL-PLAY-11 (alpha après une journée sans plantage) ; lire le résumé du relais (« dont N robots »).
