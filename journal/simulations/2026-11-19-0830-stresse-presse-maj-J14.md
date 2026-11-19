# Simulation — Stressé et pressé — J14 — 2026-11-19 08:30

- **Persona** : n° 7 « Stressé et pressé » — veut se sentir mieux, a très peu de temps, ne note presque rien, lit en diagonale.
- **Configuration** : n° 4 « Samsung + Galaxy Watch » (Samsung Health + Galaxy Watch, poids 8 %). Données reçues : pas, sommeil et phases, FC, SpO2. Absentes : VFC, FC au repos, température.
- **Moment** : jour 14, juste après une grosse mise à jour. Vu : sommeil 6 h 30 cette nuit (habitude 7 h 39), 168 pas, une courbe de bien-être sur environ 2 semaines (depuis le 05/11), un essai « Dormir au moins 7 h 30 » en cours (jour 4 sur 10), bannière « 52 autres changements ».

## Tâches
1. Comprendre ce qui a changé — réussie à moitié : la bannière ouvre « Nouveautés », la 1re carte résume les nouveaux onglets, mais « 52 autres changements », c'est trop à lire pour moi.
2. Savoir en 10 secondes comment je vais et quoi faire — ratée : l'Accueil me montre surtout Pilou, une pub Gold et « Humeur du jour : Tranquille » alors que je n'avais rien noté. Aucun « fais ceci aujourd'hui » clair.
3. Noter mon humeur en un geste — réussie en 3 gestes (bulle Bien-être → 2 → Enregistrer). Mais juste après, l'en-tête passe à « De bonne humeur » alors que je viens de mettre 2/5.
4. Savoir si mon sommeil joue sur mon stress — réussie à moitié : dans Données, Bien-être + Sommeil se superposent bien sur un même graphique. Mais Objectifs → Sommeil répond « pas assez net » avec des « +0,4 pt » hachurés, et il faut « encore 21 jours ».
5. Vérifier que mes 2 semaines ne sont pas perdues — réussie : la vue Mois montre des points depuis le 05/11, et Sources indique « Samsung Health · Reçu ».
6. Régler les rappels pour qu'on me dérange peu — abandonnée : il n'y a aucune ligne Rappels ou Notifications dans Réglages, Paramètres ou Ma journée.

## Compris
- Les données de la montre arrivent bien : cœur, oxygène du sang, sommeil, pas. L'app explique clairement ce qui manque (cœur au repos, variabilité). — capture : `captures/2026-11-19-0830-stresse-presse-maj-J14/sources-fc-spo2.png`
- Le graphique Bien-être + Sommeil sur un mois montre d'un coup d'œil que mes 2 semaines sont là et que les deux courbes vont un peu ensemble. — capture : `captures/2026-11-19-0830-stresse-presse-maj-J14/tendances-sommeil.png`
- La 1re carte des Nouveautés dit en 5 points où sont passées les choses (Ma journée, Objectifs, Données). — capture : `captures/2026-11-19-0830-stresse-presse-maj-J14/nouveautes-ordre.png`

## Pas compris
- « Je mets 2 sur 5 et l'app m'affiche "De bonne humeur" ? » Je n'ai pas compris que c'était l'humeur de Pilou et pas la mienne. — capture : `captures/2026-11-19-0830-stresse-presse-maj-J14/humeur-incoherente.png`
- « 52 autres changements » : je n'ai pas le temps de tout lire. En plus, la liste dit « de la plus récente à la plus ancienne », mais le 15 novembre passe avant le 19, et « Version installée : 0.0.0 ». — capture : `captures/2026-11-19-0830-stresse-presse-maj-J14/accueil-banniere-52.png`
- « Encore 21 jours » avant d'avoir une réponse sur mon bien-être : ça décourage. Et j'avais choisi « stress » et « prendre soin de soi », mais je ne retrouve ces mots nulle part. Les objectifs proposés sont seulement Bien-être et Confort digestif. — capture : `captures/2026-11-19-0830-stresse-presse-maj-J14/bien-etre-21-jours.png`
- L'essai « Dormir au moins 7 h 30 » : je n'ai pas compris « Aujourd'hui, jour avec », ni « 1 jour avec tenu sur 5 » alors qu'il est écrit « Jour 4 sur 10 ». Sur l'Accueil, son sous-titre est coupé (« aujourd'hui, jour avec »), et l'onglet Objectifs ne montre pas cet essai. — capture : `captures/2026-11-19-0830-stresse-presse-maj-J14/essai-jour-avec.png`
- « Pas encore de lecture du visage aujourd'hui » sur l'Accueil : je ne sais pas ce que c'est, et ça m'inquiète un peu.

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil, barre « Humeur du jour » : elle remonte à « De bonne humeur » juste après une note de 2/5. La renommer « Humeur de Pilou », ou la caler sur la note de l'utilisateur.
- [ ] Bannière de mise à jour : remplacer « et 52 autres changements » par 3 points clés et un lien « tout voir ». Sur la page Nouveautés, trier vraiment par date (le 19/11 avant le 15/11) et ne pas afficher « Version installée : 0.0.0 ».
- [ ] Réglages : ajouter une entrée « Rappels » facile à trouver (fréquence, heures calmes, tout couper). Elle est introuvable aujourd'hui.
- [ ] Tendances, bouton « + » : proposer aussi FC et SpO2, déjà reçues de Samsung Health d'après Sources. Seuls Sommeil, Pas et Écran sont proposés.
- [ ] Essai : remplacer le jargon « jour avec / sans » et « 1 jour avec tenu sur 5 » par une phrase simple (« Ce soir : vise 7 h 30 de sommeil »). Ne pas couper le sous-titre sur l'Accueil, et montrer l'essai en cours dans l'onglet Objectifs.
- [ ] Accueil : ajouter en tête une ligne « aujourd'hui, une chose à faire » pour un utilisateur pressé. Déplacer la carte Gold plus bas. Masquer « Voir un exemple » quand il y a déjà 14 jours de données.
- [ ] Objectifs / Bien-être : remplacer « encore 21 jours » par un premier constat simple tiré des 14 jours déjà là. Réafficher les objectifs choisis à l'accueil (stress, prendre soin de soi), ou expliquer où ils sont passés.
- [ ] Accueil, carte Bien-être : remplacer « lecture du visage » par un mot clair, avec un lien qui explique ce que c'est.
