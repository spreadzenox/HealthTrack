# 2026-10-09 18:30 UTC — Alimentation : saisir sans photo, repas habituels, « Refaire »

**Type** : 🏗️  ·  **PR** : #78 (fusionnée → v74)

## Pourquoi
Priorité n°1 du backlog (C4, R#5) : la photo était le **seul** moyen d'enregistrer un repas — il
fallait une clé Gemini, du réseau, et la photo est d'après une étude terrain *plus* pénible que le
texte. Or la plupart des gens mangent souvent la même chose (petit-déjeuner, restes) : dans la démo,
4 repas couvrent 100 % des saisies. Reprendre un repas connu en un tap supprime l'essentiel de la
friction de saisie.

## Ce qui a été fait
- `services/quickMeals.js` (+11 tests) :
  - `frequentMeals(entries)` : regroupe les repas au **même ensemble d'ingrédients** (ordre, casse,
    accents ignorés ; grammes libres), classés par nombre de fois puis récence ; chaque suggestion
    reprend les ingrédients, grammes et plat de **la fois la plus récente**, avec ses kcal.
  - `mealLabel(payload)` : plat, sinon 3 premiers ingrédients en nom court (« Poulet, cuisse,
    viande bouillie… » → « Poulet »).
  - `mealTimeError(at)` : validation d'heure partagée (désormais aussi utilisée par
    `SavedMealEditor`, sans changement de comportement).
- `components/NewMealForm.jsx` : formulaire de création réutilisant `MealEditor` (recherche dans la
  base Ciqual, grammes ± 10 g, kcal) + heure (défaut : maintenant ; si l'heure n'a pas été touchée,
  c'est l'heure de l'enregistrement qui compte). `createEntry({ type: 'food', source: 'app_food',
  payload: { items, provider: 'manual', dish? } })` → rien ne change pour les analyses / Nutrition /
  export (même forme que les repas photo).
- `pages/Food.jsx` : bouton « ✍️ Saisir sans photo », grille « Repas habituels » (4 max, ≈ kcal ·
  N fois), bouton « Refaire » sur chaque repas de la liste ; actions « Refaire / Modifier /
  Supprimer » groupées à droite sur leur ligne. Chargement de 100 repas (au lieu de 20) pour trouver
  les habitudes, 20 toujours affichés. Intro de la page mise à jour.
- Aucune modification du stockage ni du schéma. Aucune donnée envoyée en ligne.

## Vérifications
- Tests : 544 ✅ (529 + 15) · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` (7 pages, 0 erreur JS) ; `/food` avec `--click="Saisir sans photo"`
  (formulaire vide + consigne) et `--click="Refaire Poulet"` (pré-rempli, total ≈ 479 kcal).
  1re version : libellés Ciqual tronqués (« Poulet, cuisse, viand… ») et boutons
  Refaire / Modifier / Supprimer éclatés sur 2 lignes → corrigés (noms courts, 2 lignes max,
  actions sur une ligne dédiée).

## Apprentissages / décisions
- Pas de « favoris » explicites : les repas habituels sont déduits de l'historique (zéro
  configuration). Des favoris épinglés pourront venir si le besoin apparaît.
- Saisie par **texte libre / dictée analysée par Gemini** non faite : la saisie manuelle locale
  couvre le besoin sans réseau ni clé ; le texte libre → Gemini reste au backlog (C4).
- Le champ `datetime-local` s'affiche au format US dans Chromium headless (locale en-US) ; sur le
  téléphone il suit la langue du système.

## Suite proposée
- 🏗️ Texte libre / dictée → Gemini (« 2 œufs, une tartine beurrée, un café ») → même éditeur.
- 🎨 « Refaire » aussi depuis le journal du tableau de bord ; C1 barre d'onglets en bas.
- 🐛 Run de chasse aux bugs (`--empty`, `--light`) — le dernier date de 12:30.
