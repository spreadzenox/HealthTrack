# 2026-10-10 22:30 UTC — Effets décalés (J-1 → J)

**Type** : 🏗️ (travail de fond, moteur d'analyse)  ·  **PR** : #95 (fusionnée en fin de run si CI verte)

## Pourquoi
« Effets décalés » était l'item n° 1 des « Prochaines étapes » depuis plusieurs runs. Les corrélations du jour même
ratent les effets qui arrivent plus tard (une journée active qui paie le lendemain) et sont exposées à la causalité
inverse (on marche plus *parce qu'on* va bien). Le run 20:30 n'avait rien pu faire (permissions refusées après une
fusion) : son compte rendu (PR #94, journal seul) est repris dans cette PR.

## Ce qui a été fait
- `services/laggedEffects.js` (nouveau) : pour sommeil, pas, calories d'activité et cigarettes, et pour chaque délai
  1, 2, 3 jours, corrélation **partielle** bien-être(J) ~ variable(J−k), en contrôlant :
  - le bien-être de la veille (terme autorégressif des modèles « cross-lagged » : une bonne passe qui dure) ;
  - les valeurs **du jour même** des 4 variables (sinon, une habitude régulière — même sommeil d'un jour à l'autre —
    fait passer l'effet du jour pour un effet de la veille ; ça retire aussi de la variance → plus de puissance) ;
  - le week-end du jour mesuré (si ≥ 3 jours de chaque).
  n effectif corrigé de l'autocorrélation, BH sur tous les couples (variable, délai), meilleur délai par variable,
  affiché seulement si **q < 0,05** (`LAG_MAX_Q`). Effet exprimé pour « un écart habituel » de la variable.
- `statistics.residualize` (Gram-Schmidt, covariables constantes/redondantes ignorées, ddl comptés).
- `buildDailyDataset(entries, { includeDaysWithoutWellbeing })` : garde les jours sans note (bien-être `null`) pour
  qu'un jour non noté puisse servir de « 2 jours avant ». Comportement par défaut inchangé.
- Page Analyses : section « ⏳ Effets décalés » après « Vos habitudes » (carte : « La veille, 192 kcal de plus que
  d'habitude → bien-être du jour +0,4 point », piste si actionnable et cohérente, r, jours indépendants, niveau de
  preuve) ; états « pas assez de jours consécutifs (N sur 14) » et « aucun effet net ».
- Démo : séance de sport la veille → +0,35 point le lendemain (aucun appel RNG ajouté, autres séries inchangées).

## Vérifications
- Tests : 655 ✅ (639 avant ; 13 moteur + 3 page) · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Les tests « bonne passe qui dure » et « habitude régulière » échouent bien si l'on retire le contrôle concerné.
- Simulation sur 30 graines de la démo : effet simulé retrouvé 5 fois sur 30 (puissance faible : notes entières, beaucoup
  d'autres sources de variance), faux positifs dans 2 graines sur 30 (≈ 5 % attendu avec BH à 0,05). Avec le seuil
  0,2 des pistes, la graine par défaut affichait un faux « pas 3 jours avant » (q = 0,09) → seuil 0,05.
- Graine par défaut : calories d'activité la veille, r = 0,50, +0,35 point par écart habituel (simulé : +0,35).
- Visuel : `npm run visual` (8 pages) sans erreur JS ; /recommendations relue (section, carte, textes, pas de débordement).

## Apprentissages / décisions
- Contrôler le bien-être de la veille ne suffit pas : sans le contrôle du jour même, une série autocorrélée produit de
  faux effets décalés (test dédié).
- Les jours de repas oubliés / tags ne sont pas contrôlés ici : la nutrition est déjà lissée sur ~10 jours ailleurs,
  les habitudes du soir ont leur section.

## Suite proposée
- Effets décalés, étape 2 : intégrer les tags du soir et les variables du jour comme contrôles supplémentaires quand
  ils sont renseignés (gain de puissance) ; proposer une piste décalée dans « Pistes à tester ».
- 🐛 Chasse aux bugs (formulaires, modales, captures émulateur) — le dernier run 🐛 date du 16:30.
- 🎨 Journal du tableau de bord, étape 2 (poids fusionné, noms courts).
