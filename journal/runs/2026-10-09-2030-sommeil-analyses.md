# 2026-10-09 20:30 UTC — Analyses : le sommeil rattaché au jour du réveil

**Type** : 🐛  ·  **PR** : #80 (fusionnée → v75)

## Pourquoi
Run de chasse aux bugs (le dernier datait de 12:30, trois gros chantiers depuis). Les captures
(`visual`, `--empty`) n'ont montré aucune erreur JS ni débordement ; en revanche une incohérence
notée au backlog s'est révélée être un **vrai bug du moteur d'analyse** :
`buildDailyDataset` (Recommandations basiques et avancées) et `buildTodayRow` (prédiction du jour)
rangeaient chaque nuit au **jour du coucher** (`localDateKey(e.at)`). Le bien-être est le plus
souvent noté le soir : il était donc corrélé à la nuit *suivante* — cause et effet inversés. En
plus, tous les segments étaient additionnés, y compris « éveillé » et « au lit » (qui chevauche les
phases) : avec une montre qui exporte les phases, la durée pouvait presque doubler.

Preuve sur la démo (bien-être construit à partir de la nuit précédente) : « Durée de sommeil »
n'apparaissait qu'à r = +0,10 (barre pâle) ; après correction r = +0,52, 1re piste
« Dormir un peu plus longtemps », et 2e variable du modèle avancé (89 %).

## Ce qui a été fait
- `services/analysisEngine.js` : le sommeil vient désormais de `nightlySleep` (`services/radar.js`,
  déjà utilisé par le Radar) — jour du réveil, phases additionnées, éveils ignorés, « au lit »
  seulement à défaut de phases, nuits invraisemblables (< 1 h ou > 16 h) écartées. Même logique
  dans `buildTodayRow` (la nuit dernière, commencée hier soir, compte pour aujourd'hui).
- `VARIABLE_META.sleepMinutes.format` → `formatDuration` (« 7 h 11 » au lieu de « 431 min » dans
  les conseils avancés).
- Nutrition vide : le lien-bouton « Ajouter un repas » n'est plus souligné ni collé au texte.
- +4 tests (jour du réveil, éveil/au lit non comptés, nuit d'hier soir pour aujourd'hui, format).

## Vérifications
- Tests : 548 ✅ (544 + 4, les 3 tests de sommeil échouaient avant le correctif) · Lint : 7 erreurs,
  1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` (7 pages, 0 erreur JS), `--empty` (7 pages), Recommandations basiques
  et avancées (`--click="Recommandations avancées"`) avant/après, Nutrition vide après.
  RAS par ailleurs sur tableau de bord, Alimentation, Données, Connecteurs, Paramètres.

## Apprentissages / décisions
- Une nuit = le jour du réveil, partout (tableau de bord, Radar, analyses). `dailyJournal` garde sa
  propre somme (elle n'écarte pas les siestes courtes) mais ignore « au lit » même seul : écart
  mineur, noté au backlog.
- Les recommandations de l'utilisateur vont **changer** après la mise à jour (c'est voulu) :
  signalé dans Nouveautés et le résumé de la semaine.
- Constat non corrigé : « 1728 mg/j » (Potassium, en gras) s'affiche sans espace dans Chromium
  headless alors que « 3 500 » en a une — probablement la police (espace fine insécable U+202F en
  gras) ; à vérifier sur le téléphone avant d'y toucher.

## Suite proposée
- 🎨 C1 — barre d'onglets en bas (les 7 liens occupent ~¼ de l'écran sur chaque page).
- 🏗️ Effets décalés (lags 0–3 j) maintenant que le sommeil est au bon jour.
- 🔭 Veille (dernière : 08/10 17:00).
