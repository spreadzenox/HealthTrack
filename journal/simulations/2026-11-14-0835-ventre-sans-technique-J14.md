# Simulation — Ventre, sans technique — J14 — 2026-11-14 08:35

- **Persona** : n° 2 « Ventre, sans technique » — syndrome de l'intestin irritable, peu à l'aise avec les applis, veut savoir quoi éviter
- **Configuration** : n° 3 « iPhone + Apple Watch » (Watch SE 3 / Series 10 à 12, poids 11 %) — reçues : pas, sommeil, cœur, cœur au repos, variabilité cardiaque, oxygène du sang, respiration, température, dépense ; absentes : rien de manquant vu (Sources : « Apple Watch · Reçu »)
- **Moment** : jour 14 — à l'ouverture « 13/28 jours notés » pour la digestion, « 13/14 jours notés » pour le bien-être ; Journal rempli (digestion, selles, repas, mesures de la montre) ; Nutrition : « 8 repas · 5 jours » sur la semaine

## Tâches
1. Noter ma digestion et mes selles ce matin — réussie (« Noter ma digestion » → « Gêne », puis « + Selles » → « Liquides » ; tout s'enregistre au premier toucher, compteur passé à 14/28)
2. Savoir quoi éviter pour mon ventre (Analyses → Digestion) — ratée (écran vide : « Encore 14 jours notés avant vos premiers résultats » ; l'exemple montre des mots que je ne connais pas)
3. Voir si l'app a trouvé quelque chose sur ma forme (Analyses → Bien-être) — ratée (après ma 14e note : « Aucun lien assez net pour l'instant sur ce que vous pouvez changer. »)
4. Retrouver mes jours de douleur (Journal → Tendances) — réussie à moitié (courbe « Confort digestif » trouvée derrière un « + » ; le détail d'hier affiche 2,4/5 alors que j'ai noté « Douleur »)
5. Vérifier que ma montre envoie bien (Sources) — réussie (« Apple Watch · Reçu · Dernières mesures il y a moins d'une heure »)
6. Préparer un papier pour ma gastro-entérologue (Réglages → Données → « Préparer le rapport » → « Créer le PDF ») — réussie, mais je ne sais pas où est le fichier (« Halcya-rapport-2026-11-14.pdf téléchargé. »)

## Compris
- L'accueil : cinq gros boutons en haut (Repas, Bien-être, Digestion, Selles, Autre chose), mes chiffres de la montre avec « d'habitude », et une barre qui avance vers mes analyses digestives — capture : `captures/2026-11-14-0835-ventre-sans-technique-J14/accueil.png`
- Noter la digestion : trois mots simples (Calme, Gêne, Douleur) et « Dernière note : Gêne, à 08:32. » me confirme que c'est pris — même capture d'accueil pour le contexte
- Sources : ma montre est bien « Reçu », la liste est en français courant (« oxygène du sang ») — pas de capture gardée
- Le rapport PDF « à montrer à votre médecin ou à votre diététicienne » : je comprends à quoi il sert — pas de capture gardée
- Tendances : la légende « Confort digestif : Calme 5, Gêne 3, Douleur 1 » m'explique l'échelle — capture : `captures/2026-11-14-0835-ventre-sans-technique-J14/tendances-detail-13nov.png`

## Pas compris
- « Encore 14 jours notés avant vos premiers résultats » : ça fait deux semaines que je note tout et l'écran Digestion ne me dit rien, même pas « voici vos jours de gêne ». Et le bouton « Noter maintenant » alors que je viens de noter il y a deux minutes — capture : `captures/2026-11-14-0835-ventre-sans-technique-J14/analyses-digestion-vide.png`
- L'exemple « Au jour 28 » : « Fructanes », « GOS », « Sorbitol », « (FODMAP) », « −3,9 pt », « FC au repos »… Je ne sais pas ce qu'est un fructane ni dans quel aliment il y en a. Je voulais lire « évitez l'oignon » ou « le pain » — capture : `captures/2026-11-14-0835-ventre-sans-technique-J14/exemple-jour28.png`
- Dans Agir, la visite dit « Exemple au jour 14 » et montre « Dormir au moins 7 h 58 ». Moi je SUIS au jour 14 et j'ai « Rien en cours pour l'instant ». Et « 14 jours, un jour sur deux tiré au sort » : tiré au sort quoi ? — capture : `captures/2026-11-14-0835-ventre-sans-technique-J14/agir-exemple-jour14.png`
- Bien-être, après ma note : « Moyen terme (de 2 à 6 jours avant) : encore 7 jours avec votre bien-être noté ou lu. » — « ou lu » par qui ? Et la liste « liens pas encore nets » parle de « barres hachurées, chiffres en gris », « GOS », « hPa », « bpm » : je ne vois pas de gris et je ne sais pas quoi en faire — capture : `captures/2026-11-14-0835-ventre-sans-technique-J14/bien-etre-liens-pas-nets.png`
- Hier j'ai noté « Douleur » (donc 1 d'après la légende) mais le détail dit « Confort digestif 2,4/5 — estimé, avec votre note « douleur » ». Pareil pour le bien-être : le Journal écrit « 22:30 Bien-être 3,4 / 5 » alors qu'on ne peut choisir que 1, 2, 3, 4 ou 5, et Tendances écrit « 3,2/5 — votre note 3,4 et le visage ». Quel est le vrai chiffre ? — capture : `captures/2026-11-14-0835-ventre-sans-technique-J14/tendances-detail-13nov.png`
- Nutrition : « ≈ 573 kcal/j en moyenne : des repas manquent sans doute, apports sous-estimés. », des barres hachurées partout, « partiel », « Folates (B9) », « µg ». Rien sur mon ventre, et dans le Journal la petite mention « repas incomplets ? » ne réagit pas quand je la touche — capture : `captures/2026-11-14-0835-ventre-sans-technique-J14/nutrition.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Analyses → Digestion, jour 14 : l'écran ne contient que « Encore 14 jours notés avant vos premiers résultats » ; afficher dès maintenant un bilan simple sans statistique (nombre de jours Calme / Gêne / Douleur, repas des jours de douleur) pour ne pas laisser deux semaines sans retour.
- [ ] Exemple « Au jour 28 » et liste « Ce qui va avec votre confort digestif » : « Fructanes », « GOS », « Sorbitol », « (FODMAP) » sans aucun aliment ; ajouter sous chaque nom deux ou trois aliments courants (« oignon, ail, blé ») et remplacer « −3,9 pt » par une phrase.
- [ ] Tendances, détail d'un jour : « Confort digestif 2,4/5 — estimé, avec votre note « douleur » » contredit la légende « Douleur 1 » ; montrer d'abord la note saisie (« Vous avez noté : Douleur ») et expliquer en mots simples d'où vient l'estimation.
- [ ] Bien-être : le Journal affiche « Bien-être 3,4 / 5 » comme une note saisie alors que la saisie n'accepte que 1 à 5, et Tendances donne « 3,2/5 » pour le même jour ; étiqueter dans le Journal ce qui vient de la lecture du visage et aligner les deux chiffres.
- [ ] Agir, visite guidée : le bouton « Exemple au jour 14 » et l'étiquette « EXEMPLE · DONNÉES FICTIVES · jour 14 » laissent croire qu'au jour 14 on a une piste, alors que l'écran réel dit « Rien en cours pour l'instant » ; reformuler (« Exemple d'essai ») et réécrire « 14 jours, un jour sur deux tiré au sort ».
- [ ] Analyses (les deux onglets) : le bouton « Noter maintenant » reste proposé juste après une note du jour ; le remplacer par « Noté aujourd'hui, revenez demain ».
- [ ] Analyses → Bien-être : « encore 7 jours avec votre bien-être noté ou lu » et « (barres hachurées, chiffres en gris) » (aucun gris visible) ; réécrire sans « lu » et corriger la légende ou la couleur des chiffres.
- [ ] Deux façons de noter : la fiche « Ma digestion » enregistre au premier toucher, sans bouton, alors que « Comment vous sentez-vous ? » demande « Enregistrer » ; harmoniser, ou ajouter un court « Enregistré » visible sur la fiche digestion.
- [ ] Réglages → Données, rapport PDF : après « Créer le PDF », seul « Halcya-rapport-2026-11-14.pdf téléchargé. » apparaît ; ajouter « Ouvrir » / « Envoyer » et dire où le fichier est rangé. Le rapport n'est accessible ni depuis Analyses → Digestion (hors exemple) ni depuis l'accueil.
- [ ] Journal → Jours : la mention « repas incomplets ? » sous « ≈ 224 kcal » ne réagit pas au toucher ; la rendre cliquable (vers l'ajout d'un repas) ou la reformuler en constat. Tuiles « SpO₂ » et « FC au repos » : utiliser les mots de Sources (« oxygène du sang », « cœur au repos »).
- [ ] Journal → Tendances : la courbe « Confort digestif » est cachée derrière un « + » sans libellé ; pour une personne qui note sa digestion, l'afficher d'emblée.
