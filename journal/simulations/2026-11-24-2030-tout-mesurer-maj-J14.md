# Simulation — Tout mesurer — J14 — 2026-11-24 20:30

- **Persona** : n° 3 « Tout mesurer » — veut tout centraliser, comparer ses mesures entre elles et exporter ses données ; à l'aise avec la technique, exigeant sur les chiffres.
- **Configuration** : n° 12 « Android + autre montre » (téléphone Android + Amazfit via Zepp, poids 2 %) — reçues : pas, sommeil, fréquence cardiaque, oxygène du sang ; absentes : VFC, température.
- **Moment** : jour 14, juste après la mise à jour vers la version « Pilou / 4 onglets ». Vu : bien-être du jour 3/5 (4 lectures du visage), sommeil 6 h 30 (habitude 7 h 19), 3 860 pas (habitude 6 535), essai « Dormir au moins 7 h 30 » au jour 4 sur 10, 240 entrées dans la sauvegarde, Zepp marqué « Reçu » (cœur, oxygène, sommeil, pas, dépense, séances).

## Tâches
1. Comprendre ce qui a changé avec la mise à jour — réussie (bandeau « Nouveau » → « Voir » → page Nouveautés claire, liste des 4 onglets et des renommages).
2. Retrouver le sommeil, le cœur et l'oxygène de ma montre — ratée en partie (sommeil et pas sur l'Accueil et dans Tendances ; cœur et oxygène annoncés « reçus » dans Sources mais visibles nulle part ailleurs).
3. Comparer deux mesures dans Tendances — réussie (Bien-être + Sommeil superposés avec deux axes ; détail d'un jour au toucher), mais aucun chiffre de lien entre les deux.
4. Exporter toutes mes données — réussie (Réglages › Sauvegarde › « Télécharger en CSV » → « halcya-donnees-2026-11-24.csv téléchargé »), sans savoir si cœur/oxygène sont dedans.
5. Voir où en est mon essai — réussie mais déroutante (Accueil › Agir → page de l'essai : « Jour 4 sur 10 » et « 1 jour réussi sur 5 » côte à côte).
6. Noter quelque chose en un geste — réussie en 3 touchers (Ma journée › Noter › 4 › Enregistrer) ; l'Accueil passe à 3,8/5.

## Compris
- La page Nouveautés liste bien ce qui a bougé (onglets, « Données » devenu « Sauvegarde », « FC » devenu « Cœur ») ; mes données d'avant sont là (courbe de la semaine pleine, essai conservé). — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/accueil-donnees-du-jour.png`
- Sources est honnête et précis : Zepp « Reçu », dernière mesure il y a moins d'une heure, et ce qui n'arrive jamais (cœur au repos, VFC) avec la marche à suivre dans Zepp. — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/sources-zepp.png`
- Tendances : superposer deux mesures avec un axe chacune, puis toucher un jour pour voir les valeurs, c'est exactement ce que je voulais. — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/tendances-selecteur.png`
- Le mode Jour explique enfin le 3,8 : « vous avez noté 4 · estimé avec le visage », avec ma note en losange à côté des 4 lectures. — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/tendances-jour-note.png`
- « Comment c'est calculé › Le détail » (fenêtres 0-1 / 2-6 / 7-27 jours, modèle régularisé, validation par semaines retirées) : enfin une méthode décrite, ça me rassure. — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/objectifs-sommeil-vide.png`

## Pas compris
- Ma montre envoie le cœur et l'oxygène du sang (Sources le dit), mais je ne les trouve ni dans « Vos données du jour » (seulement Sommeil et Pas), ni dans la liste « + » de Tendances (Confort digestif, Sommeil, Pas, Écran). Où sont-ils passés avec la mise à jour ? — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/accueil-donnees-du-jour.png`
- Après avoir ajouté Sommeil, « Pas » a disparu de la liste « + » sans explication (limite de deux unités ? de deux courbes ?). — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/tendances-selecteur.png`
- Essai : « Jour 4 sur 10 » puis 5 lanternes et « 1 jour réussi sur 5 ». 10 ou 5 ? Et la ligne « Sans » est vide alors que les jours 2 et 3 étaient des jours « comme d'habitude ». — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/essai-jour4.png`
- Objectifs › Sommeil : « 2 facteurs comparés » mais on ne me dit pas lesquels ni avec quel chiffre ; la page est vide alors que dans Tendances sommeil et bien-être bougent visiblement ensemble. — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/objectifs-sommeil-vide.png`
- Sur l'Accueil, 3/5 devient 3,8/5 après ma note de 4 : la pondération n'est expliquée qu'en mode Jour de Tendances, et la petite courbe de l'Accueil n'affiche pas ma note. — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/tendances-jour-note.png`
- Nouveautés affiche « Version installée : 0.0.0. » : pour quelqu'un qui vient de recevoir une mise à jour, ça fait version de développement. — capture : `captures/2026-11-24-2030-tout-mesurer-maj-J14/accueil-donnees-du-jour.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil « Vos données du jour » + sélecteur « + » de Tendances : afficher Cœur (fréquence cardiaque / Cœur la nuit) et Oxygène du sang quand Sources les marque reçus (Zepp) ; sinon dire dans Sources « reçu mais pas encore affiché ».
- [ ] Tendances, sélecteur « + » : ne pas faire disparaître une mesure (Pas) sans raison ; la griser avec « 2 courbes au plus » ou « une seule unité de plus ».
- [ ] Page de l'essai : aligner « Jour 4 sur 10 » et « 1 jour réussi sur 5 » (ex. « 1 jour avec tenu sur 5 jours avec ») et expliquer pourquoi la ligne « Sans » est encore vide (« 0 lendemain sans mesuré sur 3 »).
- [ ] Objectifs › famille (Sommeil, etc.) : lister les facteurs comparés (ex. « Durée de sommeil, coucher ») avec leur écart en pt même « pas assez net » (hachuré, comme dans Tendances › Jour).
- [ ] Sauvegarde › CSV : indiquer le contenu (nombre de lignes, colonnes, mesures de montre incluses : sommeil, pas, cœur, oxygène) avant ou après le téléchargement.
- [ ] Accueil, carte Bien-être : « D'après 4 lectures du visage et votre note » → ajouter « vous avez noté 4 » et le point de la note sur la mini-courbe, comme en mode Jour.
- [ ] Nouveautés : remplacer « Version installée : 0.0.0. » par le vrai numéro (ou masquer la ligne si inconnu).
