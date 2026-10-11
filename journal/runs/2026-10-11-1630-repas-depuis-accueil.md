# 2026-10-11 16:30 UTC — Modifier / Refaire un repas depuis l'accueil

**Type** : 🎨  ·  **PR** : voir le tableau du résumé de la semaine

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte, « Build & Release » v95 (PR #103) publié avec son APK.
- Derniers runs : 🏗️ 🎨 🐛 🏗️ 🐛 → run UI. Item n° 3 de « Prochaines étapes » : « Modifier » / « Refaire » un repas
  depuis « Vos derniers jours ». Sur l'accueil, un repas mal saisi ne pouvait qu'être supprimé ; il fallait aller sur
  Repas, retrouver le jour, puis modifier (≈ 3 taps + défilement de plus).

## Ce qui a été fait
- `Dashboard` : chaque repas avec des aliments a « Refaire » (tout repas) et « Modifier » (repas saisis dans l'app) ;
  « Modifier » ouvre `SavedMealEditor` à la place du contenu de la carte (même éditeur que la page Repas) ; à
  l'enregistrement, l'événement `health-entries-updated` recharge le journal.
- « Refaire » navigue vers `/food` avec `state.redoMeal = { dish, items }` ; `Food` ouvre le formulaire « Refaire : … »
  puis efface l'état de navigation (`replace`), pour qu'un retour arrière ne le rouvre pas.
- Mise en page : boutons des repas sur une ligne sous la liste d'aliments (`.entry-card-row-stacked`), comme sur la
  page Repas ; avant ajustement, « Supprimer » tombait seul sur une ligne. Règle `.entry-edit + .entry-edit` déplacée
  de `Food.css` vers `App.css` (partagée).
- `Layout` : retour en haut de page à chaque changement de route. Constat en préparant « Refaire » : la fenêtre est
  le conteneur de défilement et rien ne la remettait à zéro, donc on arrivait sur une page à la hauteur de la
  précédente (ex. depuis le bas de l'accueil → au milieu de « Derniers repas », formulaire hors écran).

## Vérifications
- Tests : 755 ✅ (750 avant, +5 écrits avant le code : Dashboard 3, Food 1, App 1 ; 1 test Dashboard reformulé) ·
  Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : 8 pages démo + 8 pages `--empty` sans erreur JS ni débordement ; accueil (boutons des repas), accueil avec
  `--click="Modifier ce repas"` (éditeur dans la carte), `--click="Refaire ce repas" --viewport` (arrivée en haut de
  Repas, formulaire « Refaire : Poulet, Pomme de terre, Haricot vert » pré-rempli) ; page Repas inchangée.
- Test App « remonte en haut » vérifié rouge sans le correctif de `Layout`, vert avec.

## Apprentissages / décisions
- « Modifier » sur place plutôt que navigation : l'utilisateur garde son contexte (le jour qu'il regardait).
- « Refaire » navigue : le formulaire de nouveau repas vit sur la page Repas (photo / texte / habituels), inutile de le
  dupliquer sur l'accueil.
- Le retour en haut s'applique aussi au changement d'onglet : comportement attendu d'une app mobile.

## Suite proposée
- 🏗️ Capacitor 8.4 + CLI 8 (captures émulateur avant/après, y compris le sélecteur d'heure).
- 🎨 Un seul bloc d'explication Radar + cartes cœur ; titre « Recommandations » vs onglet « Analyses ».
- 🏗️ Régularité du sommeil étape 2 ; effets décalés étape 2.
