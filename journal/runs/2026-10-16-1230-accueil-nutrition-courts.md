# 2026-10-16 12:30 Paris (10:30 UTC) — Nettoyage : Accueil et Nutrition plus courts (D1)

**Type** : 🧹 D1  ·  **PR** : « [Auto] Nettoyage : Accueil et Nutrition plus courts »

## Pourquoi
- Démarrage : main à `15fbf13` (#183, v143) ; « Tests », « Build & Release » et émulateur A56 verts. Aucune PR
  « [Auto] » ouverte. Aucun nouveau journal dans `journal/diagnostics/`.
- 12:30 Paris = run normal → D1 en tête. Restes D1 notés : relire l'Accueil (4 écrans), avertissement « repas
  manquants » de Nutrition, « Voyage » déduit. Capture avant de l'Accueil : chaque repas de « Vos derniers jours » met
  un aliment par ligne (5 lignes par repas), alors que la page Repas les met à la suite depuis le run de 10:30.
  Nutrition (démo, 614 kcal/jour saisi) : « 1 repère atteint sur 14 » suivi d'un avertissement de 4 lignes qui dit
  justement que ce compte est faussé.
- « Voyage » déduit reporté : il faut d'abord enregistrer le fuseau à chaque ouverture (nouvelle entrée `context`), et
  il ne couvre que les voyages avec changement de fuseau — moins utile que ces deux pages lues tous les jours.

## Ce qui a été fait
- `pages/Dashboard.jsx`, `pages/Food.jsx` : listes d'aliments avec la classe partagée `.inline-list` (règle déplacée
  de `Food.css` vers `App.css`, l'ancienne `.entry-items li { padding }` supprimée).
- `services/nutritionIntakeCompare.js` : expose `energyTarget`.
- `pages/Nutrition.jsx` : si `likelyIncomplete`, une seule ligne « ≈ X kcal par jour saisi sur ~Y : des repas
  manquent sans doute, apports sous-estimés. » **à la place** de « N repères atteints sur M » ; sinon, le compte.
- Tests écrits avant le code (rouges puis verts) : `Dashboard.test.jsx` (liste en `.inline-list`),
  `Nutrition.test.jsx` (une ligne < 110 caractères, plus de compte de repères quand les jours sont incomplets).

### Retiré et pourquoi (D1)
| Retiré / fusionné | Pourquoi |
|---|---|
| Une ligne par aliment dans les repas de l'Accueil | Aliments à la suite, comme la page Repas : Accueil 4 → 3 écrans |
| « 1 repère atteint sur 14 » quand des repas manquent | Compte faussé par les repas non saisis ; l'avertissement le remplace |
| Avertissement Nutrition de 4 lignes | Même information en une phrase, avec les besoins chiffrés |

## Vérifications
- `npm run test` : **1293 tests verts** (100 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual` (toutes les pages) ✅ ; regardés : `/` (4 → **3 écrans**), `/nutrition` (avertissement sur 2
  lignes), `/food` (inchangé avec la classe partagée).

## Suite
- D1 : « Voyage » déduit (I85 ②b) ; Accueil : la carte bien-être « Note : 3 / 5 » redit la tuile du jour ; relire
  Connecteurs et Analyses avancées.
- D5 : I92 (nettoyage de `moodEstimate.js` + `ESTIMATOR_INPUTS`) avant le service visage (I88).
