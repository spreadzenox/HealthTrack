# Simulation — Ventre et données — J45 — 2026-11-24 20:30

- **Persona** : n° 1 « Ventre et données » — syndrome de l'intestin irritable, mal au ventre souvent ; veut comprendre avec des chiffres ce qui joue sur son ventre (aliments, groupe FODMAP, délai) et montrer quelque chose à sa gastro-entérologue.
- **Configuration** : n° 1 « Android seul » (téléphone Samsung, aucune montre, poids 33 %) — reçus : pas (3 860 aujourd'hui, « d'habitude 7 181 ») ; absents : fréquence cardiaque, VFC, sommeil (« Sommeil : pas assez de données »).
- **Moment** : jour 45 — repas notés (≈ 8 repas sur 5 jours la dernière semaine, « Œuf brouillé, haricot vert » refait 15 fois), digestion notée presque chaque jour (douleur le 23/11 à 11:19, selles type 4), bien-être noté ; confort digestif moyen 3,6/5 sur 7 jours, aucun lien « net » encore.

## Tâches
1. Savoir ce qui joue sur mon ventre et avec quelle certitude — réussie en partie (Objectifs → « Ce qui va avec votre confort digestif » → Alimentation : 8 facteurs FODMAP par délai, tous hachurés « pas assez net », mais signes contradictoires d'un délai à l'autre).
2. Retrouver ma mauvaise journée récente et ce qui l'a précédée — réussie en partie (Données → + Confort digestif → toucher le 23/11 : saisies du jour visibles, mais « Ce qui a pu jouer » ne parle que du bien-être et rien sur les repas de la veille).
3. Noter le repas d'hier soir — réussie (Ma journée → Repas → « Décrire le repas » → IA ; la crème oubliée ajoutée à la main ; l'heure n'a pu être mise au 23/11 qu'au 3e essai dans le champ date).
4. Noter une gêne maintenant — réussie (« Noter ma digestion » → « Noter un moment précis » → Gêne ; « Dernière note : Gêne, à 20:35 »).
5. Préparer quelque chose pour ma gastro-entérologue — réussie (« Préparer le rapport » → 4 sem. → « Créer le PDF » → « Halcya-rapport-2026-11-24.pdf téléchargé » ; contenu non visible avant envoi).
6. Savoir quel groupe FODMAP essayer ensuite — ratée (Accueil → Agir : « Rien en cours pour l'instant », aucun essai que je peux lancer moi-même).

## Compris
- Le détail d'un jour est clair : « vous avez noté « douleur » (1) », mes saisies heure par heure (repas, digestion, selles), et la légende « Confort digestif : Calme 5, Gêne 3, Douleur 1 ». — capture : `captures/2026-11-24-2030-ventre-et-donnees-J45/jour-23-ce-qui-a-joue.png`
- La page « Votre confort digestif » dit honnêtement « Aucun lien assez net pour l'instant », combien de facteurs sont comparés (9, de 0 à 6 jours avant) et combien de jours il me manque pour le long terme (« encore 12 jours »). Ça me rassure sur le sérieux. — capture : `captures/2026-11-24-2030-ventre-et-donnees-J45/confort-digestif.png`
- Le découpage par groupe FODMAP (fructose en excès, sorbitol, GOS, lactose) avec des exemples d'aliments entre parenthèses, et l'unité « pt » expliquée, c'est exactement le langage de ma gastro. — capture : `captures/2026-11-24-2030-ventre-et-donnees-J45/alimentation-fodmap.png`
- En notant mon repas, l'app m'a dit tout de suite « Riche en fructanes : ail, oignon… », « Riche en lactose : crème fraîche », avec les quantités et un repère par repas. Très utile. — capture : `captures/2026-11-24-2030-ventre-et-donnees-J45/repas-fodmap.png`
- Le rapport PDF « deux pages pour votre médecin », période 2/4/12 semaines, créé sur le téléphone. — capture : `captures/2026-11-24-2030-ventre-et-donnees-J45/rapport-pdf.png`

## Pas compris
- « Fructose en excès : +0,8 pt » le jour même et la veille, mais « −1,2 pt » de 2 à 6 jours avant : alors le miel, c'est bon ou mauvais pour mon ventre ? Et en haut « Rien à éviter pour l'instant », alors que −1,2 pt sur 5 me paraît énorme. Je ne sais pas quoi en retenir. — capture : `captures/2026-11-24-2030-ventre-et-donnees-J45/alimentation-fodmap.png`
- Sur ma mauvaise journée du 23/11, « Ce qui a pu jouer ce jour-là » parle de mon **bien-être** (« moins de repas riches en lactose… −0,06 pt »), pas de mon ventre. Et je ne vois pas ce que j'ai mangé la veille, alors que c'est justement ce que je cherche. — capture : `captures/2026-11-24-2030-ventre-et-donnees-J45/jour-23-ce-qui-a-joue.png`
- Ce jour-là j'ai noté « douleur » (1) mais le point du graphique vaut 2,5 « estimé avec les jours voisins » : pourquoi l'app change-t-elle ce que j'ai noté ? — capture : `captures/2026-11-24-2030-ventre-et-donnees-J45/jour-23-ce-qui-a-joue.png`
- « Agir » : je voudrais essayer une semaine sans lactose ou sans fructanes, mais je ne peux rien lancer tant que « vos analyses » n'ont rien repéré. — capture : `captures/2026-11-24-2030-ventre-et-donnees-J45/agir-vide.png`
- Le PDF est « téléchargé » mais je ne vois pas ce qu'il contient, ni où il est, ni un bouton pour l'envoyer. — capture : `captures/2026-11-24-2030-ventre-et-donnees-J45/rapport-pdf.png`
- Pour mettre « hier soir » sur mon repas, j'ai dû me battre avec le champ date (il est passé à 03/11 puis à 31/03/2026 avant de prendre 23/11 19:30).
- Pendant que je note mon repas, c'est l'onglet « Données » qui est allumé en bas, alors que je venais de « Ma journée ».
- L'onglet s'appelle « Objectifs » mais je n'y ai trouvé aucun objectif, seulement mes moyennes et les analyses.

## Constats → étapes POLISH au BACKLOG
- [ ] Alimentation (/recommendations/ventre/famille/nutrition) : quand un même facteur change de signe entre « court terme » et « moyen terme » (fructose +0,8 / −1,2), ajouter une phrase en clair sous le facteur (« effet qui semble apparaître 2 à 6 jours après, encore incertain ») et rappeler à côté de « Rien à éviter » que les plus gros chiffres sont hachurés donc pas fiables.
- [ ] Détail d'un jour (Tendances, toucher un jour) : quand la série Confort digestif est affichée, faire porter « Ce qui a pu jouer ce jour-là » sur le confort digestif (pas seulement le bien-être) et ajouter un lien « Repas de la veille » (ou les afficher repliés).
- [ ] Détail d'un jour : quand une note existe (« douleur » = 1), afficher la valeur notée sur le point du jour, ou expliquer en une phrase pourquoi la valeur lissée (2,5) diffère.
- [ ] Agir (/agir) : proposer un essai lancé par l'utilisateur même sans piste nette (ex. « Essayer 1 semaine sans lactose / fructanes ») avec mesure avant/après — c'est la démarche FODMAP qu'attend un patient SII.
- [ ] Rapport PDF : après « Créer le PDF », offrir « Ouvrir » / « Partager » (et un aperçu des 2 pages) au lieu du seul texte « …pdf téléchargé ».
- [ ] Nouveau repas : ajouter des puces rapides « Maintenant / Hier midi / Hier soir » au-dessus du champ « Heure du repas », le champ date-heure étant pénible à corriger au clavier.
- [ ] Barre du bas : sur /food ouvert depuis Ma journée, garder « Ma journée » actif (ou ne rien allumer) plutôt que « Données ».
