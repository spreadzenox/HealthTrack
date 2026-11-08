# Run 08/11 18:35 — Humeur et éveil : libellés à l'horizontale (T4-suite)

**Type** : code (correction du propriétaire, Tendances ; écart à la maquette).

## Contexte
- Main verte (#837 : Build & Release, Play — AAB, émulateur A56 verts). PR #838 (nouvel accueil, session dédiée)
  ouverte : non touchée, aucun fichier commun. Passage complet des personas déjà fait (08/11 03:35).

## Fait
- **T4-suite (axes)** : dans la carte « Humeur et éveil » (`MoodMap`, TrendsDayDetail.jsx), « désagréable » et
  « agréable » sont écrits à l'horizontale à gauche et à droite du carré, comme la maquette (ils étaient tournés à
  90°). Dessin élargi (280 × 192), libellés des bords en 9,5 px, gras, couleur du texte (8 px gris avant).
- Test (TDD, rouge avant le code) : `components/TrendsDayDetail.test.jsx` (2 tests).
- Captures lues : `maquettes/agir-tendances/comparaison/jour-humeur-eveil-{clair,sombre}.png` (démo, vue Jour).

## Reste
- T4-suite (singulier) : « Nuits plus longues… (7 h 46) » au pluriel (moyenne de la fenêtre), la maquette dit « Nuit
  plus courte (6 h 21) » : à proposer au propriétaire avant d'exposer la valeur du seul jour.
- Vu en passant : « FC au repos plus basse que d'habitude » dans « Ce qui a pu peser » garde l'abréviation (POLISH-SIM-6
  l'a dépliée sous la courbe seulement) → POLISH-SIM-6b au BACKLOG.
- Envoi Alpha de 23:45 (version des testeurs). Aucun merge entre 22:00 et minuit.
