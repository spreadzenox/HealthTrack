# Simulation — Stressé et pressé — J1 — 2026-11-19 20:30

- **Persona** : n° 7 « Stressé et pressé » — homme de 34 ans, cadre, veut se sentir mieux et moins stressé, ne notera presque rien, abandonne vite si c'est long.
- **Configuration** : n° 4 « Samsung + Galaxy Watch » (Galaxy S + Galaxy Watch 7 via Samsung Health → Health Connect, poids 8 %) — reçus : pas, sommeil, cœur, oxygène, séances ; absents : stress (jamais affiché nulle part), VFC, cœur au repos.
- **Moment** : jour 1 — premier lancement. Accueil : sommeil 6 h 30 (d'habitude 7 h 41), 3 858 pas ; Données : courbe sommeil sur 7 jours ; aucune trace du stress de la montre.

## Tâches
1. Comprendre en 30 s ce que l'app fait pour moi — ratée : « Vos repas, votre sommeil, vos appareils et votre ressenti, au même endroit » dit ce qu'elle stocke, pas ce qu'elle m'apporte ; puis tout de suite un pavé confidentialité avec « photo de selles ».
2. Finir l'accueil le plus vite possible — réussie mais longue : ~11 touches (Commencer, mascotte, Valider + Continuer pour le nom, 4 étapes, écran Gold surprise après « C'est parti ! », visite à passer) ; le « Passer » de la mascotte disparaît au bout d'une seconde.
3. Voir mon sommeil et mon stress de la montre — à moitié : sommeil OK (Accueil et Données › Sommeil, courbe claire) ; stress introuvable (le « + » de Données ne propose que Sommeil et Pas, Sources ne le cite pas).
4. Noter comment je me sens en un geste — réussie en 3 touches (bulle Bien-être, 2, Enregistrer) ; mais j'ai mis 2/5 et Pilou passe à « De bonne humeur », et le graphique du jour dit « Aucune lecture du visage ce jour-là » alors que ma note est juste en dessous.
5. Savoir quand l'app me dira quelque chose d'utile sur mon stress — ratée : trois délais différents (Accueil « Jour 1 sur 7 », Objectifs « Encore 6 jours notés », Votre bien-être « Encore 13 jours notés… 1/14 »), et rien sur le stress.
6. Régler ou couper les rappels — abandonnée : ni Réglages ni Paramètres n'ont de rubrique Rappels / Notifications.

## Compris
- « Rien à faire, je m'en occupe » pour la montre : rassurant, c'est ce que je veux — capture : `captures/2026-11-19-2030-stresse-presse-J1/sources-samsung.png`
- Mon sommeil de la nuit comparé à d'habitude, d'un coup d'œil sur l'Accueil, puis la courbe de la semaine dans Données — capture : `captures/2026-11-19-2030-stresse-presse-J1/donnees-pas-de-stress.png`
- Pouvoir décocher la méditation que je ne fais pas, et voir « 2 choses par jour · environ 1 minute » — capture : `captures/2026-11-19-2030-stresse-presse-J1/accueil-habitudes-repas-impose.png`

## Pas compris
- « Ma montre mesure mon stress toute la journée, il est où ? » Ni dans Données, ni dans Sources (Samsung Health liste cœur, oxygène, sommeil, pas… pas le stress) — capture : `captures/2026-11-19-2030-stresse-presse-J1/donnees-pas-de-stress.png`
- « 7 jours, 6 jours ou 13 jours ? Je veux juste savoir quand ça me sert à quelque chose » — capture : `captures/2026-11-19-2030-stresse-presse-J1/bien-etre-13-jours.png`
- « J'ai dit que j'étais à 2 sur 5 et la bestiole est de bonne humeur ? » — capture : `captures/2026-11-19-2030-stresse-presse-J1/accueil-humeur-pilou.png`
- « Trois repas en photo par jour, je ne le ferai jamais, et je ne peux pas l'enlever » (« Décochez les habitudes… » mais Repas n'a pas de case) — capture : `captures/2026-11-19-2030-stresse-presse-J1/accueil-habitudes-repas-impose.png`
- « Où je coupe les rappels ? » Rien dans Paramètres — capture : `captures/2026-11-19-2030-stresse-presse-J1/parametres-sans-rappels.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Stress de la montre : quand Samsung Health envoie un stress, l'afficher (Accueil « Vos données du jour » + choix « Stress » dans Données › +) ; sinon le dire dans Sources (« Samsung Health ne partage pas le stress » comme pour la VFC).
- [ ] Délai avant résultats : un seul chiffre partout (Accueil « Jour 1 sur 7 », Objectifs « 6 jours notés », Votre bien-être « 13 jours… 1/14 ») et dire ce qu'on obtiendra ce jour-là.
- [ ] Rappels : ajouter une rubrique « Rappels » dans Réglages (heure, couper tout), ou dire à l'accueil qu'il n'y en a pas.
- [ ] Accueil étape 4 : permettre de retirer « Repas en photo, 3 par jour » (ou le présenter comme facultatif) pour l'objectif Bien-être seul ; aligner « 2 choses par jour » avec la carte Repas 0/3 et « Encore 1 chose aujourd'hui ».
- [ ] Humeur de Pilou : ne pas passer à « De bonne humeur » juste après une note basse (2/5) ; formuler « Merci, c'est noté » plutôt qu'une humeur qui contredit la mienne.
- [ ] Données › Bien-être › Jour : la mention « Aucune lecture du visage ce jour-là » masque la note saisie (2/5 à 20:33) ; tracer le point saisi et ne parler du visage que si la source est active.
- [ ] Première page d'accueil : une phrase de bénéfice (« Découvrez ce qui joue sur votre forme et votre stress ») avant le bloc confidentialité ; le bloc « photo de selles » en tête est déroutant hors objectif digestif.
- [ ] Onboarding : fusionner Valider + Continuer sur l'écran du nom, garder « Passer » visible, et ne pas ajouter l'écran Gold après « C'est parti ! » (déjà repris en bannière sur l'Accueil).
- [ ] Votre bien-être : deux liens quasi identiques « Comment est calculé votre bien-être ? » et « Comment c'est calculé » ; n'en garder qu'un.
- [ ] Données › + : le bouton « + » remplace la mesure au lieu de l'ajouter ; libellé ou comportement à aligner.
