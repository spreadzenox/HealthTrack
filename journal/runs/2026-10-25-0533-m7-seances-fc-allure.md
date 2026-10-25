# 2026-10-25 05:33 CET (04:33 UTC) — M7 : séances, FC et allure

**Type** : ⌚ chantier montre (signalement du 21/10 : couverture maximale ; « activités et entraînements, avec FC et allure »)

## Constat au démarrage
- Main à `8b39275` (#350, journal v265), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée) ; tous les
  workflows de main verts (Tests, Build & Release v265, Play — AAB, émulateur).
- Polissage du 24/10 terminé ; POL-1d attend P28 (propriétaire) → étape suivante du backlog : M7.

## Ce qui a été fait
- Spécification `protocoles/huawei.md` §7.5 bis (relecture de Gadgetbridge master pour comprendre, aucun code copié) :
  compteurs de blocs de la liste 0x17/0x07, en-tête et masque des points 0x17/0x0A, tronçons 0x17/0x0C ; §10.17.
- `sync.js` : `parseWorkoutIndex`, `workoutSamplesTlvs` / `parseWorkoutSamples` (FC + vitesse, reste du point sauté
  d'après sa longueur annoncée, point incomplet = fin du bloc), `workoutPaceTlvs` / `parseWorkoutPace` (km complets,
  unité km), `heartRateCurve` (une moyenne par minute) ; `readWorkouts` → `readWorkoutDetail` (40 blocs au plus, un
  bloc en échec garde la séance). Entrée `activity` : `avgHeartRate`, `heartRateCurve`, `paceSplitsSecPerKm`.
- Affichage : `workoutDetailParts` / `formatPace` (format.js) ; Journal → Jours : « FC moy. 143 bpm · 5:37 /km » en
  mono + courbe SVG (`HeartRateSpark`, couleur de marque) ; ligne « Séances » de « Données de la montre ».
- Faux montre (`fakeWatch.js`) : blocs d'échantillons et d'allures ; données de démo : une course synthétique d'hier.
- Entrée « Nouveautés ».

## Vérifications
- Vitest **2 189** verts (+4 : index / demandes / échantillons / allures / courbe ; bloc refusé ; Journal ; format) ; build OK ; lint inchangé (6 erreurs préexistantes) ; `npm run visual` OK ; captures `/journal` clair et sombre relues (séance avec courbe lisible),
  `/montre` sombre inchangée.

## Suite
- À confirmer sur la GT 6 Pro (course ou marche enregistrée, puis synchro app ouverte).
- M7b : séances relues app fermée (Java) ; M4 bis (étages) ; POL-1d dès P28.
