# 2026-10-20 14:30 Paris (12:30 UTC) — Habitudes et effets décalés sur l'humeur estimée

**Type** : 🔴🙂 code (consigne du 18/10 au soir, point 6 « science personnelle » sur la Y automatique)  ·  **PR** : #232

## Pourquoi
- Main à `803be26` (#231), aucune PR « [Auto] » ouverte, aucun diagnostic de l'A56 dans `journal/diagnostics/`
  (signalement du 19/10 15:05 corrigé par #221 / #228, confirmation sur l'appareil toujours attendue).
- Prochaine étape du backlog sans diagnostic : habitudes (tags) et effets décalés sur l'humeur estimée. Sans aucune
  note (le cas du propriétaire), la section visage des Analyses ne comparait que les variables continues ; les tags
  du soir et les effets à J+1..3 n'existaient que pour les notes.

## Ce qui a été fait
- `behaviorTags.computeTagEffects(entries, { outcomeByDay })` : bien-être comparé = la Map jour → humeur estimée au
  lieu des notes ; les tags déclarés restent ceux des entrées `wellbeing` (même sans score) ; en mode humeur estimée,
  un soir **mesuré** (écran tard, sport, voyage) compte même si ce jour-là n'a pas assez de lectures (seul le jour où
  on lit l'effet en a besoin). Sans option : comportement inchangé (39 tests existants verts).
- `faceMoodDays.computeFaceMoodCorrelations` (statut `ok`) renvoie aussi `tagEffects` et `laggedEffects`
  (`computeLaggedEffects` sur `faceMoodAnalysisEntries`) ; `action` / `againstNorm` forcés à nul (D6 : pas de levier
  tiré d'une Y estimée). Le tag `stress` (côté Y) reste exclu par `computeTagEffects`.
- `Recommendations.jsx` : `FaceMoodHabits` dans `FaceMoodSection` (cartes nettes + effets décalés, habitudes
  incertaines repliées, « En cours de collecte »), cartes réutilisées avec le libellé « humeur estimée » ; note de
  méthode complétée.

## Tests
- Vitest : **1 621 verts** (+5) — `faceMoodDays.test.js` (+4 : tag du soir → lendemain, stress jamais comparé ;
  sens inverse montré tel quel ; soir mesuré sans lecture ce jour-là — vérifié rouge sans le correctif ; effet décalé
  J−1 sans piste), `Recommendations.test.jsx` (+1 : bloc affiché, « Le lendemain : humeur estimée », ni Stress ni Piste).
- `npm run lint` : 6 erreurs, identiques à main. `npm run build` ✅. `npm run visual` (toutes pages), `--empty` et
  `--light` (Analyses) ✅ sans erreur JS ; capture lue : sur les données de démo, « Aucune habitude ni aucun effet
  décalé net pour l'instant », « Voir les 3 habitudes incertaines », « En cours de collecte : Alcool (4/5 jours
  avec)… ». La capture `--light` sort sombre comme les autres pages (thème de l'app, pas lié à ce run).

## Risques connus
- L'humeur estimée retire la moitié de la valence habituelle sur 28 jours : une habitude qui change sur des semaines
  est en partie absorbée (choix prudent).
- Tags déclarés : rares chez le propriétaire (pas de notes) ; ce sont surtout les soirs mesurés qui serviront.

## Pour le propriétaire (Galaxy A56)
Rien de nouveau à faire ; le diagnostic de la Lecture du visage reste la priorité (voir le résumé de la semaine).

## Suite proposée
1. 📥 Diagnostic de l'A56 (arbre I122 + bloc `voice`).
2. I127 pondération des lectures du jour par leur qualité.
3. I117 dictée du soir selon la ligne « Voix ».
