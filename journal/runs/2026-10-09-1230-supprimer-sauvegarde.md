# 2026-10-09 12:30 UTC — Supprimer une saisie, sauvegarde complète

**Type** : 🐛  ·  **PR** : #72 (fusionnée → release v71, APK publié)

## Pourquoi
Run bugs & visuel prévu (priorité n°1 du backlog, dernier le 09/10 06:30). Lecture de toutes les
captures (`npm run visual`, `--empty`) puis audit du code autour des données. Deux trouvailles :
1. **Perte de données silencieuse à la sauvegarde** : `exportToJson` réutilisait
   `listEntriesForAnalysis`, qui plafonne chaque type (FC 5 000, pas 2 000, sommeil 500, VFC / poids /
   SpO₂ / FC repos… 1 000). Au-delà, les entrées les plus anciennes n'étaient **pas exportées** ; et
   l'import remplace tout → après une réinstallation, l'historique ancien était perdu pour de bon.
   Contraire au principe n°2 de la charte.
2. **Aucun moyen de supprimer une entrée** : un « + 1 cigarette » tapé par erreur, un repas
   enregistré deux fois ou une note mal saisie faussaient pour toujours les moyennes, la Nutrition
   et les Recommandations.

## Ce qui a été fait
- `storage/localHealthStorage.js` : `exportToJson` exporte **toutes** les entrées (getAll, tri par
  date décroissante, même format `{ version: 1, exportedAt, entries }`) ; nouvelle `deleteEntry(id)`.
  Pas de changement de schéma IndexedDB. Tests : 1 206 entrées exportées puis réimportées
  (le test échouait avec 1 001 avant le correctif), import d'un ancien fichier (tableau nu, sans
  `created_at`), suppression ciblée et id inconnu (+4 tests).
- `components/DeleteEntryButton.jsx` (+6 tests) : « Supprimer » discret, confirmation en deux temps
  (« Supprimer ce repas ? Annuler / Confirmer »), cible tactile 44 px, erreur affichée, événement
  `health-entries-updated` pour que radar, cartes cœur et graphiques se recalculent.
  `utils/entries.js` → `isDeletableEntry` : seules les saisies de l'app (`app_*`) sont supprimables ;
  une donnée Health Connect / Withings reviendrait à la synchro suivante (dédoublonnage
  source|at|type), donc pas de bouton.
- Tableau de bord (« Dernières entrées ») et Alimentation (« Derniers repas ») : bouton sur les
  cartes concernées (+3 tests de page). Mise en page : en ligne si le contenu est court
  (« 1 cigarette »), sous le contenu s'il est long (repas), confirmation sur toute la largeur.
- Ingrédients à la française : « Riz blanc cuit : 180 g » (espace insécable avant « : »).
- Lint : variable inutilisée retirée dans `Connectors.jsx` (8 → 7 erreurs).

## Vérifications
- Tests : 500 ✅ (487 + 13) · Lint : 7 erreurs, 1 warning (avant : 8) · Build ✅
- Visuel : `npm run visual` (7 pages, 0 erreur JS, 0 débordement), `--empty` (OK),
  `--routes=/food --click="Supprimer ce repas"` et `--routes=/ --click="Supprimer cette cigarette"`
  (état de confirmation). **Retouche après lecture** : 1re version → bouton sur sa propre ligne
  (+50 px par carte) ; 2e version → en confirmation, la liste d'ingrédients était écrasée sur une
  colonne d'un mot (marge négative qui empêchait le retour à la ligne flex). Version finale vérifiée.

## Apprentissages / décisions
- Une fonction « pour l'analyse » ne doit jamais servir à la sauvegarde : leurs besoins divergent
  (récence vs exhaustivité). Le test d'export vérifie désormais l'exhaustivité.
- Pas de suppression des données synchronisées : il faudrait une « liste noire » persistante pour
  éviter leur retour ; à envisager seulement si le besoin apparaît (ex. pesée aberrante).
- Observé sans corriger : « 1728 mg/j » (Potassium) rendu sans espace dans la capture alors que
  `Intl` produit bien « 1 728 » dans Chromium → probablement le rendu de l'espace fine insécable
  en gras par la police de l'environnement de capture ; à recontrôler sur téléphone.

## Suite proposée
- 🏗️ Modifier un repas enregistré (réutiliser `MealEditor`) — la suppression est le premier pas.
- 🎨 C2 — « Dernières entrées » regroupées par jour (le flux est très long).
- 🎨 Settings : « Déconnecter Withings » affiché alors que rien n'est connecté.
