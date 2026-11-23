# Simulation — Stressé et pressé — J14 — 2026-11-23 08:30

- **Persona** : n° 7 « Stressé et pressé » — cadre, 35 ans, veut se sentir mieux, ne notera presque rien, ouvre l'app 1 minute entre deux réunions
- **Configuration** : n° 2 « iPhone seul » (iPhone 12 à 17 via l'app Santé, poids 23 %) — reçues : pas (162 aujourd'hui, « d'habitude 6 327 ») ; absentes : montre, VFC, sommeil mesuré ; calories du téléphone non vues à l'écran
- **Moment** : jour 14, après MISE À JOUR (ancienne version installée il y a 14 jours, objectif « stress » à l'accueil, bien-être noté ~1 jour sur 3, aucun repas) — vu : bandeau « Nouveau : Nouveaux onglets », Pilou « Tranquille », un essai « Dormir au moins 7 h 30 » déjà en cours (jour 4 sur 10), courbe de bien-être continue sur ~14 jours, Nutrition vide

## Tâches
1. Comprendre ce qui a changé avec la mise à jour — réussie (bandeau « Voir » → page Nouveautés claire sur les 4 onglets, mais 2e et 3e cartes « Correctif » en langage de développeur et « Version installée : 0.0.0 »).
2. Noter vite mon bien-être (« bof, stressé ») — réussie (bulle Bien-être → 2/5 + « Stress » → Enregistrer, ~4 gestes ; le 1er toucher sur la bulle n'a rien fait).
3. Retrouver mes anciennes notes — à moitié (Données › Tendances montre une courbe, mais un point chaque jour alors que je ne note qu'un jour sur trois ; impossible de distinguer mes notes du reste sans ouvrir jour par jour).
4. Retrouver mon objectif « stress » de l'accueil — ratée (Objectifs ne parle que de bien-être ; dans Réglages › Paramètres « Vos objectifs » = Bien-être / Confort digestif, « stress » a disparu sans explication).
5. Savoir quoi faire pour me sentir mieux — réussie mais confuse (Objectifs › Ce qui va avec votre bien-être → piste « 2 000 pas de plus » → Agir → Commencer ; je me retrouve avec 2 essais en même temps sans avertissement).

## Compris
- L'accueil en 10 secondes : Pilou, deux bulles (Repas, Bien-être), ma note du jour, un truc à faire (Agir), mes pas — capture : `captures/2026-11-23-0830-stresse-presse-maj-J14/accueil.png`
- Noter le bien-être est rapide, les étiquettes (Stress, Café après 14 h…) sont parlantes, la note apparaît tout de suite sur l'accueil — capture : `captures/2026-11-23-0830-stresse-presse-maj-J14/apres-note-2.png`
- « Avec 2 000 pas de plus, vous allez plutôt mieux » : une phrase simple, je sais quoi faire — capture : `captures/2026-11-23-0830-stresse-presse-maj-J14/agir.png`

## Pas compris
- « Je mets 2/5, stressé… et Pilou passe de Tranquille à De bonne humeur ? Il se moque de moi ? » La jauge monte parce que j'ai noté, pas parce que je vais bien — capture : `captures/2026-11-23-0830-stresse-presse-maj-J14/apres-note-2.png`
- « J'ai noté 2, l'app affiche 2,2. C'est ma note ou pas ? » (« vous avez noté 2 · estimé avec les jours voisins ») — capture : `captures/2026-11-23-0830-stresse-presse-maj-J14/tendances-jour.png`
- « Moins de pas que d'habitude (4 374) » dans Tendances › Jour, alors que l'accueil dit 162 pas aujourd'hui — lequel est vrai ? Et mon étiquette « Stress » n'apparaît pas dans « Ce qui a pu jouer » — capture : `captures/2026-11-23-0830-stresse-presse-maj-J14/tendances-jour.png`
- « Je note un jour sur trois, pourquoi il y a un point tous les jours ? Où sont MES notes ? » — capture : `captures/2026-11-23-0830-stresse-presse-maj-J14/tendances-mois.png`
- « 8 683 pas ? Mon habitude c'est 6 327, plus 2 000 ça fait 8 327. » Et je peux lancer un 2e essai alors qu'un premier tourne, sans que rien ne me prévienne — capture : `captures/2026-11-23-0830-stresse-presse-maj-J14/agir.png`
- Une tache noire ovale à côté de Pilou sur « Votre bien-être » ; « Sommeil : pas assez de données » alors qu'on me fait faire un essai « Dormir 7 h 30 » ; « Moyen terme (de 2 à 6 jours avant) : encore 21 jours… » incompréhensible — capture : `captures/2026-11-23-0830-stresse-presse-maj-J14/bien-etre-familles.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil / jauge « Humeur de Pilou » : après une note basse (≤ 2), ne pas afficher « De bonne humeur » ; formuler « Merci, c'est noté » et garder un Pilou compatissant, ou expliquer que la jauge suit la régularité, pas l'humeur.
- [ ] Tendances › Jour : « Moins de pas que d'habitude (4 374) » contredit « Pas 162 » de l'accueil le même jour ; aligner la source/le jour ou préciser « hier » / « jusqu'à 8 h ».
- [ ] Tendances : quand l'utilisateur a noté un chiffre entier, afficher ce chiffre en grand (« 2/5, votre note ») et l'estimation en petit ; distinguer visuellement les jours notés (point plein) des jours estimés (point creux) dans Semaine/Mois.
- [ ] Mise à jour : l'objectif « stress » choisi à l'accueil de l'ancienne version a disparu ; afficher une carte de transition (« Votre objectif stress est maintenant suivi via Bien-être et l'étiquette Stress ») et montrer « Vos objectifs » dans l'onglet Objectifs, pas seulement dans Réglages › Paramètres.
- [ ] Agir › « Faire au moins 8 683 pas » : la cible ne correspond pas à « habitude 6 327 + 2 000 » ; afficher le calcul ou arrondir à partir du chiffre montré à l'accueil.
- [ ] Agir › Commencer : avertir quand un essai est déjà en cours (« Deux essais en même temps rendent les résultats moins clairs — continuer ? »).
- [ ] Votre bien-être › Par famille : ovale noir affiché à côté de Pilou (image/ombre cassée) ; à corriger.
- [ ] Essai « Dormir au moins 7 h 30 » avec un iPhone seul (sommeil « Pas assez de données ») : dire dès l'écran de l'essai « on vous demandera demain matin si vous l'avez tenu » plutôt que de cacher cette info dans « Ce qui est mesuré ».
- [ ] Nouveautés : retirer ou simplifier les cartes « Correctif » techniques (« l'exemple du 14e jour… visite guidée… jauge ») et corriger « Version installée : 0.0.0 ».
- [ ] Accueil : bulle Bien-être — le premier toucher au centre de la bulle n'a rien ouvert ; agrandir la zone touchable.
- [ ] « Voir un exemple » reste affiché sur Accueil, Objectifs et Agir au 14e jour avec de vraies données ; le masquer une fois les données présentes.
