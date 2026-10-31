# Run du 31/10/2026 21:33 (Paris, CET) — « Quand consulter » et éviction (POL-PLAY-91, -92)

**Type** : 🎨 polissage (suite directe du run « idées » de 20:33)

## Constat au démarrage
- Main à `1a7560f` (#576, journal) ; Tests et émulateur A56 verts sur main. Aucune PR « [Auto] » ouverte
  (#51 `cursor/*` non touchée).

## Fait
- POL-PLAY-91 (I202) : `WHEN_TO_SEE_DOCTOR` (`services/today.js`) ajoute « un proche (parent, frère, sœur) qui a eu
  un cancer du côlon ou une maladie inflammatoire de l’intestin ». Texte statique, repris tel quel par la carte
  « Votre ventre » (détails), la réintroduction (`Disclaimer`) et le rapport PDF (`buildReport.whenToConsult`).
- POL-PLAY-92 (I203) : `Reintroduction.jsx` → `ChooseGroup` commence par une ligne pêche `.fodmap-when` : « À faire
  après 2 à 6 semaines de repas pauvres en FODMAP, si votre ventre va mieux. » Ne bloque rien, ne compte rien.

## Tests
- `TodayCards.test.jsx` : la phrase contient l'antécédent familial ; `Reintroduction.test.jsx` : la ligne
  d'éviction est affichée avec sa classe. `buildReport` et `renderPdf` passent avec la phrase plus longue.

## Vérifications
- `npm run test` (2 800 réussis), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual --play`
  complet ; `/reintroduction --fodmap` en clair et en sombre relus (ligne pêche lisible, contraste des tokens pêche).

## Données
- Aucune : textes statiques.

## Demandes iOS
- Rien de propre à Android (note de Nouveautés sans `variants`).

## Suite
- Liste de polissage : Premium et paywall de l'onboarding en vierge sombre, Historique du bien-être vue Mois en démo
  sombre.
