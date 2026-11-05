# 06/11 00:35 — Onglet Ventre : « Sur quelques semaines » propre au ventre (VENTRE-SEMAINES)

Type : 🔧 run de code (00:35 Paris). Priorité : retours du 04/11, points (3) et (4).

## Constat au démarrage
- main `833a53f` : Tests, Build & Release, Relais, Play — Alpha verts ; job émulateur A56 (API 36) rouge sur un
  commit de journal : `ECONNRESET` au téléchargement de l'artefact (réseau GitHub), relancé.
- PR #740 (run 23:35, journal seul, décision App Store Connect pour la routine iOS) verte, propre, sans activité depuis
  70 min : mergée (squash `5f80046`). La décision demandée par le prompt est donc reportée dans `POUR-IOS.md`.
- Retours du 04/11 traités, sauf AVIS-RELAIS-3b (attend des avis) et ANALYSES-ONGLETS-5 (plus tard) ; chantier montre en
  attente des relevés du propriétaire (M4 bis, confirmations). Audit en captures des écrans du 05/11 (`--play`,
  360 × 780 : Analyses Bien-être et Ventre, Journal, Historique, Tendances).

## Défaut trouvé
- Onglet Ventre : « Sur quelques semaines : votre forme et votre bien-être » → Tendances, qui n'a rien sur le ventre
  (mélange ventre / bien-être que le propriétaire veut éviter), et ce bloc coupait l'onglet avant la carte du rapport PDF.

## Fait
- `services/gutWeeks.js` : jours calmes / gêne / douleur par semaine (8 semaines, la dernière finit aujourd'hui), note la
  plus forte du jour comme `buildReport` ; `gutWeeksReady` (2 semaines notées) ; libellé pour le lecteur d'écran.
- `components/GutWeeks.jsx` (+ CSS dans `pageStyles.js`, couleurs des tokens = teintes du PDF) : une colonne de 7 cases
  par semaine depuis la première semaine notée, légende, « Arrive après 2 semaines de notes du ventre. » sinon.
- `analysisTasks.basicAnalysis` renvoie `gutWeeks` ; onglet Ventre : `GutWeeks` à la place du lien vers Tendances, avant
  le rapport PDF. Onglet Bien-être inchangé (lien Tendances). `HorizonHeading` accepte un `hint`.
- Nouveautés `2026-11-06-0035-ventre-semaines.json`.

## Vérifications
- `npm run test` : 3 161 verts (6 tests du service dont l'égalité avec le rapport PDF, 2 tests de page) ; `npm run build`
  OK ; `npm run lint` 0 erreur ; `npm run visual` (toutes pages) ; captures `recommendations_ventre` relues en clair,
  sombre et vierge (`--play --size=360x780`).

## Suite
- CD-ALPHA-6 au premier report réel de la porte (06/11 vers 16:30) ; CD-ALPHA-4 si 100811 reste en examen au-delà de
  48 h ; redécaler `until` si l'invitation part après le 06/11 ; GOLD-a3-2 dès P37 ; chantier montre.
