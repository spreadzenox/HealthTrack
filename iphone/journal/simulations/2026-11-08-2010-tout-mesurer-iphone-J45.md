# Simulation iPhone — Tout mesurer (iPhone seul) — J45 — 2026-11-08 20:10

- **Persona** : 3 Tout mesurer — femme de 45 ans, cadre, très organisée ; veut tout centraliser, comparer et exporter vers ses tableurs ; pas de montre, hésite à en acheter une
- **Configuration** : 2 iPhone seul (iPhone 12, 23 %) — données reçues : pas et dépense (carte « Mes appareils ») ; absentes : fréquence cardiaque, sommeil (la carte « Temps d'écran et sommeil » dit « Pas encore disponible sur iPhone »)
- **Moment** : jour 45 — bien-être 3,1/5 aujourd'hui (5 lectures), « 9/28 jours avec une note digestive », 456 entrées, pas quotidiens dans le Journal (8 585 hier, habitude 6 328), repas habituels (4 suggestions), aucune donnée de pas ni de repas sur l'écran Aujourd'hui
- **Outil** : `npm run persona -- --store=appstore` (variante App Store dans un navigateur, écran 390 × 844, version 918) ; limites connues non rapportées

## Tâches
1. Comprendre ce qu'une montre m'apporterait de plus — ratée : Sources > Ajouter une source > Apple Watch explique comment la brancher, jamais ce qu'elle ajouterait (sommeil, cœur, analyses plus riches).
2. Comparer pas et bien-être sur un mois dans Tendances — réussie : Journal > Tendances > Mois > « + » > Pas ; deux courbes sur deux axes, détail d'un jour au toucher, mais aucun chiffre de synthèse (moyenne, min, max) pour le mois.
3. Voir ce qui va avec mes bons jours dans Analyses — à moitié : la liste se lit (court, moyen, long terme), mais l'unité de référence change d'une fenêtre à l'autre et un « −4,7 pt » sur une note sur 5 m'a fait douter de tout le tableau.
4. Vérifier qu'un même chiffre est identique sur Aujourd'hui, Journal et Tendances — réussie avec un écart : pas du 7 nov. = 8 585 partout, bien-être du jour = 3,1 partout, mais bien-être du 7 nov. = 3,4 dans le Journal et 3,3 dans Tendances.
5. Exporter toutes mes données — à moitié : Réglages > Données > « Télécharger la sauvegarde » (456 entrées et votre profil) démarre, mais aucun format n'est annoncé et il n'y a pas d'export pour un tableur.
6. Noter mon repas de midi — réussie avec détour : sur Aujourd'hui, « Repas » n'ouvre que la photo ; dans Journal > Repas > Décrire, l'IA répond « Aucun aliment reconnu », j'ajoute « Lentilles cuites » à la main ; l'heure reste celle du moment (21:04), pas midi.

## Compris
- Tendances : je peux superposer Pas et Bien-être sur un mois, avec un axe de chaque côté, et toucher un jour donne les chiffres exacts (Pas 8 585, bien-être 3,3/5) — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/tendances-7nov.png`
- Journal > Jours : pour chaque jour, des tuiles Pas / Dépense / Repas et le détail horodaté ; les pas d'hier (8 585) sont identiques dans Tendances — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/journal-jours.png`
- Analyses : trois fenêtres datées (« le jour même et la veille », « de 2 à 6 jours avant », « de 7 à 27 jours avant ») et la légende « hachuré : pas assez net » — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/analyses-facteurs.png`
- Sources : brancher une Apple Watch, c'est « rien à installer », trois étapes claires — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/sources-montre.png`
- Données : un seul bouton pour tout sauvegarder, avec le compte « 456 entrées et votre profil » — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/export-sauvegarde.png`

## Pas compris
- « Je n'ai pas de montre et j'hésite : qu'est-ce qu'elle me donnerait de plus, concrètement ? L'écran me dit comment la brancher, pas pourquoi. Et pourquoi me parler de l'app Android alors que je suis sur iPhone ? » — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/sources-montre.png`
- « Mes pas sont la seule chose que l'iPhone mesure tout seul, et ils n'apparaissent nulle part sur Aujourd'hui. » — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/accueil-sans-pas.png`
- « Pas : pour 2 000 pas, puis 1 000, puis 500 ; Calories : 200, 100, 50 kcal. Je ne peux pas comparer les lignes entre elles. Et −4,7 pt pour le lactose, sur une note sur 5 ? Puis −0,0 pt ? » — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/analyses-facteurs.png`
- « En haut : Aucun lien assez net. En dessous : quinze lignes chiffrées. Alors je les regarde ou pas ? Et le violet, le brun, ça veut dire quoi ? » — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/analyses-facteurs.png`
- « Samedi 7 novembre : 3,4 dans le Journal, 3,3 dans Tendances. Lequel je reporte dans mon tableur ? » — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/tendances-7nov.png`
- « ≈ 1 039 kca » : le chiffre est coupé dans la tuile Repas de vendredi ; et « ↑ d'habitude 6 328 », c'est mon habitude ou l'écart ? — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/journal-jours.png`
- « Sauvegarde » : est-ce que je peux l'ouvrir dans Excel ? Quel format ? Je ne veux pas restaurer, je veux analyser. — capture : `captures/2026-11-08-2010-tout-mesurer-iphone-J45/export-sauvegarde.png`

## Constats → étapes POLISH
- [ ] Aujourd'hui (configuration iPhone seul) : aucune carte Pas alors que c'est la seule mesure automatique → ajouter une tuile Pas du jour (avec l'habitude), comme dans le Journal.
- [ ] Sources > Ajouter une source : rien n'explique ce qu'une montre ajoute pour une personne qui n'en a pas → encadré court « Avec une montre, Halcya pourrait aussi suivre : sommeil, fréquence cardiaque… » au-dessus de « Votre montre n'apparaît pas ? ».
- [ ] Sources > Capteurs Bluetooth : « Dans l'app Android, un bouton lance la recherche des appareils autour de vous. » affiché sur iPhone → retirer la phrase ou dire ce qui est possible sur iPhone.
- [ ] Sources : deux formules pour le même état, « Bientôt sur iPhone. » (Lecture du visage) et « Pas encore disponible sur iPhone. » (Temps d'écran et sommeil) → une seule formule.
- [ ] Sources > Mes appareils : « Dernières mesures il y a 2 jours » alors que le Journal affiche 8 585 pas hier (7 nov.) → aligner la date affichée sur la dernière mesure réellement présente.
- [ ] Analyses > Bien-être : l'unité de référence d'un même facteur change selon la fenêtre (Pas 2 000 / 1 000 / 500 ; Sucres 10 g / 5 g ; Calories 200 / 100 / 50 kcal) → même unité pour un facteur sur les trois fenêtres, ou le signaler en clair.
- [ ] Analyses > Bien-être : « −4,7 pt » (Lactose, long terme) sur une note sur 5 et « −0,0 pt » (Calories) → borner ou masquer les effets hors échelle, afficher « 0,0 » sans signe, écrire « pt (note sur 5) » une fois en tête.
- [ ] Analyses > Bien-être : « Aucun lien assez net » puis une liste chiffrée ; légende des couleurs absente, « hachuré » seulement en bas → phrase d'en-tête qui annonce que les lignes sont à titre indicatif, légende (couleurs + hachures) en haut de la liste.
- [ ] Analyses > Comment c'est calculé : « modèle régularisé », « prévoit mieux que demain comme aujourd'hui » trop techniques → une version en deux phrases simples, le détail replié.
- [ ] Journal vs Tendances : bien-être du 7 nov. = 3,4 (Journal, note saisie) et 3,3 (Tendances, note + visage) → même valeur du jour sur les deux écrans, ou libellés distincts (« votre note » / « bien-être du jour ») sur les deux.
- [ ] Journal > Jours : tuile Repas « ≈ 1 039 kca » coupée (vendredi 6 nov.) sur 390 px → police réduite ou retour à la ligne pour les totaux à 4 chiffres.
- [ ] Journal > Jours : « ↑ d'habitude 6 328 » ambigu → « au-dessus de votre habitude (6 328) ».
- [ ] Tendances : seuls « Confort digestif » et « Pas » sont ajoutables ; Dépense et Calories mangées (présents dans le Journal et les Analyses) manquent ; aucun chiffre de synthèse → ajouter ces mesures et une ligne moyenne / min / max sous le graphique pour la période.
- [ ] Réglages > Données : seul export = « sauvegarde » sans format annoncé → nommer le format et ajouter « Exporter pour un tableur (CSV, une ligne par jour) ».
- [ ] Aujourd'hui : « Repas » et « Photographier un repas » ne mènent qu'à la photo ; « Décrire » et « Repas habituels » n'existent que dans Journal > Repas → les proposer aussi depuis Aujourd'hui.
- [ ] Nouveau repas : la description « salade de lentilles, saumon fumé, un yaourt nature » donne « Aucun aliment reconnu » (à vérifier hors IA simulée) et le texte n'est pas repris quand on ajoute les aliments à la main.
- [ ] Nouveau repas : « Probablement riche en GOS » sans explication → « GOS (sucres fermentescibles des légumineuses) » ou lien « en savoir plus ».
- [ ] Nouveau repas : l'heure par défaut est l'heure actuelle (21:04) dans un champ date-heure complet → raccourcis « Petit-déjeuner / Midi / Soir ».
- [ ] Aujourd'hui : la puce « + 1 cigarett… » est coupée au bord droit, sans indice de défilement horizontal → ombre de bord ou puces sur deux lignes.
