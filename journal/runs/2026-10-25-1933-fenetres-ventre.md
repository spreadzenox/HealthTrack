# Run du 25/10/2026 19:33 (Paris, CET) — I132 : fenêtres repas → ventre

**Type** : 🧭 chantier produit (jalon 5, moteur seul, aucun écran touché)

## Constat au démarrage
- Main à `459fd4c` (#376), tous les workflows verts (Build & Release #278, Play — AAB #89, émulateur, tests).
  Aucune PR « [Auto] » ouverte ; #51 `cursor/*` non touchée.
- POL-1d attend toujours P28 → jalon 5. Aucun moteur repas → ventre n'existait (le moteur actuel ne relie que le
  bien-être, au jour près).

## Ce qui a été fait
- `services/statistics.js` : `fisherExactTwoSided(a, b, c, d)` (test exact, adapté aux petits effectifs d'un journal).
- `services/gutWindows.js` : unité = chaque note `gut` horodatée ; pour chaque aliment (nom normalisé) et le facteur
  `fodmap_eleve` (score ≥ 2 de la table générale, hypothèse de départ) × chaque fenêtre `GUT_WINDOWS`
  (0–4 / 4–24 / 24–48 h, demi-ouvertes, repas strictement avant la note), part de notes gêne/douleur avec et sans,
  RR (Haldane), p de Fisher, q de BH sur les combinaisons testées ; `too_early` sous `MIN_EXPOSED_NOTES` = 8 /
  `MIN_UNEXPOSED_NOTES` = 8 (provisoire, I133) ; `link` si q < 0,1. Chaque fenêtre porte son hypothèse « (repère
  général) ». Le ventre n'entre jamais dans l'estimateur du bien-être.

## Vérifications
- Tests écrits avant le module (rouges faute de module) : fenêtres sans trou, exposition seulement avant la note,
  effet simulé à 6 h → lien 4–24 h et rien ailleurs (graine 7, puis ≥ 7/10 jeux de 9 semaines, aucune autre fenêtre),
  5 jeux nuls sans lien, « trop tôt » sur 3 jours, comptage des combinaisons, entrées invalides ignorées.
- Mesure hors dépôt (40 graines, 6 semaines) : puissance 24/40, autre fenêtre 2/40, jeux nuls avec un lien 3/40
  (< 1/10 visé par I133). En 9 semaines : 8/10.
- Vitest, lint, build, `npm run visual` : voir l'annexe.

## Suite
- I133 : seuil N et q choisis par simulation (permutation par blocs de jours, autocorrélation), puis I134 (repas du
  même jour démêlés, covariables), puis affichage dans l'onglet Analyses (cartes « facteur → effet », barres par délai).
- Limite connue, à traiter avec I133 : des notes prises surtout les mauvais jours biaisent la comparaison (le
  « calme » est sous-noté) ; le rappel du soir aide.
