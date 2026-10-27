# Run du 27/10/2026 10:33 (Paris, CET) — Forme des selles (I176)

**Type** : 🏗️ code (jalon 7 : I176, prévu après le rapport PDF)

## Constat au démarrage
- Main à `4f0f374` (#426), tous les workflows verts (Build & Release v311, Play — AAB, abonnements, Pages, émulateurs) ;
  aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Chantier FODMAP (N1–N6c) terminé ; le run précédent proposait 9a (i18n, invisible) ou I176. Choix : **I176**, visible,
  utile au rapport PDF (ce que le médecin regarde en premier) et prévu dans l'ordre du jalon 7.

## Ce qui a été fait
- `services/stool.js` : 3 formes (dures 1–2, normales 3–5, liquides 6–7), 7 types de Bristol décrits par nous (la carte
  de la Rome Foundation est sous droits), `stoolPayload` (le type précis fixe la forme), lecture tolérante,
  `stoolCounts` (période, `null` sans note). Entrée `stool` `{ form, bristol? }`, source `app_stool`.
- `StoolLine.jsx` dans la carte « Votre ventre » (donc objectif « Mon ventre » seulement) : « + Selles » → Dures /
  Normales / Liquides en un geste ; « Préciser le type (échelle de Bristol) » → 7 choix numérotés ; confirmation
  « Selles notées : Normales, à 10:41. ». **Aucune lecture IndexedDB ajoutée à l'Accueil** (budget de lectures).
- Journal : « Selles » + « Dures · type 2 », supprimable (« cette note des selles ») ; source « Selles (app) ».
- Rapport PDF : `report.stool` dans `buildReport`, section « Forme des selles » en page 2 (« N notes sur N jours :
  dures (Bristol 1–2) … ») + « un jour sans note ne veut pas dire sans selles » ; absente sans note.
- Pas un facteur : `analysisEngine` (switch explicite) et les moteurs repas → ventre ignorent `stool` (aucune
  incidence sur la règle anti-circularité ; idée I176 b : second Y du ventre, plus tard).
- Aucune migration : nouveau type d'entrée dans le magasin générique ; export / import JSON génériques.
- Nouveautés : `2026-10-27-1033-forme-des-selles.json`.

## Vérifications
- Tests : `stool.test.js` (4), `TodayCards.test.jsx` (+2), `Journal.test.jsx` (+1), `buildReport.test.js` (+1),
  `renderPdf.test.js` (section présente sur 12 semaines avec 42 notes, toujours 2 pages ; absente à vide).
  `npm run test` : **2 532** verts (+ 44 sautés) ; `npm run build` OK ; lint : 6 erreurs, comme avant.
- Captures regardées : Accueil `--click="+ Selles"` (clair) et `--dark --click="+ Selles > Préciser le type…"` :
  pastilles pêche lisibles, cibles ≥ 44 px ; `npm run visual` complet et `--empty --light` : 30 pages « ok », 0 erreur JS.

## Suite
- 9a (socle i18n) ou 7d ; POL-1d dès P28.
