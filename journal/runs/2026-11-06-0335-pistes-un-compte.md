# 06/11 03:35 — Un seul compte à rebours des pistes (PISTES-UN-COMPTE)

Type : 🔧 run de code (03:35 Paris). Priorité : reprendre la PR verte du run précédent, puis revue de la version
candidate (C1, installation neuve) puisque les retours du 04/11 sont traités et que le chantier montre attend les
relevés du propriétaire.

## Constat au démarrage
- main `87a5410` : Tests, Build & Release, émulateur A56, Play — AAB, Play — Alpha verts. PR #743 (BE-SEMAINES) verte,
  à jour sur main, merge laissé à ce run → **mergée** (squash, `29acaed`).
- Alpha = 100811 en examen ; porte de 24 h jusqu'au 06/11 vers 16:30 (CD-ALPHA-6 à vérifier au premier report réel).

## Revue (variante play, données vierges, 360 × 780)
- Accueil : « Vos pistes arrivent dans 21 jours » (0/21 jours avec un repas ou une note du ventre) ; onglet Ventre :
  « Vos pistes du ventre arrivent dans 28 jours » ; onglet Bien-être : « 5 jours ». Les deux premiers parlent de la même
  attente avec deux chiffres. → corrigé.
- Onglet Ventre vierge : bloc « Bientôt · Rapport PDF pour mon médecin · dès votre 1re note du ventre » (phrase en mono,
  mot « Bientôt ») → POL-PLAY-VENTRE-BIENTOT au backlog.
- `--empty --routes=/` échoue ~1 fois sur 4 sur `networkidle`, autant sur main → VISUAL-FLAKY-1.

## Fait
- `PistesTeaser` (TodayCards.jsx) : trois cas. Carte ventre montrée → compte des notes du ventre (`gutNotesProgress`,
  seuil 28, celui de `gutLinks`) dès le premier jour : chaque jour noté est un jour suivi, l'étape « 21 jours suivis »
  n'apportait rien. Carte ventre masquée → jours avec un repas, aucun mot sur le ventre (retour (3)). Énergie inchangé.
  Ligne de détails : « minimum 28 jours de notes du ventre » ou « minimum 21 jours suivis ».
- « (6 dernières semaines) » insécable.
- Nouveautés `2026-11-06-0335-pistes-un-compte.json`.

## Vérifications
- `npm run test` : 3 181 verts (2 tests nouveaux, 4 adaptés ; vus en échec avant le correctif) ; `npm run build` OK ;
  `npm run lint` 0 erreur ; `npm run visual` complet ; captures relues : Accueil vierge (« 28 jours », 0/28), démo sombre
  (19 jours, 9/28) = onglet Ventre démo (19 jours, 9/28) ; objectif « tout » vierge.

## Suite
- POL-PLAY-VENTRE-BIENTOT ; VISUAL-FLAKY-1 ; CD-ALPHA-6 vers 16:30 ; redécaler `until` si l'invitation part après le
  06/11 ; GOLD-a3-2 dès P37 ; TEST-ALPHA-1 (07–08/11) ; chantier montre.
