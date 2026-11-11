# Simulation — Prendre soin de soi, maigrir — J1 — 2026-11-11 08:35

- **Persona** : n° 6 Prendre soin de soi, maigrir — Nadia, 41 ans, aide-soignante, veut perdre 6 kg et manger mieux, pas technophile
- **Configuration** : n° 1 Android seul (téléphone : pas et calories ; pas de montre, de balance, de sommeil ni de cœur ; poids 33 %) — reçu : pas des 6 derniers jours (5 500 à 10 000/j, visibles seulement dans Journal › Tendances) ; absent : sommeil, cœur, poids connecté
- **Moment** : jour 1 — premier lancement : accueil en 6 étapes, objectif « Prendre soin de moi », première note bien-être 4/5, aucun repas avant ma saisie

## Tâches
1. Comprendre en 30 s ce que l'app fait pour moi — à moitié : « Vos repas, votre sommeil, votre montre et votre ressenti » ; je n'ai ni montre ni sommeil suivi, et rien ne parle de poids ou de maigrir.
2. Faire l'accueil et choisir mon objectif — réussie : « Prendre soin de moi · alimentation, poids, forme » coché ; mais l'écran suivant m'annonce « bien-être, digestion, repas en photo » et on ne me demande ni mon poids ni mon objectif de 6 kg.
3. Noter mon déjeuner « salade de pâtes au thon » — réussie avec détour : « Repas » ouvre l'appareil photo (pas de photo → « Décrire le repas »), l'IA renvoie « Pâtes à la carbonara » avec lardons/œuf/parmesan, les pâtes sont « absentes de la base » ; j'ai tout supprimé, ajouté « Thon au naturel » ; enregistré sous le nom « Pâtes à la carbonara », 143 kcal, à 08:37.
4. Trouver où suivre mon poids — réussie mais cachée : Journal › Nutrition › « Compléter mon profil » › Poids ; pas de poids cible ; le 74 kg n'apparaît ni sur l'accueil ni dans Tendances.
5. Voir mes pas du jour — ratée pour aujourd'hui : rien sur l'accueil ; seulement Journal › Tendances › « + » › Pas, courbe de la semaine jusqu'à hier.
6. Savoir ce que je ferai demain — ratée : Agir dit « Rien en cours » ; rien ne me dit quoi faire demain pour mon objectif.

## Compris
- Le choix d'objectif est clair et ma ligne « alimentation, poids, forme » me parle — capture : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/objectif.png`
- Quand l'appareil photo ne marche pas, on me propose tout de suite « Décrire le repas » ; la recherche « thon » donne une liste claire avec les kcal — capture : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/repas-enregistre.png`
- Mon repas apparaît sur l'accueil avec ses kcal — capture : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/accueil-apres.png`
- La courbe des pas de la semaine est lisible — capture : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/pas-tendances.png`

## Pas compris
- « J'ai coché poids, et on me parle de digestion et de visage » : l'écran « Votre téléphone suffit » liste « bien-être, digestion, repas en photo », sans pas ni poids — capture : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/telephone-suffit.png`
- « J'ai écrit salade de pâtes au thon, il me met carbonara avec lardons ! » et le nom reste « carbonara » après correction (probablement le faux relais de l'outil, à vérifier) — capture : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/repas-ia.png`
- « 220 g de pâtes = 0 kcal ? » : « Pâtes alimentaires, cuites » absentes de la base, le total affiche ≈ 0 kcal — capture : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/repas-0kcal.png`
- « Où je mets mon poids ? » : seulement dans un profil Nutrition, sans objectif ; après saisie, rien sur l'accueil ni en Tendances (seul « Pas » proposé) — captures : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/profil-poids.png`, `captures/2026-11-11-0835-prendre-soin-maigrir-J1/tendances-sans-poids.png`
- « Mon téléphone compte mes pas, pourquoi je ne les vois pas en ouvrant ? » : « Vos données du jour » ne montre que mon bien-être (en double avec la carte du dessus), même dans l'exemple jour 14 — captures : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/accueil.png`, `captures/2026-11-11-0835-prendre-soin-maigrir-J1/exemple-mesures.png`
- « Voir dans 14 jours » ou « Passer la visite » : je ne sais pas lequel choisir ; l'exemple montre un bouton « + 1 cigarette » que je n'ai pas — capture : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/visite.png`
- Tendances › Jour : « Aucune lecture du visage ce jour-là » (fonction absente de la version web, noté sans bloquer) ; choisir « Pas » remplace Bien-être au lieu de l'ajouter.
- Agir : « analyses », « piste », « rapport médecin » — rien pour quelqu'un qui veut maigrir — capture : `captures/2026-11-11-0835-prendre-soin-maigrir-J1/agir.png`
- Heure du repas pré-remplie à 08:37 pour un déjeuner ; je ne l'aurais pas vu.

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil (étapes 2 à 4) : avec l'objectif « Prendre soin de moi », demander poids actuel et poids visé, et lister « repas, poids, pas » dans « Ce que vous noterez » au lieu de « digestion ».
- [ ] Aujourd'hui : afficher les pas du jour (et le dernier poids) dans « Vos données du jour » ; ne pas répéter le bien-être déjà montré dans la carte du dessus.
- [ ] Profil / Tendances : ajouter un « Poids visé » et une courbe Poids dans Tendances dès la première pesée (aujourd'hui seule « Pas » est proposée) ; raccourci « Poids » dans « Autre chose ».
- [ ] Repas : « Pâtes alimentaires, cuites » absent de la base → total ≈ 0 kcal ; ajouter cet aliment courant et ne jamais afficher « 0 kcal » quand un aliment est non compté (« total incomplet »).
- [ ] Repas : laisser renommer le repas après correction (le nom IA « Pâtes à la carbonara » reste) ; proposer l'heure du repas selon le moment (déjeuner) ou la rendre plus visible. Vérifier si « carbonara » vient du faux relais de l'outil.
- [ ] Agir J1 : pour l'objectif « Prendre soin de moi », proposer un premier pas concret pour demain (ex. « notez vos 3 repas », « pesez-vous le matin ») au lieu de « Rien en cours ».
