# Simulation — Ventre et données — J45 — 2026-11-12 08:35

- **Persona** : n° 1 « Ventre et données » — Camille, 34 ans, SII, mal au ventre souvent ; veut comprendre avec des chiffres ce qui joue sur son ventre et son bien-être.
- **Configuration** : n° 2 « iPhone seul » (téléphone seul, poids 23 %) — reçu : pas (172 ce matin, 10 085 hier, habitude 6 756) et dépense (2 352 kcal hier) ; absent : sommeil, FC (pas de montre).
- **Moment** : jour 45 — Journal rempli (repas, digestion Calme/Gêne/Douleur, selles type Bristol, bien-être /5, cigarettes), courbes bien-être + confort digestif sur un mois, analyses « Digestion » et « Bien-être » avec barres hachurées, rien dans Agir.

## Tâches
1. Comprendre ce que l'app a trouvé sur mon ventre (et quel FODMAP pose problème) — ratée : la carte dit « Vos analyses digestives sont prêtes » mais la page répond « Aucun lien assez net » ; aucun mot sur les FODMAP.
2. Savoir quoi faire ensuite (tester quelque chose ?) — ratée : Agir « Rien en cours pour l'instant », aucun essai que je peux lancer moi-même (ex. éviction du lactose).
3. Noter la digestion de ce matin — réussie : « Noter ma digestion » → « Gêne », enregistré en un geste, visible dans le Journal à 08:35.
4. Regarder mes courbes — réussie : Journal › Tendances, ajout de « Confort digestif » via « + », vue Mois.
5. Préparer quelque chose pour ma gastro — réussie : Analyses › Préparer le rapport › 4 sem. › Créer le PDF → « Halcya-rapport-2026-11-12.pdf téléchargé ».
6. Exporter mes données — réussie (partiellement) : Réglages › Données › Télécharger la sauvegarde (JSON seulement, pas de tableur).

## Compris
- Noter la digestion est ultra simple (3 boutons, dernière note rappelée, mini-frise de la journée) — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/digestion-notee.png`
- Les courbes bien-être et confort digestif superposées sur un mois, avec une zone « attendu » pour les jours suivants — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/tendances-mois.png`
- Le rapport PDF pour le médecin : période au choix, fichier créé sur le téléphone, message de confirmation clair — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/rapport-pdf.png`
- L'export : « 486 entrées et votre profil », bouton unique — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/export.png`

## Pas compris
- « Vos analyses digestives sont prêtes » sur l'accueil… et en ouvrant : « Aucun lien assez net pour l'instant ». Prêtes à quoi, alors ? Je me suis sentie un peu flouée après 45 jours. — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/accueil.png`, `captures/2026-11-12-0835-ventre-et-donnees-J45/analyses-digestion.png`
- Lactose « +0,2 pt » / « +0,4 pt » sur mon confort digestif et « +1,0 pt » sur mon bien-être : le lactose me ferait du bien ? Pour quelqu'un avec un SII c'est l'inverse de ce que je pensais, et rien ne dit si « + » veut dire mieux ou pire. Je n'ai rien sur les FODMAP (fructanes, polyols…) alors que c'est LA question que je me pose. — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/analyses-bienetre.png`
- « Long terme : encore 12 jours notés » : c'est 12 jours qu'il me manque ? Après 45 jours ? Et le chiffre est passé à 11 juste après ma note de ce matin, et le lactose moyen terme de +0,4 à +0,3 : ça bouge à chaque note sans que je sache pourquoi. — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/analyses-bas.png`
- Je note ma digestion en Calme / Gêne / Douleur, mais les analyses et la courbe parlent de « confort digestif sur 5 » : je ne sais pas à quel chiffre correspond « Gêne ». — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/tendances-mois.png`
- Sur la courbe semaine, il y a un point bien-être « aujourd'hui » (~2,5, rond vide) alors que je n'ai pas encore noté mon bien-être aujourd'hui. — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/tendances.png`
- Agir dit d'attendre que les analyses « repèrent une piste » : je ne peux pas décider moi-même de tester sans lactose deux semaines. — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/agir-vide.png`
- Rapport PDF : case « Inclure mon bien-être estimé (caméra) » alors que je n'ai jamais utilisé de caméra ; je n'ai pas vu ce que contient le PDF avant de le créer. — capture : `captures/2026-11-12-0835-ventre-et-donnees-J45/rapport-pdf.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil, carte « Vos analyses digestives sont prêtes » : titre trompeur quand la page dit « Aucun lien assez net » ; adapter le titre à l'état (« Pas encore de piste nette — voir où en sont vos analyses »).
- [ ] Analyses Digestion/Bien-être : expliquer le sens du signe (« + = meilleur confort ») dans la légende pt, et sur une ligne inattendue comme Lactose + chez SII, rappeler « rien de net, ne changez rien sur cette base ».
- [ ] Analyses Digestion : aucune notion FODMAP alors que la persona SII l'attend ; au minimum ligne « FODMAP » (ou fructanes/polyols) ou une phrase disant ce qui est suivi et ce qui ne l'est pas.
- [ ] « Long terme : encore N jours notés » : reformuler (« il manque encore N jours notés pour le long terme ») et dire pourquoi après 45 jours d'usage (jours complets requis ?).
- [ ] Échelle digestion : afficher la correspondance Calme/Gêne/Douleur ↔ note sur 5 (légende courbe Tendances et ligne « pt » des analyses).
- [ ] Tendances semaine : point bien-être « auj. » affiché (rond vide ~2,5) sans note du jour ; préciser « estimé » ou ne pas l'afficher.
- [ ] Agir vide : proposer un essai lancé par l'utilisateur (ex. « Tester sans lactose 2 semaines ») même sans piste détectée.
- [ ] Rapport PDF : masquer « Inclure mon bien-être estimé (caméra) » quand aucune donnée caméra n'existe ; ajouter un aperçu du contenu (2 pages) avant création.
- [ ] Données › Exporter : « rangé dans Documents » puis « Enregistrez le fichier… (ex. Dossier Documents) » se contredisent ; proposer aussi un export CSV lisible dans un tableur.
