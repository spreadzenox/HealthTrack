# Simulation — Ventre, sans technique — J14 — 2026-11-25 20:30

- **Persona** : n° 2 « Ventre, sans technique » — syndrome de l'intestin irritable, peu à l'aise avec les applis, veut surtout savoir quoi éviter de manger ; parle simplement.
- **Configuration** : n° 1 « Android seul » (téléphone Samsung sans montre, poids 33 %) — reçues : pas (3 856 aujourd'hui, « d'après votre téléphone ») ; sommeil seulement estimé ; absents : cœur, VFC, oxygène.
- **Moment** : jour 14, juste après une mise à jour — bandeau « Nouveaux onglets » à l'Accueil, 13/14 jours de digestion notés avant ma note du jour, un essai « Dormir au moins 7 h 30 » en cours (jour 4 sur 10), bien-être 2,9 aujourd'hui / 3,1 sur la semaine, environ 11 repas sur 7 jours.

## Tâches
1. Comprendre ce qui a changé après la mise à jour — réussie (bandeau « Voir » → page Nouveautés claire : liste des nouveaux onglets).
2. Noter ma digestion du jour — réussie (Objectifs → « Noter maintenant » → fenêtre Calme / Gêne / Douleur, un toucher, merci de Pilou).
3. Noter mon repas de midi sans photo — réussie (« Aucune photo prise » → « Décrire le repas » → texte → « Remplir avec l'IA » → aliments reconnus + alerte « Parfois mal digérés » → enregistré).
4. Savoir quoi éviter de manger — ratée pour l'instant (score de confort 3,4/5 débloqué à 14 jours, mais les « pistes » ne viendront qu'au 28e jour ; seul un exemple fictif montre la réponse).
5. Voir mon ventre jour par jour dans Données — réussie à moitié (il faut deviner le « + » pour ajouter « Confort digestif » ; le détail du 24/11 transforme ma « Douleur » en 2,4).
6. Préparer un document pour mon médecin — réussie (Réglages → Sauvegarde → « Rapport PDF pour mon médecin » → « Créer le PDF » → fichier téléchargé).

## Compris
- La note de digestion est très simple : trois boutons, ça prend deux secondes, et Pilou me remercie — capture : `captures/2026-11-25-2030-ventre-sans-technique-maj-J14/objectifs-essai-sommeil.png`
- Après ma note, le score « Confort digestif 3,4/5 » apparaît enfin dans Objectifs, avec les barres de la semaine — capture : `captures/2026-11-25-2030-ventre-sans-technique-maj-J14/objectifs-essai-sommeil.png`
- Quand je décris mon repas, l'app me prévient tout de suite « Parfois mal digérés : pâtes, oignon, yaourt » : c'est exactement ce que je cherche — capture : `captures/2026-11-25-2030-ventre-sans-technique-maj-J14/repas-fodmap-jargon.png`
- Le rapport PDF pour le médecin se fait en deux touchers et dit clairement « téléchargé » — capture : `captures/2026-11-25-2030-ventre-sans-technique-maj-J14/rapport-pdf-ok.png`

## Pas compris
- « Riche en fructanes », « fructose en excès », « 2,3 à 6,6 g … pour un repère de 0,3 g par repas » : je ne sais pas ce que c'est, je voulais juste savoir si c'est grave ou pas — capture : `captures/2026-11-25-2030-ventre-sans-technique-maj-J14/repas-fodmap-jargon.png`
- Mon essai en cours parle de dormir 7 h 30, alors que moi je suis là pour mon ventre, et le téléphone ne sait pas vraiment combien je dors. « Jour 4 sur 10 » mais « Consigne tenue 1 jour sur 5 prévus » avec 5 lanternes : 10 ou 5 ? Et je ne vois aucun bouton pour dire « j'ai bien dormi » — capture : `captures/2026-11-25-2030-ventre-sans-technique-maj-J14/objectifs-essai-sommeil.png`
- J'ai mis « Douleur » le 24, et l'app affiche 2,4 « estimé avec les jours voisins » : pourquoi elle change ce que j'ai dit ? Et le losange de ma « Gêne » d'aujourd'hui n'apparaît pas sur la courbe — capture : `captures/2026-11-25-2030-ventre-sans-technique-maj-J14/tendances-douleur-estimee.png`
- Dans l'exemple du jour 28, « Fructanes −3,5 pt » sur une note qui va de 1 à 5 : un seul repas me ferait passer de calme à douleur ? Et « GOS +1,8 pt » (pois chiches, lentilles) qui serait bon pour le ventre, alors que c'est écrit FODMAP juste à côté — capture : `captures/2026-11-25-2030-ventre-sans-technique-maj-J14/exemple-j28-points.png`
- L'Accueil me parle de bien-être « d'après 4 lectures du visage », de pas et du sommeil, mais rien sur mon ventre, ni ma note du jour, ni mon score — capture : `captures/2026-11-25-2030-ventre-sans-technique-maj-J14/accueil-sans-ventre.png`
- La visite « Voir un exemple » m'emmène de Objectifs à l'Accueil/Agir, et passe de « jour 28 » à « Exemple au jour 14 » : je me suis perdue — capture : `captures/2026-11-25-2030-ventre-sans-technique-maj-J14/exemple-j28-points.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Repas / bandeau « Parfois mal digérés » déplié : remplacer en tête de chaque ligne « Riche en fructanes / fructose en excès / repère de 0,3 g » par une phrase simple (« Oignon : souvent mal toléré en grande quantité ») et ranger les grammes derrière un « détails ».
- [ ] Données › détail d'un jour : une note de digestion saisie (« Douleur » = 1) ne doit pas être affichée comme 2,4 « estimé avec les jours voisins » ; montrer la note saisie comme valeur principale, et afficher le losange « votre note » du jour même (la « Gêne » du 25/11 n'apparaît pas ; le bien-être « noté 3,4 » du 24/11 n'a pas de losange non plus).
- [ ] Accueil : pour une personne qui suit son ventre, ajouter une carte « Ventre aujourd'hui » (note du jour + score de la semaine + « pistes dans N jours ») au lieu de ne montrer que le bien-être lu au visage et les pas.
- [ ] Essai › page détail : « Jour 4 sur 10 » et « Consigne tenue 1 jour sur 5 prévus » côte à côte embrouillent ; écrire « 5 jours avec, 5 jours sans · 1 jour avec tenu » et ajouter un bouton clair « J'ai tenu / pas tenu aujourd'hui » (surtout quand le sommeil n'est qu'estimé par le téléphone, sans montre).
- [ ] Exemple du confort digestif (jour 28) : effets par repas plafonnés et plausibles sur l'échelle 1–5 (−3,5 pt par repas paraît énorme) et expliquer en mots simples pourquoi « GOS » sortirait positif ; remplacer « pt », « GOS », « FODMAP » par des mots courants.
- [ ] Visite guidée « Voir un exemple » lancée depuis Objectifs : ne pas sauter vers l'onglet Accueil › Agir ni repasser de « jour 28 » à « jour 14 » ; rester dans l'onglet d'où on l'a ouverte.
- [ ] Données › Tendances : la pastille « Bien-être » ne réagit pas au toucher ; le « + » pour ajouter « Confort digestif » est difficile à deviner — afficher directement les courbes suivies (ventre inclus) ou écrire « + Ajouter une courbe ».
- [ ] Données › Nutrition : la section « À limiter » ne montre que le sodium ; pour un suivi du ventre, ajouter un résumé simple de la semaine « repas souvent mal digérés : N » avec les aliments les plus fréquents.
