# Simulation — Prendre soin de soi, maigrir — J45 — 2026-11-09 08:35

- **Persona** : 6 · Prendre soin de soi, maigrir — veut perdre quelques kilos et prendre soin d'elle (poids, repas, activité, motivation) ; objectif coché à l'installation : « Prendre soin de moi » seulement. Note ses repas et son bien-être depuis 45 jours.
- **Configuration** : 2 · iPhone seul (iPhone 12 à 17, poids 23 %) — données reçues : pas et dépense (hier 8 585 pas, 2 285 kcal) ; absentes : montre, balance connectée, sommeil (attendu en version web). La page Sources affiche « Samsung Health » comme appareil (apparence Android, non compté).
- **Moment** : jour 45 — repas habituels bien remplis (poulet/pomme de terre 23 fois), bien-être noté presque chaque jour sur 30 jours (courbe Tendances), mais Nutrition ne compte que « 9 repas · 6 jours » sur la semaine (≈ 552 kcal/j, signalé incomplet). Aucune pesée visible avant la mienne. Des cigarettes notées hier (3). Agir vide.

## Tâches
1. Comprendre en 30 s ce que l'app m'apporte pour « prendre soin de moi » — ratée : l'accueil propose Repas / Bien-être / Digestion / + 1 cigarette, rien sur mon poids, mes pas ou ma progression.
2. Noter mon poids du matin — réussie mais difficile : ni l'accueil ni « Autre chose » ne le proposent ; trouvé par hasard dans Journal › Nutrition › « Compléter mon profil » › Poids (kg). La pesée apparaît ensuite dans Journal › Jours, pas sur l'accueil.
3. Noter mon petit-déjeuner sans photo — réussie : « Autre chose › Décrire un repas » ouvre la page Repas (encore un geste), puis un repas habituel se refait en 2 touches. Très pratique.
4. Voir si je bouge plus / mange mieux qu'il y a un mois (Tendances) — à moitié : la courbe Mois bien-être + pas existe, mais illisible (deux lignes en zigzag), aucune phrase « plus / moins qu'avant », et ni poids ni calories mangées dans les courbes proposées (+ seulement « Confort digestif » et « Pas »).
5. Savoir ce qui va avec mes bons jours (Analyses) — ratée : « Aucun lien assez net » puis un long tableau de barres en « pt » ; le premier élément mis en avant est le lactose (digestion), avec +1,7 pt d'un côté et −3,7 pt de l'autre.
6. Savoir quoi faire ensuite (Agir) — ratée : « Rien en cours pour l'instant » après 45 jours, aucun conseil lié à mon objectif.

## Compris
- Les repas habituels avec kcal et nombre de fois, puis « Refaire » avec les grammes modifiables : rapide et rassurant — capture : `captures/2026-11-09-0835-prendre-soin-maigrir-J45/jours.png`
- La page Jours rassemble bien ma journée : poids 72,4 kg, repas, pas, dépense, bien-être — capture : `captures/2026-11-09-0835-prendre-soin-maigrir-J45/jours.png`
- La note bien-être 1 à 5 est simple et s'affiche tout de suite sur l'accueil — capture : `captures/2026-11-09-0835-prendre-soin-maigrir-J45/accueil-apres.png`

## Pas compris
- « Où je note mon poids ? » Pas sur l'accueil, pas dans « Autre chose » (qui ne contient que « Décrire un repas ») ; il faut aller dans un « profil » nutrition. Et une fois noté, mon poids n'apparaît pas sur l'accueil — capture : `captures/2026-11-09-0835-prendre-soin-maigrir-J45/autre-chose.png`
- « Pourquoi on me parle de digestion et de cigarettes ? » J'ai choisi « prendre soin de moi », pas un problème de ventre ni le tabac, et ces boutons sont en première ligne — capture : `captures/2026-11-09-0835-prendre-soin-maigrir-J45/accueil-apres.png`
- « C'est quoi un pt ? Et le lactose, c'est bon ou pas pour moi ? » +1,7 pt (2 à 6 jours avant) puis −3,7 pt (7 à 27 jours avant) : je ne sais pas quoi en conclure. Et « Pas : −0,6 pt » laisse croire que marcher me fait du mal — capture : `captures/2026-11-09-0835-prendre-soin-maigrir-J45/analyses.png`
- « Est-ce que je bouge plus qu'avant ? » La courbe du mois mélange deux zigzags sur deux échelles, sans résumé ; et mon poids n'est pas proposé dans les courbes — capture : `captures/2026-11-09-0835-prendre-soin-maigrir-J45/tendances-mois.png`
- Hier : dépense 2 285 kcal, repas 479 kcal. Sans explication, ça ressemble à un énorme déficit (j'avais juste oublié de noter) — capture : `captures/2026-11-09-0835-prendre-soin-maigrir-J45/jours.png`
- Le niveau d'activité « Automatique » est devenu « Modérément actif » tout seul après enregistrement, sans dire pourquoi — capture : `captures/2026-11-09-0835-prendre-soin-maigrir-J45/poids-dans-profil.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil « Aujourd'hui » : avec l'objectif « Prendre soin de moi », remplacer les raccourcis Digestion / + 1 cigarette (non choisis) par « Poids » et montrer une carte « Mon objectif » (dernier poids + tendance, pas du jour vs moyenne).
- [ ] Saisie du poids : ajouter « Noter mon poids » dans « Autre chose » (et/ou un raccourci), au lieu de le cacher dans Journal › Nutrition › Profil ; afficher la pesée du jour dans « Vos données du jour ».
- [ ] Tendances : proposer « Poids » et « Calories mangées » dans le « + », et ajouter une phrase de synthèse « Ce mois-ci vs le mois dernier : pas +X %, bien-être +Y » au-dessus de la courbe.
- [ ] Analyses : expliquer l'unité « pt » (points de bien-être sur 5) en une ligne, et éviter de mettre en tête un aliment digestif (lactose) aux signes opposés selon la période ; pour cette persona, mettre poids/activité/repas en premier.
- [ ] Agir : quand rien n'est en cours après plusieurs semaines, proposer un essai simple lié à l'objectif (ex. « 2 000 pas de plus pendant 7 jours ») plutôt qu'un écran vide.
- [ ] Journal › Jours : quand la dépense est très supérieure aux repas notés, signaler « repas sans doute incomplets » (comme dans Nutrition) pour ne pas suggérer un déficit trompeur.
- [ ] « Autre chose › Décrire un repas » ouvre la page Repas générale au lieu du champ de description : ouvrir directement le formulaire « Décrire ».
- [ ] Profil nutrition : quand « Automatique » se transforme en « Modérément actif », ajouter « (d'après vos pas) ».
