# 2026-10-20 04:30 Paris (02:30 UTC) — Facteurs X comparés à l'humeur estimée (Y automatique)

**Type** : 🔴🙂 bien-être automatique (charte §0000000)  ·  **PR** : #227

## Pourquoi
- Vérifications de début de run : main à `def8788` (#226), « Build & Release » vert (v180), « Tests » et émulateur A56
  verts ; aucune PR « [Auto] » ouverte ; signalement du 19/10 15:05 corrigé (#221) ; aucun diagnostic de l'A56 reçu.
- Consigne du 19/10 au soir : étapes 1 et 2 livrées. Il manquait le bout de la chaîne : l'humeur estimée s'affichait,
  mais les Analyses (le cœur « science personnelle », D6) ne comparaient les facteurs qu'aux **notes** — le propriétaire
  n'en a aucune (« Calibration : 0 jour »), donc rien. C'est l'item « écrire l'estimation du jour comme colonne Y » du
  backlog : le bien-être 100 % auto devient exploitable.
- Écarté pour ce run : faire lire la valence par `gate.js` — vérifié, `gateDays` prend déjà toutes les clés de
  `values` (valence et éveil compris, dès qu'elles couvrent 80 % des jours notés) ; sans notes, effet nul aujourd'hui.

## Ce qui a été fait
- `mood/faceMoodDays.js` :
  - `faceMoodDays(entries)` : jour retenu s'il a ≥ 3 lectures du déverrouillage avec visage ; note du jour = médiane
    des `estimateBurst` (modèle valence / éveil ou a priori, visage habituel, calibration facultative) ; ligne de base
    calculée **une fois par jour** à la dernière lecture (`estimateBurst` accepte `ctx.base`) → 120 jours × 50
    lectures en < 3 s dans le test (au lieu de O(lectures²)).
  - `faceMoodAnalysisEntries` : notes retirées, une « note » synthétique par jour à l'heure de sa **dernière
    lecture** → la règle d'ordre temporel existante (DAY_OVER_HOUR, `beforeRating`) s'applique telle quelle.
  - `computeFaceMoodCorrelations` : `no_face` / `not_enough_data` (< 14 jours) / `ok` via `computeBasicCorrelations`
    (week-end, n effectif, p, Benjamini-Hochberg) ; aucun levier (D6).
- Worker `basicAnalysis` : `faceMood` ; `ANALYSIS_LIMITS.types.face_burst = 10000` (avant : 1 000 par défaut, ≈ 20 jours).
- `Recommendations.jsx` : `FaceMoodSection` (barres, liens incertains repliés, « Comment c'est calculé »), affichée
  aussi quand les notes manquent (sous « Données insuffisantes »).
- Données de démonstration : rafales du visage sur 30 jours (au lieu de 10).

## Tests
- Vitest : **1 597 verts** (+13) — `faceMoodDays.test.js` (9 : jours ≥ 3 lectures, test / sans visage exclus,
  médiane, perf, notes remplacées et datées, `no_face`, < 14 j, lien net et lien inverse sans note, anti-circularité
  avec tags `stress` dans des notes, pas faits après la dernière lecture exclus) ; `Recommendations.test.jsx` (+3 :
  section sans aucune note, « 4 jours sur 14 », rien sans visage) ; tests utilisant `demoData` toujours verts.
- `npm run lint` : 6 erreurs, identiques à main. `npm run build` ✅. `npm run visual` (toutes pages), `--empty` et
  `--light` (Analyses, Accueil) ✅ sans erreur JS ; captures lues : Analyses (section « Avec votre humeur estimée
  (visage) », 29 jours, VFC + 0,59, sommeil + 0,53, 35 liens incertains repliés), Accueil (carte « Humeur estimée »
  inchangée).

## Risques connus
- L'estimation d'un jour est plus bruitée qu'une note : les liens ne sortent nets qu'avec un effet fort ; le seuil
  de 14 jours et BH limitent les faux liens, pas le manque de puissance.
- Sans calibration, l'humeur estimée retire la moitié de la valence habituelle sur 28 jours : un facteur qui change
  lentement (saison) est en partie absorbé. Choix prudent (moins de faux liens).

## Pour le propriétaire (Galaxy A56)
Rien de nouveau à faire : dès que la lecture du visage tourne (diagnostic toujours attendu, voir le résumé), la section
apparaîtra dans Analyses et comptera « N jours sur 14 ».

## Suite proposée
1. 📥 Diagnostic de l'A56 (déverrouillages + modèle).
2. 💡 Run idées 08:30 : EmoNet (licence), modèles vocaux embarquables (étape 3).
3. 🙂 Habitudes (tags) et effets décalés sur l'humeur estimée ; « Applis jamais en veille » (I123).
