# Simulation — Tout mesurer — J45 — 2026-11-16 20:30

- **Persona** : n° 3 « Tout mesurer » — veut tout centraliser, comparer les courbes entre elles et exporter ses données.
- **Configuration** : n° 13 « Android + Fitbit ou Pixel Watch » (Pixel Watch 3, poids 1 %) — reçues : sommeil (durée), VFC, pas, cœur au repos ; absentes à l'écran : phases du sommeil, FC continue (seul « Cœur au repos » existe dans Tendances).
- **Moment** : jour 45, le soir d'une grosse mise à jour — Accueil : bien-être 3/5, essai « Dormir au moins 7 h 30 » jour 4 sur 10, sommeil 6 h 30, VFC 51 ms, 3 857 pas ; 802 entrées dans la sauvegarde ; jour du cycle affiché dans le détail des jours.

## Tâches
1. Comprendre ce qui a changé — à moitié réussie : le bandeau « Nouveaux onglets… et 19 autres changements » mène aux Nouveautés, mais la note sur la nouvelle navigation n'est pas en tête (c'est « Votre essai sur l'Accueil ») et la page est immense (des dizaines d'écrans de petits correctifs). J'ai appris par hasard que « le Journal jour par jour rejoint Tendances ».
2. Retrouver mon essai et savoir quoi faire aujourd'hui — réussie : carte sur l'Accueil, « Aujourd'hui, jour avec » ; mais rien ne dit « couchez-vous tôt ce soir » et l'essai n'apparaît ni dans Ma journée ni dans Objectifs.
3. Retrouver le détail d'un jour passé — réussie : Données > Tendances, toucher le 14/11 ouvre le détail (sommeil, saisies, jour du cycle) ; pas évident sans avoir lu les Nouveautés.
4. Vérifier mes anciens objectifs « sport » et « cycle » — ratée : Réglages > Paramètres > « Vos objectifs » ne montre que Bien-être et Confort digestif (coché alors que je ne l'avais pas choisi). Le cycle survit en bouton « Règles » dans Ma journée et en « 8e jour du cycle » dans le détail, le sport en famille « Activité » dans Objectifs, mais rien ne me le dit.
5. Exporter mes données — réussie : Réglages > Sauvegarde > « Télécharger la sauvegarde » → halcya-export-2026-11-16.json, 802 entrées. Seulement du JSON, pas de CSV pour un tableur.
6. Comprendre Tendances / comparer — à moitié : superposer Bien-être + Sommeil avec deux axes, c'est parfait ; mais passer en vue « Jour » remplace Sommeil par Bien-être, il n'y a pas de FC, de phases de sommeil, de kcal d'activité ni de règles parmi les courbes.

## Compris
- L'Accueil résume ma journée et ma montre (sommeil, VFC, pas avec « d'habitude ») ; l'essai est juste sous le bien-être — capture : `captures/2026-11-16-2030-tout-mesurer-maj-J45/accueil.png`
- La page de l'essai : jour 4 sur 10, calendrier des jours avec/sans, résultat en cours — capture : `captures/2026-11-16-2030-tout-mesurer-maj-J45/essai.png`
- Le détail d'un jour passé (ancien journal) existe dans Tendances, avec toutes les saisies et le jour du cycle — capture : `captures/2026-11-16-2030-tout-mesurer-maj-J45/jour-saisies.png`

## Pas compris
- « Où sont passés mes objectifs sport et cycle ? J'ai Confort digestif coché et je ne l'ai jamais choisi. » — capture : `captures/2026-11-16-2030-tout-mesurer-maj-J45/parametres-objectifs.png`
- « Le 14/11, en haut c'est 4,0/5 "vous avez noté 4", et en bas ma saisie dit 4,2/5. Lequel est vrai ? » Et « Ce qui a pu peser ce jour-là » ne liste que des effets positifs (+0,44 pt) alors que la page Bien-être dit « Pas de lien net pour l'instant » partout. — capture : `captures/2026-11-16-2030-tout-mesurer-maj-J45/jour-saisies.png`
- « Ma digestion : Ma journée dit 9/28 et encore 19 jours, Objectifs dit premier score dans 5 jours (9 sur 14). » Deux comptes différents pour la même chose. — capture : `captures/2026-11-16-2030-tout-mesurer-maj-J45/objectifs.png`
- « J'avais Sommeil affiché, je clique sur Jour et ça me remet Bien-être. » — capture : `captures/2026-11-16-2030-tout-mesurer-maj-J45/tendances-jour-perd-mesure.png`
- La page de l'essai a un lien retour « ← Agir » alors que l'onglet allumé est « Objectifs » : ancien nom qui traîne — capture : `captures/2026-11-16-2030-tout-mesurer-maj-J45/essai.png`
- Sur l'essai, les jours 2 et 3 sont « comme d'habitude » mais marqués « – pas tenu » : je n'avais rien à tenir ces jours-là. « 1 jour avec tenu sur 5 » à lire deux fois — capture : `captures/2026-11-16-2030-tout-mesurer-maj-J45/essai.png`
- Le nom « Données » désigne l'onglet du bas (Tendances/Nutrition) ET la page « Vos données » de la Sauvegarde : je cherchais l'export dans l'onglet Données. — capture : `captures/2026-11-16-2030-tout-mesurer-maj-J45/accueil.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Objectifs migrés : après la mise à jour, afficher une fois « Vos anciens objectifs Sport et Cycle → Activité (Objectifs) et bouton Règles (Ma journée) », et ne pas cocher Confort digestif par défaut pour qui ne l'avait pas choisi.
- [ ] Nouveautés : mettre la note « nouvelle navigation » (où est passé le Journal, l'export, l'essai) en tête comme promis par le bandeau, et regrouper/replier les petits correctifs (page de plusieurs dizaines d'écrans).
- [ ] Détail d'un jour (Tendances) : bien-être 4,0 en tête vs 4,2 dans la saisie — afficher la même valeur ou expliquer « moyenne de la journée » ; renommer « Ce qui a pu peser » en « Ce qui a pu jouer » quand les effets sont positifs.
- [ ] Confort digestif : aligner le seuil entre Ma journée (9/28, encore 19) et Objectifs (9/14, encore 5), ou nommer les deux paliers (« premier score » / « analyses complètes »).
- [ ] Tendances : garder les mesures choisies en passant Semaine → Jour ; ajouter FC, phases de sommeil, kcal d'activité et règles aux courbes superposables.
- [ ] Essai : remplacer le lien retour « ← Agir » par « ← Objectifs », lister l'essai dans Objectifs et dans « Encore N choses aujourd'hui » de Ma journée avec la consigne concrète (« ce soir : au lit pour 7 h 30 »), et ne pas marquer « pas tenu » les jours « comme d'habitude ».
- [ ] Sauvegarde : proposer un export CSV (une ligne par jour et par mesure) à côté du JSON ; renommer la page « Vos données » en « Sauvegarde et export » pour éviter la confusion avec l'onglet Données.
