# Simulation — Tout mesurer — J14 — 2026-11-21 08:30

- **Persona** : n° 3 « Tout mesurer » — veut tout centraliser, comparer et exporter ses données ; à l'aise avec la technique, curieux des chiffres.
- **Configuration** : n° 2 « iPhone seul » (iPhone 12 à 17, poids 23 %) — reçues : pas et calories du téléphone, sommeil estimé grossièrement ; absentes : FC, VFC, SpO2 (pas de montre).
- **Moment** : jour 14, première ouverture après la mise à jour (refonte Pilou + 4 onglets) — bannière « Nouveau : … et 92 autres changements », 13/14 jours de bien-être notés, essai « Dormir au moins 7 h 30 » jour 4 sur 10, 115 pas ce matin (habitude 6 328/j), 8 repas sur 5 jours en Nutrition, export « 144 entrées et votre profil ».

## Tâches
1. Comprendre ce qui a changé avec la mise à jour — réussie : bannière « Voir » → page Nouveautés, la note « Nouveaux onglets » explique où sont passées les choses (Données = Tendances + Nutrition, Réglages « Données » → « Sauvegarde »).
2. Vérifier que mes 14 jours et mon essai n'ont pas disparu — réussie : Données › Mois montre mes points depuis le 07/11, l'essai « Dormir au moins 7 h 30 » reprend au jour 4 sur 10 (trouvé via Accueil « Agir » et via Objectifs › Ce qui va avec votre bien-être).
3. Comparer pas et bien-être sur la semaine — réussie mais fragile : « + » → « Pas » superpose les deux courbes avec deux axes ; le choix est oublié dès que je change d'onglet ; pas de point « pas » pour aujourd'hui alors que l'Accueil affiche 115.
4. Noter mon bien-être du jour — réussie : Ma journée › Noter, échelle 1-5, retour « Plutôt bien · noté », le point apparaît dans Tendances.
5. Exporter mes données — réussie : Réglages › Sauvegarde › « Télécharger la sauvegarde » (JSON) et « Créer le PDF » (2/4/12 sem.) ; pas de CSV pour mon tableur.
6. Retrouver mes calories brûlées et mon sommeil estimé — ratée : seules les séries Bien-être, Confort digestif et Pas sont proposées dans Tendances ; Nutrition ne montre que les kcal mangées ; le « + » de la carte « Vos données du jour » ne fait rien.

## Compris
- La page Nouveautés dit clairement où chaque chose a déménagé, et la Sauvegarde rassure : « Vos données sont sur ce téléphone et passent les mises à jour » — capture : `captures/2026-11-21-0830-tout-mesurer-maj-J14/nouveautes.png`
- Le graphe à deux axes (/5 à gauche, pas à droite) pour comparer pas et bien-être, c'est exactement ce que je voulais — capture : `captures/2026-11-21-0830-tout-mesurer-maj-J14/tendances-pas-bienetre.png`
- Mon essai n'est pas perdu : jour 4 sur 10, jours tirés au sort, résultat « Avec » en cours — capture : `captures/2026-11-21-0830-tout-mesurer-maj-J14/essai-sommeil.png`
- Export JSON et PDF en deux touches, avec confirmation du nom de fichier — capture : `captures/2026-11-21-0830-tout-mesurer-maj-J14/sauvegarde-export.png`

## Pas compris
- « Version installée : 0.0.0 » sur la page Nouveautés : pour quelqu'un qui vient de faire une mise à jour, ça fait bug ; je ne sais pas quelle version j'ai — capture : `captures/2026-11-21-0830-tout-mesurer-maj-J14/nouveautes.png`
- Détail du mardi 17 : « Bien-être 2,7 /5 » en gros, puis « vous avez noté 2,6 · estimé avec le visage ». Lequel est mon chiffre ? Et je note en entiers 1 à 5, d'où vient 2,6 ? — capture : `captures/2026-11-21-0830-tout-mesurer-maj-J14/detail-jour-17nov.png`
- J'avais ajouté « Pas » au graphe ; je reviens sur Données et il n'y a plus que Bien-être. Et j'ai noté 4, le point d'aujourd'hui est sous 4. Avant que je note, il y avait déjà un point creux vers 2,6 : c'était quoi ? — capture : `captures/2026-11-21-0830-tout-mesurer-maj-J14/tendances-reset.png`
- Accueil : « Pas 115 » mais Tendances n'a pas de point pour aujourd'hui ; le petit « + » en bas de la carte ne réagit pas (touché deux fois) ; et où sont mes calories et mon sommeil que l'ancienne version… je ne les trouve nulle part — capture : `captures/2026-11-21-0830-tout-mesurer-maj-J14/accueil-pas-plus.png`
- Mon essai n'apparaît pas sur la page Objectifs elle-même (seulement le score 2,9/5) ; il faut passer par « Ce qui va avec votre bien-être ». Sur cette page, « Votre score est déjà dans Objectifs » alors que j'y suis déjà — capture : `captures/2026-11-21-0830-tout-mesurer-maj-J14/essai-sommeil.png`
- Dans l'essai, « 1 jour avec tenu sur 5 » est mal tourné, et les jours 2 et 3 (« comme d'habitude ») n'ont ni ✓ ni – alors que la légende annonce les deux — capture : `captures/2026-11-21-0830-tout-mesurer-maj-J14/essai-sommeil.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Tendances : mémoriser les séries choisies (ex. Bien-être + Pas) quand on quitte l'onglet Données et qu'on y revient.
- [ ] Tendances : proposer aussi les données reçues du téléphone (calories dépensées, sommeil estimé) dans le menu « + », ou dire pourquoi elles n'y sont pas ; aujourd'hui, seuls Bien-être, Confort digestif et Pas sont proposés.
- [ ] Tendances › Pas : tracer le point du jour (partiel, en creux) pour que ça colle avec le « Pas 115 » de l'Accueil ; légender le point creux du bien-être (estimation ? attendu ?) affiché avant la saisie.
- [ ] Détail d'un jour : un seul chiffre de bien-être en gros (celui noté), l'estimation par le visage en dessous, sous un libellé distinct ; expliquer qu'une valeur décimale vient d'une moyenne de saisies.
- [ ] Accueil › Vos données du jour : le « + » en bas de la carte ne fait rien au toucher ; lui donner une action (ajouter une mesure) ou le retirer, et réduire le vide sous « D'après votre téléphone ».
- [ ] Nouveautés : afficher le vrai numéro de version au lieu de « 0.0.0 » et ajouter une phrase « vos données et votre essai en cours sont conservés » dans la note de refonte.
- [ ] Sauvegarde : ajouter un export CSV (une ligne par jour : pas, bien-être, digestion, kcal) pour comparer dans un tableur ; dire ce que contiennent les « 144 entrées ».
- [ ] Objectifs : montrer l'essai en cours sur la page Objectifs elle-même ; sur « Votre bien-être », retirer « Votre score est déjà dans Objectifs » (on y est déjà).
- [ ] Essai : remplacer « 1 jour avec tenu sur 5 » par « 1 jour « avec » tenu sur 5 prévus » et marquer les jours « comme d'habitude » passés (✓/–) comme l'annonce la légende.
