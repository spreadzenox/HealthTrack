# 2026-10-18 00:30 Paris (22:30 UTC) — Courbe de bien-être : 14 jours lus (D2)

**Type** : ⚡ D2  ·  **PR** : « [Auto] Courbe de bien-être plus rapide »

## Pourquoi
- Démarrage : main à `81a743d` (#199, v157) ; « Build & Release », « Tests » et émulateur A56 verts. PR #200 (run
  22:30, D1) verte (Vitest, Build APK, Protocole montre, émulateur A56 API 35 / 36), sans conflit : **fusionnée en
  début de run** (squash, `4c5a6f0`). Le contrôle de la session a ensuite refusé quelques commandes de lecture
  (« Merge Without Review ») avant de les laisser repasser. Aucun nouveau journal dans `journal/diagnostics/`.
- 00:30 Paris = run de code. D1 bouclé au run précédent → D2, premier reste du backlog : `WellbeingCharts`, la
  « courbe » dont le propriétaire disait qu'elle lague.
- Constat dans le code : `WellbeingCharts` lisait `listEntries({ type: 'wellbeing', limit: 2000 })` (toutes les
  notes, par l'index `type`) pour n'afficher que 14 jours ; l'historique ne servait qu'à choisir le message du
  graphique vide (« Aucune note ces 14 derniers jours » vs « Pas encore assez de données »).

## Ce qui a été fait
- `storage/localHealthStorage.js` : `countEntries({ type, since, until })` — avec `type`, compte par l'index
  [type, at] (aucune valeur désérialisée).
- `components/WellbeingCharts.jsx` : lecture `since` = minuit local d'il y a 14 jours (un jour de marge avant le
  premier jour affiché ; le découpage par jour reste dans `seriesByCalendarDay`) ; si la fenêtre est vide, les notes
  plus anciennes sont seulement **comptées** ; une note du jour de marge compte comme « plus ancienne ».
- Tests écrits avant le code (vus rouges, 4) : `countEntries` par type sans `getAll` ; `since` borné à ≤ 1 jour avant
  le premier jour affiché ; pas de comptage quand la fenêtre a des notes ; message « Pas encore assez de données »
  quand il n'y a rien ; message « Aucune note ces 14 derniers jours » adapté au comptage.

### Données
- Aucune : lecture seule, aucun changement de schéma.

## Mesures (`npm run perf -- --routes=/ --runs=3`, 3 ans de démo, 17 164 entrées, CPU ×4, médiane)
| Accueil | settledMs | tbtMs | longestMs | idbReads | idbRecords |
|---|---|---|---|---|---|
| Avant | 259 | 20 | 70 | 14 | 1 725 |
| Après | 88 | 0 | 0 | 14 | 644 |

Garde-fou de régression : le test « lit les notes de bien-être depuis le premier jour affiché, par plage » échoue
si la courbe relit tout l'historique.

## Vérifications
- `npm run test` : **1 346 tests verts** (102 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual` (8 pages) ✅ et `--empty --routes=/` ✅. Captures regardées : `dashboard-2` (démo : 14 points du
  05/10 au 17/10, prédiction reliée à hier), `dashboard-1` à vide (« Pas encore assez de données… »).

## Suite
- D2 : budget de lectures en CI (`perf-check` léger ou test sur `idbRecords`), `abiFilters` (I95) avant toute lib
  native. Puis D6 I102 (`personalDirection.js`), D4 I100 ① (moteur LiteRT).

## Merge
- PR #200 fusionnée en début de run → v158 attendue.
- PR de ce run : voir la fin de ce compte rendu, complétée après les checks.
