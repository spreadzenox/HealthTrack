# Run du 26/10/2026 08:33 (Paris, CET) — idées : jalon 7 prêt à coder (réintroduction FODMAP guidée, rapport PDF)

**Type** : 💡 idées (run de 8 h : pas de code produit, pas d'entrée « Nouveautés »)

## Constat au démarrage
- Main à `07e02a6` (#390, I134 étape 3). Aucune PR « [Auto] » ouverte. Semaine S44 déjà ouverte (S43 archivée au run
  de 00:33).
- Le jalon 5 est affiché et renforcé ; le jalon 7 (réintroduction FODMAP guidée + rapport PDF) n'avait qu'une ligne
  (I135) : c'est le prochain chantier de code.

## Ce qui a été fait
- Veille (sources datées dans `IDEES.md`) : fiche patient NHS Gloucestershire (PDF lu en entier : J1 portion de
  départ, J2 double, J3 triple, fenêtre de 24 h, 3 jours de symptômes minimes avant chaque test, fructanes source par
  source, sorbitol / mannitol séparés, portions de départ par groupe), blog Monash (arrêt à J1 / J2 si désagréable,
  léger = réussi, combinaisons en dernier), variantes de doses (aucune norme unique → repère général modifiable),
  contenu d'un journal utile au médecin, échelle de Bristol et seuils Rome IV (on montre la répartition, jamais le
  sous-type), technique PDF (`pdf-lib` + `fontkit` MIT, polices embarquées, Documents comme l'export JSON).
- `IDEES.md` : **I174** (réintroduction : données `fodmap_challenge` sans migration, machine à états pure, 4 écrans,
  garde-fous, premium, tests, découpage 7a–7d), **I175** (rapport PDF 2 pages, `buildReport.js` pur puis
  `renderPdf.js`, chargé à la demande), **I176** (forme des selles facultative).
- Constat : `config/premiumBenefits.js` marque `pistes-delays` « en préparation » alors que les pistes ventre avec
  délais sont affichées depuis 03:33 → à trancher au prochain run de code.
- BACKLOG (jalon 7 découpé, prochaines étapes), PRODUIT (jalon 7 🟡 spécifié, historique), résumé de la semaine.

## Vérifications
- Journal seul ; `npm run test` : 187 fichiers, **2 300** Vitest verts (+ 33 sautés).

## Suite proposée
- Run de code suivant : I134 étape 4 (facultative) ou directement **7a** (machine de réintroduction + tests, rien
  d'affiché), puis 7b, I175 étapes 1 et 2, 7c, I176, 7d. POL-1d attend P28.
