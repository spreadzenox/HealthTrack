# Simulation — Ventre et données — J45 — 2026-11-10 14:35

- **Persona** : n°1 « Ventre et données » — homme de 38 ans, ingénieur, SII, mal au ventre souvent, veut comprendre avec des chiffres et exige qu'ils soient justes.
- **Configuration** : n°1 « Android seul » (Pixel 8, sans montre, poids 33 %). Données reçues : pas et dépense. Absentes : FC, VFC, température. Le sommeil estimé, Health Connect et la lecture du visage n'existent pas dans la version web, donc je ne les compte pas comme bugs.
- **Moment** : jour 45, parcours « Ma digestion » choisi à l'accueil. À l'écran : environ 1 mois de bien-être (courbe depuis le 12/10), des notes de digestion seulement depuis le 31/10 environ (« 9/28 jours avec une note digestive »), 3 à 5 repas par semaine, des cigarettes, des selles avec photo, 450 entrées au total.

## Tâches
1. Savoir quels aliments ou groupes FODMAP jouent sur mon ventre, et avec quelle certitude — **ratée**. L'onglet Analyses › Digestion répond « Encore 19 jours notés avant vos premiers résultats ». Aucune notion de FODMAP nulle part : ni dans Repas, ni dans Nutrition, ni dans Analyses. L'onglet Bien-être affiche bien des effets, mais pas de certitude chiffrée.
2. Vérifier qu'un même chiffre est identique à deux endroits — **réussie, avec des écarts trouvés**. Le bien-être d'hier (3,4) est le même dans le Journal et dans Tendances. Mais l'accueil affiche « 3/5 d'après 3 lectures du visage » aujourd'hui, alors que le Journal d'aujourd'hui ne contient aucune note de bien-être. Et Sources dit « Samsung Health : dernières mesures il y a 2 jours », alors que le Journal montre 10 085 pas hier.
3. Noter ma digestion — **réussie**. Trois choix (Calme, Gêne, Douleur), un toucher. Le compteur passe de 9/28 à 10/28 et de « 19 jours » à « 18 jours » sur l'accueil.
4. Lancer ou suivre un essai — **ratée**. Agir affiche « Rien en cours » et je ne peux pas lancer un essai moi-même (par exemple quelques jours sans lactose).
5. Préparer un document pour mon gastro-entérologue — **réussie à moitié**. Période de 2, 4 ou 12 semaines, puis « Créer le PDF » : le fichier est téléchargé, mais il n'y a aucun aperçu et je ne sais pas ce qu'il contient.
6. Exporter mes données — **réussie à moitié**. « Télécharger la sauvegarde » (450 entrées) démarre bien, mais le format n'est indiqué nulle part et il n'y a pas d'export CSV ou tableur pour faire mes propres calculs.

## Compris
- La page Analyses › Digestion dit clairement qu'il faut 28 jours notés et où j'en suis (barre de progression, bouton « Noter maintenant ») — capture : `captures/2026-11-10-1435-ventre-et-donnees-J45/analyses-digestion-9sur28.png`
- Tendances en vue Mois : je peux superposer bien-être et confort digestif, avec une bande d'incertitude et une prévision « attendu ». On voit tout de suite que mes notes de digestion ne commencent que fin octobre — capture : `captures/2026-11-10-1435-ventre-et-donnees-J45/tendances-mois.png`
- « Comment c'est calculé » puis « Le détail » : trois fenêtres de temps (jour même, 2 à 6 jours avant, 7 à 27 jours avant), un modèle régularisé, la validation en retirant des semaines entières. C'est sérieux et lisible — capture : `captures/2026-11-10-1435-ventre-et-donnees-J45/analyses-hachures.png`
- Le Journal du jour reprend aussitôt la note « 14:38 Digestion Gêne » que je viens d'ajouter — capture : `captures/2026-11-10-1435-ventre-et-donnees-J45/journal-aujourdhui.png`

## Pas compris
- « Je note ma digestion depuis 45 jours et l'app me dit 9/28, il en manque 19. » Le compteur ne dit pas s'il compte sur une fenêtre glissante de 28 jours ou depuis le début, ni pourquoi mes jours plus anciens ne comptent pas — capture : `captures/2026-11-10-1435-ventre-et-donnees-J45/accueil.png`
- « 3/5 d'après 3 lectures du visage » sur l'accueil, alors que le Journal d'aujourd'hui ne montre aucune lecture de bien-être. Lequel des deux est juste ? — captures : `captures/2026-11-10-1435-ventre-et-donnees-J45/accueil.png`, `captures/2026-11-10-1435-ventre-et-donnees-J45/journal-aujourdhui.png`
- Le hachurage veut dire « pas assez net », mais il ne marque que les deux plus gros effets (Lactose +1,2 pt, Calories −1,2 pt). Des lignes aux barres d'erreur énormes ne sont pas hachurées (Lactose court terme +0,0 pt, Pas long terme −0,3 pt). « Donc une barre large non hachurée, c'est net ? » Aucun chiffre de certitude (intervalle, nombre de jours, probabilité) — capture : `captures/2026-11-10-1435-ventre-et-donnees-J45/analyses-hachures.png`
- « Lactose 2 à 6 jours avant : +1,2 pt de bien-être », c'est contre-intuitif pour un SII, et l'en-tête dit en même temps « Aucun lien assez net ». Les lignes ne s'ouvrent pas au toucher pour voir le détail — capture : `captures/2026-11-10-1435-ventre-et-donnees-J45/analyses-hachures.png`
- Export : « Un fichier rangé dans Documents », mais quel format ? Est-ce que je peux l'ouvrir dans un tableur ? Et le PDF médecin se télécharge sans que je puisse voir ce qu'il contient avant de l'envoyer — capture : `captures/2026-11-10-1435-ventre-et-donnees-J45/export.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil et Analyses › Digestion, compteur « 9/28 jours » : préciser la fenêtre (« sur les 28 derniers jours » ou « depuis le début ») et expliquer pourquoi un utilisateur à J45 n'est qu'à 9. Pour ce parcours, vérifier la cohérence du jeu de démo J45 (notes de digestion présentes depuis ~45 jours).
- [ ] Accueil, carte « Bien-être aujourd'hui » : la note de 3/5 « d'après 3 lectures du visage » ne correspond à aucune entrée du Journal du jour. Afficher les lectures dans le Journal, ou ne pas annoncer un nombre de lectures absent ailleurs.
- [ ] Analyses, graphique des effets : le hachurage « pas assez net » contredit la largeur des barres. Hachurer (ou griser) toute ligne dont l'intervalle croise 0. Rendre chaque ligne touchable pour afficher l'intervalle chiffré et le nombre de jours utilisés.
- [ ] Parcours « Ma digestion » : Analyses s'ouvre sur l'onglet Bien-être. Ouvrir sur Digestion quand c'est l'objectif choisi. Pendant l'attente des 28 jours, montrer au moins un aperçu descriptif (jours Douleur ou Gêne contre les aliments ou groupes FODMAP des 24 h précédentes).
- [ ] FODMAP absent : étiqueter les repas par groupe FODMAP (lactose, fructanes, polyols…) dans Repas et en faire des facteurs de l'analyse digestive. Le lactose existe déjà en bien-être, mais pas les autres groupes.
- [ ] Agir : permettre de lancer soi-même un essai (par exemple « 7 jours sans lactose ») sans attendre que les analyses repèrent une piste.
- [ ] Vos données, Exporter : indiquer le format du fichier (JSON) et proposer un export CSV pour un tableur. Rapport PDF : ajouter un aperçu ou un résumé du contenu (sections, période) avant le téléchargement.
- [ ] Sources : « Samsung Health — dernières mesures il y a 2 jours » alors que le Journal montre des pas d'hier (10 085), et la source s'appelle Samsung Health sur un Pixel. Aligner la date de « dernières mesures » sur la dernière donnée affichée.
- [ ] Note de digestion : 3 niveaux seulement (Calme, Gêne, Douleur). Proposer en option le type de gêne (ballonnements, gaz, crampes) pour qu'un profil SII puisse croiser ses symptômes.
