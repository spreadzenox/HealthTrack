# Run 09/11 03:35 — Onglets entiers sur petit écran

**Type** : code (mode polish).
**Étape** : NAV-LIBELLE-320.

## Contexte
- Aucune PR « [Auto] » ouverte ; main = #852, Build & Release, Tests, Play — AAB, émulateur A56 et Play — Alpha verts.
- Gel Alpha jusqu'au 09/11 22:00 : `review-freeze.json` non touché, aucun envoi lancé.

## Constat
À 320 px en police ×1,3 (grande police d'Android), la barre du bas affichait « Aujour… » et « Analys… » ; au format
A56 en police ×1,3, les sous-onglets du Journal se touchaient (« NutritionTendances »). Le contrôle visuel ne voyait
pas le premier cas : le lien ne déborde pas, c'est son libellé intérieur qui est coupé par des points de suspension.

## Fait
- `visual-check.mjs` : « TEXTE QUI DÉBORDE » signale aussi un libellé intérieur coupé par `text-overflow: ellipsis`
  (préfixe « … »). Avant le correctif : « …Aujourd’hui », « …Analyses ».
- `TabBar.css` : chaque onglet de la barre du bas est un conteneur (`container-type: inline-size`), le libellé fait
  `min(1em, 17cqi)` ; la rangée des sous-onglets (Journal, Analyses) aussi, onglet en `min(1em, 4.5cqi)`. La taille
  d'origine reste plafond : rien ne change au format A56 en police normale (calcul : 13,4 px possibles > 11,5 px).
- Test `tabLabelsFit.test.js` (rouge sans le CSS, vert avec).
- Nouveautés : `2026-11-09-0335-onglets-petit-ecran.json`.

## Vérifs
- `npm run test` (3318 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual`.
- Contrôle visuel sur `/`, `/journal`, `/recommendations` à 320×700 ×1,3, 360×780, A56 et A56 ×1,3 : plus aucun onglet
  signalé. Captures `runs/captures/2026-11-09-0335-onglets-320-{clair,sombre}.png` relues.

## Reste vu au passage (BACKLOG)
- 320 px ×1,3 : « Digestion » collé au bord de sa pastille dans le bandeau d'ajout ; « + 1 cigarette » déborde.
- A56 ×1,3, Journal › Jours : valeurs des tuiles coupées en plein mot (« 2 285 kca / l », « 37, / normal »).
