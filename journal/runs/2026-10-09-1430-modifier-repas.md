# 2026-10-09 14:30 UTC — Modifier un repas enregistré

**Type** : 🏗️  ·  **PR** : #74 (fusionnée)

## Pourquoi
Priorité n°1 du backlog depuis le run 12:30 : on pouvait supprimer un repas mal saisi, mais pas le
corriger. Or l'estimation photo se trompe souvent de plusieurs dizaines de grammes, et on s'en rend
compte après coup (en relisant la page Nutrition, ou en se souvenant d'un ingrédient oublié). Seule
option jusqu'ici : supprimer et reprendre une photo. Autre cas fréquent : un repas photographié le
midi mais enregistré le soir est daté du soir → fausse les analyses « repas tardif » et l'ordre du jour.

## Ce qui a été fait
- `storage/localHealthStorage.js` → `updateEntry(id, { payload, at })` : modification en place, seuls
  `payload` et `at` changent (id, type, source, created_at conservés), horodatage `updated_at`, rejet
  explicite si l'entrée n'existe pas. `importFromJson` conserve `updated_at` s'il est présent (champ
  facultatif → anciens fichiers inchangés). **Pas de changement de schéma IndexedDB** (+4 tests).
- `services/mealEditing.js` : `itemsForEditing` (ingrédients d'un repas enregistré → `MealEditor` ;
  grammes retrouvés dans les anciens libellés « 150g » / « 12,5 g », quantité texte « 1 bol » gardée
  sans inventer de grammes, aliments absents de la base signalés), `atToLocalInput` /
  `localInputToAt` (champ `datetime-local` en heure locale), `itemForStorage` mutualisé (+6 tests).
- `components/SavedMealEditor.jsx` : heure du repas + `MealEditor` + Annuler / « Enregistrer les
  modifications ». L'heure n'est envoyée que si elle a changé (pas de perte des secondes), heure
  future refusée (tolérance 5 min), au moins un ingrédient exigé (sinon renvoi vers Supprimer).
  Plat, source et modèle Gemini conservés. Événement `health-entries-updated` → recalcul partout.
- `pages/Food.jsx` : bouton « Modifier » à côté de « Supprimer » sur les repas saisis dans l'app
  (`isDeletableEntry`), un seul repas en édition à la fois, liste rechargée après enregistrement
  (+5 tests de page).
- `MealEditor` : identifiant du champ de recherche via `useId` (deux éditeurs à l'écran — analyse en
  cours + repas en modification — n'ont plus le même `id`).

## Vérifications
- Tests : 515 ✅ (500 + 15) · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` (7 pages, 0 erreur JS, 0 débordement) ;
  `--routes=/food --click="Modifier ce repas"` : éditeur dans la carte, champ heure lisible, boutons
  − / + et ✕ alignés, « Modifier · Supprimer » discrets alignés à droite sur toutes les cartes.
  Le champ heure apparaît au format US dans Chromium de capture (locale en-US) ; sur un téléphone en
  français il suit la langue du système.

## Apprentissages / décisions
- Pas d'édition des repas depuis le tableau de bord pour l'instant : la carte y est plus compacte et
  le flux sera regroupé par jour (C2) ; l'édition reste sur Alimentation, là où sont les repas.
- Test « findByText » fragile quand le même texte (« ≈ 197 kcal ») existe brièvement dans l'éditeur
  puis dans la carte : attendre d'abord la fermeture de l'éditeur.

## Suite proposée
- 🎨 C2 — « Dernières entrées » regroupées par jour (flux très long), et repas regroupés par jour sur Alimentation.
- 🏗️ Saisie texte / « comme hier » / favoris (R#5) en réutilisant `MealEditor` (dupliquer un repas = presque gratuit maintenant).
- 🎨 C1 — barre d'onglets en bas.
