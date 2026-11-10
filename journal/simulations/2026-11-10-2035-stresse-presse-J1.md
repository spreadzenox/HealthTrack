# Simulation — Stressé et pressé — J1 — 2026-11-10 20:35

- **Persona** : n° 7 « Stressé et pressé » — cadre de 38 ans, peu de temps, impatient ; veut se sentir mieux, ne notera presque rien, veut comprendre en 30 secondes ce que l'app apporte et ce qu'elle demande.
- **Configuration** : n° 12 « Android + autre montre » (téléphone Android + montre Amazfit, poids 2 %) — reçues : pas, sommeil approximatif, FC approximative (+ dépense) ; absentes : VFC, température, cœur au repos, SpO2.
- **Moment** : jour 1 — sommeil de cette nuit 6 h 30 (habitude 7 h 34), courbe de sommeil sur la semaine, pas/FC/dépense des jours précédents dans Journal ; rien sur Aujourd'hui à part sommeil et ma note « Bof ».

## Tâches
1. Passer l'accueil le plus vite possible — réussie mais lente : « Passer » n'existe que sur les 2 premiers écrans d'intro, puis 6 étapes obligatoires (objectif, sources, « téléphone suffit », humeur, Gold) + une visite guidée à fermer.
2. Comprendre en 30 s ce que l'app fait — à moitié : l'écran « Journal / Analyses / Agir » est clair, mais il annonce 3 onglets alors qu'il y en a 5, et la visite propose « Voir dans 14 jours » sans que je sache pourquoi.
3. Voir comment elle sait si je vais bien sans rien noter — ratée : Analyses dit « Encore 13 jours notés avant vos premiers résultats » malgré l'historique de ma montre ; l'alternative (lecture du visage) n'existe pas ici.
4. Retrouver mon sommeil de la montre — réussie : touche « Sommeil » sur Aujourd'hui → courbe de la semaine dans Journal › Tendances (en 2 gestes).
5. Savoir quoi faire ensuite pour aller mieux — ratée : Agir « Rien en cours pour l'instant », aucun conseil, aucune action en dehors de « noter ».
6. Couper ce qui m'embête / vérifier mon objectif — à moitié : « Mon stress et mon sommeil » retrouvé dans Paramètres, mais aucun réglage de rappels/notifications visible, et l'accueil continue de mettre Repas/Digestion en avant.

## Compris
- L'intro « Journal = voir, Analyses = liens trouvés, Agir = essai de deux semaines » est le meilleur résumé de l'app, court et clair — capture : `captures/2026-11-10-2035-stresse-presse-J1/accueil-02-compteur.png`
- Mon sommeil et l'historique de la montre (pas, FC, dépense) sont bien là, jour par jour, dans Journal › Jours — capture : `captures/2026-11-10-2035-stresse-presse-J1/journal-jours.png`
- « Ce qui vous amène » se change dans Paramètres et mon choix a été gardé — capture : `captures/2026-11-10-2035-stresse-presse-J1/parametres-19-analyses.png`

## Pas compris
- « 01/06 » reste figé pendant les 3 premiers écrans alors que les points avancent, et le « Passer » disparaît au 3e : « je ne sais pas combien il en reste, ça m'agace » — capture : `captures/2026-11-10-2035-stresse-presse-J1/accueil-02-compteur.png`
- La visite dit « Vos 30 derniers jours arrivent » et le gros bouton est « Voir dans 14 jours » : « voir quoi ? et pourquoi attendre 14 jours ? » ; et on m'avait parlé de 3 onglets, j'en vois 5 — capture : `captures/2026-11-10-2035-stresse-presse-J1/visite-14-jours.png`
- « Encore 13 jours notés » : « ma montre a 2 mois d'historique et vous ne me dites rien ? Je ne vais pas noter tous les jours » — capture : `captures/2026-11-10-2035-stresse-presse-J1/analyses-13-jours.png`
- Sources affiche « Samsung Health — Reçu » et me dit d'activer un partage dans Samsung Health, alors que j'ai une Amazfit, que l'accueil disait « Health Connect n'est pas sur ce téléphone » et que l'interrupteur Health Connect est coupé : « d'où viennent mes données, alors ? » — capture : `captures/2026-11-10-2035-stresse-presse-J1/sources-samsung.png`
- Journal montre « Écran 3 h 56 » et « Météo 11°/1° » alors que la météo n'a pas été activée et que Temps d'écran est « Disponible dans l'app Android » — capture : `captures/2026-11-10-2035-stresse-presse-J1/journal-jours.png`
- « 19 analyses IA restantes aujourd'hui » alors que je n'en ai fait aucune — capture : `captures/2026-11-10-2035-stresse-presse-J1/parametres-19-analyses.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil (intro) : le compteur « 01/06 » ne bouge pas sur les 3 écrans d'intro et « Passer » disparaît au 3e — faire avancer le compteur (ou compter les écrans d'intro à part) et garder « Passer » sur tout le parcours.
- [ ] Accueil (intro) : « Trois onglets, trois usages » alors que la barre en a 5 (Aujourd'hui, Sources en plus) — dire « trois usages » ou citer les 5 onglets.
- [ ] Visite Aujourd'hui : bouton principal « Voir dans 14 jours » incompréhensible et « 30 derniers jours arrivent » alors qu'ils sont déjà là — renommer (« Compris » / « Me le rappeler dans 14 jours ») et dire ce qu'on verra.
- [ ] Analyses (J1, montre déjà connectée) : écran bloqué sur « Encore 13 jours notés » — montrer d'emblée un premier aperçu tiré de l'historique de la montre (ex. sommeil vs pas) et préciser qu'une note par jour en 5 s suffit.
- [ ] Sources : carte « Samsung Health » présentée pour une montre d'une autre marque, contradictoire avec « Health Connect n'est pas sur ce téléphone » et l'interrupteur Health Connect coupé — afficher l'app réellement source (ou « via Health Connect ») et adapter le conseil au fabricant.
- [ ] Journal › Jours : tuiles « Écran » et « Météo » affichées alors que ces sources ne sont pas activées — n'afficher que les sources branchées, ou expliquer d'où vient la donnée.
- [ ] Aujourd'hui : les pas et la FC de la montre n'apparaissent pas (seulement Sommeil + Bien-être, qui fait doublon avec la carte du dessus) — ajouter Pas/FC dans « Vos données du jour » et retirer le doublon Bien-être.
- [ ] Aujourd'hui : avec l'objectif « stress et sommeil », les raccourcis Repas/Digestion et « Photographier un repas » restent en tête — prioriser selon « Ce qui vous amène » ; et l'aide dans Paramètres ne parle que de digestion/cycle, dire aussi ce que change « stress et sommeil ».
- [ ] Paramètres : « 19 analyses IA restantes aujourd'hui » sans analyse faite (attendu 20) — corriger le compteur.
- [ ] Agir : « quelques jours » contredit « essai de deux semaines » de l'intro — harmoniser ; et proposer au moins une action simple J1 (ex. « Coucher 30 min plus tôt », lié au sommeil 6 h 30 vs 7 h 34) pour la persona qui veut « quoi faire ».
- [ ] Réglages/Paramètres : l'intro dit « dans Paramètres » mais la roue ouvre « Réglages » ; aucun réglage de rappels/notifications trouvé — unifier le nom et rendre les rappels visibles (pour pouvoir les couper).
