# Run 09/11 17:35 — Note de bien-être : contraste du chiffre choisi

**Type** : code (mode polish) — POLISH-CONTRASTE-NOTE.

## Contexte
- Aucune PR « [Auto] » ouverte ; dernier « Build & Release » de main vert (#867). Gel Alpha jusqu'à 22:00 : pas touché.

## Fait
- Le chiffre de la note choisie était `--accent` sur `rgba(brand, 0.2)` posé sur la surface de la fenêtre : 3,72:1 en
  clair. Il prend le couple du thème bien-être `--mint-bg` / `--mint-label` (déjà vérifié ≥ 4,5:1 dans les deux thèmes
  par `tokens.test.js`), le rond plein aussi : plus de fond translucide dont le contraste dépend du dessous.
- Test `wellbeingNoteContrast.test.js` rouge puis vert. L'outil visuel ne signale plus de contraste faible.
- Nouveautés : `2026-11-09-1735-contraste-note.json`.
- Captures (variante play, `--click="Bien-être > Note 4 sur 5"`) :
  `runs/captures/2026-11-09-1735-contraste-note-{clair,sombre}.png`.

## Relevé en passant (corrigé)
- `analysisCacheFidelity.test.js › basicAnalysis` échouait aussi sur main à cette heure : `mealHoursEffect` rendait
  `shift: -0` (petit décalage négatif arrondi), que JSON relit `0`. Sur les données de démo du jour seulement : le test
  dépend de la date. `round2` ajoute `+ 0` ; test unitaire. La CI de 15:53 UTC était verte, un run plus tard l'aurait
  vu rouge.

## Leçon
- Un fond translucide n'a pas de contraste propre : le texte posé dessus doit utiliser un couple de tokens vérifié.

## Vérifs
- `npm run test` (3 339 verts), `npm run build`, `npm run lint` (0 erreur), `npm run visual --play --routes=/` (clair
  et sombre, note 4 choisie).

## Suite
- Mode polish : prochains constats des personas au BACKLOG ; PROP-OBJECTIF au run « idées » de 20:35.
