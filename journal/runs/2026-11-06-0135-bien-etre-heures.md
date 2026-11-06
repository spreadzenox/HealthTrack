# 06/11 01:35 — Onglet Bien-être : « Dans les heures » après les repas (ANALYSES-ONGLETS-5)

Type : 🔧 run de code (01:35 Paris). Priorité : retours du 04/11, point (4) (trois horizons d'effet, chacun lisible).

## Constat au démarrage
- main `cbf31d1` : Tests, Build & Release, émulateur A56, Play — AAB et Play — Alpha (porte de 24 h) verts.
  Aucune PR « [Auto] » ouverte.
- Retours du 04/11 traités sauf AVIS-RELAIS-3b (attend des avis) et ANALYSES-ONGLETS-5 ; chantier montre en attente
  des relevés du propriétaire. Alpha = 100811 en examen ; la porte de 24 h la garde jusqu'au 06/11 vers 16:30.

## Fait
- `services/mood/mealHours.js` (`mealHoursEffect`) : lectures du visage (rafales du déverrouillage ou de l'ouverture,
  même estimation que l'historique) dans les 2 h après le début d'un repas contre celles à plus de 3 h du dernier
  repas, le même jour. Chaque lecture moins la médiane de son jour, puis moins l'écart moyen de sa tranche de 3 h.
  Un écart « après − loin » par jour qui a les deux ; ≥ 10 jours ; test de permutation des signes (4 000, graine fixe) ;
  « net » si p < 0,05 et |écart| ≥ 0,1 point. Statuts `no_face`, `no_meals`, `not_enough_data`, `ok`.
- D5 : les repas ne sont lus que pour leur heure (X) ; aucune entrée ajoutée à l'estimateur ; le repas précède la
  lecture. Règle 6 : sens non présupposé, dit tel quel, aucun conseil.
- `analysisTasks.basicAnalysis` renvoie `mealHours` ; `MealHoursHorizon` (Horizon.jsx/.css, menthe) en haut de l'onglet
  Bien-être (et sous « Vos pistes arrivent » quand les notes manquent) ; rien sans visage ni repas.
- Nouveautés `2026-11-06-0135-bien-etre-heures.json`.

## Vérifications
- `npm run test` : 3 173 verts (8 tests du service, dont deux vérifiés en échec quand on retire la correction par
  tranche horaire ; 4 tests du composant) ; `npm run build` OK ; `npm run lint` 0 erreur ; `npm run visual` (toutes
  pages) ; captures `recommendations` relues en clair, sombre (démo : 25 jours, « Pas de différence nette ») et vierge
  (bloc absent), `--play --size=360x780`.

## Suite
- CD-ALPHA-6 au premier report réel de la porte (06/11 vers 16:30) ; CD-ALPHA-4 si 100811 reste en examen au-delà de
  48 h ; redécaler `until` si l'invitation part après le 06/11 ; GOLD-a3-2 dès P37 ; TEST-ALPHA-1 (07–08/11) ;
  chantier montre.
