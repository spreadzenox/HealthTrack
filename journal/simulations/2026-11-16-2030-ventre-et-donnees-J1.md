# Simulation — Ventre et données — J1 — 2026-11-16 20:30

- **Persona** : n° 1 « Ventre et données » — SII, mal au ventre souvent, veut comprendre avec des chiffres ce qui joue sur son ventre.
- **Configuration** : n° 4 « Samsung + Galaxy Watch » (Galaxy Watch 7, poids 8 %) — reçues : pas, sommeil (durée sur 7 jours) ; je n'ai vu nulle part les phases de sommeil, la FC ni la SpO2 ; absentes (normal) : FC au repos, VFC, température.
- **Moment** : jour 1, premier lancement — Accueil : sommeil 6 h 30 (d'habitude 7 h 34), 3 857 pas (d'habitude 6 431) « d'après votre montre » ; courbe de sommeil sur 7 jours dans Données ; aucune note de bien-être ni de digestion avant les miennes.

## Tâches
1. Faire l'accueil jusqu'au bout — réussie (5 écrans : promesses de confidentialité, objectif « Confort digestif », montre « Oui », ce qui est suivi, habitudes, puis écran Gold offert).
2. Comprendre en 30 s ce que l'app fait — réussie en partie (une seule phrase « vos repas, votre sommeil… au même endroit », le reste du 1er écran parle de confidentialité ; c'est la visite guidée qui m'a fait comprendre « des pistes sur votre ventre au jour 28 »).
3. Suivre la visite guidée et vérifier qu'elle colle aux onglets — réussie (Accueil, Données, Objectifs, Agir ; mais « Ma journée », l'onglet que j'utilise le plus, n'est jamais présenté, et « Agir » n'est pas un onglet).
4. Noter un repas et ma digestion — réussie avec correction (pas d'appareil photo → « Décrire le repas » ; l'IA a transformé « pâtes à la crème, oignons, ail, une pomme, café au lait » en « Pâtes à la carbonara » ; j'ai ajouté l'oignon à la main ; digestion « Gêne » en un geste, 1/28).
5. Savoir quand l'app pourra dire ce qui joue sur mon ventre — réussie (Objectifs › Confort digestif : 28 jours notés dont 5 avec gêne ou douleur ; score dès 14 jours).
6. Trouver où voir mes données — réussie en partie (Données › Tendances, toucher « auj. » montre mon repas et ma digestion ; le « + » ne propose que « Pas », pas de courbe de digestion, de FC ni de SpO2).

## Compris
- Le calendrier des résultats est clair et chiffré : « Encore 28 jours notés… il faut aussi 5 jours avec une gêne ou une douleur : vous en avez 0 » — exactement ce que je voulais savoir — capture : `captures/2026-11-16-2030-ventre-et-donnees-J1/digestion-28-jours.png`
- L'exemple au jour 28 me montre ce que j'aurai : « Fructanes −2,6 pt sur 5 pour 1 repas riche de plus », avec barres d'incertitude. C'est le genre de chiffre que je cherche.
- Noter la digestion prend un geste, le compteur passe tout de suite à 1/28 et « Encore 27 jours » — capture : `captures/2026-11-16-2030-ventre-et-donnees-J1/digestion-notee.png`
- Sans photo, l'app propose d'elle-même « Décrire le repas » ; l'écran d'accord avant l'IA dit clairement ce qui part et ce qui ne part pas.
- Dans Données, toucher un jour affiche mes saisies (repas détaillé + digestion « Gêne »).

## Pas compris
- J'ai écrit oignons, ail, pomme et café au lait — justement ce qui me fait gonfler — et l'IA m'a rendu une carbonara avec lardons, œuf et parmesan. Si je n'avais pas relu, mes analyses seraient fausses — capture : `captures/2026-11-16-2030-ventre-et-donnees-J1/ia-carbonara.png`
- L'oignon que j'ai ajouté est marqué « Riche en fructose en excès » mais pas en fructanes, alors que les pâtes le sont : je croyais que l'oignon était LE fructane classique.
- « Ce que Halcya suit pour vous, sans rien faire » liste variabilité cardiaque et température de la peau (ma montre ne les donne pas) et Météo (je ne l'ai pas activée), juste après « Health Connect n'est pas sur ce téléphone » : alors qu'est-ce qui est vraiment suivi ? — capture : `captures/2026-11-16-2030-ventre-et-donnees-J1/suivi-auto.png`
- Dans l'exemple bien-être, la famille « Alimentation » dit « Pas de lien net pour l'instant », et juste en dessous GOS −1,1 pt et lactose −0,9 pt : il y a un lien ou pas ? Et « Essayer dans Agir » : je ne vois aucun onglet Agir en bas — capture : `captures/2026-11-16-2030-ventre-et-donnees-J1/pistes-bien-etre.png`
- GOS, FODMAP, « fructose en excès » ne sont expliqués nulle part sur l'écran.
- Dans Tendances, le « + » ne me propose que « Pas » : où sont ma digestion en courbe, mon cœur, mon oxygène, mes phases de sommeil ? — capture : `captures/2026-11-16-2030-ventre-et-donnees-J1/tendances-plus.png`
- Après avoir choisi « Gêne », aucun bouton n'apparaît sélectionné (seul le texte « Bilan du jour : Gêne » le dit) ; « Un geste suffit, l'heure est notée. Vous pouvez noter plusieurs fois par jour » : est-ce un bilan du jour ou un moment ?
- « Ma journée » affiche encore « Encore 4 choses aujourd'hui » juste après mon repas du soir.

## Constats → étapes POLISH au BACKLOG
- [ ] Repas décrit (Remplir avec l'IA) : le résultat a remplacé la description (carbonara au lieu de pâtes crème + oignon + ail + pomme + café au lait) ; afficher la description d'origine au-dessus de la liste et signaler les mots non retrouvés (« ail, pomme, café au lait non ajoutés ») pour que l'utilisateur corrige.
- [ ] Étiquettes FODMAP du repas : l'oignon cuit n'est marqué que « fructose en excès » ; vérifier la table (oignon = fructanes en premier) et ajouter un « ? » qui explique fructanes / GOS / FODMAP en une phrase.
- [ ] Accueil étape 3 « Ce que Halcya suit pour vous » : n'afficher que ce qui est réellement disponible (Météo si activée, pas de VFC/température si non reçues, mention « une fois la montre reliée » si Health Connect absent).
- [ ] Visite guidée : ajouter une étape sur l'onglet « Ma journée » (là où l'on note tout) et, pour « Agir », dire « depuis l'Accueil » puisque ce n'est pas un onglet ; changer le lien « Essayer dans Agir ».
- [ ] Objectifs › Votre bien-être (exemple) : « Alimentation — Pas de lien net » contredit les lignes GOS −1,1 pt / Lactose −0,9 pt affichées plus bas ; aligner le libellé de la famille sur le détail.
- [ ] Données › Tendances, bouton « + » : proposer aussi Digestion (Calme/Gêne/Douleur) et les mesures reçues de la montre (FC, SpO2, phases de sommeil) ; aujourd'hui seul « Pas » est proposé.
- [ ] Fenêtre « Ma digestion » : garder le choix visible (bouton « Gêne » coché) après le geste, et clarifier bilan du jour vs moment précis.
- [ ] Accueil étape 1 : une phrase d'usage avant la confidentialité (« Notez repas et digestion ; au bout de 28 jours, Halcya chiffre ce qui va avec vos jours de gêne »).
