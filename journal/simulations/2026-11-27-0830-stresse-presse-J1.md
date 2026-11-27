# Simulation — Stressé et pressé — J1 — 2026-11-27 08:30

- **Persona** : n° 7 « Stressé et pressé » — veut se sentir mieux, ne notera presque rien ; peu de patience, lit en diagonale, abandonne vite ce qui demande des efforts.
- **Configuration** : n° 1 « Android seul » (téléphone Samsung, sans montre ni balance, poids 33 %) — reçues : pas (162 aujourd'hui, « d'habitude 6 717 par jour ») ; absentes : sommeil, cœur.
- **Moment** : jour 1 — premier lancement ; accueil fait avec « Bien-être » seul, aucun appareil, aucune habitude ; ensuite une note bien-être 2/5 + « Stress », et rien d'autre.

## Tâches
1. Comprendre en 30 s ce que l'app fait pour moi — à moitié réussie : « Vos repas, votre sommeil, vos appareils et votre ressenti, au même endroit » dit *quoi*, pas ce que j'y gagne ; le reste de l'écran parle de confidentialité.
2. Finir l'accueil le plus vite possible — réussie, mais en 11 gestes : nom (Valider **puis** Continuer), 4 étapes, puis un écran « Gold » imprévu après « C'est parti ! » (pourtant « 4 sur 4 »), puis une visite guidée.
3. Noter comment je me sens en un geste — réussie en 3 gestes (bulle Bien-être → 2 → Enregistrer). La fenêtre grandit au choix de la note et « Enregistrer » descend de 200 px sous le doigt.
4. Savoir ce que l'app attend de moi chaque jour (le minimum) — à moitié : l'accueil impose « Repas en photo, 3 par jour » (non décochable) et l'Accueil dit « Encore 3 choses aujourd'hui » ; Objectifs dit que seuls des « jours notés » comptent, sans dire qu'une note bien-être suffit.
5. Comprendre quand je verrai quelque chose d'utile — réussie : « Jour 1 sur 7 avant vos premiers résultats » (Accueil) et « 1 sur 7 jours notés, pas forcément d'affilée » (Objectifs).
6. Couper ou espacer les rappels — ratée : rien sur les rappels ou les notifications dans Réglages ni dans Paramètres ; abandonnée.

## Compris
- La note bien-être est simple (1 à 5, puces facultatives comme « Stress ») et s'affiche tout de suite dans Accueil et Données — capture : `captures/2026-11-27-0830-stresse-presse-J1/note-2-pilou-bonne-humeur.png`
- Premier score après 7 jours notés, pas forcément d'affilée : clair et rassurant pour quelqu'un qui oubliera des jours — capture : `captures/2026-11-27-0830-stresse-presse-J1/objectifs-6-jours.png`
- Je peux décocher l'habitude « Méditation » pré-cochée et l'estimation de temps se met à jour (« Repas et bien-être · environ 1 minute ») — capture : `captures/2026-11-27-0830-stresse-presse-J1/accueil-chaque-jour.png`

## Pas compris
- « J'ai dit que j'allais à 2 sur 5, stressé, et Pilou passe "De bonne humeur" ? On se moque de moi ? » — capture : `captures/2026-11-27-0830-stresse-presse-J1/note-2-pilou-bonne-humeur.png`
- « 3 photos de repas par jour, c'est obligatoire ? Je voulais juste dire comment je vais. Et 3 photos en "environ 1 minute", je n'y crois pas. » — capture : `captures/2026-11-27-0830-stresse-presse-J1/accueil-chaque-jour.png`
- « J'appuie sur "C'est parti !" à 4 sur 4 et il y a encore un écran d'abonnement, puis une visite. C'est fini quand ? » — capture : `captures/2026-11-27-0830-stresse-presse-J1/gold-apres-fin.png`
- « "Vos 30 derniers jours arrivent" : c'est mon premier jour, quels 30 jours ? » — capture : `captures/2026-11-27-0830-stresse-presse-J1/visite-30-jours.png`
- « Où je coupe les rappels ? Je ne trouve rien. » — capture : `captures/2026-11-27-0830-stresse-presse-J1/reglages-sans-rappels.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil › humeur de Pilou : une note bien-être basse (1–2/5) fait passer Pilou à « De bonne humeur ». Séparer clairement « Pilou content que vous ayez noté » de votre état (ex. bulle « Merci, journée difficile ? » et pas d'humeur euphorique juste après une note basse).
- [ ] Accueil (bienvenue) › étape 4 « Ce que vous noterez chaque jour » : « Repas en photo, 3 par jour » est imposé alors que seul Bien-être est choisi. Rendre Repas facultatif (case à décocher), ou afficher « Minimum : une note bien-être par jour » ; revoir l'estimation « environ 1 minute ».
- [ ] Réglages : aucun réglage des rappels ou notifications n'est trouvable. Ajouter « Rappels » (couper, choisir l'heure, en espacer) dans Réglages, visible dès la première page.
- [ ] Accueil (bienvenue) › fin : après « 4 sur 4 » et « C'est parti ! », l'écran Gold puis la visite guidée s'ajoutent. Intégrer Gold dans le compte d'étapes (ou le montrer plus tard) et proposer la visite seulement une fois, discrètement.
- [ ] Visite guidée › bulle « Votre Accueil » : « Vos 30 derniers jours arrivent » est trompeur le jour 1. Écrire par ex. « Vos pas des 30 derniers jours arrivent du téléphone ; le reste se remplit jour après jour ».
- [ ] Note bien-être : quand on choisit la note, la fenêtre grandit et « Enregistrer » se déplace (y≈532 → y≈731). Garder le bouton à une place fixe (ancré en bas), pour une saisie en un ou deux gestes.
- [ ] Accueil › carte « Jour 1 sur 7 » (J1…J7, ressemble à des jours de calendrier) vs Objectifs « 7 jours notés, pas forcément d'affilée » : aligner le texte (« 1 jour noté sur 7 ») et dire ce qui compte comme jour noté (une note bien-être suffit ?).
- [ ] Nom de Pilou : « Valider » puis « Continuer » sur le même écran = un geste en trop ; un seul bouton « Continuer ».
