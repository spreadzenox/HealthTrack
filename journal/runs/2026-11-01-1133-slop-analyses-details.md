# Run du 01/11/2026 11:33 (Paris, CET) — Textes : détails dépliés des Analyses (SLOP-1b-8)

**Type** : ✍️ code (polissage des textes, demande du propriétaire du 31/10 vers 21:35, dernière étape dans l'app)

## Constat au démarrage
- Main à `e3c162b` (#594). Aucune PR « [Auto] » ouverte ; Build & Release, Tests, Play — AAB et émulateur verts sur main.

## Fait
- **Outil de captures** : `npm run visual -- --open-details` ouvre tous les chevrons « détails » et volets `<details>`
  d'une page (relecture de tous les textes dépliés en une capture).
- **Cartes des liens** (une vingtaine sur les données de démo) : « Le jour même : quand ce chiffre monte, le bien-être
  est meilleur. » → « Le jour même : plus haut, meilleur bien-être. » (ou « bien-être moins bon »). Même sens, moitié
  plus court, ce qui allège le gabarit répété sur chaque carte.
- **Pistes à tester** (dépliées) : « À tester : … » et la note de solidité étaient en police mono, réservée aux
  chiffres (DESIGN.md) : passées en texte. Notes réécrites : « Le lien tient même en comptant tous les facteurs
  testés. » / « Peut-être le hasard. À revoir dans quelques jours. »
- **Pistes repas → ventre** (dépliées) : « L'attente joue aussi : une réintroduction guidée aide à trancher. » retiré
  (le lien « Vérifier avec une réintroduction guidée › » est juste au-dessus).
- **Comment c'est calculé** : paragraphe du visage en 4 phrases courtes au lieu de 2 longues ; « Liens la veille »
  découpé ; habitudes et effets décalés du visage en une ligne (le délai est déjà dit plus haut).
- Ligne « Bientôt » : « ajoutez des tags à vos notes » → « Vos habitudes · à ajouter à vos notes ».
- `SLOP_WORDING` : « quand ce chiffre monte, le » et « L'attente joue aussi » bannis. Deux anciennes notes de
  Nouveautés qui citaient ces phrases sont ajustées (0933 et 26/10 0333).
- Nouveautés : `2026-11-01-1133-analyses-details.json` (commune Android / iOS).

## Vérifications
- `npm run test` : 2 810 tests verts ; `npm run lint` : 6 erreurs avant et après ; `npm run build` OK ;
  `npm run visual` complet OK (15 pages).
- Captures relues, avant (`--open-details` sur main, comme `slop-1b-6/apres-liens-sombre.jpg`) et après (clair et sombre) → `journal/captures/slop-1b-8/`.

## Demandes iOS
- Aucune concernée (note commune, pas de code natif).

## Suite
- SLOP-1 est terminé dans l'app ; le paywall est réécrit avec GOLD-b (titre « Comprendre vos bons et mauvais jours »
  proposé en I204). Prochain run de code : **GOLD-b** (P35 sans réponse : proposition appliquée — Gold mensuel
  9,99 €, pas d'essai Gold), paywall à deux niveaux, GOLD-b2 (passage Silver → Gold), banc Nutrition5k.
