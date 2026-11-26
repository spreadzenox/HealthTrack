# Simulation — Ventre et données — J45 — 2026-11-26 08:30

- **Persona** : n° 1 « Ventre et données » — syndrome de l'intestin irritable, mal au ventre souvent, veut comprendre avec des chiffres ce qui déclenche ses crises (aliments, FODMAP, sommeil, stress).
- **Configuration** : n° 2 « iPhone seul » (iPhone 12 à 17, pas comptés par le téléphone, sommeil seulement par les horaires de coucher, pas de montre ni de balance, poids 23 %) — données reçues : repas, digestion, bien-être, météo ; « Pas » affichés (166 aujourd'hui, 6 756 d'habitude) avec une source « Samsung Health — Reçu » ; absentes : sommeil (« Pas assez de données »).
- **Moment** : jour 45 — Tendances avec ~30 jours de bien-être et de confort digestif (notes Calme/Gêne/Douleur), confort digestif 3,6/5 sur 7 jours, 4 repas habituels « Refaire un repas » (10 à 15 fois chacun), 400 entrées dans la sauvegarde.

## Tâches
1. Voir l'évolution de mon confort digestif sur un mois — réussie (Données > « + » > Confort digestif > Mois), mais graphique très chargé et pas de résumé chiffré.
2. Savoir quels aliments / sous-groupes FODMAP sont liés à mes mauvais jours — partiellement réussie (Objectifs > Ce qui va avec votre confort digestif > Alimentation > dépliant « Ce qui a été comparé ») : tableau par FODMAP trouvé, mais conclusion « Rien à éviter » et fructanes absents.
3. Noter une crise de ventre — réussie (Ma journée > Digestion > Douleur, enregistré en un geste), mais impossible de préciser le type (ballonnements, diarrhée…) ou l'intensité.
4. Noter un repas (petit-déjeuner décrit) — réussie (Matin > Décrire le repas > Remplir avec l'IA, correction des grammes, ajout du lait, alerte lactose/fructose affichée).
5. Exporter un rapport pour ma gastro-entérologue — réussie (« Créer le PDF » 4 sem. ; aussi JSON et CSV dans Réglages > Sauvegarde).
6. Lancer un essai d'éviction / une réintroduction — ratée : rien trouvé (ni dans Objectifs, ni dans « Autre chose », ni dans « Suivre une habitude »).

## Compris
- La courbe du mois montre mes notes (losanges) et une estimation (ronds), et toucher un jour ouvre son détail avec mes saisies du jour (repas, digestion, bien-être avec « Stress, Malade ») — capture : `captures/2026-11-26-0830-ventre-et-donnees-J45/detail-13-nov.png`
- Le tableau Alimentation donne des chiffres par sous-groupe FODMAP (sorbitol, GOS, lactose, fructose en excès), en points sur 5, court terme et moyen terme, avec les exemples d'aliments : exactement ce que je cherchais — capture : `captures/2026-11-26-0830-ventre-et-donnees-J45/alimentation-fodmap.png`
- Noter « Douleur » se fait en un geste et la dernière note est rappelée (« Dernière note : Douleur, à 08:34 ») — capture : `captures/2026-11-26-0830-ventre-et-donnees-J45/noter-digestion.png`
- Au moment de noter le repas, l'app signale « Riche en lactose : lait, yaourt » avec la quantité en grammes, et alerte « 5 kg, c'est bien ça ? » quand je me trompe de chiffre.
- Le rapport PDF, le CSV et la sauvegarde JSON sont faciles à trouver et se téléchargent sans souci.

## Pas compris
- « Rien à éviter pour l'instant » alors que juste en dessous le fructose en excès fait −1,2 pt et le sorbitol −1,1 pt sur 2 à 6 jours : c'est énorme sur une note sur 5, pourquoi on me dit qu'il n'y a rien ? Et le sorbitol est à +0,5 le jour même mais −1,1 après : je ne sais pas quoi en faire — capture : `captures/2026-11-26-0830-ventre-et-donnees-J45/alimentation-fodmap.png`
- Je ne vois pas les fructanes (blé, oignon, ail) ni le mannitol : ce sont mes suspects n° 1 avec le SII, et mes tartines de pain ne déclenchent aucun avertissement — capture : `captures/2026-11-26-0830-ventre-et-donnees-J45/alimentation-fodmap.png`
- Le 13 novembre, j'ai noté « douleur » (1) mais la courbe dit 2,0 « estimé avec les jours voisins » : pourquoi l'app ne garde pas ma note ? Et « Plus de repas riches en lactose » apparaît en +0,11 pt (positif) sur un jour de crise : ça veut dire que le lactose m'aide ? — capture : `captures/2026-11-26-0830-ventre-et-donnees-J45/detail-13-nov.png`
- Le graphique du mois en zigzag (seulement 1, 3 ou 5) avec deux couleurs, losanges, ronds, bandes et pointillés est illisible : je voudrais juste « 9 jours de douleur sur 30 » — capture : `captures/2026-11-26-0830-ventre-et-donnees-J45/tendances-mois.png`
- « Encore 3 choses aujourd'hui » ne bouge pas après avoir noté ma digestion puis mon petit-déjeuner (Repas 1 sur 3) — capture : `captures/2026-11-26-0830-ventre-et-donnees-J45/ma-journee-3-choses.png`
- Sommeil « Pas assez de données » au bout de 45 jours, et je ne trouve nulle part où entrer mes heures de coucher. En plus, Sources affiche « Samsung Health — Reçu » alors que j'ai un iPhone — capture : `captures/2026-11-26-0830-ventre-et-donnees-J45/sources.png`
- « Environ 5,1 g, pour un repère de 0,15 g par repas » sur le miel : je ne sais pas ce qu'est ce repère ni pourquoi il est si bas.

## Constats → étapes POLISH au BACKLOG
- [ ] Alimentation (confort digestif) : la phrase « Rien à éviter pour l'instant » contredit des effets de −1,2 / −1,1 pt affichés dessous ; dire plutôt « Fructose en excès et sorbitol semblent aller avec un ventre moins bien 2 à 6 jours après, mais pas encore assez net (N jours) ».
- [ ] Analyse FODMAP : ajouter les fructanes (blé, seigle, oignon, ail) et le mannitol aux sous-groupes comparés et aux alertes « Riche en… » du formulaire repas (le pain ne déclenche rien aujourd'hui).
- [ ] Ma journée : aucun moyen de lancer un essai d'éviction ou une réintroduction FODMAP ; ajouter une entrée « Tester un aliment » depuis Alimentation (ex. « Éviter le fructose 2 semaines »).
- [ ] Noter la digestion : après « Gêne/Douleur », proposer en option le type (ballonnements, diarrhée, constipation, crampes) et l'heure de début, pour relier les crises aux repas.
- [ ] Tendances > détail d'un jour : quand la personne a noté sa digestion, afficher sa note (1) et pas une estimation lissée (2,0) ; et ne pas lister un facteur positif (+0,11 pt) dans « Ce qui a pu jouer » d'un jour de crise sans expliquer le sens.
- [ ] Tendances, Confort digestif en Mois : ajouter un résumé chiffré au-dessus (« 9 jours de douleur, 6 de gêne, 15 calmes sur 30 ») ; le zigzag 1/3/5 seul est illisible.
- [ ] Bulle « Encore 3 choses aujourd'hui » : le compteur ne baisse pas après un repas et une digestion notés ; le mettre à jour ou dire ce qui reste.
- [ ] Sommeil sans montre (iPhone seul) : « Pas assez de données » sans lien pour saisir ses horaires de coucher ; ajouter « Noter mes heures de coucher » sur la carte Sommeil.
- [ ] Sources : « Samsung Health — Reçu » affiché en configuration iPhone seul (à vérifier : seed de la simulation ou libellé de source).
- [ ] Formulaire repas : toucher une quantité n'en sélectionne pas le contenu (taper 20 sur 100 donne 10020 → 5000 g) ; sélectionner tout au focus.
- [ ] Alerte FODMAP du repas : « repère de 0,15 g par repas » trop technique ; dire « au-delà de ~0,15 g, certaines personnes réagissent ».
