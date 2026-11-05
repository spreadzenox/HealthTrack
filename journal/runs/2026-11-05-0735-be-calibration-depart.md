# 05/11 07:35 — Calibration de départ du bien-être (BE-BIAIS-2)

Type : 🎨 run de code (07:35 Paris). Priorité : retours du 04/11, point (5) (bien-être sous-estimé).

## Constat au démarrage
- main vert (v504, `9eba07b`, « Play — Alpha » réussi : 100792 sur Alpha, en examen).
- PR #709 (BE-HISTO-DETAIL-2, run de 05:35) ouverte depuis 1 h 53, **en conflit** (ligne du tableau de
  `journal/README.md` ajoutée en parallèle par le run de 06:35) : passée en premier. Fusion d'origin/main dans sa
  branche, conflit résolu (les deux lignes gardées), `npm run test` (3072 verts), build, lint 0 erreur, `npm run visual`
  complet OK, capture « Historique du bien-être » relue (flèches de période en place). Poussée (`0d705d5`).

## Fait (branche `claude/auto-be-calibration`)
- `faceMood.js` : `startCalibration(entries, calibration, today)` → `{ done, needed: 3, notedToday }` tant que moins
  de 3 jours ont une note et une lecture (mêmes jours que le recalage de BE-BIAIS-1) et sans modèle personnel ; sinon
  null. Rendu par `faceMoodEstimate`.
- `MoodEstimateCard.jsx` : encart « Réglage sur vous : N jour(s) sur 3 » (trois points de progression, une phrase,
  bouton principal « Noter mon bien-être du jour », qui ouvre la note manuelle existante) ; le lien « Noter moi-même »
  est masqué pendant ce temps (pas de doublon). Note du jour donnée : ligne discrète « Prochaine note demain ».
  Jamais bloquant, rien de forcé.
- Durée : 3 jours, la plus courte qui suffit (le recalage démarre à 3 jours notés) ; le propriétaire proposait 3 à 5.
  La calibration continue, c'est le recalage de BE-BIAIS-1 qui suit chaque nouvelle note.
- `npm run visual -- --calibration` : démo avec une seule note, hier (1 jour sur 3).
- Règle 5 : rien ne change aux entrées de l'estimateur (notes et visage, côté Y).

## Vérifications
- TDD : 3 tests `faceMood.test.js` (demande, note du jour donnée, fin à 3 jours) et 3 tests `MoodEstimateCard.test.jsx`
  (encart et bouton, ligne discrète, rien sans calibration) ; test des textes (SLOP_WORDING) vert.
- Captures Accueil `--calibration`, clair et sombre, relues : encart lisible, bouton émeraude contrasté.

## Suite
- BE-BIAIS-3 : recentrer la grille des expressions sur l'habitude de la personne (« tristesse » au repos) et
  fiabilité affichée honnêtement. Puis ANALYSES-ONGLETS-3 (trois horizons).

## Après le merge
- PR #712 mergée (squash `32e92fb`) : 11 checks verts. « Build & Release » : **v505**, APK 34 544 710 octets.
  Émulateur Galaxy A56 vert. « Play — AAB » : 100794 en test interne ; « Play — Alpha » : **100794 placée sur l'alpha**.
- PR #709 (BE-HISTO-DETAIL-2) remise à jour une seconde fois sur main après #712 (fusion sans conflit, tests 3078
  verts, build, lint 0 erreur). Premier passage : « Bord à bord sous Android 14 » rouge (encarts natifs corrects,
  haut 128 et bas 63, lecture côté page à 0 px) ; relance du seul job : vert. Second passage : 11 checks verts.
  Mergée (squash `7ffd877`) : **v506**, APK 34 545 830 octets ; « Play — Alpha » : **100795 placée sur l'alpha**
  (en examen chez Google).
- Le faux rouge « Bord à bord » est noté pour surveillance : s'il revient, regarder le moment de la lecture des
  encarts côté page dans `.github/scripts/edge-insets/check.mjs`.
