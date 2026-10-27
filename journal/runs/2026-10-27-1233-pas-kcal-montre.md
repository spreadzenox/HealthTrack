# Run du 27/10/2026 12:33 (Paris, CET) — 🚑 pas et kcal du jour (signalement du 27/10 11:56)

**Type** : 🐛 correctif (signalement du propriétaire, priorité du prochain run de code)

## Constat au démarrage
- Main à `c00cf2e` (#430, v313), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Signalement : le 26/10, Journal = **30 199 pas** et **658 625 kcal** (le 27 à midi : 23 334 kcal).

## Diagnostic
- **kcal** : `watchEntries` (sync.js) additionnait par heure le champ `kcal` des minutes (§7.2) et l'écrivait en kcal.
  Les totaux 7/0x03 sont bien en kcal (GT 6 Pro : 603 pas, 20 kcal à 10:22 UTC), mais une journée de minutes à
  658 625 n'est possible qu'en **petites calories** : 658 625 cal ≈ 659 kcal d'activité, cohérent avec ≈ 15 000 pas.
  Le Journal gardait max(total du jour, somme des tranches) → la somme des tranches ×1000 l'emportait.
- **pas** : `dailyJournal.dailyTotal` additionnait **toutes** les tranches du jour, toutes sources confondues : montre
  (tranches horaires) + Health Connect (échantillons de Samsung Health du Galaxy A56). Les deux comptent les mêmes pas →
  ≈ ×2 (30 199 ≈ 2 × 15 000). Même somme dans `analysisEngine` (deux endroits), `dailyAggregates.buildRecord` (somme
  par heure toutes sources), `firstImport` (« pas par jour en moyenne ») et `coverage.dayTotal` (écran Montre).
- Pas de doublon de resynchronisation : la clé (source, at, type) protège déjà ; mais elle empêche aussi qu'une
  synchro corrige une ancienne tranche → migration nécessaire.

## Ce qui a été fait
- `services/activityTotals.js` (nouveau, pur) : par heure, la **source qui compte le plus** (groupe = source +
  `sourceName`, donc deux apps Health Connect sont aussi départagées) ; jour = max(somme des heures, totaux « du jour »
  des sources) ; ancienne tranche calories de la montre (sans `rawCal`) lue ÷ 1000 ; **garde-fou** : jour > 100 000 pas
  ou > 15 000 kcal → `null` (pas affiché).
- Branché dans `dailyJournal` (Journal, Accueil via le résumé du jour, `bodyProfile`/nutrition), `analysisEngine`
  (historique et aujourd'hui ; 0 comme avant quand rien), `dailyAggregates` (valeur via `activityValue`, une source par
  heure ; **AGG_VERSION 2** → agrégats reconstruits à la prochaine lecture), `coverage.js` (écran Montre), `firstImport`.
- `sync.js` : tranches horaires de calories écrites en kcal à 0,1 près avec la valeur brute `rawCal`.
- `services/watchKcalFix.js` : réécriture unique (`rewriteSourceEntries`, une transaction) des anciennes tranches
  (valeur ÷ 1000, `rawCal` = ancienne valeur : rien perdu) ; lancée après la compaction SpO₂ dans `useAutoSync`, et
  forcée après un import (Données) comme la compaction. Idempotente (le marqueur `rawCal` empêche une double division).
- Export : les entrées réécrites s'exportent en kcal avec `rawCal` ; un ancien export réimporté est corrigé à la
  lecture puis réécrit (import forcé).

## Vérifications
- Tests : `activityTotals.test.js` (8, dont la reproduction « 658 625 → 659 kcal » et « montre + téléphone → 15 000 »),
  `watchKcalFix.test.js` (3, base IndexedDB factice : migration, idempotence, import d'un ancien fichier),
  `sync.test.js` (tranche 7 345 cal → 7,3 kcal, `rawCal`). Suite complète verte (209 fichiers).
- Build, lint et captures : voir la section Merge.

## Points ouverts
- Unité des calories des **séances** (0x17, 4 octets) non confirmée : demander au propriétaire si une séance affiche
  des kcal absurdes. Ajouté au BACKLOG.
- Halcya ne reçoit de la montre que les calories d'activité (minutes, totaux 7/0x03), pas la dépense totale : si le
  propriétaire compare avec le total de la montre, l'écart est attendu.

## Suite
- Retour du propriétaire (4 chiffres montre / Halcya) ; puis reprise : 9b (i18n) ou suite FODMAP selon PRODUIT.md.

## Merge
- Build `npm run build` OK ; lint : 6 erreurs, comme avant ; `npm run visual --routes=/,/journal,/sources` : 0 erreur JS,
  captures regardées (Accueil, Journal « Hier » 10 085 pas / 2 352 kcal sur la démo : inchangé).
- PR #431 : tous les checks verts (Vitest, Build APK, relais, protocole montre, budget de lectures, émulateurs API 35
  et 36) → mergée (squash) en `1e4f44d`.
- « Build & Release » vert : **v314** publiée, APK 34,9 Mo (34 897 289 octets) ; « Play — AAB », « Tests », émulateur verts.
