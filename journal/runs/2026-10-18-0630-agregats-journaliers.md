# 2026-10-18 06:30 Paris (04:30 UTC) — Agrégats journaliers des séries denses (D2)

**Type** : ⚡🐛 D2  ·  **PR** : « [Auto] Analyses : agrégats journaliers, tout l'historique des pas et calories »

## Pourquoi
- Démarrage : main à `5006ce6` (#203) ; « Build & Release » v161 publiée, « Tests » et émulateur A56 verts. Aucune PR
  « [Auto] » ouverte (seule #51, `cursor/*`, non touchée). Aucun nouveau journal dans `journal/diagnostics/`.
- 06:30 Paris = run de code. Backlog D2, « prochain : agrégats journaliers précalculés des sous-types denses pour le
  Worker » (le Worker des analyses relisait ≈ 16 k enregistrements à chaque calcul).

## Bug trouvé en préparant le chantier
- Même défaut que la FC hier, pour **pas et calories** : la montre les écrit **par heure** (≈ 16 / jour), Health
  Connect en échantillons. Plafonds « N plus récents » : `steps` 2 000 (≈ 4 mois de montre), `calories` 500
  (≈ 1 mois). Les analyses du propriétaire ne voyaient donc qu'un mois de calories dépensées.
- Test d'équivalence écrit (60 j de démo + 45 j de montre : pas / calories horaires, FC / SpO₂ en tranches de 10 min) :
  **rouge** sur l'ancien code (jours de calories manquants), vert après.

## Ce qui a été fait
- `storage/dailyAggregates.js` (nouveau) : un enregistrement par série dense (`steps`, `calories`,
  `heart_rate:heartRate`, `heart_rate:oxygenSaturation`) et par jour UTC (préfixe de `at`), avec par heure
  [début, somme, nombre, premier début, dernière fin] ; les totaux « du jour » (`period: 'day'`) gardés tels quels.
  `recordEntries` rend une entrée par heure (au premier début, `endDate` = dernière fin) ; FC / SpO₂ = moyenne
  horaire avec `weight` = nombre d'entrées.
- Tenue à jour : chaque écriture (`createEntry`, `upsertEntries`, `rewriteSourceEntries`, `updateEntry` ancien +
  nouveau, `deleteEntry`, import fusion) marque `dirty` les jours touchés **dans la même transaction** ; import qui
  remplace tout = agrégats vidés. À la lecture : jours marqués refaits depuis l'index [type, at] / [type, sous-type,
  at] du seul jour ; sans état (`__state`, `AGG_VERSION`) → reconstruction complète, une `getAll` par série.
- `localHealthStorage.js` : schéma **v5** (magasin `daily_aggregates`, entrées intactes) ; `listEntriesForAnalysis`
  ne lit plus les séries denses en brut (limites `steps`, `calories`, `heartRate`, `oxygenSaturation` retirées).
- `analysisEngine.js` : FC et SpO₂ moyennes pondérées par `weight` (1 par défaut : entrées brutes inchangées), dans
  `buildDailyDataset` et la ligne du jour de la prédiction.
- Budget CI resserré : `/` 17 500 → 12 500, `/recommendations` 17 000 → 12 000.

### Données
- Migration v4 → v5 testée (entrées gardées, agrégats construits à la première analyse) ; export identique (seul
  `health_entries` est exporté) ; import ancien format inchangé.
- Changement de sens assumé (D5, X avant Y) : une heure **à cheval** sur la note du jour est écartée en entier
  (avant, la partie avant la note comptait). Test dédié.
- Limite connue : heures UTC — dans un fuseau à demi-heure (Inde…), jusqu'à 30 min d'une heure peuvent être
  rattachées au jour voisin. Sans effet en France.

## Mesures (`npm run perf -- --runs=1|2 --cpu=1`, enregistrements lus par le Worker des analyses)
| Cas | Avant | Après |
|---|---|---|
| Démo 3 ans (`/`, `/recommendations`) | 15 833 | **11 389** (−28 %) |
| Démo + FC horaire + SpO₂ 10 min 30 j (`--dense --spo2=slot`) | 17 483 | **11 389** (−35 %, indépendant de la densité) |
| Historique de pas / calories vu par les analyses (montre) | ≈ 4 mois / ≈ 1 mois | tout |

Reste dans le Worker ≈ 8 k entrées quotidiennes (notes, repas, sommeil, FC repos, VFC, météo, contexte…).

## Vérifications
- `npm run test` : **1 366 tests verts** (104 fichiers ; +8 : agrégats, équivalence, X avant Y, invalidation par
  écriture, import, migration v4 → v5). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run perf -- --budget` ✅. `npm run visual` (8 pages) ✅ ; captures regardées : `recommendations-1`
  (pistes et habitudes calculées), `dashboard-1`.

## Suite
- D2 : cache des lignes journalières du dataset (les ≈ 8 k entrées restantes) ou lecture bornée dans le temps ;
  `abiFilters` (I95). Puis D6 I102 (`personalDirection.js`), D4 I100 ① (moteur LiteRT).

## Merge
- (à compléter)
