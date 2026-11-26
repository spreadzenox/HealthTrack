# Simulation — Ventre, sans technique — J45 — 2026-11-26 20:30

- **Persona** : n° 2 « Ventre, sans technique » — SII, mal au ventre souvent, peu à l'aise avec les applis, veut savoir quoi éviter ; phrases simples, patience limitée
- **Configuration** : n° 2 « iPhone seul » (iPhone 12 à 17 sans montre, poids 23 %) — nombre de pas reçu par l'app Santé (seule courbe « Pas » proposée dans Tendances, non ouverte) ; pas de sommeil mesuré, pas de cœur
- **Moment** : jour 45, juste après la grande mise à jour (compagnon Pilou) — 45 jours de repas et de digestion notés, 405 entrées, bandeau « Nouveau : Nouveaux onglets » à l'Accueil, un essai « Dormir au moins 7 h 30 » déjà en cours (jour 4 sur 10)

## Tâches
1. Comprendre ce qui a changé — réussie (bandeau « Voir » → page Nouveautés claire, mais longue)
2. Noter mon repas du soir — réussie (Soir → « Décrire le repas » → IA → Enregistrer ; ça marche mais le formulaire s'ouvre déjà descendu, sans titre)
3. Noter ma digestion — réussie (Ma journée → « Votre digestion ce soir » → Calme / Gêne / Douleur : très simple)
4. Savoir quoi éviter pour mon ventre — ratée (Objectifs → Confort digestif → Alimentation : « Rien à éviter pour l'instant » après 45 jours, alors que le détail montre Fructanes −1,2 pt)
5. Voir ma digestion dans le temps — réussie de justesse (Données → Tendances → « + » → Confort digestif ; deux sortes de points que je ne comprends pas)
6. Préparer quelque chose pour mon médecin — réussie (Réglages → Sauvegarde → Rapport PDF → Créer le PDF, fichier téléchargé)

## Compris
- La digestion se note en un geste : Calme, Gêne ou Douleur, et le petit message me remercie — capture : `captures/2026-11-26-2030-ventre-sans-technique-maj-J45/rien-a-eviter.png`
- La phrase « Rien à éviter pour l'instant : aucun aliment ne va nettement avec une digestion moins bonne » est simple et claire, même si elle me déçoit — capture : `captures/2026-11-26-2030-ventre-sans-technique-maj-J45/rien-a-eviter.png`
- Le rapport PDF pour le médecin : 3 choix de période, un bouton, c'est fait (pas de capture)

## Pas compris
- « Rien à éviter », mais juste en dessous « Fructanes −1,2 pt » avec une grosse barre hachurée. Alors je dois éviter l'oignon ou pas ? Et « Fructose en excès » fait +0,5 le jour même et −1,3 quelques jours après : c'est bon ou c'est mauvais ? — capture : `captures/2026-11-26-2030-ventre-sans-technique-maj-J45/compare-fructanes.png`
- Après mon repas, un encadré orange dit « Parfois mal digérés » sur TOUS mes aliments (pâtes, oignon, yaourt). Quand je l'ouvre ça devient « Riche en fructanes », « lactose », grammes, « repère 0,3 g », « Varney 2017 »… Je ne sais pas ce qu'est un fructane — capture : `captures/2026-11-26-2030-ventre-sans-technique-maj-J45/fodmap-technique.png`
- 45 jours que je note, et on me dit encore « Pas assez net pour l'instant » partout, et « encore 11 jours avec votre digestion notée » pour le long terme. Je croyais avoir assez noté — capture : `captures/2026-11-26-2030-ventre-sans-technique-maj-J45/confort-digestif.png`
- Dans Tendances, ma digestion a deux sortes de points : « votre note » (losange) et « l'estimation du jour » (rond). Le 25/11 j'ai mis Douleur (1) mais le rond est vers 2,6. Laquelle est la vraie ? — capture : `captures/2026-11-26-2030-ventre-sans-technique-maj-J45/tendances-deux-points.png`
- Un essai « Dormir au moins 7 h 30 » tourne dans Objectifs, mais mon iPhone ne mesure pas mon sommeil. Les jours 2 et 3 n'ont ni coche ni tiret, et « Consigne tenue 1 jour sur 5 prévus » alors qu'on est au jour 4. Et ça parle de bien-être, pas de mon ventre — capture : `captures/2026-11-26-2030-ventre-sans-technique-maj-J45/essai-sommeil.png`
- « Pilou a bien dîné » : c'est moi qui ai mangé, pas Pilou. Et je ne sais pas qui est Pilou au premier écran (pas de capture).

## Constats → étapes POLISH au BACKLOG
- [ ] Objectifs › Confort digestif › Alimentation : le verdict « Rien à éviter » côtoie Fructanes −1,2 pt sans explication. Ajouter sous le verdict une phrase simple (« L'oignon et le blé semblent aller avec plus de gêne, mais ce n'est pas encore sûr ») quand un facteur est fort mais incertain, et replier le tableau par défaut avec un intitulé « Détail (pour curieux) ».
- [ ] Formulaire repas, encadré FODMAP : le titre change de « Parfois mal digérés » (fermé) à « Riche en fructanes » (ouvert), et il marque tous les aliments d'un repas banal. Garder des mots simples (« blé, oignon, ail », « lait ») en premier, déplacer grammes/repères/références dans un « En savoir plus », et ne pas afficher l'encadré quand la quantité reste sous le repère.
- [ ] Tendances, Confort digestif : deux marques (« votre note » et « l'estimation du jour ») pour la même journée, qui se contredisent (25/11 : note 1, estimation ≈ 2,6). Montrer la note de la personne seule par défaut, ou expliquer en une ligne ce qu'est l'estimation.
- [ ] Objectifs, essai « Dormir au moins 7 h 30 » proposé/actif sans sommeil mesuré (iPhone seul) : jours sans coche ni tiret et « tenue 1 jour sur 5 prévus » au jour 4. Demander « Avez-vous dormi 7 h 30 ? » chaque matin quand aucune source ne mesure le sommeil, ou ne pas proposer cet essai ; préciser aussi qu'il porte sur le bien-être, pas sur le ventre.
- [ ] Confort digestif, « Pas assez net » / « encore 11 jours avec votre digestion notée » après 45 jours : dire combien de jours sont déjà comptés (« 34 jours notés sur 45 ») et ce qui manque, pour que la personne ne pense pas que ses 45 jours n'ont servi à rien.
- [ ] Ma journée › Soir › « Décrire le repas » : la page /food s'ouvre défilée au milieu du formulaire, sans titre ni contexte. Ouvrir en haut, champ de description focalisé.
- [ ] Ma journée, message du compagnon « Bravo, Pilou a bien dîné » : formuler du point de vue de la personne (« Votre dîner est noté ») et présenter Pilou en une phrase au premier écran après la mise à jour.
