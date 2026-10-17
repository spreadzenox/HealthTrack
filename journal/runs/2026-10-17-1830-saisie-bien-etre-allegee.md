# 2026-10-17 18:30 Paris (16:30 UTC) — Saisie bien-être allégée (D1)

**Type** : 🧹 D1  ·  **PR** : « [Auto] Note de bien-être plus discrète »

## Pourquoi
- Démarrage : main à `f787a14` (#196, release v154) ; « Tests », « Build & Release » et émulateur A56 verts. PR #197
  (run 16:30) verte et sans conflit : **fusionnée en début de run** (squash, `4ecaa25`) — cette fois la fusion est
  passée. Aucun nouveau journal dans `journal/diagnostics/`. 18:30 Paris = run de code.
- D1 en tête ; reste prévu : relire la saisie bien-être (WellbeingPrompt) et « Données → historique ».
  Captures lues avant : `dashboard-1` et `data-1` avec `--wellbeing-prompt`.

## Ce qui a été fait
- `components/WellbeingPrompt.jsx` :
  - la modale automatique (une fois par session) ne s'ouvre plus si une note de bien-être a été enregistrée il y a
    moins de 3 h (`RECENT_NOTE_HOURS`, lecture `listEntries({ type: 'wellbeing', since, limit: 1 })`) ;
  - description « Notez votre bien-être de 0 (très bas) à 5 (très bien). Les données restent sur cet appareil. »
    → « 0 = très bas, 5 = très bien. » ;
  - paragraphe d'aide des tags remplacé par une ligne « Repéré sans vous : Sport le soir (séance après 18 h), … »,
    absente quand rien n'est capté automatiquement (`AUTO_HINTS`, dans l'ordre des tags).
- `pages/More.jsx` : la ligne Données annonçait « historique de vos saisies », qui n'est plus sur cette page (il est
  sur l'Accueil, « Vos derniers jours ») → « Sauvegarde et restauration de vos données ».
- Tests écrits avant le code (vus rouges) : pas d'ouverture auto après une note récente ; échelle en une ligne sans
  la phrase de confidentialité ; aucune explication quand rien n'est capté ; libellés « Repéré sans vous » des 4 tags
  auto ; More (ligne Données sans « historique »).

### Retiré et pourquoi
| Retiré | Pourquoi |
|---|---|
| Ouverture automatique de la modale moins de 3 h après une note | redemande ce qui vient d'être saisi ; « + Ajouter un bien-être » reste là pour une 2ᵉ note |
| « Les données restent sur cet appareil » dans la modale | dit sur la page Données ; inutile à chaque saisie |
| « Ces tags permettent de voir, dans Analyses, ce qui va de pair avec vos bons et moins bons jours. » | explication à chaque saisie ; « (facultatif) » suffit |
| Phrases « X : mesuré / déduit de … » | réunies en une ligne « Repéré sans vous : … » |
| « historique de vos saisies » (ligne Données de Plus) | n'existe plus sur cette page |

### Données
- Aucune : affichage seul (lecture d'une note de bien-être récente).

## Vérifications
- `npm run test` : **1341 tests verts** (102 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual` (toutes pages) ✅ ; `--wellbeing-prompt --routes=/,/data` ✅ ; `--empty --wellbeing-prompt
  --routes=/,/plus` ✅. Captures regardées : `dashboard-1` (démo : « Repéré sans vous : Sport le soir (séance après
  18 h). »), `dashboard-1`/`plus-1` à vide (9 tags, aucune ligne d'aide, « Sauvegarde et restauration de vos données »),
  `data-1`.

## Suite
- D1 : Accueil, tuile « Repas » quand un seul repas ; relire Repas et Nutrition une dernière fois ; puis D1 bouclé →
  D2 (`WellbeingCharts` par agrégats).
- D4 : I100 ① (moteur LiteRT) ; D6 : I97 ② (sens personnel du radar).
