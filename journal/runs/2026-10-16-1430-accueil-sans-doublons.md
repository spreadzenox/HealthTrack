# 2026-10-16 14:30 Paris (12:30 UTC) — Nettoyage : Accueil sans doublons (D1)

**Type** : 🧹 D1  ·  **PR** : « [Auto] Nettoyage : Accueil sans doublons »

## Pourquoi
- Démarrage : main à `54f1b0b` (#184, v144) ; « Tests », « Build & Release » et émulateur A56 verts. Aucune PR
  « [Auto] » ouverte. Aucun nouveau journal dans `journal/diagnostics/`.
- 14:30 Paris = run normal → D1 en tête. Reste noté au run précédent : « la carte bien-être "Note : 3 / 5" redit la
  tuile du jour ». Capture avant : chaque jour affichait la tuile « Bien-être 3 / 5 » **et** la carte « 21:30
  Bien-être / Note : 3 / 5 » (2 lignes), la tuile « Cigarettes 3 » **et** la ligne « Cigarettes 09:10 · 11:11 · 13:12 ».

## Ce qui a été fait
- `pages/Dashboard.jsx` :
  - note de bien-être dans l'en-tête de la carte (`.entry-score`, même style que les kcal d'un repas) ; sans tag
    affiché, Modifier et Supprimer passent dans l'en-tête → **une ligne** ; avec tags, ceux-ci restent dessous ;
  - `visibleTags()` extrait (règle « Écran tard » mesuré) et partagé par `EntryBody` et `hasBody` ;
  - résumé du jour : tuile « Bien-être » seulement si `count > 1` (moyenne de plusieurs notes) ; tuile
    « Cigarettes » retirée, le total passe dans l'en-tête de la ligne groupée.
- Données inchangées (affichage seul) ; `dailyJournal.js` calcule toujours `wellbeing` et `cigarettes`.
- Tests écrits avant le code (rouges puis verts) : `Dashboard.test.jsx` — note unique dans l'en-tête et sans tuile,
  tuile gardée avec 2 notes (moyenne 3 / 5), total des cigarettes dans l'en-tête et plus de tuile.

### Retiré et pourquoi (D1)
| Retiré / fusionné | Pourquoi |
|---|---|
| Tuile « Bien-être » du résumé (une seule note dans la journée) | Redit la note de la carte juste en dessous |
| Ligne « Note : 3 / 5 » sous l'en-tête | Note placée dans l'en-tête : carte de 2 lignes → 1 |
| Tuile « Cigarettes » | Total placé dans l'en-tête de la ligne qui liste les heures |

## Vérifications
- `npm run test` : **1294 tests verts** (100 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual` (toutes les pages) ✅ ; regardés : `/` (jours d'hier et de mercredi : 11 → 10 tuiles, carte
  bien-être sur une ligne, « Cigarettes 3 »).

## Suite
- D1 : « Voyage » déduit (I85 ②b) ; relire Connecteurs et Analyses avancées ; tuile « Repas » quand un seul repas.
- D5 : I92 (nettoyage de `moodEstimate.js` + `ESTIMATOR_INPUTS`) avant le service visage (I88).
