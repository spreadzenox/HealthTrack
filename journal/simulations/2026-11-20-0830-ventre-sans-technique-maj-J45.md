# Simulation — Ventre, sans technique — J45 — 2026-11-20 08:40

- **Persona** : n° 2 « Ventre, sans technique » — SII, mal au ventre souvent, peu à l'aise avec les applis, veut surtout savoir quoi éviter de manger ; utilise Halcya depuis 45 jours, avait l'objectif « ventre » et un essai en cours avant la grosse mise à jour.
- **Configuration** : n° 15 Samsung + Galaxy Ring (Samsung Health / Health Connect, poids 1 %) — reçus : sommeil (6 h 30), pas (163) ; absents : VFC, lecture du visage, poids récent.
- **Moment** : jour 45 — bandeau « Nouveau » à l'ouverture, Confort digestif 3,6/5 (en hausse), Bien-être 3,0/5, essai « Dormir au moins 7 h 30 » jour 4 sur 10, aucun lien « net » pour le ventre, repas 0/3 au départ.

## Tâches
1. Comprendre ce qui a changé et où sont mes affaires — réussie en partie (bandeau « Voir » → page Nouveautés claire, mais « Agir s'ouvre depuis le bas de l'Accueil » introuvable).
2. Noter mon repas de midi — réussie mais faussée (« Midi » → « Décrire le repas » → IA → enregistré à 08:34 et coché comme « Matin »).
3. Noter mon ventre — réussie (feuille Calme / Gêne / Douleur très simple) mais l'écran continue d'afficher « Votre digestion ce soir · À partir de 18 h » et « Déjà noté (1) » ne la montre pas.
4. Savoir quels aliments jouent sur mon ventre / quoi éviter — ratée (aucun lien net ; liste en FODMAP, GOS, « pt » ; aucun aliment concret).
5. Retrouver mon essai en cours — réussie (carte sur l'Accueil) mais c'est un essai sommeil/bien-être, pas « ventre » ; je ne sais pas si c'est le mien.
6. Montrer quelque chose à mon médecin — réussie (Objectifs → confort digestif → « Préparer le rapport » → « Créer le PDF » → fichier téléchargé).

## Compris
- Le bandeau « Nouveau » et la page Nouveautés expliquent les 4 onglets en phrases courtes — capture : `captures/2026-11-20-0830-ventre-maj-J45/nouveautes.png`
- Mon confort digestif 3,6/5 « plutôt en hausse » avec barres sur 7 jours : je comprends que ça va un peu mieux — capture : `captures/2026-11-20-0830-ventre-maj-J45/objectifs.png`
- Noter mon ventre : trois gros boutons Calme / Gêne / Douleur, « Dernière note » affichée — capture : `captures/2026-11-20-0830-ventre-maj-J45/digestion.png`
- Le rapport PDF pour le médecin : 2 boutons, choix de période, « …pdf téléchargé » — capture : `captures/2026-11-20-0830-ventre-maj-J45/rapport-pdf.png`
- L'avertissement « Riche en fructanes : pâtes cuites » sous le repas, ça c'est le genre d'info que je veux — capture : `captures/2026-11-20-0830-ventre-maj-J45/repas-fructanes.png`

## Pas compris
- « J'ai touché Midi et ça me coche le Matin ? » Le repas prend l'heure actuelle (08:34) au lieu de midi — capture : `captures/2026-11-20-0830-ventre-maj-J45/midi-devenu-matin.png`
- « J'ai noté Gêne, mais il me dit toujours ma digestion ce soir à partir de 18 h, et dans Déjà noté il n'y a que mes pâtes. Ça a marché ou pas ? » Pilou dit aussi « Reposez-vous bien » à 8 h 35, et « Encore 3 choses » ne bouge pas — capture : `captures/2026-11-20-0830-ventre-maj-J45/deja-note-sans-digestion.png`
- « Fructose en excès, GOS, FODMAP, pt… c'est quoi ? Moi je veux savoir : oignon, pâtes, lait, oui ou non. » — capture : `captures/2026-11-20-0830-ventre-maj-J45/alimentation-fodmap.png`
- « Le sorbitol, c'est +0,2 en haut et −0,8 plus bas ? Alors c'est bon ou pas bon ? » (court terme vs moyen terme de signe opposé) — capture : `captures/2026-11-20-0830-ventre-maj-J45/alimentation-moyen-terme.png`
- « Après UNE assiette de pâtes et un Gêne, il m'affiche Fructanes −1,4, le plus gros chiffre de la page. Je dois arrêter les pâtes ? » La légende dit « chiffres en gris » mais je ne vois pas de gris — capture : `captures/2026-11-20-0830-ventre-maj-J45/fructanes-un-repas.png`
- « Mon essai, c'était pour mon ventre… là c'est dormir 7 h 30, et la flèche retour dit Votre bien-être. » Rien sur la page Confort digestif ne parle de mon essai — capture : `captures/2026-11-20-0830-ventre-maj-J45/essai-sommeil.png`
- « Agir, en bas de l'Accueil ? » En bas il n'y a que mes données et un petit « + ». « D'après votre montre » alors que j'ai une bague — capture : `captures/2026-11-20-0830-ventre-maj-J45/accueil-bas-sans-agir.png`
- « Version installée : 0.0.0 » sur la page Nouveautés — capture : `captures/2026-11-20-0830-ventre-maj-J45/nouveautes.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Ma journée › Repas : toucher « Midi » (ou « Soir ») doit préremplir l'heure du créneau (ex. 12:30) ou cocher ce créneau, pas l'heure courante qui range le repas dans « Matin ».
- [ ] Ma journée : après une note Ma digestion, la carte « Votre digestion ce soir · À partir de 18 h » doit passer à « Noté : Gêne, 08:35 » et la note doit apparaître dans « Déjà noté » ; « Encore N choses » et la bulle Digestion de l'Accueil doivent se mettre à jour.
- [ ] Message de Pilou après une note digestion : ne pas dire « Reposez-vous bien » le matin (texte selon l'heure).
- [ ] Objectifs › Confort digestif › Alimentation : traduire les familles FODMAP en exemples d'aliments (« Fructanes : blé, oignon, ail » ; « Lactose : lait, yaourt ») et cacher « pt »/GOS derrière « Comment c'est calculé » ; ajouter une phrase en haut « À éviter pour l'instant : rien de sûr » ou la liste des aliments suspects.
- [ ] Liens « pas encore nets » : ne pas afficher de facteur basé sur 1-2 repas (Fructanes −1,4 apparu après un seul repas) ou griser réellement le chiffre comme la légende l'annonce.
- [ ] Facteur de signe opposé court / moyen terme (Sorbitol +0,2 / −0,8) : ajouter un résumé par aliment (« pas clair ») plutôt que deux chiffres contradictoires.
- [ ] Migration : l'essai repris s'appelle « Dormir au moins 7 h 30 » et revient vers « Votre bien-être » alors que l'objectif choisi était « ventre » ; montrer l'essai en cours sur la page Confort digestif et dire à quel objectif il sert.
- [ ] Nouveautés : la note dit « Agir s'ouvre depuis le bas de l'Accueil » mais rien en bas de l'Accueil ne s'appelle Agir — corriger le texte ou ajouter l'entrée visible.
- [ ] Accueil › Vos données du jour : « D'après votre montre » → nom générique (« d'après votre bague / Samsung Health ») selon la source.
- [ ] Nouveautés : « Version installée : 0.0.0 » — afficher la vraie version ou masquer la ligne.
