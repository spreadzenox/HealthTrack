# 05/11 09:35 — Expressions comparées à l'habitude, fiabilité mesurée (BE-BIAIS-3)

Type : 🎨 run de code (09:35 Paris). Priorité : retours du 04/11, point (5) (bien-être sous-estimé), fin.

## Constat au démarrage
- main vert (`5eaa646`, v507 ; « Play — Alpha » réussi puis un second en cours). Aucune PR « [Auto] » ouverte.

## Fait (branche `claude/auto-be-biais-3`)
- `wellbeingHistory.js` : `habitualMix(bursts, end)` (moyenne de chaque expression sur les 28 jours qui finissent à la
  fin de la période, dès 3 jours lus), `habit` et `delta` ajoutés à chaque expression de la période et du détail de
  chaque point, `habitShifts(mix)` (jusqu'à 2 écarts ≥ 5 points, le plus grand d'abord).
- `faceMood.js` : `notesAgreement(entries)` — fiabilité mesurée : écart moyen (sur 5) entre chaque note et le visage du
  même jour recalé sur les autres jours notés (un jour laissé de côté à chaque fois) ; null sous 3 jours notés.
  `personalOffset` réécrit sur les mêmes aides (`noteGaps`, `shrunkOffset`), comportement inchangé.
- `WellbeingHistory.jsx` : phrase « Par rapport à votre habitude : moins de tristesse, plus de joie. » (ou « Proche de
  votre habitude. »), trait de l'habitude sur chaque barre et dans la grille du point touché, base « trait : votre
  habitude sur N jours », phrase sur le visage au repos lu triste, encart menthe « Écart moyen avec vos notes : 0,5
  point sur 5, mesuré sur N jours notés » (sinon « Fiabilité mesurée dès 3 jours notés »).
- Règle 5 : uniquement des entrées Y (visage, notes) ; rien ne change aux Analyses. Aucun chiffre de précision non
  mesuré : l'écart affiché est mesuré sur les notes de la personne.
- Non fait (noté au BACKLOG) : lissage des creux et pics de la courbe « Jour » (déjà médiane par heure au-delà de
  24 lectures) ; à revoir si le propriétaire le signale encore après le recalage.

## Vérifications
- TDD : 3 tests `wellbeingHistory.test.js`, 3 tests `faceMood.test.js`, 3 tests `WellbeingHistory.test.jsx`.
  `npm run test` 3087 verts ; lint 0 erreur ; build OK.
- Captures `/bien-etre` (semaine sombre, Jour clair `--face-dense`) relues : trait lisible sur les deux thèmes,
  encart contrasté. `npm run visual` complet : 17 pages ok.
