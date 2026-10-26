# Run du 26/10/2026 03:33 (Paris, CET) — Pistes repas → ventre affichées dans Analyses

**Type** : 🏗️ jalon 5 (visible : entrée « Nouveautés »)

## Constat au démarrage
- Main à `adf1ec8` (#385) ; Build & Release, Play — AAB, Tests, émulateur verts. Aucune PR « [Auto] » ouverte
  (#51 `cursor/*` non touchée). Polissage POL-1 à POL-8 livré sauf POL-1d (attend P28) → suite du jalon 5.

## Ce qui a été fait
- `services/gutLinks.js` — `summarizeGutLinks(entries)` réunit les deux moteurs calibrés (`gutWindows` : notes
  horodatées 0–4 h / 4–24 h / 24–48 h ; `gutDays` : bilans du soir, le jour même / la veille) sans rien recalculer :
  seules les pistes au statut `link` (BH + porte TTS) sont montrées. Un aliment = une piste (le délai le plus net,
  les autres en « aussi : … »). États : `no_notes`, `too_early` (< 28 jours de notes = 2 × 9 + 10, le minimum de la
  porte TTS), `none`, `links`. I171 (a) : part des notes « avec l'aliment » prises dans les 2 h après un repas qui en
  contenait (notes horodatées seulement).
- **Aliments toujours mangés ensemble** (vu sur les captures : banane, café et yaourt du même petit-déjeuner de
  démo donnaient trois cartes identiques) : regroupés en une seule piste « a, b ou c → ventre » avec la phrase
  « Toujours mangés ensemble dans vos repas : vos données ne les départagent pas. » (même délai, mêmes comptes, même q).
- `components/GutLinks.jsx` (+ CSS pêche, tokens seulement) : section « Votre ventre et vos repas » en tête
  d'Analyses ; carte = titre « aliment → ventre », délai en mono, phrase avec les deux comptes, étiquette « À
  confirmer » (toujours : l'attente joue, I171 b) ; chevron : RR, q, « aussi », part des notes juste après le repas,
  « L'attente joue aussi : une réintroduction guidée aide à trancher. » Aucune piste : « Aucun aliment ne ressort
  nettement pour l'instant. On préfère attendre… ». Trop tôt : une ligne « Bientôt » (« Votre ventre et vos repas ·
  N/28 jours ») ; aucune note du ventre : rien (la carte lilas suffit, VC-12).
- Affiché seulement si `gutCardMode() !== 'hide'` (même règle que la carte « Votre ventre », POL-4) ; rien effacé.
- Calcul dans la tâche `basicAnalysis` du Web Worker (`gut`), résultat stable au passage par le cache (test).
- Carte lilas (objectif ventre) : « arrivent dans une prochaine version » → « vos pistes repas → ventre se précisent
  à chaque note (28 jours de notes du ventre au moins) » ; détails « Délais testés : … ; le jour même ou la veille
  pour le bilan du soir ».
- Captures : option `--gut-links` de `npm run visual` (bilans du soir synthétiques, gêne plus fréquente les jours
  avec banane, tirage déterministe).

## Tests
- `gutLinks.test.js` (+7) : états, effet jour par jour → une piste par aliment, I171 a en fenêtre horaire, cache
  JSON, libellés, regroupement des aliments mangés ensemble. `Recommendations.test.jsx` (+3) : carte et détails,
  ligne « Bientôt » 1/28, rien avec l'objectif « énergie ». `TodayCards.test.jsx` adapté au nouveau texte.

## Vérifications
- `npm run test` : 186 fichiers, 2 276 verts (+ 32 sautés : les bancs) ; `npm run build` OK ; lint 6 erreurs
  (inchangé) ; `npm run visual` : `/recommendations` démo clair et sombre (ligne « Bientôt 9/28 »), `--gut-links`
  clair et sombre (une piste regroupée), `--empty` (`/recommendations`, `/`) inchangés, 0 erreur JS.

## Suite
- I134 (covariables sommeil / stress / écran) ou réduire les comparaisons (aliments fréquents / groupes FODMAP)
  pour la puissance ; I171 c (réintroduction « à l'aveugle avec un proche ») avec I135. POL-1d attend P28.
