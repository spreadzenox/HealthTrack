# 2026-10-25 00:30 Paris (22:32 UTC) — POL-6 : Journal en pastels, Tendances inactives en une ligne

**Type** : 🧭 chantier produit (polissage du parcours, retours du propriétaire du 24/10 vers 15:00, point 6)

## Constat au démarrage
- Main à `1e8bc24` (#338), workflows de main verts (Tests, émulateur ; Build & Release v259, Play — AAB). Aucune PR
  « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Captures avant (`--play`, démo) : « Vos derniers jours » tout en gris (tuiles grises sur carte grise, seule une
  bordure gauche colorée par saisie). Tendances en démo : tout est actif ; en données partielles, chaque bloc pas encore
  prêt prenait une carte (« Le radar s'active après 2 semaines… », « Encore 10 jours de mesures… » ×2, « Encore 4 nuits… »).

## Ce qui a été fait (présentation seulement : aucun calcul ne change, aucune donnée touchée)
- `DailyJournal.jsx` : `CHIP_THEMES` / `chipTheme` → `data-theme` sur chaque tuile du résumé (menthe = corps et bien-être
  par défaut, pêche = repas, lilas = pas / dépense / écran / réseaux sociaux, neutre = météo).
- `App.css` : tuiles en pastel avec étiquette de la couleur du thème et valeur en IBM Plex Mono 500 ; cartes du jour au
  rayon 22 px ; saisies en pastel (repas et ventre pêche, bien-être menthe, séance lilas) avec chiffres de l'en-tête dans la
  couleur d'étiquette (contraste ≥ 4,5:1).
- `tokens.test.js` : `color-ink-2` (heures, « Supprimer ») ajouté aux couples testés sur les trois pastels, clair et
  sombre (passe).
- Tendances : `HealthRadar`, `BaselineCards` et `SleepRegularityCard` reçoivent `onStatus(key, { active, soon })` ; un
  bloc pas encore prêt ne rend plus de carte et donne sa ligne (« Radar forme · après 2 semaines », « FC au repos ·
  encore 10 j », « Horaires de sommeil · encore 4 nuits ») ; `FormeSection` les réunit dans « Bientôt » et n'affiche
  « Comment c'est calculé » que si un bloc est actif. Une métrique sans aucune mesure n'est pas listée.
- `SoonList` (composant + CSS, chargé d'emblée via `pageStyles.js`) partagé avec l'onglet Analyses (ex-`reco-soon`).
- Nouveauté `2026-10-25-0030-journal-en-couleurs.json`.

## Vérifications
- Vitest : suite complète **2 160** verts (nouveaux : thèmes des tuiles du Journal ; « Bientôt » de `FormeSection` ;
  radar, norme cardiaque et régularité du sommeil signalent leur ligne sans carte).
- Build OK ; lint inchangé (6 erreurs préexistantes, 0 avertissement).
- Captures relues : `--play` démo clair (Journal 3 écrans, Tendances, Analyses), `--play --dark` (mêmes pages),
  `--play --empty` (Journal, Tendances, Analyses). Pas de capture en données partielles (le jeu de démo a tout) : le cas
  est couvert par le test de `FormeSection`.

## Suite
- POL-6 fait. Ensuite : **POL-8** (Sources : détection automatique, carte Huawei seulement si détectée, diagnostic
  derrière le mode caché ; maquette I164) → POL-1 (après P28).
