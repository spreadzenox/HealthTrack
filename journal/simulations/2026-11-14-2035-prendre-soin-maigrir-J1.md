# Simulation — Prendre soin de soi, maigrir — J1 — 2026-11-14 20:35

- **Persona** : n° 6 « Prendre soin de soi, maigrir » — veut perdre quelques kilos, manger mieux, bouger plus ; a besoin d'être encouragée ; pas technicienne.
- **Configuration** : n° 4 « Samsung + Galaxy Watch » (Galaxy Watch 7, poids 8 %) — reçus : sommeil, pas, oxygène du sang, FC et dépense (jours passés) ; absents : variabilité cardiaque, balance connectée (poids saisi à la main).
- **Moment** : jour 1 — premier lancement ; accueil en 6 étapes, objectif « Prendre soin de moi » coché ; à l'arrivée : sommeil 7 h 10, 2 686 pas, une note de bien-être 4/5, aucun repas, aucun poids. 44 gestes.

## Tâches
1. Comprendre en 30 secondes ce que l'app fait pour maigrir — ratée (l'accueil parle de « bons et mauvais jours », de « pistes » et d'« essais », jamais de poids, de kilos ou de calories).
2. Passer l'accueil — réussie (6 étapes, « Prendre soin de moi » trouvé tout de suite ; visite guidée passée à la 3e bulle, trop longue).
3. Noter un repas — réussie (« Repas » ouvre l'appareil photo, puis « Décrire le repas » ; texte, IA, 638 kcal, enregistré ; le plat reconnu n'était pas le mien, analyse factice connue).
4. Trouver où noter son poids — réussie par hasard (ni bouton « Poids » sur Aujourd'hui, ni dans « Autre chose » ; trouvé dans Journal › Nutrition › « Compléter mon profil »).
5. Voir son poids dans le temps — ratée (Tendances ne propose que Sommeil et Pas, pas de courbe Poids, pas d'objectif de poids).
6. Voir ses pas et son sommeil du jour — réussie (carte « Vos données du jour », avec « d'habitude »).
7. Savoir quoi faire demain — ratée (Agir : « Rien en cours pour l'instant » ; Analyses : « Encore 13 jours »).

## Compris
- L'écran Aujourd'hui : ma nuit (7 h 10), mes pas (2 686) comparés à « d'habitude », ma note du jour ; c'est net et vite lu — capture : `captures/2026-11-14-2035-prendre-soin-maigrir-J1/aujourdhui-premier.png`
- Noter un repas en l'écrivant : la liste des aliments avec les grammes et les kcal, les boutons − / + ; puis le repas apparaît dans le Journal et sur Aujourd'hui (constat sans capture : écran Journal › Repas).
- Une fois mon poids saisi dans le profil, il apparaît sur Aujourd'hui (« Poids · à 20:35 — 74,0 kg ») et dans Journal › Jours (constat sans capture).
- La courbe des pas sur la semaine se lit toute seule (constat sans capture : Tendances › Semaine › Pas).

## Pas compris
- « Halcya cherche ce qui va avec vos bons et mauvais jours », « vérifier une piste par un essai » : je veux maigrir, je ne vois pas ce que ça veut dire pour moi ni ce que l'app va m'apporter — capture : `captures/2026-11-14-2035-prendre-soin-maigrir-J1/accueil-trois-usages.png`
- J'ai coché « alimentation, poids, forme » et l'écran d'arrivée me propose « Digestion » et « compter mes cigarettes », mais pas « Poids » — capture : `captures/2026-11-14-2035-prendre-soin-maigrir-J1/autre-chose-sans-poids.png`
- 638 kcal, c'est beaucoup ou pas ? La page Nutrition me donne la vitamine B12, le zinc, les folates en µg, mais pas combien de calories je devrais manger par jour, ni les sucres ou les graisses. Et le bandeau « apports sous-estimés » me gronde alors que je viens de commencer — capture : `captures/2026-11-14-2035-prendre-soin-maigrir-J1/nutrition-apports.png`
- Agir : « Quand vos analyses repèrent une piste, vous pourrez l'essayer ici » — rien à faire aujourd'hui ni demain, aucun objectif (pas, poids), aucun mot d'encouragement — capture : `captures/2026-11-14-2035-prendre-soin-maigrir-J1/agir-vide.png`
- Tendances : je viens d'entrer mon poids et il n'y a pas de courbe Poids ; en « Semaine » le Bien-être disparaît aussi et il ne reste que Sommeil et Pas. En « Jour », le graphique dit « Aucune lecture du visage ce jour-là » alors que j'ai noté 4/5 — capture : `captures/2026-11-14-2035-prendre-soin-maigrir-J1/tendances-sans-poids.png`
- À l'accueil : « Health Connect n'est pas sur ce téléphone », « Votre téléphone suffit », puis les données de ma montre s'affichent quand même (« D'après votre montre ») ; et « régler l'estimation du visage sur vous », « 20 analyses par jour » : je ne sais pas de quoi on parle (constat sans capture).

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil, écran 2 (« Trois usages ») : aucune promesse pour l'objectif « Prendre soin de moi » ; après le choix des objectifs, dire en une phrase ce que l'app fera pour le poids et l'alimentation (ex. « suivre votre poids, vos repas et vos pas »).
- [ ] Aujourd'hui, raccourcis du haut : avec l'objectif « Prendre soin de moi », remplacer « Digestion » par « Poids » (pesée en un geste) et ajouter « Me peser » dans « Autre chose » ; aujourd'hui la pesée n'existe que dans Journal › Nutrition › profil.
- [ ] Tendances : proposer la courbe « Poids » dès la première pesée (et garder « Bien-être » en Semaine/Mois) ; la liste « Choisissez une courbe » n'offre que Sommeil et Pas.
- [ ] Nutrition : afficher en tête un repère de calories par jour tiré du profil (et sucres / graisses) avant les vitamines et minéraux ; au jour 1, remplacer « des repas manquent sans doute, apports sous-estimés » par un message d'accueil (« premier repas noté »).
- [ ] Agir et Analyses au jour 1 : écran vide et 13 jours d'attente ; proposer un premier geste simple pour demain (noter ses repas, se peser, un repère de pas) et un mot d'encouragement ; remplacer « piste » / « essai » par des mots courants.
- [ ] Aujourd'hui, ligne « Pas » : 2 686 contre « d'habitude 6 386 » sans aucun commentaire ni objectif ; ajouter un repère ou une phrase d'encouragement.
- [ ] Bouton « Repas » : il ouvre l'appareil photo sans choix ; « Décrire le repas » n'apparaît que dans un bandeau après l'échec de la photo. Offrir photo / décrire dès le premier appui.
- [ ] Tendances › Jour › Bien-être : le graphique vide affiche « Aucune lecture du visage ce jour-là » alors qu'une note 4/5 existe ; tracer la note ou reformuler.
- [ ] Accueil : le compteur reste à « 01/06 » sur les trois premiers écrans ; l'explication sur les données envoyées à l'IA est répétée trois fois (accueil, formulaire repas, fenêtre d'accord) ; « photo de selles » surprend dès le 3e écran quelqu'un venu pour maigrir.
- [ ] Journal › Jours : tuile « FC » — écrire « Cœur » ou « Pouls ».
- [ ] Visite guidée : l'exemple « jour 14 » montre un bouton « + 1 cigarette » à quelqu'un qui n'a rien dit sur le tabac ; adapter l'exemple aux objectifs cochés.
