# Run du 29/10/2026 04:33 (Paris, CET) — Tendances vierges (POL-PLAY-38)

**Type** : 🎨 UI / ergonomie

## Constat au démarrage
- Main à `2fd8dac` (#492), tous les workflows verts (Build & Release v352, Play — AAB, Tests, émulateur A56).
- Aucune PR « [Auto] » ouverte. PR #51 (`cursor/*`) non touchée.

## Audit `npm run visual -- --play --empty`
Captures relues : Accueil, Journal (Jours, Tendances), Analyses, Sources, Montre, Réintroduction, Historique du
bien-être. Seul défaut retenu : Journal › Tendances, où « Votre forme » tient en une ligne mais « Bien-être (0–5) »
affichait un grand cadre gris vide (sous-titre « Par jour (14 derniers jours) » + message centré). Le reste est
cohérent (états vides explicites, aucun zéro trompeur).

## Fait
- POL-PLAY-38 : `WellbeingCharts` sans aucun point sur 14 jours (ni estimation du jour) → titre + une ligne
  `wellbeing-charts-empty` (« Pas encore de bien-être noté. » ou « Aucune note ces 14 derniers jours. », puis liens
  Sources et Aujourd'hui). Titre « Votre bien-être » (h3, même niveau que « Votre forme »), sous-titres h4
  « Par jour, sur 5 (14 derniers jours) » et « Par heure (aujourd'hui) ». Marge haute de `.baselines` 24 → 12 px
  (l'espace sous « Votre forme » était double).

## Tests
- `WellbeingCharts.test.jsx` : +2 (ligne discrète sans cadre ni « Par jour », titre « Votre bien-être ») ; rouges
  avant, verts après ; rendus sous `MemoryRouter` (liens).

## Vérifications
- `npm run test` : vert (2 653) ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play --empty --routes=/tendances` et `--play --dark` : captures relues (vierge : deux
  sections d'une ligne chacune ; démo sombre : graphique inchangé, titre « Votre bien-être »).

## Demandes iOS
- Note de Nouveautés commune (pas de `variants`) : l'écran existe aussi sur iPhone.

## Suite
- POL-PLAY-12 : parcours d'onboarding play pas à pas (`--onboarding`, `--click`) ; POL-PLAY-11 quand Android vitals
  le permet ; P33 au propriétaire.
