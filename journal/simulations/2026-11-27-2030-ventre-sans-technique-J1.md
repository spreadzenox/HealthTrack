# Simulation — Ventre, sans technique — J1 — 2026-11-27 20:30

- **Persona** : n° 2 « Ventre, sans technique » — homme de 57 ans, intestin irritable (SII), peu à l'aise avec les applis, lit lentement, se décourage devant les mots techniques, veut savoir quoi éviter
- **Configuration** : n° 3 « iPhone + Apple Watch » (iPhone + Apple Watch, poids 11 %) — reçues : pas, sommeil, cœur au repos, variabilité cardiaque (courbes proposées dans Tendances) ; non visibles : phases du sommeil, oxygène du sang, fréquence cardiaque
- **Moment** : jour 1 — premier lancement, accueil passé seul (Pilou, objectif « Confort digestif », montre « Oui », Méditation décochée). Sommeil des 7 derniers jours déjà présent (6 h 30 aujourd'hui), aucune note avant les miennes ; j'ai saisi 1 repas, la digestion du jour et 1 selle

## Tâches
1. Comprendre ce que fait l'app et passer l'accueil — réussie (4 étapes claires avec la barre « 1 sur 4 » ; seul « C'est parti ! » n'a pas réagi quand je l'ai visé par son texte, il a fallu toucher le bouton directement)
2. Noter mon repas du soir — réussie avec réserves (la bulle Repas ouvre l'appareil photo, puis « Décrire le repas » ; l'IA a changé mon steak haché en « Haché de volaille » et compte la bière en grammes)
3. Noter ma digestion et mes selles — réussie (Calme / Gêne / Douleur puis Dures / Normales / Liquides : simple, 3 touches)
4. Savoir ce que je dois éviter pour mon ventre — ratée pour aujourd'hui (il faut 28 jours notés ; l'exemple montré est rempli de mots que je ne comprends pas : fructanes, GOS, FODMAP, « pt »)
5. Retrouver le sommeil de ma montre — réussie (Données › « + » › Sommeil, semaine en courbe, 6 h 30 aujourd'hui ; pas de détail sommeil léger/profond)
6. Préparer un papier pour mon gastro — réussie (Réglages › Sauvegarde › Rapport PDF pour mon médecin › Créer le PDF, fichier téléchargé), mais je ne l'aurais pas cherché sous « Sauvegarde »

## Compris
- La digestion se note en deux secondes : « Calme, Gêne, Douleur », puis « Dures, Normales, Liquides ». C'est fait pour moi — capture : `captures/ventre-sans-technique-J1/digestion-selles.png`
- L'avertissement « Riche en lactose : yaourt nature » sous mon repas : enfin quelque chose qui me dit quoi surveiller. Le détail ouvert est clair (« certaines personnes digèrent mal le lactose ») — capture : `captures/ventre-sans-technique-J1/repas-ia.png`
- Mon sommeil de la semaine arrive tout seul, en heures, et je touche un jour pour voir le détail — capture : `captures/ventre-sans-technique-J1/sommeil-semaine.png`
- Le rapport PDF pour le médecin : 2 / 4 / 12 semaines, un bouton, c'est fait — capture : `captures/ventre-sans-technique-J1/rapport-pdf.png`

## Pas compris
- « Jour 1 sur 7 avant vos premiers résultats », puis juste en dessous « premier score dans 14 jours », puis dans Objectifs « 13 jours », « 1 sur 14 », « pistes au 28e jour », « encore 27 jours notés »… Alors c'est quand que je saurai quelque chose ? — capture : `captures/ventre-sans-technique-J1/accueil-compteurs.png`
- L'exemple « au jour 28 » : « Fructanes », « GOS », « FODMAP », « −2,7 pt », « Fructose en excès ». Je voulais savoir si c'est le pain ou l'oignon qui me gêne, j'ai l'impression de lire une ordonnance de labo — capture : `captures/ventre-sans-technique-J1/exemple-fodmap.png`
- J'ai écrit « steak haché », l'app a mis « Haché de volaille ». Et « Bière brune 100 g » : une bière, ça se compte en verre, pas en grammes. 100 g de frites, c'est une petite portion — capture : `captures/ventre-sans-technique-J1/repas-ia.png`
- Dans Données, la première courbe dit « Aucune lecture du visage ce jour-là » : je n'ai jamais demandé qu'on lise mon visage — capture : `captures/ventre-sans-technique-J1/sommeil-semaine.png`
- La visite guidée « Voir un exemple » m'a emmené de mon ventre vers une page « Agir » (exemple au jour 14), puis « Passer la visite » m'a renvoyé à l'Accueil au lieu de me laisser où j'étais — capture : `captures/ventre-sans-technique-J1/exemple-fodmap.png`
- Le rapport pour le médecin est rangé dans « Sauvegarde », entre « JSON » et « CSV » que je ne comprends pas — capture : `captures/ventre-sans-technique-J1/rapport-pdf.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil + Objectifs : unifier les compteurs (7 / 13 / 14 / 27 / 28 jours) en une seule phrase par objectif, ex. « Confort digestif : vos premières pistes (quoi éviter) dans 27 jours notés » ; ne pas afficher « Jour 1 sur 7 » et « 14 jours » sur la même carte.
- [ ] Confort digestif (exemple et vrais résultats) : mettre l'aliment courant en titre (« Blé, oignon, ail ») et le terme technique en petit (fructanes, FODMAP) ; remplacer « −2,7 pt » par une phrase (« journées nettement moins bonnes »).
- [ ] Analyse IA d'un repas écrit : « steak haché » ne doit pas devenir « Haché de volaille » (garder bœuf par défaut) ; boissons en verre / ml (« 1 verre de bière, 25 cl ») plutôt qu'en grammes ; portion de frites par défaut plus réaliste.
- [ ] Données › Tendances : au premier lancement, ne pas ouvrir sur « Bien-être » avec « Aucune lecture du visage ce jour-là » quand la lecture du visage n'est pas activée ; ouvrir sur une courbe qui a des données (sommeil) ou écrire « Notez votre bien-être dans Ma journée ».
- [ ] Rapport médecin : le rendre trouvable hors de « Sauvegarde » (entrée « Rapport pour mon médecin » dans Réglages ou dans Objectifs › Confort digestif).
- [ ] Visite guidée « Voir un exemple » depuis Votre confort digestif : « Suivant » ne doit pas changer de page vers Agir ; « Passer la visite » doit laisser l'utilisateur sur la page où il était.
- [ ] Tendances › Sommeil (Apple Watch avec phases) : montrer dans le détail du jour la répartition léger / profond / paradoxal, en mots simples.
- [ ] Ma journée : le bouton rapide « Selles » a une icône d'appareil photo, ce qui laisse croire qu'il faut photographier ses selles ; icône neutre ou libellé « Noter mes selles ».
