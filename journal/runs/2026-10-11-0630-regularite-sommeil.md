# 2026-10-11 06:30 UTC — Régularité du sommeil

**Type** : 🏗️  ·  **PR** : #99

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte, « Build & Release » v90 vert.
- Derniers runs : 🐛 🐛 🔭 → un travail de fond. Item n° 4 des prochaines étapes (R#6), conforté par les deux
  dernières veilles : la régularité des horaires est liée au bien-être du lendemain (Senthil et al. 2025) et, en
  observationnel, à la mortalité au-delà de la durée (Windred et al. 2023).

## Ce qui a été fait
- `services/sleepRegularity.js` :
  - `mainSleepPeriods` : enregistrements de sommeil séparés de < 2 h réunis (phases d'une même nuit, même celles qui
    finissent avant minuit), une nuit principale par jour de réveil (la plus longue : une sieste ne la remplace pas),
    2 h à 16 h ; « hors du lit » ignoré.
  - `computeSleepRegularity` (14 derniers jours, ≥ 7 nuits) : coucher / lever moyens et écart-type en minutes autour
    de minuit (23 h 30 et 0 h 30 → minuit) ; niveau « réguliers » (pire ET ≤ 30 min) / « assez » (≤ 60) / « variables » ;
    SRI simplifié (tranches de 30 min de midi à midi, même état à 24 h d'intervalle, seulement entre nuits consécutives
    enregistrées, ≥ 5 paires — une nuit sans montre n'est pas une nuit blanche) ; décalage du milieu de nuit le
    week-end (réveils samedi / dimanche, ≥ 2 nuits de week-end et 3 de semaine).
- `components/SleepRegularityCard.jsx` sur le tableau de bord, sous « Votre cœur vs votre norme » : badge, heures
  (arrondies à 5 min), indice / 100, ligne « Le week-end, vos nuits sont décalées de … » si ≥ 30 min, conseil prudent
  seulement si horaires variables ou décalage ≥ 1 h. Rien sans donnée de sommeil ; « Encore N nuits » sinon.
- `utils/format.formatClock` (minutes → « 23 h 25 »).
- Démo : coucher 45 min plus tard les nuits de week-end (le décalage apparaît sur les captures).
- **Outil visuel** : la barre d'onglets fixe cachait toujours ~60 px de contenu en bas du 1er écran, qui
  n'apparaissait sur aucune capture. Les écrans suivants chevauchent maintenant le 1er de la hauteur de la barre,
  barre masquée.

## Vérifications
- Tests : 697 ✅ (679 avant ; +12 sleepRegularity, +5 carte, +1 formatClock ; écrits avant le code)
  · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : 8 pages sans erreur JS ni débordement ; tableau de bord démo : « Assez réguliers », coucher 23 h 35 ± 20 min,
  lever 6 h 55 ± 45 min, indice 91 / 100, week-end décalé de 35 min ; `--empty` : la carte n'apparaît pas.

## Apprentissages / décisions
- Health Connect (plugin `@capgo/capacitor-health`) renvoie une **session** par nuit (durée = session complète,
  pas de phases) : début = coucher, fin = lever. Le code accepte aussi des phases séparées au cas où.
- Seuils de libellé fondés sur l'écart-type (≤ 30 / 60 min) plutôt que sur le SRI : plus parlant, et les seuils de
  SRI publiés dépendent de la population et de l'appareil. Aucun chiffre de risque affiché (études observationnelles).
- Bug à surveiller : radar et journal rattachent chaque **enregistrement** au jour de sa fin ; avec des phases
  séparées, une phase finie avant minuit tomberait la veille. Sans effet avec les sessions actuelles de Health Connect.

## Suite proposée
- 🏗️ Régularité, étape 2 : écart-type des horaires (ou SRI) comme variable des Analyses (« Se coucher à heure fixe »
  comme piste), mini-graphique des horaires sur 14 j.
- 🐛 Heure `datetime-local` sur l'A56 (captures émulateur), modale de check-in sur /food.
- 🏗️ Capacitor 8.4 ; effets décalés étape 2.
