# Simulation — Stressé et pressé — J1 — 2026-11-22 08:30

- **Persona** : n° 7 « Stressé et pressé » — cadre de 38 ans, a installé l'app sur un conseil, veut se sentir mieux, ne notera presque rien, lâche dès que ça demande trop d'effort.
- **Configuration** : n° 3 « iPhone + Apple Watch » (Watch Series 10, poids 11 %) — reçues : pas, sommeil, FC, VFC (jouée sur l'apparence Android) / absentes : poids, tension
- **Moment** : jour 1 — premier lancement ; 30 jours de montre déjà importés (Sommeil 7 h 10 cette nuit, d'habitude 7 h 34 ; VFC 51 ms, d'habitude 49 ; 118 pas ce matin, d'habitude 6 328) ; aucune saisie avant moi.

## Tâches
1. Passer l'accueil vite et choisir mon objectif — réussie (≈ 9 gestes : bienvenue, nom de la mascotte en 2 temps « Valider » puis « Continuer », 4 étapes, puis un écran « Gold » en plus après « 4 sur 4 »).
2. Comprendre en 30 s ce que l'app fait pour moi — à moitié (l'écran « sans rien faire » est rassurant, mais l'Accueil dit « Jour 1 sur 7 avant vos premiers résultats » alors que la montre a déjà 30 jours).
3. Noter comment je me sens, une fois — réussie (Ma journée › Bien-être › Noter, 2/5 + « Stress », 4 gestes, rapide et clair).
4. Savoir ce qui joue sur mon bien-être / quoi faire maintenant — ratée (Objectifs : « premier score dans 6 jours notés », puis « Pistes au 14e jour noté » ; Agir : « Rien en cours », le lien renvoie sur Objectifs : boucle).
5. Retrouver le sommeil de ma montre — réussie (Données › Mois › Sommeil : la courbe des 30 nuits est là).
6. Comprendre mon chiffre de « variabilité cardiaque » — à moitié (la ligne de l'Accueil ouvre la bonne courbe et dit ce que c'est, pas si 51 ms c'est bien ou pas).

## Compris
- L'écran 3/4 « Ce que Halcya suit pour vous, sans rien faire » + « Tout ça, je m'en occupe » : exactement ce que je veux entendre. — capture : `captures/2026-11-22-0830-stresse-J1/accueil-visite.png`
- « Vos données du jour » sur l'Accueil : sommeil, VFC, pas avec « d'habitude » à côté, d'après ma montre : lisible d'un coup d'œil. — capture : `captures/2026-11-22-0830-stresse-J1/humeur-pilou.png`
- La note de bien-être : 1 à 5, une mascotte qui dit « Bof · Merci de me le dire », puces « Stress », « Alcool »… tout est facultatif, j'ai fini en 10 secondes. — capture : `captures/2026-11-22-0830-stresse-J1/humeur-pilou.png`
- Toucher « Variabilité cardiaque » sur l'Accueil ouvre directement sa courbe, avec une phrase d'explication. — capture : `captures/2026-11-22-0830-stresse-J1/vfc.png`

## Pas compris
- « Jour 1 sur 7 avant vos premiers résultats » : ma montre a 30 jours de données, pourquoi je dois encore attendre une semaine ? Et sur la page bien-être, c'est « premier score dans 6 jours » puis « pistes au 14e jour noté » : donc 7 ou 14 jours ? Moi je ne noterai pas 14 jours. — capture : `captures/2026-11-22-0830-stresse-J1/bien-etre-objectif.png`
- « Agir — Vérifier une piste par un essai » : j'arrive sur « Rien en cours pour l'instant », et « Où en sont vos analyses » me renvoie sur Objectifs qui me redit d'attendre. Rien à faire aujourd'hui. — capture : `captures/2026-11-22-0830-stresse-J1/agir-vide.png`
- Je mets 2/5 « Bof, stress » et juste après, en haut : « Pilou est de bonne humeur ». Il m'écoute ou pas ? — capture : `captures/2026-11-22-0830-stresse-J1/humeur-pilou.png`
- « Repas en photo, 3 par jour » coché d'office, « Méditation » cochée d'office et le titre dit « Décochez les habitudes qui ne vous parlent pas » alors que les 3 autres sont déjà décochées. 3 photos par jour, je ne le ferai pas. — capture : `captures/2026-11-22-0830-stresse-J1/habitudes.png`
- « Variabilité cardiaque 51 ms » : c'est bien, pas bien ? Monter, c'est mieux ? — capture : `captures/2026-11-22-0830-stresse-J1/vfc.png`
- « Repéré sans vous : Sport le soir (séance après 18 h) » dans la note de 08:35 un dimanche matin : quel soir ? Hier ? — capture : `captures/2026-11-22-0830-stresse-J1/humeur-pilou.png`
- « Halcya cherchera quels facteurs sont statistiquement liés à votre bien-être » : trop technique pour moi. — capture : `captures/2026-11-22-0830-stresse-J1/bien-etre-objectif.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil, carte « Jour 1 sur 7 avant vos premiers résultats » : quand la montre a déjà importé ≥ 7 jours, ne pas afficher « avant vos premiers résultats » comme si rien n'existait ; montrer tout de suite un premier constat montre (ex. « Vos nuits : 7 h 34 en moyenne sur 30 jours ») et réserver le compteur aux analyses qui demandent des notes.
- [ ] Objectifs › Bien-être : deux seuils (« premier score dans 6 jours » et « pistes au 14e jour noté ») sur le même écran ; n'en montrer qu'un (le prochain) et remplacer « statistiquement liés » par « ce qui va avec ».
- [ ] Agir, état vide : le lien « Où en sont vos analyses » boucle vers Objectifs qui dit encore d'attendre ; proposer au moins une action J1 accessible sans données notées (ex. petit essai basé sur le sommeil de la montre) ou masquer l'entrée « Agir » sur l'Accueil tant qu'elle est vide.
- [ ] Accueil, bandeau « Pilou est de bonne humeur » juste après une note 2/5 « Bof · Stress » : l'humeur de la mascotte suit les tâches faites, pas mon ressenti ; adoucir le libellé (« Pilou est content que vous ayez noté ») ou le teinter avec la note.
- [ ] Accueil étape 4/4 « Ce que vous noterez chaque jour » : « Décochez… » alors qu'une seule habitude est cochée d'office ; écrire « Cochez ce qui vous parle » et indiquer que les repas sont facultatifs (un profil pressé lit « 3 photos par jour » comme une obligation).
- [ ] Données › Variabilité cardiaque : la phrase explique ce que c'est mais pas le sens ; ajouter « plus haut = mieux récupéré, à comparer à votre habitude (49 ms) ».
- [ ] Note bien-être, ligne « Repéré sans vous : Sport le soir (séance après 18 h) » le matin à 08:35 : préciser le jour (« hier soir ») pour éviter de croire à une erreur.
- [ ] Accueil : la barre de progression dit « 4 sur 4 » puis « C'est parti ! » mène encore à l'écran « Gold » (et une pastille « gold » sans sens en haut) ; l'intégrer au compte ou en faire une simple bannière sur l'Accueil.
- [ ] Nom de la mascotte : 2 taps pour le même champ (« Valider » puis « Continuer ») ; un seul bouton « Continuer » qui valide le nom.
