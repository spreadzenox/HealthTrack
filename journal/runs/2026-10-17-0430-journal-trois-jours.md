# 2026-10-17 04:30 Paris (02:30 UTC) — « Vos derniers jours » : 3 jours lus d'emblée (D2)

**Type** : ⚡ D2  ·  **PR** : « [Auto] Accueil : « Vos derniers jours » lit 3 jours d'emblée »

## Pourquoi
- Démarrage : main à `430e937` (#190, release v149) ; « Tests », « Build & Release » et émulateur A56 verts. Aucune PR
  « [Auto] » ouverte (seule #51 `cursor/*`, non touchée). Aucun nouveau journal dans `journal/diagnostics/`.
  04:30 Paris = run normal.
- Suite D2 notée au run précédent : « Vos derniers jours » (`loadJournalEntries`) lisait 14 jours de tout (tranches FC /
  SpO₂ comprises) pour n'en afficher que 3 à l'ouverture. Mesure d'abord (`npm run perf -- --routes=/ --dense
  --spo2=slot --runs=3`, 3 ans, CPU ×4) : **Accueil 496 ms, TBT 114 ms, 4 016 enregistrements lus**.

## Ce qui a été fait
- `storage/localHealthStorage.js` : `countEntries({ since, until })`, compte par l'index `at` sans rien désérialiser.
- `pages/Dashboard.jsx` : à l'ouverture, lecture des **3 jours affichés** (+ la veille, voir ci-dessous) et compte des
  entrées plus anciennes dans la fenêtre de 14 jours ; « Voir les jours précédents » apparaît s'il y en a et charge
  alors les 14 jours (une seule fois ; les rechargements après écriture gardent la fenêtre via un `ref`). Rien depuis
  3 jours → 14 jours → 30 dernières entrées, comme avant.
- **Bug trouvé sur la capture et corrigé** : le plus ancien jour affiché n'avait pas de « Sommeil », car la nuit
  commence la veille au soir (`at` hors fenêtre) et compte pour le jour du réveil. Le défaut existait déjà sur le
  14e jour. La veille du premier jour est maintenant lue mais masquée (`hiddenKey`).
- Tests écrits avant le code : `countEntries` (plage, bornes incluses, aucun `getAll`) ; Dashboard : une seule lecture
  du journal sur ≈ 3–4 jours, bouton absent sans jours plus anciens, chargement des 14 jours au clic, repli 14 j → 30,
  nuit de la veille comptée et veille masquée.

### Chiffres (même commande, médiane de 3)
| | Avant | Après |
|---|---|---|
| Accueil — temps stabilisé | 496 ms | **422 ms** |
| Accueil — temps bloquant | 114 ms | **31 ms** |
| Accueil — enregistrements lus | 4 016 | **2 190** |
Avec la vraie montre (tranches de FC toutes les 10 min, ≈ 6× la démo), l'écart attendu est plus grand.

### Retiré et pourquoi
| Retiré | Pourquoi |
|---|---|
| Lecture de 14 jours de mesures à l'ouverture de l'Accueil | seuls 3 jours sont affichés (D2) |

### Changement de comportement assumé
- Le compteur de cigarettes rapide s'affiche si une cigarette figure dans les **3 derniers jours** (avant : 14) ou s'il
  est épinglé dans les Paramètres.

## Vérifications
- `npm run test` : **1316 tests verts** (101 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual` (toutes pages) ✅, `--routes=/ --empty` ✅ ; captures `dashboard-2/3` regardées : 3 jours,
  « Jeudi 15 octobre » a retrouvé « Sommeil 7 h 59 », bouton « Voir les jours précédents » présent.

## Suite
- D2 : les ≈ 2 200 restants sont surtout `WellbeingCharts` (14 j) et cartes de forme → agrégats journaliers ; budget
  « enregistrements lus » en CI.
- D1 : relire Connecteurs et Analyses avancées. D5 : taille minimale visible (I46). D6 : Radar (I97).
