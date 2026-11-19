# Simulation — Prendre soin de soi, maigrir — J45 — 2026-11-19 20:30

- **Persona** : n° 6 « Prendre soin de soi, maigrir » — femme de 41 ans, veut perdre quelques kilos et manger mieux ; cherche poids, repas, activité, motivation. Peu technique, pressée le soir.
- **Configuration** : n° 5 « Téléphone + balance connectée » (Android + balance Withings via Health Connect, poids 4 %) — reçoit pas, calories, pesées ; absents : sommeil mesuré, fréquence cardiaque (pas de montre).
- **Moment** : jour 45, première ouverture après la mise à jour « Compagnon » — Accueil : bandeau « Nouveau : Nouveaux onglets… et 63 autres changements », bien-être 3/5 (4 lectures du visage), essai « Dormir au moins 7 h 30 » jour 4 sur 10, pas 3 858 (habitude 6 756) ; poids 77,2 kg (Withings, 16/11) visible seulement dans Données › Nutrition › Votre profil ; 10 repas sur les 7 derniers jours.

## Tâches
1. Comprendre ce qui a changé — réussie à moitié : le bandeau « Voir » mène à Nouveautés, la 1re note explique les 4 onglets, mais elle dit « Agir s'ouvre depuis le bas de l'Accueil » et je n'ai rien trouvé de tel en bas de l'Accueil.
2. Voir l'évolution de mon poids sur 45 jours — ratée : pas de poids sur l'Accueil, pas de « Poids » dans le « + » de Tendances (seulement Confort digestif, Pas), « Mois » = 30 jours ; je n'ai trouvé qu'un chiffre isolé, 77,2 kg, dans Nutrition › Votre profil.
3. Noter mon repas du soir — réussie : Ma journée › Soir › « Décrire le repas » › « Remplir avec l'IA » › Enregistrer ; la case Soir est cochée en retour. Mais pendant la saisie, l'onglet allumé passe à « Données ».
4. Savoir si mon essai existe toujours et où — réussie par hasard : carte « Dormir au moins 7 h 30 » sur l'Accueil ; il n'apparaît ni sur Objectifs ni sur « Votre bien-être », alors que la page de l'essai allume l'onglet Objectifs et renvoie vers « ← Votre bien-être ».
5. Savoir ce qui va avec mes bons jours — abandonnée : Objectifs › « Ce qui va avec votre bien-être » dit « pas assez net » partout, sommeil « Pas assez de données » ; le détail d'un jour dans Tendances parle de Mépris 4 %, Dégoût 2 %, « +0,05 pt » : je décroche.
6. Savoir quoi faire ensuite pour ma motivation (objectif poids) — ratée : « Vos objectifs » dans les Paramètres ne propose que Bien-être et Confort digestif ; « Suivre une habitude » ouvre les Paramètres tout en haut (thème Clair/Sombre), il faut descendre pour trouver les habitudes.

## Compris
- Les 4 nouveaux onglets et le rôle de chacun, grâce à la note « Nouveaux onglets » en tête de Nouveautés — capture : `captures/2026-11-19-2030-prendre-soin-maj-J45/accueil-sans-poids.png`
- Mon essai continue (jour 4 sur 10) et je comprends qu'on me posera une question le lendemain si l'app ne mesure pas mon sommeil (« Ce qui est mesuré ») — capture : `captures/2026-11-19-2030-prendre-soin-maj-J45/essai-sommeil.png`
- Noter le repas du soir est rapide ; « Refaire un repas » avec mes plats habituels, c'est pratique — capture : `captures/2026-11-19-2030-prendre-soin-maj-J45/repas-onglet-donnees.png`

## Pas compris
- « Je veux juste voir si j'ai perdu depuis septembre : ma balance envoie tout, et je ne trouve ma courbe de poids nulle part. » — capture : `captures/2026-11-19-2030-prendre-soin-maj-J45/tendances-pas-de-poids.png`
- « On me dit que mon essai est dans Objectifs, mais sur Objectifs il n'y a qu'une note sur 5. Et l'essai porte sur le sommeil alors que la même app me dit "Sommeil : pas assez de données". » — capture : `captures/2026-11-19-2030-prendre-soin-maj-J45/bien-etre-sans-essai.png`
- « J'ai touché "Suivre une habitude" et je tombe sur le choix du thème sombre : je me suis trompée de bouton ? » — capture : `captures/2026-11-19-2030-prendre-soin-maj-J45/habitude-vers-parametres.png`
- « 3/5 sur l'Accueil, 3,1/5 sur Objectifs : c'est lequel ? » (aujourd'hui contre moyenne de 7 jours, mais rien ne le dit sur l'Accueil.)
- « Nouveautés dit qu'Agir est en bas de l'Accueil : je ne vois rien en bas, à part "Ajouter un appareil". »
- « Version installée : 0.0.0 » et « 63 autres changements » : ça fait peur plus que ça n'aide.

## Constats → étapes POLISH au BACKLOG
- [ ] Poids absent du parcours : ajouter une série « Poids » au « + » de Tendances quand des pesées existent (Withings / Health Connect), et une carte Poids dans « Vos données du jour » de l'Accueil (dernière pesée + écart sur 30 jours).
- [ ] Essai introuvable depuis Objectifs : lister l'essai en cours (carte « Essai · jour 4 sur 10 ») sur Objectifs et sur « Votre bien-être », puisque la page de l'essai allume l'onglet Objectifs et que son lien retour pointe vers « Votre bien-être ».
- [ ] Note Nouveautés « Agir s'ouvre depuis le bas de l'Accueil » : rien de visible en bas de l'Accueil ; corriger le texte (« votre essai est sur l'Accueil ») ou ajouter le lien promis.
- [ ] Contradiction essai sommeil / « Sommeil : Pas assez de données » sans montre : sur la carte d'essai, dire « on vous demandera demain si vous avez tenu » ; sur Votre bien-être, éviter « pas assez de données » quand un essai sommeil est en cours.
- [ ] « Suivre une habitude » (Ma journée) ouvre Paramètres tout en haut : faire défiler directement jusqu'à « Vos habitudes » (ancre).
- [ ] Objectif poids/perte de kilos absent de « Vos objectifs » (Bien-être, Confort digestif seulement) : pour une utilisatrice qui a une balance, proposer au moins « Poids » comme objectif suivi.
- [ ] Saisie d'un repas depuis Ma journée : la barre du bas allume « Données » ; garder « Ma journée » allumé.
- [ ] Accueil 3/5 contre Objectifs 3,1/5 : écrire « aujourd'hui » et « moyenne 7 jours » à côté des chiffres.
- [ ] Bandeau Nouveautés : « et 63 autres changements » et « Version installée : 0.0.0 » inquiètent ; dire « + d'autres améliorations » et masquer la version si elle vaut 0.0.0.
- [ ] Détail d'un jour (Tendances) : Mépris %, Dégoût %, « +0,05 pt » trop techniques ; replier sous « Détails ».
