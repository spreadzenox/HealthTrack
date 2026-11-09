# Run 09/11 16:35 — Tendances : la « ligne grise » était la grille

**Type** : code (mode polish) — POLISH-SIM-28.

## Contexte
- Aucune PR « [Auto] » ouverte ; dernier « Build & Release » de main vert (#866). Gel Alpha jusqu'à 22:00 : pas touché.

## Fait
- Persona « Stressé et pressé » (09/11 08:35) : la ligne grise de Tendances Sommeil / VFC « n'est pas expliquée ».
  Vérification dans le code : ce n'est pas une habitude, c'est la seule ligne de grille, tracée à la graduation du
  milieu. Le libellé « d'habitude » proposé au BACKLOG aurait été faux. La grille suit maintenant chaque graduation de
  l'axe de gauche, comme la vue Jour : elle se lit comme une grille.
- Test `Trends.test.jsx` (POLISH-SIM-28) rouge puis vert. Nouveautés : `2026-11-09-1635-grille-tendances.json`.
- Captures (démo, Bien-être + VFC nuit) : `runs/captures/2026-11-09-1635-grille-tendances-{clair,sombre}.png`.

## Leçon
- Un trait isolé se lit comme une référence. Un repère sans valeur propre ne doit jamais ressembler à une donnée.

## Vérifs
- `npm run test`, `npm run build`, `npm run lint` (0 erreur), `npm run visual --routes=/tendances` (clair et sombre).

## Suite
- POLISH-CONTRASTE-NOTE (chiffre de la note choisie à 3,72:1 en clair).
