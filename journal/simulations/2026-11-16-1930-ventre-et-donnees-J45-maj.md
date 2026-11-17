# Simulation — Ventre et données — J45 — 2026-11-16 19:30

- **Persona** : n° 1 « Ventre et données » — SII, mal au ventre souvent, veut comprendre avec des chiffres ; ouvre l'app pour la première fois après la grosse mise à jour (avant : onglets Journal, Analyses, Agir ; objectifs « mon ventre » et « mon cycle » ; essai « dormir plus » en cours, jour 4/10 ; règles notées dans l'app).
- **Configuration** : n° 4 « Samsung + Galaxy Watch » (pas, sommeil, fréquence cardiaque, oxygène du sang ; pas de VFC ; poids 8 %) — reçues à l'écran : sommeil (6 h 30), pas (3 551) ; absentes partout où j'ai regardé : fréquence cardiaque et oxygène du sang (ni sur l'Accueil, ni dans les courbes de Tendances).
- **Moment** : jour 45 — 45 jours d'historique : bien-être et confort digestif notés presque chaque jour depuis le 18/10, selles, règles (jour 4 le 12/11), essai sommeil jour 4 sur 10 ; bien-être du jour 3/5.

## Tâches
1. Comprendre ce qui a changé avec la mise à jour — réussie à moitié : le bandeau « Nouveau : Nouveaux onglets… et 19 autres changements » → « Voir » ouvre Nouveautés, mais la note sur la navigation n'est que la 2e carte et l'info clé (« le Journal jour par jour rejoint Tendances ») est enfouie en 6e carte au milieu de correctifs internes (« Exemple de la visite au petit matin »). Rien n'explique pourquoi Analyses, Agir et « mon cycle » ont disparu.
2. Retrouver mes jours d'avant (l'ancien Journal) — réussie mais par hasard : Données › Tendances › toucher un point de la courbe ouvre la fiche du jour, avec en bas « Vos saisies » (règles, bien-être, digestion, selles). Rien dans la navigation ne s'appelle Journal.
3. Retrouver mon essai en cours — réussie : carte « Dormir au moins 7 h 30 · jour 4 sur 10 » sur l'Accueil ; la page de l'essai garde pourtant un lien « ← Agir » qui mène à une page Agir sans onglet (l'onglet allumé passe d'Objectifs à Accueil).
4. Retrouver mes règles et « mon cycle » — ratée à moitié : je peux toujours noter mes règles (Ma journée › Règles) et elles apparaissent dans la fiche d'un jour, mais l'objectif « mon cycle » a disparu d'Objectifs, il n'y a pas de courbe Règles dans Tendances ni rien dans Réglages.
5. Retrouver mes analyses de ce qui joue sur mon ventre — réussie : Objectifs › Confort digestif › « Ce qui va avec votre confort digestif », avec les chiffres par facteur ; mais après 45 jours tout est « pas encore net », et les chiffres se contredisent.
6. Noter mon ventre du jour et lire la courbe du mois — réussie : Ma journée › Noter ma digestion › Gêne (« Bilan du jour : Gêne. Merci ! ») ; dans Tendances, ajout de « Confort digestif » + vue Mois. Courbe lisible mais très en dents de scie, sans repère pour mes règles.

## Compris
- L'Accueil reprend l'essai en cours, le sommeil et les pas de la montre, avec « d'habitude » à côté : rassurant après la mise à jour — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/accueil-apres-maj.png`
- La fiche d'un jour dans Tendances garde tout ce que je notais dans le Journal (règles 4e jour, digestion Gêne, selles type 4) — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/jour-12-nov-saisies.png`
- Le détail « Ce qui va avec votre confort digestif » donne enfin des chiffres par aliment/facteur, avec une légende (Calme 5, Gêne 3, Douleur 1) — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/ventre-lactose-contradictoire.png`
- Superposer bien-être et confort digestif sur un mois, c'est ce que je voulais voir — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/courbe-mois-ventre-sans-regles.png`

## Pas compris
- « Où est passé mon objectif cycle ? J'avais deux objectifs, il n'en reste qu'un pour le ventre, et l'autre carte est un "Bien-être" que je n'ai pas choisi. » — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/objectifs-sans-cycle.png`
- « Le lactose me fait +0,5 pt le jour même et −0,5 pt deux à six jours après ? Alors c'est bon ou pas ? Et c'est quoi GOS ? » — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/ventre-lactose-contradictoire.png`
- « Mon essai me renvoie vers "Agir", mais il n'y a plus d'onglet Agir : je suis où ? L'onglet allumé en bas dit Accueil. » — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/agir-orphelin-onglet-accueil.png`
- « Pour le 12 novembre, j'ai trois chiffres de bien-être : 2,8 en haut, "vous avez noté 3", et 2,6 dans mes saisies. Lequel est le vrai ? » — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/jour-12-nov-saisies.png`
- « Je ne vois ni mes règles sur la courbe du ventre, ni le cœur et l'oxygène de ma montre. Comment je vérifie si mon ventre empire pendant mes règles ? » — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/courbe-mois-ventre-sans-regles.png`
- « Le bien-être est à 3/5 sur l'Accueil et à 3,1/5 dans Objectifs, le même jour. » — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/objectifs-sans-cycle.png`
- « Le + en bas de "Vos données du jour" ne fait rien quand je le touche (deux essais). » — capture : `captures/2026-11-16-1930-ventre-et-donnees-J45-maj/accueil-apres-maj.png`
- « Après avoir choisi Gêne, aucun des trois ronds n'est coché ; seul le texte "Bilan du jour : Gêne" me dit que c'est noté. »

## Constats → étapes POLISH au BACKLOG
- [ ] Mise à jour : pour quelqu'un qui avait l'ancienne version, afficher une seule carte « Où sont passés vos onglets » (Journal → Données › Tendances › toucher un jour ; Analyses → Objectifs › Ce qui va avec… ; Agir → carte essai de l'Accueil ; Mon cycle → ?), avant les 19 changements et sans les correctifs internes (« Exemple de la visite… »).
- [ ] Objectifs : l'objectif « mon cycle » a disparu sans explication ; le rétablir (carte Cycle) ou dire où il est passé ; et proposer « Règles » comme couche dans Tendances (bandes de couleur sur la courbe Confort digestif).
- [ ] Page essai `/agir/essai/…` : remplacer le lien « ← Agir » par un retour vers l'Accueil (ou vers Objectifs), et faire allumer le même onglet en bas sur l'essai et sur `/agir` (aujourd'hui Objectifs puis Accueil).
- [ ] Confort digestif › « Ce qui va avec… » : quand un même facteur a des signes opposés en court et moyen terme (Lactose +0,5 / −0,5), ajouter une phrase qui le dit ; expliquer « GOS » et « FODMAP » en mots simples.
- [ ] Fiche jour de Tendances : un seul chiffre de bien-être par jour, ou dire clairement d'où vient chacun (2,8 en tête, « vous avez noté 3 », 2,6 dans Vos saisies) ; harmoniser aussi 3/5 sur l'Accueil et 3,1/5 dans Objectifs.
- [ ] Tendances : la fréquence cardiaque et l'oxygène du sang de la Galaxy Watch n'apparaissent nulle part (ni dans le + des courbes, ni sur l'Accueil) — les proposer ou dire qu'ils ne sont pas utilisés.
- [ ] Accueil › « Vos données du jour » : le bouton + ne réagit pas ; le brancher ou l'enlever.
- [ ] Ma journée › Ma digestion : garder le rond Calme/Gêne/Douleur coché après le choix.
- [ ] Nouveautés : la page entière fait environ 88 000 px de haut (capture pleine page) ; la regrouper par mise à jour (la dernière ouverte, le reste replié).
