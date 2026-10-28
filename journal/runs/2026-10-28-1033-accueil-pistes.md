# Run du 28/10/2026 10:33 (Paris, CET) — Accueil : pistes annoncées (POL-PLAY-21)

**Type** : 🎨 Polissage play / parcours (variantes play et sideload)

## Constat au démarrage
- Main à `5df256f` (#464). Aucune PR « [Auto] » ouverte (PR #51 `cursor/*` hors routine, non touchée). Derniers
  workflows de main verts (Build & Release v335, Play — AAB, Tests, émulateur).
- Run de code. Pris : **POL-PLAY-21** (suite prévue par le run précédent).

## Fait
- `services/pistesSummary.js` : `summarizePistes(analysis)` réduit l'analyse aux titres montrés par Analyses
  (pistes repas → ventre « Oignon → ventre », puis pistes à tester du bien-être) ; `null` tant qu'il n'y a pas assez
  de jours. `rememberPistesSummary` / `readPistesSummary` (localStorage `healthtrack_pistes_summary`).
- Pourquoi un résumé mémorisé : l'analyse complète lit toutes les entrées (budget perf de l'Accueil : 1 500 lectures
  contre 16 000 pour Analyses) et sa clé de cache change à chaque écriture. Analyses écrit le résumé à chaque calcul ;
  l'Accueil le relit sans rien calculer (un résumé de la veille reste juste pour des pistes qui demandent des semaines).
- `PistesTeaser` (Accueil) : avec au moins une piste dans le résumé → « N pistes repérées », la première en une
  ligne, « Des liens repérés dans vos données, pas des causes. », carte entière lien vers Analyses (chevron). Pistes du
  ventre seulement si la carte ventre est montrée ; sur Play sans premium, une piste du ventre n'est jamais nommée
  (barre floue + « premium », comme `LockedGutLinks`), une piste du bien-être (gratuite) passe devant. Sinon, compte à
  rebours inchangé. Jamais dans Analyses elle-même.
- `Dashboard.jsx` : boutons « Vos derniers jours, dans le Journal » / « Vos tendances, dans le Journal » retirés
  (doublons de la barre d'onglets) + CSS morte.
- `deleteAllData` : la clé du résumé est effacée avec les données (elle décrit des liens de santé).
- Nouveautés : `2026-10-28-1033-accueil-pistes.json`.

## Tests (rouges avant, verts après)
- `pistesSummary.test.js` (5), `PistesTeaser.premium.test.jsx` (3 : Play sans premium, ordre, sideload),
  `TodayCards.test.jsx` (+4), `Recommendations.test.jsx` (+1 : le résumé est mémorisé), `Dashboard.test.jsx` (boutons
  retirés).

## Vérifications
- `npm run test` : 2 610 verts ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play --routes=/recommendations,/` (clair et `--dark`) : « 2 pistes repérées · Dormir un peu
  plus longtemps », cohérent avec les 2 pistes à tester d'Analyses ; `--play --empty` : compte à rebours inchangé.
  `npm run visual` complet : 15 pages ok (seul l'avertissement préexistant « AppManager already registered » sur /connectors).

## Suite
- POL-PLAY-22 (statistiques d'« Autres liens repérés » derrière le chevron), puis 18, 19, 24 à 28.
