# Simulation — Ventre, sans technique — J45 — 2026-11-21 20:30

- **Persona** : n° 2 « Ventre, sans technique » — Martine, 52 ans, syndrome de l'intestin irritable, peu à l'aise avec les applis, veut surtout savoir quoi éviter de manger.
- **Configuration** : n° 2 « iPhone seul » (iPhone 13, pas de montre, poids 23 %) — reçu : pas (2 686 aujourd'hui, « d'habitude 6 386 ») ; absent : aucun sommeil visible nulle part (ni Accueil, ni Tendances, ni analyses) alors que le téléphone est censé l'estimer.
- **Moment** : jour 45, juste après la mise à jour « Pilou » — repas des jours passés présents (Hier, Jeudi…, « Refaire un repas » 16 fois, 14 fois…), courbe du confort digestif sur 7 jours, essai « Dormir au moins 7 h 30 » au jour 4 sur 10, bien-être 3/5 « d'après 4 lectures du visage ».

## Tâches
1. Retrouver mes repas notés après la mise à jour — réussie, mais au 3e endroit essayé : Ma journée n'a que 3 ronds photo vides, il faut aller dans Données › Nutrition › petit lien « Tous vos repas ».
2. Retrouver ma digestion des jours passés — réussie : Données › Tendances › « + » › Confort digestif ; Objectifs montre aussi 3,6/5 « plutôt en hausse ».
3. Retrouver l'essai que je faisais — réussie depuis l'Accueil (carte « Agir » tout en bas) ; introuvable dans Objectifs alors que l'écran de l'essai allume l'onglet Objectifs.
4. Savoir quoi éviter de manger — réussie au sens où la réponse est claire (« Rien à éviter pour l'instant ») ; mais après 45 jours, aucune piste et le détail est en « pt », FODMAP et barres d'erreur.
5. Noter ma digestion du jour — réussie, 2 touches (Noter › Gêne), Pilou remercie.
6. Noter mon repas du soir — réussie via « Refaire un repas » ; la description libre « soupe de poireaux, pain et un yaourt » a donné « Pâtes à la carbonara » avec « Remplir avec l'IA » (abandonnée, peut-être un effet de la simulation).

## Compris
- Le nouvel Accueil : Pilou avec 3 bulles (Repas 0/3, Digestion, Bien-être) ; quand j'ai noté, la bulle Digestion a disparu, « Repas 1/3 », humeur « Content ». C'est simple et ça donne envie. — capture : `captures/2026-11-21-2030-ventre-sans-technique-maj-J45/accueil-essai.png`
- Mes repas sont tous là, avec « Refaire un repas » (mes plats habituels en un geste) : rassurant. — capture : `captures/2026-11-21-2030-ventre-sans-technique-maj-J45/tous-vos-repas.png`
- « Rien à éviter pour l'instant : aucun aliment ne va nettement avec une digestion moins bonne. Continuez à noter vos repas. » : une phrase que je comprends. — capture : `captures/2026-11-21-2030-ventre-sans-technique-maj-J45/confort-digestif.png`
- La fenêtre « Ma digestion » (Calme / Gêne / Douleur) : parfait pour moi.
- L'avertissement « Riche en fructanes : pâtes cuites » sous un repas : exactement le genre d'info que je cherche. — capture : `captures/2026-11-21-2030-ventre-sans-technique-maj-J45/ia-carbonara.png`

## Pas compris
- « Mon essai, c'était pour mon ventre ? » L'essai est « Dormir au moins 7 h 30 » et il mesure mon bien-être, pas ma digestion. « Jour 4 sur 10 » mais « 1 jour avec tenu sur 5 », « Aujourd'hui, jour avec. », des lanternes… je ne sais pas si je l'ai réussi ou pas. Et les jours 2 et 3 n'ont ni coche ni tiret. — capture : `captures/2026-11-21-2030-ventre-sans-technique-maj-J45/essai-sommeil.png`
- « Où est passé mon essai ? » Pas dans Objectifs, seulement en bas de l'Accueil, sous une carte coupée « Essai · jour 4 sur 10 · aujourd'hui, jour avec ». — capture : `captures/2026-11-21-2030-ventre-sans-technique-maj-J45/accueil-essai.png`
- « Il me regarde, mon téléphone ? » Le bien-être vient de « 4 lectures du visage » avec un radar « Mépris 4 %, Dégoût, Peur 2 % ». Je ne me souviens pas d'avoir accepté ça, et ce n'est pas rassurant. — capture : `captures/2026-11-21-2030-ventre-sans-technique-maj-J45/lectures-visage.png`
- « J'ai écrit soupe de poireaux, il me met des pâtes carbonara ! » Le texte que j'ai tapé disparaît, je ne peux pas comparer. — capture : `captures/2026-11-21-2030-ventre-sans-technique-maj-J45/ia-carbonara.png`
- Le détail Alimentation : « +1,1 pt pour 1 repas riche en fructose en excès (FODMAP) de plus » : le fructose me ferait du bien ? Je ne comprends pas les « pt » ni les barres. Et « 9 facteurs comparés » sur une page, « 8 facteurs » sur l'autre.
- « Sommeil : pas assez de données » alors que mon téléphone compte mon sommeil ; et Sommeil n'est pas proposé dans le « + » de Tendances.
- Le bandeau « Nouveau : … et 98 autres changements » : 98, ça me fait peur ; la note ne parle pas de Pilou ni de l'endroit où sont passés mes repas.
- Dans Tendances, le confort digestif d'aujourd'hui a un rond vide vers 4,3 alors que je n'avais encore rien noté.

## Constats → étapes POLISH au BACKLOG
- [ ] Ma journée : sous « Repas 0 sur 3 », ajouter un lien visible « Voir mes repas » (aujourd'hui + précédents) ; aujourd'hui l'historique n'est que dans Données › Nutrition › « Tous vos repas ».
- [ ] Objectifs : lister l'essai en cours (titre, jour n/10, lien) ; l'écran d'essai allume l'onglet Objectifs mais Objectifs ne le montre pas.
- [ ] Écran d'essai : remplacer « Aujourd'hui, jour avec. » / « 1 jour avec tenu sur 5 » par « Ce soir : couchez-vous assez tôt pour dormir 7 h 30 » et « Jours réussis : 1 sur 2 jusqu'ici » ; marquer les jours passés non renseignés (2, 3) comme « pas de donnée ». Corriger la carte Accueil tronquée.
- [ ] Bien-être « d'après les lectures du visage » : à la mise à jour, expliquer une fois ce que c'est et comment l'arrêter ; renommer les émotions dures (Mépris, Dégoût) ou les replier sous « détail ».
- [ ] Remplir avec l'IA : garder la description tapée visible au-dessus du résultat, pour voir si l'IA s'est trompée (soupe de poireaux → carbonara) ; vérifier que la réponse correspond bien au texte envoyé.
- [ ] Analyses Alimentation : pour une persona ventre, traduire « +1,1 pt » en mots (« les jours avec … votre ventre allait plutôt mieux ») et cacher FODMAP/barres derrière « détail » ; aligner « 9 facteurs » et « 8 facteurs » ou dire pourquoi.
- [ ] Sommeil iPhone seul : soit l'afficher (Accueil, + de Tendances), soit dire « votre iPhone ne nous donne pas le sommeil » au lieu de « Pas assez de données ».
- [ ] Bandeau Nouveautés : enlever « et 98 autres changements », ajouter une ligne « Vos repas, votre digestion et votre essai sont toujours là : … » avec les chemins, et présenter Pilou.
