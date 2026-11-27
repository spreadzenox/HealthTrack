# Simulation — Ventre et données — J45 — 2026-11-27 08:30

- **Persona** : n° 1 « Ventre et données » — syndrome de l'intestin irritable, mal au ventre souvent, veut comprendre avec des chiffres ce qui joue sur son ventre
- **Configuration** : n° 1 « Android seul » (téléphone Samsung, sans montre ni balance, poids 33 %) — données reçues : pas du téléphone (162 aujourd'hui, habitude 6 717) / absentes : sommeil, cœur
- **Moment** : jour 45 — mise à jour fraîche ; bandeau « Nouveau : Nouveaux onglets » ; essai « Dormir au moins 7 h 30 » jour 4 sur 10 ; confort digestif 3,4/5 sur 7 jours ; « 45 jours sur 56 avec votre digestion notée » ; une Douleur notée hier à 11:19

## Tâches
1. Comprendre ce qui a changé — réussie (bandeau « Voir » → page Nouveautés claire : 4 onglets, Agir depuis l'Accueil, Mon cycle déplacé)
2. Noter mon repas de midi et ma digestion — réussie avec un accroc (Midi → « Décrire le repas » → IA → Enregistrer ; mais le repas est daté 08:33 alors que j'ai touché « Midi » ; « Gêne » enregistrée en un toucher)
3. Savoir quels groupes FODMAP jouent sur mon ventre, avec chiffres et fiabilité — à moitié (chiffres par délai trouvés dans Objectifs → Confort digestif → Alimentation, mais conclusion « rien à éviter » contre −0,9 pt lactose, et aucune taille d'échantillon)
4. Retrouver mon essai et où il en est — réussie (Accueil et Objectifs, jour 4 sur 10, 1 jour tenu sur 5) mais je ne comprends pas pourquoi c'est un essai sommeil mesuré sur le bien-être
5. Comparer ma digestion de cette semaine aux semaines passées — ratée (Tendances « Mois » = zigzag illisible, aucune moyenne par semaine ; « Plutôt stable cette semaine » ne dit pas par rapport à quoi)
6. Préparer quelque chose pour ma gastro-entérologue — réussie (Rapport PDF 2/4/12 sem., « Halcya-rapport-2026-11-27.pdf téléchargé »), sans aperçu de ce qu'il contient

## Compris
- La page Nouveautés résume bien la refonte, et le bandeau sur l'Accueil y mène en un toucher — capture : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/repas-midi-0833.png`
- Décrire mon repas puis vérifier les grammes est rapide, et le repère « Riche en lactose » est utile pour moi — capture : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/repas-midi-0833.png`
- Le tableau Alimentation donne enfin des chiffres par groupe FODMAP, séparés en « court terme » et « moyen terme », avec l'unité expliquée (pt sur 5, Calme 5 / Gêne 3 / Douleur 1) — capture : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/alimentation-court-terme.png`
- Le rapport PDF pour la gastro est facile à trouver et à créer, avec choix de période — capture : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/rapport-pdf.png`

## Pas compris
- « J'ai touché Midi, il est marqué ✓ Midi, mais mon repas est enregistré à 08:33. Pour mes calculs de délai, c'est faux. » — capture : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/repas-midi-0833.png`
- « Le lactose fait −0,9 pt sur 2 à 6 jours, le fructose −0,9, et en haut on me dit "Rien à éviter pour l'instant". Et le fructose fait +0,7 le jour même : il m'aide ou il me nuit ? Sur combien de repas ? » La légende « hachuré = pas assez net » n'est qu'en bas de la liste, et les chiffres « en gris » ont la même couleur que les autres — captures : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/alimentation-court-terme.png`, `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/alimentation-moyen-terme.png`
- « Où sont les fructanes (blé, oignon, ail) ? C'est le groupe FODMAP qui me fait le plus peur et il n'apparaît pas. » Seuls fructose, sorbitol, GOS et lactose sont listés — capture : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/alimentation-moyen-terme.png`
- « Mon essai est "Dormir au moins 7 h 30", mesuré sur mon bien-être, alors que mon objectif c'était le ventre. Et la page Confort digestif me dit pour le sommeil "Pas assez de données". Le lien retour dit "← Votre bien-être" alors que je venais d'Objectifs. » — capture : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/essai-sommeil.png`
- « Dans Tendances, il y a "votre note" (losange) et "l'estimation du jour" (rond), qui ne sont pas d'accord : le 26/11 j'ai noté Douleur (1), l'estimation est vers 2,5. Le 3,4/5 de l'Accueil, c'est mes notes ou les estimations ? » Et en Mois, impossible de voir si cette semaine est meilleure que les précédentes (on devine juste une Douleur environ une fois par semaine) — capture : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/tendances-mois-digestion.png`
- « "45 jours sur 56 avec votre digestion notée" : j'utilise l'app depuis 45 jours, d'où viennent 56 ? » — capture : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/rapport-pdf.png`
- Le PDF est « téléchargé » mais je ne vois ni aperçu ni bouton pour l'ouvrir ou le partager — capture : `captures/2026-11-27-0830-ventre-et-donnees-maj-J45/rapport-pdf.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Ma journée → Repas : toucher « Midi » puis « Décrire le repas » ouvre le formulaire avec l'heure actuelle (08:32) ; pré-remplir l'heure du créneau touché (ex. 12:30) ou afficher « Heure : maintenant, modifier ? »
- [ ] Objectifs → Confort digestif → Alimentation : la phrase « Rien à éviter pour l'instant » coexiste avec −0,9 pt (lactose, fructose) sans explication ; écrire « Le lactose va avec −0,9 pt 2 à 6 jours après, mais pas assez net (N repas) » et afficher le nombre de jours/repas comparés par ligne
- [ ] Alimentation : monter la légende « hachuré = pas assez net » au-dessus du premier bloc et rendre les chiffres non nets réellement grisés (aujourd'hui même couleur)
- [ ] Alimentation : ajouter les fructanes (blé, oignon, ail) et le mannitol aux groupes FODMAP comparés, ou dire explicitement pourquoi ils manquent
- [ ] Essai après mise à jour : un essai « Dormir 7 h 30 » mesuré sur le bien-être est proposé à une personne à objectif ventre sans sommeil mesuré ; afficher sur la page de l'essai le critère mesuré (bien-être ou confort digestif) et la façon dont la consigne sera vérifiée sans données de nuit ; corriger le lien retour « ← Votre bien-être » quand on vient d'Objectifs
- [ ] Tendances / carte Confort digestif : ajouter une comparaison semaine par semaine (« cette semaine 3,4 · semaine dernière 3,1 · moyenne 4 sem. 3,3 ») et dire si le 3,4/5 vient des notes ou des estimations ; expliquer en une ligne pourquoi l'estimation diffère d'une note saisie
- [ ] « 45 jours sur 56 avec votre digestion notée, encore 11 » : reformuler (« Pour le long terme il faut 56 jours notés : vous en avez 45, encore 11 »)
- [ ] Rapport PDF : après « téléchargé », proposer « Ouvrir » / « Partager » et une phrase sur le contenu des deux pages
