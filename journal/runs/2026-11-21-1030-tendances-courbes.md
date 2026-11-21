# Run du 21/11 10:30 — Tendances garde les courbes choisies (POLISH-SIM-130)

**Type** : 🐛 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main d590b32 au départ.

## État de départ
- main vert sur #1168 (Tests, émulateur, Build & Release, Play — AAB). Aucune PR « [Auto] » ouverte (seule #51,
  brouillon `cursor/*`, hors routine, non touchée).
- iPhone : `upstream.json` suit HEAD ; 1221.1221 chez les testeurs et attachée à la version 893. Parité 70 %.

## Pourquoi
Passage des personas de 08:30 (Tout mesurer, J14) : Bien-être + Pas choisis, on change d'onglet, au retour il ne
reste que Bien-être. `TrendsViewer` refait `useState(initialKeys)` à chaque montage.

## Ce qui a été fait
- `services/trendsKeptKeys.js` : `readKeptKeys` / `keepKeys`, sessionStorage `halcya.trends.keys` (effacé à la
  fermeture de l'app, et par « Supprimer toutes mes données »).
- `TrendsViewer` prend `onKeys` (appelé à chaque changement de mesures) ; `Trends` garde le choix hors mode exemple
  et le reprend à l'ouverture si aucun lien ne demande une mesure (`?mesure=`, `?vue=jour` gardent la priorité) et
  qu'au moins une mesure gardée a une courbe en Semaine ; sinon la vue par défaut (T1) comme avant.
- La visite guidée (mode exemple) ne lit ni n'écrit ce choix.
- Tests (rouges d'abord) : remontage avec Bien-être + Pas, lien `?mesure=sleep` prioritaire, choix gardé sans courbe →
  vue par défaut. `sessionStorage` vidé avant chaque test du fichier.
- Nouveautés : `2026-11-21-1030-tendances-courbes.json`.

## Vérifications
- Tests : 4 186 ✅ (368 fichiers) · eslint propre sur les fichiers touchés · Build ✅
- Visuel : `/tendances` (démo) relu : vue par défaut inchangée (Bien-être, Semaine).
- iPhone : `scripts/upstream.sh` → 49 correctifs appliqués (le 22 touche `deleteAllData.js`, contexte intact) ;
  suite complète dans `iphone/upstream/app` (voir la PR).

## Suite proposée
0. La PR de ce run : Tests, Build APK, émulateur, puis « iOS — build simulateur » (≈ 1 h) ; le run suivant regarde la
   capture iPhone de Tendances, met la branche à jour et merge (squash, sans ligne d'attribution).
1. POLISH-SIM-132 et 133 (textes de l'accueil), 131 à reproduire d'abord.
2. De jour : captures App Store de la refonte (ASC-CAPTURES-REFONTE), puis « 👉 PI2 prête ».

## Pour le propriétaire
Rien à faire.
