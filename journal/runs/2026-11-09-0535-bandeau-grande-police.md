# Run 09/11 05:35 — Boutons d'ajout lisibles en grande police

**Type** : code (mode polish).
**Étape** : GRANDE-POLICE-1 (seconde moitié : bandeau d'ajout d'Aujourd'hui à 320 px) — soldée.

## Contexte
- Aucune PR « [Auto] » ouverte (seule #51, ancienne, hors routine) ; main = #854, Build & Release, Tests, Play — AAB,
  émulateur A56 verts.
- Gel Alpha jusqu'au 09/11 22:00 : `review-freeze.json` non touché, aucun envoi lancé.

## Constat
`--play --size=320x700 --font-scale=1.3` : « TEXTE QUI DÉBORDE (« Digestion », « + 1 cigarette ») ». Les cases du
bandeau gardaient 68 px de large quelle que soit la police.

## Essai écarté
Libellé borné en `min(1em, 17cqi)` (règle des onglets) : tout le bandeau tombait à ~11,5 px, plus petit qu'en taille
normale. Contraire au but d'une grande police ; retiré.

## Fait
- `AddStrip.css` : `grid-auto-columns: minmax(max(68px, 4.25rem), 1fr)` : 68 px en taille normale (A56 inchangé,
  capture relue), 88 px en ×1,3 ; le bandeau défile un peu plus tôt (déjà prévu pour six gestes). « + 1 cigarette » :
  `white-space: normal` (passe à la ligne entre les mots).
- Test `addStripLabelsFit.test.js` (rouge sans le correctif, vert avec).
- Outil visuel : le contrôle « collé au bord » mesure les lignes de texte elles-mêmes (un libellé sur deux lignes dans
  une case flex ne compte plus comme collé : faux positif « Autre chose ») ; vérifié qu'il voit encore le défaut
  d'origine. Option `--scroll-end=<sélecteur>` pour capturer la fin d'une rangée horizontale.
- Nouveautés : `2026-11-09-0535-bandeau-grande-police.json`.

## Vérifs
- `npm run test` (293 fichiers verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual`.
- `/` en 320×700 ×1,3 clair et sombre, défilé jusqu'au bout : aucun débordement ; A56 normal : cases de 68 px comme
  avant. Captures `runs/captures/2026-11-09-0535-bandeau-grande-police-{clair,sombre}.png` relues.

## Suite
- Polish : POLISH-SIM-7 / 9 (outil personas, runs « idées »), INTEG-1 (proposition Garmin / Samsung au propriétaire).

## Merge
PR #855 : Frontend (Vitest), Build APK, Relais, Bord à bord, WebView API 28, perf verts (émulateurs A56 encore en
cours). Le merge squash a été refusé par le filtre de permissions de la session (« Merge Without Review ») : PR
laissée ouverte, prête. Le run suivant (ou le propriétaire) la merge après avoir remis la branche à jour sur main.
