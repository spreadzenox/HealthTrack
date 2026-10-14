# 2026-10-14 16:30 Paris (14:30 UTC) — Performance : Nutrition et synchros lues par index

**Type** : ⚡ D2 (performance)  ·  **PR** : « [Auto] Performance : Nutrition et synchros lues par index »

## Pourquoi
- Démarrage : main à `489b986` (#157, journal), **v126 publiée avec son APK**. Aucune PR « [Auto] » rouge ou en
  conflit (seule PR ouverte : `cursor/*` #51, hors routine, non touchée).
- ⌚ D3 : **aucun nouveau journal** du propriétaire depuis v124 (ni dans `journal/diagnostics/`, ni en issue). Les
  vraies mesures (v125+) restent à confirmer par lui ; l'arrière-plan (d quater, plan I49 = client Java) attend cette
  confirmation. Le seul point D3 utile sans la montre : **l'écriture d'une synchro**, qui relisait toute la base
  (`upsertEntries` → `getAll()`), coûteuse pour la première synchro complète de la GT 6 Pro. → D2 (backlog n° 4).

## Mesurer d'abord (`npm run perf`, CPU ×4, médiane de 3, 3 ans de démo = 16 069 entrées)
| Mesure | Avant (main `489b986`) | Après |
|---|---|---|
| `/nutrition` : prête (settledMs) | **1 253 ms** | **270 ms** |
| `/nutrition` : lectures / enregistrements IndexedDB | 28 / 14 847 | **5 / 756** |
| `/nutrition` dense (+ FC horaire, 42 k entrées) | 1 448 ms, 28 / 15 097 | **571 ms, 5 / 756** |
| `upsertEntries` 336 mesures dans 16 k (fake-indexeddb, Node, médiane de 5) | 112 ms | **10 ms** |

## Ce qui a été fait
- **`upsertEntries`** (`storage/localHealthStorage.js`) : les clés de dédoublonnage « source|at|type » ne sont plus
  lues dans toute la base mais, pour chaque source du lot, sur la plage [premier at, dernier at] de l'index
  `[source, at]` (déjà présent, **aucune migration**). Comparaison exacte des chaînes inchangée ⇒ même résultat.
  Repli sur la lecture complète si une entrée n'a pas de source ou de date en chaîne (clé d'index impossible).
- **Nutrition** : `services/nutritionData.js` `loadNutritionEntries()` = 5 lectures par index (repas de la fenêtre
  de 7 j + 1 jour de marge, pas des 14 j + 1, poids, taille, composition corporelle) au lieu de
  `listEntriesForAnalysis()` (toute la base). `STEPS_WINDOW_DAYS` exporté de `bodyProfile.js`.
- **Garde-fou** (`workers/mainThreadGuard.test.js`) : un écran qui appelle `listEntriesForAnalysis` fait échouer les
  tests (seule exception : le panneau de diagnostic des Analyses, mode debug). Vérifié : échoue sur l'ancien code.

## Vérifications
- Tests : **1191 ✅** (92 fichiers ; +6 : dédoublonnage par source et plage dont bornes et doublon dans le lot,
  « jamais `getAll` du magasin, 0 enregistrement hors plage lu », entrées sans source, fidélité Nutrition sur 120 j de
  démo (profil, comparaison, composition identiques ; < ¼ de la base lue), fenêtres repas / pas, garde-fou).
  Build ✅. Lint : **6 erreurs** (baseline inchangée).
- `npm run visual` (démo) + `--empty --routes=/nutrition` : aucune erreur JS ; captures Nutrition relues (profil
  Withings 77,2 kg, ≈ 7 042 pas/j, 10 repas · 6 jours, barres, composition Withings ; état vide inchangé).

## Apprentissages / décisions
- Un dédoublonnage n'a besoin que des clés qui *peuvent* entrer en collision : même source, même plage de dates.
- Un écran lit ce qu'il affiche ; « tout charger puis filtrer » est désormais bloqué par un test.

## Suite proposée
1. ⌚ Lire le prochain journal du propriétaire (v125+) : vraies mesures ? → clore la priorité absolue, puis (d quater).
2. ⚡ D2 : `WellbeingCharts` par agrégats ; budget d'enregistrements lus par page en CI (`npm run perf` trop lent pour
   la CI : un test Vitest sur `loadXxx` suffit, comme ici).
3. 🧹 D1 : contexte auto-détecté (I65), relire Paramètres et Analyses.
