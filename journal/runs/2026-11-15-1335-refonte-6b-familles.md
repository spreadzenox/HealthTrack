# Run 15/11 13:35 — Refonte « Compagnon », étape 6b : les liens par famille

**Type** : code (refonte « Compagnon », étape 6 du § 10 du brief, deuxième partie)  ·  **Android** : main 06ae67b
(#1013, v1088) au début  ·  **TestFlight** : aucun relevé à ce run (dernier connu : 11:39, 1072.1073 en test)  ·
**Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Lus en entier : les quatre fichiers d'instructions,
  le brief de la refonte, le compte rendu de 12:35, la préparation `ETAPE-6-OBJECTIFS.md`, les § 6 et § 7 de
  `specs/comprendre.SPEC.md`. Du résumé de la semaine, seul le début a été lu.
- Main 06ae67b : Tests, Build & Release (v741) et Play — AAB verts ; l'émulateur de main tournait encore.
- Une PR de la routine ouverte : **#1014** (suivi iPhone de 6a, ouverte à 13:28 par le run de 12:35, build macOS en
  cours). Elle ne touche que `iphone/` et le journal ; ce run n'a touché à aucun de ses fichiers de code. #51 non
  touchée.

## Fait
1. **Étape 6b sur Android** (découpage de la préparation, § 5) :
   - `services/influenceFamilies.js` (pur, sur le contrat de la méthode, aucune statistique nouvelle) : les liens
     nets des délais prêts, rangés par famille. Sommeil (avec « Écran tard le soir », comme la SPEC § 6.5),
     Alimentation et Activité sont toujours montrées ; Habitudes (miel) et Écrans (gris : temps d'écran, réseaux
     sociaux) ne s'ajoutent qu'avec un lien net. Le corps et la météo restent dans « À regarder, pas à changer ».
     Niveau d'une famille : son lien net le plus fort, en points sur 5 pour une variation habituelle (moins de
     0,25 : faible ; de 0,25 à 0,5 : moyen ; 0,5 et plus : fort). La famille la plus forte vient en premier.
   - `pages/Recommendations.jsx` et `.css` : bloc « Par famille » en tête des résultats du détail d'un objectif
     (bien-être et confort digestif) : une carte par famille à la couleur de son thème, trois points et « Lien
     fort », « Lien moyen » ou « Lien faible » ; sous le nom, le facteur qui porte le lien s'il diffère du nom de
     la famille ; sans lien net, carte neutre « Pas de lien net pour l'instant » ; sans facteur comparé, « Pas
     assez de données ». Non montré tant que les pistes sont floutées (version Play sans abonnement).
   - « Comment est calculé votre bien-être ? » (SPEC § 6.4) : un lien replié en bas du détail du bien-être,
     au-dessus de « Comment c'est calculé » : « Deux sources, réunies chaque jour : votre note et la lecture du
     visage, si vous l'utilisez. Un jour sans note ni lecture, Halcya l'estime d'après les jours voisins. »
   - note de Nouveautés `2026-11-15-1335-objectifs-familles.json` (les deux magasins).
2. Journal : résumé, `BACKLOG.md`, `PRODUIT.md`. La ligne du tableau des runs, `PARITE.md` et le `BACKLOG.md` de
   l'iPhone attendent le merge de #1014, qui modifie les lignes voisines (voir « Fin de run »).

## Vérifs
- `app/` : `npm run test` 3677 verts, 44 ignorés ; `npm run lint` sans erreur ; `npm run build` ; `npm run visual`
  complet (20 pages) sans erreur, lancé avant l'ajout de la règle CSS qui rapproche les deux liens du bas ; ensuite
  seule `/recommendations/bien-etre` a été recapturée (sombre).
- Tests : ceux du service (6 cas) écrits dans la même commande que le service, donc jamais vus rouges ; ceux de
  l'écran (4 cas) écrits avec l'écran.
- Captures regardées (Android, 412 px, données de démo) : détail du bien-être, haut de page, clair et sombre (une
  famille avec un lien faible, deux sans lien net) ; bas de page, clair et sombre (les deux liens « Comment… ») ;
  détail du confort digestif avant les résultats (inchangé, pas de familles).
- iPhone : `git apply --check` du correctif 50 (seul à toucher `Recommendations.css`) passe.

## Écarts et choix (dits au propriétaire dans le résumé)
- Titre « Par famille » et niveaux « Lien fort / moyen / faible », au lieu de « Ce qui influence votre bien-être »
  et « Influence forte » de la SPEC : la règle 5 demande des mots qui ne confondent pas lien et cause.
- « Ce sont des pistes, pas des causes. » non affichée (SLOP-1 la refuse hors « Comment c'est calculé »).
- Deux lignes de plus que la maquette quand elles ont un lien net : Habitudes et Écrans.
- Pas de moyenne par famille (« 7 h 05 par nuit », « 19 repas », « 8 400 pas par jour »).
- La fiche est un texte replié, pas une feuille du bas ; sans les deux cartes illustrées ni la barre.

## Limites
- Les seuils 0,25 et 0,5 sont des repères d'affichage choisis par ce run, pas des tests ; « Lien faible » peut
  qualifier un lien net de 0,05 point.
- Les cartes des familles ne s'ouvrent pas (le détail d'une famille est l'étape 6c) ; sur les données de démo, la
  carte Sommeil et la piste Sommeil se suivent et disent presque la même chose.
- « Comment est calculé votre bien-être ? » et « Comment c'est calculé » se suivent : deux libellés proches.
- États jamais capturés : trois niveaux différents côte à côte, une ligne Habitudes ou Écrans, « Pas assez de
  données », le confort digestif avec des résultats, le lien déplié. La version Play sans abonnement (bloc masqué)
  n'a ni test ni capture.
- Captures non regardées : 320 px, grand texte, les 19 autres pages du passage complet (lancé pour ses erreurs).
- Pas de Pilou, pas de galets, aucune animation.
- iPhone : rien d'embarqué à ce run pour 6b.
- Non relus : la charte, `PRODUIT.md`, `DESIGN.md`, `INFRA.md`, les deux `BACKLOG.md`, `PARITE.md`,
  `iphone/README.md`, `iphone/journal/README.md`.
- Pas de simulation de personas, pas de relevé TestFlight.

## Suite
- REFONTE-6b-iOS (embarquer, regarder le détail du bien-être sur simulateur), puis 6c (détail d'une famille et
  défi doux) ; 6d demande d'abord le banc à n = 7 et 14.

## Fin de run
