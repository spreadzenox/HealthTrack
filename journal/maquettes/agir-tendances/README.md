# Maquette validée : « Agir et Tendances » (version 2)

- Source : https://claude.ai/artifact/7iugUf6hXM6wVx96rzmf9F (titre « Agir et Tendances »)
- Sauvegardée le 08/11 ; validée par le propriétaire.
- `maquette.html` : copie exacte du HTML (800 lignes, autonome hors polices Google). Données inventées : 30 jours passés (09/10 → 07/11, « aujourd'hui » = samedi 7 novembre) et 7 jours à venir.
- Captures : Playwright/Chromium, fenêtre 412×915, échelle 1, une capture par écran de la maquette (légende de l'écran incluse en haut).

## Captures

Versionnées depuis le 08/11 01:35 (elles étaient ignorées par `.gitignore`) : `tendances-semaine.png`, `tendances-jour.png`, `tendances-mois.png`, `agir.png`, `essai-en-cours.png`, `essai-resultat.png`, refaites depuis `maquette.html` (412 px, échelle 1, un écran par section). Les autres lignes du tableau décrivent des états à reproduire au besoin en touchant la maquette.

| Fichier | Ce qu'on voit |
|---|---|
| `tendances-semaine.png` | Journal › Tendances, vue Semaine (état par défaut) : bien-être + confort digestif, jour le plus bas (mar. 3/11) sélectionné, fiche du jour dessous. |
| `tendances-detail-jour.png` | Vue Semaine après avoir touché un autre jour passé (jeu. 5/11) : repère vertical, cercles sur les deux courbes, fiche détaillée. |
| `tendances-semaine-jour-futur.png` | Vue Semaine, jour futur touché (10/11) : fiche « attendu d'après vos habitudes » avec fourchette. |
| `tendances-semaine-bien-etre-seul.png` | Vue Semaine avec la puce « Confort digestif » désactivée (une seule courbe). |
| `tendances-jour.png` | Vue Jour d'un jour passé noté (mer. 28/10) : lectures du visage + losange de la note du soir. |
| `tendances-jour-aujourdhui.png` | Vue Jour d'aujourd'hui (en cours) : lectures jusqu'à 16 h 40, zone grisée « maintenant ». |
| `tendances-mois.png` | Vue Mois : 30 jours + 7 attendus, niveaux avant/après et repère « changement » au 20/10. |
| `tendances-mois-changement.png` | Vue Mois après avoir touché « changement » : fiche niveau avant/après et « Au même moment ». |
| `agir.png` | Onglet Agir : En cours, Mes habitudes (dont alerte d'éloignement), Proposés par vos analyses, Terminés. |
| `essai-en-cours.png` | Détail d'un essai en cours (jour 8/14, données de la montre reçues). |
| `essai-en-cours-donnees-manquantes.png` | Même écran, données de sommeil non reçues : question Oui/Non sur le coucher. |
| `essai-en-cours-debut.png` | Essai au jour 3 : pas encore assez de lendemains, pas d'écart affiché. |
| `essai-resultat.png` | Résultat d'un essai terminé : « Vérifié par votre essai », écart et fourchette, « Garder cette habitude ». |
| `en-coulisses.png` | Notes « En coulisses » : modèle commun bien-être/confort digestif, détection des changements durables. |

Absents de la maquette : le bouton « + » (ajouter une courbe) n'a aucune action ni menu ; aucun état vide n'est dessiné.

## Vue Tendances « Jour » (référence pour le code)

- **Accès** : bouton « Jour » du sélecteur Jour/Semaine/Mois (petit, dans la carte du graphique, sous les puces). Pas de navigation de date propre : la vue montre le jour **déjà sélectionné** (touché en Semaine/Mois ; par défaut le jour le plus bas des 7 derniers). Si le jour sélectionné est dans le futur, on retombe sur aujourd'hui.
- **Axe Y** : 1 à 5, lignes de grille à chaque entier, chiffres à gauche (police mono).
- **Axe X** : heures de 6 h à 24 h, graduations « 6 h, 12 h, 18 h, 24 h ».
- **Tracé** : uniquement le **bien-être** (vert). Chaque **lecture du visage** = un point plein (r 4) à son heure et sa valeur 0–5, reliés par une ligne fine verte translucide (opacité 0,4). Pas de fourchette, pas d'attendu, pas de courbe de confort digestif en vue Jour (même si la puce est active).
- **Note du soir** : si le jour a une note de bien-être, un **losange** (carré tourné de 45°, fond blanc, contour vert épais) placé à **21 h 30** à la hauteur de la note.
- **Aujourd'hui** : la partie après l'heure actuelle (16 h 40) est grisée avec l'étiquette « maintenant » en haut ; seules les lectures déjà faites apparaissent ; pas de note.
- **Légende sous le graphique** : « ● une lecture du visage » et, seulement si le jour est noté, « ◇ votre note du soir ». (Dans la maquette l'icône losange de la légende s'affiche trop grande : défaut de rendu, pas une intention.)
- **Sous la carte** : la même fiche du jour qu'en Semaine : date longue (+ « (en cours) » pour aujourd'hui) et sources (« N lectures · note x/5 ») ; bien-être x/5 en gros ; confort digestif x/5 (en orange, avec « noté « calme/gêne/douleur » » s'il y a une note) ; « Expressions du visage » (étoile à 8 expressions, jour vs trait gris de l'habitude, phrase d'écart) ; « Humeur et éveil » (carte valence × éveil, un point par lecture, moyenne, ellipse de l'habitude) ; « Ce qui a pu peser ce jour-là » (3 contributions max., barres signées en points).
- **Bouton « + »** : présent en vue Jour comme ailleurs (puce pointillée « Ajouter une courbe »), mais sans effet dans la maquette.

## Vue « Semaine » (rappel)

10 jours : 6 jours passés + aujourd'hui + 3 jours à venir. Pour chaque courbe active (bien-être vert, confort digestif orange) : ligne quotidienne, bande de fourchette, points sur les jours notés ; le futur est grisé après le repère « auj. » et prolongé en pointillés (« attendu d'après vos habitudes ») avec fourchette qui s'élargit. Dates en bas : premier jour, aujourd'hui, dernier. Toucher un jour (zone sur toute la hauteur) pose un trait vertical et des cercles sur les courbes, et remplit la fiche dessous (jour futur : valeur attendue et fourchette). Au moins une courbe reste toujours active.
