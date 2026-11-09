# Run 09/11 04:35 — Valeurs du Journal entières en grande police

**Type** : code (mode polish).
**Étape** : GRANDE-POLICE-1 (première moitié : tuiles du Journal › Jours).

## Contexte
- Aucune PR « [Auto] » ouverte ; main = #853, Build & Release, Tests, Play — AAB, émulateur A56 verts.
- Gel Alpha jusqu'au 09/11 22:00 : `review-freeze.json` non touché, aucun envoi lancé.

## Constat
Format A56 en police ×1,3 : `overflow-wrap: anywhere` sur la valeur des tuiles coupait en plein mot (« 2 285 kca / l »,
« ≈ 1 039 k / cal », « 37, / normal », « 68 à / 82 bpm »).

## Fait
- `journalChips.js` : `chipValueBreaks(value)` : espaces insécables partout, coupure permise seulement après « ≈ »,
  « , », « à » et « / ». Le texte lu ne change pas. Utilisé par `DailyJournal`.
- `App.css` : la tuile est un conteneur (`container-type: inline-size`) ; valeur en `min(0.8rem, 15cqi)` et
  `overflow-wrap: normal`. Le plus long morceau (« 120/80 mmHg », 11 signes mono) tient ; taille d'origine en plafond
  (rien ne change au format A56 en police normale, capture relue).
- Tests : `journalChips.test.js` (coupures, texte identique, morceaux ≤ 11 signes, garde CSS), rouges avant ; helper
  `summaryValue` de `Journal.test.jsx` compare le texte lu (insécables → espaces).
- Nouveautés : `2026-11-09-0435-tuiles-grande-police.json`.

## Vérifs
- `npm run test`, `npm run lint`, `npm run build`, `npm run visual` (voir PR).
- `/journal` : A56 normal, A56 ×1,3 clair et sombre, 320×700 ×1,3 : aucun débordement signalé. Captures
  `runs/captures/2026-11-09-0435-tuiles-grande-police-{clair,sombre}.png` relues. En ×1,3, « ≈ » seul sur sa ligne
  au-dessus de « 1 039 kcal » quand il y a deux repas : lisible, gardé.

## Reste (BACKLOG, GRANDE-POLICE-1)
- 320 px ×1,3 : « Digestion » collé au bord de sa pastille (bandeau d'ajout) ; « + 1 cigarette » déborde.
