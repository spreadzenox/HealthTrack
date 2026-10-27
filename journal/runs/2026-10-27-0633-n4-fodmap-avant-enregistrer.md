# Run du 27/10/2026 06:33 (Paris, CET) — N4 (reste) : FODMAP avant d'enregistrer un repas

**Type** : 🏗️ code (demande du propriétaire du 26/10 14:45, reste de N4 : la ligne FODMAP sur le résultat d'une
analyse photo avant enregistrement)

## Constat au démarrage
- Main à `0e989b3` (#418, N3c). PR #419 (journal du merge N3c, tous les checks verts) mergée en ouverture →
  `97394b6`. Aucune autre PR « [Auto] » ouverte, aucun « Build & Release » en cours.
- La ligne pêche « Riche en fructanes : oignon » (N4) n'existait que sur les repas déjà enregistrés ; elle était
  même masquée pendant « Modifier ». Or c'est avant d'enregistrer, quand on corrige les grammes, qu'elle aide.

## Ce qui a été fait
- `Food.jsx` : `MealFodmapLine` sous l'éditeur du résultat d'une analyse photo, alimentée par les ingrédients
  **tels que corrigés** (elle se met à jour à chaque gramme changé ou ingrédient supprimé).
- `NewMealForm.jsx` (« Décrire » / « Refaire ») et `SavedMealEditor.jsx` (« Modifier ») : même ligne, en direct.
- Même condition que la carte enregistrée : objectif « Mon ventre » (`gutCardMode() !== 'hide'`), lu une fois.
- Captures : option `--food-analysis=fodmap` (dahl de lentilles, oignon, ail, riz : fructanes + GOS probable).

## Tests
- `Food.test.jsx` : analyse photo → « Riche en fructanes » dans le résultat, puis oignon ramené à 5 g → la ligne
  disparaît ; « Modifier » → ligne dans l'éditeur, disparaît à 5 g ; « Refaire » → ligne dans le formulaire ;
  objectif « énergie » → aucune ligne dans l'éditeur.

## Vérifications
- `npm run test` : **2 519** verts (+ 44 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé).
- `npm run visual -- --routes=/food --food-analysis=fodmap --goal=gut` en clair et en sombre : « Riche en
  fructanes : oignon, ail » et « Probablement riche en GOS : lentille verte » entre « Ajouter un ingrédient » et
  « Enregistrer ce repas », contrastes lisibles dans les deux thèmes. `npm run visual` complet : 15 pages « ok », 0 erreur JS.

## Suite
- N6c (partage du PDF vérifié sur l'émulateur) ; la ligne FODMAP dans « Vos derniers jours » (facultatif) ; puis
  M6 / suite selon l'ordre du propriétaire.
