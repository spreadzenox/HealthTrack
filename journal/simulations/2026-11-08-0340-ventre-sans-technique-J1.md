# Simulation — Ventre, sans technique — J1 — 2026-11-08 03:40

- **Persona** : n°2 Ventre, sans technique — 58 ans, SII, peu à l'aise avec les applis, lit lentement, n'aime pas le jargon, veut savoir quoi éviter
- **Configuration** : n°15 Niche tout mesurer (Galaxy Ring, poids 1 %) — pas, sommeil, FC, VFC reçus ; phases de sommeil non vues
- **Moment** : jour 1 — premier lancement ; l'accueil montre déjà sommeil 7 h 10, VFC 51 ms, pas 8 585 et une semaine d'historique dans Journal

## Tâches
1. Comprendre l'app en 30 secondes — réussie à moitié : l'accueil est clair, mais rien ne dit « à quoi ça sert » en une phrase
2. Noter ma digestion — réussie : un bouton « Gêne », un geste, l'heure est notée
3. Savoir ce qui joue sur mon ventre / quoi éviter — ratée : « résultats dans 27 jours », Agir vide, aucune réponse avant un mois
4. Noter un repas — réussie en décrivant : l'IA répond « Aucun aliment reconnu » (message rouge qui reste), j'ai cherché « riz » à la main
5. Trouver mes données de montre — réussie : Aujourd'hui et Journal > Jours ; mais Sources parle de « Gadgetbridge », pas de ma bague
6. Exporter / voir mes courbes — exporter réussie (Réglages > Données) ; Tendances comprise à moitié

## Compris
- Accueil : date, gros boutons Repas / Bien-être / Digestion / Selles, mes chiffres de nuit et de pas — capture : `captures/2026-11-08-0340-ventre-sans-technique-J1/accueil.png`
- Noter la digestion : Calme / Gêne / Douleur, « Dernière note : Gêne, à 03:37 », compteur 1/28 jours — capture : `captures/2026-11-08-0340-ventre-sans-technique-J1/analyses-digestion.png`
- Journal > Jours : mes jours précédents avec la digestion notée en orange — capture : `captures/2026-11-08-0340-ventre-sans-technique-J1/journal-jours.png`
- Avertissement avant l'IA : honnête et lisible, je sais ce qui part — capture : `captures/2026-11-08-0340-ventre-sans-technique-J1/repas-ia-erreur.png`
- Sauvegarde : « Télécharger la sauvegarde », rangée dans Documents — pas de jargon

## Pas compris
- « VFC », « FC au repos », « bpm », « ms » : je ne sais pas ce que c'est ni si 51 est bon ou mauvais — capture : `captures/2026-11-08-0340-ventre-sans-technique-J1/journal-jours.png`
- « Il faut aussi 4 jours de plus avec une gêne ou une douleur » : j'ai noté une gêne, est-ce que ça compte ? — capture : `captures/2026-11-08-0340-ventre-sans-technique-J1/analyses-digestion.png`
- « Gadgetbridge » : je n'ai jamais installé ça ; ma bague n'est pas nommée. Health Connect, « SpO₂ » : incompréhensibles — capture : `captures/2026-11-08-0340-ventre-sans-technique-J1/sources.png`
- En touchant par erreur l'interrupteur Health Connect : rouge « Non disponible », « Native health APIs are not accessible in a browser environment » — j'ai cru avoir cassé quelque chose — capture : `captures/2026-11-08-0340-ventre-sans-technique-J1/health-connect-erreur.png`
- Bouton « Repas » en haut de l'accueil : j'ai touché, rien ne s'est passé (caméra ?), pas d'explication
- Tendances : l'axe sans unité (6, 7, 9), et le point d'aujourd'hui (~6,9) ne correspond pas à « 7 h 10 » de l'accueil — capture : `captures/2026-11-08-0340-ventre-sans-technique-J1/tendances.png`
- « Agir : essais, piste, rapport médecin » : je ne sais pas ce qu'est un « essai » ; le rapport PDF est « premium » sans prix visible
- « Comment c'est calculé » lien discret, et Analyses > Bien-être affiche d'abord « Calcul des analyses… » un instant

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil / Journal / Tendances : remplacer ou expliquer « VFC », « FC au repos » (ex. « Variabilité du cœur », « Pouls au repos ») avec une phrase et un repère bon/mauvais au toucher
- [ ] Sources : nommer l'appareil de façon compréhensible (« Gadgetbridge » → nom de la montre/bague ou explication d'une ligne), cacher « SpO₂ » ou l'écrire « oxygène »
- [ ] Sources > Health Connect : message d'erreur en phrases simples, sans texte technique anglais « Native health APIs… », et sans rouge alarmant ; l'interrupteur est trop facile à toucher en défilant
- [ ] Analyses > Digestion : clarifier la condition « 4 jours de plus avec une gêne ou douleur » (compte actuel X/4) et proposer, avant 28 jours, un résumé utile (ex. pistes générales SII ou historique de la montre déjà reçu)
- [ ] Repas > Décrire : après un échec IA, effacer le message rouge « Aucun aliment reconnu » dès qu'un aliment est ajouté à la main ; proposer d'abord « Photo / Décrire » avec un exemple pour que l'IA reconnaisse
- [ ] Accueil : bouton « Repas » sans caméra (navigateur) ne réagit pas : afficher un message ou ouvrir la galerie / la saisie
- [ ] Tendances : ajouter l'unité sur l'axe (h, pas) et aligner la valeur d'aujourd'hui avec l'accueil (7 h 10)
- [ ] Données : afficher le prix / le principe du « premium » à côté de « Débloquer »
