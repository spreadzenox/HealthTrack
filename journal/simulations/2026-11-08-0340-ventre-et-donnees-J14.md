# Simulation — Ventre et données — J14 — 2026-11-08 03:40

- **Persona** : n°1 Ventre et données — 34 ans, SII, mal au ventre souvent, veut comprendre avec des chiffres
- **Configuration** : n°11 iPhone + Apple Watch + Withings (balance Body, tensiomètre ; poids 2 %) — sommeil, FC, FC repos, VFC, pas, température, respiration reçus ; SpO2, phases de sommeil, poids et tension absents à l'écran
- **Moment** : jour 14 — ~14 jours de bien-être, 10 notes digestives sur 28, données montre quotidiennes (sommeil 7 h 10, VFC 51 ms, pas 8 585), repas et cigarettes dans le Journal

## Tâches
1. Comprendre l'app en 30 secondes (écran Aujourd'hui) — réussie à moitié : boutons clairs, mais bandeau « Nouveau » obscur
2. Noter ma digestion du jour — réussie : Aujourd'hui > Noter ma digestion > Gêne, enregistré aussitôt (« Gêne, à 03:37 »)
3. Savoir ce qui joue sur mon ventre (Analyses > Digestion) — ratée : « arrivent dans 18 jours », aucun chiffre pour l'instant
4. Comparer digestion et sommeil/VFC dans Journal > Tendances — à moitié : courbe Confort digestif OK, mais pas de SpO2, tension, poids, phases
5. Trouver d'où viennent mes données de montre (Sources) — ratée/confuse : « Gadgetbridge » et Health Connect, rien sur Apple Watch/Withings
6. Exporter mes données (Réglages > Données) — réussie pour la sauvegarde ; le rapport PDF est « premium » verrouillé

## Compris
- Noter la digestion en un geste (Calme/Gêne/Douleur) avec rappel de la dernière note — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/aujourdhui-donnees.png`
- La barre « 10/28 jours » et la méthode (« Comment c'est calculé ») : fenêtres de jours, effets montrés seulement s'ils prédisent mieux — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/analyses-digestion-attente.png`
- Journal « Hier » : une grille de chiffres (sommeil, FC repos, VFC, respiration, température, stress, dépense) avec « d'habitude » — très bien pour moi — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/journal-hier.png`
- Tendances : on superpose bien-être et confort digestif, on touche un jour pour le détail — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/tendances-detail-jour.png`
- Sauvegarde et import des données, en local — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/donnees-export.png`

## Pas compris
- « Tendances : la vue Jour s'ouvre sur un jour qui a des lectures et 258 autres changements » : du jargon de développeur, je ne sais pas ce que « lectures » veut dire ni pourquoi 258 changements — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/aujourdhui-donnees.png`
- Tendances, jour du 7 nov. : Bien-être « 3,2 /5 » mais « votre note 3,4 » (et 3,4 dans le Journal) ; je ne sais pas lequel croire — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/tendances-detail-jour.png`
- Confort digestif « 2,5 /5 noté « douleur » » : l'échelle est inversée (5 = bien ?) et ne le dit pas ; la courbe monte quand je vais mieux, contre-intuitif — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/tendances-detail-jour.png`
- Aujourd'hui dit « arrivent dans 19 jours » puis 18 jours après ma note, alors que ma note de 03:37 est à la fois « Gêne » aujourd'hui et la dernière « Douleur, hier à 11:19 » : le compte semble bouger de 1 par note, pas par jour — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/analyses-digestion-attente.png`
- Sources : « Gadgetbridge » reçoit mes mesures et dit « SpO2 jamais reçue », mais j'ai une Apple Watch ; Health Connect est désactivé alors que mes données arrivent, et rien sur Apple Santé / Withings — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/sources-gadgetbridge.png`
- Je ne trouve nulle part mon poids, ma tension, mes phases de sommeil (profond/léger), ni la SpO2 ; la carte « Sommeil » ne montre qu'une durée — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/journal-hier.png`
- Agir : « Rien en cours » — je ne sais pas comment obtenir une piste — capture : `captures/2026-11-08-0340-ventre-et-donnees-J14/donnees-export.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Aujourd'hui / Réglages : réécrire le bandeau « Nouveau » en langage patient (pas de « lectures », pas de « 258 autres changements »), ou le masquer.
- [ ] Tendances > détail d'un jour : harmoniser la note Bien-être (3,2 moyenne vs « votre note 3,4 ») avec une phrase claire (« moyenne du jour » vs « note saisie »).
- [ ] Confort digestif : afficher le sens de l'échelle (5 = calme, 1 = douleur) sous la courbe et dans le détail jour ; remplacer « /5 » par un libellé.
- [ ] Analyses > Digestion : expliquer le compte à rebours (« encore X notes ») et rester cohérent entre Aujourd'hui et Analyses ; montrer au moins une corrélation provisoire pour garder l'intérêt avec des chiffres.
- [ ] Sources : adapter à iPhone/Apple Watch/Withings (parler d'Apple Santé ou d'import fichier), ne pas afficher « Gadgetbridge » sans explication, et expliquer pourquoi Health Connect est désactivé alors que des données arrivent.
- [ ] Journal / Tendances : proposer SpO2, FC, phases de sommeil, poids et tension comme courbes ou cartes quand elles existent, et dire clairement « non reçu » sinon.
- [ ] Agir : expliquer ce que l'écran attend (« après vos premières analyses, des essais apparaîtront ici »).
