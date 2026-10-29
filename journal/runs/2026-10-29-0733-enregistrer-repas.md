# Run du 29/10/2026 07:33 (Paris, CET) — Enregistrer un repas (POL-PLAY-41)

**Type** : 🎨 UI / ergonomie

## Constat au démarrage
- Main à `6ff00bd` (#495), tous les workflows verts (Build & Release v355, Play — AAB, Tests, émulateur A56).
- Aucune PR « [Auto] » ouverte. PR #51 (`cursor/*`) non touchée.

## Audit (suite de POL-PLAY-12)
- `npm run visual -- --play --routes=/food --food-analysis=fodmap` (clair puis `--dark`) et `--routes=/food --meal-text` :
  la ligne FODMAP « Riche en fructanes : … oignon, ail » était étirée d'un bord à l'autre (les deux lignes n'étaient
  pas alignées) : la carte d'analyse est une section `.results`, dont la règle `.results li` (flex, espace entre,
  bordure) s'appliquait aussi aux lignes FODMAP. « Enregistrer ce repas » se coupait sur deux lignes dans un
  demi-bouton, à côté de « Nouvelle photo » (photo) ou « Annuler » (repas décrit).
- Libellé « Analyse IA · une estimation » (plus de nom de modèle visible) : conforme.

## Fait
- POL-PLAY-41 : `.meal-fodmap-list li` remis en bloc (sans marge ni bordure) ; `.results .actions` et
  `.new-meal .actions` en colonne ; dans `NewMealForm`, « Enregistrer ce repas » passe avant « Annuler » (ordre
  visuel = ordre de lecture) ; `style={{ flex: 1 }}` retiré de « Nouvelle photo ».

## Tests
- `src/mealResultLayout.test.js` (2 tests, lecture des feuilles CSS comme `buttonShape.test.js`) : rouges avant, verts après.

## Vérifications
- `npm run test` : vert (2 657) ; lint 6 erreurs (inchangé) ; build OK ; `npm run visual` complet.
- Captures relues : analyse photo play clair et sombre, repas décrit clair.

## Demandes iOS
- Rien de propre à Android : la note de Nouveautés vaut pour toutes les variantes.

## Suite
- POL-PLAY-12 : Paramètres et écrans secondaires sur démo (Modifier un repas, Réintroduction en cours, Rapport PDF) ;
  POL-PLAY-11 quand Android vitals le permet ; P33 au propriétaire.
