# 2026-10-18 04:30 Paris (02:30 UTC) — Worker des analyses mesuré + FC par sous-type (D2)

**Type** : ⚡🐛 D2  ·  **PR** : « [Auto] Analyses : tout l'historique du cœur + lectures du Worker comptées »

## Pourquoi
- Démarrage : main à `1e9b262` (#202) ; « Build & Release » v160 publiée avec son APK, « Tests » et émulateur A56
  verts. Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée). Aucun nouveau journal dans
  `journal/diagnostics/`.
- 04:30 Paris = run de code. Backlog D2, premier reste : « lectures du Worker des analyses non comptées, à
  instrumenter ». Mesure d'abord.

## Mesure (nouvelle)
- `perf-check.mjs` instrumente maintenant aussi le Web Worker des analyses : son script est servi précédé du même
  compteur que la page (`context.route('**/assets/analysis.worker*.js')`), et la mesure attend la fin de ses lectures
  (compteur `pending` de requêtes en cours, 500 ms sans nouvelle lecture). Colonnes `workerReads` / `workerRecords`.
- Résultat sur 3 ans de démo : **la Prédiction du jour (Accueil) et Analyses relisent ≈ 15 800 enregistrements dans
  le Worker** à chaque calcul (donc après chaque écriture : synchro montre, note…), contre 642 pour la page elle-même.

## Bug trouvé en lisant `listEntriesForAnalysis`
- Plafond **commun** de 5 000 pour tout `heart_rate`. La montre écrit FC et SpO₂ par tranches de 10 min (≈ 144 + 144
  par jour) : les 5 000 plus récentes couvrent ≈ 17 à 29 jours. **La FC au repos et la VFC (une par jour) plus
  anciennes étaient évincées** : sur le téléphone du propriétaire, les analyses ne voyaient qu'environ le dernier mois
  de FC repos / VFC. Test réaliste écrit d'abord (40 jours de tranches + 40 FC repos) : **rouge, 34 / 40**.

## Ce qui a été fait
- `storage/localHealthStorage.js` : `ANALYSIS_LIMITS` (exporté) ; `heart_rate` lu **par sous-type** via l'index
  `[type, payload.subtype, at]` (v4, déjà là) — heartRate 3 000, oxygenSaturation 1 500, autres 1 000 ; les sous-types
  présents sont trouvés par sauts de curseur de clés (un pas par sous-type). Lecture « N plus récentes » factorisée
  (`newest`) pour types et sous-types. Les FC **sans sous-type** ne sont plus lues : le moteur d'analyse les ignorait
  déjà (seuls repos / FC / VFC / SpO₂ comptent) et toutes les sources actuelles en mettent un.
- `scripts/perf/budget.mjs` : le budget d'une page inclut les lectures du Worker ; `budget.json` : `/` 17 500,
  `/recommendations` 17 000 (≈ mesure + marge). La FC dense de `--dense` porte maintenant `subtype: 'heartRate'`
  comme les vraies sources.
- Tests : budget avec Worker (vu rouge), FC par sous-type (vu rouge sur la version réaliste ; gardé en petit volume
  car fake-indexeddb avance les curseurs en temps quadratique : ≈ 30 s pour 3 000 pas), FC sans sous-type non lue ;
  deux anciens tests passent à `subtype: 'heartRate'`.

### Données
- Aucune : lecture seule, aucun changement de schéma.

## Mesures (`npm run perf -- --runs=1 --cpu=1`, enregistrements lus par le Worker)
| Cas | Avant | Après |
|---|---|---|
| Démo 3 ans (`/`, `/recommendations`) | 15 833 (non compté jusqu'ici) | 15 833 |
| Démo + FC horaire + SpO₂ 10 min 30 j (`--dense --spo2=slot`) | 16 083 | 17 483 (+9 %) |
| FC repos / VFC vues par les analyses (même cas) | ≈ 1 mois | ≈ 950 jours (tout) |

Le Worker relit ≈ 16 k enregistrements par calcul : c'est le prochain gros gisement D2 (agrégats journaliers
précalculés, invalidés à l'écriture, pour les sous-types denses).

## Vérifications
- `npm run test` : **1 358 tests verts** (103 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run perf -- --budget` ✅. `npm run visual` (8 pages) ✅ ; captures regardées : `recommendations-1`
  (pistes inchangées sur la démo), `dashboard-1`.

## Suite
- D2 : agrégats journaliers des sous-types denses (FC, SpO₂) pour le Worker ; `abiFilters` (I95). Puis D6 I102
  (`personalDirection.js`), D4 I100 ① (moteur LiteRT).
