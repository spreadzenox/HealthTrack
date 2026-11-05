# 05/11 06:35 — Bien-être : recalage de départ sur les notes (BE-BIAIS-1)

Type : 🎨 run de code (06:35 Paris). Priorité : retours du 04/11, point (5) (bien-être sous-estimé).

## Constat au démarrage
- main vert (v503, `ac76ae8`, « Play — Alpha » réussi).
- PR #709 (BE-HISTO-DETAIL-2, run de 05:35) ouverte depuis 52 min, émulateur en cours : tâche indépendante prise,
  aucun fichier commun (ni `wellbeingHistory.js` ni `WellbeingHistory.jsx`).

## Fait
- `faceMood.js` : `personalOffset(entries)` — dès 3 jours avec une note et une lecture (`gateDays`), écart moyen
  note − estimation du visage (même valence générale, visage habituel du jour) sur les 28 derniers jours notés,
  rétréci vers 0 (× k / (k + 2)), plafonné à ±2. Rendu par `personalCalibration` (champ `offset`), donc appliqué
  partout où une lecture est estimée (Accueil, Historique, jours du visage des Analyses) ; le modèle personnel
  (porte réussie, ≥ 14 jours) le remplace. `faceMoodEstimate` rend `offsetDays` ; le détail de la carte dit
  « recalé sur vos notes de N jours, que d’autres notes affineront ».
- Règle 5 : entrées inchangées (visage et notes, déjà déclarés côté Y). Un décalage constant ne change ni l'ordre
  des lectures ni les corrélations des Analyses, seulement le niveau affiché.
- Fourchette inchangée (pas de précision non mesurée).

## Vérifications
- TDD : 4 tests (`faceMood.test.js`) rouges puis verts (décalage vers le haut, attente de 3 jours, décalage vers le
  bas, phrase du détail) ; `npm run test` 3067 verts ; lint 0 erreur ; build OK ; `npm run visual` complet OK,
  captures Accueil et Historique relues (démo : notes proches du visage, décalage faible, rien ne bouge à l'œil).

## Suite
- BE-BIAIS-2 : calibration de départ (demander une note de bien-être chaque jour les 3 à 5 premiers jours de lecture
  du visage, discrètement dans la carte Bien-être, jamais bloquant), puis BE-BIAIS-3 : recentrer la grille des
  expressions sur l'habitude de la personne (« tristesse » au repos) et fiabilité affichée.
